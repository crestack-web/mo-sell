'use client';

import React from 'react';
import type { ThemeCollectionCardProps } from '../types';
import { THEME_TOKENS, accentText, type ThemeTokens } from './tokens';

export function CollectionCardWithTheme({ themeId, collection, storeSlug, index }: ThemeCollectionCardProps & { themeId: string }) {
  const t = THEME_TOKENS[themeId] as ThemeTokens;
  const blockColors = [t.accent, t.accent2, t.border, t.subtext];
  const c = blockColors[index % blockColors.length];

  const deco = (() => {
    switch (themeId) {
      case 'atelier':
        return <span style={{ position: 'absolute', top: 12, left: 12, fontSize: '0.55rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: t.accent, background: 'rgba(11,11,11,0.55)', padding: '4px 8px' }}>Collection</span>;
      case 'citrus':
        return <span style={{ position: 'absolute', bottom: 12, right: 12, width: 22, height: 22, borderRadius: '50%', background: t.accent2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12 }}>→</span>;
      case 'neotech':
        return <span style={{ position: 'absolute', top: 10, left: 10, fontSize: '0.55rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: t.accent, color: t.bg.startsWith('#') ? t.bg : '#111' }}>EDIT</span>;
      case 'volt':
        return <span style={{ position: 'absolute', top: 10, right: 10, fontSize: '0.55rem', fontWeight: 700, padding: '3px 8px', background: t.accent, color: '#000' }}>DROP</span>;
      default:
        return null;
    }
  })();

  return (
    <a href={`/store/${storeSlug}/collections/${collection.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div style={{
        position: 'relative',
        height: 220,
        borderRadius: t.radius,
        overflow: 'hidden',
        background: c,
        opacity: 0.9,
        border: themeId === 'nordly' || themeId === 'terra' ? `1px solid ${t.border}` : 'none',
      }}>
        {collection.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={collection.coverImageUrl} alt={collection.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: isDarkOverlay(themeId) ? 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)' : 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 60%, transparent 100%)',
        }} />
        {deco}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '18px 16px' }}>
          <p style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 700, fontSize: '1.1rem', color: '#fff', lineHeight: 1.25 }}>{collection.title}</p>
          {collection.description && (
            <p style={{ margin: '5px 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {collection.description}
            </p>
          )}
          {collection.productCount != null && collection.productCount > 0 && (
            <p style={{ margin: '6px 0 0', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: accentText(t) }}>
              {collection.productCount} item{collection.productCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </a>
  );
}

function isDarkOverlay(themeId: string): boolean {
  return themeId === 'atelier' || themeId === 'neotech' || themeId === 'volt' || themeId === 'botanica' || themeId === 'prism';
}
