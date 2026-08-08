import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';

export async function GET(_req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.from('ugcOrders').select('*').eq('status', 'DISPUTED');
    if (error) throw new Error(error.message);

    const orders = (data ?? []).sort(
      (a, b) =>
        new Date(b.disputeOpenedAt ?? 0).getTime() - new Date(a.disputeOpenedAt ?? 0).getTime()
    );

    return NextResponse.json({ orders });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
