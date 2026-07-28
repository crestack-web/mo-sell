'use client';

import React from 'react';
import type { ThemeHeroProps } from '../types';
import { CreatorSocialLinks } from '../creator-social-links';

const C = {
  navy: '#0B1D3A',
  surface: '#112240',
  blue: '#3B82F6',
  lightBlue: '#60A5FA',
  white: '#F1F5F9',
  muted: '#94A3B8',
};

export function VaultHero({
  storeName, tagline, logoUrl, ctaLabel = 'Browse Products', ctaUrl = '#products',
  backgroundImage, socialLinks,
}: ThemeHeroProps) {
  const bgStyle = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover' as const, backgroundPosition: 'center' as const }
    : {};

  return (
    <section style={{
      position: 'relative', padding: '60px 5% 70px', overflow: 'hidden',
      background: backgroundImage ? undefined : `linear-gradient(170deg, ${C.navy} 0%, #0A1628 50%, #091422 100%)`,
      color: C.white, textAlign: 'center', ...bgStyle,
    }}>
      {backgroundImage && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(170deg, rgba(11,29,58,0.88) 0%, rgba(10,22,40,0.82) 50%, rgba(9,20,34,0.78) 100%)`,
          pointerEvents: 'none',
        }} />
      )}

      {/* Grid pattern overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />

      {/* Glow orbs */}
      <div style={{
        position: 'absolute', top: '-20%', right: '-8%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 1, maxWidth: 520,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        margin: '0 auto',
      }}>
        {/* Badge */}
        <span style={{
          display: 'inline-block', marginBottom: 20,
          padding: '6px 16px', borderRadius: 8,
          background: 'rgba(59,130,246,0.12)',
          border: '1px solid rgba(59,130,246,0.2)',
          fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: C.lightBlue,
        }}>
          ⚡ Instant Digital Delivery
        </span>

        {/* Profile picture */}
        {logoUrl ? (
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: `linear-gradient(135deg, ${C.blue}, ${C.lightBlue})`,
            padding: 3, marginBottom: 24,
            boxShadow: '0 4px 20px rgba(59,130,246,0.2)',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt={storeName}
              style={{
                width: 90, height: 90, borderRadius: '50%',
                objectFit: 'cover', border: `3px solid ${C.navy}`,
              }} />
          </div>
        ) : (
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: `linear-gradient(135deg, ${C.blue}, ${C.lightBlue})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.2rem', fontWeight: 700, color: '#fff',
            marginBottom: 24,
          }}>
            {storeName.charAt(0).toUpperCase()}
          </div>
        )}

        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          letterSpacing: '-0.03em', lineHeight: 1.12,
          color: C.white, margin: 0,
        }}>{storeName}</h1>

        {tagline && (
          <p style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 400, fontSize: '1rem', color: C.muted,
            letterSpacing: '0.01em', marginTop: 16, lineHeight: 1.65,
            maxWidth: 420,
          }}>{tagline}</p>
        )}

        {/* Social links */}
        <div style={{ marginTop: 20 }}>
          <CreatorSocialLinks socials={socialLinks} style="pills" accentColor={C.blue} />
        </div>

        <a href={ctaUrl} style={{
          display: 'inline-block', marginTop: 24, padding: '14px 40px',
          background: C.blue,
          borderRadius: 100,
          color: '#FFFFFF',
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.04em',
          textDecoration: 'none', width: 'fit-content',
          transition: 'all 0.35s ease',
          boxShadow: '0 4px 20px rgba(59,130,246,0.35)',
        }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = '0 8px 36px rgba(59,130,246,0.5)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.background = '#2563EB';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(59,130,246,0.35)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.background = C.blue;
          }}
        >{ctaLabel}</a>
      </div>
    </section>
  );
}
