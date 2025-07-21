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
    max_results INTEGER DEFAULT 25
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

-- Add function to cluster addresses by proximity
CREATE OR REPLACE FUNCTION cluster_addresses_by_proximity(
    max_distance_meters NUMERIC DEFAULT 5000,
    max_locations_per_cluster INTEGER DEFAULT 25
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
    CREATE TEMP TABLE processed_addresses (
        addressid INTEGER PRIMARY KEY
    ) ON COMMIT DROP;
    
    -- Process each address that hasn't been clustered yet
    FOR current_address IN 
        SELECT DISTINCT a.addressid, a.latitude, a.longitude
        FROM Addresses a
        WHERE a.latitude IS NOT NULL 
        AND a.longitude IS NOT NULL 
        AND a.deletedAt IS NULL
        AND a.addressid NOT IN (SELECT addressid FROM processed_addresses)
        ORDER BY a.addressid
    LOOP
        -- Find all nearby addresses for this cluster
        WITH nearby_addresses AS (
            SELECT 
                a.addressid,
                a.latitude,
                a.longitude,
                ROW_NUMBER() OVER (ORDER BY 
                    ST_Distance(
                        ST_SetSRID(ST_MakePoint(current_address.longitude, current_address.latitude), 4326)::geography,
                        ST_SetSRID(ST_MakePoint(a.longitude, a.latitude), 4326)::geography
                    )
                ) as rn
            FROM Addresses a
            WHERE a.latitude IS NOT NULL 
            AND a.longitude IS NOT NULL 
            AND a.deletedAt IS NULL
            AND a.addressid NOT IN (SELECT addressid FROM processed_addresses)
            AND ST_DWithin(
                ST_SetSRID(ST_MakePoint(current_address.longitude, current_address.latitude), 4326)::geography,
                ST_SetSRID(ST_MakePoint(a.longitude, a.latitude), 4326)::geography,
                max_distance_meters
            )
        ),
        cluster_addresses AS (
            SELECT 
                addressid,
                latitude,
                longitude
            FROM nearby_addresses
            WHERE rn <= max_locations_per_cluster
        )
        SELECT 
            AVG(latitude) as center_lat,
            AVG(longitude) as center_lng,
            COUNT(*) as location_count
        INTO cluster_center_lat, cluster_center_lng, locations_in_cluster
        FROM cluster_addresses;
        
        -- Return the cluster data
        RETURN QUERY
        SELECT 
            cluster_counter,
            ca.addressid,
            ca.latitude,
            ca.longitude,
            cluster_center_lat,
            cluster_center_lng
        FROM (
            SELECT 
                a.addressid,
                a.latitude,
                a.longitude,
                ROW_NUMBER() OVER (ORDER BY 
                    ST_Distance(
                        ST_SetSRID(ST_MakePoint(current_address.longitude, current_address.latitude), 4326)::geography,
                        ST_SetSRID(ST_MakePoint(a.longitude, a.latitude), 4326)::geography
                    )
                ) as rn
            FROM Addresses a
            WHERE a.latitude IS NOT NULL 
            AND a.longitude IS NOT NULL 
            AND a.deletedAt IS NULL
            AND a.addressid NOT IN (SELECT addressid FROM processed_addresses)
            AND ST_DWithin(
                ST_SetSRID(ST_MakePoint(current_address.longitude, current_address.latitude), 4326)::geography,
                ST_SetSRID(ST_MakePoint(a.longitude, a.latitude), 4326)::geography,
                max_distance_meters
            )
        ) ca
        WHERE ca.rn <= max_locations_per_cluster;
        
        -- Mark addresses in this cluster as processed
        INSERT INTO processed_addresses (addressid)
        SELECT a.addressid
        FROM Addresses a
        WHERE a.latitude IS NOT NULL 
        AND a.longitude IS NOT NULL 
        AND a.deletedAt IS NULL
        AND a.addressid NOT IN (SELECT addressid FROM processed_addresses)
        AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(current_address.longitude, current_address.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(a.longitude, a.latitude), 4326)::geography,
            max_distance_meters
        )
        LIMIT max_locations_per_cluster;
        
        cluster_counter := cluster_counter + 1;
    END LOOP;
    
    DROP TABLE processed_addresses;
END;
$$ LANGUAGE plpgsql;

-- Add comments to document the new functions
COMMENT ON FUNCTION calculate_distance_meters(NUMERIC, NUMERIC, NUMERIC, NUMERIC) IS 
'Calculate the distance between two geographic points in meters using PostGIS';

COMMENT ON FUNCTION find_nearby_addresses(NUMERIC, NUMERIC, NUMERIC, INTEGER) IS 
'Find addresses within a specified distance from a center point, ordered by distance';

COMMENT ON FUNCTION cluster_addresses_by_proximity(NUMERIC, INTEGER) IS 
'Cluster addresses by proximity using PostGIS spatial functions, with configurable distance and cluster size limits';

-- Verify PostGIS is working correctly
SELECT 
    PostGIS_Version() as postgis_version,
    PostGIS_Extensions_Upgrade() as extensions_upgraded; 


