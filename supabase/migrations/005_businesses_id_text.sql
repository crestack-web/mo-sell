-- 005: businesses.id must accept the app's Firestore-style string keys (biz_<id>)
-- instead of uuid. All referencing columns are re-aligned and FKs recreated.
-- Safe to run: all tables are currently empty.

ALTER TABLE public.store_configs DROP CONSTRAINT IF EXISTS store_configs_business_id_fkey;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_business_id_fkey;
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_business_id_fkey;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_business_id_fkey;

ALTER TABLE public.businesses ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.businesses ALTER COLUMN id TYPE text;
ALTER TABLE public.businesses ALTER COLUMN owner_id TYPE text;
ALTER TABLE public.businesses ALTER COLUMN "ownerUserId" TYPE text;

ALTER TABLE public.store_configs ALTER COLUMN business_id TYPE text;
ALTER TABLE public.products ALTER COLUMN business_id TYPE text;
ALTER TABLE public.customers ALTER COLUMN business_id TYPE text;
ALTER TABLE public.orders ALTER COLUMN business_id TYPE text;

ALTER TABLE public.store_configs
  ADD CONSTRAINT store_configs_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.products
  ADD CONSTRAINT products_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.customers
  ADD CONSTRAINT customers_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
