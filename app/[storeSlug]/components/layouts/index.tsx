'use client';

import React, { useState } from 'react';
import { Instagram, Twitter, Youtube, Music2, MessageCircle } from 'lucide-react';
import type { ProductCardData } from '@/themes/types';
import { socialUrl } from '@/lib/socials';

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

function Avatar({ bio, config, theme, isLightBg, size = 96 }: { bio: LayoutProps['bio']; config: LayoutProps['config']; theme: string; isLightBg: boolean; size?: number }) {
  const initials = bio.name.charAt(0).toUpperCase();
  const base = (
    <div style={{
      width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, position: 'relative', zIndex: 2,
      background: theme === 'mono' ? 'var(--sf-accent, #FF0000)' : `linear-gradient(135deg, var(--sf-primary, ${config.primaryColor}), var(--sf-accent, ${config.primaryColor}))`,
      color: theme === 'sunset' ? '#6E3AFF' : 'var(--sf-surface, #FFFFFF)',
      border: theme === 'mono' ? '2px solid var(--sf-border, #000000)' : `2px solid var(--sf-border, ${config.primaryColor}44)`,
      boxShadow: isLightBg ? '0 4px 20px rgba(0,0,0,0.1)' : '0 4px 20px rgba(0,0,0,0.3)',
    }}>
      {bio.avatarUrl ? (
        <img src={bio.avatarUrl} alt={bio.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : config.logoUrl ? (
        <img src={config.logoUrl} alt={bio.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700 }}>{initials}</div>
      )}
    </div>
  );

  if (theme === 'midnight') {
    return (
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <div style={{ position: 'absolute', width: size + 20, height: size + 20, borderRadius: '50%', border: '1px solid var(--sf-accent, #C9A227)' }} />
        {base}
      </div>
    );
  }

  if (theme === 'neon') {
    return (
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <div style={{ position: 'absolute', width: size, height: size, borderRadius: '50%', border: '2px solid var(--sf-accent, #FF2E9A)', opacity: 0.7, transform: 'translate(4px, 4px)' }} />
        <div style={{ position: 'absolute', width: size, height: size, borderRadius: '50%', border: '2px solid var(--sf-accent-2, #00F0FF)', opacity: 0.7, transform: 'translate(-4px, -4px)' }} />
        {base}
      </div>
    );
  }

  if (theme === 'mono') {
    return (
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        {base}
        <div style={{
          position: 'absolute', top: -8, right: -14, width: 32, height: 32, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff',
          background: 'var(--sf-accent, #FF0000)', transform: 'rotate(12deg)', zIndex: 3,
        }}>{initials}</div>
      </div>
    );
  }

  if (theme === 'ankara') {
    return (
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <div style={{ position: 'absolute', width: size + 16, height: size + 16, borderRadius: '1.25rem', background: 'var(--sf-accent-2, #00A896)', transform: 'rotate(6deg)' }} />
        <div style={{ position: 'absolute', width: size + 16, height: size + 16, borderRadius: '1.25rem', background: 'var(--sf-accent, #FF3E7F)', opacity: 0.8, transform: 'rotate(-6deg)' }} />
        {base}
      </div>
    );
  }

  return <div style={{ marginBottom: 16 }}>{base}</div>;
}

function SocialRow({ socials, isLightBg, textColor }: { socials: { platform: string; url: string }[]; isLightBg: boolean; textColor: string }) {
  if (!socials?.length) return null;
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
      {socials.map((s, i) => {
        if (!s.url) return null;
        return (
          <a key={i} href={socialUrl(s.platform, s.url)} target="_blank" rel="noopener noreferrer"
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'var(--sf-surface, ' + (isLightBg ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)') + ')',
              border: '1px solid var(--sf-border, transparent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--sf-text-1, ' + textColor + ')', textDecoration: 'none', transition: 'all 0.15s',
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

/* ─── Theme specs (fonts + row radius per gallery design) ─────────────────── */

const THEME_SPEC: Record<string, { fontDisplay: string; fontBody: string; radius: number }> = {
  ankara:    { fontDisplay: "'Arial Black', Impact, sans-serif",              fontBody: "system-ui, sans-serif",              radius: 999 },
  midnight:  { fontDisplay: "Georgia, 'Times New Roman', serif",              fontBody: "system-ui, sans-serif",              radius: 12 },
  harmattan: { fontDisplay: "Georgia, serif",                                 fontBody: "'Courier New', monospace",           radius: 6 },
  neon:      { fontDisplay: "'Arial Narrow', 'Helvetica Neue', sans-serif",   fontBody: "'Courier New', monospace",           radius: 6 },
  sunset:    { fontDisplay: "Verdana, system-ui, sans-serif",                 fontBody: "system-ui, sans-serif",              radius: 999 },
  mono:      { fontDisplay: "'Helvetica Neue', Arial, sans-serif",            fontBody: "'Helvetica Neue', Arial, sans-serif", radius: 0 },
};

function getSpec(theme: string) {
  return THEME_SPEC[theme] ?? THEME_SPEC.ankara;
}

/* ─── 1. ankara — stripes ─────────────────────────────────────────────────── */

export function AnkaraLayout(p: LayoutProps) {
  const { config, bio, visibleProducts, isLightBg, textColor, textColor2, textColor3, onProductClick } = p;
  const spec = getSpec('ankara');
  return (
    <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 24px 32px', textAlign: 'center' }}>
      <div style={{
        width: '100%', height: 16, marginBottom: 48, flexShrink: 0, opacity: 0.35,
        background: 'repeating-linear-gradient(45deg, var(--sf-accent-2, #00A896) 0 10px, transparent 10px 20px)',
      }} />
      <Avatar bio={bio} config={config} theme="ankara" isLightBg={isLightBg} />
      <h1 style={{ margin: 0, fontFamily: spec.fontDisplay, fontSize: '1.5rem', fontWeight: 800, color: 'var(--sf-text-1, ' + textColor + ')' }}>{bio.name}</h1>
      <p style={{ margin: '6px 0 0', fontSize: '0.82rem', fontWeight: 600, color: 'var(--sf-text-2, ' + textColor2 + ')' }}>
        <span style={{ color: 'var(--sf-accent, ' + config.primaryColor + ')' }}>↳</span> @{config.storeSlug}
      </p>
      {bio.bio && <p style={{ margin: '14px 0 20px', fontSize: '0.88rem', color: 'var(--sf-text-2, ' + textColor2 + ')', maxWidth: 400, lineHeight: 1.6 }}>{bio.bio}</p>}
      <div style={{ marginBottom: 28 }}><SocialRow socials={bio.socials} isLightBg={isLightBg} textColor={textColor} /></div>
      <LinkRows theme="ankara" config={config} bio={bio} visibleProducts={visibleProducts} isLightBg={isLightBg} textColor={textColor} textColor2={textColor2} textColor3={textColor3} onProductClick={onProductClick} radius={spec.radius} accent={'var(--sf-accent, ' + config.primaryColor + ')'} />
      <p style={{ marginTop: 40, fontSize: '0.68rem', color: 'var(--sf-text-3, ' + textColor3 + ')' }}>@{config.storeSlug} — Powered by MO Sell</p>
    </div>
  );
}

/* ─── 2. midnight — frame ──────────────────────────────────────────────────── */

export function MidnightLayout(p: LayoutProps) {
  const { config, bio, visibleProducts, isLightBg, textColor, textColor2, textColor3, onProductClick } = p;
  const spec = getSpec('midnight');
  return (
    <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 24px 32px', textAlign: 'center' }}>
      <Avatar bio={bio} config={config} theme="midnight" isLightBg={isLightBg} size={88} />
      <h1 style={{ margin: 0, fontFamily: spec.fontDisplay, fontSize: '1.5rem', fontWeight: 600, letterSpacing: '0.01em', color: 'var(--sf-text-1, ' + textColor + ')' }}>{bio.name}</h1>
      <p style={{ margin: '6px 0 0', fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sf-accent, #C9A227)' }}>
        @{config.storeSlug}
      </p>
      {bio.bio && <p style={{ margin: '14px 0 20px', fontSize: '0.88rem', color: 'var(--sf-text-2, ' + textColor2 + ')', maxWidth: 400, lineHeight: 1.6 }}>{bio.bio}</p>}
      <div style={{ marginBottom: 28 }}><SocialRow socials={bio.socials} isLightBg={isLightBg} textColor={textColor} /></div>
      <LinkRows theme="midnight" config={config} bio={bio} visibleProducts={visibleProducts} isLightBg={isLightBg} textColor={textColor} textColor2={textColor2} textColor3={textColor3} onProductClick={onProductClick} radius={spec.radius} accent={'var(--sf-accent, #C9A227)'} />
      <p style={{ marginTop: 40, fontSize: '0.68rem', letterSpacing: '0.1em', color: 'var(--sf-text-3, ' + textColor3 + ')' }}>— @{config.storeSlug} —</p>
    </div>
  );
}

/* ─── 3. harmattan — horizon ───────────────────────────────────────────────── */

export function HarmattanLayout(p: LayoutProps) {
  const { config, bio, visibleProducts, isLightBg, textColor, textColor2, textColor3, onProductClick } = p;
  const spec = getSpec('harmattan');
  return (
    <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 24px 32px', textAlign: 'center' }}>
      <div style={{
        width: '100%', height: 6, marginBottom: 36, flexShrink: 0,
        background: 'linear-gradient(90deg, var(--sf-accent-2, #8A7A62), var(--sf-accent, #4C6B8A))',
      }} />
      <Avatar bio={bio} config={config} theme="harmattan" isLightBg={isLightBg} />
      <h1 style={{ margin: 0, fontFamily: spec.fontDisplay, fontSize: '1.6rem', fontWeight: 600, letterSpacing: '0.01em', color: 'var(--sf-text-1, ' + textColor + ')' }}>{bio.name}</h1>
      <p style={{ margin: '6px 0 0', fontSize: '0.78rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--sf-text-2, ' + textColor2 + ')' }}>
        <span style={{ color: 'var(--sf-accent, #4C6B8A)' }}>↳</span> @{config.storeSlug}
      </p>
      {bio.bio && <p style={{ margin: '14px 0 20px', fontSize: '0.88rem', color: 'var(--sf-text-2, ' + textColor2 + ')', maxWidth: 400, lineHeight: 1.6 }}>{bio.bio}</p>}
      <div style={{ marginBottom: 28 }}><SocialRow socials={bio.socials} isLightBg={isLightBg} textColor={textColor} /></div>
      <LinkRows theme="harmattan" config={config} bio={bio} visibleProducts={visibleProducts} isLightBg={isLightBg} textColor={textColor} textColor2={textColor2} textColor3={textColor3} onProductClick={onProductClick} radius={spec.radius} accent={'var(--sf-accent, #4C6B8A)'} />
      <p style={{ marginTop: 32, fontSize: '0.68rem', fontFamily: spec.fontBody, color: 'var(--sf-text-3, ' + textColor3 + ')' }}>@{config.storeSlug} · Powered by MO Sell</p>
    </div>
  );
}

/* ─── 4. neon — scan ───────────────────────────────────────────────────────── */

export function NeonLayout(p: LayoutProps) {
  const { config, bio, visibleProducts, isLightBg, textColor, textColor2, textColor3, onProductClick } = p;
  const spec = getSpec('neon');
  return (
    <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 24px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.12, pointerEvents: 'none', zIndex: 0,
        background: 'repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 3px)',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Avatar bio={bio} config={config} theme="neon" isLightBg={isLightBg} size={84} />
        <h1 style={{ margin: 0, fontFamily: spec.fontDisplay, fontSize: '1.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--sf-text-1, ' + textColor + ')' }}>{bio.name}</h1>
        <p style={{ margin: '6px 0 0', fontSize: '0.8rem', fontWeight: 600, color: 'var(--sf-accent-2, #00F0FF)' }}>@{config.storeSlug}</p>
        {bio.bio && <p style={{ margin: '14px 0 20px', fontSize: '0.88rem', color: 'var(--sf-text-2, ' + textColor2 + ')', maxWidth: 400, lineHeight: 1.6 }}>{bio.bio}</p>}
        <div style={{ marginBottom: 28 }}><SocialRow socials={bio.socials} isLightBg={isLightBg} textColor={textColor} /></div>
        <LinkRows theme="neon" config={config} bio={bio} visibleProducts={visibleProducts} isLightBg={isLightBg} textColor={textColor} textColor2={textColor2} textColor3={textColor3} onProductClick={onProductClick} radius={spec.radius} accent={'var(--sf-accent-2, #00F0FF)'} />
        <p style={{ marginTop: 40, fontSize: '0.68rem', fontFamily: spec.fontBody, color: 'var(--sf-text-3, ' + textColor3 + ')' }}>@{config.storeSlug} — Powered by MO Sell</p>
      </div>
    </div>
  );
}

/* ─── 5. sunset — blobs ────────────────────────────────────────────────────── */

export function SunsetLayout(p: LayoutProps) {
  const { config, bio, visibleProducts, isLightBg, textColor, textColor2, textColor3, onProductClick } = p;
  const spec = getSpec('sunset');
  return (
    <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 24px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -60, left: -40, width: 170, height: 170, borderRadius: '50%', background: 'var(--sf-accent-2, #FFD24C)', opacity: 0.55, filter: 'blur(48px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 80, right: -60, width: 150, height: 150, borderRadius: '50%', background: '#6E3AFF', opacity: 0.55, filter: 'blur(48px)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Avatar bio={bio} config={config} theme="sunset" isLightBg={isLightBg} />
        <h1 style={{ margin: 0, fontFamily: spec.fontDisplay, fontSize: '1.6rem', fontWeight: 700, color: 'var(--sf-text-1, ' + textColor + ')' }}>{bio.name}</h1>
        <p style={{ margin: '6px 0 0', fontSize: '0.82rem', fontWeight: 600, color: 'var(--sf-text-2, ' + textColor2 + ')' }}>
          <span style={{ color: 'var(--sf-accent-2, #FFD24C)' }}>↳</span> @{config.storeSlug}
        </p>
        {bio.bio && <p style={{ margin: '14px 0 20px', fontSize: '0.88rem', color: 'var(--sf-text-2, ' + textColor2 + ')', maxWidth: 400, lineHeight: 1.6 }}>{bio.bio}</p>}
        <div style={{ marginBottom: 28 }}><SocialRow socials={bio.socials} isLightBg={isLightBg} textColor={textColor} /></div>
        <LinkRows theme="sunset" config={config} bio={bio} visibleProducts={visibleProducts} isLightBg={isLightBg} textColor={textColor} textColor2={textColor2} textColor3={textColor3} onProductClick={onProductClick} radius={spec.radius} accent={'var(--sf-accent, #FFFFFF)'} />
        <p style={{ marginTop: 40, fontSize: '0.68rem', color: 'var(--sf-text-3, ' + textColor3 + ')' }}>@{config.storeSlug} — Powered by MO Sell</p>
      </div>
    </div>
  );
}

/* ─── 6. mono — stamp ──────────────────────────────────────────────────────── */

export function MonoLayout(p: LayoutProps) {
  const { config, bio, visibleProducts, isLightBg, textColor, textColor2, textColor3, onProductClick } = p;
  const spec = getSpec('mono');
  return (
    <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 24px 32px', textAlign: 'center' }}>
      <Avatar bio={bio} config={config} theme="mono" isLightBg={isLightBg} size={88} />
      <h1 style={{ margin: 0, fontFamily: spec.fontDisplay, fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.01em', color: 'var(--sf-text-1, ' + textColor + ')' }}>{bio.name}</h1>
      <p style={{ margin: '6px 0 0', fontSize: '0.75rem', fontWeight: 600, color: 'var(--sf-text-2, ' + textColor2 + ')' }}>@{config.storeSlug}</p>
      {bio.bio && <p style={{ margin: '14px 0 20px', fontSize: '0.88rem', color: 'var(--sf-text-2, ' + textColor2 + ')', maxWidth: 400, lineHeight: 1.6 }}>{bio.bio}</p>}
      <div style={{ marginBottom: 28 }}><SocialRow socials={bio.socials} isLightBg={isLightBg} textColor={textColor} /></div>
      <LinkRows theme="mono" config={config} bio={bio} visibleProducts={visibleProducts} isLightBg={isLightBg} textColor={textColor} textColor2={textColor2} textColor3={textColor3} onProductClick={onProductClick} radius={spec.radius} accent={'var(--sf-accent, #FF0000)'} />
      <p style={{ marginTop: 40, fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--sf-text-3, ' + textColor3 + ')' }}>@{config.storeSlug} · MO SELL</p>
    </div>
  );
}

/* ─── Shared rows ─────────────────────────────────────────────────────────── */

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
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--sf-text-2, ' + textColor2 + ')' }}>{rating.toFixed(1)}</span>
    </span>
  );
}

interface RowsProps extends Pick<LayoutProps, 'config' | 'bio' | 'visibleProducts' | 'isLightBg' | 'textColor' | 'textColor2' | 'textColor3' | 'onProductClick'> {
  theme: string;
  radius: number;
  accent: string;
}

function LinkRows({ theme, config, bio, visibleProducts, isLightBg, textColor, textColor2, textColor3, onProductClick, radius, accent }: RowsProps) {
  const surface = 'var(--sf-surface, ' + (isLightBg ? '#FFFFFF' : 'rgba(255,255,255,0.08)') + ')';
  const border = 'var(--sf-border, ' + (isLightBg ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)') + ')';
  const radiusPx = radius >= 999 ? 999 : radius;

  const isAnkara = theme === 'ankara';
  const isMidnight = theme === 'midnight';
  const isHarmattan = theme === 'harmattan';
  const isNeon = theme === 'neon';
  const isSunset = theme === 'sunset';
  const isMono = theme === 'mono';

  function buttonRowStyle(index: number): React.CSSProperties {
    const base: React.CSSProperties = {
      display: 'flex', alignItems: 'center', gap: 10,
      width: '100%', padding: '10px 16px', cursor: 'pointer', textAlign: 'left',
      color: 'var(--sf-text-1, ' + textColor + ')',
      transition: 'all 0.15s',
    };

    if (isMono) {
      return { ...base, borderRadius: 0, border: '2px solid var(--sf-border, #000000)', background: 'var(--sf-surface, #FFFFFF)' };
    }
    if (isAnkara) {
      return {
        ...base,
        borderRadius: radiusPx, border: 'none',
        background: index % 2 === 1 ? 'var(--sf-accent-2, #00A896)' : 'var(--sf-accent, #FF3E7F)',
        color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      };
    }
    if (isHarmattan) {
      return { ...base, borderRadius: 0, border: 'none', borderBottom: '1px solid var(--sf-border, #D8CFB8)', background: 'transparent', padding: '10px 4px' };
    }
    if (isMidnight) {
      return { ...base, borderRadius: radiusPx, border: '1px solid var(--sf-border, #C9A227)', background: 'var(--sf-surface, rgba(255,255,255,0.06))' };
    }
    if (isNeon) {
      return { ...base, borderRadius: radiusPx, border: '1px solid var(--sf-border, #00F0FF)', background: 'var(--sf-surface, #111111)', padding: '12px 14px' };
    }
    if (isSunset) {
      return { ...base, borderRadius: radiusPx, border: '1px solid var(--sf-border, rgba(255,255,255,0.45))', background: 'var(--sf-surface, rgba(255,255,255,0.14))', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' };
    }
    return { ...base, borderRadius: radiusPx, border: `1px solid ${border}`, background: surface };
  }

  function buttonLabelStyle(): React.CSSProperties {
    const base: React.CSSProperties = { flex: 1, fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
    if (isNeon) return { ...base, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.03em', fontFamily: "'Arial Narrow','Helvetica Neue',sans-serif", fontWeight: 700 };
    if (isMono) return { ...base, textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 700 };
    if (isMidnight || isHarmattan) return { ...base, fontFamily: "Georgia, serif", fontWeight: 600 };
    return base;
  }

  function buttonPriceStyle(): React.CSSProperties {
    const base: React.CSSProperties = { fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap' };
    if (isAnkara) return { ...base, color: '#fff' };
    if (isNeon) return { ...base, color: 'var(--sf-accent-2, #00F0FF)' };
    return { ...base, color: accent };
  }

  const listSurface = isSunset ? 'var(--sf-surface, rgba(255,255,255,0.14))' : surface;

  const calloutPriceBase: React.CSSProperties = { fontSize: '1.1rem', fontWeight: 800, whiteSpace: 'nowrap' };
  function calloutPriceStyle() {
    if (isAnkara) return { ...calloutPriceBase, color: '#fff' };
    if (isNeon) return { ...calloutPriceBase, color: 'var(--sf-accent-2, #00F0FF)' };
    return { ...calloutPriceBase, color: accent };
  }
  const calloutBtnBase: React.CSSProperties = {
    padding: '9px 18px', borderRadius: isMono ? 0 : 100, border: 'none', cursor: 'pointer',
    background: accent, color: '#fff', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap',
    transition: 'opacity 0.15s',
  };

  return (
    <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: isHarmattan ? 0 : 12 }}>
      {visibleProducts.map((p, i) => {
        const type = getProductDisplayType(bio, p.id);

        if (type === 'minimal') {
          return (
            <button key={p.id} onClick={() => onProductClick(p)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                width: '100%', padding: '10px 4px',
                border: 'none', borderBottom: `1px solid ${border}`,
                background: 'transparent', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '0.88rem', color: 'var(--sf-text-1, ' + textColor + ')', fontWeight: 500 }}>{p.displayName}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: accent }}>{fmtPrice(p.price, config.currency)}</span>
            </button>
          );
        }

        if (type === 'callout') {
          return (
            <div key={p.id}
              style={{
                width: '100%', overflow: 'hidden', borderRadius: radiusPx, textAlign: 'left',
                border: isMono ? '2px solid var(--sf-border, #000000)' : isHarmattan ? 'none' : `1px solid ${isNeon ? 'var(--sf-border, #00F0FF)' : isMidnight ? 'var(--sf-border, #C9A227)' : isSunset ? 'var(--sf-border, rgba(255,255,255,0.45))' : border}`,
                background: isHarmattan ? 'transparent' : listSurface,
                backdropFilter: isSunset ? 'blur(6px)' : 'none',
                boxShadow: isSunset ? '0 8px 28px rgba(0,0,0,0.16)' : (isLightBg ? '0 4px 20px rgba(0,0,0,0.06)' : '0 4px 20px rgba(0,0,0,0.18)'),
              }}
            >
              {p.images?.[0] ? (
                <img src={p.images[0]} alt={p.displayName} style={{ width: '100%', height: 170, objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: 170, background: `linear-gradient(135deg, var(--sf-primary, ${config.primaryColor})33, var(--sf-accent, ${config.primaryColor})33)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem' }}>📦</div>
              )}
              <div style={{ padding: '16px 18px 18px' }}>
                <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--sf-text-1, ' + textColor + ')', letterSpacing: '-0.01em', ...(isNeon || isMono ? { textTransform: 'uppercase' } : {}) }}>{p.displayName}</p>
                {typeof p.rating === 'number' && p.rating > 0 && (
                  <div style={{ marginTop: 7 }}>
                    <StarRating rating={p.rating} textColor2={textColor2} />
                    {typeof p.reviewCount === 'number' && p.reviewCount > 0 && (
                      <span style={{ marginLeft: 5, fontSize: '0.75rem', color: 'var(--sf-text-2, ' + textColor2 + ')' }}>({p.reviewCount})</span>
                    )}
                  </div>
                )}
                {p.description && (
                  <p style={{
                    margin: '8px 0 0', fontSize: '0.85rem', color: 'var(--sf-text-2, ' + textColor2 + ')', lineHeight: 1.5,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>{p.description}</p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, gap: 10 }}>
                  <span style={calloutPriceStyle()}>{fmtPrice(p.price, config.currency)}</span>
                  <button onClick={() => onProductClick(p)} style={calloutBtnBase}
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
            style={buttonRowStyle(i)}
            onMouseEnter={e => { if (!isHarmattan) e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={e => { if (!isHarmattan) e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {p.images?.[0] ? (
              <img src={p.images[0]} alt={p.displayName} style={{ width: 36, height: 36, borderRadius: isMono ? 0 : '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: isMono ? 0 : '50%', background: `var(--sf-primary, ${config.primaryColor})44`, flexShrink: 0 }} />
            )}
            <span style={buttonLabelStyle()}>{p.displayName}</span>
            <span style={buttonPriceStyle()}>{fmtPrice(p.price, config.currency)}</span>
          </button>
        );
      })}
      {bio.customLinks?.filter(cl => cl.label && cl.url).map(cl => {
        const linkStyle: React.CSSProperties = bio.displayType === 'minimal' ? {
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          width: '100%', padding: '10px 4px',
          border: 'none', borderBottom: `1px solid ${border}`,
          background: 'transparent', cursor: 'pointer', textAlign: 'left',
          textDecoration: 'none', color: 'var(--sf-text-1, ' + textColor + ')',
        } : bio.displayType === 'callout' ? {
          display: 'flex', alignItems: 'center', gap: 12,
          width: '100%', padding: 12, borderRadius: radiusPx, border: `1px solid ${border}`,
          background: surface,
          cursor: 'pointer', textAlign: 'left',
          textDecoration: 'none', color: 'var(--sf-text-1, ' + textColor + ')',
        } : buttonRowStyle(0);
        return (
          <a key={cl.id} href={cl.url} target="_blank" rel="noopener noreferrer"
            style={linkStyle}
            onMouseEnter={e => { if (bio.displayType !== 'minimal' && !isHarmattan) e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={e => { if (bio.displayType !== 'minimal' && !isHarmattan) e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600, ...(isNeon || isMono ? { textTransform: 'uppercase' } : {}) }}>{cl.label}</span>
            {bio.displayType !== 'minimal' && <span style={{ fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap', color: isAnkara ? '#fff' : accent }}>Open ↗</span>}
          </a>
        );
      })}
    </div>
  );
}

/* ─── New link-style themes (fixed page structure) ────────────────────────── */

interface LinkItem {
  key: string;
  label: string;
  sub: string;
  product?: ProductCardData & { description?: string; digitalFileUrl?: string | null };
  url?: string;
}

function buildLinkItems(p: LayoutProps): LinkItem[] {
  const { config, bio, visibleProducts } = p;
  return [
    ...visibleProducts.map(pd => ({ key: 'p_' + pd.id, label: pd.displayName, sub: fmtPrice(pd.price, config.currency), product: pd })),
    ...bio.customLinks.filter(cl => cl.label && cl.url).map(cl => ({ key: 'cl_' + cl.id, label: cl.label, sub: 'Open ↗', url: cl.url })),
  ];
}

function Tile({ item, onProductClick, children, style }: {
  item: LinkItem;
  onProductClick: LayoutProps['onProductClick'];
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  if (item.url) {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ ...style, cursor: 'pointer' }}>
        {children}
      </a>
    );
  }
  return (
    <div onClick={() => item.product && onProductClick(item.product)} style={{ ...style, cursor: 'pointer' }}>
      {children}
    </div>
  );
}

function LinkBioDeco({ theme }: { theme: string }) {
  const fill: React.CSSProperties = { position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 };
  if (theme === 'rose') {
    return (
      <>
        <div style={{ position: 'absolute', top: 24, left: 24, right: 24, height: 1, background: 'var(--sf-accent, #C97B8B)', opacity: 0.5, pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: 32, left: 40, right: 40, height: 1, background: 'var(--sf-accent, #C97B8B)', opacity: 0.25, pointerEvents: 'none', zIndex: 0 }} />
      </>
    );
  }
  if (theme === 'pearl') {
    return <div style={{ ...fill, opacity: 0.4, background: 'repeating-linear-gradient(115deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 2px, transparent 2px, transparent 18px)' }} />;
  }
  if (theme === 'cherry') {
    return <div style={{ ...fill, opacity: 0.25, backgroundImage: 'radial-gradient(#fff 1.5px, transparent 1.5px)', backgroundSize: '14px 14px' }} />;
  }
  if (theme === 'quiet') {
    return <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--sf-accent, #B08968)', opacity: 0.5, pointerEvents: 'none', zIndex: 0 }} />;
  }
  if (theme === 'concrete') {
    return <div style={{ ...fill, opacity: 0.5, backgroundImage: 'linear-gradient(var(--sf-border, #D4D1C8) 1px, transparent 1px), linear-gradient(90deg, var(--sf-border, #D4D1C8) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />;
  }
  if (theme === 'chrome') {
    return <div style={{ ...fill, opacity: 0.1, background: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)' }} />;
  }
  return null;
}

/* ─── 7. blush — soft grid layout ─────────────────────────────────────────── */

export function BlushLayout(p: LayoutProps) {
  const { config, bio, textColor, textColor2, textColor3, onProductClick } = p;
  const items = buildLinkItems(p);
  return (
    <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '48px 24px 32px', gap: 14 }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', width: 96, height: 96, borderRadius: '50%', border: '1px solid var(--sf-accent, #D88C9A)' }} />
        <Avatar bio={bio} config={config} theme="blush" isLightBg={true} size={80} />
      </div>
      <h1 style={{ margin: 0, fontFamily: 'var(--sf-font, Georgia, serif)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--sf-text-1, ' + textColor + ')' }}>{bio.name}</h1>
      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--sf-text-2, ' + textColor2 + ')' }}>{bio.bio || ('@' + config.storeSlug)}</p>
      <div><SocialRow socials={bio.socials} isLightBg={true} textColor={textColor} /></div>
      {items.length > 0 && (
        <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
          {items.map(item => (
            <Tile key={item.key} item={item} onProductClick={onProductClick} style={{ background: 'var(--sf-surface, #FFFFFF)', border: '1px solid var(--sf-border, #F4D4DA)', borderRadius: 'var(--sf-radius, 16px)', padding: '12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textDecoration: 'none', color: 'inherit' }}>
              {item.product?.images?.[0]
                ? <img src={item.product.images[0]} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                : <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--sf-accent-2, #E8B4BC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--sf-text-1, #4A2E35)' }}>✦</span>}
              <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, lineHeight: 1.25, color: 'var(--sf-text-1, ' + textColor + ')' }}>{item.label}</span>
              <span style={{ display: 'block', fontSize: '0.62rem', color: 'var(--sf-text-2, ' + textColor2 + ')' }}>{item.sub}</span>
            </Tile>
          ))}
        </div>
      )}
      <p style={{ marginTop: 8, fontSize: '0.68rem', color: 'var(--sf-text-3, ' + textColor3 + ')' }}>@{config.storeSlug} — Powered by MO Sell</p>
    </div>
  );
}

/* ─── 8. rose — masthead + numbered index ─────────────────────────────────── */

export function RoseLayout(p: LayoutProps) {
  const { config, bio, textColor, textColor2, textColor3, onProductClick } = p;
  const items = buildLinkItems(p);
  return (
    <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18, padding: '56px 24px 32px', position: 'relative', overflow: 'hidden' }}>
      <LinkBioDeco theme="rose" />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ textAlign: 'center', paddingTop: 8 }}>
          <p style={{ margin: 0, fontFamily: 'var(--sf-font, Georgia, serif)', fontSize: '22px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1, color: 'var(--sf-text-1, ' + textColor + ')' }}>{bio.name}</p>
          <p style={{ margin: '8px 0 0', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--sf-text-2, ' + textColor2 + ')' }}>{bio.bio || ('@' + config.storeSlug)}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <Avatar bio={bio} config={config} theme="rose" isLightBg={false} size={36} />
          <SocialRow socials={bio.socials} isLightBg={false} textColor={textColor} />
        </div>
        {items.length > 0 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            {items.map((item, i) => (
              <Tile key={item.key} item={item} onProductClick={onProductClick} style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--sf-border, #3A2E31)', textDecoration: 'none', color: 'inherit' }}>
                <span style={{ fontSize: 9, color: 'var(--sf-accent, #C97B8B)', fontFamily: 'system-ui, sans-serif' }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ flex: 1, textAlign: 'left' }}>
                  <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sf-text-1, ' + textColor + ')', fontFamily: 'var(--sf-font, Georgia, serif)' }}>{item.label}</span>
                  <span style={{ display: 'block', fontSize: 9, marginTop: 2, color: 'var(--sf-text-2, ' + textColor2 + ')' }}>{item.sub}</span>
                </span>
              </Tile>
            ))}
          </div>
        )}
        <p style={{ margin: 0, textAlign: 'center', fontSize: '0.68rem', color: 'var(--sf-text-3, ' + textColor3 + ')' }}>— @{config.storeSlug} —</p>
      </div>
    </div>
  );
}

/* ─── 9. pearl — glass hero + floating tile grid ──────────────────────────── */

export function PearlLayout(p: LayoutProps) {
  const { config, bio, textColor, textColor2, textColor3, onProductClick } = p;
  const items = buildLinkItems(p);
  return (
    <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '56px 24px 32px', position: 'relative', overflow: 'hidden' }}>
      <LinkBioDeco theme="pearl" />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <div style={{ borderRadius: 'var(--sf-radius-lg, 24px)', padding: '52px 16px 16px', textAlign: 'center', background: 'var(--sf-surface, rgba(255,255,255,0.4))', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid var(--sf-border, rgba(255,255,255,0.6))' }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--sf-text-1, ' + textColor + ')', fontFamily: 'var(--sf-font, Verdana, sans-serif)' }}>{bio.name}</p>
            <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--sf-text-2, ' + textColor2 + ')' }}>{bio.bio || ('@' + config.storeSlug)}</p>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}><SocialRow socials={bio.socials} isLightBg={true} textColor={textColor} /></div>
          </div>
          <div style={{ position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)' }}>
            <Avatar bio={bio} config={config} theme="pearl" isLightBg={true} size={64} />
          </div>
        </div>
        {items.length > 0 && (
          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {items.map(item => (
              <Tile key={item.key} item={item} onProductClick={onProductClick} style={{ borderRadius: 'var(--sf-radius, 16px)', padding: 14, display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--sf-surface, rgba(255,255,255,0.4))', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid var(--sf-border, rgba(255,255,255,0.6))', textDecoration: 'none', color: 'inherit' }}>
                {item.product?.images?.[0]
                  ? <img src={item.product.images[0]} alt="" style={{ width: 20, height: 20, borderRadius: 6, objectFit: 'cover' }} />
                  : <span style={{ fontSize: 14, lineHeight: 1 }}>✦</span>}
                <span style={{ display: 'block', fontSize: '9.5px', fontWeight: 600, lineHeight: 1.3, marginTop: 2, color: 'var(--sf-text-1, ' + textColor + ')', fontFamily: 'var(--sf-font, Verdana, sans-serif)' }}>{item.label}</span>
                <span style={{ display: 'block', fontSize: 8, color: 'var(--sf-text-2, ' + textColor2 + ')' }}>{item.sub}</span>
              </Tile>
            ))}
          </div>
        )}
        <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--sf-text-3, ' + textColor3 + ')' }}>@{config.storeSlug} — Powered by MO Sell</p>
      </div>
    </div>
  );
}

/* ─── 10. cherry — asymmetric sticker collage ─────────────────────────────── */

export function CherryLayout(p: LayoutProps) {
  const { config, bio, textColor, textColor3, onProductClick } = p;
  const items = buildLinkItems(p);
  const rotations = [-2, 1.5, -1, 2];
  const socials = bio.socials.filter(s => s.url);
  return (
    <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, padding: '56px 24px 32px', position: 'relative', overflow: 'hidden' }}>
      <LinkBioDeco theme="cherry" />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ transform: 'rotate(-6deg)' }}><Avatar bio={bio} config={config} theme="cherry" isLightBg={false} size={56} /></div>
          <div style={{ paddingTop: 4, textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.1, color: '#FFFFFF', fontFamily: 'var(--sf-font, Arial Black, Impact, sans-serif)' }}>{bio.name}</p>
            <p style={{ margin: '6px 0 0', fontSize: 10, color: '#FFFFFF', opacity: 0.8 }}>{bio.bio || ('@' + config.storeSlug)}</p>
          </div>
        </div>
        {socials.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            {socials.map((s, i) => (
              <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(' + (i % 2 === 0 ? -8 : 8) + 'deg)' }}>
                {SOCIAL_ICONS[s.platform]}
              </div>
            ))}
          </div>
        )}
        {items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
            {items.map((item, i) => (
              <Tile key={item.key} item={item} onProductClick={onProductClick} style={{ borderRadius: 16, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, background: '#FFFFFF', transform: 'rotate(' + rotations[i % rotations.length] + 'deg)', boxShadow: '0 3px 0 #C81E45', textDecoration: 'none', color: 'inherit' }}>
                {item.product?.images?.[0]
                  ? <img src={item.product.images[0]} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
                  : <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#FFD400', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>✦</span>}
                <span style={{ flex: 1, textAlign: 'left' }}>
                  <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#1A1A1A', fontFamily: 'var(--sf-font, Arial Black, Impact, sans-serif)' }}>{item.label}</span>
                  <span style={{ display: 'block', fontSize: 9, color: '#1A1A1A', opacity: 0.55 }}>{item.sub}</span>
                </span>
              </Tile>
            ))}
          </div>
        )}
        <p style={{ margin: 0, textAlign: 'center', fontSize: '0.68rem', color: 'var(--sf-text-3, ' + textColor3 + ')' }}>@{config.storeSlug} — Powered by MO Sell</p>
      </div>
    </div>
  );
}

/* ─── 11. quiet — left-aligned minimal list ───────────────────────────────── */

export function QuietLayout(p: LayoutProps) {
  const { config, bio, textColor, textColor2, textColor3, onProductClick } = p;
  const items = buildLinkItems(p);
  const socials = bio.socials.filter(s => s.url);
  const initials = bio.name.charAt(0).toUpperCase();
  return (
    <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28, padding: '56px 24px 32px', position: 'relative' }}>
      <LinkBioDeco theme="quiet" />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, border: '1px solid var(--sf-accent, #B08968)', color: 'var(--sf-accent, #B08968)', fontFamily: 'var(--sf-font, Helvetica Neue, sans-serif)' }}>{initials}</div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--sf-text-1, ' + textColor + ')', fontFamily: 'var(--sf-font, Helvetica Neue, sans-serif)' }}>{bio.name}</p>
            <p style={{ margin: 0, fontSize: 10, color: 'var(--sf-text-2, ' + textColor2 + ')' }}>{bio.bio || ('@' + config.storeSlug)}</p>
          </div>
        </div>
        {items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {items.map((item, i) => (
              <Tile key={item.key} item={item} onProductClick={onProductClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--sf-border, #2A2A2A)', textDecoration: 'none', color: 'inherit' }}>
                <span style={{ textAlign: 'left' }}>
                  <span style={{ display: 'block', fontSize: 9, color: 'var(--sf-accent, #B08968)' }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 500, color: 'var(--sf-text-1, ' + textColor + ')', fontFamily: 'var(--sf-font, Helvetica Neue, sans-serif)' }}>{item.label}</span>
                </span>
                <span style={{ fontSize: 9, color: 'var(--sf-text-2, ' + textColor2 + ')' }}>{item.sub}</span>
              </Tile>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '9.5px', color: 'var(--sf-text-2, ' + textColor2 + ')' }}>
          {socials.length > 0
            ? socials.map((s, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <a href={socialUrl(s.platform, s.url)} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>{s.platform}</a>
                  {i < socials.length - 1 && <span>·</span>}
                </span>
              ))
            : <span>@{config.storeSlug}</span>}
        </div>
        <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--sf-text-3, ' + textColor3 + ')' }}>@{config.storeSlug} — Powered by MO Sell</p>
      </div>
    </div>
  );
}

/* ─── 12. concrete — header row + block grid ──────────────────────────────── */

export function ConcreteLayout(p: LayoutProps) {
  const { config, bio, textColor, textColor2, textColor3, onProductClick } = p;
  const items = buildLinkItems(p);
  const socials = bio.socials.filter(s => s.url);
  const initials = bio.name.charAt(0).toUpperCase();
  return (
    <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, padding: '56px 24px 32px', position: 'relative', overflow: 'hidden' }}>
      <LinkBioDeco theme="concrete" />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--sf-border, #D4D1C8)' }}>
          <div style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, background: 'var(--sf-accent, #8C8A82)', color: '#FFFFFF', fontFamily: 'var(--sf-font, Arial, sans-serif)', border: '2px solid var(--sf-text-1, #2B2A28)' }}>{initials}</div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--sf-text-1, ' + textColor + ')', fontFamily: 'var(--sf-font, Arial, sans-serif)' }}>{bio.name}</p>
            <p style={{ margin: 0, fontSize: '9.5px', fontFamily: 'Courier New, monospace', color: 'var(--sf-text-2, ' + textColor2 + ')' }}>{bio.bio || ('@' + config.storeSlug)}</p>
          </div>
        </div>
        {items.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid var(--sf-border, #D4D1C8)' }}>
            {items.map((item, i) => (
              <Tile key={item.key} item={item} onProductClick={onProductClick} style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8, borderRight: i % 2 === 0 ? '1px solid var(--sf-border, #D4D1C8)' : 'none', borderBottom: i < 2 ? '1px solid var(--sf-border, #D4D1C8)' : 'none', textDecoration: 'none', color: 'inherit' }}>
                {item.product?.images?.[0]
                  ? <img src={item.product.images[0]} alt="" style={{ width: 18, height: 18, objectFit: 'cover' }} />
                  : <span style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>◆</span>}
                <span style={{ display: 'block', fontSize: '9.5px', fontWeight: 600, textTransform: 'uppercase', lineHeight: 1.25, color: 'var(--sf-text-1, ' + textColor + ')', fontFamily: 'var(--sf-font, Arial, sans-serif)' }}>{item.label}</span>
                <span style={{ display: 'block', fontSize: 8, fontFamily: 'Courier New, monospace', color: 'var(--sf-text-2, ' + textColor2 + ')' }}>{item.sub}</span>
              </Tile>
            ))}
          </div>
        )}
        {socials.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '10px 0', border: '1px solid var(--sf-border, #D4D1C8)' }}>
            {socials.map((s, i) => <span key={i}>{SOCIAL_ICONS[s.platform]}</span>)}
          </div>
        )}
        <p style={{ margin: 0, textAlign: 'center', fontSize: '0.68rem', fontFamily: 'Courier New, monospace', color: 'var(--sf-text-3, ' + textColor3 + ')' }}>@{config.storeSlug} — Powered by MO Sell</p>
      </div>
    </div>
  );
}

/* ─── 13. chrome — HUD list, offset rows ──────────────────────────────────── */

export function ChromeLayout(p: LayoutProps) {
  const { config, bio, textColor, textColor2, textColor3, onProductClick } = p;
  const items = buildLinkItems(p);
  const socials = bio.socials.filter(s => s.url);
  return (
    <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '56px 24px 32px', position: 'relative', overflow: 'hidden' }}>
      <LinkBioDeco theme="chrome" />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', width: 92, height: 92, borderRadius: '50%', border: '1px solid var(--sf-accent, #00E5FF)' }} />
          <Avatar bio={bio} config={config} theme="chrome" isLightBg={false} size={80} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--sf-text-1, ' + textColor + ')', fontFamily: 'var(--sf-font, Arial, sans-serif)' }}>{bio.name}</p>
          <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--sf-text-2, ' + textColor2 + ')' }}>{bio.bio || ('@' + config.storeSlug)}</p>
        </div>
        {socials.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 10, color: 'var(--sf-text-2, ' + textColor2 + ')' }}>
            {socials.map((s, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{SOCIAL_ICONS[s.platform]}{i < socials.length - 1 && <span>•</span>}</span>
            ))}
          </div>
        )}
        {items.length > 0 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {items.map((item, i) => (
              <Tile key={item.key} item={item} onProductClick={onProductClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 'var(--sf-radius, 8px)', background: 'var(--sf-surface, rgba(255,255,255,0.14))', border: '1px solid var(--sf-border, rgba(255,255,255,0.35))', marginLeft: i % 2 === 0 ? 0 : 10, marginRight: i % 2 === 0 ? 10 : 0, textDecoration: 'none', color: 'inherit' }}>
                <span style={{ fontSize: 9, fontFamily: 'Courier New, monospace', color: 'var(--sf-accent, #00E5FF)' }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ flex: 1, textAlign: 'left' }}>
                  <span style={{ display: 'block', fontSize: '10.5px', fontWeight: 600, color: 'var(--sf-text-1, ' + textColor + ')', fontFamily: 'var(--sf-font, Arial, sans-serif)' }}>{item.label}</span>
                  <span style={{ display: 'block', fontSize: '8.5px', color: 'var(--sf-text-2, ' + textColor2 + ')' }}>{item.sub}</span>
                </span>
                {item.product?.images?.[0]
                  ? <img src={item.product.images[0]} alt="" style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover' }} />
                  : <span style={{ fontSize: 13 }}>✦</span>}
              </Tile>
            ))}
          </div>
        )}
        <p style={{ margin: 0, fontSize: '0.68rem', fontFamily: 'Courier New, monospace', color: 'var(--sf-text-3, ' + textColor3 + ')' }}>@{config.storeSlug} — Powered by MO Sell</p>
      </div>
    </div>
  );
}

/* ─── Registry ─── */
const LAYOUTS: Record<string, React.ComponentType<LayoutProps>> = {
  ankara: AnkaraLayout,
  midnight: MidnightLayout,
  harmattan: HarmattanLayout,
  neon: NeonLayout,
  sunset: SunsetLayout,
  mono: MonoLayout,
  blush: BlushLayout,
  rose: RoseLayout,
  pearl: PearlLayout,
  cherry: CherryLayout,
  quiet: QuietLayout,
  concrete: ConcreteLayout,
  chrome: ChromeLayout,
};

export function getLinkBioLayout(theme: string): React.ComponentType<LayoutProps> {
  return LAYOUTS[theme] ?? AnkaraLayout;
}
