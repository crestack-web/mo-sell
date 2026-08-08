-- 012_store_data_tables.sql
-- Migrate the dashboard/store data layer from Firebase subcollections to
-- Supabase tables. Column names are the exact camelCase fields the app writes
-- (the adapter upserts `{ id, ...fields }` as columns, so every written field
-- must exist). RLS stays disabled to match the existing `businesses` table so
-- the anon/authed client (adapter) can read/write without policy churn.

-- ─────────────────────────────────────────────────────────────────────────────
-- Products
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "storeProducts" (
  "id"                    text primary key default gen_random_uuid()::text,
  "businessId"            text,
  "productId"             text,
  "productType"           text,
  "displayName"           text,
  "description"           text,
  "price"                 numeric default 0,
  "compareAtPrice"        numeric,
  "images"                jsonb default '[]'::jsonb,
  "category"              text,
  "collectionIds"         jsonb default '[]'::jsonb,
  "tags"                  jsonb default '[]'::jsonb,
  "stock"                 int default 0,
  "sku"                   text,
  "available"             boolean default true,
  "featured"              boolean default false,
  "digitalFileUrl"        text,
  "digitalFileName"       text,
  "digitalFiles"          jsonb,
  "deliveryNote"          text,
  "lowStockThreshold"     int default 5,
  "variants"              jsonb,
  "digitalSubtype"        text,
  "pageCount"             int,
  "author"                text,
  "isbn"                  text,
  "courseDuration"        text,
  "lessonCount"           int,
  "accessDuration"        text,
  "difficultyLevel"       text,
  "fileFormat"            text,
  "compatibleSoftware"    text,
  "licenseType"           text,
  "eventDate"             text,
  "eventTime"             text,
  "venue"                 text,
  "ticketType"            text,
  "capacity"              int,
  "sessionType"           text,
  "sessionDuration"       int,
  "sessionFormat"         text,
  "numberOfSessions"      int,
  "coachingDeliverable"   text,
  "slotDuration"          int,
  "bufferTime"            int,
  "currency"              text,
  "pdfContent"            jsonb,
  "createdByAskMo"        boolean default false,
  "askMoCommissionRate"   numeric,
  "rating"                numeric,
  "reviewCount"           int default 0,
  "createdAt"             timestamptz default now(),
  "updatedAt"             timestamptz default now()
);

CREATE INDEX IF NOT EXISTS "idx_storeProducts_business" ON "storeProducts" ("businessId");
CREATE INDEX IF NOT EXISTS "idx_storeProducts_available" ON "storeProducts" ("available");

-- ─────────────────────────────────────────────────────────────────────────────
-- Orders
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "storeOrders" (
  "id"                 text primary key,
  "businessId"         text,
  "orderNumber"        text,
  "customerName"       text,
  "customerEmail"      text,
  "customerPhone"      text,
  "deliveryOption"     text,
  "shippingAddress"    text,
  "shippingZoneId"     text,
  "shippingCost"       numeric default 0,
  "lineItems"          jsonb default '[]'::jsonb,
  "subtotal"           numeric default 0,
  "total"              numeric default 0,
  "paystackReference"  text,
  "status"             text,
  "paymentStatus"      text,
  "trackingNumber"     text,
  "carrier"            text,
  "statusHistory"      jsonb default '[]'::jsonb,
  "integrationStatus"  text,
  "settlementDate"     text,
  "downloads"          jsonb default '[]'::jsonb,
  "createdAt"          timestamptz default now(),
  "updatedAt"          timestamptz default now()
);

CREATE INDEX IF NOT EXISTS "idx_storeOrders_business" ON "storeOrders" ("businessId");
CREATE INDEX IF NOT EXISTS "idx_storeOrders_orderNumber" ON "storeOrders" ("orderNumber");
CREATE INDEX IF NOT EXISTS "idx_storeOrders_paystackRef" ON "storeOrders" ("paystackReference");

-- ─────────────────────────────────────────────────────────────────────────────
-- Checkout sessions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "checkoutSessions" (
  "id"                 text primary key,
  "storeSlug"          text,
  "businessId"         text,
  "lineItems"          jsonb default '[]'::jsonb,
  "customerName"       text,
  "customerEmail"      text,
  "customerPhone"      text,
  "deliveryOption"     text,
  "shippingAddress"    text,
  "shippingZoneId"     text,
  "shippingCost"       numeric default 0,
  "subtotal"           numeric default 0,
  "total"              numeric default 0,
  "paystackReference"  text,
  "paymentMethod"      text,
  "status"             text,
  "metadata"           jsonb,
  "expiresAt"          timestamptz,
  "createdAt"          timestamptz default now(),
  "updatedAt"          timestamptz default now()
);

CREATE INDEX IF NOT EXISTS "idx_checkoutSessions_business" ON "checkoutSessions" ("businessId");

-- ─────────────────────────────────────────────────────────────────────────────
-- Collections
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "storeCollections" (
  "id"          text primary key default gen_random_uuid()::text,
  "businessId"  text,
  "name"        text,
  "description" text,
  "productIds"  jsonb default '[]'::jsonb,
  "createdAt"   timestamptz default now(),
  "updatedAt"   timestamptz default now()
);

CREATE INDEX IF NOT EXISTS "idx_storeCollections_business" ON "storeCollections" ("businessId");

-- ─────────────────────────────────────────────────────────────────────────────
-- Analytics
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "storeAnalytics" (
  "id"         text primary key default gen_random_uuid()::text,
  "businessId" text,
  "eventType"  text,
  "storeSlug"  text,
  "pageType"   text,
  "productId"  text,
  "timestamp"  timestamptz default now(),
  "createdAt"  timestamptz default now()
);

CREATE INDEX IF NOT EXISTS "idx_storeAnalytics_business" ON "storeAnalytics" ("businessId");

-- ─────────────────────────────────────────────────────────────────────────────
-- Earnings
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "storeEarnings" (
  "id"               text primary key default gen_random_uuid()::text,
  "businessId"       text,
  "orderId"          text,
  "orderNumber"      text,
  "customerName"     text,
  "productId"        text,
  "productName"      text,
  "type"             text default 'sale',
  "grossAmount"      numeric default 0,
  "commissionRate"   numeric default 0,
  "commissionAmount" numeric default 0,
  "netAmount"        numeric default 0,
  "currency"         text,
  "status"           text,
  "payoutRequestId"  text,
  "settlementDate"   text,
  "createdAt"        timestamptz default now(),
  "updatedAt"        timestamptz default now()
);

CREATE INDEX IF NOT EXISTS "idx_storeEarnings_business" ON "storeEarnings" ("businessId");
CREATE INDEX IF NOT EXISTS "idx_storeEarnings_status" ON "storeEarnings" ("status");

-- ─────────────────────────────────────────────────────────────────────────────
-- Payout requests
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "payoutRequests" (
  "id"             text primary key default gen_random_uuid()::text,
  "businessId"     text,
  "amount"         numeric default 0,
  "currency"       text,
  "bankName"       text,
  "accountNumber"  text,
  "accountName"    text,
  "commissionRate" numeric default 0,
  "earningIds"     jsonb default '[]'::jsonb,
  "status"         text,
  "rejectionReason" text,
  "processedAt"    timestamptz,
  "whopWithdrawalId" text,
  "createdAt"      timestamptz default now(),
  "updatedAt"      timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Shipping zones
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "storeShippingZones" (
  "id"                    text primary key default gen_random_uuid()::text,
  "businessId"            text,
  "zoneName"              text,
  "regions"               jsonb default '[]'::jsonb,
  "flatRate"              numeric default 0,
  "estimatedDeliveryDays" int default 3,
  "createdAt"             timestamptz default now(),
  "updatedAt"             timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Bookings
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "storeBookings" (
  "id"            text primary key default gen_random_uuid()::text,
  "businessId"    text,
  "storeSlug"     text,
  "productId"     text,
  "productName"   text,
  "customerName"  text,
  "customerEmail" text,
  "customerPhone" text,
  "date"          text,
  "startTime"     text,
  "endTime"       text,
  "notes"         text,
  "status"        text,
  "orderId"       text,
  "createdAt"     timestamptz default now(),
  "updatedAt"     timestamptz default now()
);

CREATE INDEX IF NOT EXISTS "idx_storeBookings_business" ON "storeBookings" ("businessId");
CREATE INDEX IF NOT EXISTS "idx_storeBookings_date" ON "storeBookings" ("date");

CREATE TABLE IF NOT EXISTS "storeBookingAvailability" (
  "id"                   text primary key default gen_random_uuid()::text,
  "businessId"           text,
  "slots"                jsonb default '[]'::jsonb,
  "slotDurationMinutes"  int default 60,
  "bufferMinutes"        int default 15,
  "blockedDates"         jsonb default '[]'::jsonb,
  "createdAt"            timestamptz default now(),
  "updatedAt"            timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- UGC orders
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ugcOrders" (
  "id"                    text primary key,
  "type"                  text,
  "brandId"               text,
  "creatorId"             text,
  "bidAmount"             int,
  "basePrice"             int,
  "productName"           text,
  "productUrl"            text,
  "brief"                 text,
  "deliverables"          text,
  "deadline"              timestamptz,
  "videoLength"           text,
  "guestName"             text,
  "guestEmail"            text,
  "guestCompany"          text,
  "agreedPrice"           int,
  "platformFee"           int,
  "creatorPayout"         int,
  "depositAmount"         int,
  "balanceAmount"         int,
  "paymentStatus"         text,
  "paystackRefDeposit"    text,
  "paystackRefBalance"    text,
  "paystackTransferCode"  text,
  "status"                text,
  "draftVideoUrl"         text,
  "finalVideoUrl"         text,
  "watermarked"           boolean default true,
  "disputeReason"         text,
  "disputeDescription"    text,
  "disputeOpenedBy"       text,
  "disputeOpenedAt"       timestamptz,
  "disputeResolvedAt"     timestamptz,
  "disputeResolution"     text,
  "rating"                int,
  "review"                text,
  "rejectionReason"       text,
  "requestedAt"           timestamptz default now(),
  "acceptedAt"            timestamptz,
  "draftSubmittedAt"      timestamptz,
  "completedAt"           timestamptz,
  "paidOutAt"             timestamptz,
  "createdAt"             timestamptz default now(),
  "updatedAt"             timestamptz default now()
);

CREATE INDEX IF NOT EXISTS "idx_ugcOrders_creator" ON "ugcOrders" ("creatorId");
CREATE INDEX IF NOT EXISTS "idx_ugcOrders_status" ON "ugcOrders" ("status");
CREATE INDEX IF NOT EXISTS "idx_ugcOrders_refDeposit" ON "ugcOrders" ("paystackRefDeposit");

-- ─────────────────────────────────────────────────────────────────────────────
-- Customers (extend the existing table with the app's Firestore-shaped fields)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "totalOrders" int default 0;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "totalSpend" numeric default 0;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "totalSpent" numeric default 0;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "source" text;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "businessId" text;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "storeSlug" text;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "tags" jsonb default '[]'::jsonb;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "lastOrderAt" timestamptz;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "subscribedAt" timestamptz;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "createdAt" timestamptz default now();
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "updatedAt" timestamptz default now();

CREATE INDEX IF NOT EXISTS "idx_customers_business" ON "customers" ("businessId");

-- ─────────────────────────────────────────────────────────────────────────────
-- Content Hub auxiliary collections
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "campaigns" (
  "id"          text primary key default gen_random_uuid()::text,
  "businessId"  text,
  "productId"   text,
  "productName" text,
  "days"        jsonb default '[]'::jsonb,
  "createdAt"   bigint default (extract(epoch from now()) * 1000)::bigint
);

CREATE TABLE IF NOT EXISTS "contentCalendar" (
  "id"          text primary key default gen_random_uuid()::text,
  "businessId"  text,
  "title"       text,
  "platform"    text,
  "date"        text,
  "time"        text,
  "productId"   text,
  "productName" text,
  "notes"       text,
  "status"      text,
  "postedUrl"   text,
  "createdAt"   bigint default (extract(epoch from now()) * 1000)::bigint
);

CREATE TABLE IF NOT EXISTS "socialProfiles" (
  "id"             text primary key default gen_random_uuid()::text,
  "businessId"     text,
  "platform"       text,
  "url"            text,
  "followerCount"  int default 0,
  "followingCount" int default 0,
  "postsCount"     int default 0,
  "likesCount"     int default 0,
  "verified"       boolean default false,
  "verifiedAt"     text,
  "updatedAt"      bigint default (extract(epoch from now()) * 1000)::bigint
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Businesses: token balance columns used by Ask MO / webhooks
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "askMoTokenBalance" int default 0;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "askMoTotalPurchased" int default 0;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "askMoMonthUsage" int default 0;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "askMoMonthReset" bigint;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "whopCompanyId" text;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "whopOnboardingUrl" text;

-- ─────────────────────────────────────────────────────────────────────────────
-- Order-number counter + atomic increment helpers
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "storeOrderCounters" (
  "businessId" text primary key,
  "lastNumber" int not null default 0
);

CREATE OR REPLACE FUNCTION next_order_number(p_business_id text)
RETURNS int AS $$
DECLARE next_num int;
BEGIN
  INSERT INTO "storeOrderCounters" ("businessId", "lastNumber")
  VALUES (p_business_id, 1)
  ON CONFLICT ("businessId")
  DO UPDATE SET "lastNumber" = "storeOrderCounters"."lastNumber" + 1
  RETURNING "lastNumber" INTO next_num;
  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_business_field(p_business_id text, p_field text, p_amount numeric)
RETURNS void AS $$
BEGIN
  IF p_field IN ('askMoTokenBalance', 'askMoTotalPurchased') THEN
    EXECUTE format(
      'UPDATE "businesses" SET %I = COALESCE(%I, 0) + $2, "updatedAt" = now() WHERE "id" = $1',
      p_field, p_field
    ) USING p_business_id, p_amount;
  ELSE
    RAISE EXCEPTION 'field not allowed for increment';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_creator_field(p_creator_id text, p_field text, p_amount numeric)
RETURNS void AS $$
BEGIN
  IF p_field IN ('totalEarnings', 'totalOrders') THEN
    EXECUTE format(
      'UPDATE "ugcCreators" SET %I = COALESCE(%I, 0) + $2, "updatedAt" = now() WHERE "id" = $1',
      p_field, p_field
    ) USING p_creator_id, p_amount;
  ELSE
    RAISE EXCEPTION 'field not allowed for increment';
  END IF;
END;
$$ LANGUAGE plpgsql;
