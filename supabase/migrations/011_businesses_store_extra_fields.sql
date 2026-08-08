-- 011: missing businesses store/config columns (settings, theme, link-in-bio)
--
-- The adapter maps 'businesses/{businessId}/store/config' to the same row in the
-- businesses table (see migration 004). That migration covered most fields but
-- missed the payment/payout fields the settings page saves, the theme-editor
-- fields, and the link-in-bio blob. Without these columns PostgREST rejects the
-- upsert with "column does not exist", so saving settings fails.

ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS "managedPayments" BOOLEAN DEFAULT FALSE;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS "payoutBankName" TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS "payoutBankCode" TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS "payoutAccountNumber" TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS "payoutAccountName" TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS "useOwnPaystack" BOOLEAN DEFAULT FALSE;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS "paystackSecretKey" TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS "fontFamily" TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS "buttonStyle" TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS "bodyTextColor" TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS "bgColor" TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS "sections" JSONB;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS "linkBio" JSONB;
