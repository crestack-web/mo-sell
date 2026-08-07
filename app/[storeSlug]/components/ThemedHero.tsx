'use client';

import React from 'react';
import type { StorefrontTheme } from '@/types/mo-sell.types';

interface Props {
  storeName: string;
  tagline?: string | null;
  logoUrl?: string | null;
  theme: StorefrontTheme;
  primaryColor: string;
  secondaryColor: string;
  ctaLabel?: string;
  ctaUrl?: string;
  backgroundImage?: string | null;
  textAlign?: 'left' | 'center' | 'right';
  buttonStyle?: 'pill' | 'square' | 'rounded';
}

function btnRadius(style?: 'pill' | 'square' | 'rounded', theme?: string): number {
  if (style === 'pill') return 100;
  if (style === 'square') return 0;
  if (style === 'rounded') return 8;
  // default per theme
  if (theme === 'ankara') return 999;
  if (theme === 'market') return 100;
  if (theme === 'midnight') return 12;
  if (theme === 'harmattan') return 6;
  if (theme === 'neon') return 6;
  if (theme === 'sunset') return 999;
  if (theme === 'mono') return 0;
  return 0;
}

export function ThemedHero({
  storeName, tagline, logoUrl, theme, primaryColor, secondaryColor,
  ctaLabel = 'Shop Now', ctaUrl = '#products', backgroundImage,
  textAlign = 'left', buttonStyle,
}: Props) {
  const bgStyle = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  const alignMap = { left: 'flex-start' as const, center: 'center' as const, right: 'flex-end' as const };
  const align = alignMap[textAlign] ?? 'flex-start';
  const textAl = textAlign;
  const radius = btnRadius(buttonStyle, theme);

  // ── Luxe ──────────────────────────────────────────────────────────────────
  if (theme === 'luxe') {
    return (
      <section className="sf-hero" style={{ background: '#111111', ...bgStyle, alignItems: align, textAlign: textAl }}>
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={storeName}
            style={{ width: 56, height: 56, borderRadius: 4, objectFit: 'cover', marginBottom: 16 }}
          />
        )}
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: 12, fontWeight: 500 }}>
          New Collection
        </p>
        <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 400, letterSpacing: '0.04em', color: '#F5F0E8', lineHeight: 1.15 }}>
          {storeName}
        </h1>
        {tagline && <p style={{ color: '#A89878', maxWidth: 440, fontSize: '1rem', marginTop: 8 }}>{tagline}</p>}
        <a href={ctaUrl} style={{
          display: 'inline-block', marginTop: 28, padding: '12px 36px',
          border: '1px solid #C9A84C', color: '#C9A84C',
          fontSize: '0.68rem', letterSpacing: '0.16em', textTransform: 'uppercase',
          textDecoration: 'none', transition: 'all 0.2s', borderRadius: radius, width: 'fit-content',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#C9A84C'; (e.currentTarget as HTMLAnchorElement).style.color = '#0A0A0A'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = '#C9A84C'; }}
        >
          {ctaLabel}
        </a>
      </section>
    );
  }

  // ── Glow ──────────────────────────────────────────────────────────────────
  // ── Market ─────────────────────────────────────────────────────────────────
  if (theme === 'market') {
    return (
      <section className="sf-hero" style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        ...bgStyle, alignItems: align, textAlign: textAl,
      } as React.CSSProperties}>
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={storeName}
            style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover', marginBottom: 14 }}
          />
        )}
        <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', marginBottom: 8 }}>
          🛍️ Fresh arrivals daily
        </p>
        <h1 style={{ color: '#fff', fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)', fontWeight: 800, lineHeight: 1.15 }}>
          {storeName}
        </h1>
        {tagline && <p style={{ color: 'rgba(255,255,255,0.88)', maxWidth: 460, fontSize: '1.05rem', marginTop: 8, lineHeight: 1.6 }}>{tagline}</p>}
        <a href={ctaUrl} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          marginTop: 22, padding: '13px 32px',
          background: '#fff', color: primaryColor,
          borderRadius: radius, fontWeight: 800, fontSize: '0.92rem',
          textDecoration: 'none', transition: 'box-shadow 0.18s', width: 'fit-content',
        }}>
          {ctaLabel} →
        </a>
      </section>
    );
  }

  // ── Fallback (luxe) ────────────────────────────────────────────────────────
  return (
    <section className="sf-hero" style={{ background: '#111111', ...bgStyle, alignItems: align, textAlign: textAl }}>
      <h1 style={{ color: '#F5F0E8', fontFamily: '"Playfair Display",Georgia,serif', fontStyle: 'italic' }}>{storeName}</h1>
      {tagline && <p style={{ color: '#A89878' }}>{tagline}</p>}
      <a href={ctaUrl} style={{ display: 'inline-block', marginTop: 24, padding: '12px 32px', border: '1px solid #C9A84C', color: '#C9A84C', textDecoration: 'none', fontSize: '0.8rem', borderRadius: radius, width: 'fit-content' }}>{ctaLabel}</a>
    </section>
  );
}
