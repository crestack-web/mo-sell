-- 024: both store + link-in-bio mode
--
-- A store can now run a link-in-bio page AND a full store at the same time:
--   mode          = 'store' | 'link-bio' | 'both'
--   linkBioTheme  = the link-style theme used for the /bio/{storeSlug} page
--                   (and for the switch "replace my bio with a store" flow).
-- Without these columns PostgREST rejects the upsert with "column does not exist".

ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS "mode" TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS "linkBioTheme" TEXT;
