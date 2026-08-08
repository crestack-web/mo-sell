import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { videoUrl, type } = await req.json();
    if (!videoUrl || !type) {
      return NextResponse.json({ error: 'videoUrl and type (draft/final) required' }, { status: 400 });
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

    if (type === 'draft') {
      if (order.paymentStatus !== 'DEPOSIT_HELD') {
        return NextResponse.json({ error: 'Deposit must be paid before submitting draft' }, { status: 400 });
      }
      await supabase.from('ugcOrders').update({
        draftVideoUrl: videoUrl,
        status: 'DRAFT_SUBMITTED',
        draftSubmittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).eq('id', id);
    } else if (type === 'final') {
      if (order.paymentStatus !== 'PENDING_BALANCE' && order.paymentStatus !== 'PAID_OUT') {
        return NextResponse.json({ error: 'Balance must be paid before submitting final' }, { status: 400 });
      }
      await supabase.from('ugcOrders').update({
        finalVideoUrl: videoUrl,
        watermarked: false,
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).eq('id', id);
    } else {
      return NextResponse.json({ error: 'type must be "draft" or "final"' }, { status: 400 });
    }

    return NextResponse.json({ success: true, status: type === 'draft' ? 'DRAFT_SUBMITTED' : 'COMPLETED' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
