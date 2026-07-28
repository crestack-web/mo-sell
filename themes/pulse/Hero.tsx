'use client';

import React from 'react';
import type { ThemeHeroProps } from '../types';
import { CreatorSocialLinks } from '../creator-social-links';

export function PulseHero({
  storeName, tagline, logoUrl, primaryColor = '#FF6B35', secondaryColor = '#F7C948',
  ctaLabel = 'Shop Now', ctaUrl = '#products', backgroundImage, socialLinks,
}: ThemeHeroProps) {
  return (
    <section style={{
      position: 'relative', overflow: 'hidden',
      padding: '60px 5% 70px',
      background: backgroundImage
        ? `linear-gradient(135deg, rgba(255,107,53,0.88), rgba(247,201,72,0.85)), url(${backgroundImage})`
        : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
      backgroundSize: backgroundImage ? 'cover' : undefined,
      backgroundPosition: backgroundImage ? 'center' : undefined,
      color: '#FFFFFF',
      textAlign: 'center',
    }}>
      {/* Decorative floating dots */}
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: `${15 + i * 14}%`,
          left: `${10 + i * 15}%`,
          width: 8 + i * 4,
          height: 8 + i * 4,
          borderRadius: '50%',
          background: `rgba(255,255,255,${0.08 + i * 0.02})`,
          pointerEvents: 'none',
        }} />
      ))}
      <div style={{
        position: 'absolute', top: -80, right: -60,
        width: 240, height: 240, borderRadius: '50%',
        background: 'rgba(255,255,255,0.07)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 1, maxWidth: 520,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        margin: '0 auto',
      }}>
        {/* Avatar with gradient ring */}
        {logoUrl ? (
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF6B35, #F7C948)',
            padding: 4, marginBottom: 24,
            boxShadow: '0 6px 28px rgba(255,107,53,0.35)',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt={storeName}
              style={{
                width: 92, height: 92, borderRadius: '50%',
                objectFit: 'cover', border: '3px solid #FFFAF5',
              }} />
          </div>
        ) : (
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            border: '3px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem', fontWeight: 700, color: '#fff',
            marginBottom: 24,
          }}>
            {storeName.charAt(0).toUpperCase()}
          </div>
        )}

        <h1 style={{
          fontWeight: 900, fontFamily: "'Outfit', sans-serif",
          fontSize: 'clamp(2rem, 7vw, 4rem)',
          lineHeight: 1.08, margin: 0,
          letterSpacing: '-0.03em',
          textShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}>
          {storeName}
        </h1>

        {tagline && (
          <p style={{
            fontWeight: 500, fontSize: '1rem',
            color: 'rgba(255,255,255,0.9)',
            marginTop: 14, lineHeight: 1.6,
            maxWidth: 420,
          }}>
            {tagline}
          </p>
        )}

        {/* Social links */}
        <div style={{ marginTop: 22 }}>
          <CreatorSocialLinks socials={socialLinks} style="pills" accentColor="#fff" />
        </div>

        <a
          href={ctaUrl}
          style={{
            display: 'inline-block', marginTop: 28,
            padding: '14px 48px',
            background: '#FFFFFF',
            color: primaryColor,
            borderRadius: 100,
            fontSize: '0.88rem', fontWeight: 800,
            fontFamily: "'Outfit', sans-serif",
            letterSpacing: '0.04em',
            textDecoration: 'none', width: 'fit-content',
            boxShadow: '0 4px 24px rgba(255,107,53,0.35)',
            transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(255,107,53,0.45)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 24px rgba(255,107,53,0.35)';
          }}
        >
          {ctaLabel}
        </a>
      </div>
    </section>
  );
}
