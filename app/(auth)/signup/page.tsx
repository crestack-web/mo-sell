'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { initializeFirebase } from '@/lib/firebase';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import posthog from 'posthog-js';

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  primary: '#0EA5E9', primaryDk: '#0369A1', accent: '#6366F1',
  bg: '#F0F9FF', surface: '#FFFFFF', border: '#E0EFFA',
  text1: '#0C1A2E', text2: '#3D5A7A', text3: '#8AAABF',
  green: '#16A34A', greenBg: '#DCFCE7', red: '#DC2626', redBg: '#FEE2E2',
};
const FONT_DISPLAY = "'Clash Display','Plus Jakarta Sans',sans-serif";
const FONT_BODY = "'Plus Jakarta Sans',system-ui,sans-serif";

// ── Types ─────────────────────────────────────────────────────────────────────
type Q1Answer = 'products' | 'courses' | 'services' | 'digital';
type Q2Answer = 'genz' | 'smallbiz' | 'creative' | 'everyone' | 'custom';
type Q3Answer = 'glow' | 'pulse' | 'spark';

interface OnboardingAnswers {
  q1: Q1Answer | null;
  q2: Q2Answer | null;
  q2Custom: string;
  q3: Q3Answer | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const Q1_OPTIONS: { id: Q1Answer; emoji: string; label: string; desc: string; cat: string }[] = [
  { id: 'products', emoji: '👕', label: 'Products', desc: 'Physical items you ship', cat: 'physical-products' },
  { id: 'courses', emoji: '🎓', label: 'Courses', desc: 'Paid educational content', cat: 'courses' },
  { id: 'services', emoji: '🛠️', label: 'Services', desc: 'Bookable consultations', cat: 'services' },
  { id: 'digital', emoji: '📱', label: 'Digital', desc: 'Ebooks, templates, presets', cat: 'digital-products' },
];

const Q2_OPTIONS: { id: Q2Answer; label: string }[] = [
  { id: 'genz', label: 'Gen Z' },
  { id: 'smallbiz', label: 'Small Businesses' },
  { id: 'creative', label: 'Creatives' },
  { id: 'everyone', label: 'Everyone' },
];

const Q2_TAGLINES: Record<string, string> = {
  genz: 'Made for the next generation',
  smallbiz: 'Built for small business owners',
  creative: 'Where creativity meets commerce',
  everyone: 'Your store, your way',
};

const Q3_OPTIONS: { id: Q3Answer; label: string; vibe: string; bg: string; accent: string; preview: string }[] = [
  { id: 'glow', label: 'Glow', vibe: 'Dark & Moody', bg: '#FDF6F0', accent: '#E8927C', preview: '/dashboard/theme-preview/glow' },
  { id: 'pulse', label: 'Pulse', vibe: 'Bold & Vibrant', bg: '#FFF7ED', accent: '#FF6B35', preview: '/dashboard/theme-preview/pulse' },
  { id: 'spark', label: 'Spark', vibe: 'Clean & Minimal', bg: '#FFF8EE', accent: '#D97706', preview: '/dashboard/theme-preview/spark' },
];

const PLACEHOLDER_PRODUCTS: Record<Q1Answer, { title: string; price: number; desc: string }[]> = {
  products: [
    { title: 'Classic Tee', price: 15000, desc: 'Premium quality cotton t-shirt' },
    { title: 'Signature Mug', price: 8000, desc: 'Ceramic mug with brand design' },
    { title: 'Canvas Tote', price: 12000, desc: 'Eco-friendly canvas tote bag' },
  ],
  courses: [
    { title: 'Starter Course', price: 25000, desc: 'Complete beginner-friendly course' },
    { title: 'Masterclass', price: 50000, desc: 'Advanced deep-dive masterclass' },
    { title: 'Quick Guide', price: 10000, desc: 'Bite-sized actionable guide' },
  ],
  services: [
    { title: '30-min Consultation', price: 20000, desc: 'One-on-one strategy session' },
    { title: '1-Hour Workshop', price: 35000, desc: 'Interactive group workshop' },
    { title: 'Premium Package', price: 75000, desc: 'Comprehensive service package' },
  ],
  digital: [
    { title: 'Ebook', price: 5000, desc: 'In-depth digital ebook' },
    { title: 'Template Pack', price: 8000, desc: 'Ready-to-use templates' },
    { title: 'Preset Collection', price: 6000, desc: 'Professional preset pack' },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 30);
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SellSignupPage() {
  const router = useRouter();

  // Step tracking
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Account
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2: Business
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');

  // Step 3: Onboarding answers
  const [answers, setAnswers] = useState<OnboardingAnswers>({ q1: null, q2: null, q2Custom: '', q3: null });
  const [questionIdx, setQuestionIdx] = useState(0);
  const [building, setBuilding] = useState(false);
  const [storeCreated, setStoreCreated] = useState(false);

  // Shared
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [businessId, setBusinessId] = useState('');

  // ── Step 1→2: Create account ──────────────────────────────────────────────
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { auth, firestore } = initializeFirebase();
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: fullName });

      const uid_val = cred.user.uid;
      const businessIdVal = `biz_${uid_val.slice(0, 12)}`;

      await setDoc(doc(firestore, 'users', uid_val), {
        displayName: fullName,
        email: email,
        businessId: businessIdVal,
        plan: 'starter',
        moSellAccess: true,
        createdAt: serverTimestamp(),
      });

      await setDoc(doc(firestore, 'businesses', businessIdVal), {
        ownerUserId: uid_val,
        businessName: businessName || `${fullName}'s Business`,
        businessType: businessType,
        createdAt: serverTimestamp(),
      });

      setUserId(uid_val);
      setBusinessId(businessIdVal);

      posthog.capture('sell_signup_completed', { step: 1, businessType });
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2→3: Save business info ──────────────────────────────────────────
  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { firestore } = initializeFirebase();
      await setDoc(doc(firestore, 'businesses', businessId), {
        businessName,
        businessType,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      posthog.capture('sell_signup_completed', { step: 2, businessType });
      setQuestionIdx(0);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Create store ──────────────────────────────────────────────────
  const handleCreateStore = async () => {
    setBuilding(true);
    try {
      const { firestore } = initializeFirebase();
      const q1 = answers.q1!;
      const q3 = answers.q3!;
      const storeSlug = slugify(businessName);
      const tagline = answers.q2 === 'custom' ? answers.q2Custom : (Q2_TAGLINES[answers.q2!] ?? '');

      // Theme color presets
      const themeColors: Record<Q3Answer, { primary: string; secondary: string }> = {
        glow: { primary: '#E8927C', secondary: '#D4A574' },
        pulse: { primary: '#FF6B35', secondary: '#F7C948' },
        spark: { primary: '#D97706', secondary: '#F59E0B' },
      };
      const colors = themeColors[q3];

      // Store config
      const configData = {
        storeSlug,
        storeName: businessName,
        logoUrl: null,
        primaryColor: colors.primary,
        secondaryColor: colors.secondary,
        businessCategory: Q1_OPTIONS.find(o => o.id === q1)?.cat ?? 'physical-products',
        currency: 'NGN',
        contactEmail: email,
        contactPhone: '',
        status: 'draft' as const,
        theme: q3,
        tagline,
        storePolicy: '',
        paystackPublicKey: '',
        enabledProductTypes: ['physical'],
        pickupLocations: [],
        customDomain: null,
        customDomainStatus: 'pending' as const,
        customDomainVerifiedAt: null,
        domainPurchaseRecord: null,
        onboardingAnswers: answers,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(firestore, 'businesses', businessId, 'store', 'config'), configData);
      await setDoc(doc(firestore, 'storeIndex', storeSlug), {
        businessId, storeName: businessName, updatedAt: serverTimestamp(),
      });

      // Create placeholder products
      const placeholderProducts = PLACEHOLDER_PRODUCTS[q1];
      for (const p of placeholderProducts) {
        const productId = `prod_${Math.random().toString(36).slice(2, 10)}`;
        await setDoc(doc(firestore, 'businesses', businessId, 'storeProducts', productId), {
          id: productId,
          title: p.title,
          description: p.desc,
          price: p.price,
          compareAtPrice: null,
          images: [],
          category: q1,
          type: 'simple' as const,
          status: 'draft' as const,
          metadata: {},
          stock: null,
          variants: [],
          isSubscription: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      posthog.capture('sell_signup_completed', { step: 3, theme: q3, category: q1 });
      setStoreCreated(true);

      setTimeout(() => {
        router.replace('/dashboard/customize');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to create store');
      setBuilding(false);
    }
  };

  // Auto-create store when all questions answered
  useEffect(() => {
    if (step === 3 && questionIdx === 3 && !building && !storeCreated) {
      handleCreateStore();
    }
  }, [questionIdx, step]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4" style={{
      background: `linear-gradient(135deg, ${C.bg} 0%, #E0E7FF 100%)`,
      fontFamily: FONT_BODY,
    }}>
      <div style={{ width: '100%', maxWidth: step === 3 ? 700 : 440 }}>

        {/* Step indicators */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                background: step >= s ? `linear-gradient(135deg, ${C.primary}, ${C.accent})` : C.border,
                color: step >= s ? 'white' : C.text3,
              }}>{s}</div>
              {s < 3 && <div style={{ width: 24, height: 2, background: step > s ? C.primary : C.border, borderRadius: 1 }} />}
            </div>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            STEP 1 — Account
        ════════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div style={{
            background: C.surface, borderRadius: 20, padding: '32px 28px',
            border: `1px solid ${C.border}`, boxShadow: '0 8px 32px rgba(14,88,140,0.08)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png" alt="MO Sell" style={{ width: 48, height: 48, objectFit: 'contain', marginBottom: 12 }} />
              <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.text1, marginBottom: 4 }}>Create your account</h1>
              <p style={{ fontSize: 14, color: C.text2 }}>Step 1 of 3 — Account info</p>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: C.redBg, color: C.red, fontSize: 13, marginBottom: 16 }}>{error}</div>
            )}

            <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                type="text" placeholder="Full name" required value={fullName}
                onChange={e => setFullName(e.target.value)}
                style={{ padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: FONT_BODY, outline: 'none', background: '#F8FBFF' }}
              />
              <input
                type="email" placeholder="Email address" required value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: FONT_BODY, outline: 'none', background: '#F8FBFF' }}
              />
              <input
                type="password" placeholder="Password (min 6 characters)" required minLength={6} value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: FONT_BODY, outline: 'none', background: '#F8FBFF' }}
              />
              <button type="submit" disabled={loading} style={{
                padding: '13px', borderRadius: 10, border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? C.text3 : `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                color: 'white', fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15,
                boxShadow: loading ? 'none' : '0 4px 16px rgba(14,165,233,0.25)',
              }}>
                {loading ? 'Creating account...' : 'Continue →'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: C.text2 }}>
              Already have an account? <a href="/sell-login" style={{ color: C.primary, fontWeight: 600, textDecoration: 'none' }}>Log in</a>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            STEP 2 — Business
        ════════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div style={{
            background: C.surface, borderRadius: 20, padding: '32px 28px',
            border: `1px solid ${C.border}`, boxShadow: '0 8px 32px rgba(14,88,140,0.08)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.text1, marginBottom: 4 }}>About your business</h1>
              <p style={{ fontSize: 14, color: C.text2 }}>Step 2 of 3 — Tell us about what you sell</p>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: C.redBg, color: C.red, fontSize: 13, marginBottom: 16 }}>{error}</div>
            )}

            <form onSubmit={handleSaveBusiness} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                type="text" placeholder="Business name" required value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                style={{ padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: FONT_BODY, outline: 'none', background: '#F8FBFF' }}
              />
              <select
                required value={businessType}
                onChange={e => setBusinessType(e.target.value)}
                style={{
                  padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`,
                  fontSize: 14, fontFamily: FONT_BODY, outline: 'none', background: '#F8FBFF',
                  color: businessType ? C.text1 : C.text3,
                }}
              >
                <option value="">What do you sell?</option>
                <option value="physical-products">Physical Products</option>
                <option value="digital-products">Digital Products</option>
                <option value="courses">Courses & Education</option>
                <option value="services">Services & Consulting</option>
                <option value="fashion">Fashion & Beauty</option>
                <option value="food">Food & Beverage</option>
                <option value="creator">Creator / Personal Brand</option>
                <option value="other">Other</option>
              </select>
              <button type="submit" disabled={loading} style={{
                padding: '13px', borderRadius: 10, border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? C.text3 : `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                color: 'white', fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15,
                boxShadow: loading ? 'none' : '0 4px 16px rgba(14,165,233,0.25)',
              }}>
                {loading ? 'Saving...' : 'Continue →'}
              </button>
            </form>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            STEP 3 — 3-Question Store Builder
        ════════════════════════════════════════════════════════════════════ */}
        {step === 3 && !building && !storeCreated && (
          <div style={{
            background: C.surface, borderRadius: 20, padding: '32px 28px',
            border: `1px solid ${C.border}`, boxShadow: '0 8px 32px rgba(14,88,140,0.08)',
            transition: 'opacity 0.25s',
          }}>
            {/* Progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  flex: 1, height: 4, borderRadius: 2,
                  background: i <= questionIdx ? C.primary : C.border,
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>

            {/* ── Q1 ─────────────────────────────────────────────────────── */}
            {questionIdx === 0 && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.text1, marginBottom: 4 }}>
                    What do you sell?
                  </h1>
                  <p style={{ fontSize: 14, color: C.text2 }}>Pick the category that fits best</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {Q1_OPTIONS.map(opt => {
                    const selected = answers.q1 === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAnswers(prev => ({ ...prev, q1: opt.id }))}
                        style={{
                          padding: '20px 16px', borderRadius: 14, border: `2px solid ${selected ? C.primary : C.border}`,
                          background: selected ? '#F0F9FF' : C.surface, cursor: 'pointer',
                          textAlign: 'center', transition: 'all 0.2s',
                          boxShadow: selected ? '0 0 0 3px rgba(14,165,233,0.12)' : 'none',
                        }}
                      >
                        <div style={{ fontSize: 32, marginBottom: 8 }}>{opt.emoji}</div>
                        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, color: C.text1, marginBottom: 2 }}>{opt.label}</div>
                        <div style={{ fontSize: 12, color: C.text3 }}>{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Q2 ─────────────────────────────────────────────────────── */}
            {questionIdx === 1 && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.text1, marginBottom: 4 }}>
                    Who is it for?
                  </h1>
                  <p style={{ fontSize: 14, color: C.text2 }}>Describe your ideal customer</p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 16 }}>
                  {Q2_OPTIONS.map(opt => {
                    const selected = answers.q2 === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAnswers(prev => ({ ...prev, q2: opt.id, q2Custom: '' }))}
                        style={{
                          padding: '10px 20px', borderRadius: 100, border: `2px solid ${selected ? C.primary : C.border}`,
                          background: selected ? C.primary : C.surface,
                          color: selected ? 'white' : C.text1,
                          cursor: 'pointer', fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13,
                          transition: 'all 0.2s',
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setAnswers(prev => ({ ...prev, q2: 'custom' }))}
                    style={{
                      padding: '10px 20px', borderRadius: 100, border: `2px solid ${answers.q2 === 'custom' ? C.primary : C.border}`,
                      background: answers.q2 === 'custom' ? C.primary : C.surface,
                      color: answers.q2 === 'custom' ? 'white' : C.text1,
                      cursor: 'pointer', fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13,
                      transition: 'all 0.2s',
                    }}
                  >
                    Other
                  </button>
                </div>

                {answers.q2 === 'custom' && (
                  <input
                    type="text"
                    placeholder="Describe your audience..."
                    value={answers.q2Custom}
                    onChange={e => setAnswers(prev => ({ ...prev, q2Custom: e.target.value }))}
                    autoFocus
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`,
                      fontSize: 14, fontFamily: FONT_BODY, outline: 'none', background: '#F8FBFF',
                      boxSizing: 'border-box',
                    }}
                  />
                )}
              </div>
            )}

            {/* ── Q3 ─────────────────────────────────────────────────────── */}
            {questionIdx === 2 && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.text1, marginBottom: 4 }}>
                    Pick a vibe
                  </h1>
                  <p style={{ fontSize: 14, color: C.text2 }}>Choose a theme style for your store</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  {Q3_OPTIONS.map(opt => {
                    const selected = answers.q3 === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAnswers(prev => ({ ...prev, q3: opt.id }))}
                        style={{
                          borderRadius: 16, border: `3px solid ${selected ? opt.accent : C.border}`,
                          background: C.surface, cursor: 'pointer', overflow: 'hidden',
                          transition: 'all 0.25s', padding: 0,
                          boxShadow: selected ? `0 0 0 3px ${opt.accent}33` : 'none',
                        }}
                      >
                        <div style={{
                          height: 180, background: opt.bg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          position: 'relative',
                        }}>
                          {/* Mini store preview */}
                          <div style={{ textAlign: 'center' }}>
                            <div style={{
                              width: 40, height: 40, borderRadius: '50%',
                              background: opt.accent, margin: '0 auto 8px',
                            }} />
                            <div style={{ width: 60, height: 6, borderRadius: 3, background: opt.accent, margin: '0 auto 6px', opacity: 0.5 }} />
                            <div style={{ width: 80, height: 6, borderRadius: 3, background: opt.accent, margin: '0 auto 6px', opacity: 0.3 }} />
                            <div style={{ width: 48, height: 6, borderRadius: 3, background: opt.accent, margin: '0 auto', opacity: 0.2 }} />
                          </div>
                        </div>
                        <div style={{ padding: '12px 10px', textAlign: 'center' }}>
                          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14, color: C.text1 }}>{opt.label}</div>
                          <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{opt.vibe}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
              <button
                type="button"
                onClick={() => setQuestionIdx(i => Math.max(0, i - 1))}
                disabled={questionIdx === 0}
                style={{
                  padding: '10px 18px', borderRadius: 10, border: `1.5px solid ${C.border}`,
                  background: C.surface, color: C.text1, cursor: questionIdx === 0 ? 'not-allowed' : 'pointer',
                  fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13,
                  opacity: questionIdx === 0 ? 0.4 : 1,
                }}
              >
                ← Back
              </button>

              {questionIdx < 2 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (questionIdx === 0 && answers.q1) setQuestionIdx(1);
                    else if (questionIdx === 1 && (answers.q2 && (answers.q2 !== 'custom' || answers.q2Custom.trim()))) setQuestionIdx(2);
                  }}
                  disabled={
                    (questionIdx === 0 && !answers.q1) ||
                    (questionIdx === 1 && (!answers.q2 || (answers.q2 === 'custom' && !answers.q2Custom.trim())))
                  }
                  style={{
                    padding: '10px 22px', borderRadius: 10, border: 'none',
                    background: (questionIdx === 0 && !answers.q1) || (questionIdx === 1 && (!answers.q2 || (answers.q2 === 'custom' && !answers.q2Custom.trim())))
                      ? C.border : `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                    color: 'white', cursor: 'pointer',
                    fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13,
                  }}
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!answers.q3}
                  onClick={() => setQuestionIdx(3)}
                  style={{
                    padding: '10px 22px', borderRadius: 10, border: 'none',
                    background: answers.q3 ? C.green : C.border,
                    color: 'white', cursor: 'pointer',
                    fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13,
                  }}
                >
                  Build my store →
                </button>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            BUILDING — "MO is building your store..."
        ════════════════════════════════════════════════════════════════════ */}
        {(building || storeCreated) && step === 3 && (
          <div style={{
            background: C.surface, borderRadius: 20, padding: '48px 28px',
            border: `1px solid ${C.border}`, boxShadow: '0 8px 32px rgba(14,88,140,0.08)',
            textAlign: 'center',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 18,
              background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1784636144/mo_sell_chat_ucbw3x.png"
                alt="MO"
                style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 10 }}
              />
            </div>

            <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 20, color: C.text1, marginBottom: 6 }}>
              {storeCreated ? 'Your store is ready!' : 'MO is building your store...'}
            </h1>
            <p style={{ fontSize: 14, color: C.text3, marginBottom: 32 }}>
              {storeCreated ? 'Taking you to customize your store' : 'Setting up your storefront with your answers'}
            </p>

            {!storeCreated && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 280, margin: '0 auto' }}>
                {[
                  'Creating your storefront with your chosen theme',
                  'Adding sample products based on your category',
                  'Setting up your dashboard for customization',
                ].map((text, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 10,
                      background: '#F8FBFF', border: `1px solid ${C.border}`,
                      opacity: 0,
                      animation: 'buildingFadeIn 0.5s forwards',
                      animationDelay: `${0.5 + i * 0.8}s`,
                    }}
                  >
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: C.primary,
                      animation: 'buildingPulse 1.2s infinite',
                      animationDelay: `${i * 0.8}s`,
                    }} />
                    <span style={{ fontSize: 13, color: C.text1 }}>{text}</span>
                  </div>
                ))}
              </div>
            )}

            {storeCreated && (
              <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: C.text3 }}>
          © {new Date().getFullYear()} Busmo · MO Sell
        </div>
      </div>

      <style>{`
        @keyframes buildingFadeIn {
          to { opacity: 1; }
        }
        @keyframes buildingPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
