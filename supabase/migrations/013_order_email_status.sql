-- ─────────────────────────────────────────────────────────────────────────────
-- Track digital/order confirmation email delivery so failures are surfaced
-- instead of silently swallowed. Set by the integration bridge after it
-- calls /api/email/order-confirmation.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "storeOrders"
  ADD COLUMN IF NOT EXISTS "customerEmailStatus" text;

ALTER TABLE "storeOrders"
  ADD COLUMN IF NOT EXISTS "customerEmailSentAt" timestamptz;
