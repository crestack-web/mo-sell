'use client';
/**
 * StorefrontCanvas
 *
 * The single source of truth for what a storefront looks like.
 * Used identically in:
 *  1. Theme editor center preview (scaled, device-framed)
 *  2. Theme marketplace cards (small scale)
 *
 * Every section is built with real HTML/CSS — no SVG shapes, no fake blocks.
 * The preview IS the website. There is no separate "preview component".
 */

import React from 'react';
import type {
  StorefrontTheme, StoreSection,
  StorefrontProduct, StoreCollection,
  HeroSectionSettings, FeaturedSectionSettings,
  CollectionsSectionSettings, AnnouncementSectionSettings,
  AboutSectionSettings, TestimonialsSectionSettings,
  NewsletterSectionSettings, InstagramSectionSettings,
  FooterSectionSettings,
} from '@/types/mo-sell.types';
import { DEFAULT_SECTIONS } from '@/types/mo-sell.types';
import { isLinkTheme } from '@/themes/registry';

const MOBILE_BREAKPOINT = 560;
const isMobile = (width?: number) => (width ?? 1000) < MOBILE_BREAKPOINT;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface StorefrontCanvasProps {
  theme: StorefrontTheme;
  storeName?: string;
  tagline?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string | null;
  sections?: StoreSection[];
  /** Width in px — the canvas fills this width, height is natural */
  width?: number;
  storeSlug?: string;
  products?: StorefrontProduct[];
  collections?: StoreCollection[];
  fontFamily?: string | null;
  buttonStyle?: 'pill' | 'square' | 'rounded';
  bodyTextColor?: string | null;
  bgColor?: string | null;
  hideStoreNameWithLogo?: boolean;
  onSectionClick?: (sectionId: string) => void;
}

// ─── CSS variable injection per theme ─────────────────────────────────────────
// These mirror storefront.css [data-theme="..."] exactly.
// Injected inline so the canvas works anywhere without global CSS.

export function getThemeCssVars(theme: StorefrontTheme, primary: string, secondary: string) {
  const base = { '--sf-primary': primary, '--sf-secondary': secondary };
  const themeVars = (() => {
    switch (theme) {
      case 'luxe': return {
        '--sf-bg': '#0A0A0A', '--sf-surface': '#111111', '--sf-border': '#222222',
        '--sf-text-1': '#F5F0E8', '--sf-text-2': '#A89878', '--sf-text-3': '#5A5040',
        '--sf-radius': '0px', '--sf-radius-sm': '0px', '--sf-radius-lg': '0px',
        '--sf-gold': '#C9A84C', '--sf-nav-h': '64px',
        '--sf-font': '"Playfair Display",Georgia,serif',
      };
      case 'ankara': return {
        '--sf-bg': '#FFC93C', '--sf-surface': '#FFFFFF', '--sf-border': '#1A1A1A',
        '--sf-text-1': '#1A1A1A', '--sf-text-2': '#4A4A4A', '--sf-text-3': '#6B6B6B',
        '--sf-radius': '999px', '--sf-radius-sm': '999px', '--sf-radius-lg': '999px',
        '--sf-accent': '#FF3E7F', '--sf-accent-2': '#00A896', '--sf-nav-h': '0px',
        '--sf-font': 'system-ui, sans-serif',
      };
      case 'atelier': return {
        '--sf-bg': '#0B0B0B', '--sf-surface': '#161616', '--sf-border': '#2A2A2A',
        '--sf-text-1': '#F5F5F0', '--sf-text-2': '#9C9C94', '--sf-text-3': '#5A5A54',
        '--sf-radius': '0px', '--sf-radius-sm': '0px', '--sf-radius-lg': '0px',
        '--sf-accent': '#D4AF6A', '--sf-accent-2': '#FFFFFF', '--sf-nav-h': '64px',
        '--sf-font': "Georgia,serif",
      };
      case 'citrus': return {
        '--sf-bg': '#FFF4DE', '--sf-surface': '#FFFFFF', '--sf-border': '#FFDDA8',
        '--sf-text-1': '#1F2A1A', '--sf-text-2': '#5C6B52', '--sf-text-3': '#9AAB8C',
        '--sf-radius': '999px', '--sf-radius-sm': '999px', '--sf-radius-lg': '999px',
        '--sf-accent': '#FF7A1A', '--sf-accent-2': '#8BC53F', '--sf-nav-h': '64px',
        '--sf-font': 'Verdana,system-ui,sans-serif',
      };
      case 'nordly': return {
        '--sf-bg': '#F7F5F0', '--sf-surface': '#FFFFFF', '--sf-border': '#E4DFD3',
        '--sf-text-1': '#22201C', '--sf-text-2': '#8A8479', '--sf-text-3': '#B7ADA0',
        '--sf-radius': '4px', '--sf-radius-sm': '4px', '--sf-radius-lg': '8px',
        '--sf-accent': '#5B6B58', '--sf-accent-2': '#B7ADA0', '--sf-nav-h': '64px',
        '--sf-font': "'Century Gothic',system-ui,sans-serif",
      };
      case 'neotech': return {
        '--sf-bg': '#0A0E17', '--sf-surface': '#121826', '--sf-border': '#233047',
        '--sf-text-1': '#E8ECFF', '--sf-text-2': '#7C879E', '--sf-text-3': '#4A5468',
        '--sf-radius': '8px', '--sf-radius-sm': '6px', '--sf-radius-lg': '12px',
        '--sf-accent': '#3D8BFF', '--sf-accent-2': '#00FFC2', '--sf-nav-h': '64px',
        '--sf-font': "'Courier New',monospace",
      };
      case 'terra': return {
        '--sf-bg': '#F1EEE4', '--sf-surface': '#FFFFFF', '--sf-border': '#E2DCC8',
        '--sf-text-1': '#3A3327', '--sf-text-2': '#8A8065', '--sf-text-3': '#B0A78C',
        '--sf-radius': '12px', '--sf-radius-sm': '10px', '--sf-radius-lg': '18px',
        '--sf-accent': '#6B7A4F', '--sf-accent-2': '#B5652E', '--sf-nav-h': '64px',
        '--sf-font': "'Trebuchet MS',system-ui,sans-serif",
      };
      case 'volt': return {
        '--sf-bg': '#000000', '--sf-surface': '#111111', '--sf-border': '#2A2A2A',
        '--sf-text-1': '#FFFFFF', '--sf-text-2': '#9A9A9A', '--sf-text-3': '#555555',
        '--sf-radius': '0px', '--sf-radius-sm': '0px', '--sf-radius-lg': '0px',
        '--sf-accent': '#E9FF3D', '--sf-accent-2': '#FF3D3D', '--sf-nav-h': '64px',
        '--sf-font': "'Arial Narrow',Impact,sans-serif",
      };
      case 'botanica': return {
        '--sf-bg': '#0F2318', '--sf-surface': '#17301F', '--sf-border': '#274430',
        '--sf-text-1': '#F3EFE4', '--sf-text-2': '#A9B8A0', '--sf-text-3': '#6E8271',
        '--sf-radius': '16px', '--sf-radius-sm': '12px', '--sf-radius-lg': '24px',
        '--sf-accent': '#D8A667', '--sf-accent-2': '#E8C9D0', '--sf-nav-h': '64px',
        '--sf-font': "Candara,'Segoe UI',sans-serif",
      };
      case 'prism': return {
        '--sf-bg': 'linear-gradient(135deg, #7B2FF7 0%, #F72585 50%, #4CC9F0 100%)',
        '--sf-surface': 'rgba(255,255,255,0.16)', '--sf-border': 'rgba(255,255,255,0.4)',
        '--sf-text-1': '#FFFFFF', '--sf-text-2': 'rgba(255,255,255,0.8)', '--sf-text-3': 'rgba(255,255,255,0.55)',
        '--sf-radius': '999px', '--sf-radius-sm': '999px', '--sf-radius-lg': '999px',
        '--sf-accent': '#FFFFFF', '--sf-accent-2': '#FFE066', '--sf-nav-h': '0px',
        '--sf-font': "'Arial Rounded MT Bold','Helvetica Neue',sans-serif",
      };
      case 'midnight': return {
        '--sf-bg': '#0B0B0F', '--sf-surface': '#151319', '--sf-border': '#C9A227',
        '--sf-text-1': '#F5F0E6', '--sf-text-2': '#B8AF9C', '--sf-text-3': '#6E6555',
        '--sf-radius': '12px', '--sf-radius-sm': '8px', '--sf-radius-lg': '16px',
        '--sf-accent': '#C9A227', '--sf-accent-2': '#7A6A2E', '--sf-nav-h': '0px',
        '--sf-font': 'system-ui, sans-serif',
      };
      case 'harmattan': return {
        '--sf-bg': '#EDE7D9', '--sf-surface': '#F8F5EC', '--sf-border': '#D8CFB8',
        '--sf-text-1': '#2E2A22', '--sf-text-2': '#6B6353', '--sf-text-3': '#9A9182',
        '--sf-radius': '6px', '--sf-radius-sm': '6px', '--sf-radius-lg': '10px',
        '--sf-accent': '#4C6B8A', '--sf-accent-2': '#8A7A62', '--sf-nav-h': '0px',
        '--sf-font': "'Courier New', monospace",
      };
      case 'neon': return {
        '--sf-bg': '#0A0A0A', '--sf-surface': '#111111', '--sf-border': '#00F0FF',
        '--sf-text-1': '#FFFFFF', '--sf-text-2': '#9A9A9A', '--sf-text-3': '#555555',
        '--sf-radius': '6px', '--sf-radius-sm': '6px', '--sf-radius-lg': '10px',
        '--sf-accent': '#FF2E9A', '--sf-accent-2': '#00F0FF', '--sf-nav-h': '0px',
        '--sf-font': "'Courier New', monospace",
      };
      case 'sunset': return {
        '--sf-bg': 'linear-gradient(165deg, #6E3AFF 0%, #FF4D9D 55%, #FF7A45 100%)',
        '--sf-surface': 'rgba(255,255,255,0.14)', '--sf-border': 'rgba(255,255,255,0.45)',
        '--sf-text-1': '#FFFFFF', '--sf-text-2': 'rgba(255,255,255,0.78)', '--sf-text-3': 'rgba(255,255,255,0.5)',
        '--sf-radius': '999px', '--sf-radius-sm': '999px', '--sf-radius-lg': '999px',
        '--sf-accent': '#FFFFFF', '--sf-accent-2': '#FFD24C', '--sf-nav-h': '0px',
        '--sf-font': 'system-ui, sans-serif',
      };
      case 'mono': return {
        '--sf-bg': '#FFFFFF', '--sf-surface': '#FFFFFF', '--sf-border': '#000000',
        '--sf-text-1': '#000000', '--sf-text-2': '#555555', '--sf-text-3': '#999999',
        '--sf-radius': '0px', '--sf-radius-sm': '0px', '--sf-radius-lg': '0px',
        '--sf-accent': '#FF0000', '--sf-accent-2': '#000000', '--sf-nav-h': '0px',
        '--sf-font': "'Helvetica Neue', Arial, sans-serif",
      };
      default: return {
        '--sf-bg': '#FFC93C', '--sf-surface': '#FFFFFF', '--sf-border': '#1A1A1A',
        '--sf-text-1': '#1A1A1A', '--sf-text-2': '#4A4A4A', '--sf-text-3': '#6B6B6B',
        '--sf-radius': '999px', '--sf-radius-sm': '999px', '--sf-radius-lg': '999px',
        '--sf-accent': '#FF3E7F', '--sf-accent-2': '#00A896', '--sf-nav-h': '0px',
        '--sf-font': 'system-ui, sans-serif',
      };
    }
  })();
  return { ...base, ...themeVars } as React.CSSProperties;
}



// ─── Section components ────────────────────────────────────────────────────────

function SfNav({ theme, storeName, logoUrl, primary, storeSlug, hideStoreNameWithLogo, width }: {
  theme: StorefrontTheme; storeName: string; logoUrl?: string | null; primary: string; storeSlug?: string;
  hideStoreNameWithLogo?: boolean; width?: number;
}) {
  const isLuxe = theme === 'luxe';
  const isCitrus = theme === 'citrus';
  const isCompact = (width ?? 600) < 480;
  return (
    <nav style={{
      background: isCitrus ? 'var(--sf-primary)' : 'var(--sf-surface)',
      borderBottom: '1px solid var(--sf-border)',
      display: 'flex', alignItems: 'center',
      padding: isCompact ? '0 14px' : '0 28px', gap: isCompact ? 10 : 24, height: 'var(--sf-nav-h)',
      position: 'sticky', top: 0, zIndex: 20, flexShrink: 0,
    }}>
      {isCompact && (
        <button style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', color: isCitrus ? '#fff' : 'var(--sf-text-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} aria-label="Menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {logoUrl
          ? <img src={logoUrl} alt={storeName} style={{ height: 32, width: 'auto', maxWidth: 120, objectFit: 'contain', borderRadius: 'var(--sf-radius-sm)' }} />
          : <span style={{
              width: 36, height: 36, borderRadius: 8,
              background: isCitrus ? '#fff' : primary, color: isCitrus ? primary : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '1rem', flexShrink: 0,
            }}>{storeName.charAt(0).toUpperCase()}</span>
        }
        {!(hideStoreNameWithLogo && logoUrl) && <span style={{
          fontFamily: isLuxe ? '"Playfair Display",Georgia,serif' : 'var(--sf-font)',
          fontStyle: isLuxe ? 'italic' : 'normal', fontWeight: isLuxe ? 400 : 800,
          fontSize: isLuxe ? '1.1rem' : '1rem', letterSpacing: isLuxe ? '0.12em' : '-0.01em',
          color: isCitrus ? '#fff' : 'var(--sf-text-1)',
        }}>{storeName}</span>}
      </div>
      {!isCompact && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          {['Shop', 'Collections', 'About', 'Contact'].map(l => (
            <span key={l} style={{ fontSize: '0.8rem', fontWeight: 500, color: isCitrus ? 'rgba(255,255,255,0.85)' : 'var(--sf-text-2)', cursor: 'pointer' }}>{l}</span>
          ))}
        </div>
      )}
      {!isCompact && <div style={{ flex: 1 }} />}
      <div style={{
        padding: isCompact ? '6px 12px' : '8px 16px', borderRadius: 'var(--sf-radius-sm)',
        background: isLuxe ? 'transparent' : isCitrus ? '#fff' : 'var(--sf-primary)',
        border: isLuxe ? '1px solid #C9A84C' : 'none',
        color: isLuxe ? '#C9A84C' : isCitrus ? primary : '#fff',
        fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 6,
        position: 'relative', flexShrink: 0,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
        {!isCompact && 'Cart'}
        <span style={{
          position: 'absolute', top: '-4px', right: '-4px',
          background: 'var(--sf-secondary)', color: '#fff',
          fontSize: '0.6rem', fontWeight: 700, minWidth: '16px', height: '16px',
          borderRadius: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
        }}>0</span>
      </div>
    </nav>
  );
}

function SfHero({ theme, storeName, tagline, settings, primary, secondary, buttonStyle, width }: {
  theme: StorefrontTheme; storeName: string; tagline: string;
  settings: HeroSectionSettings; primary: string; secondary: string;
  buttonStyle?: 'pill' | 'square' | 'rounded'; width?: number;
}) {
  const heading = settings.heading || storeName;
  const sub = settings.showTagline !== false ? (settings.subheading || tagline) : '';
  const cta = settings.ctaLabel || 'Shop Now';
  const bgImg = settings.backgroundImage;
  const textAlign = settings.textAlign ?? 'left';
  const badgeText = settings.showBadge !== false ? (settings.badgeText || '') : '';
  const heroBg = bgImg ? `url(${bgImg}) center/cover` :
    theme === 'luxe'   ? '#111111' :
    theme === 'ankara' ? `linear-gradient(135deg,${primary}22 0%,${secondary}18 100%)` :
    theme === 'citrus' ? `linear-gradient(135deg,${primary} 0%,${secondary} 100%)` :
                         `linear-gradient(135deg,${primary}28 0%,${secondary}18 100%)`;
  const isLuxe = theme === 'luxe'; const isCitrus = theme === 'citrus'; const isMono = theme === 'mono';
  const alignMap = { left: 'flex-start' as const, center: 'center' as const, right: 'flex-end' as const };
  const align = alignMap[textAlign] ?? 'flex-start';

  let radius: number;
  if (buttonStyle === 'pill') radius = 100;
  else if (buttonStyle === 'square') radius = 0;
  else if (buttonStyle === 'rounded') radius = 8;
  else radius = isCitrus ? 100 : isLuxe ? 0 : 'var(--sf-radius-sm)' as unknown as number;

  return (
      <section style={{ background: heroBg, padding: isLuxe ? (isMobile(width) ? '48px 20px' : '72px 48px') : (isMobile(width) ? '44px 20px' : '60px 32px'), display: 'flex', flexDirection: 'column', gap: 16, minHeight: isMobile(width) ? 260 : 340, justifyContent: 'center', alignItems: align, textAlign }}>

        {badgeText && <p style={{
          fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase',
          fontWeight: 700, marginBottom: 0,
          color: isCitrus ? 'rgba(255,255,255,0.7)' : isLuxe ? '#C9A84C' : isMono ? '#555555' : 'var(--sf-text-2)',
        }}>{badgeText}</p>}

        <h1 style={{
        fontFamily: isLuxe ? '"Playfair Display",Georgia,serif' : isMono ? '"Helvetica Neue",Arial,sans-serif' : 'var(--sf-font)',
        fontSize: isMono ? 'clamp(2.4rem,6vw,4.2rem)' : isLuxe ? 'clamp(2.2rem,5.5vw,3.5rem)' : 'clamp(2rem,5vw,3.2rem)',
        fontWeight: isLuxe ? 400 : 800, fontStyle: isLuxe ? 'italic' : 'normal',
        letterSpacing: isLuxe ? '0.04em' : isMono ? '-0.03em' : '-0.02em',
        color: isLuxe ? '#F5F0E8' : isCitrus ? '#fff' : isMono ? '#000000' : 'var(--sf-text-1)',
        lineHeight: 1.1, margin: 0,
      }}>{heading}</h1>

      {sub && <p style={{ fontSize: '1.05rem', lineHeight: 1.65, maxWidth: 520, margin: 0,
        color: isLuxe ? '#A89878' : isCitrus ? 'rgba(255,255,255,0.88)' : isMono ? '#555555' : 'var(--sf-text-2)' }}>{sub}</p>}

      <a href="#" style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 8,
        padding: isLuxe ? '13px 38px' : '13px 32px',
        background: isLuxe ? 'transparent' : isCitrus ? '#fff' : primary,
        color: isLuxe ? '#C9A84C' : isCitrus ? primary : '#fff',
        border: isLuxe ? '1px solid #C9A84C' : 'none',
        borderRadius: radius,
        fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', cursor: 'pointer',
        letterSpacing: isLuxe ? '0.14em' : 0, textTransform: isLuxe ? 'uppercase' : 'none',
        width: 'fit-content',
      }}>{cta}{!isLuxe && ' →'}</a>
    </section>
  );
}

function SfFeatured({ theme, settings, primary, products, storeSlug, width }: {
  theme: StorefrontTheme; settings: FeaturedSectionSettings; primary: string; products: StorefrontProduct[]; storeSlug?: string; width?: number;
}) {
  const heading = settings.heading || 'Featured Products';
  const cols = isMobile(width) ? 2 : (settings.columns ?? 4);
  const isLuxe = theme === 'luxe';
  const maxItems = settings.maxItems ?? 4;
  const visible = products.slice(0, maxItems);

  if (visible.length === 0) {
    return (
      <section style={{ padding: '40px 32px', background: 'var(--sf-bg)' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: isLuxe ? 400 : 700, fontStyle: isLuxe ? 'italic' : 'normal', fontFamily: isLuxe ? '"Playfair Display",Georgia,serif' : 'inherit', letterSpacing: isLuxe ? '0.08em' : 0, color: 'var(--sf-text-1)', marginBottom: 20 }}>
          {heading}
        </h2>
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--sf-text-3)' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 12, opacity: 0.4 }}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <p style={{ fontSize: '0.85rem', margin: 0 }}>Add your first product to feature it here</p>
        </div>
      </section>
    );
  }

  const handleProductClick = (productId: string) => {
    if (storeSlug) {
      window.open(`/${storeSlug}/product/${productId}`, '_blank');
    }
  };

  return (
    <section style={{ padding: isMobile(width) ? '32px 16px' : '40px 32px', background: 'var(--sf-bg)' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: isLuxe ? 400 : 700, fontStyle: isLuxe ? 'italic' : 'normal', fontFamily: isLuxe ? '"Playfair Display",Georgia,serif' : 'inherit', letterSpacing: isLuxe ? '0.08em' : 0, color: 'var(--sf-text-1)', marginBottom: 20 }}>
        {heading}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: 12 }}>
        {visible.map((p, i) => (
          <div key={i} style={{ background: 'var(--sf-surface)', border: '1px solid var(--sf-border)', borderRadius: 'var(--sf-radius)', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.18s' }} onClick={() => handleProductClick(p.productId)}>
            <div style={{ aspectRatio: isLuxe ? '3/4' : '1/1', background: p.images?.[0] ? `url(${p.images[0]}) center/cover` : `${primary}${['20','16','12','0e'][i] || '10'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {p.compareAtPrice && p.compareAtPrice > p.price && <span style={{ position: 'absolute', top: 8, left: 8, fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--sf-radius-sm)', background: theme === 'ankara' ? '#FFE28C' : theme === 'citrus' ? '#FEE2E2' : primary, color: theme === 'ankara' ? '#1A1A1A' : theme === 'citrus' ? '#991B1B' : '#fff' }}>Sale</span>}
              {!p.images?.[0] && <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="1.5" opacity="0.35"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>}
            </div>
            <div style={{ padding: '10px 12px' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--sf-text-1)', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.displayName}</p>
              <p style={{ fontSize: '0.82rem', fontWeight: 700, color: primary, margin: 0 }}>₦{p.price.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SfCollections({ collections, settings, primary, secondary, width }: {
  collections: StoreCollection[]; settings: CollectionsSectionSettings; primary: string; secondary: string; width?: number;
}) {
  const heading = settings.heading || 'Collections';
  const isGrid = settings.layout === 'grid';
  const visible = collections.slice(0, settings.maxItems ?? 6);

  if (visible.length === 0) return null;

  return (
    <section style={{ padding: isMobile(width) ? '32px 16px' : '40px 32px', background: 'var(--sf-surface)', borderTop: '1px solid var(--sf-border)' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--sf-text-1)', marginBottom: 16 }}>{heading}</h2>
      <div style={{ display: isGrid ? 'grid' : 'flex', gridTemplateColumns: isGrid ? (isMobile(width) ? 'repeat(2,1fr)' : 'repeat(3,1fr)') : undefined, gap: 10, overflowX: isGrid ? undefined : 'auto', paddingBottom: isGrid ? 0 : 8 }}>
        {visible.map((col, i) => (
          <div key={i} style={{ flexShrink: 0, minWidth: 130, borderRadius: 'var(--sf-radius)', overflow: 'hidden', border: '1px solid var(--sf-border)', cursor: 'pointer', background: 'var(--sf-bg)' }}>
            <div style={{ height: 72, background: `linear-gradient(135deg,${primary}${['28','1e','14'][i]||'10'},${secondary}${['18','10','0a'][i]||'08'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--sf-text-2)' }}>
              {col.title.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ padding: '8px 12px' }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.82rem', color: 'var(--sf-text-1)' }}>{col.title}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SfAnnouncement({ settings }: { settings: AnnouncementSectionSettings }) {
  return (
    <div style={{ background: settings.backgroundColor ?? '#0F172A', color: settings.textColor ?? '#fff', padding: '10px 20px', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <span>{settings.text || 'Free delivery on orders over ₦20,000'}</span>
      {settings.linkLabel && <a href={settings.linkUrl ?? '#'} style={{ color: 'inherit', textDecoration: 'underline', opacity: 0.8 }}>{settings.linkLabel}</a>}
    </div>
  );
}

function SfAbout({ settings, theme, width }: { settings: AboutSectionSettings; theme: StorefrontTheme; width?: number }) {
  const imgLeft = settings.imagePosition === 'left';
  return (
    <section style={{ padding: isMobile(width) ? '36px 16px' : '48px 32px', background: 'var(--sf-bg)', borderTop: '1px solid var(--sf-border)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: settings.imageUrl ? (isMobile(width) ? '1fr' : '1fr 1fr') : '1fr', gap: isMobile(width) ? 20 : 40, alignItems: 'center' }}>
        {settings.imageUrl && imgLeft && (
          <img src={settings.imageUrl} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 'var(--sf-radius-lg)' }} />
        )}
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--sf-text-1)', marginBottom: 16, lineHeight: 1.2 }}>
            {settings.heading ?? 'Our Story'}
          </h2>
          <p style={{ color: 'var(--sf-text-2)', lineHeight: 1.75, fontSize: '1rem' }}>
            {settings.body ?? 'Tell customers what makes your brand special.'}
          </p>
        </div>
        {settings.imageUrl && !imgLeft && (
          <img src={settings.imageUrl} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 'var(--sf-radius-lg)' }} />
        )}
        {!settings.imageUrl && (
          <div style={{ height: 220, background: 'var(--sf-surface)', borderRadius: 'var(--sf-radius-lg)', border: '1px solid var(--sf-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--sf-text-3)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </div>
        )}
      </div>
    </section>
  );
}

function SfTestimonials({ settings, primary, width }: { settings: TestimonialsSectionSettings; primary: string; width?: number }) {
  const items = settings.testimonials ?? [];
  if (items.length === 0) return null;
  return (
    <section style={{ padding: isMobile(width) ? '36px 16px' : '48px 32px', background: 'var(--sf-surface)', borderTop: '1px solid var(--sf-border)' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--sf-text-1)', marginBottom: 24, textAlign: 'center' }}>
        {settings.heading ?? 'What our customers say'}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
        {items.map((t, i) => (
          <div key={i} style={{ background: 'var(--sf-bg)', border: '1px solid var(--sf-border)', borderRadius: 'var(--sf-radius-lg)', padding: 24 }}>
            <div style={{ color: '#F59E0B', fontSize: '0.9rem', marginBottom: 10 }}>★★★★★</div>
            <p style={{ color: 'var(--sf-text-2)', fontStyle: 'italic', lineHeight: 1.65, marginBottom: 12 }}>"{t.text}"</p>
            <p style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--sf-text-1)' }}>— {t.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SfNewsletter({ settings, primary, width }: { settings: NewsletterSectionSettings; primary: string; width?: number }) {
  return (
    <section style={{ padding: isMobile(width) ? '40px 16px' : '56px 32px', background: 'var(--sf-bg)', borderTop: '1px solid var(--sf-border)', textAlign: 'center' }}>
      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--sf-text-1)', marginBottom: 8 }}>
        {settings.heading ?? 'Join our community'}
      </h2>
      <p style={{ color: 'var(--sf-text-2)', marginBottom: 24, fontSize: '1rem', lineHeight: 1.6 }}>
        {settings.subheading ?? 'Get the latest updates, offers and more.'}
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 480, margin: '0 auto' }}>
        <input type="email" placeholder={settings.placeholder ?? 'Enter your email'}
          style={{ flex: 1, minWidth: 200, padding: '12px 16px', border: '1.5px solid var(--sf-border)', borderRadius: 'var(--sf-radius-sm)', fontSize: '0.95rem', background: 'var(--sf-surface)', color: 'var(--sf-text-1)', outline: 'none', fontFamily: 'inherit' }} />
        <button style={{ padding: '12px 24px', background: primary, color: '#fff', borderRadius: 'var(--sf-radius-sm)', fontWeight: 700, fontSize: '0.95rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          {settings.buttonLabel ?? 'Subscribe'}
        </button>
      </div>
    </section>
  );
}

function SfInstagram({ settings, width }: { settings: InstagramSectionSettings; width?: number }) {
  return (
    <section style={{ padding: isMobile(width) ? '36px 16px' : '48px 32px', background: 'var(--sf-surface)', borderTop: '1px solid var(--sf-border)' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--sf-text-1)', marginBottom: 16, textAlign: 'center' }}>
        {settings.heading ?? 'Follow us on Instagram'}
      </h2>
      {settings.handle && <p style={{ textAlign: 'center', color: 'var(--sf-text-3)', marginBottom: 16, fontSize: '0.9rem' }}>{settings.handle}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile(width) ? 3 : 6},1fr)`, gap: 6 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ aspectRatio: '1/1', background: 'var(--sf-bg)', border: '1px solid var(--sf-border)', borderRadius: 'var(--sf-radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sf-text-3)" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/></svg>
          </div>
        ))}
      </div>
    </section>
  );
}

function SfFooter({ settings, storeName, logoUrl, theme, width }: {
  settings: FooterSectionSettings; storeName: string; logoUrl?: string | null; theme: StorefrontTheme; width?: number;
}) {
  const socials = settings.socials ?? {};
  const hasSocials = Object.values(socials).some(Boolean);
  const isDark = theme === 'luxe';
  return (
    <footer style={{ background: isDark ? '#000' : 'var(--sf-surface)', borderTop: '1px solid var(--sf-border)', padding: isMobile(width) ? '32px 16px' : '40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
      {settings.showLogo !== false && logoUrl && (
        <img src={logoUrl} alt={storeName} style={{ height: 36, width: 'auto', maxWidth: 140, objectFit: 'contain', borderRadius: 'var(--sf-radius-sm)' }} />
      )}
      {settings.showLogo !== false && !logoUrl && (
        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--sf-text-1)' }}>{storeName}</span>
      )}
      {hasSocials && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {(['instagram','twitter','tiktok','facebook','youtube'] as const).map(k => {
            const url = (socials as Record<string,string>)[k];
            if (!url) return null;
            return (
              <a key={k} href={url} target="_blank" rel="noopener noreferrer" style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid var(--sf-border)', background: 'var(--sf-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sf-text-2)', textDecoration: 'none', fontSize: '0.65rem', fontWeight: 800 }}>
                {k.slice(0,2).toUpperCase()}
              </a>
            );
          })}
        </div>
      )}
      <p style={{ fontSize: '0.8rem', color: 'var(--sf-text-3)' }}>
        {settings.customText || `© ${new Date().getFullYear()} ${storeName}`}
        {settings.showPoweredBy !== false && <span> · Powered by Busmo</span>}
      </p>
    </footer>
  );
}

// ─── Link theme — standalone creator page components ─────────────────────────

function SfLinkProfile({ storeName, tagline, logoUrl, primary, secondary }: {
  storeName: string; tagline: string; logoUrl?: string | null;
  primary: string; secondary: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '48px 24px 28px', gap: 14, background: 'var(--sf-bg)' }}>
      {/* Avatar with gradient ring */}
      <div style={{
        padding: 3, borderRadius: '50%',
        background: `linear-gradient(135deg, ${primary}, ${secondary})`,
        flexShrink: 0,
      }}>
        <div style={{
          width: 86, height: 86, borderRadius: '50%', overflow: 'hidden',
          background: 'var(--sf-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {logoUrl
            ? <img src={logoUrl} alt={storeName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '2rem', fontWeight: 800, background: `linear-gradient(135deg,${primary},${secondary})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {storeName.charAt(0).toUpperCase()}
              </span>
          }
        </div>
      </div>
      {/* Name */}
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--sf-text-1)', margin: 0, letterSpacing: '-0.02em' }}>
        {storeName}
      </h1>
      {/* Bio */}
      <p style={{ fontSize: '0.92rem', color: 'var(--sf-text-2)', margin: 0, maxWidth: 440, lineHeight: 1.65 }}>
        {tagline}
      </p>
      {/* Social pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
        {['Instagram', 'Twitter', 'YouTube', 'TikTok'].map(s => (
          <span key={s} style={{
            padding: '5px 14px', borderRadius: 100,
            border: '1px solid var(--sf-border)',
            fontSize: '0.72rem', fontWeight: 600, color: 'var(--sf-text-2)',
            cursor: 'pointer', background: 'var(--sf-surface)',
            transition: 'border-color 0.18s, color 0.18s',
          }}>{s}</span>
        ))}
      </div>
    </div>
  );
}

function SfLinkProducts({ products, primary, secondary }: {
  products: { name: string; price: string; tag?: string }[];
  primary: string; secondary: string;
}) {
  return (
    <div style={{ padding: '0 20px 32px', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560, margin: '0 auto', width: '100%' }}>
      <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sf-text-3)', textAlign: 'center', margin: '0 0 4px' }}>Products & Services</p>
      {products.map((p, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 16,
          background: 'var(--sf-surface)', border: '1px solid var(--sf-border)',
          borderRadius: 'var(--sf-radius-lg)', padding: '16px 20px',
          cursor: 'pointer', transition: 'border-color 0.18s, transform 0.18s',
        }}>
          {/* Product icon */}
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--sf-radius)',
            background: `linear-gradient(135deg,${primary}28,${secondary}1c)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </div>
          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: 'var(--sf-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
              {p.tag && <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: primary + '25', color: primary, flexShrink: 0 }}>{p.tag}</span>}
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.85rem', fontWeight: 700, color: primary }}>{p.price}</p>
          </div>
          {/* Arrow */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sf-text-3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      ))}
    </div>
  );
}

function SfLinkTestimonials({ testimonials, primary }: {
  testimonials: { name: string; text: string }[];
  primary: string;
}) {
  return (
    <div style={{ padding: '0 20px 32px', display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 560, margin: '0 auto', width: '100%' }}>
      <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sf-text-3)', textAlign: 'center', margin: '0 0 4px' }}>What people say</p>
      {testimonials.map((t, i) => (
        <div key={i} style={{ background: 'var(--sf-surface)', border: '1px solid var(--sf-border)', borderRadius: 'var(--sf-radius-lg)', padding: '18px 20px' }}>
          <div style={{ color: '#F59E0B', fontSize: '0.75rem', marginBottom: 8 }}>★★★★★</div>
          <p style={{ color: 'var(--sf-text-2)', fontStyle: 'italic', lineHeight: 1.6, fontSize: '0.9rem', margin: '0 0 10px' }}>"{t.text}"</p>
          <p style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--sf-text-1)', margin: 0 }}>— {t.name}</p>
        </div>
      ))}
    </div>
  );
}

function SfLinkFooter({ storeName, primary }: { storeName: string; primary: string }) {
  return (
    <div style={{ padding: '20px 20px 36px', textAlign: 'center', borderTop: '1px solid var(--sf-border)', background: 'var(--sf-bg)' }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--sf-text-3)', margin: 0 }}>
        © {new Date().getFullYear()} {storeName} · Powered by <span style={{ color: primary }}>Busmo</span>
      </p>
    </div>
  );
}

// ─── Main StorefrontCanvas export ─────────────────────────────────────────────

export function StorefrontCanvas({
  theme,
  storeName = 'Your Store',
  tagline = 'Shop our latest collection',
  primaryColor,
  secondaryColor,
  logoUrl,
  sections,
  width = 1000,
  storeSlug,
  products = [],
  collections = [],
  fontFamily,
  buttonStyle = 'pill',
  bodyTextColor,
  bgColor,
  hideStoreNameWithLogo,
  onSectionClick,
}: StorefrontCanvasProps) {
  // Fall back to theme defaults if no colors provided
  const defaultColors: Record<StorefrontTheme, [string, string]> = {
    luxe:    ['#C9A84C', '#8B7355'],
    citrus:  ['#FF7A1A', '#8BC53F'],
    atelier: ['#D4AF6A', '#FFFFFF'],
    nordly:  ['#5B6B58', '#B7ADA0'],
    neotech: ['#3D8BFF', '#00FFC2'],
    terra:   ['#6B7A4F', '#B5652E'],
    volt:    ['#E9FF3D', '#FF3D3D'],
    botanica: ['#D8A667', '#E8C9D0'],
    prism:   ['#FFFFFF', '#FFE066'],
    ankara:  ['#FF3E7F', '#00A896'],
    midnight: ['#C9A227', '#7A6A2E'],
    harmattan: ['#4C6B8A', '#8A7A62'],
    neon:    ['#FF2E9A', '#00F0FF'],
    sunset:  ['#FFFFFF', '#FFD24C'],
    mono:    ['#FF0000', '#000000'],
  };
  const [defPrimary, defSecondary] = defaultColors[theme];
  const primary   = primaryColor   ?? defPrimary;
  const secondary = secondaryColor ?? defSecondary;

  // Merge saved sections with defaults
  const saved = sections ?? [];
  const activeSections = (saved.length > 0 ? saved : DEFAULT_SECTIONS)
    .slice()
    .sort((a, b) => a.order - b.order);

  const themeVars = getThemeCssVars(theme, primary, secondary);
  const isLink = isLinkTheme(theme);

  // Apply custom font and text color overrides
  const customVars: Record<string, string> = {};
  if (fontFamily) customVars['--sf-font'] = `'${fontFamily}', system-ui, sans-serif`;
  if (bodyTextColor) customVars['--sf-text-1'] = bodyTextColor;
  if (bgColor) customVars['--sf-bg'] = bgColor;

  // Link theme uses a completely different layout (centered profile page)
  if (isLink) {
    const linkProducts = products.slice(0, 6).map(p => ({ name: p.displayName, price: `₦${p.price.toLocaleString()}`, tag: p.compareAtPrice && p.compareAtPrice > p.price ? 'Sale' : undefined }));
    const linkTestimonials = (sections?.find(s => s.type === 'testimonials')?.settings as TestimonialsSectionSettings | undefined)?.testimonials ?? [];
    return (
      <div style={{
        width, background: 'var(--sf-bg)', fontFamily: 'var(--sf-font)',
        color: 'var(--sf-text-1)', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', userSelect: 'none', WebkitUserSelect: 'none', ...themeVars, ...customVars,
      }}>
        <SfLinkProfile storeName={storeName} tagline={tagline} logoUrl={logoUrl} primary={primary} secondary={secondary} />
        {linkProducts.length > 0 && <SfLinkProducts products={linkProducts} primary={primary} secondary={secondary} />}
        {linkTestimonials.length > 0 && <SfLinkTestimonials testimonials={linkTestimonials} primary={primary} />}
        <SfLinkFooter storeName={storeName} primary={primary} />
      </div>
    );
  }

  return (
    <div style={{
      width,
      background: 'var(--sf-bg)',
      fontFamily: 'var(--sf-font)',
      color: 'var(--sf-text-1)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      ...themeVars,
      ...customVars,
    }}>
      {activeSections.map(section => {
        if (!section.enabled) return null;
        const s = section.settings as Record<string, unknown>;
        const sectionEl = (() => {
          switch (section.type) {
            case 'header':
              return <SfNav key={section.id} theme={theme} storeName={storeName} logoUrl={logoUrl} primary={primary} storeSlug={storeSlug} hideStoreNameWithLogo={hideStoreNameWithLogo} width={width} />;
            case 'announcement':
              return <SfAnnouncement key={section.id} settings={s as unknown as AnnouncementSectionSettings} />;
            case 'hero':
              return <SfHero key={section.id} theme={theme} storeName={storeName} tagline={tagline} settings={s as HeroSectionSettings} primary={primary} secondary={secondary} buttonStyle={buttonStyle} width={width} />;
            case 'featured':
              return <SfFeatured key={section.id} theme={theme} settings={s as FeaturedSectionSettings} primary={primary} products={products} storeSlug={storeSlug} width={width} />;
            case 'collections':
              return <SfCollections key={section.id} collections={collections} settings={s as CollectionsSectionSettings} primary={primary} secondary={secondary} width={width} />;
            case 'about':
              return <SfAbout key={section.id} settings={s as AboutSectionSettings} theme={theme} width={width} />;
            case 'testimonials':
              return <SfTestimonials key={section.id} settings={s as TestimonialsSectionSettings} primary={primary} width={width} />;
            case 'instagram':
              return <SfInstagram key={section.id} settings={s as InstagramSectionSettings} width={width} />;
            case 'newsletter':
              return <SfNewsletter key={section.id} settings={s as NewsletterSectionSettings} primary={primary} width={width} />;
            case 'footer':
              return <SfFooter key={section.id} settings={s as FooterSectionSettings} storeName={storeName} logoUrl={logoUrl} theme={theme} width={width} />;
            default:
              return null;
          }
        })();
        if (!sectionEl) return null;
        return (
          <div
            key={section.id}
            onClick={() => onSectionClick?.(section.id)}
            style={{
              cursor: onSectionClick ? 'pointer' : undefined,
              position: 'relative',
              transition: 'outline 0.15s',
            }}
            title={onSectionClick ? `Edit ${section.type}` : undefined}
            onMouseEnter={e => { if (onSectionClick) (e.currentTarget as HTMLElement).style.outline = '2px dashed var(--sf-primary, #0EA5E9)'; (e.currentTarget as HTMLElement).style.outlineOffset = '-2px'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.outline = ''; }}
          >
            {sectionEl}
          </div>
        );
      })}
    </div>
  );
}
