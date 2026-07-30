'use client';

import React from 'react';
import type { ThemeHeroProps } from '../types';
import { CreatorSocialLinks } from '../creator-social-links';

export function AbbyHero({ storeName, tagline, logoUrl, primaryColor = '#5383FF', secondaryColor = '#3B6FE0', ctaLabel = 'Visit Store', ctaUrl = '#products', socialLinks }: ThemeHeroProps) {
  return (
    <section style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '48px 20px 32px', textAlign: 'center', gap: 12,
      background: 'var(--sf-bg)',
    }}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={storeName}
          style={{
            width: 96, height: 96, borderRadius: '50%',
            objectFit: 'cover',
            border: `3px solid ${primaryColor}`,
            boxShadow: `0 4px 20px ${primaryColor}33`,
          }} />
      ) : (
        <div style={{
          width: 96, height: 96, borderRadius: '50%',
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.2rem', fontWeight: 700, color: '#fff',
          boxShadow: `0 4px 20px ${primaryColor}33`,
          flexShrink: 0, overflow: 'hidden',
        }}>
          {storeName.charAt(0).toUpperCase()}
        </div>
      )}

      <h1 style={{
        fontFamily: "'Nunito Sans', 'Inter', sans-serif",
        fontSize: '1.5rem', fontWeight: 800, color: 'var(--sf-text-1)',
        margin: 0, letterSpacing: '-0.02em',
      }}>{storeName}</h1>

      {tagline && (
        <p style={{
          fontSize: '0.92rem', color: 'var(--sf-text-2)',
          margin: 0, maxWidth: 380, lineHeight: 1.6,
        }}>{tagline}</p>
      )}

      <div style={{ marginTop: 8 }}>
        <CreatorSocialLinks socials={socialLinks} style="pills" accentColor={primaryColor} />
      </div>

      <a href={ctaUrl} style={{
        marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '12px 32px', borderRadius: 100,
        background: primaryColor, color: '#fff',
        fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none',
        transition: 'all 0.2s', width: 'fit-content',
        boxShadow: `0 4px 16px ${primaryColor}33`,
      }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = `0 8px 24px ${primaryColor}44`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = `0 4px 16px ${primaryColor}33`;
        }}
      >{ctaLabel} →</a>
    </section>
  );
}
