-- Creator (MO Sell) user profiles table.
--
-- Mirrors the Firestore-style 'users/{id}' documents the app writes/reads via
-- the Supabase adapter (camelCase columns, quoted). The adapter passes payload
-- keys through verbatim, so column names must match the app exactly.
--
-- Run this in your Supabase SQL Editor once (or via Management API), then redeploy.

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  "displayName" TEXT,
  "businessName" TEXT,
  email TEXT,
  "businessId" TEXT,
  plan TEXT DEFAULT 'starter',
  "moSellAccess" BOOLEAN DEFAULT TRUE,
  "emailVerified" BOOLEAN DEFAULT FALSE,
  "moSellSubscription" JSONB,
  "subscriptionStatus" TEXT,
  "subscriptionEndDate" TIMESTAMPTZ,
  "subscriptionStartDate" TIMESTAMPTZ,
  "lastPaymentReference" TEXT,
  "lastPaymentAmount" NUMERIC,
  "lastPaymentDate" TIMESTAMPTZ,
  "pendingStore" JSONB,
  "onboardingComplete" BOOLEAN DEFAULT FALSE,
  "avatarContent" TEXT,
  "avatarBg" TEXT,
  "avatarColor" TEXT,
  "photoURL" TEXT,
  "fromBusmo" BOOLEAN,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_own ON users;
CREATE POLICY users_select_own
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS users_insert_own ON users;
CREATE POLICY users_insert_own
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS users_update_own ON users;
CREATE POLICY users_update_own
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS users_delete_own ON users;
CREATE POLICY users_delete_own
  ON users
  FOR DELETE
  TO authenticated
  USING (id = auth.uid());
