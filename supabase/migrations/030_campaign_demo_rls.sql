-- Read-only campaign preview isolation.
-- The campaign table is separate from storeOrders and must never be writable
-- by the browser. Owners may only read demo rows for their own business.

ALTER TABLE public."storeOrderCampaignDemos" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Campaign owner can read own demo rows" ON public."storeOrderCampaignDemos";
CREATE POLICY "Campaign owner can read own demo rows"
  ON public."storeOrderCampaignDemos"
  FOR SELECT
  TO authenticated
  USING (
    "isDemo" = TRUE
    AND "businessId" IN (
      SELECT "businessId"
      FROM public."users"
      WHERE id = auth.uid()
    )
  );

-- No INSERT/UPDATE/DELETE policy is granted to anon or authenticated.
-- Service role continues to bypass RLS for campaign maintenance/cleanup.
