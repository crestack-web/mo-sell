-- Product-level customer info collection selector
-- Merchants choose which customer fields to collect at checkout; the storefront
-- renders only those fields instead of automatically collecting all.
-- null/empty jsonb = collect all (legacy behavior). Email is always collected
-- because Paystack and order delivery require it.

ALTER TABLE public.storeProducts ADD COLUMN IF NOT EXISTS "customerInfoFields" jsonb;
