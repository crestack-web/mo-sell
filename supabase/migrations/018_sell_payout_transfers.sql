-- Automated sell payouts via Paystack transfers
-- Adds transfer tracking columns to payoutRequests and a recipient-code cache
-- on businesses so each store's Paystack transfer recipient is only created once.

ALTER TABLE public.payoutRequests ADD COLUMN IF NOT EXISTS "recipientCode" TEXT;
ALTER TABLE public.payoutRequests ADD COLUMN IF NOT EXISTS "transferCode" TEXT;

ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS "payoutRecipientCode" TEXT;
