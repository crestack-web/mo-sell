-- Align the businesses + storeIndex tables with the Firestore-style fields the
-- app writes through the Supabase adapter (camelCase columns, quoted).
--
-- The adapter maps 'businesses/{businessId}' AND 'businesses/{businessId}/store/config'
-- to the same row in the businesses table, so the row carries both business
-- metadata and store-config fields.

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "ownerUserId" UUID;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "businessName" TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "businessType" TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "storeSlug" TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "storeName" TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "primaryColor" TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "secondaryColor" TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "businessCategory" TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "currency" TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "contactEmail" TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "contactPhone" TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "status" TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "theme" TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "tagline" TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "storePolicy" TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "paystackPublicKey" TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "enabledProductTypes" JSONB;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "pickupLocations" JSONB;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "customDomain" TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "customDomainStatus" TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "customDomainVerifiedAt" TIMESTAMPTZ;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "domainPurchaseRecord" JSONB;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "onboardingAnswers" JSONB;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMPTZ;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW();

-- Original snake_case columns were NOT NULL and block Firestore-style inserts
-- that only set camelCase fields.
ALTER TABLE businesses ALTER COLUMN name DROP NOT NULL;
ALTER TABLE businesses ALTER COLUMN slug DROP NOT NULL;

-- storeIndex: maps store slug -> business (written by subscribe/success)
CREATE TABLE IF NOT EXISTS "storeIndex" (
  id TEXT PRIMARY KEY,
  "businessId" TEXT,
  "storeName" TEXT,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
