import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import type { CustomerTag } from '@/types/mo-sell.types';

/**
 * GET /api/store/customers?businessId=xxx&tag=buyer
 * Returns all customers for a business, ordered by createdAt desc.
 * Optional tag param filters customers containing that tag.
 */
export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get('businessId');
  const tag        = req.nextUrl.searchParams.get('tag') as CustomerTag | null;

  if (!businessId) {
    return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
  }

  if (tag) {
    const validTags: CustomerTag[] = ['buyer', 'subscriber', 'booking', 'repeat'];
    if (!validTags.includes(tag)) {
      return NextResponse.json(
        { error: `Invalid tag. Must be one of: ${validTags.join(', ')}` },
        { status: 400 },
      );
    }
  }

  try {
    const supabase = getSupabaseServer();

    const { data: rows, error } = await supabase
      .from('customers')
      .select('*')
      .eq('businessId', businessId);

    if (error) {
      console.error('[Store Customers] Query error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    let customers = (rows ?? []).map((d: any) => ({
      id: d.id,
      ...d,
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : null,
      updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : null,
      lastOrderAt: d.lastOrderAt ? new Date(d.lastOrderAt).toISOString() : null,
      subscribedAt: d.subscribedAt ? new Date(d.subscribedAt).toISOString() : null,
    }));

    // createdAt desc ordering (sort in JS after select)
    customers.sort((a: any, b: any) =>
      String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')),
    );

    if (tag) {
      customers = customers.filter((c: any) => (c.tags ?? []).includes(tag));
    }

    return NextResponse.json({ customers });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
