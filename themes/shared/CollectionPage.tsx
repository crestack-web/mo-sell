'use client';

import React from 'react';
import Link from 'next/link';
import type { ThemeCollectionPageProps, ThemeProductCardProps } from '../types';
import { THEME_TOKENS, type ThemeTokens } from './tokens';

type P = ThemeCollectionPageProps & { themeId: string };

function Grid({ products, storeSlug, currency, ProductCard }: { products: P['products']; storeSlug: string; currency: string; ProductCard: React.ComponentType<ThemeProductCardProps> }) {
  if (products.length === 0) {
    return (
      <div style={{ padding: '56px 24px', textAlign: 'center', fontSize: '0.9rem', opacity: 0.6 }}>
        No products in this collection yet — check back soon.
      </div>
    );
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 26 }}>
      {products.map(pr => (
        <ProductCard key={pr.id} product={pr} storeSlug={storeSlug} currency={currency} />
      ))}
    </div>
  );
}

function BackLink({ storeSlug, color }: { storeSlug: string; color: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0 60px' }}>
      <Link href={`/store/${storeSlug}`} style={{ fontSize: '0.8rem', color, textDecoration: 'none', opacity: 0.8 }}>
        ← Back to all products
      </Link>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. Atelier Noir — editorial banner, serif masthead, hairline rules
// ══════════════════════════════════════════════════════════════════════════════

function AtelierCollection(p: P) {
  const t = THEME_TOKENS.atelier as ThemeTokens;
  const { collection } = p;
  return (
    <div style={{ background: t.bg, color: t.text, minHeight: '70vh', fontFamily: t.fontBody }}>
      <div style={{ height: 1, background: t.accent, opacity: 0.6 }} />
      {collection.coverImageUrl && (
        <div style={{ position: 'relative', height: 300, overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={collection.coverImageUrl} alt={collection.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,11,11,0.85) 0%, rgba(11,11,11,0.1) 60%)' }} />
        </div>
      )}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '48px 5% 24px' }}>
        <nav style={{ fontSize: '0.66rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: t.subtext, display: 'flex', gap: 10, marginBottom: 32 }}>
          <Link href={`/store/${p.storeSlug}`} style={{ color: t.accent, textDecoration: 'none' }}>Store</Link>
          <span>/</span>
          <span style={{ color: t.subtext }}>{collection.title}</span>
        </nav>
        <p style={{ fontSize: '0.62rem', letterSpacing: '0.24em', textTransform: 'uppercase', color: t.accent, margin: 0 }}>Collection</p>
        <h1 style={{ fontFamily: t.fontDisplay, fontWeight: 400, fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', color: t.text, margin: '10px 0 0', lineHeight: 1.1 }}>
          {collection.title}
        </h1>
        <div style={{ height: 1, background: '#000', boxShadow: `0 1px 0 ${t.border}`, margin: '26px 0' }} />
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          {collection.description && (
            <p style={{ fontSize: '0.92rem', color: t.subtext, lineHeight: 1.7, maxWidth: 640, margin: 0, fontStyle: 'italic' }}>{collection.description}</p>
          )}
          <span style={{ fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: t.subtext, whiteSpace: 'nowrap' }}>
            {collection.productCount != null ? `${collection.productCount} item${collection.productCount !== 1 ? 's' : ''}` : `${p.products.length} item${p.products.length !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '36px 5% 0' }}>
        <Grid products={p.products} storeSlug={p.storeSlug} currency={p.currency} ProductCard={p.ProductCard} />
      </div>
      <BackLink storeSlug={p.storeSlug} color={t.subtext} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. Citrus Market — rounded cover, playful, centered header
// ══════════════════════════════════════════════════════════════════════════════

function CitrusCollection(p: P) {
  const t = THEME_TOKENS.citrus as ThemeTokens;
  const { collection } = p;
  return (
    <div style={{ background: t.bg, color: t.text, minHeight: '70vh', fontFamily: t.fontBody }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 5% 0' }}>
        <nav style={{ fontSize: '0.8rem', color: t.subtext, display: 'flex', gap: 8, marginBottom: 24 }}>
          <Link href={`/store/${p.storeSlug}`} style={{ color: t.accent, textDecoration: 'none' }}>Store</Link>
          <span>/</span>
          <span>{collection.title}</span>
        </nav>
      </div>
      <div style={{ textAlign: 'center', padding: '0 5% 40px' }}>
        {collection.coverImageUrl && (
          <div style={{ width: 220, height: 220, borderRadius: '50%', overflow: 'hidden', border: `8px solid ${t.border}`, margin: '0 auto' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={collection.coverImageUrl} alt={collection.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: t.accent, margin: '26px 0 6px' }}>Fresh Collection</p>
        <h1 style={{ fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', color: t.text, margin: 0 }}>{collection.title}</h1>
        {collection.description && (
          <p style={{ fontSize: '0.98rem', color: t.subtext, lineHeight: 1.6, maxWidth: 520, margin: '12px auto 0' }}>{collection.description}</p>
        )}
        <span style={{ display: 'inline-block', marginTop: 14, fontSize: '0.78rem', fontWeight: 700, color: t.accent, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, padding: '6px 16px' }}>
          {collection.productCount != null ? `${collection.productCount} items` : `${p.products.length} items`}
        </span>
      </div>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 5% 0' }}>
        <Grid products={p.products} storeSlug={p.storeSlug} currency={p.currency} ProductCard={p.ProductCard} />
      </div>
      <BackLink storeSlug={p.storeSlug} color={t.subtext} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. Nordic Minimal — framed cover, hairline header, quiet grid
// ══════════════════════════════════════════════════════════════════════════════

function NordlyCollection(p: P) {
  const t = THEME_TOKENS.nordly as ThemeTokens;
  const { collection } = p;
  return (
    <div style={{ background: t.bg, color: t.text, minHeight: '70vh', fontFamily: t.fontBody }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '36px 5% 0' }}>
        <nav style={{ fontSize: '0.74rem', letterSpacing: '0.06em', color: t.subtext, display: 'flex', gap: 10, marginBottom: 36 }}>
          <Link href={`/store/${p.storeSlug}`} style={{ color: t.accent, textDecoration: 'none' }}>Store</Link>
          <span>/</span>
          <span>{collection.title}</span>
        </nav>
      </div>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 5%' }}>
        <div style={{ border: `1px solid ${t.border}`, padding: 8 }}>
          {collection.coverImageUrl ? (
            <div style={{ maxHeight: 320, overflow: 'hidden' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={collection.coverImageUrl} alt={collection.title} style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }} />
            </div>
          ) : (
            <div style={{ height: 160, background: t.surface, border: `1px solid ${t.border}` }} />
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', borderBottom: `1px solid ${t.border}`, padding: '28px 2px 22px' }}>
          <div>
            <p style={{ fontSize: '0.66rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: t.accent, margin: 0 }}>Collection</p>
            <h1 style={{ fontFamily: t.fontDisplay, fontWeight: 600, fontSize: 'clamp(1.8rem, 3.6vw, 2.6rem)', color: t.text, margin: '8px 0 0' }}>{collection.title}</h1>
          </div>
          <span style={{ fontSize: '0.82rem', color: t.subtext, whiteSpace: 'nowrap', paddingBottom: 4 }}>
            {collection.productCount != null ? `${collection.productCount} item${collection.productCount !== 1 ? 's' : ''}` : `${p.products.length} item${p.products.length !== 1 ? 's' : ''}`}
          </span>
        </div>
        {collection.description && (
          <p style={{ fontSize: '0.9rem', color: t.subtext, lineHeight: 1.7, maxWidth: 680, margin: '22px 2px 0' }}>{collection.description}</p>
        )}
      </div>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '36px 5% 0' }}>
        <Grid products={p.products} storeSlug={p.storeSlug} currency={p.currency} ProductCard={p.ProductCard} />
      </div>
      <BackLink storeSlug={p.storeSlug} color={t.subtext} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. Neo Tech — mono header, spec chips, glowing cover
// ══════════════════════════════════════════════════════════════════════════════

function NeotechCollection(p: P) {
  const t = THEME_TOKENS.neotech as ThemeTokens;
  const { collection } = p;
  const count = collection.productCount != null ? collection.productCount : p.products.length;
  return (
    <div style={{ background: t.bg, color: t.text, minHeight: '70vh', fontFamily: t.fontBody }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 5% 0' }}>
        <nav style={{ fontSize: '0.66rem', fontFamily: "'Courier New', monospace", color: t.subtext, display: 'flex', gap: 10, marginBottom: 30 }}>
          <Link href={`/store/${p.storeSlug}`} style={{ color: t.accent, textDecoration: 'none' }}>STORE</Link>
          <span>/</span>
          <span>{collection.title.toUpperCase()}</span>
        </nav>
      </div>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 5%' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', inset: -20, background: t.accent, opacity: 0.12, filter: 'blur(46px)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: `1px solid ${t.border}`, background: t.surface }}>
            {collection.coverImageUrl ? (
              <div style={{ height: 280, position: 'relative' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={collection.coverImageUrl} alt={collection.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,14,23,0.8) 0%, transparent 55%)' }} />
                <div style={{ position: 'absolute', bottom: 18, left: 20, right: 20, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontSize: '0.62rem', fontFamily: "'Courier New', monospace", color: t.accent, margin: '0 0 6px', letterSpacing: '0.14em' }}>COLLECTION // {count} ITEMS</p>
                    <h1 style={{ fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 'clamp(1.8rem, 3.6vw, 2.7rem)', color: '#fff', margin: 0 }}>{collection.title}</h1>
                  </div>
                  <span style={{ fontSize: '0.6rem', fontFamily: "'Courier New', monospace", color: t.subtext, border: `1px solid ${t.border}`, borderRadius: 6, padding: '4px 8px' }}>{p.storeSlug.toUpperCase()} / SHOP</span>
                </div>
              </div>
            ) : (
              <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <p style={{ fontSize: '0.62rem', fontFamily: "'Courier New', monospace", color: t.accent, margin: 0, letterSpacing: '0.14em' }}>COLLECTION // {count} ITEMS</p>
                <h1 style={{ fontFamily: t.fontDisplay, fontWeight: 800, fontSize: '2.2rem', color: t.text, margin: 0 }}>{collection.title}</h1>
              </div>
            )}
          </div>
        </div>
        {collection.description && (
          <p style={{ fontSize: '0.88rem', color: t.subtext, lineHeight: 1.7, maxWidth: 680, margin: '24px 0 0', fontFamily: t.fontBody }}>{collection.description}</p>
        )}
      </div>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '34px 5% 0' }}>
        <Grid products={p.products} storeSlug={p.storeSlug} currency={p.currency} ProductCard={p.ProductCard} />
      </div>
      <BackLink storeSlug={p.storeSlug} color={t.subtext} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. Terra Craft — earthy header, accent bar, rounded cover
// ══════════════════════════════════════════════════════════════════════════════

function TerraCollection(p: P) {
  const t = THEME_TOKENS.terra as ThemeTokens;
  const { collection } = p;
  return (
    <div style={{ background: t.bg, color: t.text, minHeight: '70vh', fontFamily: t.fontBody }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 5% 0' }}>
        <nav style={{ fontSize: '0.8rem', color: t.subtext, display: 'flex', gap: 8, marginBottom: 28 }}>
          <Link href={`/store/${p.storeSlug}`} style={{ color: t.accent, textDecoration: 'none' }}>Store</Link>
          <span>/</span>
          <span>{collection.title}</span>
        </nav>
      </div>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 5%' }}>
        {collection.coverImageUrl && (
          <div style={{ borderRadius: 22, overflow: 'hidden', border: `1px solid ${t.border}` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={collection.coverImageUrl} alt={collection.title} style={{ width: '100%', maxHeight: 300, objectFit: 'cover', display: 'block' }} />
          </div>
        )}
        <div style={{ padding: '30px 2px 0' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: t.accent2, margin: 0 }}>Handpicked Collection</p>
          <h1 style={{ fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 'clamp(1.9rem, 3.8vw, 2.7rem)', color: t.text, margin: '8px 0 0' }}>{collection.title}</h1>
          <div style={{ width: 64, height: 4, borderRadius: 999, background: `linear-gradient(90deg, ${t.accent}, ${t.accent2})`, marginTop: 14 }} />
          {collection.description && (
            <p style={{ fontSize: '0.92rem', color: t.subtext, lineHeight: 1.7, maxWidth: 640, margin: '16px 0 0' }}>{collection.description}</p>
          )}
          <p style={{ fontSize: '0.8rem', color: t.accent2, fontWeight: 700, margin: '14px 0 0' }}>
            {collection.productCount != null ? `${collection.productCount} pieces` : `${p.products.length} pieces`}
          </p>
        </div>
      </div>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '34px 5% 0' }}>
        <Grid products={p.products} storeSlug={p.storeSlug} currency={p.currency} ProductCard={p.ProductCard} />
      </div>
      <BackLink storeSlug={p.storeSlug} color={t.subtext} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 6. Neon Streetwear — drop banner, acid chip, thick rules
// ══════════════════════════════════════════════════════════════════════════════

function VoltCollection(p: P) {
  const t = THEME_TOKENS.volt as ThemeTokens;
  const { collection } = p;
  return (
    <div style={{ background: t.bg, color: t.text, minHeight: '70vh', fontFamily: t.fontBody }}>
      <div style={{ background: t.accent, height: 5 }} />
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '30px 5% 0' }}>
        <nav style={{ fontSize: '0.66rem', fontFamily: "'Courier New', monospace", textTransform: 'uppercase', letterSpacing: '0.1em', color: t.subtext, display: 'flex', gap: 10, marginBottom: 28 }}>
          <Link href={`/store/${p.storeSlug}`} style={{ color: t.accent, textDecoration: 'none' }}>Store</Link>
          <span>/</span>
          <span>{collection.title}</span>
        </nav>
      </div>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 5%' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, transform: 'translate(10px, 10px)', border: `2px solid ${t.accent}`, pointerEvents: 'none' }} />
          <div style={{ position: 'relative', border: `2px solid ${t.text}`, background: t.surface, overflow: 'hidden' }}>
            {collection.coverImageUrl ? (
              <div style={{ height: 280, position: 'relative' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={collection.coverImageUrl} alt={collection.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.05)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)' }} />
                <span style={{ position: 'absolute', top: 14, left: 14, fontSize: '0.66rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', padding: '6px 12px', background: t.accent, color: '#000' }}>DROP</span>
                <div style={{ position: 'absolute', bottom: 18, left: 18, right: 18, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <h1 style={{ fontFamily: t.fontDisplay, fontWeight: 800, textTransform: 'uppercase', fontSize: 'clamp(1.9rem, 4vw, 3rem)', color: '#fff', margin: 0, lineHeight: 1 }}>{collection.title}</h1>
                  <span style={{ fontSize: '0.66rem', fontFamily: "'Courier New', monospace", color: '#fff', border: `1px solid ${t.accent}`, padding: '4px 10px' }}>
                    {collection.productCount != null ? `${collection.productCount} ITEMS` : `${p.products.length} ITEMS`}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ padding: '52px 22px', borderBottom: `2px solid ${t.text}` }}>
                <span style={{ fontSize: '0.66rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', padding: '6px 12px', background: t.accent, color: '#000' }}>DROP</span>
                <h1 style={{ fontFamily: t.fontDisplay, fontWeight: 800, textTransform: 'uppercase', fontSize: 'clamp(1.9rem, 4vw, 3rem)', color: t.text, margin: '18px 0 6px' }}>{collection.title}</h1>
                <span style={{ fontSize: '0.66rem', fontFamily: "'Courier New', monospace", color: t.subtext }}>{collection.productCount != null ? `${collection.productCount} ITEMS` : `${p.products.length} ITEMS`}</span>
              </div>
            )}
          </div>
        </div>
        {collection.description && (
          <p style={{ fontSize: '0.88rem', color: t.subtext, lineHeight: 1.7, maxWidth: 640, margin: '24px 0 0', fontFamily: t.fontBody }}>{collection.description}</p>
        )}
      </div>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '34px 5% 0' }}>
        <Grid products={p.products} storeSlug={p.storeSlug} currency={p.currency} ProductCard={p.ProductCard} />
      </div>
      <BackLink storeSlug={p.storeSlug} color={t.subtext} />
      <div style={{ background: t.accent, height: 5, marginTop: 30 }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 7. Botanica — gold eyebrow, soft cover ring, gentle header
// ══════════════════════════════════════════════════════════════════════════════

function BotanicaCollection(p: P) {
  const t = THEME_TOKENS.botanica as ThemeTokens;
  const { collection } = p;
  return (
    <div style={{ background: t.bg, color: t.text, minHeight: '70vh', fontFamily: t.fontBody }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 5% 0' }}>
        <nav style={{ fontSize: '0.76rem', color: t.subtext, display: 'flex', gap: 8, marginBottom: 30 }}>
          <Link href={`/store/${p.storeSlug}`} style={{ color: t.accent, textDecoration: 'none' }}>Store</Link>
          <span>/</span>
          <span>{collection.title}</span>
        </nav>
      </div>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 5%' }}>
        <div style={{ textAlign: 'center', paddingBottom: 30 }}>
          <p style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: t.accent, margin: 0 }}>Curated Ritual</p>
          <h1 style={{ fontFamily: t.fontDisplay, fontWeight: 600, fontSize: 'clamp(1.9rem, 3.8vw, 2.8rem)', color: t.text, margin: '10px 0 0' }}>{collection.title}</h1>
          <div style={{ width: 46, height: 2, background: t.accent, opacity: 0.7, margin: '16px auto 0' }} />
          {collection.description && (
            <p style={{ fontSize: '0.92rem', color: t.subtext, lineHeight: 1.7, maxWidth: 600, margin: '16px auto 0' }}>{collection.description}</p>
          )}
          <span style={{ display: 'inline-block', marginTop: 14, fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: t.accent, border: `1px solid ${t.border}`, borderRadius: 999, padding: '6px 16px' }}>
            {collection.productCount != null ? `${collection.productCount} items` : `${p.products.length} items`}
          </span>
        </div>
        {collection.coverImageUrl && (
          <div style={{ borderRadius: 24, padding: 8, border: `1px solid ${t.border}` }}>
            <div style={{ borderRadius: 18, overflow: 'hidden' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={collection.coverImageUrl} alt={collection.title} style={{ width: '100%', maxHeight: 300, objectFit: 'cover', display: 'block' }} />
            </div>
          </div>
        )}
      </div>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '36px 5% 0' }}>
        <Grid products={p.products} storeSlug={p.storeSlug} currency={p.currency} ProductCard={p.ProductCard} />
      </div>
      <BackLink storeSlug={p.storeSlug} color={t.subtext} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 8. Prism Studio — glass header panel, gradient underline
// ══════════════════════════════════════════════════════════════════════════════

function PrismCollection(p: P) {
  const t = THEME_TOKENS.prism as ThemeTokens;
  const { collection } = p;
  const glass = {
    background: t.surface,
    backdropFilter: 'blur(14px)' as const,
    WebkitBackdropFilter: 'blur(14px)',
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: 28,
  };
  return (
    <div style={{ background: t.bg, color: t.text, minHeight: '70vh', fontFamily: t.fontBody, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -80, right: -60, width: 260, height: 260, borderRadius: '50%', background: t.accent2, opacity: 0.25, filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -100, left: -80, width: 300, height: 300, borderRadius: '50%', background: '#4CC9F0', opacity: 0.25, filter: 'blur(70px)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '30px 5% 0', position: 'relative', zIndex: 1 }}>
        <nav style={{ fontSize: '0.74rem', color: t.subtext, display: 'flex', gap: 8, marginBottom: 26 }}>
          <Link href={`/store/${p.storeSlug}`} style={{ color: t.accent, textDecoration: 'none' }}>Store</Link>
          <span>/</span>
          <span>{collection.title}</span>
        </nav>
        <div style={glass}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 26, alignItems: 'center' }}>
            {collection.coverImageUrl && (
              <div style={{ borderRadius: 20, overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={collection.coverImageUrl} alt={collection.title} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }} />
              </div>
            )}
            <div style={{ padding: collection.coverImageUrl ? '14px 18px 14px 0' : '26px' }}>
              <p style={{ fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: t.accent2, margin: 0 }}>Prism Edit</p>
              <h1 style={{ fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 'clamp(1.9rem, 3.8vw, 2.8rem)', color: '#fff', margin: '8px 0 0', lineHeight: 1.1 }}>{collection.title}</h1>
              <div style={{ width: 80, height: 4, borderRadius: 999, background: 'linear-gradient(90deg, #FFE066, #F72585, #4CC9F0)', marginTop: 14 }} />
              {collection.description && (
                <p style={{ fontSize: '0.9rem', color: t.subtext, lineHeight: 1.7, margin: '14px 0 0' }}>{collection.description}</p>
              )}
              <span style={{ display: 'inline-block', marginTop: 16, fontSize: '0.72rem', fontWeight: 700, padding: '6px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.4)' }}>
                {collection.productCount != null ? `${collection.productCount} items` : `${p.products.length} items`}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '36px 5% 0', position: 'relative', zIndex: 1 }}>
        <Grid products={p.products} storeSlug={p.storeSlug} currency={p.currency} ProductCard={p.ProductCard} />
      </div>
      <BackLink storeSlug={p.storeSlug} color={t.subtext} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Dispatcher
// ══════════════════════════════════════════════════════════════════════════════

export function CollectionPageWithTheme(p: P) {
  switch (p.themeId) {
    case 'atelier': return <AtelierCollection {...p} />;
    case 'citrus': return <CitrusCollection {...p} />;
    case 'nordly': return <NordlyCollection {...p} />;
    case 'neotech': return <NeotechCollection {...p} />;
    case 'terra': return <TerraCollection {...p} />;
    case 'volt': return <VoltCollection {...p} />;
    case 'botanica': return <BotanicaCollection {...p} />;
    case 'prism': return <PrismCollection {...p} />;
    default: return <AtelierCollection {...p} />;
  }
}
