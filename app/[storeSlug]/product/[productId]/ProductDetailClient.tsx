'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import type { ThemeComponents, ThemeProductPageProps } from '@/themes/types';
import { BookingPicker } from './BookingPicker';
import { PLATFORM_PAYSTACK_PUBLIC_KEY } from '@/lib/paystack';

interface Product {
  id: string;
  displayName: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  category: string;
  stock: number;
  productType: 'physical' | 'digital' | 'service';
  tags: string[];
  deliveryNote: string | null;
  digitalFileUrl: string | null;
  digitalSubtype?: 'ebook' | 'course' | 'template' | 'ticket' | 'coaching';
  eventDate?: string | null;
  eventTime?: string | null;
  venue?: string | null;
  capacity?: number | string | null;
  callToAction?: string | null;
}

interface Props {
  product: Product;
  storeSlug: string;
  currency: string;
  theme: string;
  businessId?: string;
  paystackPublicKey?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: {
        key: string;
        email: string;
        amount: number;
        currency: string;
        metadata?: Record<string, unknown>;
        callback: (response: { reference: string }) => void;
        onClose: () => void;
      }) => { openIframe: () => void };
    };
  }
}

function loadPaystackScript(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).PaystackPop) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.body.appendChild(script);
  });
}

const LINK_STYLE_THEMES = ['ankara', 'midnight', 'harmattan', 'neon', 'sunset', 'mono'];

// Loading skeleton while theme loads
function ProductPageSkeleton() {
  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 5% 80px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
        <div style={{ aspectRatio: '1/1', background: '#F3F4F6', borderRadius: 16, animation: 'pulse 2s infinite' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ width: 80, height: 12, background: '#E5E7EB', borderRadius: 4 }} />
          <div style={{ width: '60%', height: 28, background: '#E5E7EB', borderRadius: 4 }} />
          <div style={{ width: 120, height: 20, background: '#E5E7EB', borderRadius: 4 }} />
          <div style={{ width: '100%', height: 80, background: '#E5E7EB', borderRadius: 4, marginTop: 16 }} />
        </div>
      </div>
    </div>
  );
}

// Fallback: generic product page if theme fails to load
function GenericProductPage({ product, storeSlug, currency }: ThemeProductPageProps) {
  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 5% 80px' }}>
      <div className="sf-product-page-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
        <div>
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt={product.displayName}
              style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 16 }} />
          ) : (
            <div style={{ width: '100%', aspectRatio: '1/1', background: '#F3F4F6', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>📦</div>
          )}
        </div>
        <div>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280' }}>{product.category}</p>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 8 }}>{product.displayName}</h1>
          <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4F46E5', marginTop: 12 }}>
            {currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' '}{product.price.toLocaleString()}
          </p>
          {product.description && <div className="product-rich-description" style={{ color: '#6B7280', marginTop: 16, lineHeight: 1.7, overflowWrap: 'break-word' }} dangerouslySetInnerHTML={{ __html: product.description }} />}
        </div>
      </div>
    </div>
  );
}

export function ProductDetailClient({ product, storeSlug, currency, theme, businessId, paystackPublicKey: paystackKeyProp }: Props) {
  const [ThemeComponents, setThemeComponents] = useState<ThemeComponents | null>(null);
  const [errorTheme, setErrorTheme] = useState(false);
  const [storeConfig, setStoreConfig] = useState<any>(null);

  // Form & checkout states
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState('');

  // Booking states
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const isLinkStyle = LINK_STYLE_THEMES.includes(theme);

  // Fetch store public config if we are in a link-in-bio theme
  useEffect(() => {
    if (isLinkStyle) {
      fetch(`/api/store/config/${storeSlug}`)
        .then(r => r.json())
        .then(data => setStoreConfig(data))
        .catch(err => console.error('[ProductDetailClient] Config fetch error:', err));
    }
  }, [storeSlug, isLinkStyle]);

  // Load standard dynamic theme components
  useEffect(() => {
    let cancelled = false;
    import(`@/themes/registry`).then(mod => {
      mod.getThemeComponents(theme).then((components: ThemeComponents) => {
        if (!cancelled) setThemeComponents(components);
      }).catch(() => {
        if (!cancelled) setErrorTheme(true);
      });
    }).catch(() => {
      if (!cancelled) setErrorTheme(true);
    });
    return () => { cancelled = true; };
  }, [theme]);

  // Read email from cookie
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = document.cookie.match(/(?:^|;\s*)customer_email=([^;]*)/)?.[1] ?? '';
      if (savedEmail) setEmail(decodeURIComponent(savedEmail));
    }
  }, []);

  const today = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const formattedDate = useMemo(() => {
    if (!selectedDate) return '';
    const d = new Date(selectedDate + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }, [selectedDate]);

  const fetchSlots = useCallback(async (date: string) => {
    if (!businessId) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    setSlots([]);
    setError('');
    try {
      const res = await fetch(
        `/api/store/bookings/slots?businessId=${businessId}&date=${date}&productId=${product.id}`
      );
      if (!res.ok) throw new Error('Failed to fetch slots');
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch {
      setError('Could not load available time slots. Please try another date.');
    } finally {
      setLoadingSlots(false);
    }
  }, [businessId, product.id]);

  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    setError('');
    fetchSlots(date);
  }, [fetchSlots]);

  const needsSlot = product.productType === 'service' || 
                    product.digitalSubtype === 'coaching' || 
                    product.digitalSubtype === 'ticket';

  const handleCheckout = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }
    if (needsSlot && !selectedSlot) {
      setError('Please select a date and an available time slot.');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const activeKey = paystackKeyProp || storeConfig?.paystackPublicKey || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || PLATFORM_PAYSTACK_PUBLIC_KEY;
      if (!activeKey) {
        setError('Payment is temporarily unavailable. Please try again later.');
        setProcessing(false);
        return;
      }

      await loadPaystackScript();

      let bookingId = '';
      if (needsSlot && businessId) {
        // Pre-create the booking in pending status
        const bookingRes = await fetch('/api/store/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            storeSlug,
            productId: product.id,
            productName: product.displayName,
            date: selectedDate,
            time: selectedSlot,
            customerName: name.trim(),
            customerEmail: email.trim(),
            customerPhone: phone.trim(),
            notes: notes.trim() || null,
          }),
        });

        if (!bookingRes.ok) {
          const data = await bookingRes.json() as { error?: string };
          throw new Error(data.error ?? 'Failed to reserve your slot. It may have been booked. Please choose another.');
        }
        const data = await bookingRes.json() as { bookingId?: string; id?: string };
        bookingId = data.bookingId || data.id || '';
      }

      const amountInKobo = Math.round(product.price * 100);
      const ref = `link_${storeSlug}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const paystack = (window as any).PaystackPop.setup({
        key: activeKey,
        email: email.trim(),
        amount: amountInKobo,
        currency: 'NGN',
        ref,
        metadata: {
          product_id: product.id,
          product_name: product.displayName,
          product_type: product.productType,
          store_slug: storeSlug,
          ...(bookingId ? { bookingId } : {}),
        },
        callback: async (response: { reference: string }) => {
          try {
            const res = await fetch('/api/store/link-purchase/confirm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                storeSlug,
                productId: product.id,
                paystackReference: response.reference,
                customerEmail: email.trim(),
                customerName: name.trim(),
                customerPhone: phone.trim(),
                ...(bookingId ? { bookingId } : {}),
              }),
            });
            const data = await res.json() as { orderId?: string; error?: string };
            if (res.ok && data.orderId) {
              setOrderId(data.orderId);
              setSuccess(true);
              document.cookie = `customer_email=${encodeURIComponent(email.trim())}; path=/; max-age=2592000`;
            } else {
              setError(data.error || 'Payment confirmation failed. Contact support with your payment reference.');
            }
          } catch {
            setError('Payment confirmation failed. Contact support with your payment reference.');
          }
          setProcessing(false);
        },
        onClose: () => {
          setProcessing(false);
        },
      });

      paystack.openIframe();
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round((1 - product.price / product.compareAtPrice) * 100) : null;

  const fmtCurrency = (n: number) => {
    return (currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ') + n.toLocaleString();
  };

  const textOnColor = (bg: string): string => {
    let hex = (bg || '').trim();
    if (hex.startsWith('#')) {
      hex = hex.slice(1);
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        return lum > 150 ? '#111111' : '#FFFFFF';
      }
    }
    return '#FFFFFF';
  };

  // ──── RENDER LINK-BIO DEDICATED PRODUCT PAGE ────
  if (isLinkStyle) {
    const primaryColor = storeConfig?.primaryColor || '#6366F1';
    
    return (
      <div style={{
        background: 'var(--sf-bg, #0A0A0A)',
        minHeight: '100vh',
        fontFamily: 'var(--sf-font, system-ui, sans-serif)',
        color: 'var(--sf-text-1, #FFFFFF)',
        padding: '24px 16px 80px',
        boxSizing: 'border-box'
      }}>
        {/* Style for dynamic spinning loader */}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } .sf-link-input::placeholder { color: var(--sf-text-3); opacity: 1; }`}</style>

        <div style={{ maxWidth: 500, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header & Back Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--sf-border)', paddingBottom: 12 }}>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') window.location.href = `/${storeSlug}`;
              }}
              style={{
                background: 'var(--sf-surface)',
                border: '1px solid var(--sf-border)',
                color: 'var(--sf-text-1)',
                padding: '8px 14px',
                borderRadius: 20,
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              ← Back to store
            </button>
            <span style={{ fontSize: '0.8rem', color: 'var(--sf-text-2)' }}>{storeConfig?.storeName}</span>
          </div>

          {success ? (
            /* Success State Card */
            <div style={{
              background: 'var(--sf-surface)',
              border: '1px solid var(--sf-border)',
              borderRadius: 'var(--sf-radius, 24px)',
              padding: '40px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16
            }}>
              <div style={{ fontSize: '3.5rem' }}>✅</div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Payment Successful!</h2>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--sf-text-2)', lineHeight: 1.6 }}>
                {product.productType === 'digital'
                  ? 'Your download link and order confirmation have been sent to your email.'
                  : product.productType === 'service'
                    ? `Your booking for ${formattedDate} @ ${selectedSlot} has been successfully secured and confirmed.`
                    : 'Your order has been received. We\'ll notify you when it is processed.'}
              </p>
              {orderId && (
                <span style={{ fontSize: '0.75rem', color: 'var(--sf-text-3)' }}>Order ID: {orderId}</span>
              )}
              <button
                onClick={() => { if (typeof window !== 'undefined') window.location.href = `/${storeSlug}`; }}
                style={{
                  marginTop: 8,
                  padding: '12px 24px',
                  borderRadius: 14,
                  border: 'none',
                  background: primaryColor,
                  color: textOnColor(primaryColor),
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            /* Product Checkout Form */
            <>
              {/* Product Media */}
              {product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.displayName}
                  style={{ width: '100%', aspectRatio: '16/10', objectFit: 'cover', borderRadius: 'var(--sf-radius, 24px)', border: '1px solid var(--sf-border)' }}
                />
              ) : (
                <div style={{ width: '100%', aspectRatio: '16/10', background: 'var(--sf-surface)', borderRadius: 'var(--sf-radius, 24px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>📦</div>
              )}

              {/* Product Info Block */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--sf-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{product.category}</span>
                  {discount && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(239,68,68,0.15)', color: '#DC2626' }}>
                      -{discount}% OFF
                    </span>
                  )}
                </div>
                <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800 }}>{product.displayName}</h1>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: primaryColor }}>{fmtCurrency(product.price)}</span>
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <span style={{ fontSize: '0.95rem', color: 'var(--sf-text-3)', textDecoration: 'line-through' }}>{fmtCurrency(product.compareAtPrice)}</span>
                  )}
                </div>
              </div>

              {/* Event Metadata (Fixed details for Tickets) */}
              {product.digitalSubtype === 'ticket' && (product.eventDate || product.venue) && (
                <div style={{
                  background: 'var(--sf-surface)',
                  border: '1px solid var(--sf-border)',
                  borderRadius: 'var(--sf-radius, 16px)',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  fontSize: '0.85rem'
                }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>📅 Event Details</p>
                  {product.eventDate && (
                    <p style={{ margin: 0, color: 'var(--sf-text-2)' }}>
                      <strong>Date:</strong> {new Date(product.eventDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      {product.eventTime && ` at ${product.eventTime}`}
                    </p>
                  )}
                  {product.venue && (
                    <p style={{ margin: 0, color: 'var(--sf-text-2)' }}><strong>Venue:</strong> {product.venue}</p>
                  )}
                  {product.capacity && (
                    <p style={{ margin: 0, color: 'var(--sf-text-3)' }}>Capacity limit: {product.capacity} guests</p>
                  )}
                </div>
              )}

              {/* Rich Description */}
              {product.description && (
                <div className="product-rich-description" style={{
                  borderTop: '1px solid var(--sf-border)',
                  paddingTop: 16,
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  color: 'var(--sf-text-2)',
                  overflowWrap: 'break-word'
                }} dangerouslySetInnerHTML={{ __html: product.description }} />
              )}

              {/* Booking Slot Picker section */}
              {needsSlot && businessId && (
                <div style={{
                  background: 'var(--sf-surface)',
                  border: '1px solid var(--sf-border)',
                  borderRadius: 'var(--sf-radius, 20px)',
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem' }}>📅 Schedule Your Slot</p>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--sf-text-2)', marginBottom: 5 }}>Select Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      min={today}
                      onChange={handleDateChange}
                      className="sf-link-input"
                      style={{
                        width: '100%', padding: '10px 12px',
                        border: '1px solid var(--sf-border)',
                        borderRadius: 10, fontSize: '0.85rem',
                        background: 'var(--sf-bg)', color: 'var(--sf-text-1)',
                        outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {selectedDate && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--sf-text-2)', marginBottom: 8 }}>
                        Available times for {formattedDate}
                      </label>
                      {loadingSlots ? (
                        <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--sf-text-2)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}>
                            <path d="M21 12a9 9 0 11-6.219-8.56" />
                          </svg>
                          Loading slots…
                        </div>
                      ) : slots.length === 0 ? (
                        <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--sf-text-3)', fontSize: '0.8rem' }}>No slots available. Try another date.</div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                          {slots.map(slot => (
                            <button
                              key={slot.time}
                              disabled={!slot.available}
                              onClick={() => setSelectedSlot(slot.time)}
                              style={{
                                padding: '8px 4px',
                                borderRadius: 8,
                                border: selectedSlot === slot.time ? `2px solid ${primaryColor}` : '1px solid var(--sf-border)',
                                background: selectedSlot === slot.time ? primaryColor : 'var(--sf-bg)',
                                color: selectedSlot === slot.time ? textOnColor(primaryColor) : 'var(--sf-text-1)',
                                fontWeight: selectedSlot === slot.time ? 700 : 500,
                                fontSize: '0.8rem',
                                cursor: slot.available ? 'pointer' : 'not-allowed',
                                opacity: slot.available ? 1 : 0.35,
                                transition: '0.15s'
                              }}
                            >
                              {slot.time}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Customer Info Form */}
              <div style={{
                background: 'var(--sf-surface)',
                border: '1px solid var(--sf-border)',
                borderRadius: 'var(--sf-radius, 20px)',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem' }}>👤 Contact Details</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--sf-text-2)', marginBottom: 5 }}>Full name *</label>
                    <input
                      className="sf-link-input"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      style={{
                        width: '100%', padding: '11px 14px',
                        border: '1px solid var(--sf-border)',
                        borderRadius: 10, fontSize: '0.85rem',
                        background: 'var(--sf-bg)', color: 'var(--sf-text-1)',
                        outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--sf-text-2)', marginBottom: 5 }}>Email address *</label>
                    <input
                      className="sf-link-input"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      style={{
                        width: '100%', padding: '11px 14px',
                        border: '1px solid var(--sf-border)',
                        borderRadius: 10, fontSize: '0.85rem',
                        background: 'var(--sf-bg)', color: 'var(--sf-text-1)',
                        outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--sf-text-2)', marginBottom: 5 }}>Phone number *</label>
                    <input
                      className="sf-link-input"
                      type="tel"
                      placeholder="+234 800 000 0000"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      style={{
                        width: '100%', padding: '11px 14px',
                        border: '1px solid var(--sf-border)',
                        borderRadius: 10, fontSize: '0.85rem',
                        background: 'var(--sf-bg)', color: 'var(--sf-text-1)',
                        outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--sf-text-2)', marginBottom: 5 }}>Notes (optional)</label>
                    <textarea
                      className="sf-link-input"
                      placeholder="Special requests for this order"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={2}
                      style={{
                        width: '100%', padding: '11px 14px',
                        border: '1px solid var(--sf-border)',
                        borderRadius: 10, fontSize: '0.85rem',
                        background: 'var(--sf-bg)', color: 'var(--sf-text-1)',
                        outline: 'none', boxSizing: 'border-box',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Error Box */}
              {error && (
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(220,38,38,0.1)',
                  border: '1px solid rgba(220,38,38,0.35)',
                  borderRadius: 10,
                  color: '#DC2626',
                  fontSize: '0.8rem',
                  lineHeight: 1.4
                }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Checkout CTA Button */}
              <button
                onClick={handleCheckout}
                disabled={processing}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: 14,
                  border: 'none',
                  background: primaryColor,
                  color: textOnColor(primaryColor),
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: processing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: processing ? 0.75 : 1,
                  transition: 'background 0.2s, opacity 0.2s'
                }}
              >
                {processing ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}>
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                    Processing Payment…
                  </>
                ) : (
                  product.callToAction?.trim() || (needsSlot ? 'Confirm Booking & Pay Now' : 'Buy Now with Paystack')
                )}
              </button>

              <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--sf-text-3)', textAlign: 'center' }}>
                Secure checkout powered by Paystack
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // ──── RENDER STANDARD E-COMMERCE PRODUCT DETAIL PAGE ────
  if (errorTheme || !ThemeComponents) {
    if (errorTheme) {
      return <GenericProductPage product={product} storeSlug={storeSlug} currency={currency} />;
    }
    return <ProductPageSkeleton />;
  }

  const ProductPage = ThemeComponents.ProductPage;

  return (
    <>
      <div className={ThemeComponents.cssClass || ''}>
        <ProductPage product={product} storeSlug={storeSlug} currency={currency} />
      </div>
      {product.productType === 'service' && businessId && (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 5% 80px' }}>
          <BookingPicker
            businessId={businessId}
            storeSlug={storeSlug}
            productId={product.id}
            productName={product.displayName}
            price={product.price}
            currency={currency}
          />
        </div>
      )}
    </>
  );
}
