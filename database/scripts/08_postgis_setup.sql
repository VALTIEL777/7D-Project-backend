-- PostGIS Setup for Location Clustering
-- This script sets up PostGIS extension and ensures proper spatial functionality

-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable PostGIS Topology extension for advanced spatial operations
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Add spatial index on Addresses table for better clustering performance
-- This will help with spatial queries and clustering operations
CREATE INDEX IF NOT EXISTS idx_addresses_spatial 
ON Addresses USING GIST (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326))
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND deletedAt IS NULL;

-- Add composite index for better query performance on location-based operations
CREATE INDEX IF NOT EXISTS idx_addresses_location_lookup
ON Addresses (latitude, longitude, addressId)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND deletedAt IS NULL;

-- Add function to calculate distance between two points in meters
CREATE OR REPLACE FUNCTION calculate_distance_meters(
    lat1 NUMERIC,
    lng1 NUMERIC,
    lat2 NUMERIC,
    lng2 NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
    RETURN ST_Distance(
        ST_SetSRID(ST_MakePoint(lng1, lat1), 4326)::geography,
        ST_SetSRID(ST_MakePoint(lng2, lat2), 4326)::geography
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add function to find nearby addresses within a specified distance
CREATE OR REPLACE FUNCTION find_nearby_addresses(
    center_lat NUMERIC,
    center_lng NUMERIC,
    max_distance_meters NUMERIC,
    max_results INTEGER DEFAULT 100
) RETURNS TABLE (
    addressid INTEGER,
    latitude NUMERIC,
    longitude NUMERIC,
    distance_meters NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.addressid,
        a.latitude,
        a.longitude,
        ST_Distance(
            ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
            ST_SetSRID(ST_MakePoint(a.longitude, a.latitude), 4326)::geography
        ) as distance_meters
    FROM Addresses a
    WHERE a.latitude IS NOT NULL 
    AND a.longitude IS NOT NULL 
    AND a.deletedAt IS NULL
    AND ST_DWithin(
        ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
        ST_SetSRID(ST_MakePoint(a.longitude, a.latitude), 4326)::geography,
        max_distance_meters
    )
    ORDER BY distance_meters
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add function to cluster addresses by proximity with configurable distance and cluster size
CREATE OR REPLACE FUNCTION cluster_addresses_by_proximity(
    max_distance_meters NUMERIC DEFAULT 30000,
    max_locations_per_cluster INTEGER DEFAULT 95
) RETURNS TABLE (
    cluster_id INTEGER,
    addressid INTEGER,
    latitude NUMERIC,
    longitude NUMERIC,
    cluster_center_lat NUMERIC,
    cluster_center_lng NUMERIC
) AS $$
DECLARE
    cluster_counter INTEGER := 1;
    current_address RECORD;
    cluster_center_lat NUMERIC;
    cluster_center_lng NUMERIC;
    locations_in_cluster INTEGER;
BEGIN
    -- Create a temporary table to track processed addresses
    CREATE TEMP TABLE IF NOT EXISTS processed_addresses (
        addressid INTEGER PRIMARY KEY
    ) ON COMMIT DROP;
    
    -- Process each address that hasn't been clustered yet
    FOR current_address IN 
        SELECT DISTINCT addr.addressid, addr.latitude, addr.longitude
        FROM Addresses addr
        WHERE addr.latitude IS NOT NULL 
        AND addr.longitude IS NOT NULL 
        AND addr.deletedAt IS NULL
        AND addr.addressid NOT IN (SELECT pa.addressid FROM processed_addresses pa)
        ORDER BY addr.addressid
    LOOP
        -- Find all nearby addresses for this cluster
        WITH nearby_addresses AS (
            SELECT 
                nearby.addressid,
                nearby.latitude,
                nearby.longitude,
                ROW_NUMBER() OVER (ORDER BY 
                    ST_Distance(
                        ST_SetSRID(ST_MakePoint(current_address.longitude, current_address.latitude), 4326)::geography,
                        ST_SetSRID(ST_MakePoint(nearby.longitude, nearby.latitude), 4326)::geography
                    )
                ) as rn
            FROM Addresses nearby
            WHERE nearby.latitude IS NOT NULL 
            AND nearby.longitude IS NOT NULL 
            AND nearby.deletedAt IS NULL
            AND nearby.addressid NOT IN (SELECT pa.addressid FROM processed_addresses pa)
            AND ST_DWithin(
                ST_SetSRID(ST_MakePoint(current_address.longitude, current_address.latitude), 4326)::geography,
                ST_SetSRID(ST_MakePoint(nearby.longitude, nearby.latitude), 4326)::geography,
                max_distance_meters
            )
        ),
        cluster_addresses AS (
            SELECT 
                na.addressid,
                na.latitude,
                na.longitude
            FROM nearby_addresses na
            WHERE na.rn <= max_locations_per_cluster
        )
        SELECT 
            AVG(ca.latitude) as center_lat,
            AVG(ca.longitude) as center_lng,
            COUNT(*) as location_count
        INTO cluster_center_lat, cluster_center_lng, locations_in_cluster
        FROM cluster_addresses ca;
        
        -- Only create cluster if we have addresses
        IF locations_in_cluster > 0 THEN
            -- Return the cluster data
            RETURN QUERY
            SELECT 
                cluster_counter,
                result.addressid,
                result.latitude,
                result.longitude,
                cluster_center_lat,
                cluster_center_lng
            FROM (
                SELECT 
                    final.addressid,
                    final.latitude,
                    final.longitude,
                    ROW_NUMBER() OVER (ORDER BY 
                        ST_Distance(
                            ST_SetSRID(ST_MakePoint(current_address.longitude, current_address.latitude), 4326)::geography,
                            ST_SetSRID(ST_MakePoint(final.longitude, final.latitude), 4326)::geography
                        )
                    ) as rn
                FROM Addresses final
                WHERE final.latitude IS NOT NULL 
                AND final.longitude IS NOT NULL 
                AND final.deletedAt IS NULL
                AND final.addressid NOT IN (SELECT pa.addressid FROM processed_addresses pa)
                AND ST_DWithin(
                    ST_SetSRID(ST_MakePoint(current_address.longitude, current_address.latitude), 4326)::geography,
                    ST_SetSRID(ST_MakePoint(final.longitude, final.latitude), 4326)::geography,
                    max_distance_meters
                )
            ) result
            WHERE result.rn <= max_locations_per_cluster;
            
            -- Mark addresses in this cluster as processed
            INSERT INTO processed_addresses (addressid)
            SELECT addr_to_process.addressid
            FROM Addresses addr_to_process
            WHERE addr_to_process.latitude IS NOT NULL 
            AND addr_to_process.longitude IS NOT NULL 
            AND addr_to_process.deletedAt IS NULL
            AND addr_to_process.addressid NOT IN (SELECT pa.addressid FROM processed_addresses pa)
            AND ST_DWithin(
                ST_SetSRID(ST_MakePoint(current_address.longitude, current_address.latitude), 4326)::geography,
                ST_SetSRID(ST_MakePoint(addr_to_process.longitude, addr_to_process.latitude), 4326)::geography,
                max_distance_meters
            )
            LIMIT max_locations_per_cluster;
            
            cluster_counter := cluster_counter + 1;
        END IF;
    END LOOP;
    
    DROP TABLE IF EXISTS processed_addresses;
END;
$$ LANGUAGE plpgsql;

-- Add comments to document the functions
COMMENT ON FUNCTION calculate_distance_meters(NUMERIC, NUMERIC, NUMERIC, NUMERIC) IS 
'Calculate the distance between two geographic points in meters using PostGIS';

COMMENT ON FUNCTION find_nearby_addresses(NUMERIC, NUMERIC, NUMERIC, INTEGER) IS 
'Find addresses within a specified distance from a center point, ordered by distance (default max 100 results)';

COMMENT ON FUNCTION cluster_addresses_by_proximity(NUMERIC, INTEGER) IS 
'Cluster addresses by proximity using PostGIS spatial functions, with configurable distance and cluster size limits (default 10km radius, max 100 per cluster)';

-- Verify PostGIS is working correctly
SELECT 
    PostGIS_Version() as postgis_version,
    PostGIS_Extensions_Upgrade() as extensions_upgraded;