const axios = require('axios');
// Removed: const {RouteOptimizationClient} = require('@googlemaps/routeoptimization').v1;
// This client is for the Google Cloud Route Optimization API, which is NOT what we need for this use case.

const Routes = require('../models/route/Routes');
const RouteTickets = require('../models/route/RouteTickets');
const Tickets = require('../models/ticket-logic/Tickets');
const db = require('../config/db'); // Assuming this correctly imports your database connection
const LocationClusteringService = require('./LocationClusteringService');

class RouteOptimizationService {
    constructor() {
        // Use OSRM for routing instead of Google Maps
        this.osrmBaseUrl = process.env.OSRM_BASE_URL || 'http://osrm:5000';
        // Use VROOM for waypoint optimization
        this.vroomBaseUrl = process.env.VROOM_BASE_URL || 'http://vroom:3000';
        // Keep Google Maps for geocoding (address to coordinates)
        this.geocodingApiUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
        this.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
        this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'burguer-menu-fbb80';

        if (!this.googleMapsApiKey) {
            console.warn('GOOGLE_MAPS_API_KEY not found in environment variables');
        }
    }

    /**
     * Standardized error handler for consistent error responses
     * @param {Error} error - The error object
     * @param {string} context - Context where the error occurred
     * @param {Object} additionalData - Additional data to include in error
     * @returns {Object} - Standardized error object
     */
    handleError(error, context, additionalData = {}) {
        const errorMessage = error.message || 'Unknown error occurred';
        const errorDetails = {
            message: errorMessage,
            context: context,
            timestamp: new Date().toISOString(),
            ...additionalData
        };

        console.error(`[${context}] Error:`, errorMessage, additionalData);
        
        // Return standardized error object
        return {
            success: false,
            error: errorMessage,
            details: errorDetails
        };
    }

    /**
     * Standardized success response handler
     * @param {Object} data - The data to return
     * @param {string} message - Success message
     * @param {Object} additionalData - Additional data to include
     * @returns {Object} - Standardized success object
     */
    handleSuccess(data, message, additionalData = {}) {
        return {
            success: true,
            message: message,
            data: data,
            timestamp: new Date().toISOString(),
            ...additionalData
        };
    }

    /**
     * Geocodes an address string into LatLng coordinates and a placeId.
     * This is a utility method used internally to convert addresses for the Routes API.
     * @param {string} address - The human-readable address to geocode.
     * @returns {Promise<{address: string, latitude: number, longitude: number, placeId: string}>} - Geocoded location data.
     * @throws {Error} If geocoding fails or no results are found.
     */
    async geocodeAddress(address) {
        if (!address) {
            throw new Error('Address is required for geocoding.');
        }

        try {
            const response = await axios.get(
                this.geocodingApiUrl,
                {
                    params: {
                        address: address,
                        key: this.googleMapsApiKey // Using the same API key for Geocoding
                    }
                }
            );

            if (response.data.status === 'OK' && response.data.results.length > 0) {
                const location = response.data.results[0].geometry.location;
                return {
                    address: address, // Keep original address for reference
                    latitude: location.lat,
                    longitude: location.lng,
                    placeId: response.data.results[0].place_id // Useful for other Maps API calls
                };
            } else {
                throw new Error(`Geocoding failed for address: "${address}" - Status: ${response.data.status} - ${response.data.error_message || 'No results'}`);
            }
        } catch (error) {
            console.error('Geocoding API error:', error.response?.data || error.message);
            throw new Error(`Failed to geocode address: ${address}. Details: ${error.message}`);
        }
    }

    /**
     * Optimizes a single route for one vehicle using OSRM for routing and Google Maps for geocoding.
     * This method handles the full process: geocoding addresses, calling OSRM for optimization,
     * and parsing the relevant response data including the encoded polyline and optimized waypoint order.
     *
     * @param {string} originAddress - The starting address (e.g., your business location).
     * @param {string} destinationAddress - The ending address (can be the same as origin for a round trip).
     * @param {Array<string>} intermediateAddresses - An array of addresses for the stops to be optimized.
     * @returns {Promise<Object>} - An object containing the encoded polyline, optimized order, total distance, and total duration.
     * @throws {Error} If the API key is missing, waypoint limit is exceeded, geocoding fails, or route optimization fails.
     */
    async optimizeRoute(originAddress, destinationAddress, intermediateAddresses) {
        if (!this.googleMapsApiKey) {
            throw new Error('API Key is not configured for RouteOptimizationService. Please set GOOGLE_MAPS_API_KEY for geocoding.');
        }

        // OSRM supports up to 100 waypoints per request
        if (intermediateAddresses.length > 100) {
            throw new Error(`Waypoint limit exceeded: OSRM supports a maximum of 100 intermediate waypoints for optimization. You provided ${intermediateAddresses.length}.`);
        }

        console.log(`Starting VROOM route optimization process for ${intermediateAddresses.length} intermediate stops.`);

        // --- STEP 1: Geocode all addresses (origin and intermediates) ---
        // Only geocode origin and intermediates (no destination)
        const [originGeo, ...geocodedIntermediates] = await Promise.all([
            this.geocodeAddress(originAddress),
            ...intermediateAddresses.map(address => this.geocodeAddress(address))
        ]);

        // --- STEP 2: Use VROOM for waypoint optimization ---
        try {
            console.log('Calling VROOM for waypoint optimization...');
            // Prepare VROOM request (minimal structure)
            const vroomRequest = {
                vehicles: [
                    {
                        id: 1,
                        start: [originGeo.longitude, originGeo.latitude]
                    }
                ],
                jobs: geocodedIntermediates.map((geo, index) => ({
                    id: index + 1,
                    location: [geo.longitude, geo.latitude]
                }))
            };

            console.log('VROOM request:', JSON.stringify(vroomRequest, null, 2));

            // Call VROOM API with multiple algorithms
            const vroomResponse = await this.tryMultipleVroomAlgorithms(vroomRequest);

            console.log('VROOM response received with best algorithm');

            if (vroomResponse.code !== 0) {
                throw new Error(`VROOM optimization failed: ${vroomResponse.error || 'Unknown error'}`);
            }

            // Extract optimized order from VROOM response
            const vroomRoute = vroomResponse.data.routes[0];
            const optimizedOrder = vroomRoute.steps
                .filter(step => step.type === 'job')
                .map(step => step.job - 1); // VROOM job IDs are 1-based, convert to 0-based

            console.log('VROOM optimized order:', optimizedOrder);

            // --- STEP 3: Build coordinates string for OSRM with optimized order ---
            // Only use origin and jobs (no destination)
            const optimizedCoordinates = [
                `${originGeo.longitude},${originGeo.latitude}`,
                ...optimizedOrder.map(index => {
                    const geo = geocodedIntermediates[index];
                    return `${geo.longitude},${geo.latitude}`;
                })
            ];
            const coordinatesString = optimizedCoordinates.join(';');
            console.log(`OSRM coordinates string (optimized): ${coordinatesString}`);

            // --- STEP 4: Call OSRM for route calculation with optimized waypoints ---
            console.log('Calling OSRM for route calculation with optimized waypoints...');
            const osrmUrl = `${this.osrmBaseUrl}/route/v1/driving/${coordinatesString}?overview=full&steps=true&annotations=true&alternatives=true&continue_straight=true&geometries=polyline`;
            const osrmResponse = await axios.get(osrmUrl);

            if (!osrmResponse.data.routes || osrmResponse.data.routes.length === 0) {
                throw new Error('No routes found in OSRM response. This might happen if locations are unreachable or too far apart.');
            }

            const route = osrmResponse.data.routes[0];
            console.log('OSRM route calculation successful. Total distance:', route.distance, 'meters.');

            return {
                encodedPolyline: route.geometry, // OSRM returns polyline-encoded geometry
                optimizedOrder: optimizedOrder, // VROOM-optimized order
                totalDistance: route.distance, // OSRM returns distance in meters
                totalDuration: route.duration, // OSRM returns duration in seconds
                apiResponse: {
                    vroom: vroomResponse.data,
                    osrm: osrmResponse.data
                } // Store both API responses for debugging/metadata
            };

        } catch (error) {
            console.error('Route optimization error:', error.response?.data || error.message);
            // Fallback to sequential order if VROOM fails
            console.log('Falling back to sequential order due to optimization error');
            const fallbackOrder = Array.from({ length: intermediateAddresses.length }, (_, i) => i);
            // Build coordinates string for OSRM with fallback order
            const fallbackCoordinates = [
                `${originGeo.longitude},${originGeo.latitude}`,
                ...geocodedIntermediates.map(geo => `${geo.longitude},${geo.latitude}`)
            ];
            const coordinatesString = fallbackCoordinates.join(';');
            const osrmUrl = `${this.osrmBaseUrl}/route/v1/driving/${coordinatesString}?overview=full&steps=true&annotations=true`;
            const osrmResponse = await axios.get(osrmUrl);
            const route = osrmResponse.data.routes[0];
            return {
                encodedPolyline: route.geometry,
                optimizedOrder: fallbackOrder,
                totalDistance: route.distance,
                totalDuration: route.duration,
                apiResponse: { osrm: osrmResponse.data },
                optimizationNote: 'Used fallback sequential order due to VROOM error'
            };
        }
    }

    /**
     * Optimizes routes for large numbers of locations by clustering them into groups of maximum 25 locations each.
     * This method uses PostGIS spatial clustering to group nearby locations and then optimizes each cluster separately.
     * 
     * @param {Array<number>} ticketIds - Array of ticket IDs to optimize
     * @param {string} routeCode - Base route code (will be appended with cluster number)
     * @param {string} type - Route type (SPOTTER, CONCRETE, ASPHALT, default)
     * @param {string} originAddress - Starting address
     * @param {string} destinationAddress - Ending address (can be same as origin)
     * @param {Date} startDate - Route start date (optional, defaults to current date)
     * @param {Date} endDate - Route end date (optional, defaults to current date)
     * @param {number} createdBy - User ID
     * @param {Object} options - Additional options including maxDistance for clustering
     * @returns {Promise<Object>} - Standardized response with multiple route data and metadata
     */
    async optimizeRouteWithClustering(ticketIds, routeCode, type, originAddress, destinationAddress, startDate, endDate, createdBy = 1, options = {}) {
        try {
            // Input validation
            if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
                throw new Error('ticketIds array is required and must not be empty');
            }

            if (!originAddress || !destinationAddress) {
                throw new Error('originAddress and destinationAddress are required');
            }

            const { maxDistance = 30000, maxLocationsPerCluster = 100, minLocationsPerCluster = 50 } = options;

            console.log(`Starting location-based clustered route optimization for ${ticketIds.length} tickets`);
            console.log(`Clustering by unique locations (max ${maxLocationsPerCluster} locations per cluster - OSRM limit)`);

            // Step 1: Get all ticket addresses in one database query (reuse from parent method)
            const ticketsWithAddresses = await this.getTicketsWithAddressesBatch(ticketIds, {
                autoSuggest: false, // Disable auto-suggest for clustering to avoid double geocoding
                minConfidence: 0.8
            });
            
            if (ticketsWithAddresses.length === 0) {
                throw new Error('No valid tickets found for clustering');
            }

            // Step 2: Cluster by unique locations using PostGIS (max 25 unique locations per cluster)
            const clusteringService = new LocationClusteringService();
            const clusters = await clusteringService.clusterLocations(ticketsWithAddresses, { 
                maxDistance,
                maxLocationsPerCluster,
                minLocationsPerCluster
            });
            
            console.log(`Created ${clusters.length} location-based clusters for optimization`);
            console.log(`Each cluster contains max ${maxLocationsPerCluster} unique locations with all their associated tickets (OSRM limit)`);

            // Step 2: Optimize each cluster separately
            const optimizedRoutes = [];
            const errors = [];
            
            console.log(`=== CLUSTER OPTIMIZATION START ===`);
            console.log(`Total clusters to process: ${clusters.length}`);

            for (let i = 0; i < clusters.length; i++) {
                const cluster = clusters[i];
                const clusterRouteCode = `${routeCode}-CLUSTER-${i + 1}`;
                
                console.log(`\n--- Processing Location Cluster ${i + 1}/${clusters.length} ---`);
                console.log(`Cluster ID: ${cluster.clusterId}`);
                console.log(`Route Code: ${clusterRouteCode}`);
                console.log(`Unique locations in cluster: ${cluster.addressCount}`);
                console.log(`Total tickets in cluster: ${cluster.tickets.length}`);
                console.log(`Cluster center: ${cluster.centerLat}, ${cluster.centerLng}`);
                
                try {
                    console.log(`Optimizing cluster ${i + 1}/${clusters.length} with ${cluster.tickets.length} tickets (${cluster.uniqueAddresses.length} unique addresses)`);
                    
                    // Use tickets directly from the cluster
                    const clusterTickets = cluster.tickets;
                    
                    if (clusterTickets.length === 0) {
                        console.warn(`❌ CLUSTER SKIPPED: No valid tickets found for cluster ${i + 1} (${clusterRouteCode})`);
                        console.warn(`   Cluster ID: ${cluster.clusterId}`);
                        console.warn(`   This cluster will be unassigned!`);
                        continue;
                    }

                    // Use unique addresses for optimization (already provided by clustering service)
                    const uniqueAddresses = cluster.uniqueAddresses.filter(addr => addr && addr.trim() !== '');
                    
                    if (uniqueAddresses.length === 0) {
                        console.warn(`❌ CLUSTER SKIPPED: No valid addresses found for cluster ${i + 1} (${clusterRouteCode})`);
                        console.warn(`   Cluster ID: ${cluster.clusterId}`);
                        console.warn(`   Ticket count: ${clusterTickets.length}`);
                        console.warn(`   This cluster will be unassigned!`);
                        continue;
                    }
                    
                    // Optimize this cluster using only unique addresses
                    const optimizedRouteResult = await this.optimizeRoute(
                        originAddress,
                        destinationAddress,
                        uniqueAddresses
                    );

                    // Map optimized order back to all tickets in this cluster
                    let optimizedOrder = optimizedRouteResult.optimizedOrder || [];
                    
                    // If there's only one address and no optimized order, create a default order
                    if (uniqueAddresses.length === 1 && optimizedOrder.length === 0) {
                        optimizedOrder = [0];
                    }
                    
                    // Validate that optimizedOrder has valid indices
                    if (optimizedOrder.length !== uniqueAddresses.length) {
                        console.warn(`Optimized order length (${optimizedOrder.length}) doesn't match unique addresses length (${uniqueAddresses.length}), using sequential order`);
                        optimizedOrder = Array.from({ length: uniqueAddresses.length }, (_, i) => i);
                    }

                    // Create address to tickets mapping for this cluster
                    const addressToTicketsMap = new Map();
                    for (const ticket of clusterTickets) {
                        const address = ticket.address;
                        if (!addressToTicketsMap.has(address)) {
                            addressToTicketsMap.set(address, []);
                        }
                        addressToTicketsMap.get(address).push(ticket);
                    }

                    // Filter uniqueAddresses to only include addresses that have tickets
                    const addressesWithTickets = uniqueAddresses.filter(address => 
                        addressToTicketsMap.has(address) && addressToTicketsMap.get(address).length > 0
                    );
                    
                    console.log(`Original unique addresses: ${uniqueAddresses.length}, addresses with tickets: ${addressesWithTickets.length}`);

                    // Create final ticket order with queue positions based on optimized order
                    const reorderedTickets = [];
                    let globalQueuePosition = 0; // Start from 0 as requested

                    // Process addresses in optimized order, but only those with tickets
                    console.log(`=== QUEUE ASSIGNMENT DEBUG ===`);
                    console.log(`Total addresses in optimized order: ${optimizedOrder.length}`);
                    console.log(`Total unique addresses: ${uniqueAddresses.length}`);
                    console.log(`Addresses with tickets: ${addressesWithTickets.length}`);
                    console.log(`Starting queue position: ${globalQueuePosition}`);
                    
                    for (let addressIndex = 0; addressIndex < optimizedOrder.length; addressIndex++) {
                        const originalAddressIndex = optimizedOrder[addressIndex];
                        
                        // Validate that originalAddressIndex is within bounds
                        if (originalAddressIndex < 0 || originalAddressIndex >= uniqueAddresses.length) {
                            console.warn(`Invalid optimizedOrder index: ${originalAddressIndex}, skipping`);
                            continue;
                        }
                        
                        const address = uniqueAddresses[originalAddressIndex];
                        const ticketsAtThisAddress = addressToTicketsMap.get(address);
                        
                        console.log(`Processing address ${addressIndex + 1}/${optimizedOrder.length}: "${address}"`);
                        console.log(`  - Has tickets: ${ticketsAtThisAddress ? 'YES' : 'NO'}`);
                        console.log(`  - Ticket count: ${ticketsAtThisAddress ? ticketsAtThisAddress.length : 0}`);
                        console.log(`  - Current queue position: ${globalQueuePosition}`);
                        
                        // Check if tickets exist for this address
                        if (ticketsAtThisAddress && Array.isArray(ticketsAtThisAddress) && ticketsAtThisAddress.length > 0) {
                            // Assign sequential queue positions to all tickets at this address
                            for (const ticket of ticketsAtThisAddress) {
                                reorderedTickets.push({
                                    ...ticket,
                                    queue: globalQueuePosition++
                                });
                            }
                            console.log(`  ✓ Assigned queue positions ${globalQueuePosition - ticketsAtThisAddress.length} to ${globalQueuePosition - 1} for address: ${address}`);
                        } else {
                            console.warn(`  ✗ No tickets found for address: ${address} - skipping queue position assignment`);
                            console.log(`  - Queue position remains: ${globalQueuePosition} (not incremented)`);
                        }
                    }
                    
                    console.log(`=== QUEUE ASSIGNMENT SUMMARY ===`);
                    console.log(`Final queue position: ${globalQueuePosition}`);
                    console.log(`Total tickets assigned: ${reorderedTickets.length}`);
                    console.log(`Queue numbers used: ${reorderedTickets.map(t => t.queue).join(', ')}`);

                    // Create route data for this cluster
                    const routeData = {
                        routeCode: clusterRouteCode,
                        type: type || 'default',
                        startDate: startDate || new Date(),
                        endDate: endDate || null, // Set to null for new routes (active routes)
                        encodedPolyline: optimizedRouteResult.encodedPolyline,
                        totalDistance: optimizedRouteResult.totalDistance,
                        totalDuration: optimizedRouteResult.totalDuration,
                        optimizedOrder: JSON.stringify(optimizedRouteResult.optimizedOrder),
                        optimizationMetadata: JSON.stringify({
                            optimizationDate: new Date().toISOString(),
                            totalWaypoints: uniqueAddresses.length,
                            totalTickets: reorderedTickets.length,
                            originAddress,
                            destinationAddress,
                            method: 'clustered_optimization',
                            clusterId: cluster.clusterId,
                            clusterCenter: {
                                latitude: cluster.centerLat,
                                longitude: cluster.centerLng
                            },
                            maxDistance: maxDistance,
                            apiCallsUsed: 1
                        }),
                        tickets: reorderedTickets
                    };

                    // Save this cluster route
                    const savedRoute = await this.saveOptimizedRoute(routeData, createdBy);
                    
                    optimizedRoutes.push({
                        clusterId: cluster.clusterId,
                        routeId: savedRoute.routeid,
                        routeCode: savedRoute.routecode,
                        totalDistance: savedRoute.totaldistance,
                        totalDuration: savedRoute.totalduration,
                        ticketCount: reorderedTickets.length,
                        centerLat: cluster.centerLat,
                        centerLng: cluster.centerLng
                    });

                } catch (error) {
                    console.error(`Error optimizing cluster ${i + 1}:`, error);
                    errors.push({
                        clusterId: cluster.clusterId,
                        error: error.message,
                        ticketCount: cluster.tickets.length
                    });
                }
            }

            // Step 3: Prepare response
            const totalDistance = optimizedRoutes.reduce((sum, route) => sum + route.totalDistance, 0);
            const totalDuration = optimizedRoutes.reduce((sum, route) => sum + route.totalDuration, 0);
            const totalTickets = optimizedRoutes.reduce((sum, route) => sum + route.ticketCount, 0);

            const responseData = {
                success: true,
                message: `Successfully optimized ${optimizedRoutes.length} clusters with ${totalTickets} total tickets`,
                data: {
                    baseRouteCode: routeCode,
                    totalClusters: clusters.length,
                    optimizedRoutes: optimizedRoutes.length,
                    totalDistance,
                    totalDuration,
                    totalTickets,
                    clusters: clusters.map(cluster => ({
                        clusterId: cluster.clusterId,
                        ticketCount: cluster.tickets.length,
                        centerLat: cluster.centerLat,
                        centerLng: cluster.centerLng
                    })),
                    errors: errors.length > 0 ? errors : undefined
                },
                metadata: {
                    optimizationDate: new Date().toISOString(),
                    method: 'clustered_optimization',
                    maxDistance,
                    apiCallsUsed: optimizedRoutes.length
                }
            };

            if (errors.length > 0) {
                responseData.warnings = `${errors.length} clusters failed to optimize`;
            }

            return responseData;

        } catch (error) {
            console.error('Clustered route optimization failed:', error);
            return this.handleError(error, 'clustered_route_optimization', {
                ticketCount: ticketIds.length,
                routeCode,
                type
            });
        }
    }

    /**
     * Saves the optimized route data and associated tickets to the database.
     * This method assumes your `Routes` and `RouteTickets` models are correctly implemented.
     * @param {Object} routeData - The processed route data including polyline, order, etc.
     * @param {number} createdBy - The ID of the user creating the route.
     * @returns {Promise<Object>} - The created route object from the database.
     */
    async saveOptimizedRoute(routeData, createdBy = 1) {
        try {
            // 1. Create the main route entry
            const route = await Routes.create(
                routeData.routeCode,
                routeData.type,
                routeData.startDate,
                routeData.endDate,
                routeData.encodedPolyline,
                routeData.totalDistance,
                routeData.totalDuration,
                JSON.stringify(routeData.optimizedOrder),
                JSON.stringify(routeData.optimizationMetadata),
                createdBy,
                createdBy
            );

            // 2. Create route tickets with their optimized order
            if (routeData.tickets && routeData.tickets.length > 0) {
                const routeTickets = routeData.tickets.map(ticket => ({
                    routeId: route.routeid,
                    ticketId: ticket.ticketid, // Use lowercase ticketid from database
                    address: ticket.address, // Store the address string for the ticket
                    queue: ticket.queue, // Use the already calculated optimized queue position
                    createdBy: createdBy,
                    updatedBy: createdBy
                }));

                console.log('Creating route tickets:', routeTickets);
                await RouteTickets.createBatch(routeTickets);
            }

            return route;
        } catch (error) {
            console.error('Failed to save optimized route to database:', error);
            throw error;
        }
    }

    /**
     * MAIN CONSOLIDATED ROUTE OPTIMIZATION METHOD
     * This is the single, unified method for optimizing routes with tickets.
     * Replaces both optimizeAndSaveRoute and optimizeRouteSingle methods.
     * 
     * @param {Array<number>} ticketIds - Array of ticket IDs to optimize
     * @param {string} routeCode - Unique route identifier (optional, will be generated if not provided)
     * @param {string} type - Route type (SPOTTER, CONCRETE, ASPHALT, default)
     * @param {string} originAddress - Starting address
     * @param {string} destinationAddress - Ending address (can be same as origin)
     * @param {Date} startDate - Route start date (optional, defaults to current date)
     * @param {Date} endDate - Route end date (optional, defaults to current date)
     * @param {number} createdBy - User ID
     * @param {Object} options - Additional options including autoSuggestAddresses, suggestionConfidence
     * @returns {Promise<Object>} - Standardized response with route data and metadata
     */
    async optimizeRouteWithTickets(ticketIds, routeCode, type, originAddress, destinationAddress, startDate, endDate, createdBy = 1, options = {}) {
        try {
            // Input validation
            if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
                throw new Error('ticketIds array is required and must not be empty');
            }

            if (!originAddress || !destinationAddress) {
                throw new Error('originAddress and destinationAddress are required');
            }

            const { autoSuggestAddresses = true, suggestionConfidence = 0.8 } = options;

            console.log(`Starting route optimization for ${ticketIds.length} tickets`);

            // Step 1: Get all ticket addresses in one database query
            const ticketsWithAddresses = await this.getTicketsWithAddressesBatch(ticketIds, {
                autoSuggest: autoSuggestAddresses,
                minConfidence: suggestionConfidence
            });
            
            if (ticketsWithAddresses.length === 0) {
                throw new Error('No valid tickets found for optimization');
            }

            // Step 2: Deduplicate addresses to optimize API calls
            const addressToTicketsMap = new Map(); // address -> array of tickets
            const uniqueAddresses = []; // array of unique addresses for API call
            
            for (const ticket of ticketsWithAddresses) {
                const address = ticket.address;
                if (!addressToTicketsMap.has(address)) {
                    addressToTicketsMap.set(address, []);
                    uniqueAddresses.push(address);
                }
                addressToTicketsMap.get(address).push(ticket);
            }

            console.log(`Deduplicated ${ticketsWithAddresses.length} tickets into ${uniqueAddresses.length} unique addresses`);
            console.log('Unique addresses for optimization:', uniqueAddresses);

            // Step 2.5: Check if we need to use clustering (more than 100 unique locations - OSRM limit)
            if (uniqueAddresses.length > 100) {
                console.log(`More than 100 unique locations (${uniqueAddresses.length}) detected. Using location-based clustering approach.`);
                console.log(`This will create clusters with max 100 unique locations each, then assign all tickets at those locations.`);
                return await this.optimizeRouteWithClustering(
                    ticketIds,
                    routeCode,
                    type,
                    originAddress,
                    destinationAddress,
                    startDate,
                    endDate,
                    createdBy,
                    options
                );
            }

            // Step 3: Check existing Addresses table and only geocode new addresses
            const geocodedAddresses = await this.batchGeocodeWithAddresses(uniqueAddresses);

            // Step 4: Optimize unique addresses in one request
            const optimizedRouteResult = await this.optimizeRoute(
                originAddress,
                destinationAddress,
                uniqueAddresses
            );

            // Step 5: Map optimized order back to all tickets
            let optimizedOrder = optimizedRouteResult.optimizedOrder || [];
            
            // If there's only one address and no optimized order, create a default order
            if (uniqueAddresses.length === 1 && optimizedOrder.length === 0) {
                optimizedOrder = [0]; // The only address gets position 0
                console.log('Single address detected, using default order [0]');
            }
            
            // Validate that optimizedOrder has valid indices
            if (optimizedOrder.length !== uniqueAddresses.length) {
                console.warn(`Optimized order length (${optimizedOrder.length}) doesn't match unique addresses length (${uniqueAddresses.length}), using sequential order`);
                optimizedOrder = Array.from({ length: uniqueAddresses.length }, (_, i) => i);
            }

            // Step 6: Create final ticket order with queue positions
            const reorderedTickets = [];
            let globalQueuePosition = 0;

            // Process addresses in optimized order
            for (let addressIndex = 0; addressIndex < optimizedOrder.length; addressIndex++) {
                const originalAddressIndex = optimizedOrder[addressIndex];
                
                // Validate that originalAddressIndex is within bounds
                if (originalAddressIndex < 0 || originalAddressIndex >= uniqueAddresses.length) {
                    console.warn(`Invalid optimizedOrder index: ${originalAddressIndex}, skipping`);
                    continue;
                }
                
                const address = uniqueAddresses[originalAddressIndex];
                const ticketsAtThisAddress = addressToTicketsMap.get(address);
                
                // Assign sequential queue positions to all tickets at this address
                for (const ticket of ticketsAtThisAddress) {
                    reorderedTickets.push({
                        ...ticket,
                        queue: globalQueuePosition++
                    });
                }
            }

            console.log(`Final ticket order: ${reorderedTickets.length} tickets with ${uniqueAddresses.length} unique addresses`);

            // Step 7: Prepare route data for database
            const routeData = {
                routeCode: routeCode || await this.generateRouteCode(type),
                type: type || 'default',
                startDate: startDate || new Date(),
                endDate: endDate || null, // Set to null for new routes (active routes)
                encodedPolyline: optimizedRouteResult.encodedPolyline,
                totalDistance: optimizedRouteResult.totalDistance,
                totalDuration: optimizedRouteResult.totalDuration,
                optimizedOrder: optimizedRouteResult.optimizedOrder,
                optimizationMetadata: {
                    optimizationDate: new Date().toISOString(),
                    totalWaypoints: uniqueAddresses.length,
                    totalTickets: reorderedTickets.length,
                    originAddress,
                    destinationAddress,
                    method: 'consolidated_optimization_with_deduplication',
                    apiCallsUsed: 1,
                    addressDeduplication: {
                        originalTickets: ticketsWithAddresses.length,
                        uniqueAddresses: uniqueAddresses.length,
                        savings: ticketsWithAddresses.length - uniqueAddresses.length
                    }
                },
                tickets: reorderedTickets
            };

            // Step 8: Save to database
            const savedRoute = await this.saveOptimizedRoute(routeData, createdBy);

            // Step 9: Prepare standardized response
            const originalTickets = ticketsWithAddresses.filter(t => !t.suggestedAddress);
            const suggestedTickets = ticketsWithAddresses.filter(t => t.suggestedAddress);
            
            const responseData = {
                routeId: savedRoute.routeid,
                routeCode: savedRoute.routecode,
                totalDistance: savedRoute.totaldistance,
                totalDuration: savedRoute.totalduration,
                totalTickets: reorderedTickets.length,
                uniqueAddresses: uniqueAddresses.length,
                apiCallsUsed: 1,
                costEstimate: this.estimateApiCost(1),
                addressInfo: {
                    originalAddresses: originalTickets.length,
                    suggestedAddresses: suggestedTickets.length,
                    uniqueAddressesUsed: uniqueAddresses.length,
                    addressDeduplicationSavings: ticketsWithAddresses.length - uniqueAddresses.length,
                    suggestions: suggestedTickets.map(t => ({
                        ticketId: t.ticketid,
                        ticketCode: t.ticketcode,
                        suggestedAddress: t.address,
                        confidence: t.suggestionConfidence,
                        method: t.suggestionMethod
                    }))
                },
                optimizationMetadata: {
                    optimizedOrder: optimizedRouteResult.optimizedOrder,
                    totalWaypoints: uniqueAddresses.length,
                    originAddress,
                    destinationAddress,
                    addressDeduplication: {
                        originalTickets: ticketsWithAddresses.length,
                        uniqueAddresses: uniqueAddresses.length,
                        savings: ticketsWithAddresses.length - uniqueAddresses.length
                    }
                }
            };

            let successMessage = 'Route optimized successfully';
            if (suggestedTickets.length > 0) {
                successMessage += `. ${suggestedTickets.length} addresses were automatically suggested.`;
            }
            if (uniqueAddresses.length < ticketsWithAddresses.length) {
                successMessage += ` ${ticketsWithAddresses.length - uniqueAddresses.length} duplicate addresses were consolidated for API efficiency.`;
            }

            return this.handleSuccess(responseData, successMessage, {
                context: 'route_optimization',
                ticketCount: reorderedTickets.length,
                uniqueAddressCount: uniqueAddresses.length
            });

        } catch (error) {
            return this.handleError(error, 'route_optimization', {
                ticketIds,
                type,
                originAddress,
                destinationAddress
            });
        }
    }

    /**
     * Fetches the full address string for a given ticket object from the database.
     * This method uses the same comprehensive approach as TicketsController.js
     * If no address exists, it generates a sample address for demonstration purposes.
     * @param {Object} ticket - A ticket object, expected to have a `ticketId`.
     * @returns {Promise<string|null>} - The formatted address string, or null if not found.
     */
    async getTicketAddress(ticket) {
        try {
            // Use the same comprehensive query as TicketsController.js
            const addressQuery = await db.query(`
                SELECT DISTINCT 
                    a.addressId,
                    a.addressNumber,
                    a.addressCardinal,
                    a.addressStreet,
                    a.addressSuffix,
                    a.latitude,
                    a.longitude,
                    a.placeid,
                    -- Build full address string using CONCAT and COALESCE
                    CASE 
                        WHEN a.addressNumber IS NOT NULL AND a.addressStreet IS NOT NULL THEN
                            CONCAT(
                                COALESCE(a.addressNumber, ''),
                                ' ',
                                COALESCE(a.addressCardinal, ''),
                                ' ',
                                COALESCE(a.addressStreet, ''),
                                ' ',
                                COALESCE(a.addressSuffix, '')
                            )
                        ELSE NULL
                    END as fullAddress
                FROM TicketAddresses ta
                JOIN Addresses a ON ta.addressId = a.addressId AND a.deletedAt IS NULL
                WHERE ta.ticketId = $1 AND ta.deletedAt IS NULL
                ORDER BY a.addressId
                LIMIT 1
            `, [ticket.ticketid]);

            if (addressQuery.rows.length > 0) {
                const addr = addressQuery.rows[0];
                
                // Use the fullAddress if available, otherwise construct it
                let addressString;
                if (addr.fulladdress) {
                    addressString = addr.fulladdress.trim();
                } else {
                    // Fallback: construct address from individual components
                    const parts = [
                        addr.addressnumber,
                        addr.addresscardinal,
                        addr.addressstreet,
                        addr.addressesuffix
                    ].filter(Boolean); // Filter out null/undefined/empty strings

                    addressString = parts.join(', ').replace(/,(\s*,){1,}/g, ',').replace(/,$/, '').trim();
                }

                // Append "Chicago, Illinois" to all addresses for better geocoding accuracy
                const fullAddress = `${addressString}, Chicago, Illinois`;
                
                // If we have latitude and longitude, we can use them for more accurate geocoding
                if (addr.latitude && addr.longitude) {
                    return `${fullAddress} (${addr.latitude}, ${addr.longitude})`;
                }

                return fullAddress;
            }
            
            // If no address found in database, generate a sample address for demonstration
            // This uses the ticket ID to create a deterministic but varied address
            const sampleAddresses = [
                { number: "1000", cardinal: "N", street: "MAIN", suffix: "ST" },
                { number: "2000", cardinal: "S", street: "BROADWAY", suffix: "AVE" },
                { number: "3000", cardinal: "E", street: "CHICAGO", suffix: "BLVD" },
                { number: "4000", cardinal: "W", street: "MICHIGAN", suffix: "RD" },
                { number: "5000", cardinal: "N", street: "CLARK", suffix: "ST" },
                { number: "6000", cardinal: "S", street: "DAMEN", suffix: "AVE" },
                { number: "7000", cardinal: "E", street: "WESTERN", suffix: "BLVD" },
                { number: "8000", cardinal: "W", street: "PULASKI", suffix: "RD" },
                { number: "9000", cardinal: "N", street: "KEDZIE", suffix: "ST" },
                { number: "1100", cardinal: "S", street: "CICERO", suffix: "AVE" }
            ];
            
            const addressIndex = (ticket.ticketid || 0) % sampleAddresses.length;
            const sampleAddr = sampleAddresses[addressIndex];
            
            // Construct the full address string with Chicago, Illinois
            const fullAddress = `${sampleAddr.number} ${sampleAddr.cardinal} ${sampleAddr.street} ${sampleAddr.suffix}, Chicago, Illinois`.trim();
            
            console.log(`Generated sample address for ticket ${ticket.ticketid}: ${fullAddress}`);
            return fullAddress;
            
        } catch (error) {
            console.error(`Error getting address for ticket ID ${ticket.ticketid}:`, error);
            return null; // Return null on error so optimization can potentially continue with other tickets
        }
    }

    /**
     * Retrieves an optimized route and its associated tickets from the database.
     * This method assumes your `Routes` model has a `findByIdWithOptimizedTickets` method.
     * @param {number} routeId - The ID of the route to retrieve.
     * @returns {Promise<Object>} - The route object with associated tickets.
     * @throws {Error} If the route is not found.
     */
    async getOptimizedRoute(routeId) {
        try {
            const route = await Routes.findByIdWithOptimizedTickets(routeId);
            if (!route) {
                throw new Error(`Route with ID ${routeId} not found`);
            }
            return route;
        } catch (error) {
            console.error('Failed to get optimized route from database:', error);
            throw error;
        }
    }

    /**
     * Get tickets for spotting routes
     * Criteria: comment7d is NULL, empty, or TK - PERMIT EXTENDED, and SPOTTING status exists but has no endingDate (not completed)
     * @returns {Promise<Array>} - Array of tickets eligible for spotting routes
     */
    async getSpottingTickets() {
        try {
            const result = await db.query(`
                SELECT DISTINCT 
                    t.ticketId,
                    t.ticketCode,
                    t.contractNumber,
                    t.amountToPay,
                    t.ticketType,
                    t.daysOutstanding,
                    t.comment7d,
                    t.quantity,
                    t.createdAt,
                    t.updatedAt,
                    cu.name as contractUnitName,
                    i.name as incidentName
                FROM Tickets t
                LEFT JOIN ContractUnits cu ON t.contractUnitId = cu.contractUnitId AND cu.deletedAt IS NULL
                LEFT JOIN IncidentsMx i ON t.incidentId = i.incidentId AND i.deletedAt IS NULL
                WHERE t.deletedAt IS NULL
                    AND (
                        t.comment7d IS NULL 
                        OR t.comment7d = '' 
                        OR t.comment7d = 'TK - PERMIT EXTENDED'
                    )
                    AND (
                        -- SPOTTING status exists but has no endingDate (not completed)
                        EXISTS (
                            SELECT 1 FROM TicketStatus tks2 
                            JOIN TaskStatus ts2 ON tks2.taskStatusId = ts2.taskStatusId 
                            WHERE tks2.ticketId = t.ticketId 
                                AND ts2.name = 'Spotting'
                                AND tks2.endingdate IS NULL
                                AND tks2.deletedAt IS NULL
                                AND ts2.deletedAt IS NULL
                        )
                    )
                    AND NOT EXISTS (
                        -- Exclude tickets already assigned to an active spotting route
                        SELECT 1 FROM RouteTickets rt
                        JOIN Routes r ON rt.routeId = r.routeId
                        WHERE rt.ticketId = t.ticketId
                            AND r.type = 'SPOTTER'
                            AND r.deletedAt IS NULL
                            AND rt.deletedAt IS NULL
                    )
                ORDER BY t.ticketId ASC
            `);
            
            return result.rows;
        } catch (error) {
            console.error('Error getting spotting tickets:', error);
            throw error;
        }
    }

    /**
     * Get tickets for concrete routes
     * Criteria: SPOTTING completed (has endingDate) and has SAWCUT status
     * @returns {Promise<Array>} - Array of tickets eligible for concrete routes
     */
    async getConcreteTickets() {
        try {
            const result = await db.query(`
                SELECT DISTINCT 
                    t.ticketId,
                    t.ticketCode,
                    t.contractNumber,
                    t.amountToPay,
                    t.ticketType,
                    t.daysOutstanding,
                    t.comment7d,
                    t.quantity,
                    t.createdAt,
                    t.updatedAt,
                    cu.name as contractUnitName,
                    i.name as incidentName
                FROM Tickets t
                LEFT JOIN ContractUnits cu ON t.contractUnitId = cu.contractUnitId AND cu.deletedAt IS NULL
                LEFT JOIN IncidentsMx i ON t.incidentId = i.incidentId AND i.deletedAt IS NULL
                WHERE t.deletedAt IS NULL
                    AND EXISTS (
                        -- SPOTTING completed (has endingDate)
                        SELECT 1 FROM TicketStatus tks1 
                        JOIN TaskStatus ts1 ON tks1.taskStatusId = ts1.taskStatusId 
                        WHERE tks1.ticketId = t.ticketId 
                            AND ts1.name = 'Spotting'
                            AND tks1.endingdate IS NOT NULL
                            AND tks1.deletedAt IS NULL
                            AND ts1.deletedAt IS NULL
                    )
                    AND EXISTS (
                        -- Has SAWCUT status
                        SELECT 1 FROM TicketStatus tks2 
                        JOIN TaskStatus ts2 ON tks2.taskStatusId = ts2.taskStatusId 
                        WHERE tks2.ticketId = t.ticketId 
                            AND ts2.name = 'Sawcut'
                            AND tks2.deletedAt IS NULL
                            AND ts2.deletedAt IS NULL
                    )
                    AND NOT EXISTS (
                        -- Exclude tickets already assigned to an active concrete route
                        SELECT 1 FROM RouteTickets rt
                        JOIN Routes r ON rt.routeId = r.routeId
                        WHERE rt.ticketId = t.ticketId
                            AND r.type = 'CONCRETE'
                            AND r.deletedAt IS NULL
                            AND rt.deletedAt IS NULL
                    )
                ORDER BY t.ticketId ASC
            `);
            
            return result.rows;
        } catch (error) {
            console.error('Error getting concrete tickets:', error);
            throw error;
        }
    }

    /**
     * Get tickets for asphalt routes
     * Criteria: 
     * 1. SPOTTING completed and has GRINDING status (no SAWCUT)
     * 2. OR all concrete phases completed (SAWCUT, REMOVAL, FRAMING, POURING)
     * @returns {Promise<Array>} - Array of tickets eligible for asphalt routes
     */
    async getAsphaltTickets() {
        try {
            const result = await db.query(`
                SELECT DISTINCT 
                    t.ticketId,
                    t.ticketCode,
                    t.contractNumber,
                    t.amountToPay,
                    t.ticketType,
                    t.daysOutstanding,
                    t.comment7d,
                    t.quantity,
                    t.createdAt,
                    t.updatedAt,
                    cu.name as contractUnitName,
                    i.name as incidentName
                FROM Tickets t
                LEFT JOIN ContractUnits cu ON t.contractUnitId = cu.contractUnitId AND cu.deletedAt IS NULL
                LEFT JOIN IncidentsMx i ON t.incidentId = i.incidentId AND i.deletedAt IS NULL
                WHERE t.deletedAt IS NULL
                    AND EXISTS (
                        -- SPOTTING completed (has endingDate)
                        SELECT 1 FROM TicketStatus tks1 
                        JOIN TaskStatus ts1 ON tks1.taskStatusId = ts1.taskStatusId 
                        WHERE tks1.ticketId = t.ticketId 
                            AND ts1.name = 'Spotting'
                            AND tks1.endingdate IS NOT NULL
                            AND tks1.deletedAt IS NULL
                            AND ts1.deletedAt IS NULL
                    )
                    AND (
                        -- Case 1: Has GRINDING status but no SAWCUT
                        (
                            EXISTS (
                                SELECT 1 FROM TicketStatus tks2 
                                JOIN TaskStatus ts2 ON tks2.taskStatusId = ts2.taskStatusId 
                                WHERE tks2.ticketId = t.ticketId 
                                    AND ts2.name = 'Grind'
                                    AND tks2.deletedAt IS NULL
                                    AND ts2.deletedAt IS NULL
                            )
                            AND NOT EXISTS (
                                SELECT 1 FROM TicketStatus tks3 
                                JOIN TaskStatus ts3 ON tks3.taskStatusId = ts3.taskStatusId 
                                WHERE tks3.ticketId = t.ticketId 
                                    AND ts3.name = 'Sawcut'
                                    AND tks3.deletedAt IS NULL
                                    AND ts3.deletedAt IS NULL
                            )
                        )
                        OR
                        -- Case 2: All concrete phases completed (SAWCUT, REMOVAL, FRAMING, POURING)
                        (
                            EXISTS (
                                SELECT 1 FROM TicketStatus tks4 
                                JOIN TaskStatus ts4 ON tks4.taskStatusId = ts4.taskStatusId 
                                WHERE tks4.ticketId = t.ticketId 
                                    AND ts4.name = 'Sawcut'
                                    AND tks4.endingdate IS NOT NULL
                                    AND tks4.deletedAt IS NULL
                                    AND ts4.deletedAt IS NULL
                            )
                            AND EXISTS (
                                SELECT 1 FROM TicketStatus tks5 
                                JOIN TaskStatus ts5 ON tks5.taskStatusId = ts5.taskStatusId 
                                WHERE tks5.ticketId = t.ticketId 
                                    AND ts5.name = 'Stripping'
                                    AND tks5.endingdate IS NOT NULL
                                    AND tks5.deletedAt IS NULL
                                    AND ts5.deletedAt IS NULL
                            )
                            AND EXISTS (
                                SELECT 1 FROM TicketStatus tks6 
                                JOIN TaskStatus ts6 ON tks6.taskStatusId = ts6.taskStatusId 
                                WHERE tks6.ticketId = t.ticketId 
                                    AND ts6.name = 'Framing'
                                    AND tks6.endingdate IS NOT NULL
                                    AND tks6.deletedAt IS NULL
                                    AND ts6.deletedAt IS NULL
                            )
                            AND EXISTS (
                                SELECT 1 FROM TicketStatus tks7 
                                JOIN TaskStatus ts7 ON tks7.taskStatusId = ts7.taskStatusId 
                                WHERE tks7.ticketId = t.ticketId 
                                    AND ts7.name = 'Pour'
                                    AND tks7.endingdate IS NOT NULL
                                    AND tks7.deletedAt IS NULL
                                    AND ts7.deletedAt IS NULL
                            )
                        )
                    )
                    AND NOT EXISTS (
                        -- Exclude tickets already assigned to an active asphalt route
                        SELECT 1 FROM RouteTickets rt
                        JOIN Routes r ON rt.routeId = r.routeId
                        WHERE rt.ticketId = t.ticketId
                            AND r.type = 'ASPHALT'
                            AND r.deletedAt IS NULL
                            AND rt.deletedAt IS NULL
                    )
                ORDER BY t.ticketId ASC
            `);
            
            return result.rows;
        } catch (error) {
            console.error('Error getting asphalt tickets:', error);
            throw error;
        }
    }

    /**
     * Get tickets with addresses in a single database query
     * @param {Array<number>} ticketIds - Array of ticket IDs
     * @param {Object} options - Additional options including autoSuggest
     * @returns {Promise<Array>} - Tickets with addresses
     */
    async getTicketsWithAddressesBatch(ticketIds, options = {}) {
        try {
            console.log('=== GETTING TICKETS WITH ADDRESSES ===');
            console.log('Looking for ticket IDs:', ticketIds);
            
            const { autoSuggest = true, minConfidence = 0.8 } = options;
            
            const result = await db.query(`
                SELECT DISTINCT 
                    t.ticketId,
                    t.ticketCode,
                    t.contractNumber,
                    t.amountToPay,
                    t.ticketType,
                    t.daysOutstanding,
                    t.comment7d,
                    t.quantity,
                    t.createdAt,
                    t.updatedAt,
                    cu.name as contractUnitName,
                    i.name as incidentName,
                    -- Build full address string
                    CASE 
                        WHEN a.addressNumber IS NOT NULL AND a.addressStreet IS NOT NULL THEN
                            CONCAT(
                                COALESCE(a.addressNumber, ''),
                                ' ',
                                COALESCE(a.addressCardinal, ''),
                                ' ',
                                COALESCE(a.addressStreet, ''),
                                ' ',
                                COALESCE(a.addressSuffix, ''),
                                ', Chicago, Illinois'
                            )
                        ELSE NULL
                    END as address
                FROM Tickets t
                LEFT JOIN ContractUnits cu ON t.contractUnitId = cu.contractUnitId AND cu.deletedAt IS NULL
                LEFT JOIN IncidentsMx i ON t.incidentId = i.incidentId AND i.deletedAt IS NULL
                LEFT JOIN TicketAddresses ta ON t.ticketId = ta.ticketId AND ta.deletedAt IS NULL
                LEFT JOIN Addresses a ON ta.addressId = a.addressId AND a.deletedAt IS NULL
                WHERE t.ticketId = ANY($1) 
                    AND t.deletedAt IS NULL
                ORDER BY t.ticketId
            `, [ticketIds]);

            console.log('Raw database results:', result.rows);
            
            const ticketsWithAddresses = result.rows.filter(row => row.address);
            const ticketsWithoutAddresses = result.rows.filter(row => !row.address);
            
            console.log('Tickets with addresses:', ticketsWithAddresses.length);
            console.log('Tickets without addresses:', ticketsWithoutAddresses.length);

            // If we have tickets without addresses, try to find suggestions automatically
            if (ticketsWithoutAddresses.length > 0 && autoSuggest) {
                console.log('Attempting to find address suggestions for tickets without addresses...');
                
                const suggestedTickets = [];
                for (const ticket of ticketsWithoutAddresses) {
                    try {
                        // Try to find address suggestions for this ticket
                        const suggestions = await this.findSimilarAddresses(
                            null, // No partial address
                            ticket.ticketid,
                            { maxResults: 1, minConfidence: minConfidence } // Only high-confidence matches
                        );
                        
                        if (suggestions.length > 0 && suggestions[0].confidence >= minConfidence) {
                            const bestSuggestion = suggestions[0];
                            console.log(`Found address suggestion for ticket ${ticket.ticketid}: ${bestSuggestion.fullAddress} (confidence: ${bestSuggestion.confidence})`);
                            
                            // Create a ticket object with the suggested address
                            const suggestedTicket = {
                                ...ticket,
                                address: bestSuggestion.fullAddress,
                                suggestedAddress: true, // Flag to indicate this is a suggested address
                                suggestionConfidence: bestSuggestion.confidence,
                                suggestionMethod: bestSuggestion.method
                            };
                            
                            suggestedTickets.push(suggestedTicket);
                        } else {
                            console.log(`No suitable address suggestions found for ticket ${ticket.ticketid}`);
                        }
                    } catch (error) {
                        console.error(`Error finding address suggestions for ticket ${ticket.ticketid}:`, error);
                    }
                }
                
                // Combine original tickets with addresses and suggested tickets
                const allTickets = [...ticketsWithAddresses, ...suggestedTickets];
                console.log(`Final result: ${allTickets.length} tickets with addresses (${ticketsWithAddresses.length} original, ${suggestedTickets.length} suggested)`);
                
                return allTickets;
            }

            return ticketsWithAddresses; // Only return tickets with valid addresses
        } catch (error) {
            console.error('Error getting tickets with addresses batch:', error);
            throw error;
        }
    }

    /**
     * Batch geocode addresses using existing Addresses table
     * @param {Array<string>} addresses - Array of addresses to geocode
     * @returns {Promise<Object>} - Object mapping addresses to geocoded data
     */
    async batchGeocodeWithAddresses(addresses) {
        const geocodedAddresses = {};
        const addressesToGeocode = [];

        // Check existing Addresses table first
        for (const address of addresses) {
            const existingAddress = await this.getExistingAddress(address);
            if (existingAddress && existingAddress.placeid) {
                geocodedAddresses[address] = {
                    address: address,
                    latitude: existingAddress.latitude,
                    longitude: existingAddress.longitude,
                    placeId: existingAddress.placeid
                };
            } else {
                addressesToGeocode.push(address);
            }
        }

        // Only geocode addresses not already in Addresses table
        if (addressesToGeocode.length > 0) {
            console.log(`Geocoding ${addressesToGeocode.length} new addresses (${addresses.length - addressesToGeocode.length} from existing addresses)`);
            
            // Geocode in parallel (but limit concurrency to avoid rate limits)
            const geocodedResults = await this.geocodeAddressesWithRateLimit(addressesToGeocode);
            
            // Save the results to Addresses table
            for (let i = 0; i < addressesToGeocode.length; i++) {
                const address = addressesToGeocode[i];
                const result = geocodedResults[i];
                if (result) {
                    await this.saveAddressToDatabase(address, result);
                    geocodedAddresses[address] = result;
                }
            }
        }

        return geocodedAddresses;
    }

    /**
     * Geocode addresses with rate limiting to avoid API limits
     * @param {Array<string>} addresses - Addresses to geocode
     * @returns {Promise<Array>} - Geocoded results
     */
    async geocodeAddressesWithRateLimit(addresses) {
        const results = [];
        const batchSize = 10; // Process 10 addresses at a time
        const delay = 100; // 100ms delay between batches

        for (let i = 0; i < addresses.length; i += batchSize) {
            const batch = addresses.slice(i, i + batchSize);
            
            // Geocode batch in parallel
            const batchPromises = batch.map(async (address) => {
                try {
                    return await this.geocodeAddress(address);
                } catch (error) {
                    console.error(`Failed to geocode address: ${address}`, error);
                    return null;
                }
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);

            // Add delay between batches to respect rate limits
            if (i + batchSize < addresses.length) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        return results;
    }

    /**
     * Check if address already exists in Addresses table with placeId
     * @param {string} address - Full address string
     * @returns {Promise<Object|null>} - Existing address record or null
     */
    async getExistingAddress(address) {
        try {
            // Parse the address to match against Addresses table fields
            const parsedAddress = this.parseAddressForLookup(address);
            
            const result = await db.query(`
                SELECT addressId, addressNumber, addressCardinal, addressStreet, addressSuffix,
                       latitude, longitude, placeid
                FROM Addresses 
                WHERE addressNumber = $1 
                    AND addressCardinal = $2 
                    AND addressStreet = $3 
                    AND addressSuffix = $4
                    AND placeid IS NOT NULL
                    AND deletedAt IS NULL
                LIMIT 1
            `, [
                parsedAddress.addressNumber,
                parsedAddress.addressCardinal,
                parsedAddress.addressStreet,
                parsedAddress.addressSuffix
            ]);
            
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (error) {
            console.warn('Address lookup failed:', error);
            return null;
        }
    }

    /**
     * Save geocoded address to Addresses table
     * @param {string} address - Full address string
     * @param {Object} geocodeData - Geocoded data with latitude, longitude, placeId
     */
    async saveAddressToDatabase(address, geocodeData) {
        try {
            const parsedAddress = this.parseAddressForLookup(address);
            
            await db.query(`
                INSERT INTO Addresses (
                    addressNumber, addressCardinal, addressStreet, addressSuffix,
                    latitude, longitude, placeid, createdBy, updatedBy
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (addressNumber, addressCardinal, addressStreet, addressSuffix) 
                DO UPDATE SET
                    latitude = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude,
                    placeid = EXCLUDED.placeid,
                    updatedAt = CURRENT_TIMESTAMP,
                    updatedBy = EXCLUDED.updatedBy
            `, [
                parsedAddress.addressNumber,
                parsedAddress.addressCardinal,
                parsedAddress.addressStreet,
                parsedAddress.addressSuffix,
                geocodeData.latitude,
                geocodeData.longitude,
                geocodeData.placeId,
                1, // createdBy
                1  // updatedBy
            ]);
        } catch (error) {
            console.warn('Failed to save address to database:', error);
        }
    }

    /**
     * Parse address string to match Addresses table structure
     * @param {string} address - Full address string (e.g., "123 N MAIN ST, Chicago, Illinois")
     * @returns {Object} - Parsed address components
     */
    parseAddressForLookup(address) {
        // Remove city and state from the end
        const cleanAddress = address.replace(/,?\s*Chicago,?\s*Illinois?/i, '').trim();
        
        // Simple address parsing for lookup
        const parts = cleanAddress.split(' ');
        let addressNumber = '';
        let addressCardinal = '';
        let addressStreet = '';
        let addressSuffix = '';
        
        if (parts.length > 0) {
            addressNumber = parts[0];
            
            if (parts.length > 1) {
                // Check if second part is a cardinal direction
                const cardinals = ['N', 'S', 'E', 'W', 'NORTH', 'SOUTH', 'EAST', 'WEST'];
                if (cardinals.includes(parts[1].toUpperCase())) {
                    addressCardinal = parts[1];
                    addressStreet = parts.slice(2, -1).join(' ');
                    if (parts.length > 2) {
                        addressSuffix = parts[parts.length - 1];
                    }
                } else {
                    addressStreet = parts.slice(1, -1).join(' ');
                    if (parts.length > 1) {
                        addressSuffix = parts[parts.length - 1];
                    }
                }
            }
        }
        
        return {
            addressNumber,
            addressCardinal,
            addressStreet,
            addressSuffix
        };
    }

    /**
     * Estimate API cost based on number of calls
     * @param {number} apiCalls - Number of API calls made
     * @returns {string} - Cost estimate
     */
    estimateApiCost(apiCalls) {
        // Rough estimates based on Google Maps Platform pricing
        const geocodingCost = 0.005; // $0.005 per geocoding request
        const routesCost = 0.005; // $0.005 per routes request
        
        const totalCost = apiCalls * (geocodingCost + routesCost);
        return `~$${totalCost.toFixed(3)}`;
    }

    /**
     * Add tickets to an existing route
     * @param {number} routeId - Existing route ID
     * @param {Array<number>} ticketIds - Array of ticket IDs to add
     * @param {number} updatedBy - User ID
     * @returns {Promise<Object>} - Updated route data
     */
    async addTicketsToRoute(routeId, ticketIds, updatedBy = 1) {
        try {
            // Get existing route
            const existingRoute = await Routes.findById(routeId);
            if (!existingRoute) {
                throw new Error(`Route with ID ${routeId} not found`);
            }

            // Get existing route tickets
            const existingRouteTickets = await RouteTickets.findByRouteId(routeId);
            const existingTicketIds = existingRouteTickets.map(rt => rt.ticketid);

            // Get new tickets with addresses
            const newTickets = await this.getTicketsWithAddressesBatch(ticketIds);
            
            // Filter out tickets already in the route
            const ticketsToAdd = newTickets.filter(t => !existingTicketIds.includes(t.ticketid));
            
            if (ticketsToAdd.length === 0) {
                return {
                    routeId: routeId,
                    message: 'No new tickets to add (all tickets already exist in route)',
                    addedTickets: 0,
                    totalTickets: existingTicketIds.length,
                    skippedTickets: ticketIds.filter(id => existingTicketIds.includes(id))
                };
            }

            // Get addresses for new tickets
            const newAddresses = ticketsToAdd.map(t => t.address);
            
            // Check if addresses are already geocoded in Addresses table
            const geocodedAddresses = await this.batchGeocodeWithAddresses(newAddresses);

            // Add new tickets to route with sequential queue numbers
            const nextQueueNumber = existingRouteTickets.length;
            const routeTicketsToAdd = ticketsToAdd.map((ticket, index) => ({
                routeId: routeId,
                ticketId: ticket.ticketid,
                address: ticket.address,
                queue: nextQueueNumber + index,
                createdBy: updatedBy,
                updatedBy: updatedBy
            }));

            await RouteTickets.createBatch(routeTicketsToAdd);

            return {
                routeId: routeId,
                message: `Added ${ticketsToAdd.length} tickets to route`,
                addedTickets: ticketsToAdd.length,
                totalTickets: existingTicketIds.length + ticketsToAdd.length,
                skippedTickets: ticketIds.filter(id => existingTicketIds.includes(id))
            };

        } catch (error) {
            console.error('Failed to add tickets to route:', error);
            throw error;
        }
    }

    /**
     * Remove tickets from an existing route
     * @param {number} routeId - Existing route ID
     * @param {Array<number>} ticketIds - Array of ticket IDs to remove
     * @param {number} updatedBy - User ID
     * @returns {Promise<Object>} - Updated route data
     */
    async removeTicketsFromRoute(routeId, ticketIds, updatedBy = 1) {
        try {
            // Get existing route
            const existingRoute = await Routes.findById(routeId);
            if (!existingRoute) {
                throw new Error(`Route with ID ${routeId} not found`);
            }

            // Get existing route tickets
            const existingRouteTickets = await RouteTickets.findByRouteId(routeId);
            const existingTicketIds = existingRouteTickets.map(rt => rt.ticketid);

            // Filter tickets that exist in the route
            const ticketsToRemove = ticketIds.filter(id => existingTicketIds.includes(id));
            
            if (ticketsToRemove.length === 0) {
                return {
                    routeId: routeId,
                    message: 'No tickets found to remove',
                    removedTickets: 0
                };
            }

            // Remove tickets from route
            for (const ticketId of ticketsToRemove) {
                await RouteTickets.deleteByRouteAndTicket(routeId, ticketId, updatedBy);
            }

            // Reorder remaining tickets to fill gaps
            const remainingRouteTickets = await RouteTickets.findByRouteId(routeId);
            for (let i = 0; i < remainingRouteTickets.length; i++) {
                await RouteTickets.updateQueue(routeId, remainingRouteTickets[i].ticketid, i, updatedBy);
            }

            return {
                routeId: routeId,
                message: `Removed ${ticketsToRemove.length} tickets from route`,
                removedTickets: ticketsToRemove.length,
                totalTickets: remainingRouteTickets.length
            };

        } catch (error) {
            console.error('Failed to remove tickets from route:', error);
            throw error;
        }
    }

    /**
     * Re-optimize an existing route with new ticket order
     * @param {number} routeId - Existing route ID
     * @param {string} originAddress - Origin address
     * @param {string} destinationAddress - Destination address
     * @param {number} updatedBy - User ID
     * @returns {Promise<Object>} - Re-optimized route data
     */
    async reoptimizeRoute(routeId, originAddress, destinationAddress, updatedBy = 1) {
        try {
            // Get existing route and tickets
            const existingRoute = await Routes.findById(routeId);
            if (!existingRoute) {
                throw new Error(`Route with ID ${routeId} not found`);
            }

            const routeTickets = await RouteTickets.findByRouteId(routeId);
            if (routeTickets.length === 0) {
                throw new Error(`No tickets found in route ${routeId}`);
            }

            // Get ticket details with addresses
            const ticketIds = routeTickets.map(rt => rt.ticketid);
            const ticketsWithAddresses = await this.getTicketsWithAddressesBatch(ticketIds);

            if (ticketsWithAddresses.length === 0) {
                throw new Error('No valid addresses found for route optimization');
            }

            // Optimize the route with existing tickets
            const addressesToOptimize = ticketsWithAddresses.map(t => t.address);
            const optimizedRouteResult = await this.optimizeRoute(
                originAddress,
                destinationAddress,
                addressesToOptimize
            );

            // Update route with new optimization data
            await Routes.updateOptimization(
                routeId,
                optimizedRouteResult.encodedPolyline,
                optimizedRouteResult.totalDistance,
                optimizedRouteResult.totalDuration,
                optimizedRouteResult.optimizedOrder,
                updatedBy
            );

            // Update ticket queue positions based on optimization
            // Add safety check to ensure optimizedOrder indices are valid
            const reorderedTickets = optimizedRouteResult.optimizedOrder
                .map((originalIndex, queuePosition) => {
                    // Check if the originalIndex is valid
                    if (originalIndex >= 0 && originalIndex < ticketsWithAddresses.length) {
                        return {
                            ticketId: ticketsWithAddresses[originalIndex].ticketid,
                            queue: queuePosition
                        };
                    } else {
                        console.warn(`Invalid optimizedOrder index: ${originalIndex} for queue position ${queuePosition}`);
                        return null;
                    }
                })
                .filter(ticket => ticket !== null); // Remove any null entries

            for (const ticket of reorderedTickets) {
                await RouteTickets.updateQueue(routeId, ticket.ticketId, ticket.queue, updatedBy);
            }

            return {
                routeId: routeId,
                message: 'Route re-optimized successfully',
                totalDistance: optimizedRouteResult.totalDistance,
                totalDuration: optimizedRouteResult.totalDuration,
                totalTickets: ticketsWithAddresses.length
            };

        } catch (error) {
            console.error('Failed to re-optimize route:', error);
            throw error;
        }
    }

    /**
     * Find similar or nearby addresses when a ticket doesn't have a valid address
     * @param {string} partialAddress - Partial address information from ticket
     * @param {number} ticketId - Ticket ID for context
     * @param {Object} options - Search options
     * @returns {Promise<Array>} - Array of similar addresses with confidence scores
     */
    async findSimilarAddresses(partialAddress, ticketId, options = {}) {
        try {
            console.log(`Finding similar addresses for ticket ${ticketId} with partial: "${partialAddress}"`);
            
            const {
                maxResults = 5,
                maxDistance = 5000, // 5km radius
                minConfidence = 0.3,
                useFuzzyMatch = true,
                useProximitySearch = true
            } = options;

            const results = [];

            // 1. Fuzzy text matching on existing addresses
            if (useFuzzyMatch && partialAddress) {
                const fuzzyMatches = await this.findFuzzyAddressMatches(partialAddress, maxResults);
                results.push(...fuzzyMatches.map(match => ({
                    ...match,
                    method: 'fuzzy_text',
                    confidence: match.similarity
                })));
            }

            // 2. Proximity search based on ticket location or quadrant
            if (useProximitySearch) {
                const proximityMatches = await this.findProximityAddressMatches(ticketId, maxDistance, maxResults);
                results.push(...proximityMatches.map(match => ({
                    ...match,
                    method: 'proximity',
                    confidence: match.distanceScore
                })));
            }

            // 3. Street name matching
            if (partialAddress) {
                const streetMatches = await this.findStreetNameMatches(partialAddress, maxResults);
                results.push(...streetMatches.map(match => ({
                    ...match,
                    method: 'street_name',
                    confidence: match.streetSimilarity
                })));
            }

            // 4. Address number range matching
            if (partialAddress) {
                const numberMatches = await this.findAddressNumberMatches(partialAddress, maxResults);
                results.push(...numberMatches.map(match => ({
                    ...match,
                    method: 'address_number',
                    confidence: match.numberSimilarity
                })));
            }

            // Combine and deduplicate results
            const uniqueResults = this.deduplicateAddressResults(results);
            
            // Sort by confidence and limit results
            const sortedResults = uniqueResults
                .filter(result => result.confidence >= minConfidence)
                .sort((a, b) => b.confidence - a.confidence)
                .slice(0, maxResults);

            console.log(`Found ${sortedResults.length} similar addresses for ticket ${ticketId}`);
            return sortedResults;

        } catch (error) {
            console.error('Error finding similar addresses:', error);
            return [];
        }
    }

    /**
     * Fuzzy text matching on existing addresses
     * @param {string} partialAddress - Partial address to match
     * @param {number} maxResults - Maximum number of results
     * @returns {Promise<Array>} - Fuzzy matched addresses
     */
    async findFuzzyAddressMatches(partialAddress, maxResults = 5) {
        try {
            // Clean and normalize the partial address
            const cleanAddress = partialAddress.replace(/[^\w\s]/g, ' ').trim();
            const words = cleanAddress.split(/\s+/).filter(word => word.length > 2);

            if (words.length === 0) return [];

            // Build dynamic query for fuzzy matching
            const conditions = [];
            const params = [];
            let paramIndex = 1;

            words.forEach(word => {
                conditions.push(`(
                    LOWER(a.addressStreet) LIKE LOWER($${paramIndex}) OR
                    LOWER(a.addressNumber) LIKE LOWER($${paramIndex}) OR
                    LOWER(a.addressCardinal) LIKE LOWER($${paramIndex}) OR
                    LOWER(a.addressSuffix) LIKE LOWER($${paramIndex})
                )`);
                params.push(`%${word}%`);
                paramIndex++;
            });

            const query = `
                SELECT 
                    a.addressId,
                    a.addressNumber,
                    a.addressCardinal,
                    a.addressStreet,
                    a.addressSuffix,
                    a.latitude,
                    a.longitude,
                    a.placeid,
                    CONCAT(
                        COALESCE(a.addressNumber, ''), ' ',
                        COALESCE(a.addressCardinal, ''), ' ',
                        COALESCE(a.addressStreet, ''), ' ',
                        COALESCE(a.addressSuffix, '')
                    ) as fullAddress,
                    -- Calculate similarity score
                    (
                        CASE WHEN LOWER(a.addressStreet) LIKE LOWER($1) THEN 0.4 ELSE 0 END +
                        CASE WHEN LOWER(a.addressNumber) LIKE LOWER($1) THEN 0.3 ELSE 0 END +
                        CASE WHEN LOWER(a.addressCardinal) LIKE LOWER($1) THEN 0.2 ELSE 0 END +
                        CASE WHEN LOWER(a.addressSuffix) LIKE LOWER($1) THEN 0.1 ELSE 0 END
                    ) as similarity
                FROM Addresses a
                WHERE a.deletedAt IS NULL
                    AND (${conditions.join(' OR ')})
                ORDER BY similarity DESC, a.addressStreet, a.addressNumber
                LIMIT $${paramIndex}
            `;

            const result = await db.query(query, [...params, maxResults]);
            return result.rows;

        } catch (error) {
            console.error('Error in fuzzy address matching:', error);
            return [];
        }
    }

    /**
     * Find addresses near a ticket's location or quadrant
     * @param {number} ticketId - Ticket ID
     * @param {number} maxDistance - Maximum distance in meters
     * @param {number} maxResults - Maximum number of results
     * @returns {Promise<Array>} - Nearby addresses
     */
    async findProximityAddressMatches(ticketId, maxDistance = 5000, maxResults = 5) {
        try {
            // First, try to get the ticket's quadrant or approximate location
            const ticketLocation = await this.getTicketApproximateLocation(ticketId);
            
            if (!ticketLocation) {
                // If no location found, return addresses from the same quadrant as other tickets
                return await this.findAddressesInSameQuadrant(ticketId, maxResults);
            }

            // If we have coordinates, find nearby addresses
            if (ticketLocation.latitude && ticketLocation.longitude) {
                return await this.findAddressesNearCoordinates(
                    ticketLocation.latitude,
                    ticketLocation.longitude,
                    maxDistance,
                    maxResults
                );
            }

            return [];

        } catch (error) {
            console.error('Error in proximity address matching:', error);
            return [];
        }
    }

    /**
     * Get approximate location for a ticket based on quadrant or other tickets
     * @param {number} ticketId - Ticket ID
     * @returns {Promise<Object|null>} - Location data
     */
    async getTicketApproximateLocation(ticketId) {
        try {
            // Try to get location from existing address
            const addressQuery = await db.query(`
                SELECT a.latitude, a.longitude, q.latitude as quadrantLat, q.longitude as quadrantLng
                FROM Tickets t
                LEFT JOIN TicketAddresses ta ON t.ticketId = ta.ticketId AND ta.deletedAt IS NULL
                LEFT JOIN Addresses a ON ta.addressId = a.addressId AND a.deletedAt IS NULL
                LEFT JOIN Quadrants q ON t.quadrantId = q.quadrantId AND q.deletedAt IS NULL
                WHERE t.ticketId = $1 AND t.deletedAt IS NULL
                LIMIT 1
            `, [ticketId]);

            if (addressQuery.rows.length > 0) {
                const row = addressQuery.rows[0];
                if (row.latitude && row.longitude) {
                    return { latitude: row.latitude, longitude: row.longitude };
                } else if (row.quadrantlat && row.quadrantlng) {
                    return { latitude: row.quadrantlat, longitude: row.quadrantlng };
                }
            }

            // If no direct location, try to find location from similar tickets in same quadrant
            const similarTicketLocation = await db.query(`
                SELECT a.latitude, a.longitude
                FROM Tickets t1
                JOIN Tickets t2 ON t1.quadrantId = t2.quadrantId AND t2.deletedAt IS NULL
                JOIN TicketAddresses ta ON t2.ticketId = ta.ticketId AND ta.deletedAt IS NULL
                JOIN Addresses a ON ta.addressId = a.addressId AND a.deletedAt IS NULL
                WHERE t1.ticketId = $1 
                    AND t1.deletedAt IS NULL
                    AND a.latitude IS NOT NULL 
                    AND a.longitude IS NOT NULL
                LIMIT 1
            `, [ticketId]);

            if (similarTicketLocation.rows.length > 0) {
                const row = similarTicketLocation.rows[0];
                return { latitude: row.latitude, longitude: row.longitude };
            }

            return null;

        } catch (error) {
            console.error('Error getting ticket approximate location:', error);
            return null;
        }
    }

    /**
     * Find addresses near specific coordinates
     * @param {number} latitude - Latitude
     * @param {number} longitude - Longitude
     * @param {number} maxDistance - Maximum distance in meters
     * @param {number} maxResults - Maximum number of results
     * @returns {Promise<Array>} - Nearby addresses
     */
    async findAddressesNearCoordinates(latitude, longitude, maxDistance = 5000, maxResults = 5) {
        try {
            // Use Haversine formula to calculate distances
            const query = `
                SELECT 
                    a.addressId,
                    a.addressNumber,
                    a.addressCardinal,
                    a.addressStreet,
                    a.addressSuffix,
                    a.latitude,
                    a.longitude,
                    a.placeid,
                    CONCAT(
                        COALESCE(a.addressNumber, ''), ' ',
                        COALESCE(a.addressCardinal, ''), ' ',
                        COALESCE(a.addressStreet, ''), ' ',
                        COALESCE(a.addressSuffix, '')
                    ) as fullAddress,
                    -- Calculate distance in meters using Haversine formula
                    (
                        6371000 * acos(
                            cos(radians($1)) * cos(radians(a.latitude)) * 
                            cos(radians(a.longitude) - radians($2)) + 
                            sin(radians($1)) * sin(radians(a.latitude))
                        )
                    ) as distance,
                    -- Calculate distance score (closer = higher score)
                    GREATEST(0, 1 - (
                        (
                            6371000 * acos(
                                cos(radians($1)) * cos(radians(a.latitude)) * 
                                cos(radians(a.longitude) - radians($2)) + 
                                sin(radians($1)) * sin(radians(a.latitude))
                            )
                        ) / $3
                    )) as distanceScore
                FROM Addresses a
                WHERE a.deletedAt IS NULL
                    AND a.latitude IS NOT NULL 
                    AND a.longitude IS NOT NULL
                    AND (
                        6371000 * acos(
                            cos(radians($1)) * cos(radians(a.latitude)) * 
                            cos(radians(a.longitude) - radians($2)) + 
                            sin(radians($1)) * sin(radians(a.latitude))
                        )
                    ) <= $3
                ORDER BY distance ASC
                LIMIT $4
            `;

            const result = await db.query(query, [latitude, longitude, maxDistance, maxResults]);
            return result.rows;

        } catch (error) {
            console.error('Error finding addresses near coordinates:', error);
            return [];
        }
    }

    /**
     * Find addresses in the same quadrant as the ticket
     * @param {number} ticketId - Ticket ID
     * @param {number} maxResults - Maximum number of results
     * @returns {Promise<Array>} - Addresses in same quadrant
     */
    async findAddressesInSameQuadrant(ticketId, maxResults = 5) {
        try {
            const query = `
                SELECT 
                    a.addressId,
                    a.addressNumber,
                    a.addressCardinal,
                    a.addressStreet,
                    a.addressSuffix,
                    a.latitude,
                    a.longitude,
                    a.placeid,
                    CONCAT(
                        COALESCE(a.addressNumber, ''), ' ',
                        COALESCE(a.addressCardinal, ''), ' ',
                        COALESCE(a.addressStreet, ''), ' ',
                        COALESCE(a.addressSuffix, '')
                    ) as fullAddress,
                    0.5 as distanceScore
                FROM Tickets t1
                JOIN Tickets t2 ON t1.quadrantId = t2.quadrantId AND t2.deletedAt IS NULL
                JOIN TicketAddresses ta ON t2.ticketId = ta.ticketId AND ta.deletedAt IS NULL
                JOIN Addresses a ON ta.addressId = a.addressId AND a.deletedAt IS NULL
                WHERE t1.ticketId = $1 
                    AND t1.deletedAt IS NULL
                    AND a.latitude IS NOT NULL 
                    AND a.longitude IS NOT NULL
                ORDER BY a.addressStreet, a.addressNumber
                LIMIT $2
            `;

            const result = await db.query(query, [ticketId, maxResults]);
            return result.rows;

        } catch (error) {
            console.error('Error finding addresses in same quadrant:', error);
            return [];
        }
    }

    /**
     * Find addresses with similar street names
     * @param {string} partialAddress - Partial address
     * @param {number} maxResults - Maximum number of results
     * @returns {Promise<Array>} - Street name matches
     */
    async findStreetNameMatches(partialAddress, maxResults = 5) {
        try {
            // Extract street name from partial address
            const parsed = this.parseAddressForLookup(partialAddress);
            if (!parsed.addressStreet) return [];

            const query = `
                SELECT 
                    a.addressId,
                    a.addressNumber,
                    a.addressCardinal,
                    a.addressStreet,
                    a.addressSuffix,
                    a.latitude,
                    a.longitude,
                    a.placeid,
                    CONCAT(
                        COALESCE(a.addressNumber, ''), ' ',
                        COALESCE(a.addressCardinal, ''), ' ',
                        COALESCE(a.addressStreet, ''), ' ',
                        COALESCE(a.addressSuffix, '')
                    ) as fullAddress,
                    -- Calculate street name similarity
                    CASE 
                        WHEN LOWER(a.addressStreet) = LOWER($1) THEN 1.0
                        WHEN LOWER(a.addressStreet) LIKE LOWER($2) THEN 0.8
                        WHEN LOWER(a.addressStreet) LIKE LOWER($3) THEN 0.6
                        ELSE 0.3
                    END as streetSimilarity
                FROM Addresses a
                WHERE a.deletedAt IS NULL
                    AND (
                        LOWER(a.addressStreet) = LOWER($1) OR
                        LOWER(a.addressStreet) LIKE LOWER($2) OR
                        LOWER(a.addressStreet) LIKE LOWER($3)
                    )
                ORDER BY streetSimilarity DESC, a.addressStreet, a.addressNumber
                LIMIT $4
            `;

            const streetName = parsed.addressStreet;
            const startsWith = `${streetName}%`;
            const contains = `%${streetName}%`;

            const result = await db.query(query, [streetName, startsWith, contains, maxResults]);
            return result.rows;

        } catch (error) {
            console.error('Error finding street name matches:', error);
            return [];
        }
    }

    /**
     * Find addresses with similar address numbers
     * @param {string} partialAddress - Partial address
     * @param {number} maxResults - Maximum number of results
     * @returns {Promise<Array>} - Address number matches
     */
    async findAddressNumberMatches(partialAddress, maxResults = 5) {
        try {
            // Extract address number from partial address
            const parsed = this.parseAddressForLookup(partialAddress);
            if (!parsed.addressNumber) return [];

            const addressNumber = parseInt(parsed.addressNumber);
            if (isNaN(addressNumber)) return [];

            // Find addresses with similar numbers (within range)
            const range = 100; // Look for numbers within ±100
            const query = `
                SELECT 
                    a.addressId,
                    a.addressNumber,
                    a.addressCardinal,
                    a.addressStreet,
                    a.addressSuffix,
                    a.latitude,
                    a.longitude,
                    a.placeid,
                    CONCAT(
                        COALESCE(a.addressNumber, ''), ' ',
                        COALESCE(a.addressCardinal, ''), ' ',
                        COALESCE(a.addressStreet, ''), ' ',
                        COALESCE(a.addressSuffix, '')
                    ) as fullAddress,
                    -- Calculate number similarity
                    GREATEST(0, 1 - ABS(CAST(a.addressNumber AS INTEGER) - $1) / $2) as numberSimilarity
                FROM Addresses a
                WHERE a.deletedAt IS NULL
                    AND a.addressNumber ~ '^[0-9]+$'
                    AND CAST(a.addressNumber AS INTEGER) BETWEEN $1 - $2 AND $1 + $2
                ORDER BY numberSimilarity DESC, a.addressStreet, a.addressNumber
                LIMIT $3
            `;

            const result = await db.query(query, [addressNumber, range, maxResults]);
            return result.rows;

        } catch (error) {
            console.error('Error finding address number matches:', error);
            return [];
        }
    }

    /**
     * Deduplicate address results from different matching methods
     * @param {Array} results - Array of address results
     * @returns {Array} - Deduplicated results
     */
    deduplicateAddressResults(results) {
        const seen = new Set();
        const deduplicated = [];

        for (const result of results) {
            const key = `${result.addressId}`;
            if (!seen.has(key)) {
                seen.add(key);
                deduplicated.push(result);
            } else {
                // If we've seen this address before, update confidence if higher
                const existing = deduplicated.find(r => r.addressId === result.addressId);
                if (existing && result.confidence > existing.confidence) {
                    existing.confidence = result.confidence;
                    existing.method = result.method;
                }
            }
        }

        return deduplicated;
    }

    /**
     * Suggest addresses for a ticket without a valid address
     * @param {number} ticketId - Ticket ID
     * @param {string} partialAddress - Partial address information
     * @param {Object} options - Search options
     * @returns {Promise<Object>} - Address suggestions with metadata
     */
    async suggestAddressesForTicket(ticketId, partialAddress = null, options = {}) {
        try {
            console.log(`Suggesting addresses for ticket ${ticketId}`);

            const suggestions = await this.findSimilarAddresses(partialAddress, ticketId, options);
            
            // Get ticket information for context
            const ticket = await Tickets.findById(ticketId);
            
            const result = {
                ticketId: ticketId,
                ticketCode: ticket?.ticketcode || 'Unknown',
                partialAddress: partialAddress,
                suggestions: suggestions.map(suggestion => ({
                    addressId: suggestion.addressId,
                    fullAddress: suggestion.fullAddress,
                    confidence: suggestion.confidence,
                    method: suggestion.method,
                    distance: suggestion.distance || null,
                    coordinates: suggestion.latitude && suggestion.longitude ? {
                        latitude: suggestion.latitude,
                        longitude: suggestion.longitude
                    } : null
                })),
                totalSuggestions: suggestions.length,
                bestMatch: suggestions.length > 0 ? suggestions[0] : null,
                searchMetadata: {
                    timestamp: new Date().toISOString(),
                    searchOptions: options
                }
            };

            console.log(`Generated ${suggestions.length} address suggestions for ticket ${ticketId}`);
            return result;

        } catch (error) {
            console.error('Error suggesting addresses for ticket:', error);
            return {
                ticketId: ticketId,
                suggestions: [],
                error: error.message
            };
        }
    }

    /**
     * Generate a proper route code with sequential numbering
     * @param {string} type - Route type (e.g., 'SPOTTER', 'CONCRETE', 'ASPHALT', 'default')
     * @returns {Promise<string>} - Generated route code like 'ROUTE-001', 'SPOT-2024-001', etc.
     */
    async generateRouteCode(type = 'default') {
        try {
            // Get the current year
            const currentYear = new Date().getFullYear();
            
            // Get the next route number for this type and year
            const nextNumber = await this.getNextRouteNumber(type, currentYear);
            
            // Format the number with leading zeros (3 digits)
            const formattedNumber = nextNumber.toString().padStart(3, '0');
            
            // Generate route code based on type using abbreviated codes
            if (type.toUpperCase() === 'SPOTTER') {
                return `SPOT-${currentYear}-${formattedNumber}`;
            } else if (type.toUpperCase() === 'CONCRETE') {
                return `CONC-${currentYear}-${formattedNumber}`;
            } else if (type.toUpperCase() === 'ASPHALT') {
                return `ASP-${currentYear}-${formattedNumber}`;
            } else {
                return `ROUTE-${formattedNumber}`;
            }
        } catch (error) {
            console.error('Error generating route code:', error);
            // Better fallback - use random number instead of timestamp
            const fallbackNumber = Math.floor(Math.random() * 999) + 1;
            const formattedFallback = fallbackNumber.toString().padStart(3, '0');
            return `ROUTE-${formattedFallback}`;
        }
    }

    /**
     * Get the next route number for a specific type and year
     * @param {string} type - Route type
     * @param {number} year - Year
     * @returns {Promise<number>} - Next route number
     */
    async getNextRouteNumber(type, year) {
        try {
            // Query to get the highest route number for this type and year
            let query;
            let params;
            
            if (type.toUpperCase() === 'SPOTTER') {
                query = `
                    SELECT COUNT(*) as count 
                    FROM Routes 
                    WHERE type = $1 
                    AND EXTRACT(YEAR FROM createdAt) = $2 
                    AND deletedAt IS NULL
                `;
                params = [type.toUpperCase(), year];
            } else if (type.toUpperCase() === 'CONCRETE') {
                query = `
                    SELECT COUNT(*) as count 
                    FROM Routes 
                    WHERE type = $1 
                    AND EXTRACT(YEAR FROM createdAt) = $2 
                    AND deletedAt IS NULL
                `;
                params = [type.toUpperCase(), year];
            } else if (type.toUpperCase() === 'ASPHALT') {
                query = `
                    SELECT COUNT(*) as count 
                    FROM Routes 
                    WHERE type = $1 
                    AND EXTRACT(YEAR FROM createdAt) = $2 
                    AND deletedAt IS NULL
                `;
                params = [type.toUpperCase(), year];
            } else {
                // For default type, just count all routes
                query = `
                    SELECT COUNT(*) as count 
                    FROM Routes 
                    WHERE deletedAt IS NULL
                `;
                params = [];
            }
            
            const result = await db.query(query, params);
            const currentCount = parseInt(result.rows[0].count);
            
            return currentCount + 1;
        } catch (error) {
            console.error('Error getting next route number:', error);
            return 1; // Fallback to 1 if there's an error
        }
    }

    /**
     * Cancel a route by removing endingDate from all ticket statuses
     * @param {number} routeId - Route ID
     * @param {Array<number>} ticketIds - Array of ticket IDs in the route
     * @param {number} updatedBy - User ID
     * @returns {Promise<Object>} - Result of the cancellation operation
     */
    async cancelRoute(routeId, ticketIds, updatedBy = 1) {
        try {
            console.log(`Canceling route ${routeId} with ${ticketIds.length} tickets`);

            // Start a transaction
            const client = await db.pool.connect();
            
            try {
                await client.query('BEGIN');

                // 1. Update all ticket statuses to remove endingDate (set to NULL)
                const ticketStatusResult = await client.query(`
                    UPDATE TicketStatus 
                    SET endingDate = NULL, 
                        updatedAt = CURRENT_TIMESTAMP, 
                        updatedBy = $1 
                    WHERE ticketId = ANY($2) 
                        AND deletedAt IS NULL
                    RETURNING taskStatusId, ticketId, endingDate
                `, [updatedBy, ticketIds]);

                const updatedTicketStatuses = ticketStatusResult.rows.length;

                // 2. Update the route's endDate to NULL (mark as not completed)
                const routeResult = await client.query(`
                    UPDATE Routes 
                    SET endDate = NULL, 
                        updatedAt = CURRENT_TIMESTAMP, 
                        updatedBy = $1 
                    WHERE routeId = $2 
                        AND deletedAt IS NULL
                    RETURNING routeId, endDate
                `, [updatedBy, routeId]);

                await client.query('COMMIT');

                console.log(`Updated ${updatedTicketStatuses} ticket statuses and route ${routeId} for cancellation`);

                return {
                    routeId: routeId,
                    message: `Route canceled successfully. Updated ${updatedTicketStatuses} ticket statuses.`,
                    updatedTicketStatuses: updatedTicketStatuses,
                    totalTickets: ticketIds.length,
                    routeUpdated: routeResult.rows.length > 0,
                    timestamp: new Date().toISOString()
                };

            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }

        } catch (error) {
            console.error('Failed to cancel route:', error);
            throw error;
        }
    }

    /**
     * Cancel a spotting route - soft delete route and reset SPOTTING status
     * @param {number} routeId - Route ID
     * @param {Array<number>} ticketIds - Array of ticket IDs in the route
     * @param {number} updatedBy - User ID
     * @returns {Promise<Object>} - Result of the cancellation operation
     */
    async cancelSpottingRoute(routeId, ticketIds, updatedBy = 1) {
        try {
            console.log(`Canceling spotting route ${routeId} with ${ticketIds.length} tickets`);

            // Start a transaction
            const client = await db.pool.connect();
            
            try {
                await client.query('BEGIN');

                // 1. Reset SPOTTING status endingDate to NULL for all tickets
                const spottingStatusResult = await client.query(`
                    UPDATE TicketStatus 
                    SET endingDate = NULL, 
                        updatedAt = CURRENT_TIMESTAMP, 
                        updatedBy = $1 
                    WHERE ticketId = ANY($2) 
                        AND taskStatusId = (SELECT taskStatusId FROM TaskStatus WHERE name = 'Spotting' AND deletedAt IS NULL)
                        AND deletedAt IS NULL
                    RETURNING taskStatusId, ticketId, endingDate
                `, [updatedBy, ticketIds]);

                const updatedSpottingStatuses = spottingStatusResult.rows.length;

                // 2. Soft delete the route
                const routeResult = await client.query(`
                    UPDATE Routes 
                    SET deletedAt = CURRENT_TIMESTAMP, 
                        updatedAt = CURRENT_TIMESTAMP, 
                        updatedBy = $1 
                    WHERE routeId = $2 
                        AND type = 'SPOTTER'
                        AND deletedAt IS NULL
                    RETURNING routeId, deletedAt
                `, [updatedBy, routeId]);

                // 3. Soft delete all RouteTickets associations
                const routeTicketsResult = await client.query(`
                    UPDATE RouteTickets 
                    SET deletedAt = CURRENT_TIMESTAMP, 
                        updatedAt = CURRENT_TIMESTAMP, 
                        updatedBy = $1 
                    WHERE routeId = $2 
                        AND deletedAt IS NULL
                    RETURNING routeId, ticketId, deletedAt
                `, [updatedBy, routeId]);

                await client.query('COMMIT');

                console.log(`Canceled spotting route ${routeId}: ${updatedSpottingStatuses} SPOTTING statuses reset, route soft deleted`);

                return {
                    routeId: routeId,
                    message: `Spotting route canceled successfully. Reset ${updatedSpottingStatuses} SPOTTING statuses and soft deleted route.`,
                    updatedSpottingStatuses: updatedSpottingStatuses,
                    totalTickets: ticketIds.length,
                    routeSoftDeleted: routeResult.rows.length > 0,
                    routeTicketsSoftDeleted: routeTicketsResult.rows.length,
                    timestamp: new Date().toISOString()
                };

            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }

        } catch (error) {
            console.error('Failed to cancel spotting route:', error);
            throw error;
        }
    }

    /**
     * Cancel a concrete route - soft delete route and reset SAWCUT status
     * @param {number} routeId - Route ID
     * @param {Array<number>} ticketIds - Array of ticket IDs in the route
     * @param {number} updatedBy - User ID
     * @returns {Promise<Object>} - Result of the cancellation operation
     */
    async cancelConcreteRoute(routeId, ticketIds, updatedBy = 1) {
        try {
            console.log(`Canceling concrete route ${routeId} with ${ticketIds.length} tickets`);

            // Start a transaction
            const client = await db.pool.connect();
            
            try {
                await client.query('BEGIN');

                // 1. Reset SAWCUT status endingDate to NULL for all tickets
                const sawcutStatusResult = await client.query(`
                    UPDATE TicketStatus 
                    SET endingDate = NULL, 
                        updatedAt = CURRENT_TIMESTAMP, 
                        updatedBy = $1 
                    WHERE ticketId = ANY($2) 
                        AND taskStatusId = (SELECT taskStatusId FROM TaskStatus WHERE name = 'Sawcut' AND deletedAt IS NULL)
                        AND deletedAt IS NULL
                    RETURNING taskStatusId, ticketId, endingDate
                `, [updatedBy, ticketIds]);

                const updatedSawcutStatuses = sawcutStatusResult.rows.length;

                // 2. Soft delete the route
                const routeResult = await client.query(`
                    UPDATE Routes 
                    SET deletedAt = CURRENT_TIMESTAMP, 
                        updatedAt = CURRENT_TIMESTAMP, 
                        updatedBy = $1 
                    WHERE routeId = $2 
                        AND type = 'CONCRETE'
                        AND deletedAt IS NULL
                    RETURNING routeId, deletedAt
                `, [updatedBy, routeId]);

                // 3. Soft delete all RouteTickets associations
                const routeTicketsResult = await client.query(`
                    UPDATE RouteTickets 
                    SET deletedAt = CURRENT_TIMESTAMP, 
                        updatedAt = CURRENT_TIMESTAMP, 
                        updatedBy = $1 
                    WHERE routeId = $2 
                        AND deletedAt IS NULL
                    RETURNING routeId, ticketId, deletedAt
                `, [updatedBy, routeId]);

                await client.query('COMMIT');

                console.log(`Canceled concrete route ${routeId}: ${updatedSawcutStatuses} SAWCUT statuses reset, route soft deleted`);

                return {
                    routeId: routeId,
                    message: `Concrete route canceled successfully. Reset ${updatedSawcutStatuses} SAWCUT statuses and soft deleted route.`,
                    updatedSawcutStatuses: updatedSawcutStatuses,
                    totalTickets: ticketIds.length,
                    routeSoftDeleted: routeResult.rows.length > 0,
                    routeTicketsSoftDeleted: routeTicketsResult.rows.length,
                    timestamp: new Date().toISOString()
                };

            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }

        } catch (error) {
            console.error('Failed to cancel concrete route:', error);
            throw error;
        }
    }

    /**
     * Cancel an asphalt route - soft delete route and reset FRAMING status
     * @param {number} routeId - Route ID
     * @param {Array<number>} ticketIds - Array of ticket IDs in the route
     * @param {number} updatedBy - User ID
     * @returns {Promise<Object>} - Result of the cancellation operation
     */
    async cancelAsphaltRoute(routeId, ticketIds, updatedBy = 1) {
        try {
            console.log(`Canceling asphalt route ${routeId} with ${ticketIds.length} tickets`);

            // Start a transaction
            const client = await db.pool.connect();
            
            try {
                await client.query('BEGIN');

                // 1. Reset FRAMING status endingDate to NULL for all tickets
                const framingStatusResult = await client.query(`
                    UPDATE TicketStatus 
                    SET endingDate = NULL, 
                        updatedAt = CURRENT_TIMESTAMP, 
                        updatedBy = $1 
                    WHERE ticketId = ANY($2) 
                        AND taskStatusId = (SELECT taskStatusId FROM TaskStatus WHERE name = 'Framing' AND deletedAt IS NULL)
                        AND deletedAt IS NULL
                    RETURNING taskStatusId, ticketId, endingDate
                `, [updatedBy, ticketIds]);

                const updatedFramingStatuses = framingStatusResult.rows.length;

                // 2. Soft delete the route
                const routeResult = await client.query(`
                    UPDATE Routes 
                    SET deletedAt = CURRENT_TIMESTAMP, 
                        updatedAt = CURRENT_TIMESTAMP, 
                        updatedBy = $1 
                    WHERE routeId = $2 
                        AND type = 'ASPHALT'
                        AND deletedAt IS NULL
                    RETURNING routeId, deletedAt
                `, [updatedBy, routeId]);

                // 3. Soft delete all RouteTickets associations
                const routeTicketsResult = await client.query(`
                    UPDATE RouteTickets 
                    SET deletedAt = CURRENT_TIMESTAMP, 
                        updatedAt = CURRENT_TIMESTAMP, 
                        updatedBy = $1 
                    WHERE routeId = $2 
                        AND deletedAt IS NULL
                    RETURNING routeId, ticketId, deletedAt
                `, [updatedBy, routeId]);

                await client.query('COMMIT');

                console.log(`Canceled asphalt route ${routeId}: ${updatedFramingStatuses} FRAMING statuses reset, route soft deleted`);

                return {
                    routeId: routeId,
                    message: `Asphalt route canceled successfully. Reset ${updatedFramingStatuses} FRAMING statuses and soft deleted route.`,
                    updatedFramingStatuses: updatedFramingStatuses,
                    totalTickets: ticketIds.length,
                    routeSoftDeleted: routeResult.rows.length > 0,
                    routeTicketsSoftDeleted: routeTicketsResult.rows.length,
                    timestamp: new Date().toISOString()
                };

            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }

        } catch (error) {
            console.error('Failed to cancel asphalt route:', error);
            throw error;
        }
    }

    /**
     * Complete a route by setting endingDate to current timestamp for all ticket statuses
     * @param {number} routeId - Route ID
     * @param {Array<number>} ticketIds - Array of ticket IDs in the route
     * @param {number} updatedBy - User ID
     * @returns {Promise<Object>} - Result of the completion operation
     */
    async completeRoute(routeId, ticketIds, updatedBy = 1) {
        try {
            console.log(`Completing route ${routeId} with ${ticketIds.length} tickets`);

            // Start a transaction
            const client = await db.pool.connect();
            
            try {
                await client.query('BEGIN');

                // 1. Update all ticket statuses to set endingDate to current timestamp
                const ticketStatusResult = await client.query(`
                    UPDATE TicketStatus 
                    SET endingDate = CURRENT_TIMESTAMP, 
                        updatedAt = CURRENT_TIMESTAMP, 
                        updatedBy = $1 
                    WHERE ticketId = ANY($2) 
                        AND deletedAt IS NULL
                    RETURNING taskStatusId, ticketId, endingDate
                `, [updatedBy, ticketIds]);

                const updatedTicketStatuses = ticketStatusResult.rows.length;

                // 2. Update the route's endDate to current timestamp (mark as completed)
                const routeResult = await client.query(`
                    UPDATE Routes 
                    SET endDate = CURRENT_DATE, 
                        updatedAt = CURRENT_TIMESTAMP, 
                        updatedBy = $1 
                    WHERE routeId = $2 
                        AND deletedAt IS NULL
                    RETURNING routeId, endDate
                `, [updatedBy, routeId]);

                await client.query('COMMIT');

                console.log(`Updated ${updatedTicketStatuses} ticket statuses and route ${routeId} for completion`);

                return {
                    routeId: routeId,
                    message: `Route completed successfully. Updated ${updatedTicketStatuses} ticket statuses.`,
                    updatedTicketStatuses: updatedTicketStatuses,
                    totalTickets: ticketIds.length,
                    routeUpdated: routeResult.rows.length > 0,
                    completionTimestamp: new Date().toISOString()
                };

            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }

        } catch (error) {
            console.error('Failed to complete route:', error);
            throw error;
        }
    }

    /**
     * Get detailed information about tickets in a route including their status
     * @param {number} routeId - Route ID
     * @returns {Promise<Object>} - Detailed route and ticket information
     */
    async getRouteTicketDetails(routeId) {
        try {
            console.log(`Getting detailed information for route ${routeId}`);

            // Get route information
            const routeResult = await db.query(`
                SELECT routeId, routeCode, type, startDate, endDate, createdAt, updatedAt
                FROM Routes 
                WHERE routeId = $1 AND deletedAt IS NULL
            `, [routeId]);

            if (routeResult.rows.length === 0) {
                throw new Error(`Route ${routeId} not found`);
            }

            const route = routeResult.rows[0];

            // Get tickets in the route with their status information
            const ticketsResult = await db.query(`
                SELECT 
                    rt.ticketId,
                    rt.address,
                    rt.queue,
                    t.ticketCode,
                    t.comment7d,
                    -- Get all task statuses for this ticket
                    COALESCE(
                        JSON_AGG(
                            JSONB_BUILD_OBJECT(
                                'taskStatusId', ts.taskStatusId,
                                'taskName', ts.name,
                                'startingDate', tks.startingDate,
                                'endingDate', tks.endingDate,
                                'observation', tks.observation,
                                'crewId', tks.crewId
                            )
                        ) FILTER (WHERE ts.taskStatusId IS NOT NULL),
                        '[]'::json
                    ) as taskStatuses
                FROM RouteTickets rt
                JOIN Tickets t ON rt.ticketId = t.ticketId AND t.deletedAt IS NULL
                LEFT JOIN TicketStatus tks ON t.ticketId = tks.ticketId AND tks.deletedAt IS NULL
                LEFT JOIN TaskStatus ts ON tks.taskStatusId = ts.taskStatusId AND ts.deletedAt IS NULL
                WHERE rt.routeId = $1 AND rt.deletedAt IS NULL
                GROUP BY rt.ticketId, rt.address, rt.queue, t.ticketCode, t.comment7d
                ORDER BY rt.queue ASC
            `, [routeId]);

            const tickets = ticketsResult.rows;

            // Check which tickets would appear in getSpottingTickets
            const spottingEligibleTickets = tickets.filter(ticket => {
                const taskStatuses = ticket.taskstatuses || [];
                
                // Check if ticket has SPOTTING status with NULL endingDate
                const hasSpottingInProgress = taskStatuses.some(status => 
                    status.taskName === 'Spotting' && status.endingDate === null
                );

                // Check if ticket meets comment7d criteria
                const hasValidComment = !ticket.comment7d || 
                                       ticket.comment7d === '' || 
                                       ticket.comment7d === 'TK - PERMIT EXTENDED';

                return hasSpottingInProgress && hasValidComment;
            });

            return {
                route: {
                    routeId: route.routeid,
                    routeCode: route.routecode,
                    type: route.type,
                    startDate: route.startdate,
                    endDate: route.enddate,
                    createdAt: route.createdat,
                    updatedAt: route.updatedat
                },
                tickets: {
                    total: tickets.length,
                    details: tickets.map(ticket => ({
                        ticketId: ticket.ticketid,
                        ticketCode: ticket.ticketcode,
                        address: ticket.address,
                        queue: ticket.queue,
                        comment7d: ticket.comment7d,
                        taskStatuses: ticket.taskstatuses || []
                    }))
                },
                analysis: {
                    spottingEligibleCount: spottingEligibleTickets.length,
                    spottingEligibleTickets: spottingEligibleTickets.map(ticket => ({
                        ticketId: ticket.ticketid,
                        ticketCode: ticket.ticketcode,
                        reason: 'Has SPOTTING status with NULL endingDate and valid comment7d'
                    })),
                    summary: {
                        routeType: route.type,
                        routeEndDate: route.enddate,
                        totalTickets: tickets.length,
                        ticketsWithSpottingStatus: tickets.filter(t => 
                            (t.taskstatuses || []).some(s => s.taskName === 'Spotting')
                        ).length,
                        ticketsWithCompletedSpotting: tickets.filter(t => 
                            (t.taskstatuses || []).some(s => s.taskName === 'Spotting' && s.endingDate !== null)
                        ).length,
                        ticketsWithInProgressSpotting: tickets.filter(t => 
                            (t.taskstatuses || []).some(s => s.taskName === 'Spotting' && s.endingDate === null)
                        ).length
                    }
                }
            };

        } catch (error) {
            console.error('Failed to get route ticket details:', error);
            throw error;
        }
    }

    /**
     * Try multiple VROOM algorithms and select the best result
     * @param {Object} vroomRequest - The VROOM request object
     * @returns {Promise<Object>} - Best VROOM response
     */
    async tryMultipleVroomAlgorithms(vroomRequest) {
        const algorithms = [
            { name: 'local_search', options: { exploration_level: 5, timeout: 10000 } },
            { name: 'genetic', options: { timeout: 15000 } },
            { name: 'simulated_annealing', options: { timeout: 12000 } }
        ];

        let bestResult = null;
        let bestCost = Infinity;

        for (const algo of algorithms) {
            try {
                console.log(`Trying VROOM algorithm: ${algo.name}`);
                
                const requestWithAlgo = {
                    ...vroomRequest,
                    options: {
                        ...vroomRequest.options,
                        algo: algo.name,
                        ...algo.options
                    }
                };

                const response = await axios.post(`${this.vroomBaseUrl}/`, requestWithAlgo, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 20000
                });

                if (response.data.code === 0 && response.data.routes.length > 0) {
                    const cost = response.data.routes[0].cost || 0;
                    console.log(`${algo.name} algorithm cost: ${cost}`);
                    
                    if (cost < bestCost) {
                        bestCost = cost;
                        bestResult = response.data;
                        console.log(`New best result with ${algo.name} algorithm`);
                    }
                }
            } catch (error) {
                console.warn(`Algorithm ${algo.name} failed:`, error.message);
            }
        }

        if (!bestResult) {
            throw new Error('All VROOM algorithms failed');
        }

        console.log(`Selected best result with cost: ${bestCost}`);
        return bestResult;
    }
}

module.exports = new RouteOptimizationService();