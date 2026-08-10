-- ─────────────────────────────────────────────────────────────────────────────
-- Content Hub: persisted AI-generated ideas per product
-- Stores the generated ideas/scripts/tips per product so the Ideas tab keeps
-- showing the last generated content until the user explicitly regenerates.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "contentIdeas" (
  "id"            text primary key,
  "businessId"    text,
  "productId"     text,
  "productName"   text,
  "ideas"         jsonb default '[]'::jsonb,
  "scripts"       jsonb default '[]'::jsonb,
  "tips"          jsonb default '[]'::jsonb,
  "audienceNote"  text,
  "updatedAt"     bigint default (extract(epoch from now()) * 1000)::bigint
);

CREATE INDEX IF NOT EXISTS "idx_content_ideas_business" ON "contentIdeas" ("businessId");

GRANT ALL ON "contentIdeas" TO anon, authenticated;
