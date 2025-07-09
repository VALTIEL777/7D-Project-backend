const db = require('../config/db');

class LocationClusteringService {
    constructor() {
        this.maxDistance = 30000; // Increased to 30km for much better clustering in Chicago
        this.maxLocationsPerCluster = 25; // Default max locations per cluster
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
            
            console.log(`Clustering ${tickets.length} locations with max distance ${maxDistance}m`);
            
            // Step 1: Extract unique addresses from tickets
            const uniqueAddresses = [...new Set(tickets.map(ticket => ticket.address))];
            console.log(`Found ${uniqueAddresses.length} unique addresses`);
            
            // Step 2: Get coordinates for all addresses (geocode if needed)
            const addressCoordinates = await this.getAddressCoordinates(uniqueAddresses);
            
            if (addressCoordinates.length === 0) {
                throw new Error('No locations found with valid coordinates');
            }
            
            console.log(`Successfully obtained coordinates for ${addressCoordinates.length} addresses`);
            
            // Step 3: Perform spatial clustering
            const clusters = await this.performSpatialClustering(addressCoordinates, maxDistance, maxLocationsPerCluster, minLocationsPerCluster);
            
            console.log(`Created ${clusters.length} clusters`);
            
            // Step 4: Map clusters back to tickets
            const ticketClusters = this.mapClustersToTickets(clusters, tickets);
            
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
                    console.log(`Geocoding address: ${address}`);
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
            
            console.log(`Parsing address: "${addressPart}"`);
            
            // Match pattern like "5303 S WASHTENAW AVE"
            const regex = /^(\d+)\s+([NSEW])\s+(.+?)\s+(AVE|ST|RD|BLVD|DR|LN|CT|PL|WAY|CIR|PKWY)$/i;
            const match = addressPart.match(regex);
            
            if (match) {
                console.log(`Matched pattern 1: ${match[1]} ${match[2]} ${match[3]} ${match[4]}`);
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
                console.log(`Matched pattern 2: ${match2[1]} ${match2[2]} ${match2[3]}`);
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
                console.log(`Matched pattern 3: ${match3[1]} ${match3[2]} ${match3[3]}`);
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
                console.log(`Matched pattern 4: ${match4[1]} ${match4[2]}`);
                return {
                    number: match4[1],
                    cardinal: '', // No cardinal direction
                    street: match4[2].toUpperCase(),
                    suffix: '' // No suffix
                };
            }
            
            console.log(`Could not parse address: "${addressPart}"`);
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
            console.log(`\n=== SPATIAL CLUSTERING START ===`);
            console.log(`Total addresses to cluster: ${addressCoordinates.length}`);
            console.log(`Max distance: ${maxDistance}m (${maxDistance/1000}km)`);
            console.log(`Min locations per cluster: ${minLocationsPerCluster}`);
            console.log(`Max locations per cluster: ${maxLocationsPerCluster}`);
            
            const clusters = [];
            const processedAddressIds = new Set();
            let clusterId = 1;
            
            // Sort addresses by density (areas with more addresses first)
            console.log(`\n--- Calculating address density ---`);
            const addressDensity = await this.calculateAddressDensity(addressCoordinates);
            const sortedAddresses = addressCoordinates.sort((a, b) => {
                const densityA = addressDensity.get(a.addressId) || 0;
                const densityB = addressDensity.get(b.addressId) || 0;
                return densityB - densityA; // Higher density first
            });
            
            console.log(`Addresses sorted by density. Top 5 densities:`);
            sortedAddresses.slice(0, 5).forEach((addr, i) => {
                const density = addressDensity.get(addr.addressId) || 0;
                console.log(`  ${i+1}. Address ${addr.addressId}: ${density} nearby addresses`);
            });
            
            console.log(`\n--- Creating optimal clusters ---`);
            let clustersCreated = 0;
            let clustersMerged = 0;
            let smallClustersKept = 0;
            
            for (const coord of sortedAddresses) {
                if (processedAddressIds.has(coord.addressId)) {
                    console.log(`Skipping already processed address: ${coord.addressId} (${coord.address})`);
                    continue; // Skip if already processed
                }
                
                console.log(`\n--- Processing address ${coord.addressId} (${coord.address}) ---`);
                console.log(`  Coordinates: ${coord.latitude}, ${coord.longitude}`);
                console.log(`  Processed addresses so far: ${processedAddressIds.size}/${addressCoordinates.length}`);
                
                // Try to create a cluster with minLocationsPerCluster-maxLocationsPerCluster locations
                let cluster = await this.createOptimalCluster(coord, addressCoordinates, processedAddressIds, maxDistance, minLocationsPerCluster);
                
                if (cluster && cluster.locations.length >= minLocationsPerCluster) {
                    console.log(`✓ Created optimal cluster with ${cluster.locations.length} locations (>= ${minLocationsPerCluster})`);
                    clusters.push(cluster);
                    clusterId++;
                    clustersCreated++;
                    
                    // Mark all addresses in this cluster as processed
                    cluster.locations.forEach(loc => {
                        processedAddressIds.add(loc.addressId);
                    });
                } else if (cluster && cluster.locations.length > 0) {
                    console.log(`⚠ Created small cluster with ${cluster.locations.length} locations (< ${minLocationsPerCluster})`);
                    console.log(`  Attempting to merge with existing clusters...`);
                    
                    // If we have a smaller cluster, try to merge it with nearby clusters
                    const merged = await this.mergeSmallCluster(cluster, clusters, addressCoordinates, processedAddressIds, maxLocationsPerCluster);
                    if (!merged) {
                        console.log(`  ✗ Could not merge small cluster, keeping it as is`);
                        // If we can't merge, keep the small cluster
                        clusters.push(cluster);
                        clusterId++;
                        smallClustersKept++;
                        
                        // Mark all addresses in this cluster as processed
                        cluster.locations.forEach(loc => {
                            processedAddressIds.add(loc.addressId);
                        });
                    } else {
                        console.log(`  ✓ Successfully merged small cluster with existing cluster`);
                        clustersMerged++;
                    }
                } else {
                    console.log(`✗ Could not create cluster for address ${coord.addressId} (${coord.address})`);
                }
            }
            
            // Handle remaining unprocessed addresses by creating smaller clusters
            const remainingAddresses = addressCoordinates.filter(coord => !processedAddressIds.has(coord.addressId));
            if (remainingAddresses.length > 0) {
                console.log(`\n--- Processing remaining addresses ---`);
                console.log(`Creating clusters for ${remainingAddresses.length} remaining addresses`);
                const remainingClusters = await this.createRemainingClusters(remainingAddresses, processedAddressIds, clusterId, maxLocationsPerCluster, minLocationsPerCluster);
                clusters.push(...remainingClusters);
                console.log(`Created ${remainingClusters.length} additional clusters for remaining addresses`);
            }
            
            console.log(`\n=== CLUSTERING SUMMARY ===`);
            console.log(`Total clusters created: ${clusters.length}`);
            console.log(`  - Optimal clusters (>= ${minLocationsPerCluster}): ${clustersCreated}`);
            console.log(`  - Small clusters merged: ${clustersMerged}`);
            console.log(`  - Small clusters kept: ${smallClustersKept}`);
            console.log(`  - Remaining address clusters: ${clusters.length - clustersCreated - smallClustersKept}`);
            console.log(`Total addresses processed: ${processedAddressIds.size}/${addressCoordinates.length}`);
            
            // Log cluster sizes for debugging
            console.log(`\n--- Cluster Size Distribution ---`);
            clusters.forEach((cluster, index) => {
                console.log(`Cluster ${index + 1}: ${cluster.locations.length} locations`);
                if (cluster.locations.length === 1) {
                    console.log(`  ⚠ WARNING: Single-location cluster detected!`);
                    console.log(`  Address: ${cluster.locations[0].address}`);
                    console.log(`  Coordinates: ${cluster.locations[0].latitude}, ${cluster.locations[0].longitude}`);
                }
            });
            
            // Count single-location clusters
            const singleLocationClusters = clusters.filter(cluster => cluster.locations.length === 1);
            if (singleLocationClusters.length > 0) {
                console.log(`\n⚠ WARNING: ${singleLocationClusters.length} single-location clusters detected!`);
                console.log(`This may indicate clustering distance is too small or addresses are too far apart.`);
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
        console.log(`  Creating optimal cluster around: ${centerCoord.address} (${centerCoord.latitude}, ${centerCoord.longitude})`);
        
        // Start with a smaller distance and gradually increase to find optimal cluster size
        let currentDistance = maxDistance * 0.5; // Start with half the max distance
        let cluster = null;
        let attempts = 0;
        const maxAttempts = 10;
        
        console.log(`  Starting with distance: ${currentDistance}m (${currentDistance/1000}km)`);
        
        while (currentDistance <= maxDistance && (!cluster || cluster.locations.length < minLocationsPerCluster) && attempts < maxAttempts) {
            attempts++;
            console.log(`  Attempt ${attempts}: Searching with distance ${currentDistance}m (${currentDistance/1000}km)`);
            
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
            
            console.log(`    Found ${result.rows.length} total addresses within ${currentDistance}m`);
            
            const availableLocations = result.rows.filter(row => !processedAddressIds.has(row.addressid));
            console.log(`    Available addresses (not processed): ${availableLocations.length}`);
            
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
                
                console.log(`    Created cluster with ${cluster.locations.length} locations`);
                
                // If we have a good cluster size (minLocationsPerCluster-maxLocationsPerCluster), stop searching
                if (availableLocations.length >= minLocationsPerCluster) {
                    console.log(`    ✓ Optimal cluster size reached (${availableLocations.length} >= ${minLocationsPerCluster}), stopping search`);
                    break;
                } else {
                    console.log(`    ⚠ Cluster size ${availableLocations.length} < ${minLocationsPerCluster}, continuing search`);
                }
            } else {
                console.log(`    ✗ No available addresses found within ${currentDistance}m`);
            }
            
            currentDistance += maxDistance * 0.1; // Increase distance by 10% of max
            console.log(`    Increasing distance to ${currentDistance}m (${currentDistance/1000}km) for next attempt`);
        }
        
        if (attempts >= maxAttempts) {
            console.log(`  ⚠ Reached maximum attempts (${maxAttempts}), stopping cluster creation`);
        }
        
        if (cluster) {
            console.log(`  Final cluster: ${cluster.locations.length} locations`);
            if (cluster.locations.length === 1) {
                console.log(`  ⚠ WARNING: Single-location cluster created!`);
                console.log(`  This may indicate the address is isolated or clustering distance is insufficient.`);
            }
        } else {
            console.log(`  ✗ Failed to create cluster for this address`);
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
        console.log(`  Attempting to merge small cluster (${smallCluster.locations.length} locations) with existing clusters...`);
        console.log(`  Small cluster center: ${smallCluster.centerLat}, ${smallCluster.centerLng}`);
        
        for (let i = 0; i < existingClusters.length; i++) {
            const existingCluster = existingClusters[i];
            const combinedSize = existingCluster.locations.length + smallCluster.locations.length;
            
            console.log(`  Checking existing cluster ${i + 1}: ${existingCluster.locations.length} locations`);
            console.log(`  Combined size would be: ${combinedSize} (max allowed: ${maxLocationsPerCluster})`);
            
            if (combinedSize <= maxLocationsPerCluster) {
                // Check if clusters are close enough to merge
                const distance = await this.calculateClusterDistance(existingCluster, smallCluster);
                console.log(`  Distance between clusters: ${distance}m (max for merging: 3000m)`);
                
                if (distance <= 3000) { // 3km threshold for merging
                    console.log(`  ✓ Clusters are close enough and size is acceptable, merging...`);
                    
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
                    
                    console.log(`  ✓ Successfully merged! New cluster size: ${existingCluster.locations.length} locations`);
                    return true;
                } else {
                    console.log(`  ✗ Clusters too far apart (${distance}m > 3000m)`);
                }
            } else {
                console.log(`  ✗ Combined size too large (${combinedSize} > ${maxLocationsPerCluster})`);
            }
        }
        
        console.log(`  ✗ Could not merge with any existing cluster`);
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
    mapClustersToTickets(clusters, tickets) {
        const ticketClusters = [];
        const assignedTicketIds = new Set(); // Track which tickets have been assigned
        const assignedAddressIds = new Set(); // Track which addresses have been assigned
        
        console.log(`Mapping ${clusters.length} clusters to ${tickets.length} tickets`);
        
        for (const cluster of clusters) {
            const clusterTickets = [];
            
            // For each location in the cluster, find tickets that have this address and haven't been assigned yet
            for (const location of cluster.locations) {
                // Skip if this address has already been assigned to another cluster
                if (assignedAddressIds.has(location.addressId)) {
                    console.log(`Skipping already assigned address: ${location.address} (ID: ${location.addressId})`);
                    continue;
                }
                
                const matchingTickets = tickets.filter(ticket => 
                    ticket.address === location.address && 
                    !assignedTicketIds.has(ticket.ticketid)
                );
                
                // Assign these tickets to this cluster
                for (const ticket of matchingTickets) {
                    clusterTickets.push(ticket);
                    assignedTicketIds.add(ticket.ticketid); // Mark as assigned
                }
                
                // Mark this address as assigned
                assignedAddressIds.add(location.addressId);
            }
            
            if (clusterTickets.length > 0) {
                ticketClusters.push({
                    clusterId: cluster.clusterId,
                    centerLat: cluster.centerLat,
                    centerLng: cluster.centerLng,
                    tickets: clusterTickets,
                    locationCount: cluster.locations.length,
                    ticketCount: clusterTickets.length,
                    uniqueAddresses: cluster.locations.map(loc => loc.address)
                });
                
                console.log(`Cluster ${cluster.clusterId}: ${clusterTickets.length} tickets assigned`);
            }
        }
        
                    // Log unassigned tickets for debugging
            const unassignedTickets = tickets.filter(ticket => !assignedTicketIds.has(ticket.ticketid));
            if (unassignedTickets.length > 0) {
                console.log(`Warning: ${unassignedTickets.length} tickets were not assigned to any cluster:`, 
                    unassignedTickets.map(t => `${t.ticketid} (${t.address})`));
                
                // Only create fallback cluster for tickets WITH coordinates
                const ticketsWithCoords = unassignedTickets.filter(t => t.latitude && t.longitude);
                if (ticketsWithCoords.length > 0) {
                    console.log(`Creating fallback cluster for ${ticketsWithCoords.length} unassigned tickets with coordinates`);
                    
                    const totalLat = ticketsWithCoords.reduce((sum, t) => sum + parseFloat(t.latitude), 0);
                    const totalLng = ticketsWithCoords.reduce((sum, t) => sum + parseFloat(t.longitude), 0);
                    const centerLat = totalLat / ticketsWithCoords.length;
                    const centerLng = totalLng / ticketsWithCoords.length;
                    
                    const fallbackCluster = {
                        clusterId: Date.now() + Math.random(),
                        centerLat: centerLat,
                        centerLng: centerLng,
                        tickets: ticketsWithCoords, // Only include tickets with coordinates
                        locationCount: ticketsWithCoords.length,
                        ticketCount: ticketsWithCoords.length,
                        uniqueAddresses: [...new Set(ticketsWithCoords.map(t => t.address).filter(addr => addr && addr.trim() !== ''))]
                    };
                    
                    ticketClusters.push(fallbackCluster);
                    console.log(`Created fallback cluster with ${ticketsWithCoords.length} tickets`);
                }
                
                // Log tickets without coordinates that will be excluded
                const ticketsWithoutCoords = unassignedTickets.filter(t => !t.latitude || !t.longitude);
                if (ticketsWithoutCoords.length > 0) {
                    console.log(`Excluding ${ticketsWithoutCoords.length} tickets without coordinates from clustering:`, 
                        ticketsWithoutCoords.map(t => `${t.ticketid} (${t.address})`));
                }
            }
            
            // Log summary statistics
            const totalAssignedTickets = assignedTicketIds.size;
            const totalUnassignedTickets = unassignedTickets.length;
            const totalProcessedTickets = totalAssignedTickets + totalUnassignedTickets;
            
            console.log(`=== CLUSTERING SUMMARY ===`);
            console.log(`Total tickets processed: ${totalProcessedTickets}`);
            console.log(`Total tickets assigned: ${totalAssignedTickets}`);
            console.log(`Total tickets unassigned: ${totalUnassignedTickets}`);
            console.log(`Total clusters created: ${ticketClusters.length}`);
            console.log(`Expected tickets: ${tickets.length}`);
            console.log(`Difference: ${totalProcessedTickets - tickets.length} (should be 0)`);
            
            if (totalProcessedTickets !== tickets.length) {
                console.log(`ERROR: Ticket count mismatch! Expected ${tickets.length}, got ${totalProcessedTickets}`);
            }
        
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
            
            console.log(`Clustering ${tickets.length} tickets with coordinates, max distance ${maxDistance}m`);
            
            // Filter tickets with valid coordinates
            const ticketsWithCoords = tickets.filter(ticket => 
                ticket.latitude && ticket.longitude && 
                !isNaN(parseFloat(ticket.latitude)) && !isNaN(parseFloat(ticket.longitude))
            );
            
            if (ticketsWithCoords.length === 0) {
                throw new Error('No tickets found with valid coordinates');
            }

            console.log(`Found ${ticketsWithCoords.length} tickets with valid coordinates`);

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