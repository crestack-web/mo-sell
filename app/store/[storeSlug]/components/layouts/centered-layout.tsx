'use client';

import React from 'react';
import { Instagram, Twitter, Youtube, Music2, MessageCircle } from 'lucide-react';
import type { LayoutProps } from './types';
import { VerifiedName } from './VerifiedBadge';

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram size={20} />,
  twitter: <Twitter size={20} />,
  youtube: <Youtube size={20} />,
  tiktok: <Music2 size={20} />,
  whatsapp: <MessageCircle size={20} />,
};

export function CenteredLayout({ config, bio, visibleProducts, isLightBg, textColor, textColor2, textColor3, onProductClick, verified }: LayoutProps) {
  return (
    <div style={{
      width: '100%', maxWidth: 600, margin: '0 auto',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '48px 24px 32px', textAlign: 'center',
    }}>
      <div style={{
        width: 96, height: 96, borderRadius: '50%', overflow: 'hidden',
        marginBottom: 16, flexShrink: 0,
        boxShadow: isLightBg ? '0 4px 20px rgba(0,0,0,0.1)' : '0 4px 20px rgba(0,0,0,0.3)',
        border: `2px solid ${config.primaryColor}44`,
      }}>
        {bio.avatarUrl ? (
          <img src={bio.avatarUrl} alt={bio.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (config.logoUrl && !String(config.logoUrl).includes('mosell_gpzl2q')) ? (
          <img src={config.logoUrl} alt={bio.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', fontWeight: 700, color: '#fff',
          }}>
            {bio.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <VerifiedName as="h1" name={bio.name} verified={verified} style={{
        margin: '0 0 4px', fontSize: '1.35rem', fontWeight: 800,
        color: textColor, letterSpacing: '-0.02em',
      }} />

      {bio.bio && (
        <p style={{
          margin: '0 0 20px', fontSize: '0.88rem', color: textColor2,
          maxWidth: 400, lineHeight: 1.6,
        }}>{bio.bio}</p>
      )}

      {bio.socials && bio.socials.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
          {bio.socials.map((s, i) => {
            if (!s.url) return null;
            const icon = SOCIAL_ICONS[s.platform];
            return (
              <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: isLightBg ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: textColor, transition: 'all 0.15s',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {icon}
              </a>
            );
          })}
        </div>
      )}

      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visibleProducts.map(p => {
          if (bio.displayType === 'minimal') {
            return (
              <button key={p.id} onClick={() => onProductClick(p)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  width: '100%', padding: '10px 4px',
                  border: 'none', borderBottom: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`,
                  background: 'transparent', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '0.88rem', color: textColor, fontWeight: 500 }}>{p.displayName}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: textColor }}>
                  {config.currency === 'NGN' ? '\u20A6' : '$'}{p.price.toLocaleString()}
                </span>
              </button>
            );
          }

          if (bio.displayType === 'callout') {
            return (
              <button key={p.id} onClick={() => onProductClick(p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: 12,
                  borderRadius: 16, border: 'none',
                  background: isLightBg ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)',
                  cursor: 'pointer', textAlign: 'left',
                  backdropFilter: isLightBg ? 'none' : 'blur(10px)',
                }}
              >
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.displayName}
                    style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 60, height: 60, borderRadius: 10, background: `${config.primaryColor}33` }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.displayName}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: textColor2 }}>
                    {config.currency === 'NGN' ? '\u20A6' : '$'}{p.price.toLocaleString()}
                  </p>
                </div>
                <span style={{
                  padding: '6px 14px', borderRadius: 20,
                  background: config.primaryColor, color: '#fff',
                  fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap',
                }}>
                  Buy Now
                </span>
              </button>
            );
          }

          return (
            <button key={p.id} onClick={() => onProductClick(p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '10px 16px',
                borderRadius: 100, border: 'none',
                background: isLightBg ? '#fff' : 'rgba(255,255,255,0.12)',
                color: isLightBg ? '#0f172a' : '#fff',
                cursor: 'pointer', textAlign: 'left',
                boxShadow: isLightBg ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {p.images?.[0] ? (
                <img src={p.images[0]} alt={p.displayName}
                  style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${config.primaryColor}44` }} />
              )}
              <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {p.displayName}
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                {config.currency === 'NGN' ? '\u20A6' : '$'}{p.price.toLocaleString()}
              </span>
            </button>
          );
        })}
        {bio.customLinks?.filter(cl => cl.label && cl.url).map(cl => {
          const linkStyle: React.CSSProperties = bio.displayType === 'minimal' ? {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            width: '100%', padding: '10px 4px',
            border: 'none', borderBottom: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`,
            background: 'transparent', cursor: 'pointer', textAlign: 'left',
            textDecoration: 'none', color: textColor,
          } : bio.displayType === 'callout' ? {
            display: 'flex', alignItems: 'center', gap: 12,
            width: '100%', padding: 12,
            borderRadius: 16, border: 'none',
            background: isLightBg ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)',
            cursor: 'pointer', textAlign: 'left',
            backdropFilter: isLightBg ? 'none' : 'blur(10px)',
            textDecoration: 'none', color: textColor,
          } : {
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', padding: '10px 16px',
            borderRadius: 100, border: 'none',
            background: isLightBg ? '#fff' : 'rgba(255,255,255,0.12)',
            color: isLightBg ? '#0f172a' : '#fff',
            cursor: 'pointer', textAlign: 'left',
            boxShadow: isLightBg ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            textDecoration: 'none',
          };

          return (
            <a key={cl.id} href={cl.url} target="_blank" rel="noopener noreferrer"
              style={linkStyle}
              onMouseEnter={e => { if (bio.displayType !== 'minimal') e.currentTarget.style.transform = 'scale(1.02)'; }}
              onMouseLeave={e => { if (bio.displayType !== 'minimal') e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600 }}>{cl.label}</span>
              {bio.displayType !== 'minimal' && (
                <span style={{ fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  Open ↗
                </span>
              )}
            </a>
          );
        })}
      </div>

      <p style={{
        marginTop: 'auto', paddingTop: 40,
        fontSize: '0.68rem', color: textColor3,
      }}>
        Powered by MO Sell
      </p>
    </div>
  );
}
