import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';

/**
 * GET /api/store/products
 * Public — lists store products for a business.
 *
 * Query params:
 *   businessId   (required)
 *   available    "true" | omit — filter to available=true only
 *   collectionId — filter by collection membership
 *   featured     "true" — filter to featured only
 *   limit        number, default 100
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const businessId   = searchParams.get('businessId');
  const available    = searchParams.get('available');
  const collectionId = searchParams.get('collectionId');
  const featured     = searchParams.get('featured');
  const limitParam   = parseInt(searchParams.get('limit') ?? '100', 10);

  if (!businessId) {
    return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();

    const { data: rows, error } = await supabase
      .from('storeProducts')
      .select('*')
      .eq('businessId', businessId);

    if (error) {
      console.error('[Store Products] Query error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    let products = (rows ?? []).slice();

    // Drafts are never exposed publicly, regardless of the available flag.
    products = products.filter((p: any) => (p.status ?? 'active') !== 'draft');

    if (available === 'true') {
      products = products.filter((p: any) => p.available === true);
    }
    if (featured === 'true') {
      products = products.filter((p: any) => p.featured === true);
    }
    if (collectionId) {
      products = products.filter((p: any) =>
        Array.isArray(p.collectionIds) && p.collectionIds.includes(collectionId),
      );
    }

    products = products.slice(0, Math.min(limitParam, 200));

    const mapped = products.map((d: any) => ({
      id: d.id,
      ...d,
      // Timestamps come back as ISO strings from Supabase
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : null,
      updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : null,
    }));

    return NextResponse.json({ products: mapped }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
