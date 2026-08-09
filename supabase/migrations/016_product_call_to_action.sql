-- 016_product_call_to_action.sql
-- Lets sellers set their own call-to-action text for the buy button on
-- their link-style product pages instead of the hardcoded
-- "Buy Now with Paystack" label. Column names match the camelCase fields
-- the adapter upserts.
ALTER TABLE "storeProducts" ADD COLUMN IF NOT EXISTS "callToAction" text;
