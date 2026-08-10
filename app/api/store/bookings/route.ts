import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import type { BookingStatus } from '@/types/mo-sell.types';

/**
 * GET /api/store/bookings?businessId=xxx&status=pending
 * Returns all bookings for a business, ordered by date desc.
 */
export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get('businessId');
  const status     = req.nextUrl.searchParams.get('status') as BookingStatus | null;

  if (!businessId) {
    return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();

    const { data: rows, error } = await supabase
      .from('storeBookings')
      .select('*')
      .eq('businessId', businessId);

    if (error) {
      console.error('[Bookings] Query error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    let bookings = (rows ?? []).map((d: any) => ({
      id: d.id,
      ...d,
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : null,
      updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : null,
    }));

    if (status) {
      bookings = bookings.filter((b: any) => b.status === status);
    }

    // orderBy date desc (sort in JS after select)
    bookings.sort((a: any, b: any) =>
      String(b.date ?? '').localeCompare(String(a.date ?? '')),
    );

    return NextResponse.json({ bookings });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/store/bookings
 * Creates a new booking.
 * Body: { businessId, storeSlug, productId, productName, customerName,
 *         customerEmail, customerPhone, date, startTime, endTime, notes? }
 */
export async function POST(req: NextRequest) {
  let body: {
    businessId?: string;
    storeSlug?: string;
    productId?: string;
    productName?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    time?: string;
    notes?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    businessId, storeSlug, productId,
    customerEmail,
    date, notes,
  } = body;

  const productName = body.productName || 'Service Booking';
  const startTime = body.startTime || body.time || '';
  const endTime = body.endTime || body.startTime || body.time || '';
  const customerName = (body.customerName || '').trim() || (body.customerEmail || '').split('@')[0] || 'Customer';
  const customerPhone = body.customerPhone ?? null;

  if (
    !businessId || !storeSlug || !productId || !productName ||
    !customerName || !customerEmail ||
    !date || !startTime || !endTime
  ) {
    return NextResponse.json(
      {
        error:
          'businessId, storeSlug, productId, productName, customerName, customerEmail, customerPhone, date, startTime, and endTime are required',
      },
      { status: 400 },
    );
  }

  try {
    const supabase = getSupabaseServer();

    // Check slot is still available (no duplicate bookings)
    const { data: existingBookings, error: existingError } = await supabase
      .from('storeBookings')
      .select('id')
      .eq('businessId', businessId)
      .eq('date', date)
      .eq('startTime', startTime)
      .in('status', ['pending', 'confirmed']);

    if (existingError) {
      console.error('[Bookings] Slot check error:', existingError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (existingBookings && existingBookings.length > 0) {
      return NextResponse.json(
        { error: 'This time slot is no longer available' },
        { status: 409 },
      );
    }

    const bookingId = 'bk_' + crypto.randomUUID();
    const now = new Date().toISOString();

    const { error: insertError } = await supabase
      .from('storeBookings')
      .insert({
        id: bookingId,
        businessId,
        storeSlug,
        productId,
        productName,
        customerName,
        customerEmail,
        customerPhone,
        date,
        startTime,
        endTime,
        notes: notes ?? null,
        status: 'pending',
        orderId: null,
        createdAt: now,
        updatedAt: now,
      });

    if (insertError) {
      console.error('[Bookings] Booking insert error:', insertError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // Tag the customer with 'booking'
    try {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('email', customerEmail)
        .eq('businessId', businessId)
        .maybeSingle();

      if (existingCustomer) {
        const currentTags: string[] = Array.isArray(existingCustomer.tags) ? existingCustomer.tags : [];
        const updates: Record<string, any> = {
          updatedAt: new Date().toISOString(),
        };
        if (!currentTags.includes('booking')) {
          updates.tags = [...currentTags, 'booking'];
        }
        await supabase
          .from('customers')
          .update(updates)
          .eq('id', existingCustomer.id);
      } else {
        await supabase
          .from('customers')
          .insert({
            id: 'cus_' + crypto.randomUUID(),
            businessId,
            storeSlug,
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            tags: ['booking'],
            totalOrders: 0,
            totalSpent: 0,
            lastOrderAt: null,
            subscribedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
      }
    } catch {
      // Customer tagging is best-effort; don't fail the booking
    }

    return NextResponse.json({ bookingId }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
