'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import type { ThemeComponents, ThemeProductPageProps } from '@/themes/types';
import { BookingPicker } from './BookingPicker';
import { getLinkBioProductPage } from '../../components/linkBioProductPages';
import { PLATFORM_PAYSTACK_PUBLIC_KEY, resolvePaystackPublicKey } from '@/lib/paystack';

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
  customerInfoFields?: string[];
}

interface Props {
  product: Product;
  storeSlug: string;
  currency: string;
  theme: string;
  businessId?: string;
  paystackPublicKey?: string;
  primaryColor?: string;
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

const LINK_STYLE_THEMES = ['ankara', 'midnight', 'harmattan', 'neon', 'sunset', 'mono', 'blush', 'rose', 'pearl', 'cherry', 'quiet', 'concrete', 'chrome'];

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

export function ProductDetailClient({ product, storeSlug, currency, theme, businessId, paystackPublicKey: paystackKeyProp, primaryColor: primaryColorProp }: Props) {
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

  // Which customer fields this product wants collected (email is always required)
  const infoFields = product.customerInfoFields && product.customerInfoFields.length > 0
    ? product.customerInfoFields
    : ['name', 'email', 'phone', 'address'];
  const wantsName = infoFields.includes('name');
  const wantsPhone = infoFields.includes('phone');

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
    if (wantsName && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (wantsPhone && !phone.trim()) {
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
      const activeKey = resolvePaystackPublicKey(paystackKeyProp, storeConfig?.paystackPublicKey, process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY, PLATFORM_PAYSTACK_PUBLIC_KEY);
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
        callback: (response: { reference: string }) => {
          void (async () => {
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
                document.cookie = `customer_email=${encodeURIComponent(email.trim())}; path=/; max-age=2592000`;
                window.location.href = `/store/${storeSlug}/order/${data.orderId}`;
                return;
              } else {
                setError(data.error || 'Payment confirmation failed. Contact support with your payment reference.');
              }
            } catch {
              setError('Payment confirmation failed. Contact support with your payment reference.');
            }
            setProcessing(false);
          })();
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

  // ──── RENDER LINK-BIO PRODUCT PAGE (theme-specific) ────
  if (isLinkStyle) {
    const LinkBioProductPage = getLinkBioProductPage(theme);
    const primaryColor = storeConfig?.primaryColor || primaryColorProp || '#6366F1';
    return (
      <LinkBioProductPage
        product={product}
        storeSlug={storeSlug}
        storeName={storeConfig?.storeName}
        primaryColor={primaryColor}
        currency={currency}
        discount={discount}
        formattedDate={formattedDate}
        success={success}
        orderId={orderId}
        error={error}
        processing={processing}
        needsSlot={needsSlot}
        businessId={businessId}
        today={today}
        selectedDate={selectedDate}
        selectedSlot={selectedSlot}
        slots={slots}
        loadingSlots={loadingSlots}
        wantsName={wantsName}
        wantsPhone={wantsPhone}
        name={name}
        email={email}
        phone={phone}
        notes={notes}
        onNameChange={setName}
        onEmailChange={setEmail}
        onPhoneChange={setPhone}
        onNotesChange={setNotes}
        onDateChange={handleDateChange}
        onSelectSlot={setSelectedSlot}
        onCheckout={handleCheckout}
        onBack={() => {
          if (typeof window !== 'undefined') window.location.href = `/${storeSlug}`;
        }}
      />
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
