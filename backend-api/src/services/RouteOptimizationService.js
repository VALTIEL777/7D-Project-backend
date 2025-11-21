const axios = require('axios');
const http = require('http');
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
        this.osrmBaseUrl = process.env.OSRM_BASE_URL || process.env.OSRM_URL || 'http://osrm:5000';
        // Use VROOM for waypoint optimization
        this.vroomBaseUrl = process.env.VROOM_BASE_URL || process.env.VROOM_URL || 'http://vroom:3000';
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
     * Safely geocode an address by first checking the Addresses table for coordinates.
     * Falls back to Google Geocoding only when coordinates are missing.
     * @param {string} address
     * @returns {Promise<{address: string, latitude: number, longitude: number, placeId: string|null}>}
     */
    async geocodeAddressSafe(address) {
        // Try database first
        try {
            const existing = await this.getCoordinatesFromDatabase(address);
            if (existing && existing.latitude && existing.longitude) {
                return {
                    address,
                    latitude: Number(existing.latitude),
                    longitude: Number(existing.longitude),
                    placeId: existing.placeid || null
                };
            }
        } catch (err) {
            console.warn('Database coordinate lookup failed:', err.message);
        }

        // Fallback to Google Geocoding
        return await this.geocodeAddress(address);
    }

    /**
     * Attempt to find coordinates in the Addresses table using parsed components.
     * @param {string} fullAddress - e.g., "4039 W OGDEN AVE, Chicago, Illinois"
     * @returns {Promise<{latitude:number, longitude:number, placeid:string}|null>}
     */
    async getCoordinatesFromDatabase(fullAddress) {
        const parsed = this.parseAddressComponents(fullAddress);
        if (!parsed) return null;

        const query = `
            SELECT latitude, longitude, placeid
            FROM Addresses
            WHERE addressNumber = $1
              AND COALESCE(addressCardinal,'') = $2
              AND addressStreet = $3
              AND COALESCE(addressSuffix,'') = $4
              AND deletedAt IS NULL
            LIMIT 1
        `;

        const params = [
            parsed.addressNumber,
            parsed.addressCardinal,
            parsed.addressStreet,
            parsed.addressSuffix
        ];

        const res = await db.query(query, params);
        return res.rows[0] || null;
    }

    /**
     * Parse a full address string into table components.
     * Very simple parser for formats like:
     *   "4039 W OGDEN AVE, Chicago, Illinois"
     * @param {string} fullAddress
     * @returns {{addressNumber:string, addressCardinal:string, addressStreet:string, addressSuffix:string}|null}
     */
    parseAddressComponents(fullAddress) {
        if (!fullAddress || typeof fullAddress !== 'string') return null;

        // Remove trailing ", Chicago, Illinois" (or variants)
        const cleaned = fullAddress.replace(/,?\s*Chicago,?\s*Illinois.?$/i, '').trim();
        const parts = cleaned.split(/\s+/);
        if (parts.length < 2) return null;

        const addressNumber = parts[0];
        let addressCardinal = '';
        let addressStreet = '';
        let addressSuffix = '';

        const cardinals = new Set(['N','S','E','W','NORTH','SOUTH','EAST','WEST']);

        if (parts.length >= 3 && cardinals.has(parts[1].toUpperCase())) {
            addressCardinal = parts[1].toUpperCase().charAt(0); // Normalize to single-letter
            if (parts.length >= 3) {
                addressSuffix = parts[parts.length - 1].toUpperCase();
                addressStreet = parts.slice(2, parts.length - 1).join(' ').toUpperCase();
            }
        } else {
            addressCardinal = '';
            addressSuffix = parts[parts.length - 1].toUpperCase();
            addressStreet = parts.slice(1, parts.length - 1).join(' ').toUpperCase();
        }

        return {
            addressNumber,
            addressCardinal,
            addressStreet,
            addressSuffix
        };
    }

    /**
     * Optimizes a single route for one vehicle using the Google Maps Platform Routes API (ComputeRoutes).
     * This method handles the full process: geocoding addresses, calling the Routes API for optimization,
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

        // --- STEP 1: Geocode all addresses safely (DB first, then Google) ---
        // Geocode origin, destination and intermediates
        const [originGeo, destinationGeo, ...geocodedIntermediates] = await Promise.all([
            this.geocodeAddressSafe(originAddress),
            this.geocodeAddressSafe(destinationAddress),
            ...intermediateAddresses.map(address => this.geocodeAddressSafe(address))
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
            const vroomRoute = vroomResponse.routes[0];
            const optimizedOrder = vroomRoute.steps
                .filter(step => step.type === 'job')
                .map(step => step.job - 1); // VROOM job IDs are 1-based, convert to 0-based

            console.log('VROOM optimized order:', optimizedOrder);

            // --- STEP 3: Build coordinates string for OSRM with optimized order ---
            // Use origin, jobs in optimized order, and destination
            const optimizedCoordinates = [
                `${originGeo.longitude},${originGeo.latitude}`,
                ...optimizedOrder.map(index => {
                    const geo = geocodedIntermediates[index];
                    return `${geo.longitude},${geo.latitude}`;
                }),
                `${destinationGeo.longitude},${destinationGeo.latitude}`
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
                    vroom: vroomResponse,
                    osrm: osrmResponse.data
                } // Store both API responses for debugging/metadata
            };

        } catch (error) {
            console.error('Route optimization error:', error.response?.data || error.message);
            // Fallback to sequential order if VROOM fails
            console.log('Falling back to sequential order due to optimization error');
            const fallbackOrder = Array.from({ length: intermediateAddresses.length }, (_, i) => i);
            // Build coordinates string for OSRM with fallback order (include destination)
            const fallbackCoordinates = [
                `${originGeo.longitude},${originGeo.latitude}`,
                ...geocodedIntermediates.map(geo => `${geo.longitude},${geo.latitude}`),
                `${destinationGeo.longitude},${destinationGeo.latitude}`
            ];
            const coordinatesString = fallbackCoordinates.join(';');
            const osrmUrl = `${this.osrmBaseUrl}/route/v1/driving/${coordinatesString}?overview=full&steps=true&annotations=true&geometries=polyline`;
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
     * Get route polyline, distance, and duration for a fixed order (no optimization)
     * Includes origin and destination explicitly.
     * @param {string} originAddress
     * @param {string} destinationAddress
     * @param {Array<string>} addresses - ordered intermediate addresses
     * @returns {Promise<{encodedPolyline: string, totalDistance: number, totalDuration: number}>}
     */
    async getRouteForFixedOrder(originAddress, destinationAddress, addresses) {
        const [originGeo, destinationGeo, ...geocodedIntermediates] = await Promise.all([
            this.geocodeAddressSafe(originAddress),
            this.geocodeAddressSafe(destinationAddress),
            ...addresses.map(address => this.geocodeAddressSafe(address))
        ]);

        const coordinates = [
            `${originGeo.longitude},${originGeo.latitude}`,
            ...geocodedIntermediates.map(geo => `${geo.longitude},${geo.latitude}`),
            `${destinationGeo.longitude},${destinationGeo.latitude}`
        ];
        const coordinatesString = coordinates.join(';');
        const osrmUrl = `${this.osrmBaseUrl}/route/v1/driving/${coordinatesString}?overview=full&steps=true&annotations=true&geometries=polyline`;
        const osrmResponse = await axios.get(osrmUrl);
        const route = osrmResponse.data.routes[0];
        return {
            encodedPolyline: route.geometry,
            totalDistance: route.distance,
            totalDuration: route.duration
        };
    }

    /**
     * Optimizes routes for large numbers of locations by clustering them into groups of maximum 100 locations each.
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

            const { maxDistance = 30000, maxLocationsPerCluster = 100, minLocationsPerCluster = 20 } = options;

            console.log(`Starting location-based clustered route optimization for ${ticketIds.length} tickets`);
            console.log(`Clustering by unique locations (max ${maxLocationsPerCluster} locations per cluster)`);

            // Step 1: Get all ticket addresses in one database query (reuse from parent method)
            const ticketsWithAddresses = await this.getTicketsWithAddressesBatch(ticketIds, {
                autoSuggest: false, // Disable auto-suggest for clustering to avoid double geocoding
                minConfidence: 0.8
            });
            
            if (ticketsWithAddresses.length === 0) {
                throw new Error('No valid tickets found for clustering');
            }

            // Step 2: Cluster by unique locations using PostGIS (max 100 unique locations per cluster)
            const clusteringService = new LocationClusteringService();
            const clusters = await clusteringService.clusterLocations(ticketsWithAddresses, { 
                maxDistance,
                maxLocationsPerCluster,
                minLocationsPerCluster
            });
            
            console.log(`Created ${clusters.length} location-based clusters for optimization`);
            console.log(`Each cluster contains max ${maxLocationsPerCluster} unique locations with all their associated tickets`);

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

            // Step 2.5: Check if we need to use clustering (more than 100 unique locations)
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
            console.log(`=== DEBUG: Getting address for ticket ${ticket.ticketid} (${ticket.ticketcode}) ===`);
            
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

            console.log(`  - Found ${addressQuery.rows.length} address records for ticket ${ticket.ticketid}`);

            if (addressQuery.rows.length > 0) {
                const addr = addressQuery.rows[0];
                console.log(`  - Address details: ID=${addr.addressid}, Number=${addr.addressnumber}, Cardinal=${addr.addresscardinal}, Street=${addr.addressstreet}, Suffix=${addr.addressesuffix}`);
                
                // Use the fullAddress if available, otherwise construct it
                let addressString;
                if (addr.fulladdress) {
                    addressString = addr.fulladdress.trim();
                    console.log(`  - Using fullAddress from database: "${addressString}"`);
                } else {
                    // Fallback: construct address from individual components
                    const parts = [
                        addr.addressnumber,
                        addr.addresscardinal,
                        addr.addressstreet,
                        addr.addressesuffix
                    ].filter(Boolean); // Filter out null/undefined/empty strings

                    addressString = parts.join(', ').replace(/,(\s*,){1,}/g, ',').replace(/,$/, '').trim();
                    console.log(`  - Constructed address from parts: "${addressString}"`);
                }

                // Append "Chicago, Illinois" to all addresses for better geocoding accuracy
                const fullAddress = `${addressString}, Chicago, Illinois`;
                console.log(`  - Final address: "${fullAddress}"`);
                
                // If we have latitude and longitude, we can use them for more accurate geocoding
                if (addr.latitude && addr.longitude) {
                    const geoAddress = `${fullAddress} (${addr.latitude}, ${addr.longitude})`;
                    console.log(`  - Address with coordinates: "${geoAddress}"`);
                    return geoAddress;
                }

                return fullAddress;
            }
            
            console.log(`  - No address found in database for ticket ${ticket.ticketid}, using sample address`);
            
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
            
            console.log(`  - Generated sample address: "${fullAddress}"`);
            return fullAddress;
            
        } catch (error) {
            console.error(`=== DEBUG: Error getting address for ticket ${ticket.ticketid} (${ticket.ticketcode}) ===`);
            console.error(`  - Error details: ${error.message}`);
            console.error(`  - Error stack: ${error.stack}`);
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
     * Criteria: comment7d is NULL, empty, TK - PERMIT EXTENDED, TK - LAYOUT, or TK - LAY OUT, and SPOTTING status exists but has no endingDate (not completed)
     * Excludes tickets with permits expiring in less than 4 days
     * @returns {Promise<Array>} - Array of tickets eligible for spotting routes
     */
    async getSpottingTickets() {
        try {
            console.log('=== DEBUG: Starting getSpottingTickets ===');
            
            // First, get ALL tickets to see what we're working with
            const allTicketsQuery = await db.query(`
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
                ORDER BY t.ticketId ASC
            `);
            
            console.log(`=== DEBUG: Total tickets in system: ${allTicketsQuery.rows.length} ===`);
            
            // Check tickets excluded by comment7d criteria
            const excludedByCommentQuery = await db.query(`
                SELECT DISTINCT 
                    t.ticketId,
                    t.ticketCode,
                    t.comment7d
                FROM Tickets t
                WHERE t.deletedAt IS NULL
                    AND (
                        NOT (
                            t.comment7d IS NULL 
                            OR t.comment7d = '' 
                            OR t.comment7d ILIKE '%TK - PERMIT EXTENDED%'
                            OR t.comment7d ILIKE '%TK - LAYOUT%'
                            OR t.comment7d ILIKE '%TK - LAY OUT%'
                        )
                        OR (
                            t.comment7d IS NOT NULL
                            AND t.comment7d != ''
                            AND (
                                t.comment7d ILIKE '%TK - CANCELLED%'
                                OR t.comment7d ILIKE '%TK - HOLD OFF%'
                                OR t.comment7d ILIKE '%TK- ON HOLD OFF%'
                                OR t.comment7d ILIKE '%TK - ON HOLD OFF%'
                                OR t.comment7d ILIKE '%TK - COMPLETED%'
                                OR t.comment7d ILIKE '%TK - COMPLETE%'
                                OR t.comment7d ILIKE '%COMPLETED%'
                                OR t.comment7d ILIKE '%COMPLETE%'
                                OR t.comment7d ILIKE '%TK - EXPIRED%'
                                OR t.comment7d ILIKE '%TK - NEEDS PERMIT EXTENSION%'
                            )
                        )
                    )
                ORDER BY t.ticketId ASC
            `);
            
            console.log(`=== DEBUG: Tickets excluded by comment7d criteria: ${excludedByCommentQuery.rows.length} ===`);
            excludedByCommentQuery.rows.forEach(ticket => {
                console.log(`  - Ticket ${ticket.ticketid} (${ticket.ticketcode}): comment7d = "${ticket.comment7d}"`);
            });
            
            // Check tickets excluded by missing SPOTTING status
            const excludedByNoSpottingQuery = await db.query(`
                SELECT DISTINCT 
                    t.ticketId,
                    t.ticketCode,
                    t.comment7d
                FROM Tickets t
                WHERE t.deletedAt IS NULL
                    AND (
                        t.comment7d IS NULL 
                        OR t.comment7d = '' 
                        OR t.comment7d ILIKE '%TK - PERMIT EXTENDED%'
                        OR t.comment7d ILIKE '%TK - LAYOUT%'
                        OR t.comment7d ILIKE '%TK - LAY OUT%'
                    )
                    AND NOT EXISTS (
                        SELECT 1 FROM TicketStatus tks2 
                        JOIN TaskStatus ts2 ON tks2.taskStatusId = ts2.taskStatusId 
                        WHERE tks2.ticketId = t.ticketId 
                            AND ts2.name = 'Spotting'
                            AND tks2.deletedAt IS NULL
                            AND ts2.deletedAt IS NULL
                    )
                ORDER BY t.ticketId ASC
            `);
            
            console.log(`=== DEBUG: Tickets excluded by missing SPOTTING status: ${excludedByNoSpottingQuery.rows.length} ===`);
            excludedByNoSpottingQuery.rows.forEach(ticket => {
                console.log(`  - Ticket ${ticket.ticketid} (${ticket.ticketcode}): comment7d = "${ticket.comment7d}" - No SPOTTING status found`);
            });
            
            // Check tickets excluded by completed SPOTTING status
            const excludedByCompletedSpottingQuery = await db.query(`
                SELECT DISTINCT 
                    t.ticketId,
                    t.ticketCode,
                    t.comment7d,
                    tks2.endingdate as spottingEndDate
                FROM Tickets t
                JOIN TicketStatus tks2 ON tks2.ticketId = t.ticketId
                JOIN TaskStatus ts2 ON tks2.taskStatusId = ts2.taskStatusId 
                WHERE t.deletedAt IS NULL
                    AND (
                        t.comment7d IS NULL 
                        OR t.comment7d = '' 
                        OR t.comment7d ILIKE '%TK - PERMIT EXTENDED%'
                        OR t.comment7d ILIKE '%TK - LAYOUT%'
                        OR t.comment7d ILIKE '%TK - LAY OUT%'
                    )
                    AND (
                        t.comment7d IS NULL
                        OR t.comment7d = ''
                        OR (
                            COALESCE(t.comment7d, '') NOT ILIKE '%TK - CANCELLED%'
                            AND COALESCE(t.comment7d, '') NOT ILIKE '%TK - HOLD OFF%'
                            AND COALESCE(t.comment7d, '') NOT ILIKE '%TK- ON HOLD OFF%'
                            AND COALESCE(t.comment7d, '') NOT ILIKE '%TK - ON HOLD OFF%'
                            AND COALESCE(t.comment7d, '') NOT ILIKE '%TK - COMPLETED%'
                            AND COALESCE(t.comment7d, '') NOT ILIKE '%TK - COMPLETE%'
                            AND COALESCE(t.comment7d, '') NOT ILIKE '%COMPLETED%'
                            AND COALESCE(t.comment7d, '') NOT ILIKE '%COMPLETE%'
                        )
                    )
                    AND ts2.name = 'Spotting'
                    AND tks2.endingdate IS NOT NULL
                    AND tks2.deletedAt IS NULL
                    AND ts2.deletedAt IS NULL
                ORDER BY t.ticketId ASC
            `);
            
            console.log(`=== DEBUG: Tickets excluded by completed SPOTTING status: ${excludedByCompletedSpottingQuery.rows.length} ===`);
            excludedByCompletedSpottingQuery.rows.forEach(ticket => {
                console.log(`  - Ticket ${ticket.ticketid} (${ticket.ticketcode}): comment7d = "${ticket.comment7d}" - SPOTTING completed on ${ticket.spottingenddate}`);
            });
            
            // Check tickets excluded by already being in active routes
            const excludedByActiveRouteQuery = await db.query(`
                SELECT DISTINCT 
                    t.ticketId,
                    t.ticketCode,
                    t.comment7d,
                    r.routeId,
                    r.routeCode
                FROM Tickets t
                JOIN RouteTickets rt ON rt.ticketId = t.ticketId
                JOIN Routes r ON rt.routeId = r.routeId
                WHERE t.deletedAt IS NULL
                    AND (
                        t.comment7d IS NULL 
                        OR t.comment7d = '' 
                        OR t.comment7d ILIKE '%TK - PERMIT EXTENDED%'
                        OR t.comment7d ILIKE '%TK - LAYOUT%'
                        OR t.comment7d ILIKE '%TK - LAY OUT%'
                    )
                    AND r.type = 'SPOTTER'
                    AND r.deletedAt IS NULL
                    AND rt.deletedAt IS NULL
                ORDER BY t.ticketId ASC
            `);
            
            console.log(`=== DEBUG: Tickets excluded by already being in active SPOTTER routes: ${excludedByActiveRouteQuery.rows.length} ===`);
            excludedByActiveRouteQuery.rows.forEach(ticket => {
                console.log(`  - Ticket ${ticket.ticketid} (${ticket.ticketcode}): comment7d = "${ticket.comment7d}" - Already in route ${ticket.routeid} (${ticket.routecode})`);
            });
            
            // Check tickets excluded by permit expiration (less than 4 days remaining)
            const excludedByPermitExpirationQuery = await db.query(`
                SELECT DISTINCT 
                    t.ticketId,
                    t.ticketCode,
                    t.comment7d,
                    p.expireDate,
                    (p.expireDate::date - CURRENT_DATE::date) as days_until_expiry
                FROM Tickets t
                JOIN PermitedTickets pt ON t.ticketId = pt.ticketId AND pt.deletedAt IS NULL
                JOIN Permits p ON pt.permitId = p.PermitId AND p.deletedAt IS NULL
                WHERE t.deletedAt IS NULL
                    AND (
                        t.comment7d IS NULL 
                        OR t.comment7d = '' 
                        OR t.comment7d ILIKE '%TK - PERMIT EXTENDED%'
                        OR t.comment7d ILIKE '%TK - LAYOUT%'
                        OR t.comment7d ILIKE '%TK - LAY OUT%'
                    )
                    AND (
                        t.comment7d IS NULL
                        OR t.comment7d = ''
                        OR (
                            COALESCE(t.comment7d, '') NOT ILIKE '%TK - CANCELLED%'
                            AND COALESCE(t.comment7d, '') NOT ILIKE '%TK - HOLD OFF%'
                            AND COALESCE(t.comment7d, '') NOT ILIKE '%TK- ON HOLD OFF%'
                            AND COALESCE(t.comment7d, '') NOT ILIKE '%TK - ON HOLD OFF%'
                            AND COALESCE(t.comment7d, '') NOT ILIKE '%TK - COMPLETED%'
                            AND COALESCE(t.comment7d, '') NOT ILIKE '%TK - COMPLETE%'
                            AND COALESCE(t.comment7d, '') NOT ILIKE '%COMPLETED%'
                            AND COALESCE(t.comment7d, '') NOT ILIKE '%COMPLETE%'
                        )
                    )
                    AND EXISTS (
                        SELECT 1 FROM TicketStatus tks2 
                        JOIN TaskStatus ts2 ON tks2.taskStatusId = ts2.taskStatusId 
                        WHERE tks2.ticketId = t.ticketId 
                            AND ts2.name = 'Spotting'
                            AND tks2.endingdate IS NULL
                            AND tks2.deletedAt IS NULL
                            AND ts2.deletedAt IS NULL
                    )
                    AND NOT EXISTS (
                        SELECT 1 FROM RouteTickets rt
                        JOIN Routes r ON rt.routeId = r.routeId
                        WHERE rt.ticketId = t.ticketId
                            AND r.type = 'SPOTTER'
                            AND r.deletedAt IS NULL
                            AND rt.deletedAt IS NULL
                    )
                    AND p.expireDate IS NOT NULL
                    AND p.expireDate > CURRENT_DATE
                    AND (p.expireDate::date - CURRENT_DATE::date) < 4
                ORDER BY t.ticketId ASC
            `);
            
            console.log(`=== DEBUG: Tickets excluded by permit expiration (< 4 days): ${excludedByPermitExpirationQuery.rows.length} ===`);
            excludedByPermitExpirationQuery.rows.forEach(ticket => {
                console.log(`  - Ticket ${ticket.ticketid} (${ticket.ticketcode}): comment7d = "${ticket.comment7d}" - Permit expires in ${ticket.days_until_expiry} days on ${ticket.expiredate}`);
            });
            
            // Now get the final result with permit expiration filter
            const result = await db.query(`
                SELECT DISTINCT 
                    t.ticketId,
                    t.ticketCode,
                    COALESCE(NULLIF(t.contractNumber, ''), cu.name) AS contractNumber,
                    t.amountToPay,
                    t.ticketType,
                    t.daysOutstanding,
                    t.comment7d,
                    t.quantity,
                    t.createdAt,
                    t.updatedAt,
                    cu.name as contractUnitName,
                    i.name as incidentName,
                    perm.permitExpireDate AS expireDate
                FROM Tickets t
                LEFT JOIN ContractUnits cu ON t.contractUnitId = cu.contractUnitId AND cu.deletedAt IS NULL
                LEFT JOIN IncidentsMx i ON t.incidentId = i.incidentId AND i.deletedAt IS NULL
                LEFT JOIN (
                    SELECT pt.ticketId, MAX(p.expireDate) AS permitExpireDate
                    FROM PermitedTickets pt
                    JOIN Permits p ON pt.permitId = p.PermitId AND p.deletedAt IS NULL
                    WHERE pt.deletedAt IS NULL
                    GROUP BY pt.ticketId
                ) perm ON perm.ticketId = t.ticketId
                WHERE t.deletedAt IS NULL
                    AND (
                        t.comment7d IS NULL 
                        OR t.comment7d = '' 
                        OR t.comment7d ILIKE '%TK - PERMIT EXTENDED%'
                        OR t.comment7d ILIKE '%TK - LAYOUT%'
                        OR t.comment7d ILIKE '%TK - LAY OUT%'
                    )
                    AND (
                        t.comment7d IS NULL
                        OR t.comment7d = ''
                        OR (
                            COALESCE(t.comment7d, '') NOT ILIKE '%TK - CANCELLED%' 
                            AND COALESCE(t.comment7d, '') NOT ILIKE '%TK - HOLD OFF%' 
                            AND COALESCE(t.comment7d, '') NOT ILIKE '%TK- ON HOLD OFF%' 
                            AND COALESCE(t.comment7d, '') NOT ILIKE '%TK - ON HOLD OFF%' 
                            AND COALESCE(t.comment7d, '') NOT ILIKE '%TK - COMPLETED%' 
                            AND COALESCE(t.comment7d, '') NOT ILIKE '%TK - COMPLETE%' 
                            AND COALESCE(t.comment7d, '') NOT ILIKE '%COMPLETED%' 
                            AND COALESCE(t.comment7d, '') NOT ILIKE '%COMPLETE%'
                            AND COALESCE(t.comment7d, '') NOT ILIKE '%TK - EXPIRED%'
                            AND COALESCE(t.comment7d, '') NOT ILIKE '%TK - NEEDS PERMIT EXTENSION%'
                        )
                    )
                    AND EXISTS (
                        SELECT 1 FROM TicketStatus tks2 
                        JOIN TaskStatus ts2 ON tks2.taskStatusId = ts2.taskStatusId 
                        WHERE tks2.ticketId = t.ticketId 
                            AND ts2.name = 'Spotting'
                            AND tks2.endingdate IS NULL
                            AND tks2.deletedAt IS NULL
                            AND ts2.deletedAt IS NULL
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
                    AND (
                        -- Exclude tickets with permits that expire in less than 4 days
                        NOT EXISTS (
                            SELECT 1 FROM PermitedTickets pt
                            JOIN Permits p ON pt.permitId = p.PermitId
                            WHERE pt.ticketId = t.ticketId
                                AND pt.deletedAt IS NULL
                                AND p.deletedAt IS NULL
                                AND p.expireDate IS NOT NULL
                                AND p.expireDate > CURRENT_DATE
                                AND (p.expireDate::date - CURRENT_DATE::date) < 4
                        )
                    )
                ORDER BY t.ticketId ASC
            `);
            
            console.log(`=== DEBUG: Final tickets eligible for spotting routes: ${result.rows.length} ===`);
            result.rows.forEach(ticket => {
                console.log(`  + Ticket ${ticket.ticketid} (${ticket.ticketcode}): comment7d = "${ticket.comment7d}" - ELIGIBLE`);
            });
            
            console.log('=== DEBUG: Finished getSpottingTickets ===');
            
            return result.rows;
        } catch (error) {
            console.error('Error getting spotting tickets:', error);
            throw error;
        }
    }

    /**
     * Get tickets for concrete routes
     * Criteria: SPOTTING completed (has endingDate) and has SAWCUT status
     * Excludes tickets with permits expiring in less than 4 days
     * @returns {Promise<Array>} - Array of tickets eligible for concrete routes
     */
    async getConcreteTickets() {
        try {
            const result = await db.query(`
            SELECT DISTINCT 
                t.ticketId,
                t.ticketCode,
                COALESCE(NULLIF(t.contractNumber, ''), cu.name) AS contractNumber,
                t.amountToPay,
                t.ticketType,
                t.daysOutstanding,
                t.comment7d,
                t.quantity,
                t.createdAt,
                t.updatedAt,
                cu.name as contractUnitName,
                i.name as incidentName,
                perm.permitExpireDate AS expireDate
            FROM Tickets t
            LEFT JOIN ContractUnits cu ON t.contractUnitId = cu.contractUnitId AND cu.deletedAt IS NULL
            LEFT JOIN IncidentsMx i ON t.incidentId = i.incidentId AND i.deletedAt IS NULL
            LEFT JOIN (
                SELECT pt.ticketId, MAX(p.expireDate) AS permitExpireDate
                FROM PermitedTickets pt
                JOIN Permits p ON pt.permitId = p.PermitId AND p.deletedAt IS NULL
                WHERE pt.deletedAt IS NULL
                GROUP BY pt.ticketId
            ) perm ON perm.ticketId = t.ticketId
            WHERE t.deletedAt IS NULL
            AND (
                -- Include comment7d values with flexible matching (allows text before and after)
                t.comment7d IS NULL 
                OR t.comment7d = '' 
                OR t.comment7d ILIKE '%TK - PERMIT EXTENDED%'
                OR t.comment7d ILIKE '%TK - LAYOUT%'
                OR t.comment7d ILIKE '%TK - LAY OUT%'
                OR t.comment7d ILIKE '%TK - ON PROGRESS%'
                OR t.comment7d ILIKE '%TK- ON PROGRESS%'
            )
            AND (
                -- Exclude tickets with hold-off and other exclusion comments
                t.comment7d NOT ILIKE '%TK - CANCELLED%' 
                AND t.comment7d NOT ILIKE '%TK - HOLD OFF%' 
                AND t.comment7d NOT ILIKE '%TK- ON HOLD OFF%' 
                AND t.comment7d NOT ILIKE '%TK - ON HOLD OFF%' 
                AND t.comment7d NOT ILIKE '%TK - COMPLETED%' 
                AND t.comment7d NOT ILIKE '%TK - COMPLETE%' 
                AND t.comment7d NOT ILIKE '%COMPLETED%' 
                AND t.comment7d NOT ILIKE '%COMPLETE%'
                AND t.comment7d NOT ILIKE '%TK - EXPIRED%'
                AND t.comment7d NOT ILIKE '%TK - NEEDS PERMIT EXTENSION%'
            )
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
                -- Sawcut is the first incomplete phase
                (
                EXISTS (SELECT 1 FROM TicketStatus tks2 JOIN TaskStatus ts2 ON tks2.taskStatusId = ts2.taskStatusId WHERE tks2.ticketId = t.ticketId AND ts2.name = 'Sawcut' AND tks2.endingdate IS NULL AND tks2.deletedAt IS NULL AND ts2.deletedAt IS NULL)
                )
                OR
                -- Removal is the first incomplete phase
                (
                EXISTS (SELECT 1 FROM TicketStatus tks3 JOIN TaskStatus ts3 ON tks3.taskStatusId = ts3.taskStatusId WHERE tks3.ticketId = t.ticketId AND ts3.name = 'Removal' AND tks3.endingdate IS NULL AND tks3.deletedAt IS NULL AND ts3.deletedAt IS NULL)
                AND EXISTS (SELECT 1 FROM TicketStatus tks2 JOIN TaskStatus ts2 ON tks2.taskStatusId = ts2.taskStatusId WHERE tks2.ticketId = t.ticketId AND ts2.name = 'Sawcut' AND tks2.endingdate IS NOT NULL AND tks2.deletedAt IS NULL AND ts2.deletedAt IS NULL)
                )
                OR
                -- Framing is the first incomplete phase
                (
                EXISTS (SELECT 1 FROM TicketStatus tks4 JOIN TaskStatus ts4 ON tks4.taskStatusId = ts4.taskStatusId WHERE tks4.ticketId = t.ticketId AND ts4.name = 'Framing' AND tks4.endingdate IS NULL AND tks4.deletedAt IS NULL AND ts4.deletedAt IS NULL)
                AND EXISTS (SELECT 1 FROM TicketStatus tks2 JOIN TaskStatus ts2 ON tks2.taskStatusId = ts2.taskStatusId WHERE tks2.ticketId = t.ticketId AND ts2.name = 'Sawcut' AND tks2.endingdate IS NOT NULL AND tks2.deletedAt IS NULL AND ts2.deletedAt IS NULL)
                AND EXISTS (SELECT 1 FROM TicketStatus tks3 JOIN TaskStatus ts3 ON tks3.taskStatusId = ts3.taskStatusId WHERE tks3.ticketId = t.ticketId AND ts3.name = 'Removal' AND tks3.endingdate IS NOT NULL AND tks3.deletedAt IS NULL AND ts3.deletedAt IS NULL)
                )
                OR
                -- Pour is the first incomplete phase
                (
                EXISTS (SELECT 1 FROM TicketStatus tks5 JOIN TaskStatus ts5 ON tks5.taskStatusId = ts5.taskStatusId WHERE tks5.ticketId = t.ticketId AND ts5.name = 'Pour' AND tks5.endingdate IS NULL AND tks5.deletedAt IS NULL AND ts5.deletedAt IS NULL)
                AND EXISTS (SELECT 1 FROM TicketStatus tks2 JOIN TaskStatus ts2 ON tks2.taskStatusId = ts2.taskStatusId WHERE tks2.ticketId = t.ticketId AND ts2.name = 'Sawcut' AND tks2.endingdate IS NOT NULL AND tks2.deletedAt IS NULL AND ts2.deletedAt IS NULL)
                AND EXISTS (SELECT 1 FROM TicketStatus tks3 JOIN TaskStatus ts3 ON tks3.taskStatusId = ts3.taskStatusId WHERE tks3.ticketId = t.ticketId AND ts3.name = 'Removal' AND tks3.endingdate IS NOT NULL AND tks3.deletedAt IS NULL AND ts3.deletedAt IS NULL)
                AND EXISTS (SELECT 1 FROM TicketStatus tks4 JOIN TaskStatus ts4 ON tks4.taskStatusId = ts4.taskStatusId WHERE tks4.ticketId = t.ticketId AND ts4.name = 'Framing' AND tks4.endingdate IS NOT NULL AND tks4.deletedAt IS NULL AND ts4.deletedAt IS NULL)
                )
                OR
                -- Clean is the first incomplete phase
                (
                EXISTS (SELECT 1 FROM TicketStatus tks6 JOIN TaskStatus ts6 ON tks6.taskStatusId = ts6.taskStatusId WHERE tks6.ticketId = t.ticketId AND ts6.name = 'Clean' AND tks6.endingdate IS NULL AND tks6.deletedAt IS NULL AND ts6.deletedAt IS NULL)
                AND EXISTS (SELECT 1 FROM TicketStatus tks2 JOIN TaskStatus ts2 ON tks2.taskStatusId = ts2.taskStatusId WHERE tks2.ticketId = t.ticketId AND ts2.name = 'Sawcut' AND tks2.endingdate IS NOT NULL AND tks2.deletedAt IS NULL AND ts2.deletedAt IS NULL)
                AND EXISTS (SELECT 1 FROM TicketStatus tks3 JOIN TaskStatus ts3 ON tks3.taskStatusId = ts3.taskStatusId WHERE tks3.ticketId = t.ticketId AND ts3.name = 'Removal' AND tks3.endingdate IS NOT NULL AND tks3.deletedAt IS NULL AND ts3.deletedAt IS NULL)
                AND EXISTS (SELECT 1 FROM TicketStatus tks4 JOIN TaskStatus ts4 ON tks4.taskStatusId = ts4.taskStatusId WHERE tks4.ticketId = t.ticketId AND ts4.name = 'Framing' AND tks4.endingdate IS NOT NULL AND tks4.deletedAt IS NULL AND ts4.deletedAt IS NULL)
                AND EXISTS (SELECT 1 FROM TicketStatus tks5 JOIN TaskStatus ts5 ON tks5.taskStatusId = ts5.taskStatusId WHERE tks5.ticketId = t.ticketId AND ts5.name = 'Pour' AND tks5.endingdate IS NOT NULL AND tks5.deletedAt IS NULL AND ts5.deletedAt IS NULL)
                )
            )
            AND NOT EXISTS (
                -- Exclude tickets where all phases are completed
                SELECT 1 FROM TicketStatus tks7 JOIN TaskStatus ts7 ON tks7.taskStatusId = ts7.taskStatusId WHERE tks7.ticketId = t.ticketId AND ts7.name = 'Clean' AND tks7.endingdate IS NOT NULL AND tks7.deletedAt IS NULL AND ts7.deletedAt IS NULL
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
            AND (
                -- Exclude tickets with permits that expire in less than 4 days
                NOT EXISTS (
                    SELECT 1 FROM PermitedTickets pt
                    JOIN Permits p ON pt.permitId = p.PermitId
                    WHERE pt.ticketId = t.ticketId
                        AND pt.deletedAt IS NULL
                        AND p.deletedAt IS NULL
                        AND p.expireDate IS NOT NULL
                        AND p.expireDate > CURRENT_DATE
                        AND (p.expireDate::date - CURRENT_DATE::date) < 4
                )
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
     * 3. comment7d must be TK- ON PROGRESS, TK - ON LAYOUT, TK - LAYOUT, or TK - LAY OUT
     * Excludes tickets with permits expiring in less than 4 days
     * @returns {Promise<Array>} - Array of tickets eligible for asphalt routes
     */
    async getAsphaltTickets() {
        try {
            const result = await db.query(`
                SELECT DISTINCT 
                    t.ticketId,
                    t.ticketCode,
                    COALESCE(NULLIF(t.contractNumber, ''), cu.name) AS contractNumber,
                    t.amountToPay,
                    t.ticketType,
                    t.daysOutstanding,
                    t.comment7d,
                    t.quantity,
                    t.createdAt,
                    t.updatedAt,
                    cu.name as contractUnitName,
                    i.name as incidentName,
                    perm.permitExpireDate AS expireDate
                FROM Tickets t
                LEFT JOIN ContractUnits cu ON t.contractUnitId = cu.contractUnitId AND cu.deletedAt IS NULL
                LEFT JOIN IncidentsMx i ON t.incidentId = i.incidentId AND i.deletedAt IS NULL
                LEFT JOIN (
                    SELECT pt.ticketId, MAX(p.expireDate) AS permitExpireDate
                    FROM PermitedTickets pt
                    JOIN Permits p ON pt.permitId = p.PermitId AND p.deletedAt IS NULL
                    WHERE pt.deletedAt IS NULL
                    GROUP BY pt.ticketId
                ) perm ON perm.ticketId = t.ticketId
                WHERE t.deletedAt IS NULL
                AND (
                    -- Include comment7d values with flexible matching (allows text before and after)
                    t.comment7d IS NULL
                    OR t.comment7d = ''
                    OR t.comment7d ILIKE '%TK - ON PROGRESS%'
                    OR t.comment7d ILIKE '%TK - ON LAYOUT%'
                    OR t.comment7d ILIKE '%TK - LAYOUT%'
                    OR t.comment7d ILIKE '%TK - LAY OUT%'
                    OR t.comment7d ILIKE '%TK- ON PROGRESS%'
                    OR t.comment7d ILIKE '%TK- ON LAYOUT%'
                    OR t.comment7d ILIKE '%TK- LAYOUT%'
                )
                AND (
                    -- Exclude tickets with hold-off and other exclusion comments
                    COALESCE(t.comment7d, '') NOT ILIKE '%TK - CANCELLED%'
                    AND COALESCE(t.comment7d, '') NOT ILIKE '%TK - HOLD OFF%'
                    AND COALESCE(t.comment7d, '') NOT ILIKE '%TK- ON HOLD OFF%'
                    AND COALESCE(t.comment7d, '') NOT ILIKE '%TK - ON HOLD OFF%'
                    AND COALESCE(t.comment7d, '') NOT ILIKE '%TK - COMPLETED%'
                    AND COALESCE(t.comment7d, '') NOT ILIKE '%TK - COMPLETE%'
                    AND COALESCE(t.comment7d, '') NOT ILIKE '%COMPLETED%'
                    AND COALESCE(t.comment7d, '') NOT ILIKE '%COMPLETE%'
                    AND COALESCE(t.comment7d, '') NOT ILIKE '%TK - EXPIRED%'
                    AND COALESCE(t.comment7d, '') NOT ILIKE '%TK - NEEDS PERMIT EXTENSION%'
                )
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
                    -- Must have at least one incomplete asphalt phase (Grind, Asphalt, or Crack Seal)
                    SELECT 1 FROM TicketStatus tks_asphalt 
                    JOIN TaskStatus ts_asphalt ON tks_asphalt.taskStatusId = ts_asphalt.taskStatusId 
                    WHERE tks_asphalt.ticketId = t.ticketId 
                    AND ts_asphalt.name IN ('Grind', 'Asphalt', 'Crack Seal')
                    AND tks_asphalt.endingdate IS NULL
                    AND tks_asphalt.deletedAt IS NULL
                    AND ts_asphalt.deletedAt IS NULL
                )
                AND NOT EXISTS (
                    -- Exclude tickets where all asphalt phases are completed
                    SELECT 1 FROM TicketStatus tks11 
                    JOIN TaskStatus ts11 ON tks11.taskStatusId = ts11.taskStatusId 
                    WHERE tks11.ticketId = t.ticketId 
                    AND ts11.name = 'Crack Seal'
                    AND tks11.endingdate IS NOT NULL
                    AND tks11.deletedAt IS NULL
                    AND ts11.deletedAt IS NULL
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
                AND NOT EXISTS (
                    -- Exclude asphalt tickets if there are concrete tickets in the same incident with incomplete Pour phase
                    SELECT 1 FROM Tickets t_concrete
                    JOIN TicketStatus tks_concrete ON t_concrete.ticketId = tks_concrete.ticketId
                    JOIN TaskStatus ts_concrete ON tks_concrete.taskStatusId = ts_concrete.taskStatusId
                    JOIN IncidentsMx i_concrete ON t_concrete.incidentId = i_concrete.incidentId AND i_concrete.deletedAt IS NULL
                    JOIN IncidentsMx i_current ON t.incidentId = i_current.incidentId AND i_current.deletedAt IS NULL
                    WHERE i_concrete.name = i_current.name
                    AND t_concrete.deletedAt IS NULL
                    AND ts_concrete.name = 'Pour'
                    AND tks_concrete.endingdate IS NULL
                    AND tks_concrete.deletedAt IS NULL
                    AND ts_concrete.deletedAt IS NULL
                )
                AND (
                    -- Exclude tickets with permits that expire in less than 4 days
                    NOT EXISTS (
                        SELECT 1 FROM PermitedTickets pt
                        JOIN Permits p ON pt.permitId = p.PermitId
                        WHERE pt.ticketId = t.ticketId
                            AND pt.deletedAt IS NULL
                            AND p.deletedAt IS NULL
                            AND p.expireDate IS NOT NULL
                            AND p.expireDate > CURRENT_DATE
                            AND (p.expireDate::date - CURRENT_DATE::date) < 4
                    )
                )
                GROUP BY 
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
                    cu.name,
                    i.name,
                    perm.permitExpireDate
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
            // Determine next queue based on current max (ignores soft-deleted rows already filtered in findByRouteId)
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

            // Get ticket details with addresses using the same logic as optimizeRouteWithTickets
            const ticketIds = routeTickets.map(rt => rt.ticketid);
            const ticketsWithAddresses = await this.getTicketsWithAddressesBatch(ticketIds, {
                autoSuggest: false, // Disable auto-suggest for reoptimization to avoid double geocoding
                minConfidence: 0.8
            });

            // Filter out tickets with invalid statuses before optimization
            const validTickets = ticketsWithAddresses.filter(ticket => {
                const comment7d = (ticket.comment7d || '').toLowerCase();
                
                // Check for cancellation or hold status
                if (comment7d.includes('tk - cancelled') || 
                    comment7d.includes('tk - hold off') || 
                    comment7d.includes('tk - on hold off')) {
                    console.log(`Filtering out ticket ${ticket.ticketcode} due to status: ${ticket.comment7d}`);
                    return false;
                }
                
                // Check for expired permit using SQL-provided days_until_expiry when available
                const due = ticket.days_until_expire ?? ticket.days_until_expiry; // support either alias
                if (due !== undefined && due !== null) {
                    const n = Number(due);
                    if (!Number.isNaN(n) && n < 0) {
                        console.log(`Filtering out ticket ${ticket.ticketcode} due to expired permit (days_until_expire=${n})`);
                        return false;
                    }
                }
                
                return true;
            });

            console.log(`Route ${routeId}: ${ticketsWithAddresses.length} total tickets, ${validTickets.length} valid tickets after filtering`);

            // Remove invalid tickets from the route
            const invalidTickets = ticketsWithAddresses.filter(ticket => !validTickets.includes(ticket));
            if (invalidTickets.length > 0) {
                console.log(`Removing ${invalidTickets.length} invalid tickets from route ${routeId}`);
                for (const ticket of invalidTickets) {
                    await RouteTickets.deleteByRouteAndTicket(routeId, ticket.ticketid, updatedBy);
                    console.log(`Removed ticket ${ticket.ticketcode} from route ${routeId} due to invalid status`);
                }
            }

            if (validTickets.length === 0) {
                throw new Error('No valid tickets found for route optimization after filtering invalid statuses');
            }

            if (validTickets.length === 0) {
                throw new Error('No valid addresses found for route optimization');
            }

            // Deduplicate addresses to optimize API calls (same logic as optimizeRouteWithTickets)
            const addressToTicketsMap = new Map(); // address -> array of tickets
            const uniqueAddresses = []; // array of unique addresses for API call
            
            for (const ticket of validTickets) {
                const address = ticket.address;
                if (!addressToTicketsMap.has(address)) {
                    addressToTicketsMap.set(address, []);
                    uniqueAddresses.push(address);
                }
                addressToTicketsMap.get(address).push(ticket);
            }

            console.log(`Reoptimizing route ${routeId}: ${validTickets.length} tickets deduplicated to ${uniqueAddresses.length} unique addresses`);

            // Optimize the route with unique addresses only
            const optimizedRouteResult = await this.optimizeRoute(
                originAddress,
                destinationAddress,
                uniqueAddresses
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

            // Map optimized order back to all tickets with proper queue positions
            let optimizedOrder = optimizedRouteResult.optimizedOrder || [];
            
            // If there's only one address and no optimized order, create a default order
            if (uniqueAddresses.length === 1 && optimizedOrder.length === 0) {
                optimizedOrder = [0];
                console.log('Single address detected, using default order [0]');
            }
            
            // Validate that optimizedOrder has valid indices
            if (optimizedOrder.length !== uniqueAddresses.length) {
                console.warn(`Optimized order length (${optimizedOrder.length}) doesn't match unique addresses length (${uniqueAddresses.length}), using sequential order`);
                optimizedOrder = Array.from({ length: uniqueAddresses.length }, (_, i) => i);
            }

            // Create final ticket order with queue positions (same logic as optimizeRouteWithTickets)
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
                        ticketId: ticket.ticketid,
                        queue: globalQueuePosition++
                    });
                }
            }

            // Update ticket queue positions based on optimization
            for (const ticket of reorderedTickets) {
                await RouteTickets.updateQueue(routeId, ticket.ticketId, ticket.queue, updatedBy);
            }

            console.log(`Route ${routeId} re-optimized successfully: ${reorderedTickets.length} tickets with ${uniqueAddresses.length} unique addresses`);

            return {
                routeId: routeId,
                message: 'Route re-optimized successfully',
                totalDistance: optimizedRouteResult.totalDistance,
                totalDuration: optimizedRouteResult.totalDuration,
                totalTickets: reorderedTickets.length,
                uniqueAddresses: uniqueAddresses.length,
                ticketsRemoved: invalidTickets.length,
                removedTickets: invalidTickets.map(t => ({
                    ticketId: t.ticketid,
                    ticketCode: t.ticketcode,
                    comment7d: t.comment7d,
                    reason: this.getTicketRemovalReason(t)
                })),
                addressDeduplication: {
                    originalTickets: validTickets.length,
                    uniqueAddresses: uniqueAddresses.length,
                    savings: validTickets.length - uniqueAddresses.length
                }
            };

        } catch (error) {
            console.error('Failed to re-optimize route:', error);
            throw error;
        }
    }

    /**
     * Get the reason why a ticket was removed from a route
     * @param {Object} ticket - Ticket object
     * @returns {string} - Removal reason
     */
    getTicketRemovalReason(ticket) {
        const comment7d = (ticket.comment7d || '').toLowerCase();
        const currentDate = new Date();
        
        // Check for cancellation or hold status
        if (comment7d.includes('tk - cancelled')) {
            return 'TICKET_CANCELLED';
        }
        if (comment7d.includes('tk - hold off') || comment7d.includes('tk - on hold off')) {
            return 'TICKET_ON_HOLD';
        }
        
        // Check for expired permit
        if (ticket.days_until_expire !== undefined && ticket.days_until_expire !== null) {
            const n = Number(ticket.days_until_expire);
            if (!Number.isNaN(n) && n < 0) return 'PERMIT_EXPIRED';
        }
        
        return 'UNKNOWN_REASON';
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
     * Generate a proper route code with sequential numbering and date
     * @param {string} type - Route type (e.g., 'SPOTTER', 'CONCRETE', 'ASPHALT', 'default')
     * @returns {Promise<string>} - Generated route code like 'ROUTE-001-2024-12-25', 'SPOT-2024-001-2024-12-25', etc.
     */
    async generateRouteCode(type = 'default') {
        try {
            // Get the current date components
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
            const currentDay = now.getDate().toString().padStart(2, '0');
            const dateString = `${currentYear}-${currentMonth}-${currentDay}`;
            
            // Get the next route number for this type and year
            const nextNumber = await this.getNextRouteNumber(type, currentYear);
            
            // Format the number with leading zeros (3 digits)
            const formattedNumber = nextNumber.toString().padStart(3, '0');
            
            // Generate route code based on type using abbreviated codes with date
            if (type.toUpperCase() === 'SPOTTER') {
                return `SPOT-${currentYear}-${formattedNumber}-${dateString}`;
            } else if (type.toUpperCase() === 'CONCRETE') {
                return `CONC-${currentYear}-${formattedNumber}-${dateString}`;
            } else if (type.toUpperCase() === 'ASPHALT') {
                return `ASP-${currentYear}-${formattedNumber}-${dateString}`;
            } else {
                return `ROUTE-${formattedNumber}-${dateString}`;
            }
        } catch (error) {
            console.error('Error generating route code:', error);
            // Better fallback - use random number and current date
            const now = new Date();
            const fallbackDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
            const fallbackNumber = Math.floor(Math.random() * 999) + 1;
            const formattedFallback = fallbackNumber.toString().padStart(3, '0');
            return `ROUTE-${formattedFallback}-${fallbackDate}`;
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
     * Cancel a route by updating comment7d only (preserves endingDate)
     * @param {number} routeId - Route ID
     * @param {Array<number>} ticketIds - Array of ticket IDs in the route
     * @param {number} updatedBy - User ID
     * @returns {Promise<Object>} - Result of the cancellation operation
     */
    async cancelRoute(routeId, ticketIds, updatedBy = 1) {
        try {
            console.log(`Canceling route ${routeId} with ${ticketIds.length} tickets (comment-only)`);

            // Start a transaction
            const client = await db.pool.connect();
            
            try {
                await client.query('BEGIN');

                // 1. Update comment7d to 'TK - LAYOUT' for tickets that don't have 'TK - ON SCHEDULE' or 'TK - ON PROGRESS'
                const commentUpdateResult = await client.query(`
                    UPDATE Tickets 
                    SET comment7d = 'TK - LAYOUT',
                        updatedAt = CURRENT_TIMESTAMP, 
                        updatedBy = $1 
                    WHERE ticketId = ANY($2) 
                        AND deletedAt IS NULL
                        AND (comment7d IS NULL 
                             OR comment7d = '' 
                             OR comment7d NOT IN ('TK - ON SCHEDULE', 'TK - ON PROGRESS'))
                    RETURNING ticketId, comment7d
                `, [updatedBy, ticketIds]);

                const updatedComments = commentUpdateResult.rows.length;

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

                console.log(`Updated ${updatedComments} ticket comments and route ${routeId} for cancellation`);

                return {
                    routeId: routeId,
                    message: `Route canceled successfully. Updated ${updatedComments} ticket comments to 'TK - LAYOUT' (endingDate preserved).`,
                    updatedTicketStatuses: 0,
                    updatedComments: updatedComments,
                    totalTickets: ticketIds.length,
                    routeUpdated: routeResult.rows.length > 0,
                    endingDatePreserved: true,
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

                // 1. Soft delete all RouteTickets associations (unassign tickets from route)
                const routeTicketsResult = await client.query(`
                    UPDATE RouteTickets 
                    SET deletedAt = CURRENT_TIMESTAMP, 
                        updatedAt = CURRENT_TIMESTAMP, 
                        updatedBy = $1 
                    WHERE routeId = $2 
                        AND deletedAt IS NULL
                    RETURNING routeId, ticketId, deletedAt
                `, [updatedBy, routeId]);

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

                await client.query('COMMIT');

                console.log(`Canceled spotting route ${routeId}: tickets unassigned (RouteTickets soft-deleted) and route soft-deleted. No status or comment changes.`);

                return {
                    routeId: routeId,
                    message: `Spotting route canceled: tickets unassigned and route soft-deleted. No status or comment changes.`,
                    updatedSpottingStatuses: 0,
                    updatedComments: 0,
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

                // 1. Soft delete all RouteTickets associations (unassign tickets from route)
                const routeTicketsResult = await client.query(`
                    UPDATE RouteTickets 
                    SET deletedAt = CURRENT_TIMESTAMP, 
                        updatedAt = CURRENT_TIMESTAMP, 
                        updatedBy = $1 
                    WHERE routeId = $2 
                        AND deletedAt IS NULL
                    RETURNING routeId, ticketId, deletedAt
                `, [updatedBy, routeId]);

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

                await client.query('COMMIT');

                console.log(`Canceled concrete route ${routeId}: tickets unassigned (RouteTickets soft-deleted) and route soft-deleted. No status or comment changes.`);

                return {
                    routeId: routeId,
                    message: `Concrete route canceled: tickets unassigned and route soft-deleted. No status or comment changes.`,
                    updatedSawcutStatuses: 0,
                    updatedComments: 0,
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

                // 1. Soft delete all RouteTickets associations (unassign tickets from route)
                const routeTicketsResult = await client.query(`
                    UPDATE RouteTickets 
                    SET deletedAt = CURRENT_TIMESTAMP, 
                        updatedAt = CURRENT_TIMESTAMP, 
                        updatedBy = $1 
                    WHERE routeId = $2 
                        AND deletedAt IS NULL
                    RETURNING routeId, ticketId, deletedAt
                `, [updatedBy, routeId]);

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

                await client.query('COMMIT');

                console.log(`Canceled asphalt route ${routeId}: tickets unassigned (RouteTickets soft-deleted) and route soft-deleted. No status or comment changes.`);

                return {
                    routeId: routeId,
                    message: `Asphalt route canceled: tickets unassigned and route soft-deleted. No status or comment changes.`,
                    updatedFramingStatuses: 0,
                    updatedComments: 0,
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
                        AND endingDate IS NULL
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
                                       ticket.comment7d === 'TK - PERMIT EXTENDED' ||
                                       ticket.comment7d === 'TK - LAYOUT' ||
                                       ticket.comment7d === 'TK - LAY OUT';

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

    async tryMultipleVroomAlgorithms(vroomRequest) {
        try {
            const requestConfig = {
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'NodeJS-API/1.0'
                },
                timeout: 20000
            };

            console.log('=== VROOM REQUEST DEBUG ===');
            console.log('URL:', `${this.vroomBaseUrl}/`);
            console.log('Headers:', requestConfig.headers);
            console.log('Body (stringified):', JSON.stringify(vroomRequest));
            console.log('Body length:', JSON.stringify(vroomRequest).length);
            console.log('================================');

            const response = await axios.post(`${this.vroomBaseUrl}/`, vroomRequest, requestConfig);
            return response.data;
        } catch (error) {
            console.error('Full error object:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                headers: error.response?.headers,
                data: error.response?.data
            });
            throw new Error('VROOM request failed: ' + (error.response?.data?.error || error.message));
        }
    }

    /**
     * Alternative VROOM request using raw HTTP instead of axios
     * @param {Object} vroomRequest - The VROOM request object
     * @returns {Promise<Object>} - VROOM response
     */
    async testRawHTTP(vroomRequest) {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify(vroomRequest);
            
            const options = {
                hostname: 'vroom',
                port: 3000,
                path: '/',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            console.log('=== RAW HTTP REQUEST DEBUG ===');
            console.log('Raw HTTP request options:', options);
            console.log('Raw HTTP post data:', postData);
            console.log('================================');

            const req = http.request(options, (res) => {
                let data = '';
                
                console.log('Response status:', res.statusCode);
                console.log('Response headers:', res.headers);
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    console.log('Response body:', data);
                    if (res.statusCode === 200) {
                        resolve(JSON.parse(data));
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
                });
            });

            req.on('error', (error) => {
                console.error('Request error:', error);
                reject(error);
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Test both axios and raw HTTP methods for VROOM communication
     * @param {Object} vroomRequest - The VROOM request object
     * @returns {Promise<Object>} - Test results
     */
    async testVroomCommunication(vroomRequest) {
        console.log('=== VROOM COMMUNICATION TEST ===');
        
        const results = {
            axios: null,
            rawHttp: null,
            success: false
        };

        // Test axios method
        try {
            console.log('\n--- Testing Axios Method ---');
            results.axios = await this.tryMultipleVroomAlgorithms(vroomRequest);
            console.log('✅ Axios method SUCCESS');
        } catch (error) {
            console.log('❌ Axios method FAILED:', error.message);
            results.axios = { error: error.message };
        }

        // Test raw HTTP method
        try {
            console.log('\n--- Testing Raw HTTP Method ---');
            results.rawHttp = await this.testRawHTTP(vroomRequest);
            console.log('✅ Raw HTTP method SUCCESS');
        } catch (error) {
            console.log('❌ Raw HTTP method FAILED:', error.message);
            results.rawHttp = { error: error.message };
        }

        // Determine overall success
        results.success = results.axios && !results.axios.error || results.rawHttp && !results.rawHttp.error;
        
        console.log('\n=== TEST RESULTS ===');
        console.log('Overall success:', results.success);
        console.log('========================\n');
        
        return results;
    }

    /**
     * Complete a concrete route by completing ALL incomplete phases at once
     * @param {number} routeId - Route ID
     * @param {Array<number>} ticketIds - Array of ticket IDs in the route
     * @param {number} updatedBy - User ID
     * @returns {Promise<Object>} - Result of the completion operation
     */
    async completeConcreteRoute(routeId, ticketIds, updatedBy = 1) {
        try {
            console.log(`Completing concrete route ${routeId} with ${ticketIds.length} tickets`);

            // Start a transaction
            const client = await db.pool.connect();
            
            try {
                await client.query('BEGIN');

                // Complete ALL incomplete phases for all tickets at once
                const phasesCompletedResult = await client.query(`
                    UPDATE TicketStatus 
                    SET endingDate = CURRENT_TIMESTAMP, 
                        updatedAt = CURRENT_TIMESTAMP, 
                        updatedBy = $1 
                    WHERE ticketId = ANY($2) 
                        AND endingDate IS NULL
                        AND deletedAt IS NULL
                        AND taskStatusId IN (
                            SELECT taskStatusId FROM TaskStatus 
                            WHERE name IN ('Sawcut', 'Removal', 'Framing', 'Pour', 'Clean') 
                            AND deletedAt IS NULL
                        )
                    RETURNING taskStatusId, ticketId, endingDate
                `, [updatedBy, ticketIds]);

                const totalPhasesCompleted = phasesCompletedResult.rows.length;

                // Update ticket comments to TK - COMPLETED
                const commentsResult = await client.query(`
                    UPDATE Tickets
                    SET comment7d = 'TK - COMPLETED',
                        updatedAt = CURRENT_TIMESTAMP,
                        updatedBy = $1
                    WHERE ticketId = ANY($2)
                        AND deletedAt IS NULL
                    RETURNING ticketId
                `, [updatedBy, ticketIds]);

                // Update the route's endDate to current timestamp (mark as completed)
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

                console.log(`Completed concrete route ${routeId}: ${totalPhasesCompleted} phases completed for all tickets`);

                return {
                    routeId: routeId,
                    message: `Concrete route completed successfully. Completed ${totalPhasesCompleted} phases for all tickets.`,
                    totalPhasesCompleted: totalPhasesCompleted,
                    updatedComments: commentsResult.rows.length,
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
            console.error('Failed to complete concrete route:', error);
            throw error;
        }
    }

    /**
     * Get the next phase name in the concrete workflow
     * @param {string} currentPhase - Current phase name
     * @returns {string|null} - Next phase name or null if no next phase
     */
    getNextPhaseName(currentPhase) {
        const phaseOrder = {
            'Sawcut': 'Removal',
            'Removal': 'Framing',
            'Framing': 'Pour',
            'Pour': 'Clean',
            'Clean': null // Clean is the final phase
        };
        return phaseOrder[currentPhase] || null;
    }

    /**
     * Complete a spotting route by completing the SPOTTING phase
     * @param {number} routeId - Route ID
     * @param {Array<number>} ticketIds - Array of ticket IDs in the route
     * @param {number} updatedBy - User ID
     * @returns {Promise<Object>} - Result of the completion operation
     */
    async completeSpottingRoute(routeId, ticketIds, updatedBy = 1) {
        try {
            console.log(`Completing spotting route ${routeId} with ${ticketIds.length} tickets`);

            // Start a transaction
            const client = await db.pool.connect();
            
            try {
                await client.query('BEGIN');

                // Complete SPOTTING phase for all tickets
                const spottingStatusResult = await client.query(`
                    UPDATE TicketStatus 
                    SET endingDate = CURRENT_TIMESTAMP, 
                        updatedAt = CURRENT_TIMESTAMP, 
                        updatedBy = $1 
                    WHERE ticketId = ANY($2) 
                        AND taskStatusId = (SELECT taskStatusId FROM TaskStatus WHERE name = 'Spotting' AND deletedAt IS NULL)
                        AND endingDate IS NULL
                        AND deletedAt IS NULL
                    RETURNING taskStatusId, ticketId, endingDate
                `, [updatedBy, ticketIds]);

                const updatedSpottingStatuses = spottingStatusResult.rows.length;

                // Update the route's endDate to current timestamp (mark as completed)
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

                console.log(`Completed spotting route ${routeId}: ${updatedSpottingStatuses} SPOTTING statuses completed`);

                return {
                    routeId: routeId,
                    message: `Spotting route completed successfully. Completed ${updatedSpottingStatuses} SPOTTING statuses.`,
                    updatedSpottingStatuses: updatedSpottingStatuses,
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
            console.error('Failed to complete spotting route:', error);
            throw error;
        }
    }

    /**
     * Complete an asphalt route by completing the current asphalt phase
     * @param {number} routeId - Route ID
     * @param {Array<number>} ticketIds - Array of ticket IDs in the route
     * @param {number} updatedBy - User ID
     * @returns {Promise<Object>} - Result of the completion operation
     */
    async completeAsphaltRoute(routeId, ticketIds, updatedBy = 1) {
        try {
            console.log(`Completing asphalt route ${routeId} with ${ticketIds.length} tickets`);

            // Start a transaction
            const client = await db.pool.connect();
            
            try {
                await client.query('BEGIN');

                // Complete current asphalt phases (Grind, Asphalt, Crack Seal, etc.) for all tickets
                const asphaltStatusResult = await client.query(`
                    UPDATE TicketStatus 
                    SET endingDate = CURRENT_TIMESTAMP, 
                        updatedAt = CURRENT_TIMESTAMP, 
                        updatedBy = $1 
                    WHERE ticketId = ANY($2) 
                        AND taskStatusId IN (
                            SELECT taskStatusId FROM TaskStatus 
                            WHERE name IN ('Grind', 'Asphalt', 'Crack Seal', 'Install Signs', 'Steel Plate Pick Up') 
                            AND deletedAt IS NULL
                        )
                        AND endingDate IS NULL
                        AND deletedAt IS NULL
                    RETURNING taskStatusId, ticketId, endingDate
                `, [updatedBy, ticketIds]);

                const updatedAsphaltStatuses = asphaltStatusResult.rows.length;

                // Update ticket comments to TK - COMPLETED
                const commentsResult = await client.query(`
                    UPDATE Tickets
                    SET comment7d = 'TK - COMPLETED',
                        updatedAt = CURRENT_TIMESTAMP,
                        updatedBy = $1
                    WHERE ticketId = ANY($2)
                        AND deletedAt IS NULL
                    RETURNING ticketId
                `, [updatedBy, ticketIds]);

                // Update the route's endDate to current timestamp (mark as completed)
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

                console.log(`Completed asphalt route ${routeId}: ${updatedAsphaltStatuses} asphalt statuses completed`);

                return {
                    routeId: routeId,
                    message: `Asphalt route completed successfully. Completed ${updatedAsphaltStatuses} asphalt statuses.`,
                    updatedAsphaltStatuses: updatedAsphaltStatuses,
                    updatedComments: commentsResult.rows.length,
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
            console.error('Failed to complete asphalt route:', error);
            throw error;
        }
    }

    /**
     * Check for tickets that should be removed from routes due to status changes
     * This method identifies tickets in routes that have been cancelled, put on hold, or have expired permits
     * @returns {Promise<Object>} - Object containing tickets to remove and summary
     */
    async checkTicketsForRouteRemoval() {
        try {
            console.log('=== Starting route ticket validation check ===');
            
            const db = require('../config/db');
            
            // Get all active routes with their tickets
            const activeRoutesQuery = await db.query(`
                SELECT DISTINCT
                    r.routeId,
                    r.routeCode,
                    r.type,
                    rt.ticketId,
                    rt.queue,
                    t.ticketCode,
                    t.comment7d,
                    t.daysOutstanding,
                    p.expireDate,
                    p.permitNumber
                FROM Routes r
                JOIN RouteTickets rt ON r.routeId = rt.routeId AND rt.deletedAt IS NULL
                JOIN Tickets t ON rt.ticketId = t.ticketId AND t.deletedAt IS NULL
                LEFT JOIN PermitedTickets pt ON t.ticketId = pt.ticketId AND pt.deletedAt IS NULL
                LEFT JOIN Permits p ON pt.permitId = p.permitId AND p.deletedAt IS NULL
                WHERE r.deletedAt IS NULL
                    AND (r.endDate IS NULL OR r.endDate > CURRENT_DATE)
                ORDER BY r.routeId, rt.queue
            `);
            
            const ticketsToRemove = [];
            const routeSummary = new Map();
            
            for (const row of activeRoutesQuery.rows) {
                const shouldRemove = this.shouldRemoveTicketFromRoute(row);
                
                if (shouldRemove.shouldRemove) {
                    ticketsToRemove.push({
                        routeId: row.routeid,
                        routeCode: row.routecode,
                        routeType: row.type,
                        ticketId: row.ticketid,
                        ticketCode: row.ticketcode,
                        queue: row.queue,
                        reason: shouldRemove.reason,
                        comment7d: row.comment7d,
                        daysOutstanding: row.daysoutstanding,
                        permitExpireDate: row.expiredate,
                        permitNumber: row.permitnumber
                    });
                    
                    // Track summary by route
                    if (!routeSummary.has(row.routeid)) {
                        routeSummary.set(row.routeid, {
                            routeId: row.routeid,
                            routeCode: row.routecode,
                            routeType: row.type,
                            ticketsToRemove: 0,
                            reasons: new Set()
                        });
                    }
                    
                    const summary = routeSummary.get(row.routeid);
                    summary.ticketsToRemove++;
                    summary.reasons.add(shouldRemove.reason);
                }
            }
            
            console.log(`=== Route ticket validation complete ===`);
            console.log(`- Total tickets checked: ${activeRoutesQuery.rows.length}`);
            console.log(`- Tickets to remove: ${ticketsToRemove.length}`);
            console.log(`- Routes affected: ${routeSummary.size}`);
            
            return {
                success: true,
                totalTicketsChecked: activeRoutesQuery.rows.length,
                ticketsToRemove: ticketsToRemove,
                routesAffected: Array.from(routeSummary.values()).map(summary => ({
                    ...summary,
                    reasons: Array.from(summary.reasons)
                })),
                summary: {
                    totalTicketsToRemove: ticketsToRemove.length,
                    totalRoutesAffected: routeSummary.size,
                    reasons: [...new Set(ticketsToRemove.map(t => t.reason))]
                }
            };
            
        } catch (error) {
            console.error('Error checking tickets for route removal:', error);
            return {
                success: false,
                error: error.message,
                ticketsToRemove: [],
                routesAffected: []
            };
        }
    }

    /**
     * Determine if a ticket should be removed from its route based on status
     * @param {Object} ticketData - Ticket data from database
     * @returns {Object} - { shouldRemove: boolean, reason: string }
     */
    shouldRemoveTicketFromRoute(ticketData) {
        const comment7d = (ticketData.comment7d || '').toLowerCase();
        const currentDate = new Date();
        
        // Check for cancellation or hold status
        if (comment7d.includes('tk - cancelled') || 
            comment7d.includes('tk - hold off') || 
            comment7d.includes('tk - on hold off')) {
            return {
                shouldRemove: true,
                reason: 'TICKET_CANCELLED_OR_ON_HOLD',
                details: `Ticket status: ${ticketData.comment7d}`
            };
        }
        
        // Check for expired permit
        if (ticketData.days_until_expire !== undefined && ticketData.days_until_expire !== null) {
            const n = Number(ticketData.days_until_expire);
            if (!Number.isNaN(n) && n < 0) {
                return {
                    shouldRemove: true,
                    reason: 'PERMIT_EXPIRED',
                    details: `Permit expired (days_until_expire=${n})`
                };
            }
        }
        
        // Check for completed status
        if (comment7d.includes('tk - completed') || 
            comment7d.includes('tk - complete') || 
            comment7d.includes('completed') || 
            comment7d.includes('complete')) {
            return {
                shouldRemove: true,
                reason: 'TICKET_COMPLETED',
                details: `Ticket marked as completed: ${ticketData.comment7d}`
            };
        }
        
        return {
            shouldRemove: false,
            reason: null
        };
    }

    /**
     * Remove tickets from routes based on validation check
     * @param {Array} ticketsToRemove - Array of tickets to remove
     * @param {number} updatedBy - User ID performing the update
     * @returns {Promise<Object>} - Results of removal operation
     */
    async removeInvalidTicketsFromRoutes(ticketsToRemove, updatedBy = 1) {
        try {
            console.log(`=== Starting removal of ${ticketsToRemove.length} invalid tickets from routes ===`);
            
            const db = require('../config/db');
            const client = await db.pool.connect();
            
            const results = {
                success: [],
                failed: [],
                routesReoptimized: new Set(),
                summary: {
                    totalProcessed: ticketsToRemove.length,
                    successful: 0,
                    failed: 0,
                    routesAffected: 0
                }
            };
            
            try {
                await client.query('BEGIN');
                
                for (const ticket of ticketsToRemove) {
                    try {
                        // Remove ticket from route
                        const removeResult = await client.query(
                            'UPDATE RouteTickets SET deletedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP, updatedBy = $1 WHERE routeId = $2 AND ticketId = $3 AND deletedAt IS NULL RETURNING *;',
                            [updatedBy, ticket.routeId, ticket.ticketId]
                        );
                        
                        if (removeResult.rows.length > 0) {
                            results.success.push({
                                ...ticket,
                                removedAt: new Date().toISOString()
                            });
                            results.summary.successful++;
                            results.routesReoptimized.add(ticket.routeId);
                            results.summary.routesAffected = results.routesReoptimized.size;
                            
                            console.log(`✓ Removed ticket ${ticket.ticketCode} from route ${ticket.routeCode} - Reason: ${ticket.reason}`);
                        } else {
                            results.failed.push({
                                ...ticket,
                                error: 'Ticket not found in route'
                            });
                            results.summary.failed++;
                        }
                        
                    } catch (error) {
                        console.error(`✗ Failed to remove ticket ${ticket.ticketCode} from route ${ticket.routeCode}:`, error.message);
                        results.failed.push({
                            ...ticket,
                            error: error.message
                        });
                        results.summary.failed++;
                    }
                }
                
                await client.query('COMMIT');
                
                // Note: Automatic re-optimization and route completion disabled
                // Routes will remain as-is after ticket removal
                console.log(`=== ${results.routesReoptimized.size} routes affected by ticket removal ===`);
                console.log(`=== Routes will remain active and require manual re-optimization if needed ===`);
                
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
            
            console.log(`=== Ticket removal complete ===`);
            console.log(`- Successfully removed: ${results.summary.successful}`);
            console.log(`- Failed removals: ${results.summary.failed}`);
            console.log(`- Routes affected: ${results.routesReoptimized.size}`);
            
            return results;
            
        } catch (error) {
            console.error('Error removing invalid tickets from routes:', error);
            return {
                success: false,
                error: error.message,
                summary: {
                    totalProcessed: ticketsToRemove.length,
                    successful: 0,
                    failed: ticketsToRemove.length,
                    routesAffected: 0
                }
            };
        }
    }



    /**
     * Perform a complete route validation and cleanup
     * This method checks all active routes and removes invalid tickets
     * @param {number} updatedBy - User ID performing the cleanup
     * @returns {Promise<Object>} - Complete validation and cleanup results
     */
    async performRouteValidationAndCleanup(updatedBy = 1) {
        try {
            console.log('=== Starting complete route validation and cleanup ===');
            
            // Step 1: Check for tickets that should be removed
            const validationResult = await this.checkTicketsForRouteRemoval();
            
            if (!validationResult.success) {
                return {
                    success: false,
                    error: 'Failed to validate routes',
                    details: validationResult.error
                };
            }
            
            if (validationResult.ticketsToRemove.length === 0) {
                return {
                    success: true,
                    message: 'No invalid tickets found in routes',
                    summary: validationResult.summary
                };
            }
            
            // Step 2: Remove invalid tickets
            const removalResult = await this.removeInvalidTicketsFromRoutes(
                validationResult.ticketsToRemove, 
                updatedBy
            );
            
            return {
                success: true,
                validation: validationResult,
                removal: removalResult,
                summary: {
                    totalTicketsChecked: validationResult.totalTicketsChecked,
                    ticketsRemoved: removalResult.summary.successful,
                    routesAffected: validationResult.summary.totalRoutesAffected,
                    routesReoptimized: removalResult.summary.routesReoptimized
                }
            };
            
        } catch (error) {
            console.error('Error performing route validation and cleanup:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new RouteOptimizationService();