import { NextRequest, NextResponse } from 'next/server';
import { isPlatformHost, normalizeDomain } from '@/lib/domain';

/**
 * Custom-domain routing:
 * When Host is a merchant domain (not the MO Sell app), look up the verified
 * store and rewrite to /store/{storeSlug}/...
 */
export async function middleware(req: NextRequest) {
  const rawHost = req.headers.get('host') ?? '';
  const host = normalizeDomain(rawHost.split(':')[0] ?? '');

  if (!host || isPlatformHost(host)) {
    return NextResponse.next();
  }

  const { pathname, search } = req.nextUrl;

  // Never rewrite platform API/domain endpoints or Next internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/welcome') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/pricing')
  ) {
    return NextResponse.next();
  }

  try {
    const lookupUrl = new URL('/api/store/domain/lookup', req.nextUrl.origin);
    lookupUrl.searchParams.set('domain', host);

    const res = await fetch(lookupUrl.toString(), {
      headers: {
        // Pass-through so edge can reuse connection; avoid caching wrong store
        'x-mosell-domain-lookup': host,
      },
      // Middleware fetch is edge-side; short timeout is not available — rely on API
      next: { revalidate: 0 },
    } as RequestInit);

    if (!res.ok) {
      return NextResponse.next();
    }

    const data = (await res.json()) as { storeSlug?: string };
    if (!data.storeSlug) {
      return NextResponse.next();
    }

    const slug = data.storeSlug;
    // Already on the correct store path
    if (pathname === `/store/${slug}` || pathname.startsWith(`/store/${slug}/`)) {
      return NextResponse.next();
    }

    const rewritePath =
      pathname === '/' ? `/store/${slug}` : `/store/${slug}${pathname}`;

    const url = req.nextUrl.clone();
    url.pathname = rewritePath;
    // keep search string
    return NextResponse.rewrite(url);
  } catch (err) {
    console.error('[middleware] domain lookup failed', host, err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)',
  ],
};
