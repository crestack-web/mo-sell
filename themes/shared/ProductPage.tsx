'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/app/store/[storeSlug]/context/CartContext';
import type { ThemeProductPageProps } from '../types';
import { THEME_TOKENS, type ThemeTokens } from './tokens';

function fmt(n: number, currency: string) {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
  return `${sym}${n.toLocaleString()}`;
}

type P = ThemeProductPageProps & { themeId: string };

// ─── Shared purchase state (same add-to-cart behaviour for every theme) ───────

function useProductState(product: ThemeProductPageProps['product']) {
  const { addItem, updateQty } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
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
    updateQty(product.id, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return { activeImg, setActiveImg, qty, setQty, added, isOutOfStock, discount, handleAdd };
}

function GalleryImage({ src, alt, style }: { src?: string; alt: string; style: React.CSSProperties }) {
  return src
    ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} style={style} />
    )
    : (
      <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '3.5rem', opacity: 0.35 }}>📦</span>
      </div>
    );
}

function StockDot({ isOutOfStock, stock, color }: { isOutOfStock: boolean; stock: number; color: string }) {
  return (
    <span style={{ width: 8, height: 8, borderRadius: '50%', background: isOutOfStock ? '#EF4444' : stock <= 5 ? '#F59E0B' : color, display: 'inline-block', flexShrink: 0 }} />
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. Atelier Noir — editorial dark, hairline rules, serif display
// ══════════════════════════════════════════════════════════════════════════════

function AtelierPage(p: P) {
  const t = THEME_TOKENS.atelier as ThemeTokens;
  const { product, storeSlug, currency } = p;
  const s = useProductState(product);

  const detailRow = (label: string, value: string, last = false) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, padding: '13px 0', borderBottom: last ? 'none' : '1px solid #000', boxShadow: last ? 'none' : `0 1px 0 ${t.border}` }}>
      <span style={{ fontSize: '0.66rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: t.subtext }}>{label}</span>
      <span style={{ fontSize: '0.82rem', color: t.text, textAlign: 'right' }}>{value}</span>
    </div>
  );

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '24px 5% 100px', background: t.bg, color: t.text }}>
      <div style={{ height: 1, background: t.accent, opacity: 0.6, marginBottom: 22 }} />
      <nav style={{ fontSize: '0.66rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: t.subtext, marginBottom: 52, display: 'flex', gap: 10, alignItems: 'center' }}>
        <Link href={`/store/${storeSlug}`} style={{ color: t.accent, textDecoration: 'none' }}>Store</Link>
        <span style={{ color: t.border }}>/</span>
        <span>{product.category}</span>
        <span style={{ color: t.border }}>/</span>
        <span>{product.displayName}</span>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 72, alignItems: 'start' }}>
        <div>
          <div style={{ width: '100%', aspectRatio: '3/4', background: t.surface, position: 'relative' }}>
            <GalleryImage src={product.images[s.activeImg]} alt={product.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.08)' }} />
            {s.discount && (
              <span style={{ position: 'absolute', bottom: 14, left: 0, fontSize: '0.62rem', letterSpacing: '0.2em', padding: '6px 16px', background: t.accent, color: '#0B0B0B' }}>-{s.discount}%</span>
            )}
          </div>
          {product.images.length > 1 && (
            <div style={{ display: 'flex', gap: 0, marginTop: 0 }}>
              {product.images.map((img, i) => (
                <button key={i} onClick={() => s.setActiveImg(i)}
                  style={{ flex: 1, height: 72, padding: 0, border: 'none', cursor: 'pointer', opacity: i === s.activeImg ? 1 : 0.35, transition: 'opacity 0.3s', background: t.surface }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, paddingTop: 8 }}>
          <p style={{ fontSize: '0.62rem', letterSpacing: '0.24em', textTransform: 'uppercase', color: t.accent, margin: 0 }}>{product.category || 'New Arrival'}</p>
          <h1 style={{ fontFamily: t.fontDisplay, fontWeight: 400, fontSize: 'clamp(1.9rem, 3vw, 2.7rem)', color: t.text, margin: 0, lineHeight: 1.15, letterSpacing: '0.01em' }}>{product.displayName}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontFamily: t.fontDisplay, fontSize: '1.55rem', color: t.accent }}>{fmt(product.price, currency)}</span>
            {s.discount && <span style={{ fontSize: '0.92rem', color: t.subtext, textDecoration: 'line-through' }}>{fmt(product.compareAtPrice!, currency)}</span>}
          </div>

          <div style={{ height: 1, background: '#000', boxShadow: `0 1px 0 ${t.border}` }} />

          {product.description && (
            <div className="product-rich-description" style={{ fontSize: '0.92rem', color: t.subtext, lineHeight: 1.8, overflowWrap: 'break-word', fontFamily: t.fontBody }} dangerouslySetInnerHTML={{ __html: product.description }} />
          )}

          <div style={{ marginTop: 4 }}>
            {product.productType === 'physical' && (
              detailRow('Availability', s.isOutOfStock ? 'Sold out' : product.stock <= 5 ? `Only ${product.stock} remaining` : 'In stock')
            )}
            {detailRow('Category', product.category || 'General')}
            {product.productType === 'digital'
              ? detailRow('Delivery', 'Instant digital delivery')
              : detailRow('Delivery', 'Ships in 2–3 business days', true)}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', height: 50 }}>
              <button onClick={() => s.setQty(Math.max(1, s.qty - 1))} aria-label="Decrease quantity" style={{ background: 'none', border: 'none', boxShadow: `inset 0 0 0 1px ${t.border}`, color: t.text, width: 44, height: '100%', cursor: 'pointer', fontSize: 16 }}>−</button>
              <span style={{ width: 44, textAlign: 'center', fontSize: '0.85rem', color: t.text, boxShadow: `inset 0 0 0 1px ${t.border}`, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.qty}</span>
              <button onClick={() => s.setQty(s.qty + 1)} aria-label="Increase quantity" style={{ background: 'none', border: 'none', boxShadow: `inset 0 0 0 1px ${t.border}`, color: t.text, width: 44, height: '100%', cursor: 'pointer', fontSize: 16 }}>+</button>
            </div>
            <button onClick={s.handleAdd} disabled={s.isOutOfStock}
              style={{
                flex: 1, height: 50, padding: '0 28px',
                background: s.isOutOfStock ? 'transparent' : s.added ? t.accent : 'transparent',
                color: s.isOutOfStock ? t.subtext : s.added ? '#0B0B0B' : t.accent,
                border: `1px solid ${s.isOutOfStock ? t.border : t.accent}`,
                fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase',
                cursor: s.isOutOfStock ? 'not-allowed' : 'pointer', transition: 'all 0.3s',
                fontFamily: t.fontBody,
              }}>
              {s.isOutOfStock ? 'Sold Out' : s.added ? '✓ Added to Bag' : 'Add to Bag'}
            </button>
          </div>

          {product.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
              {product.tags.map(tag => (
                <span key={tag} style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', padding: '6px 14px', border: '1px solid #000', boxShadow: `0 0 0 1px ${t.border}`, color: t.subtext, fontFamily: t.fontBody }}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. Citrus Market — round thumbnail, circular badges, fresh & playful
// ══════════════════════════════════════════════════════════════════════════════

function CitrusPage(p: P) {
  const t = THEME_TOKENS.citrus as ThemeTokens;
  const { product, storeSlug, currency } = p;
  const s = useProductState(product);

  const facts: [string, string][] = [
    ['🧡', 'Fresh today'],
    ['🛺', 'Local pickup'],
    ['🚚', 'Fast delivery'],
  ];

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '28px 5% 96px', background: t.bg, color: t.text, fontFamily: t.fontBody }}>
      <nav style={{ fontSize: '0.78rem', color: t.subtext, marginBottom: 28, display: 'flex', gap: 8, alignItems: 'center' }}>
        <Link href={`/store/${storeSlug}`} style={{ color: t.accent, textDecoration: 'none' }}>Store</Link>
        <span>/</span>
        <span>{product.category}</span>
      </nav>

      <div style={{ textAlign: 'center' }}>
        <div style={{ position: 'relative', width: 420, maxWidth: '100%', height: 420, maxHeight: '78vw', borderRadius: '50%', overflow: 'hidden', background: t.surface, margin: '0 auto', border: `6px solid ${t.border}` }}>
          <GalleryImage src={product.images[s.activeImg]} alt={product.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {s.discount && (
            <span style={{ position: 'absolute', bottom: 26, left: '50%', transform: 'translateX(-50%)', width: 92, height: 92, borderRadius: '50%', background: t.accent, color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800, border: '3px solid #fff' }}>
              {s.discount}%<span style={{ fontSize: '0.58rem', fontWeight: 600 }}>OFF</span>
            </span>
          )}
        </div>
        {product.images.length > 1 && (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 18 }}>
            {product.images.map((img, i) => (
              <button key={i} onClick={() => s.setActiveImg(i)}
                style={{ width: 64, height: 64, borderRadius: '50%', padding: 0, border: i === s.activeImg ? `3px solid ${t.accent}` : '3px solid transparent', cursor: 'pointer', overflow: 'hidden', background: t.surface }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 28 }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: t.accent, margin: '0 0 6px' }}>{product.category || 'Fresh Pick'}</p>
        <h1 style={{ fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 'clamp(1.6rem, 3vw, 2.3rem)', color: t.text, margin: 0 }}>{product.displayName}</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 10 }}>
          <span style={{ fontSize: '1.55rem', fontWeight: 800, color: t.accent }}>{fmt(product.price, currency)}</span>
          {s.discount && <span style={{ fontSize: '1rem', color: t.subtext, textDecoration: 'line-through' }}>{fmt(product.compareAtPrice!, currency)}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 24, flexWrap: 'wrap' }}>
        {facts.map(([icon, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, padding: '7px 16px', fontSize: '0.82rem', color: t.text, fontWeight: 600 }}>
            <span>{icon}</span>{label}
          </div>
        ))}
      </div>

      {product.description && (
        <div className="product-rich-description" style={{ fontSize: '0.95rem', color: t.subtext, lineHeight: 1.75, marginTop: 26, textAlign: 'center', overflowWrap: 'break-word' }} dangerouslySetInnerHTML={{ __html: product.description }} />
      )}

      {product.productType === 'physical' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.88rem', color: t.subtext, marginTop: 22 }}>
          <StockDot isOutOfStock={s.isOutOfStock} stock={product.stock} color={t.accent} />
          {s.isOutOfStock ? 'Sold out' : product.stock <= 5 ? `Only ${product.stock} left!` : 'In stock — fresh & ready'}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', border: `2px solid ${t.accent}`, borderRadius: 999, overflow: 'hidden', background: t.surface }}>
          <button onClick={() => s.setQty(Math.max(1, s.qty - 1))} aria-label="Decrease quantity" style={{ background: 'none', border: 'none', padding: '12px 18px', cursor: 'pointer', color: t.accent, fontSize: 18, fontWeight: 800 }}>−</button>
          <span style={{ fontSize: '1rem', color: t.text, minWidth: 30, textAlign: 'center', fontWeight: 700 }}>{s.qty}</span>
          <button onClick={() => s.setQty(s.qty + 1)} aria-label="Increase quantity" style={{ background: 'none', border: 'none', padding: '12px 18px', cursor: 'pointer', color: t.accent, fontSize: 18, fontWeight: 800 }}>+</button>
        </div>
        <button onClick={s.handleAdd} disabled={s.isOutOfStock}
          style={{
            padding: '14px 34px', borderRadius: 999,
            background: s.isOutOfStock ? 'transparent' : s.added ? '#10B981' : t.accent,
            color: s.isOutOfStock ? t.subtext : '#fff',
            border: s.isOutOfStock ? `2px solid ${t.border}` : 'none',
            fontSize: '0.95rem', fontWeight: 800, cursor: s.isOutOfStock ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s', fontFamily: t.fontBody,
          }}>
          {s.isOutOfStock ? 'Sold Out' : s.added ? 'Added to Cart ✓' : 'Add to Cart'}
        </button>
      </div>

      {product.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 22 }}>
          {product.tags.map(tag => (
            <span key={tag} style={{ fontSize: '0.72rem', fontWeight: 600, padding: '5px 14px', borderRadius: 999, background: t.accent2, color: '#fff' }}>{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. Nordic Minimal — framed image, spec table, hairline quiet
// ══════════════════════════════════════════════════════════════════════════════

function NordlyPage(p: P) {
  const t = THEME_TOKENS.nordly as ThemeTokens;
  const { product, storeSlug, currency } = p;
  const s = useProductState(product);

  const spec = (label: string, value: string, last = false) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 20, padding: '14px 0', borderBottom: last ? 'none' : `1px solid ${t.border}` }}>
      <span style={{ fontSize: '0.78rem', color: t.subtext }}>{label}</span>
      <span style={{ fontSize: '0.88rem', color: t.text }}>{value}</span>
    </div>
  );

  return (
    <div style={{ maxWidth: 1160, margin: '0 auto', padding: '36px 5% 100px', background: t.bg, color: t.text, fontFamily: t.fontBody }}>
      <nav style={{ fontSize: '0.72rem', letterSpacing: '0.08em', color: t.subtext, marginBottom: 48, display: 'flex', gap: 10 }}>
        <Link href={`/store/${storeSlug}`} style={{ color: t.accent, textDecoration: 'none' }}>Store</Link>
        <span>/</span>
        <span>{product.category}</span>
        <span>/</span>
        <span style={{ color: t.subtext }}>{product.displayName}</span>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'start' }}>
        <div>
          <div style={{ border: `1px solid ${t.border}`, padding: 10, background: t.surface }}>
            <div style={{ width: '100%', aspectRatio: '4/5', position: 'relative', overflow: 'hidden' }}>
              <GalleryImage src={product.images[s.activeImg]} alt={product.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {s.discount && (
                <span style={{ position: 'absolute', top: 12, left: 12, fontSize: '0.62rem', letterSpacing: '0.12em', padding: '4px 10px', background: t.text, color: t.bg }}>-{s.discount}%</span>
              )}
            </div>
          </div>
          {product.images.length > 1 && (
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {product.images.map((img, i) => (
                <button key={i} onClick={() => s.setActiveImg(i)}
                  style={{ flex: 1, height: 68, padding: 0, border: `1px solid ${i === s.activeImg ? t.accent : t.border}`, cursor: 'pointer', opacity: i === s.activeImg ? 1 : 0.55, background: t.surface, overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <p style={{ fontSize: '0.66rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: t.accent, margin: '0 0 8px' }}>Nordly — {product.category || 'Collection'}</p>
            <h1 style={{ fontFamily: t.fontDisplay, fontWeight: 600, fontSize: 'clamp(1.7rem, 2.6vw, 2.3rem)', color: t.text, margin: 0, lineHeight: 1.2 }}>{product.displayName}</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <span style={{ fontSize: '1.35rem', color: t.accent, fontWeight: 600 }}>{fmt(product.price, currency)}</span>
            {s.discount && <span style={{ fontSize: '0.92rem', color: t.subtext, textDecoration: 'line-through' }}>{fmt(product.compareAtPrice!, currency)}</span>}
          </div>

          {product.description && (
            <div className="product-rich-description" style={{ fontSize: '0.9rem', color: t.subtext, lineHeight: 1.7, overflowWrap: 'break-word' }} dangerouslySetInnerHTML={{ __html: product.description }} />
          )}

          <div style={{ borderTop: `1px solid ${t.border}`, marginTop: 8 }}>
            {spec('Category', product.category || 'General')}
            {product.productType === 'physical' && spec('Availability', s.isOutOfStock ? 'Sold out' : product.stock <= 5 ? `Low — ${product.stock} left` : 'In stock')}
            {product.productType === 'digital' && spec('Delivery', 'Instant digital download')}
            {spec('Shipping', '2–3 business days')}
            {spec('Returns', '30-day free returns', true)}
          </div>

          {product.productType === 'physical' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', color: t.subtext }}>
              <StockDot isOutOfStock={s.isOutOfStock} stock={product.stock} color={t.accent} />
              {s.isOutOfStock ? 'Currently sold out' : product.stock <= 5 ? `Only ${product.stock} remaining` : 'In stock'}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${t.border}`, borderRadius: 4, overflow: 'hidden' }}>
              <button onClick={() => s.setQty(Math.max(1, s.qty - 1))} aria-label="Decrease quantity" style={{ background: 'none', border: 'none', padding: '11px 16px', cursor: 'pointer', color: t.text }}>−</button>
              <span style={{ fontSize: '0.9rem', color: t.text, minWidth: 26, textAlign: 'center' }}>{s.qty}</span>
              <button onClick={() => s.setQty(s.qty + 1)} aria-label="Increase quantity" style={{ background: 'none', border: 'none', padding: '11px 16px', cursor: 'pointer', color: t.text }}>+</button>
            </div>
            <button onClick={s.handleAdd} disabled={s.isOutOfStock}
              style={{
                flex: 1, padding: '12px 26px', borderRadius: 4,
                background: s.isOutOfStock ? 'transparent' : s.added ? '#3F5B3B' : t.accent,
                color: '#fff', border: s.isOutOfStock ? `1px solid ${t.border}` : 'none',
                fontSize: '0.84rem', fontWeight: 600, cursor: s.isOutOfStock ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s', fontFamily: t.fontBody,
              }}>
              {s.isOutOfStock ? 'Sold Out' : s.added ? 'Added to Cart' : 'Add to Cart'}
            </button>
          </div>

          {product.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {product.tags.map(tag => (
                <span key={tag} style={{ fontSize: '0.66rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 12px', border: `1px solid ${t.border}`, color: t.subtext }}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. Neo Tech — spec-card grid, glow, mono labels, corner brackets
// ══════════════════════════════════════════════════════════════════════════════

function NeotechPage(p: P) {
  const t = THEME_TOKENS.neotech as ThemeTokens;
  const { product, storeSlug, currency } = p;
  const s = useProductState(product);
  const rating = (product as unknown as { rating?: number; reviewCount?: number }).rating;
  const reviewCount = (product as unknown as { rating?: number; reviewCount?: number }).reviewCount;

  const specCard = (label: string, value: string) => (
    <div style={{ border: `1px solid ${t.border}`, borderRadius: 8, background: t.surface, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: '0.58rem', fontFamily: "'Courier New', monospace", color: t.subtext, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: t.text, fontFamily: t.fontBody }}>{value}</span>
    </div>
  );

  return (
    <div style={{ maxWidth: 1160, margin: '0 auto', padding: '32px 5% 96px', background: t.bg, color: t.text, fontFamily: t.fontBody }}>
      <nav style={{ fontSize: '0.66rem', fontFamily: "'Courier New', monospace", color: t.subtext, marginBottom: 36, display: 'flex', gap: 10 }}>
        <Link href={`/store/${storeSlug}`} style={{ color: t.accent, textDecoration: 'none' }}>STORE</Link>
        <span>/</span>
        <span>{product.category.toUpperCase()}</span>
        <span>/</span>
        <span style={{ color: t.subtext }}>{product.displayName.toUpperCase()}</span>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'start' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', inset: -24, background: t.accent, opacity: 0.14, filter: 'blur(48px)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ height: '100%', aspectRatio: '1/1', position: 'relative' }}>
              <GalleryImage src={product.images[s.activeImg]} alt={product.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span style={{ position: 'absolute', top: 12, left: 12, fontSize: '0.58rem', fontWeight: 700, fontFamily: "'Courier New', monospace", letterSpacing: '0.12em', padding: '4px 8px', borderRadius: 5, background: t.accent, color: '#0A0E17' }}>{s.discount ? `SAVE ${s.discount}%` : 'NEW'}</span>
            <span style={{ position: 'absolute', top: 12, right: 12, fontSize: '0.58rem', fontFamily: "'Courier New', monospace", padding: '4px 8px', borderRadius: 5, border: `1px solid ${t.border}`, color: t.subtext }}>{product.productType.toUpperCase()}</span>
          </div>
          {product.images.length > 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12, position: 'relative' }}>
              {product.images.map((img, i) => (
                <button key={i} onClick={() => s.setActiveImg(i)}
                  style={{ height: 72, padding: 0, border: `1px solid ${i === s.activeImg ? t.accent : t.border}`, borderRadius: 8, cursor: 'pointer', overflow: 'hidden', opacity: i === s.activeImg ? 1 : 0.55, background: t.surface }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingTop: 4 }}>
          <div>
            <p style={{ fontSize: '0.6rem', fontFamily: "'Courier New', monospace", color: t.accent, letterSpacing: '0.14em', margin: '0 0 8px' }}>PRODUCT // {product.category.toUpperCase() || 'GENERAL'}</p>
            <h1 style={{ fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 'clamp(1.6rem, 2.6vw, 2.2rem)', color: t.text, margin: 0, letterSpacing: '-0.01em' }}>{product.displayName}</h1>
            {rating != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                <span style={{ color: t.accent2, fontSize: 13, letterSpacing: 2 }}>{'★'.repeat(Math.min(5, Math.max(1, Math.round(rating))))}{'☆'.repeat(5 - Math.min(5, Math.max(1, Math.round(rating))))}</span>
                <span style={{ fontSize: '0.72rem', color: t.subtext, fontFamily: "'Courier New', monospace" }}>{rating.toFixed(1)}{reviewCount != null ? ` · ${reviewCount} reviews` : ''}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: '1.7rem', fontWeight: 800, color: t.accent }}>{fmt(product.price, currency)}</span>
            {s.discount && <span style={{ fontSize: '0.95rem', color: t.subtext, textDecoration: 'line-through' }}>{fmt(product.compareAtPrice!, currency)}</span>}
          </div>

          {product.description && (
            <div className="product-rich-description" style={{ fontSize: '0.88rem', color: t.subtext, lineHeight: 1.65, fontFamily: t.fontBody, overflowWrap: 'break-word' }} dangerouslySetInnerHTML={{ __html: product.description }} />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {specCard('Category', product.category || 'General')}
            {product.productType === 'physical'
              ? specCard('Stock', s.isOutOfStock ? 'Sold out' : `${product.stock} units`)
              : specCard('Type', product.productType === 'digital' ? 'Digital' : 'Service')}
            {product.productType === 'digital'
              ? specCard('Delivery', 'Instant')
              : specCard('Delivery', '2–3 days')}
            {specCard('Warranty', product.productType === 'digital' ? 'Lifetime' : '12 months')}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${t.border}`, borderRadius: 8, overflow: 'hidden', background: t.surface }}>
              <button onClick={() => s.setQty(Math.max(1, s.qty - 1))} aria-label="Decrease quantity" style={{ background: 'none', border: 'none', padding: '12px 15px', cursor: 'pointer', color: t.accent, fontFamily: "'Courier New', monospace" }}>−</button>
              <span style={{ fontSize: '0.9rem', color: t.text, minWidth: 28, textAlign: 'center', fontFamily: "'Courier New', monospace" }}>{s.qty}</span>
              <button onClick={() => s.setQty(s.qty + 1)} aria-label="Increase quantity" style={{ background: 'none', border: 'none', padding: '12px 15px', cursor: 'pointer', color: t.accent, fontFamily: "'Courier New', monospace" }}>+</button>
            </div>
            <button onClick={s.handleAdd} disabled={s.isOutOfStock}
              style={{
                flex: 1, padding: '0 26px', borderRadius: 8, position: 'relative',
                background: s.isOutOfStock ? 'transparent' : s.added ? t.accent2 : t.accent,
                color: s.isOutOfStock ? t.subtext : '#0A0E17',
                border: `1px solid ${s.isOutOfStock ? t.border : 'transparent'}`,
                fontSize: '0.74rem', fontWeight: 700, fontFamily: "'Courier New', monospace", letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: s.isOutOfStock ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
              }}>
              {s.isOutOfStock ? 'Sold Out' : s.added ? '✓ Added to Cart' : 'Add to Cart'}
            </button>
          </div>

          {product.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {product.tags.map(tag => (
                <span key={tag} style={{ fontSize: '0.66rem', fontFamily: "'Courier New', monospace", letterSpacing: '0.08em', padding: '5px 12px', border: `1px solid ${t.border}`, borderRadius: 999, color: t.subtext }}>● {tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. Terra Craft — warm earthy, rounded frames, stitched "Handmade" tag
// ══════════════════════════════════════════════════════════════════════════════

function TerraPage(p: P) {
  const t = THEME_TOKENS.terra as ThemeTokens;
  const { product, storeSlug, currency } = p;
  const s = useProductState(product);

  return (
    <div style={{ maxWidth: 1160, margin: '0 auto', padding: '32px 5% 100px', background: t.bg, color: t.text, fontFamily: t.fontBody }}>
      <nav style={{ fontSize: '0.78rem', color: t.subtext, marginBottom: 32, display: 'flex', gap: 8 }}>
        <Link href={`/store/${storeSlug}`} style={{ color: t.accent, textDecoration: 'none' }}>Store</Link>
        <span>/</span>
        <span>{product.category}</span>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 56, alignItems: 'start' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'relative', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 24, overflow: 'hidden' }}>
            <div style={{ aspectRatio: '4/5', position: 'relative' }}>
              <GalleryImage src={product.images[s.activeImg]} alt={product.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span style={{ position: 'absolute', top: 18, left: 18, transform: 'rotate(-4deg)', background: t.accent2, color: '#fff', fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '7px 14px', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
              {s.discount ? `-${s.discount}% OFF` : 'Handmade'}
            </span>
            {s.discount && (
              <span style={{ position: 'absolute', bottom: 14, right: 14, background: t.surface, border: `1px solid ${t.border}`, color: t.accent2, fontSize: '0.72rem', fontWeight: 700, padding: '5px 12px', borderRadius: 999 }}>
                Save {fmt(product.compareAtPrice! - product.price, currency)}
              </span>
            )}
          </div>
          {product.images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {product.images.map((img, i) => (
                <button key={i} onClick={() => s.setActiveImg(i)}
                  style={{ flex: 1, height: 76, padding: 0, border: `2px solid ${i === s.activeImg ? t.accent : t.border}`, borderRadius: 14, cursor: 'pointer', overflow: 'hidden', opacity: i === s.activeImg ? 1 : 0.55, background: t.surface }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingTop: 8 }}>
          <div>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: t.accent2, margin: '0 0 6px' }}>{product.category || 'Made by hand'}</p>
            <h1 style={{ fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 'clamp(1.7rem, 2.7vw, 2.4rem)', color: t.text, margin: 0, lineHeight: 1.18 }}>
              {product.displayName}
            </h1>
            <div style={{ width: 64, height: 4, background: `linear-gradient(90deg, ${t.accent}, ${t.accent2})`, borderRadius: 999, marginTop: 12 }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: t.accent2 }}>{fmt(product.price, currency)}</span>
            {s.discount && <span style={{ fontSize: '0.95rem', color: t.subtext, textDecoration: 'line-through' }}>{fmt(product.compareAtPrice!, currency)}</span>}
          </div>

          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 18, padding: '16px 18px' }}>
            <p style={{ margin: '0 0 6px', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.accent }}>The craft</p>
            {product.description ? (
              <div className="product-rich-description" style={{ fontSize: '0.9rem', color: t.subtext, lineHeight: 1.7, overflowWrap: 'break-word' }} dangerouslySetInnerHTML={{ __html: product.description }} />
            ) : (
              <p style={{ margin: 0, fontSize: '0.9rem', color: t.subtext, lineHeight: 1.7 }}>Made slowly, with care. Every piece is finished by hand.</p>
            )}
          </div>

          {product.productType === 'physical' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.86rem', color: t.subtext }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.isOutOfStock ? '#C0392B' : product.stock <= 5 ? '#E67E22' : t.accent, display: 'inline-block' }} />
              {s.isOutOfStock ? 'Sold out for now' : product.stock <= 5 ? `Only ${product.stock} pieces remaining` : 'In stock — made in small batches'}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${t.border}`, borderRadius: 999, overflow: 'hidden', background: t.surface }}>
              <button onClick={() => s.setQty(Math.max(1, s.qty - 1))} aria-label="Decrease quantity" style={{ background: 'none', border: 'none', padding: '12px 17px', cursor: 'pointer', color: t.text, fontSize: 16 }}>−</button>
              <span style={{ fontSize: '0.92rem', color: t.text, minWidth: 28, textAlign: 'center', fontWeight: 600 }}>{s.qty}</span>
              <button onClick={() => s.setQty(s.qty + 1)} aria-label="Increase quantity" style={{ background: 'none', border: 'none', padding: '12px 17px', cursor: 'pointer', color: t.text, fontSize: 16 }}>+</button>
            </div>
            <button onClick={s.handleAdd} disabled={s.isOutOfStock}
              style={{
                flex: 1, padding: '0 28px', borderRadius: 999,
                background: s.isOutOfStock ? 'transparent' : s.added ? '#3F5B3B' : t.accent,
                color: '#fff', border: s.isOutOfStock ? `1px solid ${t.border}` : 'none',
                fontSize: '0.92rem', fontWeight: 700, cursor: s.isOutOfStock ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s', fontFamily: t.fontBody,
              }}>
              {s.isOutOfStock ? 'Sold Out' : s.added ? '✓ In Your Basket' : 'Add to Basket'}
            </button>
          </div>

          {product.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
              {product.tags.map(tag => (
                <span key={tag} style={{ fontSize: '0.74rem', padding: '6px 14px', borderRadius: 999, background: t.surface, border: `1px solid ${t.border}`, color: t.subtext }}>🌿 {tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 6. Neon Streetwear — hard black, acid chips, hard-offset buttons
// ══════════════════════════════════════════════════════════════════════════════

function VoltPage(p: P) {
  const t = THEME_TOKENS.volt as ThemeTokens;
  const { product, storeSlug, currency } = p;
  const s = useProductState(product);

  const chip = (label: string, filled: boolean) => (
    <span style={{ fontSize: '0.64rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '5px 10px', background: filled ? t.accent : 'transparent', color: filled ? '#000' : t.text, border: `1px solid ${filled ? t.accent : t.border}`, marginRight: 8 }}>
      {label}
    </span>
  );

  return (
    <div style={{ maxWidth: 1160, margin: '0 auto', padding: '28px 5% 100px', background: t.bg, color: t.text, fontFamily: t.fontBody }}>
      <div style={{ background: t.accent, height: 5, marginBottom: 24 }} />
      <nav style={{ fontSize: '0.66rem', fontFamily: "'Courier New', monospace", textTransform: 'uppercase', letterSpacing: '0.1em', color: t.subtext, marginBottom: 44, display: 'flex', gap: 10 }}>
        <Link href={`/store/${storeSlug}`} style={{ color: t.accent, textDecoration: 'none' }}>Store</Link>
        <span>/</span>
        <span>{product.category}</span>
        <span>/</span>
        <span>{product.displayName}</span>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: 64, alignItems: 'start' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, transform: 'translate(14px, 14px)', border: `2px solid ${t.accent}`, pointerEvents: 'none' }} />
          <div style={{ position: 'relative', background: t.surface, border: `2px solid ${t.text}`, overflow: 'hidden' }}>
            <div style={{ aspectRatio: '4/5', position: 'relative' }}>
              <GalleryImage src={product.images[s.activeImg]} alt={product.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.05)' }} />
            </div>
            <span style={{ position: 'absolute', top: 12, left: 12, fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '6px 10px', background: t.accent2, color: '#000' }}>{s.discount ? `-${s.discount}%` : 'DROP'}</span>
            <span style={{ position: 'absolute', bottom: 12, right: 12, fontSize: '0.62rem', fontFamily: "'Courier New', monospace", color: t.subtext }}>LTD / {String(product.id).slice(0, 6).toUpperCase()}</span>
          </div>
          {product.images.length > 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 12, position: 'relative' }}>
              {product.images.map((img, i) => (
                <button key={i} onClick={() => s.setActiveImg(i)}
                  style={{ height: 76, padding: 0, border: i === s.activeImg ? `2px solid ${t.accent}` : '2px solid transparent', cursor: 'pointer', overflow: 'hidden', opacity: i === s.activeImg ? 1 : 0.5, background: t.surface, boxShadow: i === s.activeImg ? '3px 3px 0 #000' : 'none' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 8 }}>
          <div>
            <p style={{ fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: t.accent, margin: '0 0 10px', fontFamily: "'Courier New', monospace" }}>Streetwear Drop — {product.category || 'Collection'}</p>
            <h1 style={{ fontFamily: t.fontDisplay, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.01em', fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', color: t.text, margin: 0, lineHeight: 1.05 }}>{product.displayName}</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, padding: '6px 14px', background: t.accent, color: '#000', fontFamily: t.fontDisplay }}>{fmt(product.price, currency)}</span>
            {s.discount && <span style={{ fontSize: '0.95rem', color: t.subtext, textDecoration: 'line-through' }}>{fmt(product.compareAtPrice!, currency)}</span>}
          </div>

          {product.description && (
            <div className="product-rich-description" style={{ fontSize: '0.9rem', color: t.subtext, lineHeight: 1.7, fontFamily: t.fontBody, overflowWrap: 'break-word' }} dangerouslySetInnerHTML={{ __html: product.description }} />
          )}

          <div style={{ borderTop: `2px solid ${t.text}`, borderBottom: `2px solid ${t.text}`, padding: '14px 0', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
            {chip('Category', false)}
            <span style={{ fontSize: '0.74rem', color: t.text }}>{product.category || 'General'}</span>
            {product.productType === 'physical' && (
              <>
                {chip('Stock', false)}
                <span style={{ fontSize: '0.74rem', color: t.text }}>{s.isOutOfStock ? 'SOLD OUT' : `${product.stock} units`}</span>
              </>
            )}
            {product.productType === 'digital' && (
              <>
                {chip('Type', false)}
                <span style={{ fontSize: '0.74rem', color: t.text }}>DIGITAL</span>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', border: `2px solid ${t.text}` }}>
              <button onClick={() => s.setQty(Math.max(1, s.qty - 1))} aria-label="Decrease quantity" style={{ background: 'none', border: 'none', padding: '12px 15px', cursor: 'pointer', color: t.text, fontFamily: "'Courier New', monospace" }}>−</button>
              <span style={{ fontSize: '0.95rem', color: t.text, minWidth: 28, textAlign: 'center', fontFamily: "'Courier New', monospace" }}>{s.qty}</span>
              <button onClick={() => s.setQty(s.qty + 1)} aria-label="Increase quantity" style={{ background: 'none', border: 'none', padding: '12px 15px', cursor: 'pointer', color: t.text, fontFamily: "'Courier New', monospace" }}>+</button>
            </div>
            <button onClick={s.handleAdd} disabled={s.isOutOfStock}
              style={{
                flex: 1, padding: '0 26px',
                background: s.isOutOfStock ? 'transparent' : s.added ? '#1FBF6A' : t.accent,
                color: s.isOutOfStock ? t.subtext : '#000',
                border: `2px solid ${s.isOutOfStock ? t.border : 'transparent'}`,
                boxShadow: s.isOutOfStock ? 'none' : '4px 4px 0 #fff',
                fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
                fontFamily: t.fontBody, cursor: s.isOutOfStock ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
              }}>
              {s.isOutOfStock ? 'Sold Out' : s.added ? '✓ Added' : 'Add to Cart'}
            </button>
          </div>

          <p style={{ margin: 0, fontSize: '0.66rem', fontFamily: "'Courier New', monospace", color: t.subtext }}>FREE SHIPPING OVER ₦50,000 · NO RETURNS ON DROPS</p>

          {product.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {product.tags.map(tag => (
                <span key={tag} style={{ fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '6px 12px', border: `1px solid ${t.text}`, color: t.text }}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 7. Botanica — soft organic, gold ring, "good for" ingredient chips
// ══════════════════════════════════════════════════════════════════════════════

function BotanicaPage(p: P) {
  const t = THEME_TOKENS.botanica as ThemeTokens;
  const { product, storeSlug, currency } = p;
  const s = useProductState(product);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 5% 100px', background: t.bg, color: t.text, fontFamily: t.fontBody }}>
      <nav style={{ fontSize: '0.74rem', color: t.subtext, marginBottom: 36, display: 'flex', gap: 8 }}>
        <Link href={`/store/${storeSlug}`} style={{ color: t.accent, textDecoration: 'none' }}>Store</Link>
        <span>/</span>
        <span>{product.category}</span>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: 56, alignItems: 'start' }}>
        <div>
          <div style={{ borderRadius: 26, padding: 10, border: `1px solid ${t.border}` }}>
            <div style={{ aspectRatio: '4/5', borderRadius: 18, overflow: 'hidden', position: 'relative' }}>
              <GalleryImage src={product.images[s.activeImg]} alt={product.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {s.discount && (
                <span style={{ position: 'absolute', top: 16, right: 16, background: t.accent, color: '#0F2318', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', padding: '6px 14px', borderRadius: 999 }}>-{s.discount}%</span>
              )}
              {s.isOutOfStock && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,35,24,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ border: `1px solid ${t.accent}`, color: t.accent, fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '8px 18px' }}>Sold Out</span>
                </div>
              )}
            </div>
          </div>
          {product.images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {product.images.map((img, i) => (
                <button key={i} onClick={() => s.setActiveImg(i)}
                  style={{ flex: 1, height: 72, padding: 0, border: i === s.activeImg ? `2px solid ${t.accent}` : `1px solid ${t.border}`, borderRadius: 999, cursor: 'pointer', overflow: 'hidden', opacity: i === s.activeImg ? 1 : 0.5, background: t.surface }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingTop: 12 }}>
          <p style={{ fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: t.accent, margin: 0 }}>{product.category || 'Botanical Ritual'}</p>
          <h1 style={{ fontFamily: t.fontDisplay, fontWeight: 600, fontSize: 'clamp(1.8rem, 2.8vw, 2.5rem)', color: t.text, margin: 0, lineHeight: 1.15 }}>{product.displayName}</h1>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: t.accent }}>{fmt(product.price, currency)}</span>
            {s.discount && <span style={{ fontSize: '0.95rem', color: t.subtext, textDecoration: 'line-through' }}>{fmt(product.compareAtPrice!, currency)}</span>}
          </div>

          <div style={{ height: 1, background: t.border }} />

          {product.description && (
            <div className="product-rich-description" style={{ fontSize: '0.92rem', color: t.subtext, lineHeight: 1.75, overflowWrap: 'break-word' }} dangerouslySetInnerHTML={{ __html: product.description }} />
          )}

          {product.tags.length > 0 && (
            <div>
              <p style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: t.accent, margin: '0 0 10px' }}>Good for</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {product.tags.map(tag => (
                  <span key={tag} style={{ fontSize: '0.76rem', padding: '7px 16px', borderRadius: 999, background: 'rgba(216,166,103,0.12)', border: `1px solid rgba(216,166,103,0.35)`, color: t.accent }}>{tag}</span>
                ))}
              </div>
            </div>
          )}

          {product.productType === 'physical' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.86rem', color: t.subtext }}>
              <StockDot isOutOfStock={s.isOutOfStock} stock={product.stock} color={t.accent} />
              {s.isOutOfStock ? 'Sold out' : product.stock <= 5 ? `Only ${product.stock} jars remaining` : 'In stock — ready to ship'}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${t.border}`, borderRadius: 999, overflow: 'hidden', background: t.surface }}>
              <button onClick={() => s.setQty(Math.max(1, s.qty - 1))} aria-label="Decrease quantity" style={{ background: 'none', border: 'none', padding: '12px 17px', cursor: 'pointer', color: t.accent, fontSize: 16 }}>−</button>
              <span style={{ fontSize: '0.92rem', color: t.text, minWidth: 28, textAlign: 'center', fontWeight: 600 }}>{s.qty}</span>
              <button onClick={() => s.setQty(s.qty + 1)} aria-label="Increase quantity" style={{ background: 'none', border: 'none', padding: '12px 17px', cursor: 'pointer', color: t.accent, fontSize: 16 }}>+</button>
            </div>
            <button onClick={s.handleAdd} disabled={s.isOutOfStock}
              style={{
                flex: 1, padding: '0 28px', borderRadius: 999,
                background: s.isOutOfStock ? 'transparent' : s.added ? '#2E7D4F' : `linear-gradient(135deg, ${t.accent}, #C89B5A)`,
                color: s.isOutOfStock ? t.subtext : '#0F2318',
                border: s.isOutOfStock ? `1px solid ${t.border}` : 'none',
                fontSize: '0.9rem', fontWeight: 700, cursor: s.isOutOfStock ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s', fontFamily: t.fontBody,
              }}>
              {s.isOutOfStock ? 'Sold Out' : s.added ? '✓ Added to Bag' : 'Add to Bag'}
            </button>
          </div>

          <p style={{ margin: 0, fontSize: '0.72rem', color: t.subtext }}>Cruelty-free · Vegan · Recyclable packaging</p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 8. Prism Studio — gradient glass panel, floating thumbs, glowing pill CTA
// ══════════════════════════════════════════════════════════════════════════════

function PrismPage(p: P) {
  const t = THEME_TOKENS.prism as ThemeTokens;
  const { product, storeSlug, currency } = p;
  const s = useProductState(product);

  const glass = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    background: t.surface,
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: 28,
    ...extra,
  });

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 5% 96px', background: t.bg, color: t.text, fontFamily: t.fontBody, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -80, right: -60, width: 260, height: 260, borderRadius: '50%', background: t.accent2, opacity: 0.25, filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -100, left: -80, width: 300, height: 300, borderRadius: '50%', background: '#4CC9F0', opacity: 0.25, filter: 'blur(70px)', pointerEvents: 'none' }} />

      <nav style={{ fontSize: '0.72rem', color: t.subtext, marginBottom: 32, display: 'flex', gap: 8, position: 'relative', zIndex: 1 }}>
        <Link href={`/store/${storeSlug}`} style={{ color: t.accent, textDecoration: 'none' }}>Store</Link>
        <span>/</span>
        <span>{product.category}</span>
        <span>/</span>
        <span>{product.displayName}</span>
      </nav>

      <div style={glass({ padding: '22px 22px 30px', position: 'relative', zIndex: 1 })}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: 40, alignItems: 'start' }}>
          <div>
            <div style={{ borderRadius: 22, overflow: 'hidden', position: 'relative', boxShadow: '0 18px 40px rgba(0,0,0,0.28)' }}>
              <div style={{ aspectRatio: '4/5', position: 'relative' }}>
                <GalleryImage src={product.images[s.activeImg]} alt={product.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span style={{ position: 'absolute', top: 14, left: 14, background: '#fff', color: '#7B2FF7', fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.08em', padding: '6px 14px', borderRadius: 999 }}>
                {s.discount ? `-${s.discount}% OFF` : 'NEW DROP'}
              </span>
            </div>
            {product.images.length > 1 && (
              <div style={{ display: 'flex', gap: 10, marginTop: -22, paddingLeft: 14, position: 'relative' }}>
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => s.setActiveImg(i)}
                    style={{ width: 64, height: 64, padding: 3, border: i === s.activeImg ? '2px solid #fff' : '2px solid rgba(255,255,255,0.4)', borderRadius: '50%', cursor: 'pointer', overflow: 'hidden', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 6 }}>
            <p style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: t.accent2, margin: 0 }}>{product.category || 'Prism Edit'}</p>
            <h1 style={{ fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 'clamp(1.8rem, 2.8vw, 2.5rem)', color: t.text, margin: 0, lineHeight: 1.12 }}>
              {product.displayName}
            </h1>

            <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 12, width: 'fit-content' }}>
              <span style={{ fontSize: '1.55rem', fontWeight: 800, padding: '6px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.5)', color: '#fff' }}>{fmt(product.price, currency)}</span>
              {s.discount && <span style={{ fontSize: '0.95rem', color: t.subtext, textDecoration: 'line-through' }}>{fmt(product.compareAtPrice!, currency)}</span>}
            </div>

            {product.description && (
              <div className="product-rich-description" style={{ fontSize: '0.92rem', color: t.subtext, lineHeight: 1.75, overflowWrap: 'break-word' }} dangerouslySetInnerHTML={{ __html: product.description }} />
            )}

            {product.productType === 'physical' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.86rem', color: t.subtext }}>
                <StockDot isOutOfStock={s.isOutOfStock} stock={product.stock} color={t.accent2} />
                {s.isOutOfStock ? 'Sold out' : product.stock <= 5 ? `Only ${product.stock} left` : 'In stock — ships fast'}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.5)', borderRadius: 999, overflow: 'hidden', background: 'rgba(255,255,255,0.14)' }}>
                <button onClick={() => s.setQty(Math.max(1, s.qty - 1))} aria-label="Decrease quantity" style={{ background: 'none', border: 'none', padding: '12px 17px', cursor: 'pointer', color: '#fff', fontSize: 16 }}>−</button>
                <span style={{ fontSize: '0.92rem', color: '#fff', minWidth: 28, textAlign: 'center', fontWeight: 700 }}>{s.qty}</span>
                <button onClick={() => s.setQty(s.qty + 1)} aria-label="Increase quantity" style={{ background: 'none', border: 'none', padding: '12px 17px', cursor: 'pointer', color: '#fff', fontSize: 16 }}>+</button>
              </div>
              <button onClick={s.handleAdd} disabled={s.isOutOfStock}
                style={{
                  flex: 1, padding: '0 26px', borderRadius: 999, position: 'relative',
                  background: s.isOutOfStock ? 'rgba(255,255,255,0.1)' : s.added ? 'linear-gradient(135deg, #22C55E, #16A34A)' : 'linear-gradient(135deg, #FFE066, #FF8FB2)',
                  color: s.isOutOfStock ? t.subtext : '#7B2FF7',
                  border: 'none', fontSize: '0.92rem', fontWeight: 800,
                  boxShadow: s.isOutOfStock ? 'none' : '0 6px 22px rgba(255,224,102,0.45)',
                  cursor: s.isOutOfStock ? 'not-allowed' : 'pointer', transition: 'all 0.2s', fontFamily: t.fontBody,
                }}>
                {s.isOutOfStock ? 'Sold Out' : s.added ? '✓ Added to Bag' : 'Add to Bag'}
              </button>
            </div>

            {product.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {product.tags.map(tag => (
                  <span key={tag} style={{ fontSize: '0.72rem', padding: '6px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', backdropFilter: 'blur(6px)' }}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Dispatcher
// ══════════════════════════════════════════════════════════════════════════════

export function ProductPageWithTheme(p: P) {
  switch (p.themeId) {
    case 'atelier': return <AtelierPage {...p} />;
    case 'citrus': return <CitrusPage {...p} />;
    case 'nordly': return <NordlyPage {...p} />;
    case 'neotech': return <NeotechPage {...p} />;
    case 'terra': return <TerraPage {...p} />;
    case 'volt': return <VoltPage {...p} />;
    case 'botanica': return <BotanicaPage {...p} />;
    case 'prism': return <PrismPage {...p} />;
    default: return <AtelierPage {...p} />;
  }
}
