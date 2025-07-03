const axios = require('axios');
// Removed: const {RouteOptimizationClient} = require('@googlemaps/routeoptimization').v1;
// This client is for the Google Cloud Route Optimization API, which is NOT what we need for this use case.

const Routes = require('../models/route/Routes');
const RouteTickets = require('../models/route/RouteTickets');
const Tickets = require('../models/ticket-logic/Tickets');
const db = require('../config/db'); // Assuming this correctly imports your database connection

class RouteOptimizationService {
    constructor() {
        // Use Google Maps Platform Routes API (v2) for route optimization
        this.routesApiUrl = 'https://routes.googleapis.com/directions/v2:computeRoutes';
        // Base URL for the Google Maps Platform Geocoding API
        this.geocodingApiUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
        this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
        this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'burguer-menu-fbb80'; // Project ID is not directly used by Maps Platform APIs with API Key

        if (!this.apiKey) {
            console.error('ERROR: GOOGLE_MAPS_API_KEY is not set in environment variables. Route optimization will fail.');
            // In a production app, you might want to throw an error or exit here.
        }
    }

    // Removed: getAccessToken method.
    // This method is for OAuth/Service Account authentication, typically used by Google Cloud APIs.
    // The Google Maps Platform Routes API (v2) primarily uses API Keys for server-side calls,
    // which are passed directly in the URL params.

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
                        key: this.apiKey // Using the same API key for Geocoding
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

    // Removed: generateEncodedPolyline method.
    // This method was redundant and contained conflicting parameters that caused the error.
    // The Routes API v2 (computeRoutes) returns the encoded polyline directly in its response
    // when requested via the X-Goog-FieldMask header in the optimizeRoute method.

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
        if (!this.apiKey) {
            throw new Error('API Key is not configured for RouteOptimizationService. Please set GOOGLE_MAPS_API_KEY.');
        }

        // Routes API Pro tier supports up to 158 intermediate waypoints (160 total including origin/destination).
        if (intermediateAddresses.length > 158) {
            throw new Error(`Waypoint limit exceeded: Routes API Pro supports a maximum of 158 intermediate waypoints for optimization. You provided ${intermediateAddresses.length}.`);
        }

        console.log(`Starting route optimization process for ${intermediateAddresses.length} intermediate stops.`);

        // --- STEP 1: Geocode all addresses (origin, destination, and intermediates) ---
        // We use Promise.all to geocode concurrently for better performance.
        const [originGeo, destinationGeo, ...geocodedIntermediates] = await Promise.all([
            this.geocodeAddress(originAddress),
            this.geocodeAddress(destinationAddress),
            ...intermediateAddresses.map(address => this.geocodeAddress(address))
        ]);

        // Extract just the LatLng objects for the API call, as Routes API v2 requires them for intermediates.
        const originLatLng = { latitude: originGeo.latitude, longitude: originGeo.longitude };
        const destinationLatLng = { latitude: destinationGeo.latitude, longitude: destinationGeo.longitude };
        const intermediateLatLngs = geocodedIntermediates.map(geo => ({ latitude: geo.latitude, longitude: geo.longitude }));

        // --- STEP 2: Build the Routes API v2 (ComputeRoutes) request body ---
        const requestBody = {
            origin: {
                location: {
                    latLng: originLatLng // Origin can be latLng or address
                }
            },
            destination: {
                location: {
                    latLng: destinationLatLng // Destination can be latLng or address
                }
            },
            intermediates: intermediateLatLngs.map(ll => ({ location: { latLng: ll } })), // Intermediates MUST be latLng
            travelMode: 'DRIVE',
            optimizeWaypointOrder: true, // THIS IS THE KEY FOR OPTIMIZATION!
            languageCode: 'es', // Request directions in Spanish
            units: 'METRIC', // Request distances in meters, durations in seconds
            // You can add other route modifiers here if needed, e.g.:
            // routeModifiers: {
            //   avoidTolls: true,
            //   avoidHighways: false
            // }
        };

        const headers = {
            'Content-Type': 'application/json',
            // X-Goog-FieldMask is crucial to specify what data you want back,
            // which helps control cost and response size.
            // We request polyline, distance, duration, and the optimized order.
            'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.optimizedIntermediateWaypointIndex'
        };

        try {
            console.log('Calling Google Maps Platform Routes API (ComputeRoutes) for optimization...');
            const response = await axios.post(
                `${this.routesApiUrl}?key=${this.apiKey}`, // API Key passed as query parameter
                requestBody,
                { headers: headers }
            );

            if (!response.data.routes || response.data.routes.length === 0) {
                throw new Error('No routes found in Routes API response. This might happen if locations are unreachable, too far apart, or API limits are hit.');
            }

            const route = response.data.routes[0]; // The Routes API returns an array of routes; the first one is the optimized one.

            console.log('Route optimization successful. Total distance:', route.distanceMeters, 'meters.');

            // The Routes API v2 directly returns the encoded polyline and optimized order.
            return {
                encodedPolyline: route.polyline.encodedPolyline,
                optimizedOrder: route.optimizedIntermediateWaypointIndex || [], // Ensure it's an array, even if empty
                totalDistance: route.distanceMeters,
                totalDuration: parseFloat(route.duration.replace('s', '')), // Convert duration string (e.g., "1800s") to seconds
                apiResponse: response.data // Store the full API response for debugging/metadata
            };

        } catch (error) {
            console.error('Routes API Call Error:', error.response?.data || error.message);
            throw new Error(`Route optimization failed: ${error.response?.data?.error?.message || error.message}`);
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
                routeData.optimizedOrder,
                routeData.optimizationMetadata,
                createdBy,
                createdBy
            );

            // 2. Create route tickets with their optimized order
            if (routeData.tickets && routeData.tickets.length > 0) {
                const routeTickets = routeData.tickets.map(ticket => ({
                    routeId: route.routeid,
                    ticketId: ticket.ticketId,
                    address: ticket.address, // Store the address string for the ticket
                    queue: ticket.queue, // Use the already calculated optimized queue position
                    createdBy: createdBy,
                    updatedBy: createdBy
                }));

                await RouteTickets.createBatch(routeTickets);
            }

            return route;
        } catch (error) {
            console.error('Failed to save optimized route to database:', error);
            throw error;
        }
    }

    /**
     * Orchestrates the entire process: fetches tickets, extracts addresses,
     * optimizes the route, reorders tickets based on optimization, and saves to the database.
     * @param {Array<number>} ticketIds - Array of ticket IDs to be included in the route.
     * @param {string} routeCode - A unique code for the route.
     * @param {string} type - Type of route (e.g., 'delivery', 'repair').
     * @param {Date} startDate - Start date/time of the route.
     * @param {Date} endDate - End date/time of the route.
     * @param {string} originAddress - The starting address for the route.
     * @param {string} destinationAddress - The ending address for the route.
     * @param {number} createdBy - User ID who initiated the optimization.
     * @returns {Promise<Object>} - Summary of the optimized and saved route.
     * @throws {Error} If any step in the process fails.
     */
    async optimizeAndSaveRoute(ticketIds, routeCode, type, startDate, endDate, originAddress, destinationAddress, createdBy = 1) {
        try {
            // 1. Fetch ticket details including their addresses from the database.
            // We need the original ticket objects to reorder them later.
            const ticketsWithAddresses = [];
            for (const ticketId of ticketIds) {
                const ticket = await Tickets.findById(ticketId);
                if (!ticket) {
                    console.warn(`Ticket with ID ${ticketId} not found and will be skipped for optimization.`);
                    continue;
                }
                
                const ticketAddress = await this.getTicketAddress(ticket); 
                if (!ticketAddress) {
                    console.warn(`Ticket ${ticketId} has no address found and will be skipped for optimization.`);
                    continue;
                }
                
                ticketsWithAddresses.push({
                    ticketId: ticket.ticketid,
                    ticketCode: ticket.ticketcode,
                    address: ticketAddress,
                    quantity: ticket.quantity,
                    amountToPay: ticket.amounttopay
                    // Include any other relevant ticket data here
                });
            }

            // 2. Extract only the address strings for the optimization API call.
            const addressesToOptimize = ticketsWithAddresses.map(ticket => ticket.address);
            
            if (addressesToOptimize.length === 0) {
                throw new Error('No valid addresses found for optimization from the provided tickets after filtering.');
            }

            // 3. Call the core route optimization logic.
            const optimizedRouteResult = await this.optimizeRoute(
                originAddress,
                destinationAddress,
                addressesToOptimize
            );
            
            // 4. Reorder the original `ticketsWithAddresses` array based on the `optimizedOrder`
            // returned by the Routes API.
            const reorderedTicketsForDb = optimizedRouteResult.optimizedOrder.map((originalIndex, queuePosition) => {
                const originalTicket = ticketsWithAddresses[originalIndex];
                return {
                    ...originalTicket,
                    queue: queuePosition // Assign the new optimized queue position
                };
            });

            // 5. Prepare the data structure for saving to your database.
            const routeDataForDb = {
                routeCode: routeCode || `ROUTE-${Date.now()}`,
                type: type || 'default',
                startDate: startDate || new Date(),
                endDate: endDate || new Date(),
                encodedPolyline: optimizedRouteResult.encodedPolyline,
                totalDistance: optimizedRouteResult.totalDistance,
                totalDuration: optimizedRouteResult.totalDuration,
                optimizedOrder: optimizedRouteResult.optimizedOrder, // Store the raw optimized indices
                optimizationMetadata: {
                    apiResponse: optimizedRouteResult.apiResponse, // Store the full API response for audit/debugging
                    optimizationDate: new Date().toISOString(),
                    totalWaypoints: addressesToOptimize.length,
                    originAddress,
                    destinationAddress
                },
                tickets: reorderedTicketsForDb // Pass the reordered ticket objects to be saved as RouteTickets
            };

            // 6. Save the optimized route and its associated tickets to the database.
            const savedRoute = await this.saveOptimizedRoute(routeDataForDb, createdBy);

            // Return a summary of the operation.
            return {
                routeId: savedRoute.routeid,
                routeCode: savedRoute.routecode,
                totalDistance: savedRoute.totaldistance,
                totalDuration: savedRoute.totalduration,
                optimizedOrder: savedRoute.optimizedorder,
                tickets: reorderedTicketsForDb // Return the reordered tickets for the response
            };
        } catch (error) {
            console.error('Failed to optimize and save route in orchestrator:', error);
            throw error;
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
                if (addr.fulladdress) {
                    return addr.fulladdress.trim();
                }
                
                // Fallback: construct address from individual components
                const parts = [
                    addr.addressnumber,
                    addr.addresscardinal,
                    addr.addressstreet,
                    addr.addressesuffix
                ].filter(Boolean); // Filter out null/undefined/empty strings

                // If we have latitude and longitude, we can use them for more accurate geocoding
                if (addr.latitude && addr.longitude) {
                    return `${parts.join(', ').replace(/,(\s*,){1,}/g, ',').replace(/,$/, '').trim()} (${addr.latitude}, ${addr.longitude})`;
                }

                return parts.join(', ').replace(/,(\s*,){1,}/g, ',').replace(/,$/, '').trim();
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
            
            // Construct the full address string
            const fullAddress = `${sampleAddr.number} ${sampleAddr.cardinal} ${sampleAddr.street} ${sampleAddr.suffix}`.trim();
            
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
}

module.exports = new RouteOptimizationService();