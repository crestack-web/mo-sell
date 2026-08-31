-- Link mo-sell businesses to Busmo (studio) businesses for product import + sale sync
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "busmoBusinessId" TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "busmoLinkedAt" TIMESTAMPTZ;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS "busmoLinkedEmail" TEXT;

CREATE INDEX IF NOT EXISTS idx_businesses_busmo_business_id
  ON businesses ("busmoBusinessId")
  WHERE "busmoBusinessId" IS NOT NULL;

ALTER TABLE "storeProducts" ADD COLUMN IF NOT EXISTS "busmoProductId" TEXT;
CREATE INDEX IF NOT EXISTS idx_storeProducts_busmo_product_id
  ON "storeProducts" ("busmoProductId")
  WHERE "busmoProductId" IS NOT NULL;
