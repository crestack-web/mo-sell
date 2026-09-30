import { normalizeDomain } from '@/lib/domain';

const BASE_APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mo-sell.store';

export function getStorePublicUrl(storeSlug: string, customDomain?: string | null, customDomainVerified?: boolean): string {
  const domain = normalizeDomain(customDomain);
  if (domain && customDomainVerified) {
    return `https://${domain}`;
  }
  const base = BASE_APP_URL.replace(/\/$/, '');
  return `${base}/store/${storeSlug}`;
}
