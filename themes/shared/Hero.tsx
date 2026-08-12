'use client';

import React from 'react';
import type { ThemeHeroProps } from '../types';
import { THEME_TOKENS, accentText, type ThemeTokens } from './tokens';

type H = ThemeHeroProps & { themeId: string };

// ─── Shared helpers ────────────────────────────────────────────────────────────

function bgStyle(backgroundImage?: string | null) {
  return backgroundImage
    ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover' as const, backgroundPosition: 'center' as const }
    : {};
}

function alignStyle(textAlign?: string) {
  return textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start';
}

function textAl(textAlign?: string): React.CSSProperties['textAlign'] {
  return (textAlign as React.CSSProperties['textAlign']) ?? 'left';
}

function Arrow() {
  return <span style={{ fontSize: 12 }}>→</span>;
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. Atelier Noir — editorial masthead, double hairline rules, outlined CTA
// ══════════════════════════════════════════════════════════════════════════════

function AtelierHero(p: H) {
  const t = THEME_TOKENS.atelier as ThemeTokens;
  const hasBg = Boolean(p.backgroundImage);
  return (
    <section style={{ position: 'relative', padding: '92px 5%', overflow: 'hidden', background: hasBg ? undefined : t.bg, color: t.text, ...bgStyle(p.backgroundImage) }}>
      {hasBg && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.4) 100%)', pointerEvents: 'none' }} />}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: t.accent, opacity: 0.6, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: t.accent, opacity: 0.6, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 880, margin: '0 auto', textAlign: textAl(p.textAlign), display: 'flex', flexDirection: 'column', alignItems: alignStyle(p.textAlign), gap: 22 }}>
        <p style={{ fontSize: '0.66rem', fontWeight: 600, letterSpacing: '0.28em', textTransform: 'uppercase', color: t.accent, margin: 0, fontFamily: t.fontBody }}>
          {p.businessCategory || 'New Season'}
        </p>
        <h1 style={{ fontFamily: t.fontDisplay, fontWeight: 400, fontSize: 'clamp(2.2rem, 6vw, 4.2rem)', color: t.text, margin: 0, lineHeight: 1.06, letterSpacing: '0.01em' }}>
          {p.storeName}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 64, height: 1, background: t.accent, opacity: 0.9 }} />
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: t.accent }} />
          <span style={{ width: 64, height: 1, background: t.accent, opacity: 0.9 }} />
        </div>
        {p.tagline && (
          <p style={{ fontSize: '1.02rem', color: t.subtext, lineHeight: 1.7, maxWidth: 560, margin: 0, fontFamily: t.fontBody, fontStyle: 'italic' }}>
            {p.tagline}
          </p>
        )}
        <a href={p.ctaUrl || '#products'} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 12,
          padding: '14px 36px',
          border: `1px solid ${t.accent}`,
          color: t.accent,
          fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase',
          textDecoration: 'none', transition: 'all 0.3s', fontFamily: t.fontBody,
        }}
          onMouseEnter={e => { e.currentTarget.style.background = t.accent; e.currentTarget.style.color = '#0B0B0B'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.accent; }}
        >
          {p.ctaLabel || 'Shop Now'} <Arrow />
        </a>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. Citrus Market — friendly centered, dot texture, round CTA
// ══════════════════════════════════════════════════════════════════════════════

function CitrusHero(p: H) {
  const t = THEME_TOKENS.citrus as ThemeTokens;
  const hasBg = Boolean(p.backgroundImage);
  return (
    <section style={{ position: 'relative', padding: '84px 5%', overflow: 'hidden', background: hasBg ? undefined : t.bg, color: t.text, textAlign: 'center', ...bgStyle(p.backgroundImage) }}>
      {hasBg && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.25) 100%)', pointerEvents: 'none' }} />}
      {!hasBg && <div style={{ position: 'absolute', inset: 0, opacity: 0.3, pointerEvents: 'none', backgroundImage: `radial-gradient(${t.accent2} 1.5px, transparent 1.5px)`, backgroundSize: '14px 14px' }} />}
      <div style={{ position: 'absolute', left: '50%', top: -70, transform: 'translateX(-50%)', width: 340, height: 240, borderRadius: '50%', background: t.accent, opacity: 0.12, filter: 'blur(50px)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <span style={{ display: 'inline-block', background: t.accent2, color: '#fff', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', padding: '6px 18px', borderRadius: 999, fontFamily: t.fontBody }}>
          {p.businessCategory || 'Fresh Market'}
        </span>
        <h1 style={{ fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 'clamp(2.1rem, 5.5vw, 3.6rem)', color: t.text, margin: 0, lineHeight: 1.1 }}>
          {p.storeName}
        </h1>
        {p.tagline && (
          <p style={{ fontSize: '1.05rem', color: t.subtext, lineHeight: 1.6, maxWidth: 480, margin: 0, fontFamily: t.fontBody }}>
            {p.tagline}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <a href={p.ctaUrl || '#products'} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 34px', borderRadius: 999,
            background: t.accent, color: '#fff',
            fontSize: '0.95rem', fontWeight: 800, textDecoration: 'none', fontFamily: t.fontBody,
            transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            {p.ctaLabel || 'Shop Now'} <Arrow />
          </a>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 600, color: t.subtext, fontFamily: t.fontBody }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.accent2, display: 'inline-block' }} /> Local & fresh
          </span>
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. Nordic Minimal — quiet, hairline baseline, link-style CTA
// ══════════════════════════════════════════════════════════════════════════════

function NordlyHero(p: H) {
  const t = THEME_TOKENS.nordly as ThemeTokens;
  const hasBg = Boolean(p.backgroundImage);
  return (
    <section style={{ position: 'relative', padding: '96px 5% 84px', overflow: 'hidden', background: hasBg ? undefined : t.bg, color: t.text, ...bgStyle(p.backgroundImage) }}>
      {hasBg && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%)', pointerEvents: 'none' }} />}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: alignStyle(p.textAlign), textAlign: textAl(p.textAlign), gap: 18 }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.24em', textTransform: 'uppercase', color: t.accent, margin: 0, fontFamily: t.fontBody }}>
          {p.businessCategory || 'Home & Living'}
        </p>
        <h1 style={{ fontFamily: t.fontDisplay, fontWeight: 500, fontSize: 'clamp(2rem, 5vw, 3.4rem)', color: t.text, margin: 0, lineHeight: 1.12, letterSpacing: '0.01em' }}>
          {p.storeName}
        </h1>
        {p.tagline && (
          <p style={{ fontSize: '1rem', color: t.subtext, lineHeight: 1.7, maxWidth: 520, margin: 0, fontFamily: t.fontBody }}>
            {p.tagline}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
          <span style={{ width: 48, height: 1, background: t.border }} />
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: t.accent }} />
          <a href={p.ctaUrl || '#products'} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            color: t.accent, fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.06em',
            textDecoration: 'none', borderBottom: `1px solid ${t.accent}`, paddingBottom: 3, fontFamily: t.fontBody,
          }}>
            {p.ctaLabel || 'Shop Now'} <Arrow />
          </a>
        </div>
        <p style={{ margin: '8px 0 0', fontSize: '0.72rem', color: t.subtext, fontFamily: t.fontBody }}>
          Free delivery over ₦50,000 · 30-day returns
        </p>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. Neo Tech — mono labels, underline bar, corner-bracket CTA, status chip
// ══════════════════════════════════════════════════════════════════════════════

function NeotechHero(p: H) {
  const t = THEME_TOKENS.neotech as ThemeTokens;
  const hasBg = Boolean(p.backgroundImage);
  return (
    <section style={{ position: 'relative', padding: '88px 5%', overflow: 'hidden', background: hasBg ? undefined : t.bg, color: t.text, ...bgStyle(p.backgroundImage) }}>
      {hasBg && <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,14,23,0.66)', pointerEvents: 'none' }} />}
      {!hasBg && <div style={{ position: 'absolute', left: '50%', top: 4, transform: 'translateX(-50%)', width: 320, height: 160, borderRadius: '50%', filter: 'blur(56px)', opacity: 0.35, background: t.accent, pointerEvents: 'none' }} />}
      {!hasBg && <div style={{ position: 'absolute', inset: 0, opacity: 0.12, pointerEvents: 'none', backgroundImage: `linear-gradient(${t.border} 1px, transparent 1px), linear-gradient(90deg, ${t.border} 1px, transparent 1px)`, backgroundSize: '44px 44px' }} />}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, display: 'flex', flexDirection: 'column', alignItems: alignStyle(p.textAlign), textAlign: textAl(p.textAlign), gap: 18 }}>
        <p style={{ fontSize: '0.7rem', fontFamily: "'Courier New', monospace", color: t.accent, letterSpacing: '0.16em', margin: 0 }}>
          // {p.businessCategory || 'STORE'} · SYSTEM ONLINE
        </p>
        <h1 style={{ fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 'clamp(2.1rem, 5.5vw, 3.6rem)', color: t.text, margin: 0, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
          {p.storeName}
        </h1>
        <span style={{ width: 110, height: 4, background: t.accent, borderRadius: 2 }} />
        {p.tagline && (
          <p style={{ fontSize: '1.02rem', color: t.subtext, lineHeight: 1.65, maxWidth: 520, margin: 0, fontFamily: t.fontBody }}>
            {p.tagline}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
          <a href={p.ctaUrl || '#products'} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, position: 'relative',
            padding: '14px 30px', borderRadius: 8,
            background: t.accent, color: '#0A0E17',
            fontSize: '0.76rem', fontWeight: 700, fontFamily: "'Courier New', monospace", letterSpacing: '0.1em', textTransform: 'uppercase',
            textDecoration: 'none', transition: 'all 0.2s',
          }}>
            {p.ctaLabel || 'Shop Now'} <Arrow />
          </a>
          <span style={{ fontSize: '0.68rem', fontFamily: "'Courier New', monospace", color: t.subtext, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.accent2, display: 'inline-block' }} /> FREE SPEC SHEETS
          </span>
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. Terra Craft — earthy centered, swash underline, mini-facts row
// ══════════════════════════════════════════════════════════════════════════════

function TerraHero(p: H) {
  const t = THEME_TOKENS.terra as ThemeTokens;
  const hasBg = Boolean(p.backgroundImage);
  const facts: [string, string][] = [
    ['🌿', 'Handcrafted'],
    ['♻️', 'Eco materials'],
    ['🤲', 'Small batches'],
  ];
  return (
    <section style={{ position: 'relative', padding: '92px 5%', overflow: 'hidden', background: hasBg ? undefined : t.bg, color: t.text, textAlign: 'center', ...bgStyle(p.backgroundImage) }}>
      {hasBg && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(58,51,39,0.55) 0%, rgba(58,51,39,0.3) 100%)', pointerEvents: 'none' }} />}
      {!hasBg && <div style={{ position: 'absolute', inset: 0, opacity: 0.2, pointerEvents: 'none', backgroundImage: `radial-gradient(${t.accent2} 1px, transparent 1px)`, backgroundSize: '6px 6px' }} />}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <span style={{ fontSize: 26, lineHeight: 1 }}>🌿</span>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: t.accent2, margin: 0, fontFamily: t.fontBody }}>
          {p.businessCategory || 'Artisanal Goods'}
        </p>
        <h1 style={{ fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 'clamp(2rem, 5.5vw, 3.6rem)', color: t.text, margin: 0, lineHeight: 1.08 }}>
          {p.storeName}
        </h1>
        <div style={{ width: 90, height: 5, borderRadius: 999, background: `linear-gradient(90deg, ${t.accent}, ${t.accent2})` }} />
        {p.tagline && (
          <p style={{ fontSize: '1.05rem', color: t.subtext, lineHeight: 1.65, maxWidth: 500, margin: 0, fontFamily: t.fontBody }}>
            {p.tagline}
          </p>
        )}
        <a href={p.ctaUrl || '#products'} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 8,
          padding: '14px 36px', borderRadius: 999,
          background: t.accent, color: '#fff',
          fontSize: '0.95rem', fontWeight: 700, textDecoration: 'none', fontFamily: t.fontBody,
          transition: 'opacity 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
        >
          {p.ctaLabel || 'Shop Now'} <Arrow />
        </a>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginTop: 18 }}>
          {facts.map(([icon, label]) => (
            <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: t.subtext, fontFamily: t.fontBody }}>
              <span>{icon}</span> {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 6. Neon Streetwear — acid chip, huge condensed type, hard-shadow CTA, thick rule
// ══════════════════════════════════════════════════════════════════════════════

function VoltHero(p: H) {
  const t = THEME_TOKENS.volt as ThemeTokens;
  const hasBg = Boolean(p.backgroundImage);
  return (
    <section style={{ position: 'relative', padding: '0 5% 0', overflow: 'hidden', background: hasBg ? undefined : t.bg, color: t.text, ...bgStyle(p.backgroundImage) }}>
      {hasBg && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.68)', pointerEvents: 'none' }} />}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.18, pointerEvents: 'none', backgroundImage: `repeating-linear-gradient(45deg, ${t.accent} 0px, ${t.accent} 1px, transparent 1px, transparent 16px)` }} />
      <div style={{ position: 'relative', zIndex: 1, padding: '88px 0 72px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, fontFamily: "'Courier New', monospace", letterSpacing: '0.14em', padding: '6px 12px', background: t.accent2, color: '#000' }}>NEW DROP</span>
          <span style={{ fontSize: '0.68rem', fontFamily: "'Courier New', monospace", color: t.subtext }}>EST. 2026</span>
        </div>
        <h1 style={{ fontFamily: t.fontDisplay, fontWeight: 800, textTransform: 'uppercase', fontSize: 'clamp(2.4rem, 7vw, 5rem)', color: t.text, margin: 0, lineHeight: 0.98, letterSpacing: '0.01em' }}>
          {p.storeName}
        </h1>
        <div style={{ width: 72, height: 5, background: t.accent, margin: '26px 0' }} />
        {p.tagline && (
          <p style={{ fontSize: '0.95rem', color: t.subtext, lineHeight: 1.6, maxWidth: 520, margin: 0, fontFamily: t.fontBody }}>
            {p.tagline}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 30, flexWrap: 'wrap' }}>
          <a href={p.ctaUrl || '#products'} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '15px 34px',
            background: t.accent, color: '#000',
            boxShadow: '5px 5px 0 #fff',
            fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em',
            textDecoration: 'none', fontFamily: t.fontBody, transition: 'transform 0.1s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translate(2px, 2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
          >
            {p.ctaLabel || 'Shop Now'} <Arrow />
          </a>
          <span style={{ fontSize: '0.68rem', fontFamily: "'Courier New', monospace", color: t.subtext }}>FIRST 50 ORDERS GET FREE SHIPPING</span>
        </div>
      </div>
      <div style={{ position: 'relative', height: 5, background: t.accent }} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 7. Botanica — calm green, gold eyebrow, soft gold pill CTA, ritual chips
// ══════════════════════════════════════════════════════════════════════════════

function BotanicaHero(p: H) {
  const t = THEME_TOKENS.botanica as ThemeTokens;
  const hasBg = Boolean(p.backgroundImage);
  return (
    <section style={{ position: 'relative', padding: '92px 5%', overflow: 'hidden', background: hasBg ? undefined : t.bg, color: t.text, textAlign: 'center', ...bgStyle(p.backgroundImage) }}>
      {hasBg && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(15,35,24,0.6) 0%, rgba(15,35,24,0.35) 100%)', pointerEvents: 'none' }} />}
      {!hasBg && <div style={{ position: 'absolute', inset: 0, opacity: 0.22, pointerEvents: 'none', background: `radial-gradient(circle at 15% 20%, ${t.accent2} 0%, transparent 35%), radial-gradient(circle at 85% 75%, ${t.accent} 0%, transparent 40%)` }} />}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: t.accent, margin: 0, fontFamily: t.fontBody }}>
          {p.businessCategory || 'Clean Beauty'}
        </p>
        <h1 style={{ fontFamily: t.fontDisplay, fontWeight: 600, fontSize: 'clamp(2rem, 5.5vw, 3.6rem)', color: t.text, margin: 0, lineHeight: 1.1 }}>
          {p.storeName}
        </h1>
        <div style={{ width: 56, height: 2, background: t.accent, opacity: 0.7 }} />
        {p.tagline && (
          <p style={{ fontSize: '1.02rem', color: t.subtext, lineHeight: 1.7, maxWidth: 500, margin: 0, fontFamily: t.fontBody }}>
            {p.tagline}
          </p>
        )}
        <a href={p.ctaUrl || '#products'} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 10,
          padding: '14px 36px', borderRadius: 999,
          background: `linear-gradient(135deg, ${t.accent}, #C89B5A)`, color: '#0F2318',
          fontSize: '0.92rem', fontWeight: 700, textDecoration: 'none', fontFamily: t.fontBody,
          transition: 'opacity 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
        >
          {p.ctaLabel || 'Shop Now'} <Arrow />
        </a>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 16 }}>
          {['Vegan', 'Cruelty-free', 'Recyclable'].map(label => (
            <span key={label} style={{ fontSize: '0.72rem', padding: '6px 14px', borderRadius: 999, border: `1px solid ${t.border}`, color: t.subtext, fontFamily: t.fontBody }}>
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 8. Prism Studio — glass pill eyebrow, gradient underline, glowing CTA
// ══════════════════════════════════════════════════════════════════════════════

function PrismHero(p: H) {
  const t = THEME_TOKENS.prism as ThemeTokens;
  const hasBg = Boolean(p.backgroundImage);
  return (
    <section style={{ position: 'relative', padding: '96px 5%', overflow: 'hidden', background: hasBg ? undefined : t.bg, color: t.text, textAlign: 'center', ...bgStyle(p.backgroundImage) }}>
      {hasBg && <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,10,40,0.45)', pointerEvents: 'none' }} />}
      {!hasBg && (
        <>
          <div style={{ position: 'absolute', top: -70, left: '12%', width: 220, height: 220, borderRadius: '50%', background: t.accent2, opacity: 0.35, filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -80, right: '10%', width: 260, height: 260, borderRadius: '50%', background: '#4CC9F0', opacity: 0.35, filter: 'blur(70px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, opacity: 0.25, pointerEvents: 'none', background: `repeating-linear-gradient(115deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 2px, transparent 2px, transparent 18px)` }} />
        </>
      )}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(10px)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fff', fontFamily: t.fontBody }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.accent2, display: 'inline-block' }} />
          {p.businessCategory || 'New Drop'}
        </span>
        <h1 style={{ fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 'clamp(2.1rem, 6vw, 3.8rem)', color: '#fff', margin: 0, lineHeight: 1.05 }}>
          {p.storeName}
        </h1>
        <div style={{ width: 120, height: 5, borderRadius: 999, background: `linear-gradient(90deg, ${t.accent2}, #F72585, #4CC9F0)` }} />
        {p.tagline && (
          <p style={{ fontSize: '1.05rem', color: t.subtext, lineHeight: 1.65, maxWidth: 480, margin: 0, fontFamily: t.fontBody }}>
            {p.tagline}
          </p>
        )}
        <a href={p.ctaUrl || '#products'} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 10,
          padding: '15px 38px', borderRadius: 999,
          background: 'linear-gradient(135deg, #FFE066, #FF8FB2)',
          color: '#7B2FF7', boxShadow: '0 10px 30px rgba(255,224,102,0.45)',
          fontSize: '0.95rem', fontWeight: 800, textDecoration: 'none', fontFamily: t.fontBody,
          transition: 'transform 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
        >
          {p.ctaLabel || 'Shop Now'} <Arrow />
        </a>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Dispatcher
// ══════════════════════════════════════════════════════════════════════════════

export function HeroWithTheme(p: H) {
  switch (p.themeId) {
    case 'atelier': return <AtelierHero {...p} />;
    case 'citrus': return <CitrusHero {...p} />;
    case 'nordly': return <NordlyHero {...p} />;
    case 'neotech': return <NeotechHero {...p} />;
    case 'terra': return <TerraHero {...p} />;
    case 'volt': return <VoltHero {...p} />;
    case 'botanica': return <BotanicaHero {...p} />;
    case 'prism': return <PrismHero {...p} />;
    default: return <AtelierHero {...p} />;
  }
}
