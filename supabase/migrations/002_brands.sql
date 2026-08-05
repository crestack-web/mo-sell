-- Brand accounts table (brand dashboard / UGC marketplace)
--
-- Stores brand profiles keyed by the Supabase auth user id so that
-- authenticated users can only ever read/write their own brand.
--
-- Run this in your Supabase SQL Editor once, then redeploy.

CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY,
  "brandName" TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  website TEXT,
  industry TEXT,
  "walletBalance" NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  "userId" UUID,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brands_email ON brands(email);
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON brands("userId");

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS brands_select_own ON brands;
CREATE POLICY brands_select_own
  ON brands
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR "userId" = auth.uid());

DROP POLICY IF EXISTS brands_insert_own ON brands;
CREATE POLICY brands_insert_own
  ON brands
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS brands_update_own ON brands;
CREATE POLICY brands_update_own
  ON brands
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS brands_delete_own ON brands;
CREATE POLICY brands_delete_own
  ON brands
  FOR DELETE
  TO authenticated
  USING (id = auth.uid());
