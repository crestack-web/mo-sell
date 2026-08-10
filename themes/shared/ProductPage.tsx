'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/app/[storeSlug]/context/CartContext';
import type { ThemeProductPageProps } from '../types';
import { THEME_TOKENS, accentText, type ThemeTokens } from './tokens';

function fmt(n: number, currency: string) {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
  return `${sym}${n.toLocaleString()}`;
}

const SHIPPING_NOTE = 'Ships in 2-3 business days. Free returns within 30 days.';

export function ProductPageWithTheme({ themeId, product, storeSlug, currency }: ThemeProductPageProps & { themeId: string }) {
  const { addItem } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const t = THEME_TOKENS[themeId] as ThemeTokens;
  const radius = t.radius === 0 ? 0 : 999;
  const isOutOfStock = product.productType === 'physical' && product.stock === 0;
  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round((1 - product.price / product.compareAtPrice) * 100) : null;

  const handleAdd = () => {
    if (isOutOfStock) return;
    addItem({
      productId: product.id, displayName: product.displayName,
      price: product.price, imageUrl: product.images[0] ?? null,
      maxStock: product.productType === 'physical' ? product.stock : 999,
      productType: product.productType,
      metadata: { customerInfoFields: (product.customerInfoFields ?? ['name', 'email', 'phone', 'address']).join(',') },
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 5% 80px' }}>
      <nav style={{ fontSize: '0.75rem', color: t.subtext, marginBottom: 32, display: 'flex', gap: 8, fontFamily: t.fontBody }}>
        <Link href={`/store/${storeSlug}`} style={{ color: t.accent, textDecoration: 'none' }}>Store</Link>
        <span>/</span>
        <span>{product.category || 'Shop'}</span>
        <span>/</span>
        <span style={{ color: t.subtext }}>{product.displayName}</span>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 48, alignItems: 'start' }}>
        {/* Gallery */}
        <div>
          <div style={{ width: '100%', aspectRatio: '3/4', overflow: 'hidden', background: t.surface, border: `1px solid ${t.border}`, borderRadius: radius === 999 ? 24 : t.radius, position: 'relative' }}>
            {product.images[activeImg] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[activeImg]} alt={product.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: t.accent, opacity: 0.85 }} />
            )}
            {discount && (
              <span style={{ position: 'absolute', top: 14, left: 14, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', padding: '4px 12px', background: t.accent, color: accentText(t), borderRadius: radius === 999 ? 999 : 4 }}>
                -{discount}%
              </span>
            )}
          </div>
          {product.images.length > 1 && (
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  style={{ flex: 1, height: 72, padding: 0, border: i === activeImg ? `2px solid ${t.accent}` : `1px solid ${t.border}`, cursor: 'pointer', borderRadius: t.radius, overflow: 'hidden', background: t.surface }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 8 }}>
          <div>
            <p style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: t.accent, margin: 0, fontFamily: t.fontBody }}>
              {product.category || 'Shop'}
            </p>
            <h1 style={{ fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 'clamp(1.7rem, 3vw, 2.4rem)', color: t.text, margin: '6px 0 0', lineHeight: 1.2 }}>
              {product.displayName}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: t.accent, fontFamily: t.fontBody }}>{fmt(product.price, currency)}</span>
            {discount && (
              <span style={{ fontSize: '1rem', color: t.border, textDecoration: 'line-through' }}>{fmt(product.compareAtPrice!, currency)}</span>
            )}
          </div>

          <div style={{ height: 1, background: t.border }} />

          {product.description && (
            <div className="product-rich-description" style={{ fontSize: '0.95rem', color: t.subtext, lineHeight: 1.75, overflowWrap: 'break-word', fontFamily: t.fontBody }} dangerouslySetInnerHTML={{ __html: product.description }} />
          )}

          {product.productType === 'physical' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: t.subtext }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: isOutOfStock ? '#EF4444' : product.stock <= 5 ? '#F59E0B' : t.accent, display: 'inline-block' }} />
              {isOutOfStock ? 'Sold out' : product.stock <= 5 ? `Only ${product.stock} remaining` : 'In stock'}
            </div>
          )}

          {product.productType === 'digital' && (
            <div style={{ padding: '14px 18px', background: t.surface, border: `1px solid ${t.border}`, borderRadius: t.radius, fontSize: '0.85rem', color: t.subtext, fontFamily: t.fontBody }}>
              Instant digital delivery after purchase
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${t.border}`, borderRadius: radius, overflow: 'hidden' }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ background: 'none', border: 'none', padding: '12px 16px', cursor: 'pointer', color: t.text, fontSize: 16 }}>−</button>
              <span style={{ fontSize: '0.9rem', color: t.text, minWidth: 24, textAlign: 'center' }}>{qty}</span>
              <button onClick={() => setQty(qty + 1)} style={{ background: 'none', border: 'none', padding: '12px 16px', cursor: 'pointer', color: t.text, fontSize: 16 }}>+</button>
            </div>
            <button onClick={handleAdd} disabled={isOutOfStock}
              style={{
                flex: 1, padding: '14px 24px',
                background: isOutOfStock ? 'transparent' : added ? '#10B981' : t.accent,
                color: isOutOfStock ? t.subtext : accentText(t),
                border: isOutOfStock ? `1px solid ${t.border}` : 'none',
                borderRadius: radius,
                fontSize: '0.82rem', fontWeight: 700,
                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}>
              {isOutOfStock ? 'Sold Out' : added ? 'Added to bag' : `Add to Bag — ${fmt(product.price, currency)}`}
            </button>
          </div>

          {product.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {product.tags.map(tag => (
                <span key={tag} style={{ fontSize: '0.7rem', letterSpacing: '0.06em', padding: '4px 12px', border: `1px solid ${t.border}`, color: t.subtext, textTransform: 'uppercase', fontFamily: t.fontBody }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
