'use client';

import React, { useState, useCallback } from 'react';
import { X, ShoppingCart, CheckCircle, Loader2 } from 'lucide-react';
import type { ProductCardData } from '@/themes/types';
import { PLATFORM_PAYSTACK_PUBLIC_KEY } from '@/lib/paystack';

interface ProductModalProps {
  product: ProductCardData & { description?: string; digitalFileUrl?: string | null; callToAction?: string | null };
  storeSlug: string;
  currency: string;
  primaryColor: string;
  paystackPublicKey: string;
  onClose: () => void;
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

export function ProductModal({ product, storeSlug, currency, primaryColor, paystackPublicKey, onClose }: ProductModalProps) {
  const [email, setEmail] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const defaultEmail = typeof window !== 'undefined'
    ? (document.cookie.match(/(?:^|;\s*)customer_email=([^;]*)/)?.[1] ?? '')
    : '';

  const handleBuy = useCallback(async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter your email');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const activeKey = paystackPublicKey || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || PLATFORM_PAYSTACK_PUBLIC_KEY;
      if (!activeKey) {
        setError('Payment is temporarily unavailable. Please try again later.');
        setProcessing(false);
        return;
      }

      setShowEmailForm(false);
      await loadPaystackScript();

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
                }),
              });
              const data = await res.json();
              if (res.ok && data.orderId) {
                setSuccess(true);
              } else {
                setError(data.error || 'Order confirmation failed. Contact support with your payment reference.');
                setShowEmailForm(true);
              }
            } catch {
              setError('Order confirmation failed. Contact support with your payment reference.');
              setShowEmailForm(true);
            }
            setProcessing(false);
            document.cookie = `customer_email=${encodeURIComponent(email.trim())}; path=/; max-age=2592000`;
          })();
        },
        onClose: () => {
          setShowEmailForm(true);
          setProcessing(false);
        },
      });

      paystack.openIframe();
    } catch {
      setError('Payment failed. Please try again.');
      setProcessing(false);
      setShowEmailForm(true);
    }
  }, [email, product, storeSlug, paystackPublicKey]);

  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round((1 - product.price / product.compareAtPrice) * 100) : null;

  return (
    <>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 20, maxWidth: 400, width: '100%',
        overflow: 'hidden', position: 'relative',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }} onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 12, right: 12, zIndex: 10,
            width: 32, height: 32, borderRadius: '50%',
            border: 'none', background: 'rgba(0,0,0,0.5)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        {success ? (
          <div style={{ padding: '60px 32px', textAlign: 'center' }}>
            <CheckCircle size={64} color="#10B981" style={{ marginBottom: 16 }} />
            <h2 style={{ margin: '0 0 8px', fontSize: '1.3rem', fontWeight: 800, color: '#111' }}>
              Payment Successful!
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {product.productType === 'digital'
                ? 'Your download link has been sent to your email.'
                : 'Your order has been received. We\'ll notify you when it ships.'}
            </p>
          </div>
        ) : (
          <>
            {product.images?.[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[0]}
                alt={product.displayName}
                style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }}
              />
            )}

            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#111' }}>
                  {product.displayName}
                </h2>
                {discount && (
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px',
                    borderRadius: 20, background: '#FEE2E2', color: '#DC2626',
                  }}>
                    -{discount}%
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111' }}>
                  {currency === 'NGN' ? '₦' : '$'}{product.price.toLocaleString()}
                </span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                    {currency === 'NGN' ? '₦' : '$'}{product.compareAtPrice.toLocaleString()}
                  </span>
                )}
              </div>

              {product.description && (
                <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6 }}>
                  {product.description}
                </p>
              )}

              {showEmailForm && (
                <div style={{ marginBottom: 12 }}>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email || defaultEmail}
                    onChange={e => setEmail(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: 12,
                      border: '1px solid #e2e8f0', fontSize: '0.9rem',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                    autoFocus
                  />
                </div>
              )}

              {error && (
                <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: '#DC2626' }}>
                  {error}
                </p>
              )}

              <button
                onClick={handleBuy}
                disabled={processing}
                style={{
                  width: '100%', padding: '14px', borderRadius: 12,
                  border: 'none', background: primaryColor || '#6366F1',
                  color: '#fff', fontSize: '0.95rem', fontWeight: 700,
                  cursor: processing ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: processing ? 0.7 : 1,
                }}
              >
                {processing ? (
                  <><Loader2 size={18} style={{ animation: 'spin 0.7s linear infinite' }} /> Processing...</>
                ) : (
                  <><ShoppingCart size={18} /> {product.callToAction?.trim() || 'Buy Now with Paystack'}</>
                )}
              </button>

              <p style={{ margin: '10px 0 0', fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center' }}>
                Secure payment by Paystack
              </p>
            </div>
          </>
        )}
      </div>
    </div>
    </>
  );
}
