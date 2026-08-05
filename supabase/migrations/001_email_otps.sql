-- Email OTP verification table (custom branded OTP signup flow)
--
-- Stores OTPs in Supabase instead of an in-memory Map so that verification
-- works reliably across serverless function invocations (e.g. Vercel), where
-- each request may be handled by a different lambda instance.
--
-- Run this in your Supabase SQL Editor once, then redeploy.

CREATE TABLE IF NOT EXISTS email_otps (
  email VARCHAR(255) PRIMARY KEY,
  otp VARCHAR(6) NOT NULL,
  full_name TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_otps_expires_at ON email_otps(expires_at);
