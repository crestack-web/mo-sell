-- ─────────────────────────────────────────────────────────────────────────────
-- AI usage observability (provider/model/task-level token + cost tracking).
-- Written by lib/ai/usage.ts after every provider call. No prompt content
-- is ever stored. Powers the future AI cost dashboard.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ai_usage" (
  "id"           text primary key default gen_random_uuid()::text,
  "provider"     text,
  "model"        text,
  "task"         text,
  "businessId"   text,
  "inputTokens"  int default 0,
  "outputTokens" int default 0,
  "totalTokens"  int default 0,
  "latencyMs"    int,
  "success"      boolean default true,
  "fallbackFrom" text,
  "estimatedCost" numeric default 0,
  "createdAt"    timestamptz default now()
);

CREATE INDEX IF NOT EXISTS "idx_ai_usage_business" ON "ai_usage" ("businessId", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_ai_usage_provider" ON "ai_usage" ("provider", "createdAt");

GRANT ALL ON "ai_usage" TO anon, authenticated;
