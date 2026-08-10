-- Payout OTP verification
-- Stores payout confirmation codes keyed by businessId so that a payout is
-- only executed after the store owner verifies via a one-time code emailed to
-- them (survives serverless instance reboots like email_otps).

CREATE TABLE IF NOT EXISTS payout_otps (
  "businessId" TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  otp VARCHAR(6) NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'NGN',
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payout_otps_expires_at ON payout_otps("expiresAt");
