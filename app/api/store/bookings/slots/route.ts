import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import type { DayOfWeek } from '@/types/mo-sell.types';

const DAY_MAP: Record<number, DayOfWeek> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
};

interface SlotResult {
  startTime: string;
  endTime: string;
  available: boolean;
}

/**
 * GET /api/store/bookings/slots?businessId=xxx&date=2026-08-15&productId=xxx
 * Returns available time slots for a given date based on availability config
 * and existing bookings.
 */
export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get('businessId');
  const date       = req.nextUrl.searchParams.get('date');

  if (!businessId || !date) {
    return NextResponse.json({ error: 'businessId and date are required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();

    // 1. Load availability config
    const { data: config, error: configError } = await supabase
      .from('storeBookingAvailability')
      .select('*')
      .eq('businessId', businessId)
      .maybeSingle();

    if (configError) {
      console.error('[Slots] Config query error:', configError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (!config) {
      return NextResponse.json({ slots: [] });
    }

    // 2. Check if date is blocked
    if (Array.isArray(config.blockedDates) && config.blockedDates.includes(date)) {
      return NextResponse.json({ slots: [] });
    }

    // 3. Determine day of week
    const dateObj = new Date(date + 'T00:00:00');
    const dayOfWeek = DAY_MAP[dateObj.getDay()];

    const dayConfig = (config.slots ?? []).find((s: any) => s.day === dayOfWeek);
    if (!dayConfig || !dayConfig.enabled) {
      return NextResponse.json({ slots: [] });
    }

    // 4. Generate all possible slots based on config
    const allSlots = generateSlots(
      dayConfig.startTime,
      dayConfig.endTime,
      config.slotDurationMinutes,
      config.bufferMinutes,
    );

    // 5. Load existing bookings for this date (non-cancelled)
    const { data: bookings, error: bookingsError } = await supabase
      .from('storeBookings')
      .select('startTime')
      .eq('businessId', businessId)
      .eq('date', date)
      .in('status', ['pending', 'confirmed']);

    if (bookingsError) {
      console.error('[Slots] Bookings query error:', bookingsError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const takenStartTimes = new Set<string>();
    (bookings ?? []).forEach((booking: any) => {
      takenStartTimes.add(booking.startTime);
    });

    // 6. Mark slots as available or taken
    const slots: SlotResult[] = allSlots.map(slot => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      available: !takenStartTimes.has(slot.startTime),
    }));

    return NextResponse.json({ slots });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number,
  bufferMinutes: number,
): { startTime: string; endTime: string }[] {
  const slots: { startTime: string; endTime: string }[] = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (currentMinutes + durationMinutes <= endMinutes) {
    const slotStart = minutesToTime(currentMinutes);
    const slotEnd = minutesToTime(currentMinutes + durationMinutes);
    slots.push({ startTime: slotStart, endTime: slotEnd });
    currentMinutes += durationMinutes + bufferMinutes;
  }

  return slots;
}

function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
