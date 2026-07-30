const BASE_APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mo-sell.store';

export function getStorePublicUrl(storeSlug: string, customDomain?: string | null, customDomainVerified?: boolean): string {
  if (customDomain && customDomainVerified) {
    return `https://${customDomain}`;
  }
  return `${BASE_APP_URL}/${storeSlug}`;
}
