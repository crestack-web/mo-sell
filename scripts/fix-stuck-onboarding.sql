-- =============================================================================
-- One-off fix: unstick PAYG onboarding for Skyline.journeys@gmail.com
--
-- Background: the signup PAYG flow wrote placeholder products with columns that
-- don't exist on the "storeProducts" table (title/type/status/metadata/
-- isSubscription), so the last onboarding step threw a PostgREST schema-cache
-- error. The businesses/store-config row had already been written, but
-- onboardingComplete was never set and no products exist.
--
-- This script:
--   1. Finds the user by email.
--   2. Ensures their businesses (store config) row exists, set to pay-as-you-go.
--   3. Creates the storeIndex slug -> business row if missing.
--   4. Creates 3 placeholder products using ONLY real storeProducts columns.
--   5. Marks onboarding complete and clears pendingStore.
--
-- Run this in the Supabase SQL Editor (production project). It is idempotent —
-- safe to run twice.
-- =============================================================================

DO $$
DECLARE
  v_email         text := 'Skyline.journeys@gmail.com';
  v_user_id       uuid;
  v_business_id   text;
  v_pending       jsonb;
  v_biz_exists    boolean;
  v_slug          text;
  v_cat           text;
  v_product_type  text;
  v_prod_count    int;
  v_placeholder   jsonb[];
  v_p             jsonb;
  v_product_id    text;
  v_created_at    timestamptz := now();
BEGIN

  -- ── 1. Locate the user ─────────────────────────────────────────────────────
  SELECT id, "businessId", "pendingStore"
    INTO v_user_id, v_business_id, v_pending
  FROM public.users
  WHERE email ILIKE v_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'USER NOT FOUND for email %. Nothing changed.', v_email;
    RETURN;
  END IF;

  RAISE NOTICE 'Found user % (id=%, businessId=%)', v_email, v_user_id, v_business_id;
  RAISE NOTICE 'pendingStore present: %', CASE WHEN v_pending IS NULL THEN 'NO' ELSE 'YES' END;

  IF v_business_id IS NULL THEN
    RAISE NOTICE 'User has no businessId — cannot repair store. Nothing changed.';
    RETURN;
  END IF;

  v_slug := v_pending->>'storeSlug';

  -- ── 2. Ensure businesses (store config) row exists as PAYG ─────────────────
  SELECT EXISTS (SELECT 1 FROM public.businesses WHERE id = v_business_id)
    INTO v_biz_exists;

  IF NOT v_biz_exists THEN
    RAISE NOTICE 'Business row missing — creating from pendingStore.';
    INSERT INTO public.businesses (id, "ownerUserId", "businessName", "storeName",
      "storeSlug", "logoUrl", "primaryColor", "secondaryColor", "businessCategory",
      "currency", "contactEmail", "contactPhone", "status", "theme", "tagline",
      "storePolicy", "paystackPublicKey", "enabledProductTypes", "pickupLocations",
      "customDomain", "customDomainStatus", "customDomainVerifiedAt",
      "domainPurchaseRecord", "onboardingAnswers",
      "billingModel", "billingStatus", "commissionRate",
      "createdAt", "updatedAt")
    VALUES (
      v_business_id,
      v_user_id,
      COALESCE(v_pending->>'storeName', 'My Store'),
      COALESCE(v_pending->>'storeName', 'My Store'),
      v_slug,
      v_pending->>'logoUrl',
      COALESCE(v_pending->>'primaryColor', '#0EA5E9'),
      COALESCE(v_pending->>'secondaryColor', '#FFFFFF'),
      COALESCE(v_pending->>'businessCategory', 'physical-products'),
      COALESCE(v_pending->>'currency', 'NGN'),
      v_email,
      '',
      COALESCE(v_pending->>'status', 'draft'),
      v_pending->>'theme',
      COALESCE(v_pending->>'tagline', ''),
      '',
      '',
      COALESCE(v_pending->'enabledProductTypes', '["physical"]'::jsonb),
      COALESCE(v_pending->'pickupLocations', '[]'::jsonb),
      v_pending->>'customDomain',
      COALESCE(v_pending->>'customDomainStatus', 'pending'),
      NULL,
      v_pending->'domainPurchaseRecord',
      v_pending->'onboardingAnswers',
      'pay_as_you_go', 'active', 0.2,
      v_created_at, v_created_at
    );
  ELSE
    RAISE NOTICE 'Business row exists — applying PAYG flags.';
    UPDATE public.businesses
       SET "billingModel"   = COALESCE("billingModel", 'pay_as_you_go'),
           "billingStatus"  = COALESCE("billingStatus", 'active'),
           "commissionRate" = COALESCE("commissionRate", 0.2),
           "updatedAt"      = now()
     WHERE id = v_business_id;
  END IF;

  -- ── 3. Ensure storeIndex slug -> business row ──────────────────────────────
  IF v_slug IS NOT NULL THEN
    INSERT INTO public."storeIndex" (id, "businessId", "storeName", "updatedAt")
    VALUES (v_slug, v_business_id, COALESCE(v_pending->>'storeName', 'My Store'), now())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- ── 4. Create placeholder products (only if the business has none) ────────
  SELECT count(*) INTO v_prod_count
  FROM public."storeProducts" WHERE "businessId" = v_business_id;

  IF v_prod_count > 0 THEN
    RAISE NOTICE 'Business already has % products — skipping placeholders.', v_prod_count;
  ELSE
    v_cat := COALESCE(v_pending->>'productCategory', 'products');
    v_product_type := CASE
      WHEN v_cat = 'services' THEN 'service'
      WHEN v_cat IN ('products', 'physical-products') THEN 'physical'
      ELSE 'digital'
    END;

    v_placeholder := ARRAY[
      jsonb_build_object('title','Classic Tee','price',15000,'desc','Premium quality cotton t-shirt'),
      jsonb_build_object('title','Signature Mug','price',8000,'desc','Ceramic mug with brand design'),
      jsonb_build_object('title','Canvas Tote','price',12000,'desc','Eco-friendly canvas tote bag')
    ];
    IF v_cat = 'courses' THEN
      v_placeholder := ARRAY[
        jsonb_build_object('title','Starter Course','price',25000,'desc','Complete beginner-friendly course'),
        jsonb_build_object('title','Masterclass','price',50000,'desc','Advanced deep-dive masterclass'),
        jsonb_build_object('title','Quick Guide','price',10000,'desc','Bite-sized actionable guide')
      ];
    ELSIF v_cat = 'services' THEN
      v_placeholder := ARRAY[
        jsonb_build_object('title','30-min Consultation','price',20000,'desc','One-on-one strategy session'),
        jsonb_build_object('title','1-Hour Workshop','price',35000,'desc','Interactive group workshop'),
        jsonb_build_object('title','Premium Package','price',75000,'desc','Comprehensive service package')
      ];
    ELSIF v_cat = 'digital' THEN
      v_placeholder := ARRAY[
        jsonb_build_object('title','Ebook','price',5000,'desc','In-depth digital ebook'),
        jsonb_build_object('title','Template Pack','price',8000,'desc','Ready-to-use templates'),
        jsonb_build_object('title','Preset Collection','price',6000,'desc','Professional preset pack')
      ];
    END IF;

    FOREACH v_p IN ARRAY v_placeholder LOOP
      v_product_id := 'prod_' || left(replace(gen_random_uuid()::text, '-', ''), 8);
      INSERT INTO public."storeProducts" (
        id, "businessId", "productType", "displayName", description, price,
        "compareAtPrice", images, category, tags, stock, available, variants,
        "createdAt", "updatedAt")
      VALUES (
        v_product_id, v_business_id, v_product_type, v_p->>'title', v_p->>'desc',
        (v_p->>'price')::numeric, NULL, '[]'::jsonb, v_cat, '[]'::jsonb,
        NULL, true, '[]'::jsonb, v_created_at, v_created_at
      );
    END LOOP;
    RAISE NOTICE 'Created 3 placeholder products for category %.', v_cat;
  END IF;

  -- ── 5. Mark onboarding complete + clear pending store ──────────────────────
  UPDATE public.users
     SET "onboardingComplete" = true,
         "pendingStore"       = NULL,
         "updatedAt"          = now()
   WHERE id = v_user_id;

  RAISE NOTICE 'DONE. % can now log in — dashboard will load with a PAYG store.', v_email;
END $$;
