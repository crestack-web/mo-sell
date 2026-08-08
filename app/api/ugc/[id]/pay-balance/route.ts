import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { initializeBalance } from '@/lib/paystack-ugc';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { brandEmail } = await req.json();
    if (!brandEmail) {
      return NextResponse.json({ error: 'brandEmail required' }, { status: 400 });
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

    if (order.status !== 'DRAFT_SUBMITTED' && order.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Order must be in DRAFT_SUBMITTED or APPROVED status' }, { status: 400 });
    }

    const result = await initializeBalance(id, brandEmail, order.agreedPrice);

    await supabase.from('ugcOrders').update({
      paystackRefBalance: result.reference,
      updatedAt: new Date().toISOString(),
    }).eq('id', id);

    return NextResponse.json({ paystackUrl: result.authorization_url, reference: result.reference });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
