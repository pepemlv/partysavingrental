/*
  # Update Cities for Five Locations

  1. Changes
    - Remove existing city data
    - Add 5 cities: Charlotte, Raleigh, Columbia, Atlanta, Miami
    - Each city has a pickup/dropoff address

  2. Data
    - Charlotte, NC - 3244 BAMBURGH COURT
    - Raleigh, NC - 456 Capital Blvd
    - Columbia, SC - 789 Assembly Street
    - Atlanta, GA - 321 Peachtree Street
    - Miami, FL - 567 Ocean Drive
*/

-- Clear existing cities
DELETE FROM cities;

-- Insert 5 location cities with coordinates
INSERT INTO cities (name, state, pickup_address, latitude, longitude) VALUES
  ('Charlotte', 'NC', '3244 BAMBURGH COURT', 35.2271, -80.8431),
  ('Raleigh', 'NC', '2701 McNeill St Raleigh NC 27608', 35.8143, -78.6291),
  ('Columbia', 'SC', '789 Assembly Street', 34.0007, -81.0348),
  ('Atlanta', 'GA', '321 Peachtree Street', 33.7490, -84.3880),
  ('Miami', 'FL', '567 Ocean Drive', 25.7617, -80.1918);