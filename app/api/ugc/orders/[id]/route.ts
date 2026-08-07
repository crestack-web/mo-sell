import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { action, reason } = await req.json();

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action must be "accept" or "reject"' }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: order, error: orderError } = await supabase
      .from('ugcOrders')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (orderError) throw orderError;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'REQUESTED') {
      return NextResponse.json({ error: `Order is already ${order.status}` }, { status: 400 });
    }

    if (action === 'accept') {
      await supabase.from('ugcOrders').update({
        status: 'IN_PROGRESS',
        acceptedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).eq('id', id);
    } else {
      await supabase.from('ugcOrders').update({
        status: 'REJECTED',
        rejectionReason: reason || null,
        updatedAt: new Date().toISOString(),
      }).eq('id', id);
    }

    return NextResponse.json({ success: true, status: action === 'accept' ? 'IN_PROGRESS' : 'REJECTED' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
