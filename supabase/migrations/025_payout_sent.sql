-- 025: payout 'sent' state
--
-- Adds a "sentAt" timestamp to payoutRequests so the payout history can show
-- when a payout was actually dispatched. The status lifecycle becomes:
--   requested -> sent (transfer initiated) -> completed (transfer.success)
--   requested/sent -> rejected (transfer.failed / transfer.reversed)

ALTER TABLE "public"."payoutRequests" ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMPTZ;
