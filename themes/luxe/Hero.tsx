'use client';

import React from 'react';
import type { ThemeHeroProps } from '../types';

export function LuxeHero({ storeName, tagline, ctaLabel = 'Shop Now', ctaUrl = '#products', backgroundImage, backgroundBlur, backgroundOpacity, overlayOpacity, textAlign = 'left', buttonStyle, badgeText, bgColor, bodyTextColor }: ThemeHeroProps) {
  const heroBg = bgColor || '#0A0A0A';
  const textMain = bodyTextColor || '#F5F5F0';
  const textMuted = bodyTextColor ? `${bodyTextColor}aa` : '#A89878';
  const blur = Math.max(0, backgroundBlur ?? 0);

  return (
    <section style={{
      position: 'relative', padding: '100px 5%', overflow: 'hidden',
      background: heroBg, color: textMain,
    }}>
      {backgroundImage && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          opacity: backgroundOpacity ?? 1,
          transform: blur > 0 ? 'scale(1.02)' : undefined,
          zIndex: 0, pointerEvents: 'none',
        }} />
      )}
      {/* Gold gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, transparent 60%)',
        opacity: backgroundImage ? (overlayOpacity ?? 1) : 1,
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, display: 'flex', flexDirection: 'column', alignItems: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start', textAlign }}>
        {badgeText && (
          <p style={{
            fontSize: '0.6rem', letterSpacing: '0.24em', textTransform: 'uppercase',
            color: '#C9A84C', fontWeight: 500, marginBottom: 16,
          }}>{badgeText}</p>
        )}

        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontStyle: 'italic', fontWeight: 400,
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          letterSpacing: '-0.01em', lineHeight: 1.1,
          color: textMain, margin: 0,
        }}>{storeName}</h1>

        {tagline && (
          <p style={{
            fontWeight: 300, fontSize: '1.05rem', color: textMuted,
            letterSpacing: '0.04em', marginTop: 20, lineHeight: 1.6,
            maxWidth: 460,
          }}>{tagline}</p>
        )}

        <a href={ctaUrl} style={{
          display: 'inline-block', marginTop: 36, padding: '14px 42px',
          border: '1px solid #C9A84C', color: '#C9A84C',
          fontSize: '0.66rem', letterSpacing: '0.16em', textTransform: 'uppercase',
          textDecoration: 'none', fontWeight: 500, transition: 'all 0.3s', width: 'fit-content',
          borderRadius: buttonStyle === 'pill' ? 100 : buttonStyle === 'square' ? 0 : 8,
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#C9A84C'; e.currentTarget.style.color = heroBg; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C9A84C'; }}
        >{ctaLabel}</a>
      </div>
    </section>
  );
}
