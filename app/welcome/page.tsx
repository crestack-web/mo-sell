"use client";

import React from 'react';
import { SupportChatWidget } from '@/components/SupportChatWidget';

// ── Design tokens (MO Sell palette, self-contained) ──────────────────────────
const C = {
  primary:    '#0EA5E9',
  primaryDk:  '#0369A1',
  accent:     '#6366F1',
  bg:         '#F0F9FF',
  surface:    '#FFFFFF',
  border:     '#E0EFFA',
  text1:      '#0C1A2E',
  text2:      '#3D5A7A',
  text3:      '#8AAABF',
  green:      '#16A34A',
  greenBg:    '#DCFCE7',
  red:        '#DC2626',
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

// ── Nav ───────────────────────────────────────────────────────────────────────
function TopNav() {
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
    </nav>
  );
}

// ── Feature card ──────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{
      background: C.surface, borderRadius: 20, padding: '24px 20px',
      border: `1px solid ${C.border}`,
      boxShadow: '0 2px 12px rgba(14,88,140,0.06)',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ fontSize: 32, lineHeight: 1 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.text1, fontFamily: FONT_DISPLAY }}>{title}</div>
      <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, margin: 0 }}>{desc}</p>
    </div>
  );
}

// ── Step card ───────────────────────────────────────────────────────────────────
function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`,
        color: 'white', fontSize: 18, fontWeight: 800,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT_DISPLAY, flexShrink: 0,
      }}>
        {n}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.text1, marginBottom: 4, fontFamily: FONT_DISPLAY }}>{title}</div>
        <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, margin: 0 }}>{desc}</p>
      </div>
    </div>
  );
}

// ── MO AI features ───────────────────────────────────────────────────────────────
function MOAIFeature({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: `${C.primary}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text1, marginBottom: 4, fontFamily: FONT_DISPLAY }}>{title}</div>
        <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, margin: 0 }}>{desc}</p>
      </div>
    </div>
  );
}

// ── Testimonial card ────────────────────────────────────────────────────────────
function TestimonialCard({ name, role, text, avatar }: { name: string; role: string; text: string; avatar: string }) {
  return (
    <div style={{
      background: C.surface, borderRadius: 20, padding: '24px',
      border: `1px solid ${C.border}`,
      boxShadow: '0 2px 12px rgba(14,88,140,0.06)',
    }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 700, color: C.primary,
        }}>
          {avatar}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text1, fontFamily: FONT_DISPLAY }}>{name}</div>
          <div style={{ fontSize: 13, color: C.text3 }}>{role}</div>
        </div>
      </div>
      <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
        "{text}"
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WelcomePage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: ${FONT_BODY}; background: ${C.bg}; }
        .sw-nav a { transition: all 0.18s ease; }
        .sw-nav a:hover { transform: translateY(-1px); }
        .sw-section-lg { padding: 80px 5%; }
        .sw-section-md { padding: 64px 5%; }
        @media (max-width: 768px) {
          .sw-section-lg { padding: 48px 4% !important; }
          .sw-section-md { padding: 40px 4% !important; }
        }
        @media (max-width: 480px) {
          .sw-section-title { font-size: 1.3rem !important; }
          .sw-section-sub { font-size: 13px !important; }
        }
      `}</style>

      <TopNav />

      <main>
        {/* ════════════════════════════════════════════════════════════════════════
            HERO — MO AI store builder
        ════════════════════════════════════════════════════════════════════════ */}
        <section className="sw-section-lg" style={{ padding:'96px 5%', background: C.bg }}>
          <div style={{ maxWidth:1160, margin:'0 auto' }}>
            <div className="sw-ai-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, alignItems:'center' }}>
              <div>
                <div style={{
                  display:'inline-flex', alignItems:'center', gap:6,
                  padding:'6px 14px', borderRadius:100,
                  background: C.greenBg, color: C.green,
                  fontSize:12, fontWeight:700, letterSpacing:'0.04em', marginBottom:20,
                }}>
                  ✨ AI-POWERED
                </div>
                <h1 className="sw-section-title" style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:'clamp(2rem,4vw,3.2rem)', color:C.text1, letterSpacing:'-0.025em', marginBottom:16, lineHeight:1.2 }}>
                  Build your online store in minutes with MO AI
                </h1>
                <p className="sw-section-sub" style={{ color:C.text2, fontSize:17, marginBottom:32, lineHeight:1.6, maxWidth:480 }}>
                  Just tell MO what you sell — products, services, courses, or digital goods. Our AI builds your entire storefront automatically.
                </p>
                <div style={{ display:'flex', gap: 12, flexWrap:'wrap' }}>
                  <a href="/signup" style={{
                    display:'inline-flex', alignItems:'center', gap:8,
                    padding:'14px 28px', borderRadius:12, textDecoration:'none',
                    background:`linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`,
                    color:'white', fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:15,
                    boxShadow:'0 4px 16px rgba(14,165,233,0.28)',
                  }}>
                    Start free trial →
                  </a>
                  <a href="/ugc-creators" style={{
                    display:'inline-flex', alignItems:'center', gap:8,
                    padding:'14px 28px', borderRadius:12, textDecoration:'none',
                    background:C.surface, border:`1.5px solid ${C.border}`,
                    color:C.text2, fontFamily:FONT_BODY, fontWeight:600, fontSize:15,
                  }}>
                    Browse UGC Creators →
                  </a>
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'center' }}>
                <img 
                  src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png" 
                  alt="MO Sell Dashboard" 
                  style={{ maxWidth: 480, width: '100%', borderRadius: 16, boxShadow: '0 8px 32px rgba(14,165,233,0.15)' }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════════
            HOW IT WORKS — 3-step process
        ════════════════════════════════════════════════════════════════════════ */}
        <section className="sw-section-md" style={{ padding:'64px 5%', background:C.surface, borderTop:`1px solid ${C.border}` }}>
          <div style={{ maxWidth:800, margin:'0 auto' }}>
            <div style={{ textAlign:'center', marginBottom:48 }}>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:'clamp(1.4rem,3vw,2rem)', color:C.text1, letterSpacing:'-0.025em' }}>
                From idea to live store in 3 steps
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:28 }}>
              <Step n={1} title="Tell MO what you sell" desc="Describe your business, products, or skills. MO understands fashion, food, digital products, courses, services — anything." />
              <Step n={2} title="MO builds your store" desc="Your storefront, product pages with descriptions, collections, pricing, and payments are all set up automatically." />
              <Step n={3} title="Share and start selling" desc="Your store goes live instantly. Share the link, accept payments, and manage orders from your dashboard." />
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════════
            USE CASE SHOWCASE — real examples
        ════════════════════════════════════════════════════════════════════════ */}
        <section className="sw-section-lg" style={{ padding:'80px 5%', background:`linear-gradient(180deg, ${C.bg} 0%, ${C.surface} 100%)` }}>
          <div style={{ maxWidth:1160, margin:'0 auto' }}>
            <div style={{ textAlign:'center', marginBottom:48 }}>
              <div className="sw-section-title" style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:'clamp(1.4rem,3vw,2rem)', color:C.text1, letterSpacing:'-0.025em' }}>
                Built for every kind of seller
              </div>
              <p className="sw-section-sub" style={{ color:C.text2, fontSize:15, marginTop:10, maxWidth:480, margin:'10px auto 0' }}>
                From fashion brands to freelance consultants — see how MO Sell works for different businesses.
              </p>
            </div>
            <div className="sw-seller-images" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, maxWidth:900, margin:'0 auto' }}>
              {/* Left image */}
              <div style={{
                borderRadius:20, overflow:'hidden',
                border:`1px solid ${C.border}`,
                boxShadow:'0 4px 16px rgba(14,88,140,0.08)',
              }}>
                <img 
                  src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png" 
                  alt="Fashion Store Example" 
                  style={{ width: '100%', height: 400, objectFit: 'cover' }}
                />
              </div>
              {/* Right image */}
              <div style={{
                borderRadius:20, overflow:'hidden',
                border:`1px solid ${C.border}`,
                boxShadow:'0 4px 16px rgba(14,88,140,0.08)',
              }}>
                <img 
                  src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png" 
                  alt="Digital Products Example" 
                  style={{ width: '100%', height: 400, objectFit: 'cover' }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════════
            FOOTER
        ════════════════════════════════════════════════════════════════════════ */}
        <footer style={{
          padding:'48px 5%', background:C.surface,
          borderTop:`1px solid ${C.border}`,
          fontFamily: FONT_BODY,
        }}>
          <div className="sw-footer" style={{
            maxWidth:1160, margin:'0 auto',
            display:'flex', flexDirection:'column', alignItems:'center', gap:16,
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png" alt="MO Sell" style={{ height: 28, width: 'auto', objectFit: 'contain' }} />
              <span style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:14, color:C.text2 }}>MO Sell</span>
            </div>
            <p style={{ fontSize:12, color:C.text3 }}>© {new Date().getFullYear()} MO Sell · Built for African commerce</p>
            <div style={{ display:'flex', gap:20 }}>
              <a href="/welcome" style={{ fontSize:13, color:C.text3, textDecoration:'none' }}>Home</a>
              <a href="/login" style={{ fontSize:13, color:C.primary, fontWeight:600, textDecoration:'none' }}>Log in</a>
            </div>
          </div>
        </footer>

      </main>

      <SupportChatWidget />
    </>
  );
}