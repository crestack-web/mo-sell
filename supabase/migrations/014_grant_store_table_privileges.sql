-- ─────────────────────────────────────────────────────────────────────────────
-- Grant the anon/authenticated roles the privileges the app needs on the
-- store tables created in 012. Tables created via raw SQL do not inherit the
-- dashboard's default grants, so the client-side adapter (anon key) could not
-- insert/update products, orders, etc. RLS stays disabled on these tables
-- (matching `businesses`), so privileges are the only gate.
-- ─────────────────────────────────────────────────────────────────────────────

GRANT ALL ON "storeProducts" TO anon, authenticated;
GRANT ALL ON "storeOrders" TO anon, authenticated;
GRANT ALL ON "checkoutSessions" TO anon, authenticated;
GRANT ALL ON "storeCollections" TO anon, authenticated;
GRANT ALL ON "storeAnalytics" TO anon, authenticated;
GRANT ALL ON "storeEarnings" TO anon, authenticated;
GRANT ALL ON "payoutRequests" TO anon, authenticated;
GRANT ALL ON "storeShippingZones" TO anon, authenticated;
GRANT ALL ON "storeBookings" TO anon, authenticated;
GRANT ALL ON "storeBookingAvailability" TO anon, authenticated;
GRANT ALL ON "ugcOrders" TO anon, authenticated;
GRANT ALL ON "campaigns" TO anon, authenticated;
GRANT ALL ON "contentCalendar" TO anon, authenticated;
GRANT ALL ON "socialProfiles" TO anon, authenticated;
GRANT ALL ON "storeOrderCounters" TO anon, authenticated;

GRANT EXECUTE ON FUNCTION next_order_number(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_business_field(text, text, numeric) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_creator_field(text, text, numeric) TO anon, authenticated;
