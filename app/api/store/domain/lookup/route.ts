import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';

/**
 * GET /api/store/domain/lookup?domain=shop.mybrand.com
 *
 * Used by src/middleware.ts to resolve a custom domain to a storeSlug.
 * Returns { storeSlug, businessId } or 404.
 * Cached 5 minutes at the edge.
 */
export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get('domain')?.toLowerCase().trim();

  if (!domain) {
    return NextResponse.json({ error: 'domain is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();

    // Store config lives on the businesses row: find a business whose custom
    // domain is set to `domain` and has been verified.
    const { data, error } = await supabase
      .from('businesses')
      .select('id, storeSlug')
      .eq('customDomain', domain)
      .eq('customDomainStatus', 'verified')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[Domain Lookup] Query error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Domain not found or not verified' }, { status: 404 });
    }

    return NextResponse.json(
      { storeSlug: data.storeSlug, businessId: data.id },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    );
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
