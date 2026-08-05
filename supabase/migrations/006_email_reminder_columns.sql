-- 006: Add subscription reminder tracking columns to users table
-- Used by the /api/cron/subscription-reminders scheduled job to avoid duplicate emails.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS "expiringReminderSentAt" text,
  ADD COLUMN IF NOT EXISTS "expiredReminderSentAt" text;
