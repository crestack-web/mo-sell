-- 029_referrals.sql
-- MO Sell merchant referral program

ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "referralCode" text;
ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "referredByBusinessId" text;
ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "referralBalance" numeric default 0;
ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "referralTotalEarned" numeric default 0;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_businesses_referral_code"
  ON "public"."businesses" ("referralCode")
  WHERE "referralCode" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "public"."referrals" (
  "id"                   text primary key default gen_random_uuid()::text,
  "referrerBusinessId"   text not null,
  "referredBusinessId"   text,
  "referredUserId"       text,
  "referralCode"         text not null,
  "status"               text not null default 'pending',
  -- pending | signed_up | rewarded
  "rewardAmount"         numeric default 0,
  "rewardCurrency"       text default 'NGN',
  "rewardedAt"           timestamptz,
  "metadata"             jsonb default '{}'::jsonb,
  "createdAt"            timestamptz default now(),
  "updatedAt"            timestamptz default now()
);

CREATE INDEX IF NOT EXISTS "idx_referrals_referrer" ON "public"."referrals" ("referrerBusinessId");
CREATE INDEX IF NOT EXISTS "idx_referrals_referred" ON "public"."referrals" ("referredBusinessId");
CREATE INDEX IF NOT EXISTS "idx_referrals_code" ON "public"."referrals" ("referralCode");

CREATE TABLE IF NOT EXISTS "public"."referralTransactions" (
  "id"                 text primary key default gen_random_uuid()::text,
  "referrerBusinessId" text not null,
  "referralId"         text,
  "type"               text not null,
  -- signup_bonus | first_sale | adjustment
  "amount"             numeric not null default 0,
  "currency"           text default 'NGN',
  "note"               text,
  "createdAt"          timestamptz default now()
);

CREATE INDEX IF NOT EXISTS "idx_referral_tx_referrer"
  ON "public"."referralTransactions" ("referrerBusinessId");

GRANT ALL ON "public"."referrals" TO anon, authenticated;
GRANT ALL ON "public"."referralTransactions" TO anon, authenticated;
