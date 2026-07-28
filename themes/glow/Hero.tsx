'use client';

import React from 'react';
import type { ThemeHeroProps } from '../types';
import { CreatorSocialLinks } from '../creator-social-links';

const COLORS = {
  roseGold: '#B76E79',
  roseGoldLight: '#D4A0A6',
  softPink: '#FDE8E9',
  warmWhite: '#FFFAF7',
  gold: '#D4A574',
  blush: '#F5D5CC',
  cream: '#FFF5EE',
  dustyRose: '#C9929B',
};

export function GlowHero({ storeName, tagline, logoUrl, ctaLabel = 'Explore Collection', ctaUrl = '#products', backgroundImage, socialLinks }: ThemeHeroProps) {
  const bgStyle = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover' as const, backgroundPosition: 'center' as const }
    : {};

  return (
    <section style={{
      position: 'relative', padding: '60px 5% 70px', overflow: 'hidden',
      background: backgroundImage
        ? undefined
        : `linear-gradient(160deg, ${COLORS.cream} 0%, ${COLORS.softPink} 35%, ${COLORS.blush} 60%, rgba(183,110,121,0.3) 100%)`,
      color: '#4A3238', textAlign: 'center', ...bgStyle,
    }}>
      {/* Warm overlay for image backgrounds */}
      {backgroundImage && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(160deg, rgba(255,245,238,0.82) 0%, rgba(253,232,233,0.7) 40%, rgba(183,110,121,0.35) 100%)`,
          pointerEvents: 'none',
        }} />
      )}

      {/* Subtle radial glow */}
      <div style={{
        position: 'absolute', top: '-30%', right: '-10%',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(183,110,121,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 1, maxWidth: 520,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        margin: '0 auto',
      }}>
        {/* Profile picture with soft ring */}
        {logoUrl ? (
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: `linear-gradient(135deg, ${COLORS.roseGold}, ${COLORS.gold})`,
            padding: 3, marginBottom: 24,
            boxShadow: '0 4px 20px rgba(183,110,121,0.2)',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt={storeName}
              style={{
                width: 90, height: 90, borderRadius: '50%',
                objectFit: 'cover', border: `3px solid ${COLORS.warmWhite}`,
              }} />
          </div>
        ) : (
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: `linear-gradient(135deg, ${COLORS.roseGold}, ${COLORS.gold})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.2rem', fontWeight: 700, color: COLORS.warmWhite,
            marginBottom: 24, boxShadow: '0 4px 20px rgba(183,110,121,0.2)',
          }}>
            {storeName.charAt(0).toUpperCase()}
          </div>
        )}

        <p style={{
          fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase',
          color: COLORS.roseGold, fontWeight: 600, marginBottom: 14,
        }}>Your Beauty Destination</p>

        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: 300,
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          letterSpacing: '-0.005em', lineHeight: 1.15,
          color: '#3D2228', margin: 0,
        }}>{storeName}</h1>

        {tagline && (
          <p style={{
            fontWeight: 300, fontSize: '1rem', color: COLORS.dustyRose,
            letterSpacing: '0.03em', marginTop: 16, lineHeight: 1.65,
            maxWidth: 400,
          }}>{tagline}</p>
        )}

        {/* Social links */}
        <div style={{ marginTop: 20 }}>
          <CreatorSocialLinks socials={socialLinks} style="pills" accentColor={COLORS.roseGold} light />
        </div>

        <a href={ctaUrl} style={{
          display: 'inline-block', marginTop: 24, padding: '14px 40px',
          background: `linear-gradient(135deg, ${COLORS.roseGold}, ${COLORS.dustyRose})`,
          borderRadius: 100,
          color: COLORS.warmWhite,
          fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase',
          textDecoration: 'none', fontWeight: 600, width: 'fit-content',
          transition: 'all 0.35s ease',
          boxShadow: '0 6px 24px rgba(183,110,121,0.25)',
        }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = '0 10px 36px rgba(183,110,121,0.35)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(183,110,121,0.25)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >{ctaLabel}</a>
      </div>
    </section>
  );
}
