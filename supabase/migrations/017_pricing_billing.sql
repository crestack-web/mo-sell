-- 017_pricing_billing.sql
-- MO Sell two-model pricing: pay-as-you-go (10% commission, no monthly fee) and
-- conditional monthly subscriptions (Standard $10 / Pro $25 / Enterprise $50).
--
-- Rules:
--   * PAYG stores pay 10% commission on every sale, never a monthly fee.
--   * Monthly stores pay no per-sale commission; instead the monthly plan fee is
--     deducted from their earnings balance, but ONLY for months whose revenue is
--     >= the plan fee (conditional billing). Below that, the fee is waived.
--   * Revenue is rolled up per business per month into businessMonthlyRevenue so
--     the conditional-billing job can decide charge vs waive without scanning
--     every order.
--
-- RLS stays disabled to match the existing businesses/storeProducts tables; the
-- adapter (anon/authed client) reads/writes without policy churn.

-- ─────────────────────────────────────────────────────────────────────────────
-- businesses: billing-model flags (written by the adapter when the store config
-- is saved) + per-order commission snapshot columns on storeOrders
-- ─────────────────────────────────────────────────────────────────────────────
-- NOTE: no DB default for billingModel so pre-existing stores keep their current
-- behavior (managedPayments 5% or nothing). New stores set it explicitly.
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "billingModel" text;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "billingPlan" text;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "billingStatus" text DEFAULT 'none';
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "commissionRate" numeric DEFAULT 0;

ALTER TABLE "storeOrders" ADD COLUMN IF NOT EXISTS "commissionRate" numeric DEFAULT 0;
ALTER TABLE "storeOrders" ADD COLUMN IF NOT EXISTS "commissionAmount" numeric DEFAULT 0;
ALTER TABLE "storeOrders" ADD COLUMN IF NOT EXISTS "netAmount" numeric DEFAULT 0;

-- ─────────────────────────────────────────────────────────────────────────────
-- billingSubscriptions: active monthly plan per business
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "billingSubscriptions" (
  "businessId"       text primary key,
  "userId"           text,
  "plan"             text,                 -- standard | pro | enterprise
  "status"           text default 'active', -- active | canceled
  "priceUsd"         numeric default 0,
  "startDate"        timestamptz default now(),
  "currentMonth"     text,                 -- YYYY-MM currently being evaluated
  "lastBilledMonth"  text,                 -- YYYY-MM last charged/waived
  "createdAt"        timestamptz default now(),
  "updatedAt"        timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- businessMonthlyRevenue: revenue + commission rollup per business per month
-- (source of truth for conditional billing)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "businessMonthlyRevenue" (
  "businessId" text,
  "month"      text,                       -- YYYY-MM
  "revenue"    numeric default 0,
  "commission" numeric default 0,
  "orders"     int default 0,
  "updatedAt"  timestamptz default now(),
  primary key ("businessId", "month")
);

CREATE INDEX IF NOT EXISTS "idx_businessMonthlyRevenue_business" ON "businessMonthlyRevenue" ("businessId");

-- ─────────────────────────────────────────────────────────────────────────────
-- billingCharges: ledger of monthly fee charges / waivers
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "billingCharges" (
  "id"         text primary key default gen_random_uuid()::text,
  "businessId" text,
  "month"      text,                       -- YYYY-MM
  "plan"       text,
  "feeUsd"     numeric default 0,
  "feeNgn"     numeric default 0,
  "status"     text,                       -- charged | waived
  "revenue"    numeric default 0,
  "notes"      text,
  "createdAt"  timestamptz default now()
);

CREATE INDEX IF NOT EXISTS "idx_billingCharges_business" ON "billingCharges" ("businessId");
