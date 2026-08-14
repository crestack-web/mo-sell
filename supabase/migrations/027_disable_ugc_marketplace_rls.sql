-- 027: Disable RLS on UGC marketplace tables.
--
-- ugcCreators / ugcVideos were created RLS-off in 009, but were later switched
-- to RLS with no policies, which silently blocks every save/load from the
-- client-side Supabase adapter (anon key + user token) — creators could never
-- save their profile or list videos. Re-disable RLS to match the rest of the
-- app (businesses, storeProducts, ugcOrders, etc.), which scope client data by
-- userId/creatorId in queries rather than enforcing it in the database.

ALTER TABLE public."ugcCreators" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."ugcVideos" DISABLE ROW LEVEL SECURITY;
