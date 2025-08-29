-- Fix coordinate precision for accurate GPS coordinates
-- This migration updates the latitude and longitude columns to support more decimal places

-- Update Addresses table coordinate precision
ALTER TABLE Addresses 
ALTER COLUMN latitude TYPE NUMERIC(12, 8),
ALTER COLUMN longitude TYPE NUMERIC(12, 8);

-- Update photoEvidence table coordinate precision (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'photoevidence' 
               AND column_name = 'latitude') THEN
        ALTER TABLE photoEvidence 
        ALTER COLUMN latitude TYPE NUMERIC(12, 8),
        ALTER COLUMN longitude TYPE NUMERIC(12, 8);
    END IF;
END $$;

-- Add comment explaining the precision
COMMENT ON COLUMN Addresses.latitude IS 'Latitude coordinate with 8 decimal places precision (approximately 1.1mm accuracy)';
COMMENT ON COLUMN Addresses.longitude IS 'Longitude coordinate with 8 decimal places precision (approximately 1.1mm accuracy)';

-- Example of precision levels:
-- 1 decimal place: ~11.1 km
-- 2 decimal places: ~1.1 km  
-- 3 decimal places: ~110 m
-- 4 decimal places: ~11 m
-- 5 decimal places: ~1.1 m
-- 6 decimal places: ~0.11 m (11 cm)
-- 7 decimal places: ~0.011 m (1.1 cm)
-- 8 decimal places: ~0.0011 m (1.1 mm) - Maximum practical precision 