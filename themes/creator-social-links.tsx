'use client';

import React from 'react';
import type { ThemeHeroSocialLinks } from './types';

const SOCIAL_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  instagram: { label: 'Instagram', icon: 'IG', color: '#E4405F' },
  twitter: { label: 'Twitter', icon: 'X', color: '#1DA1F2' },
  facebook: { label: 'Facebook', icon: 'FB', color: '#1877F2' },
  tiktok: { label: 'TikTok', icon: 'TT', color: '#000000' },
  youtube: { label: 'YouTube', icon: 'YT', color: '#FF0000' },
  whatsapp: { label: 'WhatsApp', icon: 'WA', color: '#25D366' },
};

interface SocialLinksProps {
  socials?: ThemeHeroSocialLinks;
  style?: 'pills' | 'icons' | 'minimal';
  accentColor?: string;
  light?: boolean;
}

export function CreatorSocialLinks({ socials, style = 'pills', accentColor = '#A78BFA', light = false }: SocialLinksProps) {
  if (!socials) return null;

  const activeLinks = Object.entries(socials).filter(([, url]) => url);

  if (activeLinks.length === 0) return null;

  return (
    <div style={{
      display: 'flex', gap: 10, flexWrap: 'wrap',
      justifyContent: 'center',
    }}>
      {activeLinks.map(([platform, url]) => {
        const config = SOCIAL_CONFIG[platform];
        if (!config || !url) return null;

        if (style === 'icons') {
          return (
            <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
              title={config.label}
              style={{
                width: 44, height: 44, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.15)',
                color: light ? accentColor : '#fff',
                fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.02em',
                textDecoration: 'none',
                border: light ? `1px solid rgba(0,0,0,0.08)` : '1px solid rgba(255,255,255,0.12)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = light ? accentColor : 'rgba(255,255,255,0.25)';
                e.currentTarget.style.color = light ? '#fff' : accentColor;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.15)';
                e.currentTarget.style.color = light ? accentColor : '#fff';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {config.icon}
            </a>
          );
        }

        if (style === 'minimal') {
          return (
            <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
              style={{
                fontSize: '0.78rem', fontWeight: 600,
                color: light ? accentColor : 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.7'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              {config.label}
            </a>
          );
        }

        // Default: pills
        return (
          <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', borderRadius: 100,
              background: light ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.15)',
              backdropFilter: light ? undefined : 'blur(8px)',
              color: light ? '#333' : '#fff',
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
              textDecoration: 'none',
              border: light ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.12)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = light ? accentColor : 'rgba(255,255,255,0.25)';
              e.currentTarget.style.color = light ? '#fff' : accentColor;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = light ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.15)';
              e.currentTarget.style.color = light ? '#333' : '#fff';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span style={{ fontSize: '0.6rem' }}>{config.icon}</span>
            {config.label}
          </a>
        );
      })}
    </div>
  );
}
