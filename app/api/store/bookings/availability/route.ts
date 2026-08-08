import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import type { BookingAvailability } from '@/types/mo-sell.types';

/**
 * GET /api/store/bookings/availability?businessId=xxx
 * Returns the booking availability config for a business.
 */
export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get('businessId');

  if (!businessId) {
    return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();

    const { data, error } = await supabase
      .from('storeBookingAvailability')
      .select('*')
      .eq('businessId', businessId)
      .maybeSingle();

    if (error) {
      console.error('[Availability] Query error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ availability: null }, { status: 200 });
    }

    return NextResponse.json({
      availability: {
        ...data,
        createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : null,
        updatedAt: data.updatedAt ? new Date(data.updatedAt).toISOString() : null,
      },
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/store/bookings/availability
 * Creates or updates the booking availability config.
 * Body: { businessId, slots, slotDurationMinutes, bufferMinutes, blockedDates }
 */
export async function POST(req: NextRequest) {
  let body: {
    businessId?: string;
    slots?: BookingAvailability['slots'];
    slotDurationMinutes?: number;
    bufferMinutes?: number;
    blockedDates?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { businessId, slots, slotDurationMinutes, bufferMinutes, blockedDates } = body;

  if (!businessId || !slots || slotDurationMinutes == null || bufferMinutes == null || !blockedDates) {
    return NextResponse.json(
      { error: 'businessId, slots, slotDurationMinutes, bufferMinutes, and blockedDates are required' },
      { status: 400 },
    );
  }

  try {
    const supabase = getSupabaseServer();

    const { data: existing, error: lookupError } = await supabase
      .from('storeBookingAvailability')
      .select('id')
      .eq('businessId', businessId)
      .maybeSingle();

    if (lookupError) {
      console.error('[Availability] Lookup error:', lookupError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const data = {
      businessId,
      slots,
      slotDurationMinutes,
      bufferMinutes,
      blockedDates,
      updatedAt: new Date().toISOString(),
    };

    let writeError: { message: string } | null;
    if (existing) {
      ({ error: writeError } = await supabase
        .from('storeBookingAvailability')
        .update(data)
        .eq('id', existing.id));
    } else {
      ({ error: writeError } = await supabase
        .from('storeBookingAvailability')
        .insert({
          id: 'avail_' + crypto.randomUUID(),
          ...data,
          createdAt: new Date().toISOString(),
        }));
    }

    if (writeError) {
      console.error('[Availability] Write error:', writeError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
