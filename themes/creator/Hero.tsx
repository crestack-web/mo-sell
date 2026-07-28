'use client';

import React from 'react';
import type { ThemeHeroProps } from '../types';
import { CreatorSocialLinks } from '../creator-social-links';

export function CreatorHero({
  storeName, tagline, logoUrl, primaryColor = '#7C3AED', secondaryColor = '#EC4899',
  ctaLabel = 'Shop Now', ctaUrl = '#products', backgroundImage, socialLinks,
}: ThemeHeroProps) {
  return (
    <section style={{
      position: 'relative', overflow: 'hidden',
      padding: '60px 5% 70px',
      background: backgroundImage
        ? `linear-gradient(135deg, rgba(124,58,237,0.88), rgba(236,72,153,0.85)), url(${backgroundImage})`
        : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
      backgroundSize: backgroundImage ? 'cover' : undefined,
      backgroundPosition: backgroundImage ? 'center' : undefined,
      color: '#FFFFFF',
      textAlign: 'center',
    }}>
      {/* Decorative floating shapes */}
      <div style={{
        position: 'absolute', top: -60, right: -40,
        width: 200, height: 200, borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -80, left: -30,
        width: 280, height: 280, borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 1, maxWidth: 520,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        margin: '0 auto',
      }}>
        {/* Profile picture with gradient ring */}
        {logoUrl ? (
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: 'linear-gradient(135deg, #fff, rgba(255,255,255,0.5))',
            padding: 3, marginBottom: 24,
            boxShadow: '0 6px 28px rgba(0,0,0,0.15)',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt={storeName}
              style={{
                width: 94, height: 94, borderRadius: '50%',
                objectFit: 'cover', border: '3px solid #fff',
              }} />
          </div>
        ) : (
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            border: '3px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem', fontWeight: 700, color: '#fff',
            marginBottom: 24,
          }}>
            {storeName.charAt(0).toUpperCase()}
          </div>
        )}

        <h1 style={{
          fontWeight: 900, fontSize: 'clamp(2rem, 6vw, 3.5rem)',
          lineHeight: 1.1, margin: 0, letterSpacing: '-0.02em',
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
        <div style={{ marginTop: 20 }}>
          <CreatorSocialLinks socials={socialLinks} style="pills" accentColor="#fff" />
        </div>

        <a
          href={ctaUrl}
          style={{
            display: 'inline-block', marginTop: 28,
            padding: '14px 44px',
            background: '#FFFFFF',
            color: primaryColor,
            borderRadius: 100,
            fontSize: '0.85rem', fontWeight: 800,
            letterSpacing: '0.04em',
            textDecoration: 'none', width: 'fit-content',
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.04)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.15)';
          }}
        >
          {ctaLabel}
        </a>
      </div>
    </section>
  );
}
