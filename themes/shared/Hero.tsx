'use client';

import React from 'react';
import type { ThemeHeroProps } from '../types';
import { THEME_TOKENS, accentText, type ThemeTokens } from './tokens';

export function HeroWithTheme({ themeId, storeName, tagline, ctaLabel = 'Shop Now', ctaUrl = '#products', backgroundImage, textAlign = 'center' }: ThemeHeroProps & { themeId: string }) {
  const t = THEME_TOKENS[themeId] as ThemeTokens;
  const radius = t.radius === 0 ? 0 : 999;
  const bgStyle = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover' as const, backgroundPosition: 'center' as const }
    : {};
  const heroBg = backgroundImage ? undefined : t.bg;

  const deco = (() => {
    switch (t.deco) {
      case 'hairline':
        return <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: t.accent, opacity: 0.6, pointerEvents: 'none' }} />;
      case 'dots':
        return <div style={{ position: 'absolute', inset: 0, opacity: 0.3, pointerEvents: 'none', backgroundImage: `radial-gradient(${t.accent2} 1.5px, transparent 1.5px)`, backgroundSize: '14px 14px' }} />;
      case 'grid-lines':
        return <div style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none', backgroundImage: `linear-gradient(${t.border} 1px, transparent 1px), linear-gradient(90deg, ${t.border} 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />;
      case 'glow':
        return <div style={{ position: 'absolute', left: '50%', top: 6, transform: 'translateX(-50%)', width: 240, height: 130, borderRadius: '50%', filter: 'blur(48px)', opacity: 0.4, background: t.accent, pointerEvents: 'none' }} />;
      case 'texture':
        return <div style={{ position: 'absolute', inset: 0, opacity: 0.2, pointerEvents: 'none', backgroundImage: `radial-gradient(${t.accent2} 1px, transparent 1px)`, backgroundSize: '6px 6px' }} />;
      case 'neon-grid':
        return <div style={{ position: 'absolute', inset: 0, opacity: 0.2, pointerEvents: 'none', backgroundImage: `repeating-linear-gradient(45deg, ${t.accent} 0px, ${t.accent} 1px, transparent 1px, transparent 16px)` }} />;
      case 'leaf':
        return <div style={{ position: 'absolute', inset: 0, opacity: 0.25, pointerEvents: 'none', background: `radial-gradient(circle at 15% 20%, ${t.accent2} 0%, transparent 35%), radial-gradient(circle at 85% 75%, ${t.accent} 0%, transparent 40%)` }} />;
      case 'holo':
        return <div style={{ position: 'absolute', inset: 0, opacity: 0.3, pointerEvents: 'none', background: `repeating-linear-gradient(115deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 2px, transparent 2px, transparent 18px)` }} />;
      default:
        return null;
    }
  })();

  const align = textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start';
  const textAl = textAlign;

  return (
    <section style={{ position: 'relative', padding: '72px 5%', overflow: 'hidden', background: heroBg, color: t.text, ...bgStyle }}>
      {backgroundImage && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 100%)', pointerEvents: 'none' }} />}
      {deco}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, display: 'flex', flexDirection: 'column', alignItems: align, textAlign: textAl, gap: 14 }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: t.accent, margin: 0, fontFamily: t.fontBody }}>
          New Season
        </p>
        <h1 style={{
          fontFamily: t.fontDisplay,
          fontWeight: 800,
          fontSize: 'clamp(2rem, 5.5vw, 3.6rem)',
          lineHeight: 1.12,
          letterSpacing: themeId === 'atelier' ? '0.02em' : '-0.02em',
          color: t.text, margin: 0,
        }}>
          {storeName}
        </h1>
        {tagline && (
          <p style={{ fontSize: '1.05rem', color: t.subtext, lineHeight: 1.6, maxWidth: 480, margin: 0, fontFamily: t.fontBody }}>
            {tagline}
          </p>
        )}
        <a href={ctaUrl} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 10,
          padding: '12px 28px',
          background: t.accent, color: accentText(t),
          borderRadius: radius,
          fontSize: '0.82rem', fontWeight: 700,
          textDecoration: 'none', width: 'fit-content',
          transition: 'opacity 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
        >
          {ctaLabel} <span style={{ fontSize: 12 }}>→</span>
        </a>
      </div>
    </section>
  );
}
