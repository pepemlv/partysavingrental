import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface City {
  id: string;
  name: string;
  state: string;
  metropole_id?: string;
  metropole_name?: string;
  pickup_address: string;
  latitude: number;
  longitude: number;
  notes?: string;
  advance_days?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  display_order?: number;
  city_prices?: Record<string, number>;
  metropole_prices?: Record<string, number>;
  pricing_unit?: string; // 'per chair', 'per table', 'per day', 'per equipment', etc.
  image_url?: string;
  image_urls?: string[];
  image_with_addon_url?: string;
  gallery_images?: string[];
  category: string;
  addon?: {
    name: string;
    price: number;
  };
  price?: number;
}

export interface ProductAddon {
  id: string;
  product_id: string;
  name: string;
  price: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  addonSelected: boolean;
  addon?: ProductAddon;
}

export interface OrderData {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  city_id: string;
  delivery_method: 'pickup' | 'delivery';
  event_address: string;
  event_date: string;
  event_start_time: string;
  rental_days: number;
  subtotal: number;
  tax: number;
  delivery_fee: number;
  collection_fee: number;
  total: number;
  distance_miles: number;
  status: string;
}
