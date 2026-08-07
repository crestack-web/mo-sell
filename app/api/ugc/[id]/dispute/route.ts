import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';

const VALID_REASONS = ['QUALITY', 'BRIEF_MISMATCH', 'DEADLINE', 'NO_RESPONSE', 'SCOPE_CREEP', 'OTHER'];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { reason, description, openedBy } = await req.json();
    if (!reason || !openedBy) {
      return NextResponse.json({ error: 'reason and openedBy required' }, { status: 400 });
    }
    if (!VALID_REASONS.includes(reason)) {
      return NextResponse.json({ error: `Invalid reason. Must be one of: ${VALID_REASONS.join(', ')}` }, { status: 400 });
    }
    if (!['brand', 'creator'].includes(openedBy)) {
      return NextResponse.json({ error: 'openedBy must be "brand" or "creator"' }, { status: 400 });
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

    if (order.status === 'COMPLETED' || order.status === 'CANCELLED' || order.status === 'DISPUTED') {
      return NextResponse.json({ error: `Cannot dispute order in ${order.status} status` }, { status: 400 });
    }

    await supabase.from('ugcOrders').update({
      status: 'DISPUTED',
      paymentStatus: order.paymentStatus === 'PAID_OUT' ? order.paymentStatus : 'DISPUTE_HOLD',
      disputeReason: reason,
      disputeDescription: description ?? '',
      disputeOpenedBy: openedBy,
      disputeOpenedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).eq('id', id);

    return NextResponse.json({ success: true, status: 'DISPUTED' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
