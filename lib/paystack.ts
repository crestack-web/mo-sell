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
  'pk_live_e2d2b40b34e758d22b585fc61ebea16ff39775ce';

/**
 * Paystack publishable keys are exactly 48 chars: `pk_` + `live`/`test` +
 * 40 hex chars. Rejects truncated keys, secret (`sk_`) keys and anything else
 * so a bad key can never reach the browser checkout.
 */
export function isValidPaystackPublicKey(key: string | null | undefined): key is string {
  return typeof key === 'string' && /^pk_(live|test)_[0-9a-f]{40}$/i.test(key.trim());
}

/**
 * Resolve a valid public key from a list of candidates (store key → env →
 * platform constant), skipping any that don't look like real Paystack keys.
 */
export function resolvePaystackPublicKey(...candidates: Array<string | null | undefined>): string {
  for (const key of candidates) {
    if (isValidPaystackPublicKey(key)) return key.trim();
  }
  return PLATFORM_PAYSTACK_PUBLIC_KEY;
}
