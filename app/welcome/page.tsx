"use client";

import React, { useState } from 'react';
import { SupportChatWidget } from '@/components/SupportChatWidget';

// ── Design tokens (MO Sell kite identity palette) ──────────────────────────
const C = {
  primary:    '#0EA5E9',    // Sky blue - kite string
  primaryDk:  '#0369A1',
  accent:     '#6366F1',    // Purple - kite body
  bg:         '#F0F9FF',
  surface:    '#FFFFFF',
  border:     '#E0EFFA',
  text1:      '#0C1A2E',
  text2:      '#3D5A7A',
  text3:      '#8AAABF',
  green:      '#16A34A',    // Green kite
  greenBg:    '#DCFCE7',
  red:        '#DC2626',    // Red kite
  redBg:      '#FEE2E2',
  amber:      '#D97706',
  amberBg:    '#FEF3C7',
  purple:     '#7C3AED',
  purpleBg:   '#EDE9FE',
  rose:       '#E11D48',
  roseBg:     '#FFF1F2',
};
const FONT_DISPLAY = "'Clash Display','Plus Jakarta Sans',sans-serif";
const FONT_BODY    = "'Plus Jakarta Sans',system-ui,sans-serif";

// ── Kite illustration components ───────────────────────────────────────────
function GreenKite({ size = 120 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M60 10L100 50L60 90L20 50Z" fill="#16A34A" stroke="#DCFCE7" strokeWidth="2"/>
      <path d="M60 90L60 110" stroke="#DCFCE7" strokeWidth="2"/>
      <path d="M60 90L75 95" stroke="#DCFCE7" strokeWidth="2"/>
      <path d="M60 90L45 95" stroke="#DCFCE7" strokeWidth="2"/>
      <circle cx="60" cy="50" r="8" fill="white" fillOpacity="0.3"/>
    </svg>
  );
}

function PurpleKite({ size = 120 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M60 10L100 50L60 90L20 50Z" fill="#7C3AED" stroke="#EDE9FE" strokeWidth="2"/>
      <path d="M60 90L60 110" stroke="#EDE9FE" strokeWidth="2"/>
      <path d="M60 90L75 95" stroke="#EDE9FE" strokeWidth="2"/>
      <path d="M60 90L45 95" stroke="#EDE9FE" strokeWidth="2"/>
      <circle cx="60" cy="50" r="8" fill="white" fillOpacity="0.3"/>
    </svg>
  );
}

function RedKite({ size = 120 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M60 10L100 50L60 90L20 50Z" fill="#DC2626" stroke="#FEE2E2" strokeWidth="2"/>
      <path d="M60 90L60 110" stroke="#FEE2E2" strokeWidth="2"/>
      <path d="M60 90L75 95" stroke="#FEE2E2" strokeWidth="2"/>
      <path d="M60 90L45 95" stroke="#FEE2E2" strokeWidth="2"/>
      <circle cx="60" cy="50" r="8" fill="white" fillOpacity="0.3"/>
    </svg>
  );
}

function FlyingKites({ size = 200 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 40L70 70L40 100L10 70Z" fill="#16A34A" stroke="#DCFCE7" strokeWidth="1.5"/>
      <path d="M40 100L40 115" stroke="#DCFCE7" strokeWidth="1.5"/>
      <path d="M40 100L50 103" stroke="#DCFCE7" strokeWidth="1.5"/>
      <path d="M40 100L30 103" stroke="#DCFCE7" strokeWidth="1.5"/>
      
      <path d="M100 20L140 60L100 100L60 60Z" fill="#7C3AED" stroke="#EDE9FE" strokeWidth="1.5"/>
      <path d="M100 100L100 120" stroke="#EDE9FE" strokeWidth="1.5"/>
      <path d="M100 100L112 104" stroke="#EDE9FE" strokeWidth="1.5"/>
      <path d="M100 100L88 104" stroke="#EDE9FE" strokeWidth="1.5"/>
      
      <path d="M160 50L190 80L160 110L130 80Z" fill="#DC2626" stroke="#FEE2E2" strokeWidth="1.5"/>
      <path d="M160 110L160 125" stroke="#FEE2E2" strokeWidth="1.5"/>
      <path d="M160 110L170 113" stroke="#FEE2E2" strokeWidth="1.5"/>
      <path d="M160 110L150 113" stroke="#FEE2E2" strokeWidth="1.5"/>
      
      <path d="M40 115Q70 130 100 120Q130 110 160 125" stroke="#0EA5E9" strokeWidth="1" strokeDasharray="4 4" fill="none"/>
    </svg>
  );
}

// MO character illustration
function MOCharacter({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          {/* eslint-disable-next-line */}
          {`
          /* Head tilts left-right while thinking */
          #mo-head {
            transform-origin: 40px 58px;
            animation: headTilt 1.8s ease-in-out infinite;
          }
          @keyframes headTilt {
            0%   { transform: rotate(0deg); }
            20%  { transform: rotate(-8deg); }
            50%  { transform: rotate(7deg); }
            80%  { transform: rotate(-5deg); }
            100% { transform: rotate(0deg); }
          }

          /* Eyes look left then right */
          #eye-left {
            animation: eyeLeft 1.8s ease-in-out infinite;
          }
          #eye-right {
            animation: eyeRight 1.8s ease-in-out infinite;
          }
          @keyframes eyeLeft {
            0%,100% { transform: translate(0,0); }
            20%     { transform: translate(-1.5px, 0.5px); }
            50%     { transform: translate(1.5px, 0px); }
            80%     { transform: translate(-1px, 0px); }
          }
          @keyframes eyeRight {
            0%,100% { transform: translate(0,0); }
            20%     { transform: translate(-1.5px, 0.5px); }
            50%     { transform: translate(1.5px, 0px); }
            80%     { transform: translate(-1px, 0px); }
          }

          /* Thinking dots float up and fade */
          #dot1 { animation: floatDot 1.8s ease-in-out infinite 0s; }
          #dot2 { animation: floatDot 1.8s ease-in-out infinite 0.3s; }
          #dot3 { animation: floatDot 1.8s ease-in-out infinite 0.6s; }
          @keyframes floatDot {
            0%   { transform: translateY(0px); opacity: 0; }
            20%  { opacity: 1; }
            70%  { transform: translateY(-8px); opacity: 0.9; }
            100% { transform: translateY(-14px); opacity: 0; }
          }

          /* Mouth changes to a small "hmm" flat line while thinking */
          #mo-mouth {
            animation: mouthThink 1.8s ease-in-out infinite;
          }
          @keyframes mouthThink {
            0%,100% { d: path("M30 43 Q40 50 50 43"); }
            30%,70% { d: path("M32 45 Q40 45 48 45"); }
          }

          /* Cheek blush pulses */
          #blush-left, #blush-right {
            animation: blushPulse 1.8s ease-in-out infinite;
          }
          @keyframes blushPulse {
            0%,100% { opacity: 0.35; }
            50%     { opacity: 0.6; }
          }
          `}
        </style>
      </defs>

      {/* Background circle */}
      <circle cx="40" cy="40" r="38" fill="#162334"/>

      {/* Thinking dots above head */}
      <circle id="dot1" cx="55" cy="18" r="2" fill="#1DB954"/>
      <circle id="dot2" cx="61" cy="13" r="2.5" fill="#1DB954"/>
      <circle id="dot3" cx="68" cy="7" r="3" fill="#1DB954"/>

      {/* Head group (everything that tilts) */}
      <g id="mo-head">
        {/* Face */}
        <circle cx="40" cy="37" r="21" fill="#F5C9A0"/>

        {/* Hair */}
        <path d="M19 33 C19 19 61 19 61 33 L61 26 C61 14 19 14 19 26 Z" fill="#2C1A0E"/>

        {/* Eye whites + irises */}
        <ellipse cx="31" cy="36" rx="4" ry="4.5" fill="#1A2B3C"/>
        <ellipse cx="49" cy="36" rx="4" ry="4.5" fill="#1A2B3C"/>

        {/* Eye glints (move with eye animation) */}
        <g id="eye-left">
          <circle cx="32.5" cy="34.5" r="1.5" fill="white"/>
        </g>
        <g id="eye-right">
          <circle cx="50.5" cy="34.5" r="1.5" fill="white"/>
        </g>

        {/* Cheek blush */}
        <ellipse id="blush-left"  cx="23" cy="41" rx="4" ry="2.5" fill="#F4A535" opacity="0.35"/>
        <ellipse id="blush-right" cx="57" cy="41" rx="4" ry="2.5" fill="#F4A535" opacity="0.35"/>

        {/* Mouth */}
        <path id="mo-mouth" d="M30 43 Q40 50 50 43" stroke="#CC7A3A" strokeWidth="2" strokeLinecap="round" fill="none"/>
      </g>

      {/* Body (stays still) */}
      <ellipse cx="40" cy="65" rx="16" ry="7" fill="#1DB954" opacity="0.9"/>
      <rect x="32" y="58" width="16" height="9" rx="5" fill="#F5C9A0"/>
      <polygon points="36,58 44,58 42,66 38,66" fill="#1DB954"/>
    </svg>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function TopNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <nav className="sw-nav" style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(240,249,255,0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 5%', height: 64,
    }}>
      <a href="/welcome" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png" alt="MO Sell" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
        <span className="sw-nav-brand" style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.06em', color: C.text1, fontFamily: FONT_DISPLAY }}>MO-SELL</span>
      </a>
      
      {/* Desktop nav */}
      <div className="sw-nav-links" style={{ display:'flex', alignItems:'center', gap: 10 }}>
        <a href="/ugc-creators" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '9px 18px', borderRadius: 10,
          border: `1.5px solid ${C.border}`,
          color: C.text2, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14,
          textDecoration: 'none',
        }}>
          🎬 Discover Creators
        </a>
        <a href="/login" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '9px 20px', borderRadius: 10,
          background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`,
          color: 'white', fontFamily: FONT_BODY, fontWeight: 700, fontSize: 14,
          textDecoration: 'none', boxShadow: '0 4px 12px rgba(14,165,233,0.28)',
        }}>
          Log in →
        </a>
      </div>

      {/* Mobile menu button */}
      <button 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        style={{
          display: 'none',
          flexDirection: 'column',
          gap: 5,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 8,
        }}
        className="sw-mobile-menu-btn"
      >
        <span style={{ 
          width: 24, height: 2, background: C.text1, 
          transition: 'transform 0.3s ease',
          transform: mobileMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none'
        }} />
        <span style={{ 
          width: 24, height: 2, background: C.text1,
          opacity: mobileMenuOpen ? 0 : 1,
          transition: 'opacity 0.3s ease'
        }} />
        <span style={{ 
          width: 24, height: 2, background: C.text1,
          transition: 'transform 0.3s ease',
          transform: mobileMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none'
        }} />
      </button>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div style={{
          position: 'absolute',
          top: 64,
          left: 0,
          right: 0,
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          padding: '20px 5%',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: '0 4px 20px rgba(14,88,140,0.1)',
        }}>
          <a 
            href="/ugc-creators"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 16px',
              borderRadius: 10,
              color: C.text2,
              fontFamily: FONT_BODY,
              fontWeight: 600,
              fontSize: 15,
              textDecoration: 'none',
            }}
          >
            🎬 Discover Creators
          </a>
          <a 
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 16px',
              borderRadius: 10,
              background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`,
              color: 'white',
              fontFamily: FONT_BODY,
              fontWeight: 700,
              fontSize: 15,
              textDecoration: 'none',
              justifyContent: 'center',
            }}
          >
            Log in →
          </a>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .sw-nav-links { display: none !important; }
          .sw-mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}

// ── Category card with kite ───────────────────────────────────────────────────
function CategoryCard({ 
  imageUrl, 
  title, 
  subtitle, 
  items,
  color,
  bg 
}: { 
  imageUrl: string;
  title: string;
  subtitle: string;
  items: string[];
  color: string;
  bg: string;
}) {
  return (
    <div style={{
      background: C.surface, borderRadius: 24, padding: '32px 28px',
      border: `1px solid ${C.border}`,
      boxShadow: '0 2px 16px rgba(14,88,140,0.06)',
      display: 'flex', flexDirection: 'column', gap: 20,
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(14,165,233,0.14)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'none';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 16px rgba(14,88,140,0.06)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ 
          padding: 12, borderRadius: 16, 
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            style={{
              width: 48,
              height: 48,
              objectFit: 'contain',
            }}
          />
        </div>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 18, color: C.text1 }}>{title}</div>
          <div style={{ fontSize: 13, color: C.text2, marginTop: 2 }}>{subtitle}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: C.text2 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Journey stage card ───────────────────────────────────────────────────────
function JourneyStage({ 
  stage, 
  title, 
  description,
  color 
}: { 
  stage: string;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div style={{
      background: C.surface, borderRadius: 20, padding: '28px 24px',
      border: `1px solid ${C.border}`,
      boxShadow: '0 2px 12px rgba(14,88,140,0.06)',
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 14px', borderRadius: 100,
        background: color === C.green ? C.greenBg : color === C.purple ? C.purpleBg : C.redBg,
        color: color,
        fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
        width: 'fit-content',
      }}>
        {stage}
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 20, color: C.text1 }}>{title}</div>
      <div style={{ fontSize: 14, color: C.text2, lineHeight: 1.6 }}>{description}</div>
    </div>
  );
}

// ── Educational card ─────────────────────────────────────────────────────────
function LessonCard({ 
  title, 
  description, 
  readTime,
  icon 
}: { 
  title: string;
  description: string;
  readTime: string;
  icon: string;
}) {
  return (
    <div style={{
      background: C.surface, borderRadius: 16, padding: '24px 20px',
      border: `1px solid ${C.border}`,
      boxShadow: '0 2px 12px rgba(14,88,140,0.06)',
      display: 'flex', flexDirection: 'column', gap: 12,
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'pointer',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(14,165,233,0.12)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'none';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(14,88,140,0.06)';
      }}
    >
      <div style={{ fontSize: 32 }}>{icon}</div>
      <div>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, color: C.text1, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.5 }}>{description}</div>
      </div>
      <div style={{ 
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 11, color: C.text3, fontWeight: 600,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        {readTime}
      </div>
    </div>
  );
}

// ── Testimonial card ───────────────────────────────────────────────────────
function TestimonialCard({ 
  name, 
  business, 
  quote,
  avatarColor 
}: { 
  name: string;
  business: string;
  quote: string;
  avatarColor: string;
}) {
  return (
    <div style={{
      background: C.surface, borderRadius: 20, padding: '28px 24px',
      border: `1px solid ${C.border}`,
      boxShadow: '0 2px 12px rgba(14,88,140,0.06)',
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <div style={{ fontSize: 24, color: C.primary }}>"</div>
      <div style={{ fontSize: 15, color: C.text2, lineHeight: 1.7, fontStyle: 'italic' }}>{quote}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: avatarColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18,
        }}>
          {name.charAt(0)}
        </div>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14, color: C.text1 }}>{name}</div>
          <div style={{ fontSize: 12, color: C.text3 }}>{business}</div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function WelcomePage() {
  return (
    <div style={{ fontFamily: FONT_BODY, background: C.bg, color: C.text1, lineHeight: 1.6 }}>
      <TopNav />
      
      {/* ════════════════════════════════════════════════════════════════════════
          HERO — "You have something to sell. Let's get it flying."
      ════════════════════════════════════════════════════════════════════════ */}
      <section style={{ 
        padding: '40px 5% 50px', 
        background: `linear-gradient(180deg, ${C.bg} 0%, ${C.surface} 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background kite pattern */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          opacity: 0.03, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle at 20% 30%, #16A34A 2px, transparent 2px), radial-gradient(circle at 80% 70%, #7C3AED 2px, transparent 2px), radial-gradient(circle at 50% 50%, #DC2626 2px, transparent 2px)',
          backgroundSize: '60px 60px',
        }} />
        
        <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            {/* Hero image from cloudinary */}
            <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785152790/Untitled_-_July_27_2026_at_08.12.54_womtaf.png"
                alt="MO Sell — AI-powered store builder"
                style={{
                  width: '100%',
                  maxWidth: 750,
                  height: 'auto',
                }}
              />
            </div>
            <h1 style={{
              fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
              color: C.text1, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 12,
              textAlign: 'center',
            }}>
              You have something to sell.<br/>
              <span style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Let's get it flying.
              </span>
            </h1>
            <div style={{
              fontSize: 'clamp(0.85rem, 1.2vw, 0.95rem)',
              color: C.text2, maxWidth: 500, margin: '0 auto 36',
              lineHeight: 1.5, textAlign: 'center',
            }}>
              MO builds your online store, adds your products and gets you ready to sell — without the usual technical headache.
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', paddingTop: 8 }}>
              <a href="/signup" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '16px 32px', borderRadius: 12,
                background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`,
                color: 'white', fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16,
                textDecoration: 'none', boxShadow: '0 8px 24px rgba(14,165,233,0.32)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 12px 32px rgba(14,165,233,0.4)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.transform = 'none';
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 24px rgba(14,165,233,0.32)';
                }}
              >
                Create my store
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
              <a href="#how-it-works" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '16px 32px', borderRadius: 12,
                border: `2px solid ${C.border}`,
                color: C.text1, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16,
                textDecoration: 'none', background: C.surface,
                transition: 'transform 0.2s ease, border-color 0.2s ease',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = C.primary;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.transform = 'none';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = C.border;
                }}
              >
                See how it works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          CATEGORIES — "Whatever you're building, there's a way to sell it."
      ════════════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '60px 5%', background: C.surface }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              color: C.text1, letterSpacing: '-0.025em', marginBottom: 12,
            }}>
              Whatever you're building, there's a way to sell it.
            </div>
            <p style={{ fontSize: 14, color: C.text2, maxWidth: 420, margin: '0 auto' }}>
              From physical products to digital downloads, MO adapts to your business.
            </p>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: 24 
          }}>
            <CategoryCard
              imageUrl="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1786186523/Untitled_-_August_08_2026_at_11.22.19_wdgobj.png"
              title="Physical Products"
              subtitle="Tangible goods, delivered"
              items={['Fashion & apparel', 'Food & beverages', 'Home & living', 'Handmade crafts']}
              color={C.green}
              bg={C.greenBg}
            />
            <CategoryCard
              imageUrl="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1786186523/Untitled_-_August_08_2026_at_11.22.19_kunvlj.png"
              title="Digital Products"
              subtitle="Instant delivery, zero logistics"
              items={['Ebooks & guides', 'Templates & tools', 'Courses & workshops', 'Software & apps']}
              color={C.purple}
              bg={C.purpleBg}
            />
            <CategoryCard
              imageUrl="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1786186523/Untitled_-_August_08_2026_at_11.22.19_ftbtyx.png"
              title="Services"
              subtitle="Your expertise, packaged"
              items={['Consulting & coaching', 'Freelance services', 'Professional advice', 'Custom work']}
              color={C.red}
              bg={C.redBg}
            />
            <CategoryCard
              imageUrl="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1786186522/Untitled_-_August_08_2026_at_11.22.19_lt7hsx.png"
              title="Creator Businesses"
              subtitle="Monetize your audience"
              items={['Merchandise', 'Exclusive content', 'Fan communities', 'Brand partnerships']}
              color={C.green}
              bg={C.greenBg}
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          MEET MO — "Your business sidekick"
      ════════════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '60px 5%', background: C.bg }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: 32, 
            alignItems: 'center' 
          }}>
            <div>
              {/* MO character image from cloudinary */}
              <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1786184878/Untitled_-_August_08_2026_at_11.22.19_chyoum.png"
                  alt="MO — Your business sidekick"
                  style={{
                    width: '100%',
                    maxWidth: 200,
                    height: 'auto',
                  }}
                />
              </div>
              {/* MO AI image from cloudinary */}
              <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785152788/Untitled_-_July_27_2026_at_08.12.54-4_v2ly3f.png"
                  alt="MO AI — builds your store for you"
                  style={{
                    width: '100%',
                    maxWidth: 350,
                    height: 'auto',
                  }}
                />
              </div>
              <h2 style={{
                fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)',
                color: C.text1, letterSpacing: '-0.025em', marginBottom: 16,
              }}>
                Meet MO.
              </h2>
              <p style={{ fontSize: 16, color: C.text2, lineHeight: 1.6, marginBottom: 12 }}>
                Your business sidekick. MO doesn't just build stores — MO understands what you're selling and makes it look good.
              </p>
              <p style={{ fontSize: 15, color: C.text2, lineHeight: 1.6 }}>
                Tell MO about your business in plain language. MO handles the technical stuff so you can focus on what you do best.
              </p>
            </div>
            
            <div style={{ 
              background: C.surface, borderRadius: 20, padding: '24px 20px',
              border: `1px solid ${C.border}`,
              boxShadow: '0 4px 24px rgba(14,88,140,0.08)',
            }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13, color: C.text3, marginBottom: 20, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                How MO works
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: C.greenBg, color: C.green,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 18,
                  }}>1</div>
                  <div>
                    <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, color: C.text1, marginBottom: 4 }}>You describe what you sell</div>
                    <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.5 }}>In plain language — "I sell handmade jewelry" or "I offer photography services"</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: C.purpleBg, color: C.purple,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 18,
                  }}>2</div>
                  <div>
                    <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, color: C.text1, marginBottom: 4 }}>MO understands</div>
                    <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.5 }}>MO figures out the best way to present your products, set prices, and organize your store</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: C.redBg, color: C.red,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 18,
                  }}>3</div>
                  <div>
                    <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, color: C.text1, marginBottom: 4 }}>MO builds your storefront</div>
                    <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.5 }}>Product pages, collections, payment setup — everything happens automatically</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                    color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 18,
                  }}>4</div>
                  <div>
                    <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, color: C.text1, marginBottom: 4 }}>Your store goes live</div>
                    <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.5 }}>Share the link and start selling. No technical headache required.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          JOURNEY — "Everything your business needs to take off"
      ════════════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" style={{ padding: '60px 5%', background: C.surface }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              color: C.text1, letterSpacing: '-0.025em', marginBottom: 12,
            }}>
              Everything your business needs to take off.
            </div>
            <p style={{ fontSize: 14, color: C.text2, maxWidth: 420, margin: '0 auto' }}>
              From building to growing, MO supports every stage of your business journey.
            </p>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: 20 
          }}>
            <JourneyStage
              stage="Build"
              title="Create your store"
              description="MO builds your storefront, adds products, and sets up payments in minutes, not days."
              color={C.green}
            />
            <JourneyStage
              stage="Launch"
              title="Go live instantly"
              description="Your store is ready to share as soon as MO finishes. No waiting, no deployment headaches."
              color={C.purple}
            />
            <JourneyStage
              stage="Sell"
              title="Accept payments"
              description="Paystack integration means you can start accepting payments immediately across Africa."
              color={C.red}
            />
            <JourneyStage
              stage="Fulfil"
              title="Manage orders"
              description="Track orders, update shipping, and keep customers informed from one simple dashboard."
              color={C.green}
            />
            <JourneyStage
              stage="Grow"
              title="Scale your business"
              description="Analytics, customer insights, and tools to help you understand what's working and grow."
              color={C.purple}
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          EMOTIONAL — "Your first sale feels different"
      ════════════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '80px 5%', background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ marginBottom: 32 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1786185319/Untitled_-_August_08_2026_at_11.22.19_czhgm2.png"
              alt="First sale celebration"
              style={{
                width: '100%',
                maxWidth: 300,
                height: 'auto',
              }}
            />
          </div>
          <h2 style={{
            fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)',
            color: 'white', letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: 20,
          }}>
            Your first sale feels different.
          </h2>
          <p style={{
            fontSize: 'clamp(1rem, 1.8vw, 1.2rem)',
            color: 'rgba(255,255,255,0.9)', lineHeight: 1.7,
          }}>
            Because that's when an idea stops being an idea.<br/>
            It becomes a business.
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          EDUCATIONAL — "MO's little lessons"
      ════════════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '60px 5%', background: C.bg }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              color: C.text1, letterSpacing: '-0.025em', marginBottom: 12,
            }}>
              MO's little lessons
            </div>
            <p style={{ fontSize: 14, color: C.text2, maxWidth: 420, margin: '0 auto' }}>
              Practical guides to help you sell smarter, not harder.
            </p>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: 20 
          }}>
            <LessonCard
              icon="💰"
              title="Getting your first online sale"
              description="How to move from zero to your first paying customer without overthinking it."
              readTime="5 min read"
            />
            <LessonCard
              icon="🏷️"
              title="Pricing your products right"
              description="Strategies for setting prices that feel fair to customers and sustainable for you."
              readTime="7 min read"
            />
            <LessonCard
              icon="📸"
              title="Product photography basics"
              description="Simple techniques to make your products look professional with just a phone."
              readTime="6 min read"
            />
            <LessonCard
              icon="📱"
              title="Converting social followers"
              description="Turn your Instagram or TikTok audience into paying customers without being pushy."
              readTime="8 min read"
            />
            <LessonCard
              icon="📦"
              title="Shipping essentials"
              description="What you need to know about delivery options, packaging, and customer expectations."
              readTime="5 min read"
            />
            <LessonCard
              icon="📊"
              title="Understanding your analytics"
              description="How to read your store data and make decisions that actually grow your business."
              readTime="6 min read"
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          SOCIAL PROOF — Real stories
      ════════════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '60px 5%', background: C.surface }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              color: C.text1, letterSpacing: '-0.025em', marginBottom: 12,
            }}>
              Sellers who let their businesses fly
            </div>
            <p style={{ fontSize: 14, color: C.text2, maxWidth: 420, margin: '0 auto' }}>
              Real stories from real sellers using MO to grow their businesses.
            </p>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: 24 
          }}>
            <TestimonialCard
              name="Chioma A."
              business="Adire Fashion"
              quote="I went from selling fabrics at the local market to having customers across Nigeria. MO made it possible without me needing to learn any technical skills."
              avatarColor={C.green}
            />
            <TestimonialCard
              name="Emeka O."
              business="Digital Courses"
              quote="My course was ready to sell in under an hour. MO understood exactly what I was teaching and created a store that looked professional from day one."
              avatarColor={C.purple}
            />
            <TestimonialCard
              name="Fatima B."
              business="Natural Skincare"
              quote="The best part is that I can focus on making my products while MO handles the store. My first sale came within 3 days of launching."
              avatarColor={C.red}
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          STORE SHOWCASE — Examples of stores MO creates
      ════════════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '60px 5%', background: C.bg }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              color: C.text1, letterSpacing: '-0.025em', marginBottom: 12,
            }}>
              See what MO can build for you
            </div>
            <p style={{ fontSize: 14, color: C.text2, maxWidth: 420, margin: '0 auto' }}>
              Beautiful stores, ready to sell. Here are examples of what MO creates.
            </p>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: 24 
          }}>
            <div style={{ textAlign: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785152790/Untitled_-_July_27_2026_at_08.12.54-2_vdjaxz.png"
                alt="MO Sell — store showcase"
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: 200,
                  objectFit: 'contain',
                }}
              />
              <p style={{ fontSize: 13, color: C.text2, marginTop: 12, fontWeight: 600 }}>
                Fashion & Apparel Store
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785151499/wlcm_1_ybgv8m.png"
                alt="MO Sell — store in action"
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: 200,
                  objectFit: 'contain',
                }}
              />
              <p style={{ fontSize: 13, color: C.text2, marginTop: 12, fontWeight: 600 }}>
                Digital Products Store
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          FINAL CTA — "Ready to let your business fly?"
      ════════════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '60px 5%', background: C.bg, position: 'relative', overflow: 'hidden' }}>
        {/* Decorative kites */}
        <div style={{ position: 'absolute', top: 40, left: 60, opacity: 0.06 }}>
          <GreenKite size={100} />
        </div>
        <div style={{ position: 'absolute', top: 120, right: 80, opacity: 0.06 }}>
          <PurpleKite size={120} />
        </div>
        <div style={{ position: 'absolute', bottom: 60, left: '33%', opacity: 0.06 }}>
          <RedKite size={90} />
        </div>
        
        <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ marginBottom: 24 }}>
            <FlyingKites size={100} />
          </div>
          <h2 style={{
            fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)',
            color: C.text1, letterSpacing: '-0.025em', marginBottom: 16,
          }}>
            Ready to let your business fly?
          </h2>
          <p style={{
            fontSize: 16, color: C.text2, marginBottom: 32, lineHeight: 1.6,
          }}>
            Create your store with MO and start selling online today.
          </p>
          <a href="/signup" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '16px 36px', borderRadius: 12,
            background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`,
            color: 'white', fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16,
            textDecoration: 'none', boxShadow: '0 8px 28px rgba(14,165,233,0.36)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-3px)';
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 12px 36px rgba(14,165,233,0.44)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.transform = 'none';
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 28px rgba(14,165,233,0.36)';
            }}
          >
            Create your store
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════════════════════ */}
      <footer style={{ 
        padding: '48px 5%', 
        background: C.surface, 
        borderTop: `1px solid ${C.border}` 
      }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png" alt="MO Sell" style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
            <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: '0.06em', color: C.text1, fontFamily: FONT_DISPLAY }}>MO-SELL by Busmo</span>
          </div>
          <p style={{ fontSize: 13, color: C.text3, marginBottom: 24 }}>
            You have something to sell. Let's get it flying.
          </p>
          <div style={{ 
            display: 'flex', 
            gap: 24, 
            justifyContent: 'center', 
            fontSize: 13, 
            color: C.text2 
          }}>
            <a href="/login" style={{ color: C.text2, textDecoration: 'none' }}>Log in</a>
            <a href="/signup" style={{ color: C.text2, textDecoration: 'none' }}>Sign up</a>
            <a href="/ugc-creators" style={{ color: C.text2, textDecoration: 'none' }}>Discover Creators</a>
          </div>
          <p style={{ fontSize: 12, color: C.text3, marginTop: 32 }}>
            © 2026 MO Sell by Busmo. Built for African sellers.
          </p>
        </div>
      </footer>

      <SupportChatWidget />
    </div>
  );
}
