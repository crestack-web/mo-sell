/**
 * Custom domain helpers — shared by verify, lookup, save UI, and middleware.
 */

/** Canonical CNAME target merchants must point at (overridable via env). */
export function getCustomDomainCnameTarget(): string {
  return (
    process.env.CUSTOM_DOMAIN_CNAME_TARGET ||
    process.env.NEXT_PUBLIC_CUSTOM_DOMAIN_CNAME ||
    'store.busmo.io'
  ).toLowerCase().replace(/\.$/, '');
}

/**
 * Strip protocol, path, port, trailing dot; lowercase.
 * Does not strip www — apex and www are distinct DNS names.
 */
export function normalizeDomain(input: string | null | undefined): string {
  if (!input) return '';
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
    .replace(/\.$/, '')
    .trim();
}

export function isValidDomainFormat(domain: string): boolean {
  // labels.tld — min one dot, no spaces, reasonable TLD
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(domain);
}

/** True if a resolved CNAME target points at our platform. */
export function cnamePointsToPlatform(resolved: string[], target = getCustomDomainCnameTarget()): boolean {
  const targets = new Set([
    target,
    `www.${target}`,
  ]);
  // Also accept bare apex of target parent for flexibility (e.g. busmo.io only if target is store.busmo.io — no)
  return resolved.some((r) => {
    const host = r.toLowerCase().replace(/\.$/, '');
    if (targets.has(host)) return true;
    // CNAME to any subdomain of the same registrable host as target is too loose;
    // only allow exact target or target with trailing label stripped once (store.busmo.io).
    if (host === target || host.endsWith(`.${target}`)) return true;
    return false;
  });
}

/** Hostnames that are the MO Sell app itself (not merchant custom domains). */
export function isPlatformHost(host: string): boolean {
  const h = normalizeDomain(host);
  if (!h) return true;
  if (h === 'localhost' || h.endsWith('.localhost')) return true;
  if (h.endsWith('.vercel.app')) return true;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.PUBLIC_APP_URL || 'https://mo-sell.store';
  let appHost = '';
  try {
    appHost = new URL(appUrl.includes('://') ? appUrl : `https://${appUrl}`).hostname.toLowerCase();
  } catch {
    appHost = 'mo-sell.store';
  }

  const platform = new Set(
    [
      appHost,
      appHost.startsWith('www.') ? appHost.slice(4) : `www.${appHost}`,
      'mo-sell.store',
      'www.mo-sell.store',
      getCustomDomainCnameTarget(),
      `www.${getCustomDomainCnameTarget()}`,
      'store.busmo.io',
      'www.store.busmo.io',
    ].map((x) => x.toLowerCase()),
  );

  return platform.has(h);
}
