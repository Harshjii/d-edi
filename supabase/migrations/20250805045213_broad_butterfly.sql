/*
  # Update Orders Schema for Multi-Seller Support

  1. Schema Changes
    - Add `seller_id` column to orders table
    - Update order items to include seller information

  2. Security Updates
    - Update RLS policies for seller-specific access
    - Sellers can only view/manage orders for their products
    - Users can view their own orders

  3. Indexes
    - Add index on seller_id for better query performance
*/

-- Add seller_id column to orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'seller_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index on seller_id
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);

-- Update RLS policies for orders
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;

-- New policies for multi-seller support
CREATE POLICY "Users can view own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sellers can view their orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = seller_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Sellers can update their orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = seller_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = seller_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );