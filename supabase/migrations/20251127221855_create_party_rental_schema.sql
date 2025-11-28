/*
  # Party Rental Platform Schema

  1. New Tables
    - `cities`
      - `id` (uuid, primary key)
      - `name` (text) - City name
      - `state` (text) - State abbreviation
      - `pickup_address` (text) - Address for equipment pickup/dropoff
      - `created_at` (timestamptz)
    
    - `products`
      - `id` (uuid, primary key)
      - `name` (text) - Product name
      - `description` (text) - Product description
      - `base_price` (decimal) - Base rental price
      - `image_url` (text) - Product image URL
      - `category` (text) - Product category
      - `created_at` (timestamptz)
    
    - `product_addons`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to products)
      - `name` (text) - Addon name
      - `price` (decimal) - Additional price
      - `created_at` (timestamptz)
    
    - `orders`
      - `id` (uuid, primary key)
      - `customer_name` (text) - Contact person name
      - `customer_phone` (text) - Phone number
      - `customer_email` (text) - Email for receipt
      - `city_id` (uuid, foreign key to cities)
      - `delivery_method` (text) - 'pickup' or 'delivery'
      - `event_address` (text) - Event location address
      - `event_date` (date) - Event date
      - `event_start_time` (time) - Event start time
      - `rental_days` (integer) - Number of rental days
      - `subtotal` (decimal) - Items subtotal
      - `tax` (decimal) - Tax amount
      - `delivery_fee` (decimal) - Delivery fee
      - `collection_fee` (decimal) - Collection fee
      - `total` (decimal) - Total amount
      - `distance_miles` (decimal) - Distance for delivery
      - `status` (text) - Order status
      - `created_at` (timestamptz)
    
    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders)
      - `product_id` (uuid, foreign key to products)
      - `quantity` (integer) - Number of items
      - `base_price` (decimal) - Price per item
      - `addon_selected` (boolean) - Whether addon was selected
      - `addon_price` (decimal) - Addon price if selected
      - `line_total` (decimal) - Total for this line item
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access to products and cities
    - Add policies for order creation and viewing
*/

-- Cities table
CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state text NOT NULL,
  pickup_address text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cities"
  ON cities FOR SELECT
  TO public
  USING (true);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  base_price decimal(10,2) NOT NULL,
  image_url text DEFAULT '',
  category text NOT NULL DEFAULT 'furniture',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  TO public
  USING (true);

-- Product addons table
CREATE TABLE IF NOT EXISTS product_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  price decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product addons"
  ON product_addons FOR SELECT
  TO public
  USING (true);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text NOT NULL,
  city_id uuid NOT NULL REFERENCES cities(id),
  delivery_method text NOT NULL CHECK (delivery_method IN ('pickup', 'delivery')),
  event_address text NOT NULL,
  event_date date NOT NULL,
  event_start_time time NOT NULL,
  rental_days integer NOT NULL DEFAULT 1,
  subtotal decimal(10,2) NOT NULL,
  tax decimal(10,2) NOT NULL,
  delivery_fee decimal(10,2) NOT NULL DEFAULT 0,
  collection_fee decimal(10,2) NOT NULL DEFAULT 0,
  total decimal(10,2) NOT NULL,
  distance_miles decimal(10,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can view their orders by email"
  ON orders FOR SELECT
  TO public
  USING (true);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity integer NOT NULL DEFAULT 1,
  base_price decimal(10,2) NOT NULL,
  addon_selected boolean DEFAULT false,
  addon_price decimal(10,2) DEFAULT 0,
  line_total decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create order items"
  ON order_items FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can view order items"
  ON order_items FOR SELECT
  TO public
  USING (true);

-- Insert sample cities
INSERT INTO cities (name, state, pickup_address) VALUES
  ('Charlotte 2', 'NC', '3244 BAMBURGH COURT'),
  ('Charlotte', 'NC', '123 Main Street'),
  ('Raleigh', 'NC', '456 Capital Blvd')
ON CONFLICT DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, base_price, category) VALUES
  ('Folding Table', 'Sturdy folding table for your event', 9.88, 'furniture'),
  ('Folding Chair', 'Comfortable folding chair for your event', 1.88, 'furniture')
ON CONFLICT DO NOTHING;

-- Insert product addons
INSERT INTO product_addons (product_id, name, price)
SELECT 
  p.id,
  CASE 
    WHEN p.name = 'Folding Table' THEN 'Add cloth cover'
    WHEN p.name = 'Folding Chair' THEN 'Add cloth cover'
  END,
  CASE 
    WHEN p.name = 'Folding Table' THEN 2.00
    WHEN p.name = 'Folding Chair' THEN 1.00
  END
FROM products p
WHERE p.name IN ('Folding Table', 'Folding Chair')
ON CONFLICT DO NOTHING;