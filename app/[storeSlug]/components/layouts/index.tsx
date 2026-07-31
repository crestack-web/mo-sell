'use client';

import React, { useState } from 'react';
import { Instagram, Twitter, Youtube, Music2, MessageCircle } from 'lucide-react';
import type { ProductCardData } from '@/themes/types';

export interface CustomLink { id: string; label: string; url: string }

export interface LayoutProps {
  config: {
    storeSlug: string; storeName: string; logoUrl: string | null;
    primaryColor: string; secondaryColor: string; currency: string;
    tagline: string | null; contactEmail: string; contactPhone: string;
    paystackPublicKey: string;
  };
  bio: {
    avatarUrl: string | null | undefined; name: string; bio: string;
    socials: { platform: string; url: string }[];
    displayType: 'button' | 'callout' | 'minimal';
    backgroundType: 'solid' | 'gradient' | 'image' | 'pattern';
    backgroundValue: string;
    customLinks: CustomLink[];
    productDisplayTypes?: Record<string, 'button' | 'callout' | 'minimal'>;
  };
  visibleProducts: (ProductCardData & { description?: string; digitalFileUrl?: string | null })[];
  isLightBg: boolean; textColor: string; textColor2: string; textColor3: string;
  onProductClick: (p: ProductCardData & { description?: string; digitalFileUrl?: string | null }) => void;
}

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  instagram: React.createElement(Instagram, { size: 20 }),
  twitter: React.createElement(Twitter, { size: 20 }),
  youtube: React.createElement(Youtube, { size: 20 }),
  tiktok: React.createElement(Music2, { size: 20 }),
  whatsapp: React.createElement(MessageCircle, { size: 20 }),
};

function fmtPrice(price: number, currency: string) {
  const sym = currency === 'NGN' ? '\u20A6' : '$';
  return sym + price.toLocaleString();
}

/* eslint-disable @next/next/no-img-element */

function Avatar({ bio, config, isLightBg }: { bio: LayoutProps['bio']; config: LayoutProps['config']; isLightBg: boolean }) {
  const size = 96;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', overflow: 'hidden',
      flexShrink: 0,
      boxShadow: isLightBg ? '0 4px 20px rgba(0,0,0,0.1)' : '0 4px 20px rgba(0,0,0,0.3)',
      border: `2px solid ${config.primaryColor}44`,
    }}>
      {bio.avatarUrl ? (
        <img src={bio.avatarUrl} alt={bio.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : config.logoUrl ? (
        <img src={config.logoUrl} alt={bio.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{
          width: '100%', height: '100%',
          background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', fontWeight: 700, color: '#fff',
        }}>{bio.name.charAt(0).toUpperCase()}</div>
      )}
    </div>
  );
}

function SocialRow({ socials, isLightBg, textColor }: { socials: { platform: string; url: string }[]; isLightBg: boolean; textColor: string }) {
  if (!socials?.length) return null;
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
      {socials.map((s, i) => {
        if (!s.url) return null;
        return (
          <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: isLightBg ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: textColor, textDecoration: 'none', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {SOCIAL_ICONS[s.platform]}
          </a>
        );
      })}
    </div>
  );
}

/* ─── 1. glow ─── Centered, warm tones, rose gold */
export function GlowLayout(p: LayoutProps) {
  const { config, bio, visibleProducts, isLightBg, textColor, textColor2, textColor3, onProductClick } = p;
  return (
    <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px 32px', textAlign: 'center' }}>
      <div style={{ marginBottom: 16 }}><Avatar bio={bio} config={config} isLightBg={isLightBg} /></div>
      <h1 style={{ margin: '0 0 4px', fontSize: '1.35rem', fontWeight: 800, color: textColor }}>{bio.name}</h1>
      {bio.bio && <p style={{ margin: '0 0 20px', fontSize: '0.88rem', color: textColor2, maxWidth: 400, lineHeight: 1.6 }}>{bio.bio}</p>}
      <div style={{ marginBottom: 28 }}><SocialRow socials={bio.socials} isLightBg={isLightBg} textColor={textColor} /></div>
      <ProductList config={config} bio={bio} visibleProducts={visibleProducts} isLightBg={isLightBg} textColor={textColor} textColor2={textColor2} onProductClick={onProductClick} />
      <p style={{ marginTop: 40, fontSize: '0.68rem', color: textColor3 }}>Powered by MO Sell</p>
    </div>
  );
}

/* ─── 2. creator ─── Gradient centered with floating decorative shapes */
export function CreatorLayout(p: LayoutProps) {
  const { config, bio, visibleProducts, isLightBg, textColor, textColor2, textColor3, onProductClick } = p;
  const isDark = !isLightBg;
  return (
    <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px 32px', textAlign: 'center', position: 'relative' }}>
      <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.06)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -60, left: -30, width: 260, height: 260, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.04)', pointerEvents: 'none' }} />
      <div style={{ marginBottom: 16 }}><Avatar bio={bio} config={config} isLightBg={isLightBg} /></div>
      <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem', fontWeight: 900, color: textColor, letterSpacing: '-0.02em' }}>{bio.name}</h1>
      {bio.bio && <p style={{ margin: '0 0 20px', fontSize: '0.9rem', color: textColor2, maxWidth: 400, lineHeight: 1.6 }}>{bio.bio}</p>}
      <div style={{ marginBottom: 28 }}><SocialRow socials={bio.socials} isLightBg={isLightBg} textColor={textColor} /></div>
      <ProductList config={config} bio={bio} visibleProducts={visibleProducts} isLightBg={isLightBg} textColor={textColor} textColor2={textColor2} onProductClick={onProductClick} />
      <p style={{ marginTop: 40, fontSize: '0.68rem', color: textColor3 }}>Powered by MO Sell</p>
    </div>
  );
}

/* ─── 3. link ─── Dark centered, purple accent */
export function LinkLayout(p: LayoutProps) {
  return <GlowLayout {...p} />;
}

/* ─── 4. pulse ─── Vibrant, products as a 2-column card grid */
export function PulseLayout(p: LayoutProps) {
  const { config, bio, visibleProducts, isLightBg, textColor, textColor2, textColor3, onProductClick } = p;
  return (
    <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px 32px', textAlign: 'center' }}>
      <Avatar bio={bio} config={config} isLightBg={isLightBg} />
      <h1 style={{ margin: '12px 0 2px', fontSize: '1.3rem', fontWeight: 800, color: textColor }}>{bio.name}</h1>
      {bio.bio && <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: textColor2, maxWidth: 380, lineHeight: 1.5 }}>{bio.bio}</p>}
      <div style={{ marginBottom: 20 }}><SocialRow socials={bio.socials} isLightBg={isLightBg} textColor={textColor} /></div>
      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {visibleProducts.map(p => (
          <button key={p.id} onClick={() => onProductClick(p)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '16px 12px', borderRadius: 16, border: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255,255,255,0.12)'}`,
              background: isLightBg ? '#fff' : 'rgba(255,255,255,0.06)',
              cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {p.images?.[0] ? (
              <img src={p.images[0]} alt={p.displayName} style={{ width: '100%', height: 100, borderRadius: 10, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: 100, borderRadius: 10, background: `${config.primaryColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📦</div>
            )}
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: textColor }}>{p.displayName}</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: config.primaryColor }}>{fmtPrice(p.price, config.currency)}</span>
          </button>
        ))}
      </div>
      {bio.customLinks?.filter(cl => cl.label && cl.url).map(cl => (
        <a key={cl.id} href={cl.url} target="_blank" rel="noopener noreferrer"
          style={{ width: '100%', maxWidth: 420, marginTop: 10, padding: '12px 16px', borderRadius: 100, border: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255,255,255,0.12)'}`, background: isLightBg ? '#fff' : 'rgba(255,255,255,0.06)', color: textColor, textDecoration: 'none', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem' }}>
          {cl.label}
        </a>
      ))}
      <p style={{ marginTop: 32, fontSize: '0.68rem', color: textColor3 }}>Powered by MO Sell</p>
    </div>
  );
}

/* ─── 5. vault ─── Split: avatar/bio left, products right (desktop) */
export function VaultLayout(p: LayoutProps) {
  const { config, bio, visibleProducts, isLightBg, textColor, textColor2, textColor3, onProductClick } = p;
  return (
    <div style={{ width: '100%', maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'row', gap: 32, padding: '48px 24px 32px' }}>
      <div style={{ width: 180, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <Avatar bio={bio} config={config} isLightBg={isLightBg} />
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: textColor, textAlign: 'center' }}>{bio.name}</h2>
        {bio.bio && <p style={{ margin: 0, fontSize: '0.8rem', color: textColor2, textAlign: 'center', lineHeight: 1.5 }}>{bio.bio}</p>}
        <SocialRow socials={bio.socials} isLightBg={isLightBg} textColor={textColor} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visibleProducts.map(p => (
          <button key={p.id} onClick={() => onProductClick(p)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 14, border: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}`,
              background: isLightBg ? '#fff' : 'rgba(255,255,255,0.05)',
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = isLightBg ? '0 4px 12px rgba(0,0,0,0.06)' : '0 4px 12px rgba(0,0,0,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            {p.images?.[0] ? (
              <img src={p.images[0]} alt={p.displayName} style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 52, height: 52, borderRadius: 10, background: `${config.primaryColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📄</div>
            )}
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: textColor }}>{p.displayName}</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: textColor2 }}>{fmtPrice(p.price, config.currency)}</p>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: config.primaryColor }}>View →</span>
          </button>
        ))}
        {bio.customLinks?.filter(cl => cl.label && cl.url).map(cl => (
          <a key={cl.id} href={cl.url} target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderRadius: 14, border: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}`,
              background: isLightBg ? '#fff' : 'rgba(255,255,255,0.05)',
              color: textColor, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600,
            }}>
            {cl.label} <span style={{ color: config.primaryColor, fontSize: '0.72rem' }}>Open →</span>
          </a>
        ))}
      </div>
      <p style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', fontSize: '0.65rem', color: textColor3 }}>Powered by MO Sell</p>
    </div>
  );
}

/* ─── 6. atlas ─── Minimal text-only, simple text links */
export function AtlasLayout(p: LayoutProps) {
  const { config, bio, visibleProducts, isLightBg, textColor, textColor2, textColor3, onProductClick } = p;
  return (
    <div style={{ width: '100%', maxWidth: 500, margin: '0 auto', padding: '56px 24px 32px', textAlign: 'center' }}>
      <div style={{ margin: '0 auto 14px', width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${config.primaryColor}33` }}>
        {bio.avatarUrl ? <img src={bio.avatarUrl} alt={bio.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ width: '100%', height: '100%', background: config.primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{bio.name.charAt(0)}</div>}
      </div>
      <h2 style={{ margin: '0 0 2px', fontSize: '1.1rem', fontWeight: 700, color: textColor }}>{bio.name}</h2>
      {bio.bio && <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: textColor2 }}>{bio.bio}</p>}
      <SocialRow socials={bio.socials} isLightBg={isLightBg} textColor={textColor} />
      <div style={{ marginTop: 24, width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {visibleProducts.map(p => (
          <button key={p.id} onClick={() => onProductClick(p)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              width: '100%', padding: '12px 8px',
              border: 'none', borderBottom: `1px solid ${isLightBg ? '#f1f5f9' : 'rgba(255,255,255,0.06)'}`,
              background: 'transparent', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: textColor, fontWeight: 500 }}>{p.displayName}</span>
            <span style={{ fontSize: '0.8rem', color: textColor2 }}>{fmtPrice(p.price, config.currency)}</span>
          </button>
        ))}
        {bio.customLinks?.filter(cl => cl.label && cl.url).map(cl => (
          <a key={cl.id} href={cl.url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', width: '100%', padding: '12px 8px', borderBottom: `1px solid ${isLightBg ? '#f1f5f9' : 'rgba(255,255,255,0.06)'}`, color: textColor, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>
            {cl.label}
          </a>
        ))}
      </div>
      <p style={{ marginTop: 40, fontSize: '0.65rem', color: textColor3 }}>Powered by MO Sell</p>
    </div>
  );
}

/* ─── 7. spark ─── Tabbed products by category */
export function SparkLayout(p: LayoutProps) {
  const { config, bio, visibleProducts, isLightBg, textColor, textColor2, textColor3, onProductClick } = p;
  const [tab, setTab] = useState('all');
  const categories = [...new Set(visibleProducts.map(p => p.category).filter(Boolean))];
  const filtered = tab === 'all' ? visibleProducts : visibleProducts.filter(p => p.category === tab);
  return (
    <div style={{ width: '100%', maxWidth: 560, margin: '0 auto', padding: '40px 20px 32px', textAlign: 'center' }}>
      <Avatar bio={bio} config={config} isLightBg={isLightBg} />
      <h1 style={{ margin: '14px 0 2px', fontSize: '1.25rem', fontWeight: 800, color: textColor }}>{bio.name}</h1>
      {bio.bio && <p style={{ margin: '0 0 14px', fontSize: '0.85rem', color: textColor2 }}>{bio.bio}</p>}
      <div style={{ marginBottom: 20 }}><SocialRow socials={bio.socials} isLightBg={isLightBg} textColor={textColor} /></div>
      {categories.length > 0 && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          <button onClick={() => setTab('all')}
            style={{ padding: '6px 16px', borderRadius: 100, border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', background: tab === 'all' ? config.primaryColor : isLightBg ? '#e2e8f0' : 'rgba(255,255,255,0.1)', color: tab === 'all' ? '#fff' : textColor }}>
            All
          </button>
          {categories.map(c => (
            <button key={c} onClick={() => setTab(c)}
              style={{ padding: '6px 16px', borderRadius: 100, border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', background: tab === c ? config.primaryColor : isLightBg ? '#e2e8f0' : 'rgba(255,255,255,0.1)', color: tab === c ? '#fff' : textColor }}>
              {c}
            </button>
          ))}
        </div>
      )}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(p => (
          <button key={p.id} onClick={() => onProductClick(p)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 12, border: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}`,
              background: isLightBg ? '#fff' : 'rgba(255,255,255,0.05)',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            {p.images?.[0] ? <img src={p.images[0]} alt={p.displayName} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
            : <div style={{ width: 40, height: 40, borderRadius: 8, background: `${config.primaryColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>📄</div>}
            <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600, color: textColor }}>{p.displayName}</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: config.primaryColor }}>{fmtPrice(p.price, config.currency)}</span>
          </button>
        ))}
      </div>
      {bio.customLinks?.filter(cl => cl.label && cl.url).map(cl => (
        <a key={cl.id} href={cl.url} target="_blank" rel="noopener noreferrer"
          style={{ display: 'block', width: '100%', marginTop: 8, padding: '12px 14px', borderRadius: 12, border: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}`, background: isLightBg ? '#fff' : 'rgba(255,255,255,0.05)', color: textColor, textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
          {cl.label}
        </a>
      ))}
      <p style={{ marginTop: 32, fontSize: '0.65rem', color: textColor3 }}>Powered by MO Sell</p>
    </div>
  );
}

/* ─── 8. bazaar ─── Bento grid: varied card sizes */
export function BazaarLayout(p: LayoutProps) {
  const { config, bio, visibleProducts, isLightBg, textColor, textColor2, textColor3, onProductClick } = p;
  return (
    <div style={{ width: '100%', maxWidth: 560, margin: '0 auto', padding: '40px 20px 32px', textAlign: 'center' }}>
      <div style={{ marginBottom: 14 }}><Avatar bio={bio} config={config} isLightBg={isLightBg} /></div>
      <h1 style={{ margin: '0 0 2px', fontSize: '1.2rem', fontWeight: 800, color: textColor }}>{bio.name}</h1>
      {bio.bio && <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: textColor2, maxWidth: 380, lineHeight: 1.5 }}>{bio.bio}</p>}
      <div style={{ marginBottom: 20 }}><SocialRow socials={bio.socials} isLightBg={isLightBg} textColor={textColor} /></div>
      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
        {visibleProducts.map((p, i) => {
          const wide = i % 3 === 0;
          return (
            <button key={p.id} onClick={() => onProductClick(p)}
              style={{
                gridColumn: wide ? '1 / -1' : undefined,
                display: 'flex', flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'center' : 'stretch', gap: 10,
                padding: wide ? '14px 16px' : '14px',
                borderRadius: 16, border: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}`,
                background: isLightBg ? '#fff' : 'rgba(255,255,255,0.05)',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {p.images?.[0] ? (
                <img src={p.images[0]} alt={p.displayName} style={{ width: wide ? 56 : '100%', height: wide ? 56 : 90, borderRadius: 10, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: wide ? 56 : '100%', height: wide ? 56 : 90, borderRadius: 10, background: `${config.primaryColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>✨</div>
              )}
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: textColor }}>{p.displayName}</p>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', fontWeight: 700, color: config.primaryColor }}>{fmtPrice(p.price, config.currency)}</p>
              </div>
            </button>
          );
        })}
      </div>
      {bio.customLinks?.filter(cl => cl.label && cl.url).map(cl => (
        <a key={cl.id} href={cl.url} target="_blank" rel="noopener noreferrer"
          style={{ display: 'block', width: '100%', marginTop: 8, padding: '12px', borderRadius: 100, border: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}`, background: isLightBg ? '#fff' : 'rgba(255,255,255,0.05)', color: textColor, textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
          {cl.label}
        </a>
      ))}
      <p style={{ marginTop: 32, fontSize: '0.65rem', color: textColor3 }}>Powered by MO Sell</p>
    </div>
  );
}

/* ─── 9. abby ─── Full-width hero with profile overlay */
export function AbbyLayout(p: LayoutProps) {
  const { config, bio, visibleProducts, isLightBg, textColor, textColor2, textColor3, onProductClick } = p;
  const isDark = !isLightBg;
  return (
    <div style={{ width: '100%' }}>
      <div style={{
        width: '100%', padding: '60px 24px 48px',
        background: isDark ? `linear-gradient(135deg, #1e1b4b, ${config.primaryColor}44)` : `linear-gradient(135deg, #eff6ff, ${config.primaryColor}22)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      }}>
        <Avatar bio={bio} config={config} isLightBg={isLightBg} />
        <h1 style={{ margin: '16px 0 4px', fontSize: '2rem', fontWeight: 900, color: textColor, letterSpacing: '-0.02em' }}>{bio.name}</h1>
        {bio.bio && <p style={{ margin: '0 0 18px', fontSize: '0.95rem', color: textColor2, maxWidth: 420, lineHeight: 1.6 }}>{bio.bio}</p>}
        <SocialRow socials={bio.socials} isLightBg={isLightBg} textColor={textColor} />
      </div>
      <div style={{ width: '100%', maxWidth: 560, margin: '-20px auto 0', padding: '0 20px 32px', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', zIndex: 1 }}>
        {visibleProducts.map(p => (
          <button key={p.id} onClick={() => onProductClick(p)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', borderRadius: 16,
              background: isLightBg ? '#fff' : 'rgba(255,255,255,0.08)',
              backdropFilter: isLightBg ? 'none' : 'blur(12px)',
              border: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255,255,255,0.12)'}`,
              boxShadow: isLightBg ? '0 4px 16px rgba(0,0,0,0.06)' : '0 4px 16px rgba(0,0,0,0.2)',
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = isLightBg ? '0 8px 24px rgba(0,0,0,0.1)' : '0 8px 24px rgba(0,0,0,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {p.images?.[0] ? (
              <img src={p.images[0]} alt={p.displayName} style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: 12, background: `${config.primaryColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>📦</div>
            )}
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: textColor }}>{p.displayName}</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', fontWeight: 600, color: config.primaryColor }}>{fmtPrice(p.price, config.currency)}</p>
            </div>
            <span style={{ fontSize: '1.2rem', color: textColor2 }}>→</span>
          </button>
        ))}
        {bio.customLinks?.filter(cl => cl.label && cl.url).map(cl => (
          <a key={cl.id} href={cl.url} target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: 16,
              background: isLightBg ? '#fff' : 'rgba(255,255,255,0.08)',
              backdropFilter: isLightBg ? 'none' : 'blur(12px)',
              border: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255,255,255,0.12)'}`,
              color: textColor, textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem',
            }}>
            {cl.label} <span style={{ color: textColor2, fontSize: '1.2rem' }}>→</span>
          </a>
        ))}
      </div>
      <p style={{ textAlign: 'center', padding: '0 0 24px', fontSize: '0.65rem', color: textColor3 }}>Powered by MO Sell</p>
    </div>
  );
}

/* ─── Shared product list component ─── */

function getProductDisplayType(bio: LayoutProps['bio'], productId: string): 'button' | 'callout' | 'minimal' {
  return bio.productDisplayTypes?.[productId] ?? bio.displayType ?? 'button';
}

function StarRating({ rating, textColor2 }: { rating: number; textColor2: string }) {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ color: '#F59E0B', fontSize: '0.85rem', letterSpacing: '1px', lineHeight: 1 }}>
        {'★'.repeat(rounded)}{'☆'.repeat(5 - rounded)}
      </span>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: textColor2 }}>{rating.toFixed(1)}</span>
    </span>
  );
}

function ProductList({ config, bio, visibleProducts, isLightBg, textColor, textColor2, onProductClick }: Pick<LayoutProps, 'config' | 'bio' | 'visibleProducts' | 'isLightBg' | 'textColor' | 'textColor2' | 'onProductClick'>) {
  return (
    <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {visibleProducts.map(p => {
        const type = getProductDisplayType(bio, p.id);

        if (type === 'minimal') {
          return (
            <button key={p.id} onClick={() => onProductClick(p)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                width: '100%', padding: '10px 4px',
                border: 'none', borderBottom: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`,
                background: 'transparent', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '0.88rem', color: textColor, fontWeight: 500 }}>{p.displayName}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: textColor }}>{fmtPrice(p.price, config.currency)}</span>
            </button>
          );
        }

        if (type === 'callout') {
          return (
            <div key={p.id}
              style={{
                width: '100%', overflow: 'hidden', borderRadius: 20, textAlign: 'left',
                border: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255,255,255,0.12)'}`,
                background: isLightBg ? '#fff' : 'rgba(255,255,255,0.07)',
                boxShadow: isLightBg ? '0 4px 20px rgba(0,0,0,0.06)' : '0 4px 20px rgba(0,0,0,0.18)',
                backdropFilter: isLightBg ? 'none' : 'blur(12px)',
              }}
            >
              {p.images?.[0] ? (
                <img src={p.images[0]} alt={p.displayName} style={{ width: '100%', height: 170, objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: 170, background: `linear-gradient(135deg, ${config.primaryColor}44, ${config.secondaryColor}44)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem' }}>📦</div>
              )}
              <div style={{ padding: '16px 18px 18px' }}>
                <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: textColor, letterSpacing: '-0.01em' }}>{p.displayName}</p>
                {typeof p.rating === 'number' && p.rating > 0 && (
                  <div style={{ marginTop: 7 }}>
                    <StarRating rating={p.rating} textColor2={textColor2} />
                    {typeof p.reviewCount === 'number' && p.reviewCount > 0 && (
                      <span style={{ marginLeft: 5, fontSize: '0.75rem', color: textColor2 }}>({p.reviewCount})</span>
                    )}
                  </div>
                )}
                {p.description && (
                  <p style={{
                    margin: '8px 0 0', fontSize: '0.85rem', color: textColor2, lineHeight: 1.5,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>{p.description}</p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, gap: 10 }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: textColor, whiteSpace: 'nowrap' }}>{fmtPrice(p.price, config.currency)}</span>
                  <button onClick={() => onProductClick(p)}
                    style={{
                      padding: '9px 18px', borderRadius: 100, border: 'none', cursor: 'pointer',
                      background: config.primaryColor, color: '#fff', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap',
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                  >
                    View Product
                  </button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <button key={p.id} onClick={() => onProductClick(p)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '10px 16px', borderRadius: 100, border: 'none',
              background: isLightBg ? '#fff' : 'rgba(255,255,255,0.12)',
              color: isLightBg ? '#0f172a' : '#fff',
              cursor: 'pointer', textAlign: 'left',
              boxShadow: isLightBg ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {p.images?.[0] ? (
              <img src={p.images[0]} alt={p.displayName} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${config.primaryColor}44` }} />
            )}
            <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.displayName}</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{fmtPrice(p.price, config.currency)}</span>
          </button>
        );
      })}
      {bio.customLinks?.filter(cl => cl.label && cl.url).map(cl => {
        const linkStyle: React.CSSProperties = bio.displayType === 'minimal' ? {
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          width: '100%', padding: '10px 4px',
          border: 'none', borderBottom: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`,
          background: 'transparent', cursor: 'pointer', textAlign: 'left',
          textDecoration: 'none', color: textColor,
        } : bio.displayType === 'callout' ? {
          display: 'flex', alignItems: 'center', gap: 12,
          width: '100%', padding: 12, borderRadius: 16, border: 'none',
          background: isLightBg ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)',
          cursor: 'pointer', textAlign: 'left', backdropFilter: isLightBg ? 'none' : 'blur(10px)',
          textDecoration: 'none', color: textColor,
        } : {
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', padding: '10px 16px', borderRadius: 100, border: 'none',
          background: isLightBg ? '#fff' : 'rgba(255,255,255,0.12)',
          color: isLightBg ? '#0f172a' : '#fff',
          cursor: 'pointer', textAlign: 'left',
          boxShadow: isLightBg ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
          textDecoration: 'none',
        };
        return (
          <a key={cl.id} href={cl.url} target="_blank" rel="noopener noreferrer"
            style={linkStyle}
            onMouseEnter={e => { if (bio.displayType !== 'minimal') e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={e => { if (bio.displayType !== 'minimal') e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600 }}>{cl.label}</span>
            {bio.displayType !== 'minimal' && <span style={{ fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap' }}>Open ↗</span>}
          </a>
        );
      })}
    </div>
  );
}

/* ─── Registry ─── */
const LAYOUTS: Record<string, React.ComponentType<LayoutProps>> = {
  glow: GlowLayout,
  creator: CreatorLayout,
  link: LinkLayout,
  pulse: PulseLayout,
  vault: VaultLayout,
  atlas: AtlasLayout,
  spark: SparkLayout,
  bazaar: BazaarLayout,
  abby: AbbyLayout,
};

export function getLinkBioLayout(theme: string): React.ComponentType<LayoutProps> {
  return LAYOUTS[theme] ?? GlowLayout;
}
