'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useCart } from '../../context/CartContext';

interface BookingPickerProps {
  businessId: string;
  storeSlug: string;
  productId: string;
  productName: string;
  price: number;
  currency: string;
  onBooked?: () => void;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

function fmt(n: number, currency: string) {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
  return `${sym}${n.toLocaleString()}`;
}

function formatSlotTime(time: string) {
  const [hStr, mStr] = time.split(':');
  let h = Number(hStr);
  const m = mStr ?? '00';
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${period}`;
}

export function BookingPicker({
  businessId, storeSlug, productId, productName, price, currency, onBooked,
}: BookingPickerProps) {
  const { addItem } = useCart();

  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  const formattedDate = useMemo(() => {
    if (!selectedDate) return '';
    const d = new Date(selectedDate + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }, [selectedDate]);

  const fetchSlots = useCallback(async (date: string) => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    setSlots([]);
    setError('');
    try {
      const res = await fetch(
        `/api/store/bookings/slots?businessId=${businessId}&date=${date}&productId=${productId}`
      );
      if (!res.ok) throw new Error('Failed to fetch slots');
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch {
      setError('Could not load available time slots. Please try another date.');
    } finally {
      setLoadingSlots(false);
    }
  }, [businessId, productId]);

  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    setError('');
    fetchSlots(date);
  }, [fetchSlots]);

  const handleBook = useCallback(async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!selectedSlot) {
      setError('Please select a time slot.');
      return;
    }
    setBooking(true);
    setError('');
    try {
      const res = await fetch('/api/store/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          storeSlug,
          productId,
          date: selectedDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          customerName: name.trim(),
          customerEmail: email.trim(),
          customerPhone: phone.trim(),
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Failed to create booking');
      }
      const data = await res.json() as { bookingId?: string; id?: string };

      const trimmedNotes = notes.trim();
      addItem({
        productId,
        displayName: `${productName} — ${selectedDate} @ ${formatSlotTime(selectedSlot.startTime)}`,
        price,
        imageUrl: null,
        maxStock: 1,
        productType: 'service',
        metadata: {
          bookingId: data.bookingId ?? data.id ?? '',
          bookingDate: selectedDate,
          bookingTime: selectedSlot.startTime,
          customerName: name.trim(),
          customerEmail: email.trim(),
          customerPhone: phone.trim(),
          ...(trimmedNotes ? { bookingNotes: trimmedNotes } : {}),
        },
      });

      setSuccess(true);
      onBooked?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBooking(false);
    }
  }, [name, email, phone, notes, selectedSlot, selectedDate, businessId, storeSlug, productId, productName, price, addItem, onBooked]);

  if (success) {
    return (
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--sf-text-1)' }}>Booking added to cart!</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--sf-text-2)', marginTop: 8 }}>
            {productName} on {formattedDate} at {selectedSlot ? formatSlotTime(selectedSlot.startTime) : ''}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--sf-text-3)', marginTop: 12 }}>
            Proceed to checkout to complete your booking.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <p style={sectionTitle}>📅 Schedule your booking</p>

      {/* Date picker */}
      <div>
        <label style={labelStyle}>Pick a date</label>
        <input
          type="date"
          value={selectedDate}
          min={today}
          onChange={handleDateChange}
          style={inputStyle}
        />
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div>
          <label style={labelStyle}>
            Available times for {formattedDate}
          </label>
          {loadingSlots ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--sf-text-3)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}>
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              Loading slots…
            </div>
          ) : slots.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--sf-text-3)', fontSize: '0.875rem' }}>
              <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>📭</div>
              No time slots available for this date. Try another day.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
              {slots.map(slot => (
                <button
                  key={slot.startTime}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => setSelectedSlot(slot)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 'var(--sf-radius-sm)',
                    border: `2px solid ${
                      selectedSlot?.startTime === slot.startTime
                        ? 'var(--sf-primary)'
                        : slot.available
                          ? 'var(--sf-border)'
                          : 'transparent'
                    }`,
                    background: !slot.available
                      ? 'var(--sf-bg)'
                      : selectedSlot?.startTime === slot.startTime
                        ? 'color-mix(in srgb, var(--sf-primary) 10%, var(--sf-surface))'
                        : 'var(--sf-surface)',
                    color: !slot.available
                      ? 'var(--sf-text-3)'
                      : selectedSlot?.startTime === slot.startTime
                        ? 'var(--sf-primary)'
                        : 'var(--sf-text-1)',
                    fontWeight: selectedSlot?.startTime === slot.startTime ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: slot.available ? 'pointer' : 'not-allowed',
                    opacity: slot.available ? 1 : 0.45,
                    fontFamily: 'inherit',
                    lineHeight: 1.4,
                    transition: 'border-color 0.15s, background 0.15s, color 0.15s',
                  }}
                >
                  {formatSlotTime(slot.startTime)}
                  {slot.available ? (
                    <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--sf-text-3)', marginTop: 2, fontWeight: 500 }}>
                      {formatSlotTime(slot.endTime)}
                    </span>
                  ) : (
                    <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--sf-text-3)', marginTop: 2, fontWeight: 500 }}>
                      Booked
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Booking form — shown after slot selection */}
      {selectedSlot && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
          <p style={sectionTitle}>Your details</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Full name *</label>
              <input
                style={inputStyle}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Email *</label>
              <input
                style={inputStyle}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Phone *</label>
              <input
                style={inputStyle}
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+234 800 000 0000"
                required
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any special requests or details…"
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Total & book button */}
      {selectedSlot && (
        <>
          <div style={{
            borderTop: '1px solid var(--sf-border)',
            paddingTop: 12, marginTop: 4,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--sf-text-2)' }}>Total</span>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--sf-text-1)' }}>
              {fmt(price, currency)}
            </span>
          </div>

          {error && (
            <div style={{
              padding: '12px 16px', background: '#FEF2F2',
              border: '1px solid #FECACA', borderRadius: 8,
              color: '#B91C1C', fontSize: '0.875rem',
            }}>
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={booking}
            onClick={handleBook}
            style={{
              padding: '15px', borderRadius: 10,
              background: booking ? 'var(--sf-text-3)' : 'var(--sf-primary)',
              color: '#fff', border: 'none', fontWeight: 700, fontSize: '1rem',
              cursor: booking ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontFamily: 'inherit',
              transition: 'opacity 0.15s',
            }}
          >
            {booking ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}>
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                Booking…
              </>
            ) : (
              <>Book & Pay {fmt(price, currency)}</>
            )}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--sf-text-3)' }}>
            You&apos;ll be charged after confirming at checkout
          </p>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: 'var(--sf-surface)',
  border: '1px solid var(--sf-border)',
  borderRadius: 'var(--sf-radius)',
  padding: '20px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
};

const sectionTitle: React.CSSProperties = {
  fontWeight: 700, fontSize: '0.95rem', color: 'var(--sf-text-1)',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.78rem', fontWeight: 600,
  color: 'var(--sf-text-2)', marginBottom: 5,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '1.5px solid var(--sf-border)',
  borderRadius: 8, fontSize: '0.875rem',
  fontFamily: 'inherit', color: 'var(--sf-text-1)',
  background: 'var(--sf-bg)', outline: 'none',
  boxSizing: 'border-box',
};
