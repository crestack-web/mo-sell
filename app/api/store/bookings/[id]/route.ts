import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import type { BookingStatus } from '@/types/mo-sell.types';

/**
 * PATCH /api/store/bookings/[id]
 * Updates a booking's status.
 * Body: { businessId, status }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: { businessId?: string; status?: BookingStatus };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { businessId, status } = body;

  if (!businessId || !status) {
    return NextResponse.json(
      { error: 'businessId and status are required' },
      { status: 400 },
    );
  }

  const validStatuses: BookingStatus[] = ['pending', 'confirmed', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
      { status: 400 },
    );
  }

  try {
    const supabase = getSupabaseServer();

    const { data: existing, error: lookupError } = await supabase
      .from('storeBookings')
      .select('id')
      .eq('id', id)
      .eq('businessId', businessId)
      .maybeSingle();

    if (lookupError) {
      console.error('[Booking PATCH] Lookup error:', lookupError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from('storeBookings')
      .update({
        status,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('[Booking PATCH] Update error:', updateError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
