"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { TOKEN_PACKAGES, MONTHLY_PLANS, PAYG_COMMISSION_RATE, NGN_PER_USD } from '@/lib/pricing';

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
  amber:      '#D97706',
  amberBg:    '#FEF3C7',
  purple:     '#7C3AED',
  purpleBg:   '#EDE9FE',
};

const ICON_PAYG = 'https://res.cloudinary.com/dzjoqbg2u/image/upload/v1786305123/Untitled_-_August_08_2026_at_11.22.19_asqb6a.png';
const ICON_MONTHLY = 'https://res.cloudinary.com/dzjoqbg2u/image/upload/v1786305125/Untitled_-_August_08_2026_at_11.22.19_dnmtp6.png';

const planIconStyle: React.CSSProperties = {
  display: 'block', width: 72, height: 72, objectFit: 'cover', borderRadius: 18,
  margin: '0 auto', boxShadow: '0 8px 24px rgba(14,88,140,0.12)',
};
const FONT_DISPLAY = "'Clash Display','Plus Jakarta Sans',sans-serif";
const FONT_BODY    = "'Plus Jakarta Sans',system-ui,sans-serif";

const fmtNgn = (n: number) => `₦${n.toLocaleString('en-NG')}`;

function TopNav() {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(240,249,255,0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 5%', height: 64,
    }}>
      <Link href="/welcome" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png" alt="MO Sell" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
        <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.06em', color: C.text1, fontFamily: FONT_DISPLAY }}>MO-SELL</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Link href="/pricing" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '9px 18px', borderRadius: 10,
          border: `1.5px solid ${C.primary}`,
          color: C.primaryDk, fontFamily: FONT_BODY, fontWeight: 700, fontSize: 14,
          textDecoration: 'none', background: `${C.primary}10`,
        }}>
          Pricing
        </Link>
        <Link href="/login" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '9px 20px', borderRadius: 10,
          background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`,
          color: 'white', fontFamily: FONT_BODY, fontWeight: 700, fontSize: 14,
          textDecoration: 'none', boxShadow: '0 4px 12px rgba(14,165,233,0.28)',
        }}>
          Log in →
        </Link>
      </div>
    </nav>
  );
}

function PricingPage() {
  const [billingModel, setBillingModel] = useState<'pay_as_you_go' | 'monthly'>('pay_as_you_go');
  const selectedPlan = MONTHLY_PLANS.find(p => p.popular) ?? MONTHLY_PLANS[0];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FONT_BODY, color: C.text1 }}>
      <TopNav />

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '64px 5% 32px', maxWidth: 1100, margin: '0 auto' }}>
        <span style={{
          display: 'inline-block', padding: '6px 14px', borderRadius: 999,
          background: C.greenBg, color: C.green, fontWeight: 800, fontSize: 12,
          letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16,
        }}>
          Simple, fair pricing
        </span>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.1, marginBottom: 16 }}>
          Start free. Only pay for what you <span style={{ color: C.primary }}>sell.</span>
        </h1>
        <p style={{ color: C.text2, fontSize: 17, maxWidth: 620, margin: '0 auto', lineHeight: 1.7 }}>
          Two ways to sell with MO Sell. Pay as you go with a 20% commission on sales, or
          switch to a monthly plan — the fee only applies when your store actually earns it.
        </p>

        {/* Model switcher */}
        <div style={{
          display: 'inline-flex', gap: 6, padding: 6, borderRadius: 14,
          background: C.surface, border: `1px solid ${C.border}`,
          marginTop: 32, boxShadow: '0 8px 24px rgba(14,88,140,0.06)',
        }}>
          <button
            onClick={() => setBillingModel('pay_as_you_go')}
            style={{
              padding: '12px 28px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontFamily: FONT_BODY, fontWeight: 700, fontSize: 15,
              background: billingModel === 'pay_as_you_go' ? C.primary : 'transparent',
              color: billingModel === 'pay_as_you_go' ? 'white' : C.text2,
              transition: 'all 0.2s ease',
              boxShadow: billingModel === 'pay_as_you_go' ? '0 4px 12px rgba(14,165,233,0.30)' : 'none',
            }}
          >
            Pay-as-you-go
          </button>
          <button
            onClick={() => setBillingModel('monthly')}
            style={{
              padding: '12px 28px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontFamily: FONT_BODY, fontWeight: 700, fontSize: 15,
              background: billingModel === 'monthly' ? C.accent : 'transparent',
              color: billingModel === 'monthly' ? 'white' : C.text2,
              transition: 'all 0.2s ease',
              boxShadow: billingModel === 'monthly' ? '0 4px 12px rgba(99,102,241,0.30)' : 'none',
            }}
          >
            Monthly plans
          </button>
        </div>
      </div>

      {billingModel === 'pay_as_you_go' ? (
        <>
          {/* PAYG card */}
          <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 5% 48px' }}>
            <div style={{
              background: C.surface, borderRadius: 20, padding: 32,
              border: `2px solid ${C.primary}`, boxShadow: '0 16px 40px rgba(14,165,233,0.14)',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ICON_PAYG} alt="Pay-as-you-go" style={{ ...planIconStyle, marginBottom: 18 }} />
              <span style={{
                display: 'inline-block', padding: '4px 12px', borderRadius: 999,
                background: `${C.primary}15`, color: C.primaryDk, fontWeight: 800, fontSize: 12,
                letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16,
              }}>
                No monthly fee
              </span>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 44, color: C.primary }}>20%</span>
                <span style={{ color: C.text2, fontSize: 15, fontWeight: 600, paddingBottom: 8 }}>
                  commission per sale
                </span>
              </div>
              <p style={{ color: C.text2, fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
                No upfront cost, no monthly fee, no card required. You keep 80% of every sale —
                MO Sell only takes its cut when you actually sell.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 24 }}>
                {[
                  'Free forever',
                  'No card required at signup',
                  'Keep 80% of every sale',
                  'All themes & features included',
                  'Paystack payments built in',
                  'Cancel anytime',
                ].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: C.text2 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: 8, flexShrink: 0,
                      background: C.greenBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    {f}
                  </div>
                ))}
              </div>
              <Link href="/signup"
                style={{
                  display: 'block', textAlign: 'center', padding: '16px 24px', borderRadius: 14,
                  background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`,
                  color: 'white', fontWeight: 800, fontSize: 16, textDecoration: 'none',
                  boxShadow: '0 6px 20px rgba(14,165,233,0.30)', fontFamily: FONT_DISPLAY,
                }}>
                Start free — no card required →
              </Link>
            </div>
          </div>

          {/* Token packages */}
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 5% 64px' }}>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 26, textAlign: 'center', marginBottom: 8 }}>
              Ask Mo AI — token packages
            </h2>
            <p style={{ textAlign: 'center', color: C.text2, fontSize: 15, marginBottom: 32, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
              Use MO&apos;s AI to build your store, generate product descriptions, and create ebooks.
              Buy tokens as you go — only when you need them.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {TOKEN_PACKAGES.map(pkg => (
                <div key={pkg.id} style={{
                  position: 'relative',
                  background: C.surface, borderRadius: 18, padding: 28,
                  border: pkg.popular ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                  boxShadow: pkg.popular ? '0 12px 32px rgba(99,102,241,0.16)' : '0 4px 16px rgba(14,88,140,0.05)',
                }}>
                  {pkg.popular && (
                    <span style={{
                      position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
                      padding: '4px 12px', borderRadius: 999, background: C.accent, color: 'white',
                      fontSize: 11, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
                    }}>
                      Most popular
                    </span>
                  )}
                  <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 4, fontFamily: FONT_DISPLAY }}>{pkg.name}</div>
                  <div style={{ fontSize: 13, color: C.text3, marginBottom: 16 }}>{pkg.tokens.toLocaleString()} tokens</div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 26, color: pkg.popular ? C.accent : C.primary }}>
                    {fmtNgn(pkg.price)}
                  </div>
                  <div style={{ fontSize: 13, color: C.text3, marginBottom: 16 }}>
                    ≈ ${(pkg.price / NGN_PER_USD).toFixed(1)} · ~{fmtNgn(pkg.price / pkg.tokens)}/token
                  </div>
                  <Link href="/signup" style={{
                    display: 'block', textAlign: 'center', padding: '11px 16px', borderRadius: 10,
                    border: `1.5px solid ${pkg.popular ? C.accent : C.primary}`,
                    color: pkg.popular ? C.accent : C.primaryDk, fontWeight: 700, fontSize: 14,
                    textDecoration: 'none', background: 'transparent',
                  }}>
                    Get started
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Monthly plans */}
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 5% 48px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ICON_MONTHLY} alt="Monthly plans" style={{ ...planIconStyle, marginBottom: 28 }} />
            <div style={{
              maxWidth: 760, margin: '0 auto 36px', padding: 18, borderRadius: 14,
              background: C.amberBg, border: `1px solid ${C.amber}40`, textAlign: 'center',
            }}>
              <div style={{ fontWeight: 800, color: C.amber, marginBottom: 4 }}>💡 Conditional billing — you only pay when you earn</div>
              <div style={{ fontSize: 14, color: C.text2, lineHeight: 1.6 }}>
                The monthly fee is deducted from your earnings balance <strong>only in months where your revenue is at least the plan fee</strong>.
                If you make less, that month&apos;s fee is simply waived. The Standard plan charges a small 5% commission
                (10% on digital products); Pro and Enterprise charge no commission at all.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {MONTHLY_PLANS.map(plan => (
                <div key={plan.id} style={{
                  position: 'relative',
                  display: 'flex', flexDirection: 'column',
                  background: C.surface, borderRadius: 20, padding: 30,
                  border: plan.popular ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                  boxShadow: plan.popular ? '0 16px 40px rgba(99,102,241,0.18)' : '0 4px 16px rgba(14,88,140,0.05)',
                }}>
                  {plan.popular && (
                    <span style={{
                      position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
                      padding: '4px 12px', borderRadius: 999, background: C.accent, color: 'white',
                      fontSize: 11, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}>
                      Most popular
                    </span>
                  )}
                  <div style={{ fontWeight: 800, fontSize: 18, fontFamily: FONT_DISPLAY }}>{plan.name}</div>
                  <div style={{ fontSize: 13, color: C.text3, marginBottom: 16 }}>{plan.tagline}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 20 }}>
                    <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 40, color: plan.popular ? C.accent : C.primary }}>
                      ${plan.priceUsd}
                    </span>
                    <span style={{ color: C.text3, fontSize: 14 }}>/ month</span>
                  </div>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, marginBottom: 24, flex: 1 }}>
                    {plan.features.map((f, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: C.text2, marginBottom: 10 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={plan.popular ? C.accent : C.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" style={{
                    display: 'block', textAlign: 'center', padding: '14px 20px', borderRadius: 12,
                    background: plan.popular ? `linear-gradient(135deg, ${C.accent} 0%, ${C.primary} 100%)` : C.surface,
                    border: plan.popular ? 'none' : `1.5px solid ${C.primary}`,
                    color: plan.popular ? 'white' : C.primaryDk, fontWeight: 800, fontSize: 15,
                    textDecoration: 'none',
                    boxShadow: plan.popular ? '0 6px 20px rgba(99,102,241,0.28)' : 'none',
                    fontFamily: FONT_DISPLAY,
                  }}>
                    Start free, upgrade anytime
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Comparison note */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 5% 64px' }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 24, textAlign: 'center', marginBottom: 28 }}>
          Which model fits you?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div style={{ background: C.surface, borderRadius: 16, padding: 24, border: `1px solid ${C.border}` }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>🪙 Pay-as-you-go</div>
            <div style={{ fontSize: 14, color: C.text2, lineHeight: 1.7 }}>
              Best for <strong>just starting out</strong> or selling occasionally. Pay 20% per sale,
              nothing when you don&apos;t sell. No commitment, no card.
            </div>
          </div>
          <div style={{ background: C.surface, borderRadius: 16, padding: 24, border: `1px solid ${C.border}` }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>📈 Monthly plan</div>
            <div style={{ fontSize: 14, color: C.text2, lineHeight: 1.7 }}>
              Best for <strong>steady sellers</strong>. Keep more of each sale — pay 5% commission on the
              Standard plan (10% on digital) or none on Pro/Enterprise, plus a flat fee only in months you hit it.
              Switch anytime from your dashboard.
            </div>
          </div>
          <div style={{ background: C.surface, borderRadius: 16, padding: 24, border: `1px solid ${C.border}` }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>🔄 Switch anytime</div>
            <div style={{ fontSize: 14, color: C.text2, lineHeight: 1.7 }}>
              Start free on pay-as-you-go, then upgrade to a monthly plan in one click from
              <strong> Settings → Billing</strong>. Downgrading back is just as easy.
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '0 5% 80px' }}>
        <Link href="/signup" style={{
          display: 'inline-block', padding: '18px 44px', borderRadius: 14,
          background: `linear-gradient(135deg, ${C.green} 0%, #15803D 100%)`,
          color: 'white', fontWeight: 800, fontSize: 18, textDecoration: 'none',
          boxShadow: '0 8px 28px rgba(22,163,74,0.30)', fontFamily: FONT_DISPLAY,
        }}>
          Start selling free →
        </Link>
        <div style={{ marginTop: 14, fontSize: 13, color: C.text3 }}>
          {selectedPlan ? `${selectedPlan.name} plan · ${fmtNgn(selectedPlan.priceUsd * NGN_PER_USD)}/month when eligible` : 'Pay-as-you-go · free forever'}
        </div>
      </div>
    </div>
  );
}

export default PricingPage;
