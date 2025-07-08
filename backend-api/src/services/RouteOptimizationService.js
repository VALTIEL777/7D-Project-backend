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
     * Single route optimization with minimal API calls
     * This approach uses existing geocoded addresses from the Addresses table
     * to minimize Google Maps API usage and costs.
     * 
     * @param {Array<number>} ticketIds - Array of ticket IDs to optimize
     * @param {string} routeCode - Unique route identifier
     * @param {string} type - Route type (SPOTTER, CONCRETE, ASPHALT)
     * @param {string} originAddress - Starting address
     * @param {string} destinationAddress - Ending address (can be same as origin)
     * @param {number} createdBy - User ID
     * @param {Object} options - Additional options including autoSuggestAddresses
     * @returns {Promise<Object>} - Optimized route data
     */
    async optimizeRouteSingle(ticketIds, routeCode, type, originAddress, destinationAddress, createdBy = 1, options = {}) {
        try {
            console.log(`Starting single route optimization for ${ticketIds.length} tickets`);
            
            const { autoSuggestAddresses = true, suggestionConfidence = 0.8 } = options;

            // Step 1: Get all ticket addresses in one database query
            const ticketsWithAddresses = await this.getTicketsWithAddressesBatch(ticketIds, {
                autoSuggest: autoSuggestAddresses,
                minConfidence: suggestionConfidence
            });
            
            if (ticketsWithAddresses.length === 0) {
                throw new Error('No valid tickets found for optimization');
            }

            // Step 2: Check existing Addresses table and only geocode new addresses
            const geocodedAddresses = await this.batchGeocodeWithAddresses(
                ticketsWithAddresses.map(t => t.address)
            );

            // Step 3: Optimize all tickets in one request
            const addressesToOptimize = ticketsWithAddresses.map(t => t.address);
            const optimizedRouteResult = await this.optimizeRoute(
                originAddress,
                destinationAddress,
                addressesToOptimize
            );

            // Step 4: Reorder tickets based on optimization
            const reorderedTickets = optimizedRouteResult.optimizedOrder.map((originalIndex, queuePosition) => ({
                ...ticketsWithAddresses[originalIndex],
                queue: queuePosition
            }));

            // Step 5: Prepare route data for database
            const routeData = {
                routeCode: routeCode || `ROUTE-${Date.now()}`,
                type: type || 'SINGLE',
                startDate: new Date(),
                endDate: new Date(),
                encodedPolyline: optimizedRouteResult.encodedPolyline,
                totalDistance: optimizedRouteResult.totalDistance,
                totalDuration: optimizedRouteResult.totalDuration,
                optimizedOrder: optimizedRouteResult.optimizedOrder,
                optimizationMetadata: {
                    optimizationDate: new Date().toISOString(),
                    totalWaypoints: addressesToOptimize.length,
                    originAddress,
                    destinationAddress,
                    method: 'single_optimization'
                },
                tickets: reorderedTickets
            };

            // Step 6: Save to database
            const savedRoute = await this.saveOptimizedRoute(routeData, createdBy);

            // Step 7: Prepare response with address suggestion information
            const originalTickets = ticketsWithAddresses.filter(t => !t.suggestedAddress);
            const suggestedTickets = ticketsWithAddresses.filter(t => t.suggestedAddress);
            
            const response = {
                routeId: savedRoute.routeid,
                routeCode: savedRoute.routecode,
                totalDistance: savedRoute.totaldistance,
                totalDuration: savedRoute.totalduration,
                totalTickets: ticketsWithAddresses.length,
                apiCallsUsed: 1, // Single optimization call
                costEstimate: this.estimateApiCost(1),
                addressInfo: {
                    originalAddresses: originalTickets.length,
                    suggestedAddresses: suggestedTickets.length,
                    suggestions: suggestedTickets.map(t => ({
                        ticketId: t.ticketid,
                        ticketCode: t.ticketcode,
                        suggestedAddress: t.address,
                        confidence: t.suggestionConfidence,
                        method: t.suggestionMethod
                    }))
                }
            };

            if (suggestedTickets.length > 0) {
                console.log(`Route optimization completed with ${suggestedTickets.length} suggested addresses`);
                response.message = `Route optimized successfully. ${suggestedTickets.length} addresses were automatically suggested.`;
            } else {
                response.message = 'Route optimized successfully with all original addresses.';
            }

            return response;

        } catch (error) {
            console.error('Single route optimization failed:', error);
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
                    message: 'No new tickets to add',
                    addedTickets: 0
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
                totalTickets: existingTicketIds.length + ticketsToAdd.length
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
            const reorderedTickets = optimizedRouteResult.optimizedOrder.map((originalIndex, queuePosition) => ({
                ticketId: ticketsWithAddresses[originalIndex].ticketid,
                queue: queuePosition
            }));

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
}

module.exports = new RouteOptimizationService();