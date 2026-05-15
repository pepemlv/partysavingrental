/*
  # Add Coordinates to Cities Table

  1. Changes
    - Add latitude and longitude columns to cities table if they don't exist
    - Update Raleigh pickup address with correct coordinates
    
  2. Purpose
    - Provide fallback coordinates when geocoding fails
    - Fix Raleigh address validation issue
*/

-- Add latitude and longitude columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='cities' AND column_name='latitude') THEN
    ALTER TABLE cities ADD COLUMN latitude DECIMAL(10, 7);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='cities' AND column_name='longitude') THEN
    ALTER TABLE cities ADD COLUMN longitude DECIMAL(10, 7);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='cities' AND column_name='notes') THEN
    ALTER TABLE cities ADD COLUMN notes TEXT;
  END IF;
END $$;

-- Update cities with correct coordinates
UPDATE cities SET 
  pickup_address = '2701 McNeill St Raleigh NC 27608',
  latitude = 35.8143410,
  longitude = -78.6290870
WHERE name = 'Raleigh' AND state = 'NC';

-- Update other cities with approximate coordinates
UPDATE cities SET latitude = 35.2271, longitude = -80.8431 
WHERE name = 'Charlotte' AND state = 'NC';

UPDATE cities SET latitude = 34.0007, longitude = -81.0348 
WHERE name = 'Columbia' AND state = 'SC';

UPDATE cities SET latitude = 33.7490, longitude = -84.3880 
WHERE name = 'Atlanta' AND state = 'GA';

UPDATE cities SET latitude = 25.7617, longitude = -80.1918 
WHERE name = 'Miami' AND state = 'FL';
