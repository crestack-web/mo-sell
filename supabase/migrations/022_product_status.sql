-- Product draft status
-- Lets sellers save products as drafts (hidden from customers) until published.
-- 'active' = visible to customers (subject to "available"), 'draft' = hidden everywhere.
ALTER TABLE "public"."storeProducts" ADD COLUMN IF NOT EXISTS "status" TEXT;

UPDATE "public"."storeProducts" SET "status" = 'active' WHERE "status" IS NULL;

ALTER TABLE "public"."storeProducts" ALTER COLUMN "status" SET DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_storeProducts_status ON "public"."storeProducts" ("status");
