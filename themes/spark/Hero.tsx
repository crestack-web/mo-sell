'use client';

import React from 'react';
import type { ThemeHeroProps } from '../types';
import { CreatorSocialLinks } from '../creator-social-links';

export function SparkHero({ storeName, tagline, logoUrl, ctaLabel = 'Book a Free Consultation', ctaUrl = '#products', backgroundImage, socialLinks }: ThemeHeroProps) {
  const bgStyle = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover' as const, backgroundPosition: 'center' as const }
    : {};

  return (
    <section style={{
      position: 'relative', padding: '60px 5% 70px', overflow: 'hidden',
      background: backgroundImage ? undefined : '#FFF8EE',
      color: '#2D1B69', textAlign: 'center', ...bgStyle,
    }}>
      {/* Decorative purple gradient accent — top-left corner */}
      <div style={{
        position: 'absolute', top: -120, left: -120,
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(45,27,105,0.10) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      {/* Decorative gold accent — bottom-right */}
      <div style={{
        position: 'absolute', bottom: -80, right: -80,
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(217,119,6,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Sparkle decorations */}
      <div style={{ position: 'absolute', top: 60, right: '18%', fontSize: '1.6rem', opacity: 0.15, pointerEvents: 'none', color: '#D97706' }}>✦</div>
      <div style={{ position: 'absolute', top: 140, left: '10%', fontSize: '1rem', opacity: 0.10, pointerEvents: 'none', color: '#7C3AED' }}>✦</div>

      <div style={{
        position: 'relative', zIndex: 1, maxWidth: 520,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        margin: '0 auto',
      }}>
        {/* Profile picture */}
        {logoUrl ? (
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: `linear-gradient(135deg, #D97706, #F59E0B)`,
            padding: 3, marginBottom: 24,
            boxShadow: '0 4px 20px rgba(217,119,6,0.2)',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt={storeName}
              style={{
                width: 94, height: 94, borderRadius: '50%',
                objectFit: 'cover', border: '3px solid #FFF8EE',
              }} />
          </div>
        ) : (
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: `linear-gradient(135deg, #D97706, #F59E0B)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem', fontWeight: 700, color: '#FFF8EE',
            marginBottom: 24,
          }}>
            {storeName.charAt(0).toUpperCase()}
          </div>
        )}

        <p style={{
          fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase',
          color: '#D97706', fontWeight: 600, marginBottom: 14,
        }}>Welcome to Your Transformation</p>

        <h1 style={{
          fontFamily: "'Raleway', Georgia, serif",
          fontWeight: 700,
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          letterSpacing: '-0.01em', lineHeight: 1.15,
          color: '#2D1B69', margin: 0,
        }}>{storeName}</h1>

        {tagline && (
          <p style={{
            fontFamily: "'Raleway', Georgia, serif",
            fontWeight: 400, fontSize: '1rem', color: '#5B4A8A',
            letterSpacing: '0.03em', marginTop: 16, lineHeight: 1.65,
            maxWidth: 440,
          }}>{tagline}</p>
        )}

        {/* Social links */}
        <div style={{ marginTop: 20 }}>
          <CreatorSocialLinks socials={socialLinks} style="pills" accentColor="#D97706" light />
        </div>

        <a href={ctaUrl} style={{
          display: 'inline-block', marginTop: 24, padding: '14px 40px',
          background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
          color: '#FFF8EE',
          fontFamily: "'Raleway', Georgia, serif",
          fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
          textDecoration: 'none', transition: 'all 0.3s', width: 'fit-content',
          borderRadius: 100,
          boxShadow: '0 4px 20px rgba(217,119,6,0.30)',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(217,119,6,0.40)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(217,119,6,0.30)'; }}
        >{ctaLabel}</a>

        {/* Authority badges */}
        <div style={{
          display: 'flex', gap: 16, marginTop: 32, flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {[
            { icon: '🏆', label: '500+ Clients' },
            { icon: '📈', label: 'Proven Results' },
            { icon: '🎯', label: 'Certified' },
          ].map(b => (
            <div key={b.label} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 100,
              background: 'rgba(45,27,105,0.06)', border: '1px solid rgba(45,27,105,0.10)',
            }}>
              <span style={{ fontSize: '0.9rem' }}>{b.icon}</span>
              <span style={{
                fontFamily: "'Raleway', Georgia, serif",
                fontSize: '0.72rem', fontWeight: 600, color: '#2D1B69', letterSpacing: '0.04em',
              }}>{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
