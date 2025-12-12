-- supabase/create_tables.sql
-- Run this in the Supabase SQL editor to create the minimal schema used by the frontend.

-- products table (sample fields used by content.js)
CREATE TABLE IF NOT EXISTS products (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  brand text,
  preview text, -- image url
  price numeric,
  isAccessory boolean DEFAULT false
);

-- users (lightweight table; you can use Supabase Auth in production)
CREATE TABLE IF NOT EXISTS users (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- cart (simple per-user cart; user_id optional for anonymous flows)
CREATE TABLE IF NOT EXISTS cart (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint,
  product_id bigint REFERENCES products(id) ON DELETE CASCADE,
  quantity integer DEFAULT 1,
  added_at timestamptz DEFAULT now()
);

-- orders (simple order store)
CREATE TABLE IF NOT EXISTS orders (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint,
  items jsonb,
  total numeric,
  address jsonb,
  payment_method text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- addresses (user delivery addresses)
CREATE TABLE IF NOT EXISTS addresses (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint,
  name text NOT NULL,
  street text NOT NULL,
  city text NOT NULL,
  zip text NOT NULL,
  phone text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add a few example products (optional)
INSERT INTO products (name, brand, preview, price, isAccessory)
VALUES
  -- Clothing (isAccessory = false)
  ('Casual Tee', 'Acme', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop', 499, false),
  ('Denim Jacket', 'DenimCo', 'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=300&h=300&fit=crop', 2499, false),
  ('White Shirt', 'FormalisH', 'https://images.unsplash.com/photo-1596172474880-beaf50694939?w=300&h=300&fit=crop', 799, false),
  ('Black Jeans', 'DenimCo', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=300&fit=crop', 1299, false),
  ('Cotton Hoodie', 'ComfortWear', 'https://images.unsplash.com/photo-1556821552-5f8f3f5f5f5f?w=300&h=300&fit=crop', 1599, false),
  ('Polo Shirt', 'ClassicStyle', 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=300&h=300&fit=crop', 899, false),
  ('Summer Shorts', 'ActiveWear', 'https://images.unsplash.com/photo-1556821552-5b374e6e5f5f?w=300&h=300&fit=crop', 599, false),
  ('Winter Coat', 'Warmth+Co', 'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=300&h=300&fit=crop', 3999, false),
  ('Striped T-Shirt', 'Acme', 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=300&h=300&fit=crop', 549, false),
  ('Cargo Pants', 'AdventureGear', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=300&fit=crop', 1399, false),
  ('Silk Scarf', 'Elegance', 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=300&h=300&fit=crop', 1299, false),
  ('Leather Jacket', 'EdgeStyle', 'https://images.unsplash.com/photo-1557804506-669714d2e9d8?w=300&h=300&fit=crop', 4999, false),
  ('Athletic Tank', 'SportZone', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop', 449, false),
  ('Formal Blazer', 'ClassicStyle', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300&h=300&fit=crop', 2799, false),
  ('Sweatpants', 'ComfortWear', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=300&fit=crop', 799, false)
ON CONFLICT DO NOTHING;
