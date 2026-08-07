import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';

/**
 * GET /api/store/collections?businessId=xxx
 * Returns all collections for a store (sorted by title).
 */
export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get('businessId');

  if (!businessId) {
    return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();

    const { data: rows, error } = await supabase
      .from('storeCollections')
      .select('*')
      .eq('businessId', businessId);

    if (error) {
      console.error('[Store Collections] Query error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // orderBy title asc (sort in JS after select). The table stores the title
    // in the `name` column, fall back to `title` for legacy rows.
    const collections = (rows ?? [])
      .sort((a: any, b: any) =>
        String(a.name ?? a.title ?? '').localeCompare(String(b.name ?? b.title ?? '')),
      )
      .map((d: any) => ({ id: d.id, ...d }));

    return NextResponse.json({ collections }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
