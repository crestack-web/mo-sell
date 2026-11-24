"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SupportChatWidget } from '@/components/SupportChatWidget';
import { MotionFrame } from '@/components/MotionFrame';

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
        <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png" alt="" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mo-sell-wordmark.png" alt="MO Sell" style={{ height: 24, width: 'auto', objectFit: 'contain' }} />
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
        <a href="/creators" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '9px 18px', borderRadius: 10,
          border: `1.5px solid ${C.border}`,
          color: C.text2, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14,
          textDecoration: 'none',
        }}>
          ✨ For Creators
        </a>
        <a href="/brands" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '9px 18px', borderRadius: 10,
          border: `1.5px solid ${C.border}`,
          color: C.text2, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14,
          textDecoration: 'none',
        }}>
          For Brands
        </a>
        <a href="/pricing" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '9px 18px', borderRadius: 10,
          border: `1.5px solid ${C.border}`,
          color: C.text2, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14,
          textDecoration: 'none',
        }}>
          Pricing
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
            href="/creators"
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
            ✨ For Creators
          </a>
          <a
            href="/brands"
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
            For Brands
          </a>
          <a
            href="/pricing"
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
            💰 Pricing
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
  icon,
  onClick
}: { 
  title: string;
  description: string;
  readTime: string;
  icon: string;
  onClick: () => void;
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
      onClick={onClick}
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

// ── Main page ────────────────────────────────────────────────────────────────
export default function WelcomePage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLessons() {
      try {
        const response = await fetch('/api/lessons');
        if (response.ok) {
          const data = await response.json();
          setLessons(data);
        }
      } catch (error) {
        console.error('Failed to fetch lessons:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLessons();
  }, []);

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
          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 3.4rem)',
              color: C.text1, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 16,
              textAlign: 'center',
            }}>
              You have something to sell.<br/>
              <span style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Let's get it flying.
              </span>
            </h1>
            <p style={{
              fontSize: 'clamp(1rem, 1.6vw, 1.15rem)',
              color: C.text2, maxWidth: 720, margin: '0 auto 30px',
              lineHeight: 1.6, textAlign: 'center',
            }}>
              Tell MO what you offer — products, digital goods, bookings, or memberships. In minutes, your storefront is ready with prices and payments, so you can share the link and get paid in naira.
            </p>
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
                Create my store, free to start
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
              <a href="#meet-mo" style={{
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
                Watch MO build one
              </a>
            </div>

            <MotionFrame
              src="/motion/mo-sell-hero.html"
              title="MO Sell hero motion — storefront, link in bio and earnings"
              ratio="900 / 640"
              loading="eager"
              style={{ maxWidth: 820, margin: '40px auto 0' }}
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          CONNECTED ECOSYSTEM — stores + creators + brands in one loop
      ════════════════════════════════════════════════════════════════════════ */}
      <section style={{
        padding: '72px 5%',
        background: `radial-gradient(circle at 12% 20%, ${C.purpleBg} 0%, transparent 32%), radial-gradient(circle at 88% 80%, ${C.greenBg} 0%, transparent 32%), ${C.surface}`,
        borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 15px',
              borderRadius: 999, background: 'rgba(99,102,241,.10)', color: C.accent,
              fontSize: 12, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase',
              marginBottom: 16,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: C.accent, boxShadow: '0 0 0 4px rgba(99,102,241,.15)' }} />
              One platform, one loop
            </div>
            <div style={{
              fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 'clamp(1.7rem, 3.4vw, 2.5rem)',
              color: C.text1, letterSpacing: '-.03em', marginBottom: 12,
            }}>
              Everything connects. Everyone wins.
            </div>
            <p style={{ fontSize: 15, color: C.text2, maxWidth: 640, margin: '0 auto', lineHeight: 1.7 }}>
              MO Sell isn't just a store builder. We host the store, connect brands with creators, and keep the whole journey — brief, video, approval, payment, sale — in one place.
            </p>
          </div>

          <MotionFrame
            src="/motion/mo-sell-ugc-offers-briefs.html"
            title="MO Sell UGC offers and briefs motion"
            ratio="900 / 640"
            style={{ maxWidth: 900, margin: '0 auto 34px' }}
          />

          {/* The loop */}
          <div className="sw-loop" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 34 }}>
            {[
              { icon: '🏪', n: '01', t: 'Brand launches a store', d: 'MO builds and hosts ecommerce for any online business — products, digital goods, bookings or memberships.', color: C.greenBg, href: '/brands' },
              { icon: '📥', n: '02', t: 'Briefs go out', d: 'The brand sends a clear brief to UGC creators with budget, deliverables and deadline attached.', color: C.bg, href: '/ugc-creators' },
              { icon: '🎬', n: '03', t: 'Creators make magic', d: 'Creators accept briefs, upload videos, and work with the brand until the clip is right.', color: C.purpleBg, href: '/creators' },
              { icon: '💸', n: '04', t: 'Everyone grows', d: 'Creators get paid. The content sends customers to the hosted store. The brand gets sales.', color: C.amberBg, href: '/pricing' },
            ].map((step) => (
              <a key={step.n} href={step.href} style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20,
                padding: 22, textDecoration: 'none', display: 'block',
                transition: 'transform .2s ease, box-shadow .2s ease, border-color .2s ease',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-5px)';
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 16px 36px rgba(14,88,140,.12)';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = C.primary;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.transform = 'none';
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = C.border;
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 13, background: step.color,
                  display: 'grid', placeItems: 'center', fontSize: 20, marginBottom: 14,
                }}>{step.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', color: C.text3, marginBottom: 6 }}>STEP {step.n}</div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: C.text1, marginBottom: 8, lineHeight: 1.25 }}>{step.t}</div>
                <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.6 }}>{step.d}</div>
              </a>
            ))}
          </div>

          {/* Three ways in */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 16 }}>
            {[
              { icon: '🛍️', t: 'Selling something?', d: 'Get a free store hosted by MO and start selling in minutes.', cta: 'Create a store', href: '/signup', bg: C.greenBg },
              { icon: '🎥', t: 'Make videos?', d: 'Build a UGC profile, receive briefs, upload clips and get paid.', cta: 'Become a creator', href: '/creators', bg: C.purpleBg },
              { icon: '🏷️', t: 'Running a brand?', d: 'Manage creators, campaigns and your own ecommerce in one workspace.', cta: 'Explore for brands', href: '/brands', bg: C.bg },
            ].map((x) => (
              <div key={x.t} style={{ background: x.bg, borderRadius: 18, padding: 22 }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>{x.icon}</div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, color: C.text1, marginBottom: 7 }}>{x.t}</div>
                <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, marginBottom: 14 }}>{x.d}</div>
                <a href={x.href} style={{ fontSize: 13, fontWeight: 800, color: C.primaryDk, textDecoration: 'none' }}>{x.cta} →</a>
              </div>
            ))}
          </div>
        </div>
        <style>{`@media(max-width:900px){.sw-loop{grid-template-columns:repeat(2,1fr)!important}}@media(max-width:560px){.sw-loop{grid-template-columns:1fr!important}}`}</style>
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
          MEET MO — "You describe it. MO builds the store."
      ════════════════════════════════════════════════════════════════════════ */}
      <section
        id="meet-mo"
        className="sw-meet"
        style={{
          padding: '84px 5%',
          background: `radial-gradient(circle at 8% 20%, ${C.greenBg} 0%, transparent 30%), radial-gradient(circle at 92% 78%, ${C.purpleBg} 0%, transparent 34%), ${C.surface}`,
          borderTop: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <style>{`
          .sw-meet-grid { display:grid; grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr); gap:48px; align-items:center; }
          .sw-meet-copy { position:relative; z-index:1; }
          .sw-meet-badge { display:inline-flex; align-items:center; gap:12px; padding:7px 17px 7px 7px; border-radius:999px; background:rgba(255,255,255,.8); border:1px solid ${C.border}; box-shadow:0 8px 24px rgba(14,88,140,.08); margin-bottom:22px; }
          .sw-meet-badge-label { font-size:11px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:${C.primaryDk}; }
          .sw-meet-points { display:grid; gap:14px; margin:28px 0 30px; }
          .sw-meet-point { display:flex; gap:13px; align-items:flex-start; }
          .sw-meet-dot { width:34px; height:34px; flex:none; border-radius:11px; display:grid; place-items:center; font-size:15px; }
          .sw-meet-point b { display:block; font-family:${FONT_DISPLAY}; font-size:14px; color:${C.text1}; margin-bottom:2px; }
          .sw-meet-point p { margin:0; font-size:13px; line-height:1.55; color:${C.text2}; }
          .sw-meet-cta { display:inline-flex; align-items:center; gap:9px; padding:14px 25px; border-radius:12px; background:linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%); color:#fff; font-family:${FONT_DISPLAY}; font-weight:700; font-size:14px; text-decoration:none; box-shadow:0 10px 26px rgba(14,165,233,.28); transition:transform .2s ease, box-shadow .2s ease; }
          .sw-meet-cta:hover { transform:translateY(-2px); box-shadow:0 14px 32px rgba(14,165,233,.36); }
          .sw-meet-stage { position:relative; min-width:0; }
          .sw-meet-halo { position:absolute; inset:-7% -5%; border-radius:48px; background:radial-gradient(circle, rgba(14,165,233,.2) 0%, rgba(99,102,241,.13) 46%, transparent 72%); filter:blur(26px); pointer-events:none; }
          .sw-meet-frame { position:relative; z-index:1; }
          @media(max-width:900px){
            .sw-meet-grid { grid-template-columns:1fr; gap:26px; }
            .sw-meet-copy { text-align:center; }
            .sw-meet-badge { margin-left:auto; margin-right:auto; }
            .sw-meet-points { max-width:520px; margin-left:auto; margin-right:auto; text-align:left; }
          }
          @media(max-width:560px){
            .sw-meet-badge-label { font-size:10px; }
            .sw-meet-point b { font-size:13px; }
          }
        `}</style>
        <div style={{ maxWidth: 1160, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div className="sw-meet-grid">
            <div className="sw-meet-copy">
              <div className="sw-meet-badge">
                <MOCharacter size={48} />
                <span className="sw-meet-badge-label">Meet MO · your AI store builder</span>
              </div>
              <h2 style={{
                fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 'clamp(1.9rem, 4vw, 3rem)',
                color: C.text1, letterSpacing: '-0.035em', lineHeight: 1.1, marginBottom: 16,
              }}>
                You describe it.<br/>
                <span style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  MO builds the store.
                </span>
              </h2>
              <p style={{ fontSize: 16, color: C.text2, lineHeight: 1.7, maxWidth: 520 }}>
                MO is the business sidekick inside MO Sell. Tell it what you sell in plain language and it shapes the storefront, adds your products, sets up payments and hands you a link you can share.
              </p>
              <div className="sw-meet-points">
                <div className="sw-meet-point">
                  <div className="sw-meet-dot" style={{ background: C.greenBg, color: C.green }}>✦</div>
                  <div>
                    <b>Understands your business</b>
                    <p>Products, digital downloads, bookings or memberships — MO knows what fits.</p>
                  </div>
                </div>
                <div className="sw-meet-point">
                  <div className="sw-meet-dot" style={{ background: C.purpleBg, color: C.purple }}>◈</div>
                  <div>
                    <b>Builds the whole storefront</b>
                    <p>Pages, collections, prices and payment setup come together automatically.</p>
                  </div>
                </div>
                <div className="sw-meet-point">
                  <div className="sw-meet-dot" style={{ background: C.amberBg, color: C.amber }}>↗</div>
                  <div>
                    <b>Launches you with a link</b>
                    <p>No technical headache. Share your store and start getting paid in naira.</p>
                  </div>
                </div>
              </div>
              <a href="/signup" className="sw-meet-cta">
                Build my store with MO
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
            </div>

            <div className="sw-meet-stage">
              <div className="sw-meet-halo" />
              <div className="sw-meet-frame">
                <MotionFrame
                  src="/motion/mo-sell-brand-storefront.html"
                  title="MO building an ecommerce storefront from a plain-language brief"
                  ratio="900 / 640"
                  loading="lazy"
                  style={{ maxWidth: 760, margin: '0 auto' }}
                />
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
            <button
              onClick={() => router.push('/lessons')}
              style={{
                background: 'none',
                border: `1px solid ${C.primary}`,
                color: C.primary,
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: 16,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = C.primary;
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = C.primary;
              }}
            >
              View all lessons →
            </button>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: 20 
          }}>
            {loading ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{
                  background: C.surface, borderRadius: 16, padding: '24px 20px',
                  border: `1px solid ${C.border}`,
                  height: 180,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: C.text3
                }}>
                  Loading...
                </div>
              ))
            ) : lessons.length > 0 ? (
              lessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  icon={lesson.icon}
                  title={lesson.title}
                  description={lesson.description}
                  readTime={lesson.read_time}
                  onClick={() => router.push(`/lessons/${lesson.slug}`)}
                />
              ))
            ) : (
              // Fallback to static cards if no lessons loaded
              <>
                <LessonCard
                  icon="💰"
                  title="Getting your first online sale"
                  description="How to move from zero to your first paying customer without overthinking it."
                  readTime="5 min read"
                  onClick={() => router.push('/lessons/getting-first-sale')}
                />
                <LessonCard
                  icon="🏷️"
                  title="Pricing your products right"
                  description="Strategies for setting prices that feel fair to customers and sustainable for you."
                  readTime="7 min read"
                  onClick={() => router.push('/lessons/pricing-products')}
                />
                <LessonCard
                  icon="📸"
                  title="Product photography basics"
                  description="Simple techniques to make your products look professional with just a phone."
                  readTime="6 min read"
                  onClick={() => router.push('/lessons/product-photography')}
                />
                <LessonCard
                  icon="📱"
                  title="Converting social followers"
                  description="Turn your Instagram or TikTok audience into paying customers without being pushy."
                  readTime="8 min read"
                  onClick={() => router.push('/lessons/converting-followers')}
                />
                <LessonCard
                  icon="📦"
                  title="Shipping essentials"
                  description="What you need to know about delivery options, packaging, and customer expectations."
                  readTime="5 min read"
                  onClick={() => router.push('/lessons/shipping-essentials')}
                />
                <LessonCard
                  icon="📊"
                  title="Understanding your analytics"
                  description="How to read your store data and make decisions that actually grow your business."
                  readTime="6 min read"
                  onClick={() => router.push('/lessons/understanding-analytics')}
                />
              </>
            )}
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
          
          <MotionFrame
            src="/motion/mo-sell-hero-2.html"
            title="MO Sell store types motion — fashion, food and beauty stores"
            ratio="900 / 640"
            style={{ maxWidth: 900, margin: '0 auto' }}
          />
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
            <a href="/creators" style={{ color: C.text2, textDecoration: 'none' }}>For Creators</a>
            <a href="/brands" style={{ color: C.text2, textDecoration: 'none' }}>For Brands</a>
            <a href="/ugc-creators" style={{ color: C.text2, textDecoration: 'none' }}>Discover Creators</a>
          </div>
          <div style={{
            display: 'flex',
            gap: 20,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
            paddingTop: 16
          }}>
            <a href="https://instagram.com/trymosell" target="_blank" rel="noopener noreferrer" style={{ color: C.text2, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            <a href="https://tiktok.com/@trymosell" target="_blank" rel="noopener noreferrer" style={{ color: C.text2, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </a>
          </div>
          <p style={{ fontSize: 12, color: C.text3, marginTop: 0 }}>
            © 2026 MO Sell by Busmo. Built for African sellers.
          </p>
        </div>
      </footer>

      <SupportChatWidget />
    </div>
  );
}
