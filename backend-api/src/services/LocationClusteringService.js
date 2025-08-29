const db = require('../config/db');

class LocationClusteringService {
    constructor() {
        this.maxDistance = 30000; // Increased to 30km for much better clustering in Chicago
        this.maxLocationsPerCluster = 95; // Default max locations per cluster (VROOM/OSRM safe limit)
        this.minLocationsPerCluster = 1; // Minimum locations per cluster - allow single locations
    }

    /**
     * Cluster locations by proximity using PostGIS spatial functions
     * @param {Array} tickets - Array of ticket objects with address information
     * @param {Object} options - Clustering options
     * @returns {Promise<Array>} - Array of clusters
     */
    async clusterLocations(tickets, options = {}) {
        try {
            const { 
                maxDistance = this.maxDistance, 
                maxLocationsPerCluster = 95,
                minLocationsPerCluster = this.minLocationsPerCluster 
            } = options;
            
            // Step 1: Extract unique addresses from tickets
            const uniqueAddresses = [...new Set(tickets.map(ticket => ticket.address))];
            
            // Step 2: Get coordinates for all addresses (geocode if needed)
            const addressCoordinates = await this.getAddressCoordinates(uniqueAddresses);
            
            if (addressCoordinates.length === 0) {
                throw new Error('No locations found with valid coordinates');
            }
            
            // Step 3: Perform spatial clustering on UNIQUE LOCATIONS (not tickets)
            const locationClusters = await this.performSpatialClustering(addressCoordinates, maxDistance, maxLocationsPerCluster, minLocationsPerCluster);
            
            // Step 4: Map location clusters back to tickets (assign all tickets at each location to their cluster)
            const ticketClusters = this.mapLocationClustersToTickets(locationClusters, tickets);
            
            return ticketClusters;
            
        } catch (error) {
            console.error('Error in clusterLocations:', error);
            throw error;
        }
    }

    /**
     * Get coordinates for addresses, geocoding if necessary
     * @param {Array} addresses - Array of address strings
     * @returns {Promise<Array>} - Array of address objects with coordinates
     */
    async getAddressCoordinates(addresses) {
        const addressCoordinates = [];
        
        for (const address of addresses) {
            try {
                // First, try to find existing coordinates in the database
                const existingAddress = await this.findAddressInDatabase(address);
                
                if (existingAddress && existingAddress.latitude && existingAddress.longitude) {
                    // Use existing coordinates
                    addressCoordinates.push({
                        address,
                        latitude: existingAddress.latitude,
                        longitude: existingAddress.longitude,
                        addressId: existingAddress.addressid
                    });
                } else {
                    // Geocode the address
                    const geocodeResult = await this.geocodeAddress(address);
                    
                    if (geocodeResult && geocodeResult.latitude && geocodeResult.longitude) {
                        // Save to database
                        const savedAddress = await this.saveAddressToDatabase(address, geocodeResult.latitude, geocodeResult.longitude, geocodeResult.placeId);
                        
                        addressCoordinates.push({
                            address,
                            latitude: geocodeResult.latitude,
                            longitude: geocodeResult.longitude,
                            addressId: savedAddress.addressid
                        });
                    } else {
                        console.warn(`Failed to geocode address: ${address}`);
                    }
                }
            } catch (error) {
                console.error(`Error processing address ${address}:`, error);
            }
        }
        
        return addressCoordinates;
    }

    /**
     * Find address in database by full address string
     * @param {string} fullAddress - Full address string
     * @returns {Promise<Object|null>} - Address object or null
     */
    async findAddressInDatabase(fullAddress) {
        try {
            // Parse the address into components
            const addressComponents = this.parseAddressComponents(fullAddress);
            
            if (!addressComponents) {
                console.warn(`Could not parse address: ${fullAddress}`);
                return null;
            }

            const query = `
                SELECT addressid, addressnumber, addresscardinal, addressstreet, addresssuffix, 
                       latitude, longitude, placeid
                FROM Addresses 
                WHERE addressnumber = $1 
                AND addresscardinal = $2 
                AND addressstreet = $3 
                AND COALESCE(addresssuffix, '') = $4
                AND deletedAt IS NULL
            `;

            const result = await db.query(query, [
                addressComponents.number,
                addressComponents.cardinal,
                addressComponents.street,
                addressComponents.suffix || ''
            ]);

            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding address in database:', error);
            return null;
        }
    }

    /**
     * Geocode a single address using Google Maps API
     * @param {string} address - Address to geocode
     * @returns {Promise<Object|null>} - Geocoding result
     */
    async geocodeAddress(address) {
        try {
            const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
            if (!googleMapsApiKey) {
                throw new Error('GOOGLE_MAPS_API_KEY environment variable is required');
            }

            const encodedAddress = encodeURIComponent(address);
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${googleMapsApiKey}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.status === 'OK' && data.results.length > 0) {
                const location = data.results[0].geometry.location;
                return {
                    latitude: location.lat,
                    longitude: location.lng,
                    formattedAddress: data.results[0].formatted_address,
                    placeId: data.results[0].place_id // Assuming place_id is available
                };
            } else {
                console.warn(`Geocoding failed for ${address}: ${data.status}`);
                return null;
            }
        } catch (error) {
            console.error(`Error geocoding address ${address}:`, error);
            return null;
        }
    }
        /**
     * Get route polyline, distance, and duration for a fixed order of addresses (no optimization)
     * @param {string} originAddress
     * @param {string} destinationAddress
     * @param {Array<string>} addresses - ordered addresses (excluding origin)
     * @returns {Promise<{encodedPolyline: string, totalDistance: number, totalDuration: number}>}
     */
        async getRouteForFixedOrder(originAddress, destinationAddress, addresses) {
            // Geocode all addresses if needed
            const [originGeo, ...geocodedIntermediates] = await Promise.all([
                this.geocodeAddress(originAddress),
                ...addresses.map(address => this.geocodeAddress(address))
            ]);
            // Build coordinates string in the given order
            const coordinates = [
                `${originGeo.longitude},${originGeo.latitude}`,
                ...geocodedIntermediates.map(geo => `${geo.longitude},${geo.latitude}`)
            ];
            const coordinatesString = coordinates.join(';');
            // Call OSRM for the route in this order
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
     * Save address to database with coordinates
     * @param {string} fullAddress - Full address string
     * @param {number} latitude - Latitude coordinate
     * @param {number} longitude - Longitude coordinate
     * @param {string} placeId - Google Places ID
     * @returns {Promise<Object>} - Saved address object
     */
    async saveAddressToDatabase(fullAddress, latitude, longitude, placeId) {
        try {
            const addressComponents = this.parseAddressComponents(fullAddress);
            
            if (!addressComponents) {
                throw new Error(`Could not parse address: ${fullAddress}`);
            }

            // Use UPSERT to handle duplicates gracefully
            const query = `
                INSERT INTO Addresses (addressnumber, addresscardinal, addressstreet, addresssuffix, 
                                     latitude, longitude, placeid, createdat, updatedat)
                VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT (addressnumber, addresscardinal, addressstreet, addresssuffix) 
                DO UPDATE SET 
                    latitude = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude,
                    placeid = EXCLUDED.placeid,
                    updatedat = CURRENT_TIMESTAMP
                RETURNING addressid, addressnumber, addresscardinal, addressstreet, addresssuffix, 
                          latitude, longitude, placeid
            `;

            const result = await db.query(query, [
                addressComponents.number,
                addressComponents.cardinal,
                addressComponents.street,
                addressComponents.suffix || '',
                latitude,
                longitude,
                placeId || null
            ]);

            return result.rows[0];
        } catch (error) {
            console.error('Error saving address to database:', error);
            throw error;
        }
    }

    /**
     * Parse address string into components
     * @param {string} fullAddress - Full address string like "5303 S WASHTENAW AVE, Chicago, Illinois"
     * @returns {Object|null} - Parsed address components
     */
    parseAddressComponents(fullAddress) {
        try {
            // Remove city and state from the end and clean up extra spaces
            const addressPart = fullAddress.split(',')[0].trim().replace(/\s+/g, ' ').replace(/\s*,\s*/g, '');
            
            // Match pattern like "5303 S WASHTENAW AVE"
            const regex = /^(\d+)\s+([NSEW])\s+(.+?)\s+(AVE|ST|RD|BLVD|DR|LN|CT|PL|WAY|CIR|PKWY)$/i;
            const match = addressPart.match(regex);
            
            if (match) {
                return {
                    number: match[1],
                    cardinal: match[2].toUpperCase(),
                    street: match[3].toUpperCase(),
                    suffix: match[4].toUpperCase()
                };
            }
            
            // Try alternative pattern without cardinal direction
            const regex2 = /^(\d+)\s+(.+?)\s+(AVE|ST|RD|BLVD|DR|LN|CT|PL|WAY|CIR|PKWY)$/i;
            const match2 = addressPart.match(regex2);
            
            if (match2) {
                return {
                    number: match2[1],
                    cardinal: '', // No cardinal direction
                    street: match2[2].toUpperCase(),
                    suffix: match2[3].toUpperCase()
                };
            }
            
            // Try pattern with cardinal direction but no suffix (like "3238 S PULASKI")
            const regex3 = /^(\d+)\s+([NSEW])\s+(.+)$/i;
            const match3 = addressPart.match(regex3);
            
            if (match3) {
                return {
                    number: match3[1],
                    cardinal: match3[2].toUpperCase(),
                    street: match3[3].toUpperCase(),
                    suffix: '' // No suffix
                };
            }
            
            // Try pattern without cardinal direction and no suffix
            const regex4 = /^(\d+)\s+(.+)$/i;
            const match4 = addressPart.match(regex4);
            
            if (match4) {
                return {
                    number: match4[1],
                    cardinal: '', // No cardinal direction
                    street: match4[2].toUpperCase(),
                    suffix: '' // No suffix
                };
            }
            
            return null;
        } catch (error) {
            console.error('Error parsing address components:', error);
            return null;
        }
    }

    /**
     * Perform spatial clustering using PostGIS function
     * @param {Array} addressCoordinates - Array of address objects with coordinates
     * @param {number} maxDistance - Maximum distance in meters
     * @param {number} maxLocationsPerCluster - Maximum locations per cluster
     * @returns {Promise<Array>} - Array of clusters
     */
    async performSpatialClustering(addressCoordinates, maxDistance, maxLocationsPerCluster, minLocationsPerCluster) {
        try {
            console.log(`Using PostGIS clustering function with maxDistance: ${maxDistance}m, maxLocationsPerCluster: ${maxLocationsPerCluster}`);
            
            // Use the PostGIS clustering function directly
            const result = await db.query(`
                SELECT 
                    cluster_id,
                    addressid,
                    latitude,
                    longitude,
                    cluster_center_lat,
                    cluster_center_lng
                FROM cluster_addresses_by_proximity($1, $2)
                ORDER BY cluster_id, addressid
            `, [maxDistance, 95]);
            
            // Group results by cluster
            const clusters = {};
            result.rows.forEach(row => {
                if (!clusters[row.cluster_id]) {
                    clusters[row.cluster_id] = {
                        clusterId: row.cluster_id,
                        centerLat: parseFloat(row.cluster_center_lat),
                        centerLng: parseFloat(row.cluster_center_lng),
                        locations: []
                    };
                }
                
                // Find the original address object
                const originalAddress = addressCoordinates.find(ac => ac.addressId === row.addressid);
                if (originalAddress) {
                    clusters[row.cluster_id].locations.push({
                        addressId: row.addressid,
                        address: originalAddress.address,
                        latitude: parseFloat(row.latitude),
                        longitude: parseFloat(row.longitude)
                    });
                }
            });
            
            const clusterArray = Object.values(clusters);
            console.log(`PostGIS clustering created ${clusterArray.length} clusters`);
            
            // Log cluster details
            clusterArray.forEach((cluster, index) => {
                console.log(`Cluster ${index + 1}: ${cluster.locations.length} locations`);
            });
            
            return clusterArray;
        } catch (error) {
            console.error('Error in performSpatialClustering:', error);
            throw error;
        }
    }



    /**
     * Map clusters back to tickets
     * @param {Array} clusters - Array of clusters
     * @param {Array} tickets - Array of tickets
     * @returns {Array} - Array of ticket clusters
     */
    /**
     * Map location clusters back to tickets - assigns ALL tickets at each location to their respective cluster
     * @param {Array} locationClusters - Array of location-based clusters
     * @param {Array} tickets - Array of all tickets
     * @returns {Array} - Array of ticket clusters with all tickets assigned
     */
    mapLocationClustersToTickets(locationClusters, tickets) {
        const ticketClusters = [];
        
        for (const cluster of locationClusters) {
            const clusterTickets = [];
            const clusterAddresses = cluster.locations.map(loc => loc.address);
            
            // Find ALL tickets that have addresses in this cluster
            for (const ticket of tickets) {
                const ticketAddress = ticket.address;
                
                // Check if this ticket's address is in this cluster
                if (clusterAddresses.includes(ticketAddress)) {
                    clusterTickets.push(ticket);
                }
            }
            
            ticketClusters.push({
                clusterId: cluster.clusterId,
                centerLat: cluster.centerLat,
                centerLng: cluster.centerLng,
                locations: cluster.locations,
                uniqueAddresses: clusterAddresses,
                tickets: clusterTickets,
                ticketCount: clusterTickets.length,
                addressCount: cluster.locations.length,
                // Add summary for debugging
                summary: {
                    uniqueLocations: cluster.locations.length,
                    totalTickets: clusterTickets.length,
                    locationToTicketRatio: clusterTickets.length / cluster.locations.length
                }
            });
        }
        
        // Log summary
        const totalTicketsAssigned = ticketClusters.reduce((sum, cluster) => sum + cluster.ticketCount, 0);
        const totalUniqueLocations = ticketClusters.reduce((sum, cluster) => sum + cluster.addressCount, 0);
        
        console.log(`=== CLUSTERING SUMMARY ===`);
        console.log(`Total location clusters: ${ticketClusters.length}`);
        console.log(`Total unique locations: ${totalUniqueLocations}`);
        console.log(`Total tickets assigned: ${totalTicketsAssigned}`);
        console.log(`Average tickets per location: ${(totalTicketsAssigned / totalUniqueLocations).toFixed(2)}`);
        
        ticketClusters.forEach((cluster, index) => {
            console.log(`Cluster ${index + 1}: ${cluster.addressCount} locations, ${cluster.ticketCount} tickets`);
        });
        
        return ticketClusters;
    }


}

module.exports = LocationClusteringService; 