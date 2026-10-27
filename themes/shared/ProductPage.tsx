'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/app/store/[storeSlug]/context/CartContext';
import type { ThemeProductPageProps } from '../types';
import { THEME_TOKENS, accentText, isDarkBg, type ThemeTokens } from './tokens';

function fmt(n: number, currency: string) {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : `${currency} `;
  return `${sym}${Number(n || 0).toLocaleString()}`;
}

type P = ThemeProductPageProps & { themeId: string };

type ProductExtra = ThemeProductPageProps['product'] & {
  digitalSubtype?: string | null;
  bpm?: number | null;
  musicalKey?: string | null;
  genre?: string | null;
  trackDuration?: string | null;
  videoDuration?: string | null;
  resolution?: string | null;
  fileFormat?: string | null;
  licenseType?: string | null;
  author?: string | null;
  pageCount?: number | null;
};

function useProductState(product: ThemeProductPageProps['product']) {
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
      imageUrl: product.images[0] ?? null,
      maxStock: product.productType === 'physical' ? product.stock : 999,
      productType: product.productType,
      metadata: {
        customerInfoFields: (product.customerInfoFields ?? ['name', 'email', 'phone', 'address']).join(','),
      },
    });
    updateQty(product.id, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    handleAdd();
    try {
      openCart?.();
    } catch {
      /* cart drawer optional */
    }
  };

  return { activeImg, setActiveImg, qty, setQty, added, isOutOfStock, discount, handleAdd, handleBuyNow };
}

function GalleryImage({
  src,
  alt,
  style,
  placeholder,
}: {
  src?: string;
  alt: string;
  style: React.CSSProperties;
  placeholder?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} style={style} />
    );
  }
  return (
    <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: '3rem', opacity: 0.35 }}>{placeholder || '📦'}</span>
    </div>
  );
}

function MetaChip({ label, t }: { label: string; t: ThemeTokens }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
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
      {label}
    </span>
  );
}

function QtyControl({
  qty,
  setQty,
  max,
  t,
}: {
  qty: number;
  setQty: (n: number) => void;
  max: number;
  t: ThemeTokens;
}) {
  return (
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
        onClick={() => setQty(Math.max(1, qty - 1))}
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
        −
      </button>
      <span
        style={{
          minWidth: 36,
          textAlign: 'center',
          fontWeight: 700,
          color: t.text,
          fontSize: '0.95rem',
        }}
      >
        {qty}
      </span>
      <button
        type="button"
        onClick={() => setQty(Math.min(max, qty + 1))}
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
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  t,
  variant = 'primary',
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  t: ThemeTokens;
  variant?: 'primary' | 'ghost';
}) {
  const primary = variant === 'primary';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        minHeight: 48,
        borderRadius: t.radius,
        border: primary ? 'none' : `1px solid ${t.border}`,
        background: disabled
          ? t.border
          : primary
            ? `linear-gradient(135deg, ${t.accent} 0%, ${t.accent2} 100%)`
            : 'transparent',
        color: disabled ? t.subtext : primary ? accentText(t) : t.text,
        fontWeight: 800,
        fontSize: '0.92rem',
        letterSpacing: '0.02em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        padding: '0 18px',
      }}
    >
      {children}
    </button>
  );
}

function AudioProductPage({ product, storeSlug, currency, themeId }: P) {
  const t = (THEME_TOKENS[themeId] || THEME_TOKENS.wave) as ThemeTokens;
  const state = useProductState(product);
  const p = product as ProductExtra;
  const images = product.images?.length ? product.images : [];
  const cover = images[state.activeImg] || images[0];
  const previewUrl = product.digitalFileUrl || null;

  const chips = useMemo(() => {
    const list: string[] = [];
    if (p.bpm) list.push(`${p.bpm} BPM`);
    if (p.musicalKey) list.push(String(p.musicalKey));
    if (p.genre) list.push(String(p.genre));
    if (p.trackDuration) list.push(String(p.trackDuration));
    if (p.fileFormat) list.push(String(p.fileFormat).toUpperCase());
    if (p.licenseType) list.push(String(p.licenseType));
    return list;
  }, [p.bpm, p.musicalKey, p.genre, p.trackDuration, p.fileFormat, p.licenseType]);

  return (
    <div
      style={{
        maxWidth: 1100,
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
        <span>Music</span>
        <span>/</span>
        <span style={{ color: t.text }}>{product.displayName}</span>
      </nav>

      <div
        className="sf-product-page-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr)',
          gap: 40,
          alignItems: 'start',
        }}
      >
        {/* Cover + waveform panel */}
        <div>
          <div
            style={{
              borderRadius: Math.max(t.radius, 16),
              overflow: 'hidden',
              border: `1px solid ${t.border}`,
              background: t.surface,
              aspectRatio: '1 / 1',
              position: 'relative',
            }}
          >
            <GalleryImage
              src={cover}
              alt={product.displayName}
              placeholder="🎵"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 'auto 0 0 0',
                padding: '18px 18px 16px',
                background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.72))',
              }}
            >
              <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 36, marginBottom: 8 }}>
                {Array.from({ length: 28 }).map((_, i) => (
                  <span
                    key={i}
                    style={{
                      flex: 1,
                      borderRadius: 2,
                      background: i % 3 === 0 ? t.accent2 : t.accent,
                      opacity: 0.35 + ((i * 17) % 50) / 100,
                      height: `${30 + ((i * 37) % 70)}%`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {images.length > 1 && (
            <div className="sf-product-thumbs" style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto' }}>
              {images.map((src, i) => (
                <button
                  key={src + i}
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

        {/* Details */}
        <div>
          <p
            style={{
              margin: '0 0 10px',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: t.accent2,
            }}
          >
            Beat · Track · Audio
          </p>
          <h1
            style={{
              margin: '0 0 12px',
              fontFamily: t.fontDisplay,
              fontSize: 'clamp(1.7rem, 3.5vw, 2.35rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              color: t.text,
            }}
          >
            {product.displayName}
          </h1>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: t.text }}>{fmt(product.price, currency)}</span>
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
                  −{state.discount}%
                </span>
              </>
            ) : null}
          </div>

          {chips.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
              {chips.map((c) => (
                <MetaChip key={c} label={c} t={t} />
              ))}
            </div>
          )}

          {/* Preview player */}
          <div
            style={{
              borderRadius: Math.max(t.radius, 14),
              border: `1px solid ${t.border}`,
              background: t.surface,
              padding: '14px 16px',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: t.text }}>Preview</span>
              <span style={{ fontSize: '0.72rem', color: t.subtext }}>
                {previewUrl ? 'Stream a sample before you buy' : 'Preview not uploaded yet'}
              </span>
            </div>
            {previewUrl ? (
              <audio
                controls
                preload="metadata"
                src={previewUrl}
                style={{ width: '100%', height: 40 }}
              >
                Your browser does not support audio playback.
              </audio>
            ) : (
              <div style={{ fontSize: '0.85rem', color: t.subtext, padding: '8px 0' }}>
                The producer has not attached a playable preview for this track yet.
              </div>
            )}
          </div>

          {product.description ? (
            <div
              style={{
                fontSize: '0.95rem',
                lineHeight: 1.65,
                color: t.subtext,
                marginBottom: 22,
                whiteSpace: 'pre-wrap',
              }}
            >
              {product.description.replace(/<[^>]+>/g, ' ').trim()}
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
            {product.productType === 'physical' && (
              <QtyControl
                qty={state.qty}
                setQty={state.setQty}
                max={Math.max(1, product.stock || 1)}
                t={t}
              />
            )}
            <PrimaryButton onClick={state.handleAdd} disabled={state.isOutOfStock} t={t}>
              {state.added ? 'Added ✓' : state.isOutOfStock ? 'Sold out' : 'Add to cart'}
            </PrimaryButton>
            <PrimaryButton onClick={state.handleBuyNow} disabled={state.isOutOfStock} t={t} variant="ghost">
              Buy license
            </PrimaryButton>
          </div>

          <p style={{ margin: '10px 0 0', fontSize: '0.78rem', color: t.subtext }}>
            Instant delivery after payment. License terms apply to commercial use.
          </p>
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

function StandardProductPage({ product, storeSlug, currency, themeId }: P) {
  const t = (THEME_TOKENS[themeId] || THEME_TOKENS.luxe) as ThemeTokens;
  const state = useProductState(product);
  const p = product as ProductExtra;
  const images = product.images?.length ? product.images : [];
  const active = images[state.activeImg] || images[0];
  const maxQty = product.productType === 'physical' ? Math.max(1, product.stock || 1) : 99;

  const typeLabel =
    product.productType === 'service'
      ? 'Service'
      : product.productType === 'digital'
        ? p.digitalSubtype
          ? String(p.digitalSubtype)
          : 'Digital'
        : product.category || 'Product';

  return (
    <div
      style={{
        maxWidth: 1200,
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
              borderRadius: t.radius,
              overflow: 'hidden',
              border: `1px solid ${t.border}`,
              background: t.surface,
              aspectRatio: '1 / 1',
            }}
          >
            <GalleryImage
              src={active}
              alt={product.displayName}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
          {images.length > 1 && (
            <div className="sf-product-thumbs" style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto' }}>
              {images.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => state.setActiveImg(i)}
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: Math.min(t.radius, 10),
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
              margin: '0 0 8px',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: t.subtext,
            }}
          >
            {typeLabel}
          </p>
          <h1
            style={{
              margin: '0 0 14px',
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
                  −{state.discount}%
                </span>
              </>
            ) : null}
          </div>

          {product.productType === 'physical' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontSize: '0.85rem', color: t.subtext }}>
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

          {product.description ? (
            <div
              style={{
                fontSize: '0.95rem',
                lineHeight: 1.65,
                color: t.subtext,
                marginBottom: 22,
                whiteSpace: 'pre-wrap',
              }}
            >
              {product.description.replace(/<[^>]+>/g, ' ').trim()}
            </div>
          ) : null}

          {product.deliveryNote ? (
            <p style={{ fontSize: '0.85rem', color: t.subtext, marginBottom: 16 }}>
              {product.deliveryNote}
            </p>
          ) : null}

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {product.productType !== 'service' && (
              <QtyControl qty={state.qty} setQty={state.setQty} max={maxQty} t={t} />
            )}
            <PrimaryButton onClick={state.handleAdd} disabled={state.isOutOfStock} t={t}>
              {state.added
                ? 'Added ✓'
                : state.isOutOfStock
                  ? 'Sold out'
                  : product.productType === 'digital'
                    ? 'Add to cart'
                    : 'Add to cart'}
            </PrimaryButton>
          </div>
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

export function ProductPageWithTheme(props: P) {
  const subtype = String((props.product as ProductExtra).digitalSubtype || '').toLowerCase();
  const isAudio =
    props.product.productType === 'digital' &&
    (subtype === 'audio' || subtype === 'beat' || subtype === 'music');

  if (isAudio) {
    return <AudioProductPage {...props} />;
  }

  return <StandardProductPage {...props} />;
}
