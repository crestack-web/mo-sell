'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/app/store/[storeSlug]/context/CartContext';
import type { ThemeProductPageProps } from '../types';
import { THEME_TOKENS, accentText, isDarkBg, type ThemeTokens } from './tokens';

function fmt(n: number, currency: string) {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : `${currency} `;
  return `${sym}${Number(n || 0).toLocaleString()}`;
}

function tokensFor(themeId: string): ThemeTokens {
  return THEME_TOKENS[themeId] || THEME_TOKENS.wave || THEME_TOKENS.atelier;
}

type P = ThemeProductPageProps & { themeId: string };

type Extra = {
  digitalSubtype?: string | null;
  bpm?: number | null;
  musicalKey?: string | null;
  genre?: string | null;
  trackDuration?: string | null;
  fileFormat?: string | null;
  licenseType?: string | null;
};

function useBuy(product: ThemeProductPageProps['product']) {
  const { addItem, updateQty, openCart } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const isOutOfStock = product.productType === 'physical' && product.stock === 0;
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
      : null;

  const handleAdd = () => {
    if (isOutOfStock) return;
    addItem({
      productId: product.id,
      displayName: product.displayName,
      price: product.price,
      imageUrl: product.images?.[0] ?? null,
      maxStock: product.productType === 'physical' ? product.stock : 999,
      productType: product.productType,
      metadata: {
        customerInfoFields: (product.customerInfoFields ?? ['name', 'email', 'phone', 'address']).join(','),
      },
    });
    updateQty(product.id, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    handleAdd();
    openCart();
  };

  return { activeImg, setActiveImg, qty, setQty, added, isOutOfStock, discount, handleAdd, handleBuyNow };
}

export function ProductPageWithTheme({ product, storeSlug, currency, themeId }: P) {
  const t = tokensFor(themeId);
  const state = useBuy(product);
  const extra = product as ThemeProductPageProps['product'] & Extra;
  const subtype = String(extra.digitalSubtype || '').toLowerCase();
  const isAudio =
    product.productType === 'digital' &&
    (subtype === 'audio' || subtype === 'beat' || subtype === 'music');

  const images = Array.isArray(product.images) ? product.images : [];
  const activeSrc = images[state.activeImg] || images[0];
  const maxQty = product.productType === 'physical' ? Math.max(1, product.stock || 1) : 99;

  const chips: string[] = [];
  if (isAudio) {
    if (extra.bpm) chips.push(`${extra.bpm} BPM`);
    if (extra.musicalKey) chips.push(String(extra.musicalKey));
    if (extra.genre) chips.push(String(extra.genre));
    if (extra.trackDuration) chips.push(String(extra.trackDuration));
    if (extra.fileFormat) chips.push(String(extra.fileFormat).toUpperCase());
    if (extra.licenseType) chips.push(String(extra.licenseType));
  }

  const typeLabel = isAudio
    ? 'Beat · Track · Audio'
    : product.productType === 'service'
      ? 'Service'
      : product.productType === 'digital'
        ? subtype || 'Digital'
        : product.category || 'Product';

  const description = (product.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  return (
    <div
      style={{
        maxWidth: isAudio ? 1100 : 1200,
        margin: '0 auto',
        padding: '28px 5% 96px',
        background: t.bg,
        color: t.text,
        fontFamily: t.fontBody,
        minHeight: '70vh',
      }}
    >
      <nav
        style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: t.subtext,
          marginBottom: 24,
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
        }}
      >
        <Link href={`/store/${storeSlug}`} style={{ color: t.accent, textDecoration: 'none' }}>
          Store
        </Link>
        <span>/</span>
        {product.category ? (
          <>
            <span>{product.category}</span>
            <span>/</span>
          </>
        ) : null}
        <span style={{ color: t.text }}>{product.displayName}</span>
      </nav>

      <div
        className="sf-product-page-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
          gap: 40,
          alignItems: 'start',
        }}
      >
        <div>
          <div
            style={{
              borderRadius: Math.max(t.radius, isAudio ? 16 : t.radius),
              overflow: 'hidden',
              border: `1px solid ${t.border}`,
              background: t.surface,
              aspectRatio: '1 / 1',
              position: 'relative',
            }}
          >
            {activeSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeSrc}
                alt={product.displayName}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem',
                  opacity: 0.35,
                }}
              >
                {isAudio ? '🎵' : '📦'}
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="sf-product-thumbs" style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto' }}>
              {images.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  onClick={() => state.setActiveImg(i)}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: i === state.activeImg ? `2px solid ${t.accent}` : `1px solid ${t.border}`,
                    padding: 0,
                    cursor: 'pointer',
                    background: t.surface,
                    flexShrink: 0,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p
            style={{
              margin: '0 0 10px',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: isAudio ? t.accent2 : t.subtext,
            }}
          >
            {typeLabel}
          </p>

          <h1
            style={{
              margin: '0 0 12px',
              fontFamily: t.fontDisplay,
              fontSize: 'clamp(1.6rem, 3.2vw, 2.2rem)',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              lineHeight: 1.15,
              color: t.text,
            }}
          >
            {product.displayName}
          </h1>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.55rem', fontWeight: 800 }}>{fmt(product.price, currency)}</span>
            {state.discount && product.compareAtPrice ? (
              <>
                <span style={{ color: t.subtext, textDecoration: 'line-through' }}>
                  {fmt(product.compareAtPrice, currency)}
                </span>
                <span
                  style={{
                    background: t.accent,
                    color: accentText(t),
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: 999,
                  }}
                >
                  -{state.discount}%
                </span>
              </>
            ) : null}
          </div>

          {chips.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {chips.map((c) => (
                <span
                  key={c}
                  style={{
                    display: 'inline-flex',
                    padding: '5px 10px',
                    borderRadius: 999,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: t.text,
                    background: isDarkBg(t) ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    border: `1px solid ${t.border}`,
                  }}
                >
                  {c}
                </span>
              ))}
            </div>
          )}

          {isAudio && (
            <div
              style={{
                borderRadius: Math.max(t.radius, 14),
                border: `1px solid ${t.border}`,
                background: t.surface,
                padding: '14px 16px',
                marginBottom: 18,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: t.text }}>Preview</span>
                <span style={{ fontSize: '0.72rem', color: t.subtext }}>
                  {product.digitalFileUrl ? 'Stream before you buy' : 'No preview file yet'}
                </span>
              </div>
              {product.digitalFileUrl ? (
                <audio controls preload="metadata" src={product.digitalFileUrl} style={{ width: '100%', height: 40 }}>
                  Your browser does not support audio playback.
                </audio>
              ) : (
                <p style={{ margin: 0, fontSize: '0.85rem', color: t.subtext }}>
                  The producer has not attached a playable preview for this track yet.
                </p>
              )}
            </div>
          )}

          {product.productType === 'physical' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 14,
                fontSize: '0.85rem',
                color: t.subtext,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: state.isOutOfStock ? '#EF4444' : product.stock <= 5 ? '#F59E0B' : '#22C55E',
                  display: 'inline-block',
                }}
              />
              {state.isOutOfStock
                ? 'Out of stock'
                : product.stock <= 5
                  ? `Only ${product.stock} left`
                  : 'In stock'}
            </div>
          )}

          {description ? (
            <p style={{ fontSize: '0.95rem', lineHeight: 1.65, color: t.subtext, marginBottom: 22 }}>
              {description}
            </p>
          ) : null}

          {product.deliveryNote ? (
            <p style={{ fontSize: '0.85rem', color: t.subtext, marginBottom: 16 }}>{product.deliveryNote}</p>
          ) : null}

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {product.productType !== 'service' && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  border: `1px solid ${t.border}`,
                  borderRadius: t.radius,
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => state.setQty(Math.max(1, state.qty - 1))}
                  style={{
                    width: 40,
                    height: 40,
                    border: 'none',
                    background: t.surface,
                    color: t.text,
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                  }}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span style={{ minWidth: 36, textAlign: 'center', fontWeight: 700, color: t.text }}>
                  {state.qty}
                </span>
                <button
                  type="button"
                  onClick={() => state.setQty(Math.min(maxQty, state.qty + 1))}
                  style={{
                    width: 40,
                    height: 40,
                    border: 'none',
                    background: t.surface,
                    color: t.text,
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                  }}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={state.handleAdd}
              disabled={state.isOutOfStock}
              style={{
                flex: 1,
                minHeight: 48,
                borderRadius: t.radius,
                border: 'none',
                background: state.isOutOfStock
                  ? t.border
                  : `linear-gradient(135deg, ${t.accent} 0%, ${t.accent2} 100%)`,
                color: state.isOutOfStock ? t.subtext : accentText(t),
                fontWeight: 800,
                fontSize: '0.92rem',
                cursor: state.isOutOfStock ? 'not-allowed' : 'pointer',
                padding: '0 18px',
              }}
            >
              {state.added ? 'Added' : state.isOutOfStock ? 'Sold out' : 'Add to cart'}
            </button>

            {isAudio && (
              <button
                type="button"
                onClick={state.handleBuyNow}
                disabled={state.isOutOfStock}
                style={{
                  minHeight: 48,
                  borderRadius: t.radius,
                  border: `1px solid ${t.border}`,
                  background: 'transparent',
                  color: t.text,
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: state.isOutOfStock ? 'not-allowed' : 'pointer',
                  padding: '0 18px',
                }}
              >
                Buy license
              </button>
            )}
          </div>

          {isAudio && (
            <p style={{ margin: '12px 0 0', fontSize: '0.78rem', color: t.subtext }}>
              Instant delivery after payment. License terms apply to commercial use.
            </p>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 820px) {
          .sf-product-page-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </div>
  );
}
