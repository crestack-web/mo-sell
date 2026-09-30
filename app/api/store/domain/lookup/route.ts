import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { normalizeDomain } from '@/lib/domain';

/**
 * GET /api/store/domain/lookup?domain=shop.mybrand.com
 *
 * Used by middleware to resolve a custom domain to a storeSlug.
 * Returns { storeSlug, businessId } or 404.
 * Cached 5 minutes at the edge.
 */
export async function GET(req: NextRequest) {
  const domain = normalizeDomain(req.nextUrl.searchParams.get('domain'));

  if (!domain) {
    return NextResponse.json({ error: 'domain is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();

    const candidates = [domain];
    if (domain.startsWith('www.')) {
      candidates.push(domain.slice(4));
    } else {
      candidates.push(`www.${domain}`);
    }

    const { data, error } = await supabase
      .from('businesses')
      .select('id, storeSlug, customDomain')
      .in('customDomain', candidates)
      .eq('customDomainStatus', 'verified')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[Domain Lookup] Query error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (!data?.storeSlug) {
      return NextResponse.json({ error: 'Domain not found or not verified' }, { status: 404 });
    }

    return NextResponse.json(
      { storeSlug: data.storeSlug, businessId: data.id },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      },
    );
  } catch (err) {
    console.error('[Domain Lookup]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
