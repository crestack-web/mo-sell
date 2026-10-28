'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/app/store/[storeSlug]/context/CartContext';
import type { ThemeProductPageProps } from '../types';
import { THEME_TOKENS, accentText, type ThemeTokens } from './tokens';
import { WaveAudioPlayer } from './WaveAudioPlayer';

function fmt(n: number, currency: string) {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
  return `${sym}${Number(n || 0).toLocaleString()}`;
}

type P = ThemeProductPageProps & { themeId: string };

function getTokens(themeId: string): ThemeTokens {
  return THEME_TOKENS[themeId] || THEME_TOKENS.atelier;
}

export function ProductPageWithTheme({ product, storeSlug, currency, themeId }: P) {
  const t = getTokens(themeId);
  const { addItem, openCart } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const isOutOfStock = product.productType === 'physical' && product.stock === 0;
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
      : null;
  const maxQty = product.productType === 'physical' ? Math.max(product.stock, 1) : 99;
  const images = product.images || [];
  const subtype = String((product as { digitalSubtype?: string }).digitalSubtype || '').toLowerCase();
  const isAudio =
    product.productType === 'digital' &&
    (subtype === 'audio' || subtype === 'beat' || subtype === 'music');

  const handleAdd = () => {
    if (isOutOfStock) return;
    for (let i = 0; i < qty; i++) {
      addItem({
        productId: product.id,
        displayName: product.displayName,
        price: product.price,
        imageUrl: images[0] ?? null,
        maxStock: product.productType === 'physical' ? product.stock : 999,
        productType: product.productType,
        metadata: {
          customerInfoFields: (product.customerInfoFields ?? ['name', 'email', 'phone', 'address']).join(','),
        },
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const extra = product as {
    bpm?: number | null;
    musicalKey?: string | null;
    genre?: string | null;
    trackDuration?: string | null;
  };

  return (
    <div
      className="sf-product-page"
      style={{
        width: '100%',
        maxWidth: 1200,
        margin: '0 auto',
        padding: '24px clamp(16px, 5%, 32px) 80px',
        background: t.bg,
        color: t.text,
        fontFamily: t.fontBody,
        minHeight: '70vh',
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
    >
      <nav
        style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: t.subtext,
          marginBottom: 28,
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          alignItems: 'center',
          minWidth: 0,
        }}
      >
        <Link href={`/store/${storeSlug}`} style={{ color: t.accent, textDecoration: 'none', flexShrink: 0 }}>
          Store
        </Link>
        <span style={{ flexShrink: 0 }}>/</span>
        {product.category ? (
          <>
            <span style={{ maxWidth: '40%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {product.category}
            </span>
            <span style={{ flexShrink: 0 }}>/</span>
          </>
        ) : null}
        <span
          style={{
            color: t.text,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {product.displayName}
        </span>
      </nav>

      <div
        className="sf-product-page-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 'clamp(20px, 4vw, 48px)',
          alignItems: 'start',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div className="sf-product-page-gallery" style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <div
            style={{
              width: '100%',
              maxWidth: '100%',
              aspectRatio: '1 / 1',
              background: t.surface,
              borderRadius: t.radius,
              overflow: 'hidden',
              border: `1px solid ${t.border}`,
            }}
          >
            {images[activeImg] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={images[activeImg]}
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
                  opacity: 0.3,
                  fontSize: '2rem',
                }}
              >
                {isAudio ? 'Audio' : 'Item'}
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div
              className="sf-product-thumbs"
              style={{
                display: 'flex',
                gap: 8,
                marginTop: 12,
                overflowX: 'auto',
                overflowY: 'hidden',
                WebkitOverflowScrolling: 'touch',
                maxWidth: '100%',
                paddingBottom: 4,
              }}
            >
              {images.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  style={{
                    width: 64,
                    height: 64,
                    padding: 0,
                    border: i === activeImg ? `2px solid ${t.accent}` : `1px solid ${t.border}`,
                    borderRadius: 8,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    background: t.surface,
                    flexShrink: 0,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="sf-product-page-info" style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <p
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: isAudio ? t.accent2 : t.subtext,
              margin: '0 0 8px',
            }}
          >
            {isAudio
              ? 'Audio'
              : product.productType === 'digital'
                ? 'Digital'
                : product.productType === 'service'
                  ? 'Service'
                  : 'Product'}
          </p>
          <h1
            style={{
              fontFamily: t.fontDisplay,
              fontSize: 'clamp(1.35rem, 3vw, 2rem)',
              fontWeight: 800,
              margin: '0 0 12px',
              color: t.text,
              lineHeight: 1.2,
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
            }}
          >
            {product.displayName}
          </h1>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{fmt(product.price, currency)}</span>
            {discount && product.compareAtPrice ? (
              <>
                <span style={{ color: t.subtext, textDecoration: 'line-through' }}>
                  {fmt(product.compareAtPrice, currency)}
                </span>
                <span
                  style={{
                    background: t.accent,
                    color: accentText(t),
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                  }}
                >
                  -{discount}%
                </span>
              </>
            ) : null}
          </div>

          {isAudio && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, maxWidth: '100%' }}>
              {extra.bpm ? (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: `1px solid ${t.border}`,
                  }}
                >
                  {extra.bpm} BPM
                </span>
              ) : null}
              {extra.musicalKey ? (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: `1px solid ${t.border}`,
                  }}
                >
                  {extra.musicalKey}
                </span>
              ) : null}
              {extra.genre ? (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: `1px solid ${t.border}`,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {extra.genre}
                </span>
              ) : null}
              {extra.trackDuration ? (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: `1px solid ${t.border}`,
                  }}
                >
                  {extra.trackDuration}
                </span>
              ) : null}
            </div>
          )}

          {isAudio && product.digitalFileUrl ? (
            <div style={{ marginBottom: 16, width: '100%', maxWidth: '100%', minWidth: 0 }}>
              <WaveAudioPlayer
                src={product.digitalFileUrl}
                title={product.displayName}
                t={t}
                accentLabel={themeId === 'raman' || themeId === 'wave' ? 'Beat preview' : 'Audio preview'}
              />
            </div>
          ) : isAudio ? (
            <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: t.subtext }}>
              Preview file not attached yet.
            </p>
          ) : null}

          {product.description ? (
            <p
              style={{
                fontSize: '0.95rem',
                lineHeight: 1.65,
                color: t.subtext,
                marginBottom: 20,
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
              }}
            >
              {product.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
            </p>
          ) : null}

          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'stretch',
              flexWrap: 'wrap',
              width: '100%',
              maxWidth: '100%',
            }}
          >
            {product.productType !== 'service' && (
              <div
                style={{
                  display: 'inline-flex',
                  border: `1px solid ${t.border}`,
                  borderRadius: t.radius,
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  style={{
                    width: 40,
                    height: 44,
                    border: 'none',
                    background: t.surface,
                    color: t.text,
                    cursor: 'pointer',
                  }}
                >
                  -
                </button>
                <span
                  style={{
                    minWidth: 36,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty(Math.min(maxQty, qty + 1))}
                  style={{
                    width: 40,
                    height: 44,
                    border: 'none',
                    background: t.surface,
                    color: t.text,
                    cursor: 'pointer',
                  }}
                >
                  +
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={handleAdd}
              disabled={isOutOfStock}
              style={{
                flex: '1 1 140px',
                minWidth: 0,
                minHeight: 44,
                border: 'none',
                borderRadius: t.radius,
                background: isOutOfStock ? t.border : t.accent,
                color: isOutOfStock ? t.subtext : accentText(t),
                fontWeight: 800,
                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                padding: '0 16px',
              }}
            >
              {added ? 'Added' : isOutOfStock ? 'Sold out' : 'Add to cart'}
            </button>
            {isAudio && (
              <button
                type="button"
                onClick={() => {
                  handleAdd();
                  openCart();
                }}
                disabled={isOutOfStock}
                style={{
                  flex: '1 1 120px',
                  minWidth: 0,
                  minHeight: 44,
                  padding: '0 16px',
                  border: `1px solid ${t.border}`,
                  borderRadius: t.radius,
                  background: 'transparent',
                  color: t.text,
                  fontWeight: 700,
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                }}
              >
                Buy license
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .sf-product-page, .sf-product-page * { box-sizing: border-box; }
        @media (max-width: 768px) {
          .sf-product-page-grid {
            grid-template-columns: minmax(0, 1fr) !important;
            gap: 24px !important;
          }
        }
      `}</style>
    </div>
  );
}
