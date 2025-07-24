const db = require('../config/db');

class LocationClusteringService {
    constructor() {
        this.maxDistance = 30000; // Increased to 30km for much better clustering in Chicago
        this.maxLocationsPerCluster = 150; // Default max locations per cluster
        this.minLocationsPerCluster = 20; // Minimum locations per cluster
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
                maxLocationsPerCluster = this.maxLocationsPerCluster,
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
     * Perform spatial clustering using PostGIS functions
     * @param {Array} addressCoordinates - Array of address objects with coordinates
     * @param {number} maxDistance - Maximum distance in meters
     * @param {number} maxLocationsPerCluster - Maximum locations per cluster
     * @returns {Promise<Array>} - Array of clusters
     */
    async performSpatialClustering(addressCoordinates, maxDistance, maxLocationsPerCluster, minLocationsPerCluster) {
        try {
            const clusters = [];
            const processedAddressIds = new Set();
            let clusterId = 1;
            
            // Sort addresses by density (areas with more addresses first)
            const addressDensity = await this.calculateAddressDensity(addressCoordinates);
            const sortedAddresses = addressCoordinates.sort((a, b) => {
                const densityA = addressDensity.get(a.addressId) || 0;
                const densityB = addressDensity.get(b.addressId) || 0;
                return densityB - densityA; // Higher density first
            });
            
            for (const coord of sortedAddresses) {
                if (processedAddressIds.has(coord.addressId)) {
                    continue; // Skip if already processed
                }
                
                // Try to create a cluster with minLocationsPerCluster-maxLocationsPerCluster locations
                let cluster = await this.createOptimalCluster(coord, addressCoordinates, processedAddressIds, maxDistance, minLocationsPerCluster);
                
                if (cluster && cluster.locations.length >= minLocationsPerCluster) {
                    clusters.push(cluster);
                    clusterId++;
                    
                    // Mark all addresses in this cluster as processed
                    cluster.locations.forEach(loc => {
                        processedAddressIds.add(loc.addressId);
                    });
                } else if (cluster && cluster.locations.length > 0) {
                    // If we have a smaller cluster, try to merge it with nearby clusters
                    const merged = await this.mergeSmallCluster(cluster, clusters, addressCoordinates, processedAddressIds, maxLocationsPerCluster);
                    if (!merged) {
                        // If we can't merge, keep the small cluster
                        clusters.push(cluster);
                        clusterId++;
                    }
                } else {
                    // If we can't create cluster, keep the address as is
                    clusters.push({
                        clusterId: clusterId,
                        centerLat: coord.latitude,
                        centerLng: coord.longitude,
                        locations: [{
                            addressId: coord.addressId,
                            address: coord.address,
                            latitude: coord.latitude,
                            longitude: coord.longitude
                        }]
                    });
                    clusterId++;
                    processedAddressIds.add(coord.addressId);
                }
            }
            
            // Handle remaining unprocessed addresses by creating smaller clusters
            const remainingAddresses = addressCoordinates.filter(coord => !processedAddressIds.has(coord.addressId));
            if (remainingAddresses.length > 0) {
                const remainingClusters = await this.createRemainingClusters(remainingAddresses, processedAddressIds, clusterId, maxLocationsPerCluster, minLocationsPerCluster);
                clusters.push(...remainingClusters);
            }
            
            return clusters;
        } catch (error) {
            console.error('Error in performSpatialClustering:', error);
            throw error;
        }
    }

    /**
     * Calculate address density for each location
     * @param {Array} addressCoordinates - Array of address coordinates
     * @returns {Promise<Map>} - Map of addressId to density count
     */
    async calculateAddressDensity(addressCoordinates) {
        const densityMap = new Map();
        
        for (const coord of addressCoordinates) {
            const result = await db.query(`
                SELECT COUNT(*) as count
                FROM Addresses a
                WHERE a.latitude IS NOT NULL 
                    AND a.longitude IS NOT NULL 
                    AND a.deletedAt IS NULL
                    AND ST_DWithin(
                        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                        ST_SetSRID(ST_MakePoint(a.longitude, a.latitude), 4326)::geography,
                        2000
                    )
            `, [coord.longitude, coord.latitude]);
            
            densityMap.set(coord.addressId, parseInt(result.rows[0].count));
        }
        
        return densityMap;
    }

    /**
     * Create an optimal cluster with 20-25 locations
     * @param {Object} centerCoord - Center coordinate for the cluster
     * @param {Array} allAddresses - All available addresses
     * @param {Set} processedAddressIds - Set of already processed address IDs
     * @param {number} maxDistance - Maximum distance for clustering
     * @returns {Promise<Object|null>} - Cluster object or null
     */
    async createOptimalCluster(centerCoord, allAddresses, processedAddressIds, maxDistance, minLocationsPerCluster) {
        let currentDistance = maxDistance * 0.5; // Start with half the max distance
        let cluster = null;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (currentDistance <= maxDistance && (!cluster || cluster.locations.length < minLocationsPerCluster) && attempts < maxAttempts) {
            attempts++;
            
            const result = await db.query(`
                SELECT 
                    a.addressid,
                    a.latitude,
                    a.longitude,
                    ST_Distance(
                        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                        ST_SetSRID(ST_MakePoint(a.longitude, a.latitude), 4326)::geography
                    ) as distance
                FROM Addresses a
                WHERE a.latitude IS NOT NULL 
                    AND a.longitude IS NOT NULL 
                    AND a.deletedAt IS NULL
                    AND ST_DWithin(
                        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                        ST_SetSRID(ST_MakePoint(a.longitude, a.latitude), 4326)::geography,
                        $3
                    )
                ORDER BY distance
                LIMIT 25
            `, [centerCoord.longitude, centerCoord.latitude, currentDistance]);
            
            const availableLocations = result.rows.filter(row => !processedAddressIds.has(row.addressid));
            
            if (availableLocations.length > 0) {
                // Calculate cluster center
                const totalLat = availableLocations.reduce((sum, row) => sum + parseFloat(row.latitude), 0);
                const totalLng = availableLocations.reduce((sum, row) => sum + parseFloat(row.longitude), 0);
                const centerLat = totalLat / availableLocations.length;
                const centerLng = totalLng / availableLocations.length;
                
                cluster = {
                    clusterId: Date.now() + Math.random(), // Temporary ID
                    centerLat: centerLat,
                    centerLng: centerLng,
                    locations: availableLocations.map(row => ({
                        addressId: row.addressid,
                        address: allAddresses.find(ac => ac.addressId === row.addressid)?.address || '',
                        latitude: parseFloat(row.latitude),
                        longitude: parseFloat(row.longitude)
                    }))
                };
                
                // If we have a good cluster size (minLocationsPerCluster-maxLocationsPerCluster), stop searching
                if (availableLocations.length >= minLocationsPerCluster) {
                    break;
                }
            } else {
                currentDistance += maxDistance * 0.1; // Increase distance by 10% of max
            }
        }
        
        if (attempts >= maxAttempts) {
            return null;
        }
        
        if (cluster) {
            if (cluster.locations.length === 1) {
                console.warn(`Single-location cluster created for address: ${centerCoord.address}`);
            }
        } else {
            return null;
        }
        
        return cluster;
    }

    /**
     * Try to merge a small cluster with nearby clusters
     * @param {Object} smallCluster - Small cluster to merge
     * @param {Array} existingClusters - Existing clusters
     * @param {Array} allAddresses - All available addresses
     * @param {Set} processedAddressIds - Set of processed address IDs
     * @returns {Promise<boolean>} - True if merged, false otherwise
     */
    async mergeSmallCluster(smallCluster, existingClusters, allAddresses, processedAddressIds, maxLocationsPerCluster = 25) {
        for (let i = 0; i < existingClusters.length; i++) {
            const existingCluster = existingClusters[i];
            const combinedSize = existingCluster.locations.length + smallCluster.locations.length;
            
            if (combinedSize <= maxLocationsPerCluster) {
                // Check if clusters are close enough to merge
                const distance = await this.calculateClusterDistance(existingCluster, smallCluster);
                
                if (distance <= 15000) { // 15km threshold for merging (increased for large cities)
                    
                    // Merge the clusters
                    existingCluster.locations.push(...smallCluster.locations);
                    
                    // Recalculate center
                    const totalLat = existingCluster.locations.reduce((sum, loc) => sum + loc.latitude, 0);
                    const totalLng = existingCluster.locations.reduce((sum, loc) => sum + loc.longitude, 0);
                    existingCluster.centerLat = totalLat / existingCluster.locations.length;
                    existingCluster.centerLng = totalLng / existingCluster.locations.length;
                    
                    // Mark addresses as processed
                    smallCluster.locations.forEach(loc => {
                        processedAddressIds.add(loc.addressId);
                    });
                    
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Calculate distance between two clusters
     * @param {Object} cluster1 - First cluster
     * @param {Object} cluster2 - Second cluster
     * @returns {Promise<number>} - Distance in meters
     */
    async calculateClusterDistance(cluster1, cluster2) {
        const result = await db.query(`
            SELECT ST_Distance(
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography
            ) as distance
        `, [cluster1.centerLng, cluster1.centerLat, cluster2.centerLng, cluster2.centerLat]);
        
        return parseFloat(result.rows[0].distance);
    }

    /**
     * Create clusters for remaining unprocessed addresses
     * @param {Array} remainingAddresses - Remaining addresses to cluster
     * @param {Set} processedAddressIds - Set of processed address IDs
     * @param {number} startClusterId - Starting cluster ID
     * @returns {Promise<Array>} - Array of clusters
     */
    async createRemainingClusters(remainingAddresses, processedAddressIds, startClusterId, maxLocationsPerCluster = 25, minLocationsPerCluster = 20) {
        const clusters = [];
        let clusterId = startClusterId;
        
        // Group remaining addresses into clusters of minLocationsPerCluster-maxLocationsPerCluster
        const chunkSize = Math.min(minLocationsPerCluster, maxLocationsPerCluster);
        for (let i = 0; i < remainingAddresses.length; i += chunkSize) {
            const chunk = remainingAddresses.slice(i, i + chunkSize);
            
            // Calculate center for this chunk
            const totalLat = chunk.reduce((sum, coord) => sum + coord.latitude, 0);
            const totalLng = chunk.reduce((sum, coord) => sum + coord.longitude, 0);
            const centerLat = totalLat / chunk.length;
            const centerLng = totalLng / chunk.length;
            
            const cluster = {
                clusterId: clusterId,
                centerLat: centerLat,
                centerLng: centerLng,
                locations: chunk.map(coord => ({
                    addressId: coord.addressId,
                    address: coord.address,
                    latitude: coord.latitude,
                    longitude: coord.longitude
                }))
            };
            
            clusters.push(cluster);
            clusterId++;
            
            // Mark as processed
            chunk.forEach(coord => {
                processedAddressIds.add(coord.addressId);
            });
        }
        
        return clusters;
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

    /**
     * Cluster tickets that already have coordinates (for use with pre-fetched data)
     * @param {Array} tickets - Array of tickets with coordinates
     * @param {Object} options - Clustering options
     * @returns {Promise<Array>} - Array of clusters
     */
    async clusterTicketsWithCoordinates(tickets, options = {}) {
        try {
            const { maxDistance = this.maxDistance, maxLocationsPerCluster = this.maxLocationsPerCluster } = options;
            
            // Filter tickets with valid coordinates
            const ticketsWithCoords = tickets.filter(ticket => 
                ticket.latitude && ticket.longitude && 
                !isNaN(parseFloat(ticket.latitude)) && !isNaN(parseFloat(ticket.longitude))
            );
            
            if (ticketsWithCoords.length === 0) {
                throw new Error('No tickets found with valid coordinates');
            }

            // Create a temporary table with the coordinates
            await db.query(`
                CREATE TEMP TABLE temp_ticket_coordinates (
                    ticket_id INTEGER,
                    address TEXT,
                    latitude NUMERIC,
                    longitude NUMERIC
                ) ON COMMIT DROP
            `);

            // Insert coordinates into temporary table
            for (const ticket of ticketsWithCoords) {
                await db.query(`
                    INSERT INTO temp_ticket_coordinates (ticket_id, address, latitude, longitude)
                    VALUES ($1, $2, $3, $4)
                `, [ticket.ticketid, ticket.address, parseFloat(ticket.latitude), parseFloat(ticket.longitude)]);
            }

            // Use PostGIS clustering function
            const result = await db.query(`
                SELECT 
                    cluster_id,
                    ticket_id,
                    address,
                    latitude,
                    longitude,
                    cluster_center_lat,
                    cluster_center_lng
                FROM cluster_addresses_by_proximity($1, $2)
                WHERE ticket_id IN (SELECT ticket_id FROM temp_ticket_coordinates)
                ORDER BY cluster_id, ticket_id
            `, [maxDistance, maxLocationsPerCluster]);

            // Group results by cluster
            const clusters = {};
            result.rows.forEach(row => {
                if (!clusters[row.cluster_id]) {
                    clusters[row.cluster_id] = {
                        clusterId: row.cluster_id,
                        centerLat: parseFloat(row.cluster_center_lat),
                        centerLng: parseFloat(row.cluster_center_lng),
                        tickets: []
                    };
                }
                
                // Find the original ticket object
                const originalTicket = ticketsWithCoords.find(t => t.ticketid === row.ticket_id);
                if (originalTicket) {
                    clusters[row.cluster_id].tickets.push(originalTicket);
                }
            });

            const ticketClusters = Object.values(clusters).map(cluster => ({
                ...cluster,
                locationCount: cluster.tickets.length,
                ticketCount: cluster.tickets.length
            }));

            console.log(`Created ${ticketClusters.length} clusters`);
            return ticketClusters;
        } catch (error) {
            console.error('Error in clusterTicketsWithCoordinates:', error);
            throw error;
        }
    }
}

module.exports = LocationClusteringService; 