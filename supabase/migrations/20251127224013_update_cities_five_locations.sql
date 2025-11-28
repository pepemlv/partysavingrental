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

-- Insert 5 location cities
INSERT INTO cities (name, state, pickup_address) VALUES
  ('Charlotte', 'NC', '3244 BAMBURGH COURT'),
  ('Raleigh', 'NC', '456 Capital Blvd'),
  ('Columbia', 'SC', '789 Assembly Street'),
  ('Atlanta', 'GA', '321 Peachtree Street'),
  ('Miami', 'FL', '567 Ocean Drive');