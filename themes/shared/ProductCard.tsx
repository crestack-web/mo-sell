'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/app/store/[storeSlug]/context/CartContext';
import type { ThemeProductCardProps } from '../types';
import { THEME_TOKENS, accentText, type ThemeTokens } from './tokens';

function fmt(n: number, currency: string) {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
  return `${sym}${n.toLocaleString()}`;
}

export function ProductCardWithTheme({ themeId, product, storeSlug, currency }: ThemeProductCardProps & { themeId: string }) {
  const { addItem } = useCart();
  const [hovered, setHovered] = useState(false);
  const t = THEME_TOKENS[themeId] as ThemeTokens;
  const isOutOfStock = product.productType === 'physical' && product.stock === 0;
  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round((1 - product.price / product.compareAtPrice) * 100) : null;
  const blockColors = [t.accent, t.accent2, t.border, t.subtext];
  const c = blockColors[0];

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem({
      productId: product.id, displayName: product.displayName,
      price: product.price, imageUrl: product.images[0] ?? null,
      maxStock: product.productType === 'physical' ? product.stock : 999,
      productType: product.productType,
      metadata: { customerInfoFields: (product.customerInfoFields ?? ['name', 'email', 'phone', 'address']).join(',') },
    });
  };

  const imgSrc = product.images[hovered && product.images[1] ? 1 : 0];

  if (themeId === 'atelier') {
    return (
      <Link href={`/store/${storeSlug}/product/${product.id}`}
        style={{ textDecoration: 'none', color: 'inherit' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 16 }}>
          <div style={{ width: '100%', aspectRatio: '3/4', background: t.surface, overflow: 'hidden', position: 'relative' }}>
            {imgSrc ? (
              <img src={imgSrc} alt={product.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.4s', opacity: hovered ? 0.9 : 1 }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: c, opacity: 0.85 }} />
            )}
            {discount && (
              <span style={{ position: 'absolute', top: 12, left: 12, fontSize: '0.6rem', letterSpacing: '0.1em', padding: '4px 10px', background: t.accent, color: accentText(t) }}>-{discount}%</span>
            )}
            {isOutOfStock && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,11,11,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: t.subtext }}>Sold Out</div>
            )}
          </div>
          <p style={{ fontFamily: t.fontDisplay, fontWeight: 600, fontSize: '0.95rem', color: t.text, margin: '10px 0 2px', lineHeight: 1.3 }}>{product.displayName}</p>
          <p style={{ fontSize: '0.85rem', color: t.subtext, margin: 0 }}>
            {fmt(product.price, currency)}
            {discount && <span style={{ marginLeft: 8, color: t.border, textDecoration: 'line-through' }}>{fmt(product.compareAtPrice!, currency)}</span>}
          </p>
          <p style={{ fontSize: '0.7rem', marginTop: 6, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.accent, fontWeight: 600 }}>{isOutOfStock ? 'Sold Out' : '+ Add'}</p>
        </div>
      </Link>
    );
  }

  if (themeId === 'citrus') {
    return (
      <Link href={`/store/${storeSlug}/product/${product.id}`}
        style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', overflow: 'hidden', background: c, opacity: 0.85 }}>
            {imgSrc && (
              <img src={imgSrc} alt={product.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            )}
          </div>
          <button onClick={handleAdd} aria-label={`Add ${product.displayName} to cart`}
            style={{ position: 'absolute', bottom: -4, right: -4, width: 26, height: 26, borderRadius: '50%', background: t.accent2, border: 'none', cursor: isOutOfStock ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isOutOfStock ? 0.4 : 1 }}>
            <span style={{ color: '#fff', fontSize: 15, lineHeight: 1 }}>+</span>
          </button>
          {isOutOfStock && <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>Sold</span>}
        </div>
        <p style={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.3, color: t.text, fontFamily: t.fontDisplay, margin: 0 }}>{product.displayName}</p>
        <p style={{ fontSize: '0.85rem', color: t.accent, fontWeight: 700, margin: '2px 0 0' }}>
          {fmt(product.price, currency)}
          {discount && <span style={{ marginLeft: 6, color: t.border, textDecoration: 'line-through', fontWeight: 500 }}>{fmt(product.compareAtPrice!, currency)}</span>}
        </p>
      </Link>
    );
  }

  if (themeId === 'nordly') {
    return (
      <Link href={`/store/${storeSlug}/product/${product.id}`}
        className="sf-nordly-card"
        style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: t.surface, border: `1px solid ${t.border}`, borderRadius: t.radius, width: '100%', boxSizing: 'border-box', minWidth: 0, overflow: 'hidden' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ width: 72, height: 72, flexShrink: 0, background: c, opacity: 0.8, overflow: 'hidden', borderRadius: t.radius }}>
          {imgSrc && (
            <img src={imgSrc} alt={product.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: t.text, fontFamily: t.fontDisplay, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.displayName}</p>
          <p style={{ fontSize: '0.85rem', color: t.subtext, margin: '3px 0 0' }}>
            {fmt(product.price, currency)}
            {discount && <span style={{ marginLeft: 8, color: t.border, textDecoration: 'line-through' }}>{fmt(product.compareAtPrice!, currency)}</span>}
          </p>
          {isOutOfStock && <p style={{ fontSize: '0.7rem', color: '#B91C1C', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sold out</p>}
        </div>
      </Link>
    );
  }

  if (themeId === 'neotech') {
    return (
      <Link href={`/store/${storeSlug}/product/${product.id}`}
        style={{ textDecoration: 'none', color: 'inherit', position: 'relative', overflow: 'hidden', background: t.surface, border: `1px solid ${t.border}`, borderRadius: t.radius }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ position: 'relative', height: 140, background: c, opacity: 0.3 }}>
          {imgSrc && (
            <img src={imgSrc} alt={product.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          <span style={{ position: 'absolute', top: 8, left: 8, fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: t.accent, color: t.bg.startsWith('#') ? t.bg : '#111' }}>{discount ? `-${discount}%` : 'NEW'}</span>
        </div>
        <div style={{ padding: '10px 12px 12px' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: t.text, fontFamily: t.fontDisplay, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.displayName}</p>
          {product.rating != null && (
            <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
              {[0, 1, 2].map(i => <span key={i} style={{ color: t.accent2, fontSize: 11 }}>★</span>)}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
            <p style={{ fontSize: '0.85rem', color: t.accent, margin: 0 }}>{fmt(product.price, currency)}</p>
            <button onClick={handleAdd} aria-label={`Add ${product.displayName} to cart`}
              style={{ width: 22, height: 22, borderRadius: 4, background: t.accent, border: 'none', cursor: isOutOfStock ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isOutOfStock ? 0.4 : 1 }}>
              <span style={{ color: t.bg.startsWith('#') ? t.bg : '#111', fontSize: 13, lineHeight: 1 }}>+</span>
            </button>
          </div>
        </div>
      </Link>
    );
  }

  if (themeId === 'terra') {
    return (
      <Link href={`/store/${storeSlug}/product/${product.id}`}
        style={{ textDecoration: 'none', color: 'inherit', overflow: 'hidden', background: t.surface, border: `1px solid ${t.border}`, borderRadius: t.radius, display: 'block' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ position: 'relative', height: 150, background: c, opacity: 0.8 }}>
          {imgSrc && (
            <img src={imgSrc} alt={product.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          <span style={{ position: 'absolute', top: 8, left: 8, fontSize: '0.6rem', fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: t.surface, color: t.accent2 }}>{discount ? `-${discount}%` : 'Handmade'}</span>
        </div>
        <div style={{ padding: '10px 12px 8px' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: t.text, fontFamily: t.fontDisplay, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.displayName}</p>
          <p style={{ fontSize: '0.82rem', color: t.subtext, margin: '3px 0 6px' }}>{fmt(product.price, currency)}</p>
        </div>
        <button onClick={handleAdd}
          style={{ width: '100%', padding: '8px 0', fontSize: '0.8rem', fontWeight: 600, borderTop: `1px solid ${t.border}`, borderBottom: 'none', borderLeft: 'none', borderRight: 'none', background: 'transparent', color: t.accent, cursor: isOutOfStock ? 'not-allowed' : 'pointer', opacity: isOutOfStock ? 0.4 : 1 }}>
          {isOutOfStock ? 'Sold Out' : 'Add to cart'}
        </button>
      </Link>
    );
  }

  if (themeId === 'volt') {
    return (
      <Link href={`/store/${storeSlug}/product/${product.id}`}
        style={{ textDecoration: 'none', color: 'inherit', position: 'relative', overflow: 'hidden', background: t.surface, border: `1px solid ${t.border}` }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ position: 'relative', height: 130, background: t.border }}>
          {imgSrc && (
            <img src={imgSrc} alt={product.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          <span style={{ position: 'absolute', top: 8, right: 8, fontSize: '0.6rem', fontWeight: 700, padding: '3px 6px', background: t.accent, color: '#000' }}>{discount ? `-${discount}%` : 'NEW'}</span>
        </div>
        <div style={{ padding: '10px 12px 12px' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: t.text, fontFamily: t.fontDisplay, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.displayName}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '3px 6px', background: t.accent, color: '#000' }}>{fmt(product.price, currency)}</span>
            <button onClick={handleAdd} aria-label={`Add ${product.displayName} to cart`}
              style={{ width: 24, height: 24, background: t.text, border: 'none', cursor: isOutOfStock ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isOutOfStock ? 0.4 : 1 }}>
              <span style={{ color: '#000', fontSize: 13, lineHeight: 1 }}>+</span>
            </button>
          </div>
        </div>
      </Link>
    );
  }

  if (themeId === 'botanica') {
    return (
      <Link href={`/store/${storeSlug}/product/${product.id}`}
        style={{ textDecoration: 'none', color: 'inherit', overflow: 'hidden', background: t.surface, borderRadius: t.radius, display: 'block' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ position: 'relative', height: 150, background: c, opacity: 0.8 }}>
          {imgSrc && (
            <img src={imgSrc} alt={product.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          <span style={{ position: 'absolute', top: 10, right: 10, fontSize: '0.7rem', fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: t.surface, color: t.accent }}>
            {fmt(product.price, currency)}
          </span>
          {isOutOfStock && <span style={{ position: 'absolute', inset: 0, background: 'rgba(15,35,24,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.text, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sold Out</span>}
        </div>
        <div style={{ padding: '10px 12px 12px' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 500, color: t.text, fontFamily: t.fontDisplay, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.displayName}</p>
          <p style={{ fontSize: '0.75rem', margin: '6px 0 0', color: t.accent, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
            {isOutOfStock ? 'Sold Out' : 'Add to bag'}
            <span style={{ fontSize: 10 }}>→</span>
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/store/${storeSlug}/product/${product.id}`}
      style={{ textDecoration: 'none', color: 'inherit', padding: 14, textAlign: 'center', background: t.surface, backdropFilter: 'blur(6px)', border: `1px solid ${t.border}`, borderRadius: t.radius, display: 'block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ width: 76, height: 76, borderRadius: '50%', margin: '0 auto 10px', background: c, opacity: 0.9, overflow: 'hidden' }}>
        {imgSrc && (
          <img src={imgSrc} alt={product.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
        )}
      </div>
      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: t.text, fontFamily: t.fontDisplay, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.displayName}</p>
      <p style={{ fontSize: '0.8rem', color: t.subtext, margin: '2px 0 8px' }}>{fmt(product.price, currency)}</p>
      <button onClick={handleAdd}
        style={{ fontSize: '0.72rem', fontWeight: 700, padding: '5px 14px', borderRadius: 999, background: '#fff', color: '#7B2FF7', border: 'none', cursor: isOutOfStock ? 'not-allowed' : 'pointer', opacity: isOutOfStock ? 0.4 : 1 }}>
        {isOutOfStock ? 'Sold Out' : '+ Add'}
      </button>
    </Link>
  );
}
