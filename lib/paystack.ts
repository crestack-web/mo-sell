/**
 * Platform Paystack public key for managed-payments stores.
 *
 * Stores using Busmo managed payments collect through the platform's own
 * Paystack account, so they all share ONE public (publishable) key. `pk_`
 * keys are explicitly designed to be public — they only open the client-side
 * checkout and cannot charge, withdraw or do anything else. The matching
 * `sk_live_` secret key stays in the server environment only and is never
 * imported here.
 *
 * Deployment env vars (PAYSTACK_PUBLIC_KEY / NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY)
 * take priority everywhere; this constant is a safety net so managed stores
 * can still take payments even if a deployment is missing those vars.
 */
export const PLATFORM_PAYSTACK_PUBLIC_KEY =
  'pk_live_e2d2b40b34e758d22b585fc61ebea16ff39775c';
