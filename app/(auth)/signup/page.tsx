'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';
import { getDatabase } from '@/lib/database/adapter';
import { THEMES } from '@/themes/registry';
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
type Q3Answer = 'business_owner' | 'creator' | 'both';
type Q4Answer = 'never' | 'just_started' | 'less_than_year' | '1_3_years' | '3_plus_years';
type Q5Answer = '0' | 'under_100k' | '100k_500k' | '500k_2m' | '2m_plus' | 'prefer_not_say';
type Q6Answer = 'none' | 'under_1k' | '1k_10k' | '10k_100k' | '100k_plus';
type Q7Answer = string;

interface OnboardingAnswers {
  q1: Q1Answer | null;
  q2: Q2Answer | null;
  q2Custom: string;
  q3: Q3Answer | null;
  q4: Q4Answer | null;
  q5: Q5Answer | null;
  q6: Q6Answer | null;
  q7: Q7Answer | null;
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

const Q3_OPTIONS = THEMES.filter(t => t.type === 'link-style').map(t => ({
  id: t.id,
  label: t.name,
  vibe: t.description,
  bg: t.previewBg,
  accent: t.previewAccent,
  badge: t.badge,
}));

const Q3_OPTIONS_USER: { id: Q3Answer; emoji: string; label: string; desc: string }[] = [
  { id: 'business_owner', emoji: '🏢', label: 'Business Owner', desc: 'Selling products or services' },
  { id: 'creator', emoji: '🎨', label: 'Creator', desc: 'Building a personal brand' },
  { id: 'both', emoji: '🔄', label: 'Both', desc: 'Running a business & creating content' },
];

const Q4_OPTIONS: { id: Q4Answer; label: string; desc: string }[] = [
  { id: 'never', label: 'Never', desc: 'First time selling online' },
  { id: 'just_started', label: 'Just started', desc: 'Less than 3 months' },
  { id: 'less_than_year', label: 'Under 1 year', desc: '3–12 months' },
  { id: '1_3_years', label: '1–3 years', desc: 'Growing' },
  { id: '3_plus_years', label: '3+ years', desc: 'Experienced' },
];

const Q5_OPTIONS: { id: Q5Answer; label: string; desc: string }[] = [
  { id: '0', label: '₦0', desc: 'Not yet selling' },
  { id: 'under_100k', label: 'Under ₦100k', desc: 'Just starting out' },
  { id: '100k_500k', label: '₦100k–₦500k', desc: 'Building momentum' },
  { id: '500k_2m', label: '₦500k–₦2M', desc: 'Growing fast' },
  { id: '2m_plus', label: '₦2M+', desc: 'Scaling up' },
  { id: 'prefer_not_say', label: 'Prefer not to say', desc: '' },
];

const Q6_OPTIONS: { id: Q6Answer; label: string; desc: string }[] = [
  { id: 'none', label: 'None', desc: 'No social presence' },
  { id: 'under_1k', label: 'Under 1K', desc: 'Building audience' },
  { id: '1k_10k', label: '1K–10K', desc: 'Growing following' },
  { id: '10k_100k', label: '10K–100K', desc: 'Strong presence' },
  { id: '100k_plus', label: '100K+', desc: 'Influencer level' },
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

// ── Google mark ───────────────────────────────────────────────────────────────
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SellSignupPage() {
  const router = useRouter();

  // Step tracking
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [verificationStep, setVerificationStep] = useState<'signup' | 'verify' | 'complete'>('signup');

  // Step 1: Account
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Step 2: Business
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');

  // Step 3: Onboarding answers (7 questions + payment)
  const [answers, setAnswers] = useState<OnboardingAnswers>({ q1: null, q2: null, q2Custom: '', q3: null, q4: null, q5: null, q6: null, q7: null });
  const [questionIdx, setQuestionIdx] = useState(0);

  // Payment
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  // Shared
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [businessId, setBusinessId] = useState('');

  // ── Google sign-up (Supabase OAuth → /auth/callback) ─────────────────────
  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('[Signup] Google auth error:', err);
      setError('Google sign-up failed. Please try again.');
      setLoading(false);
    }
  };

  // ── Step 1→2: Send OTP and verify email ──────────────────────────────────
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-otp',
          email,
          password,
          fullName,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send verification code');

      setOtpSent(true);
      setVerificationStep('verify');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-otp',
          email,
          otp,
          password,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to verify email');

      setUserId(data.userId);
      setBusinessId(data.businessId);

      // Establish the browser session so the rest of onboarding (and payment) works
      const signIn = await supabaseClient.auth.signInWithPassword({ email, password });
      if (signIn.error) {
        console.error('[Signup] Auto sign-in failed:', signIn.error);
        throw new Error('Account created, but auto sign-in failed. Please try logging in.');
      }

      posthog.capture('sell_signup_completed', { step: 1, businessType });
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to verify email');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2→3: Save business info ──────────────────────────────────────────
  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const db = getDatabase();
      await db.doc(`businesses/${businessId}`).set({
        businessName,
        updatedAt: new Date().toISOString(),
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

  // ── Step 3: Save pending store → Pay $1 → Create store on success ──────────
  const handleSavePendingStore = async () => {
    setLoading(true);
    setError('');
    try {
      const db = getDatabase();
      const q1 = answers.q1!;
      const q7 = answers.q7!;
      const storeSlug = slugify(businessName);
      const tagline = answers.q2 === 'custom' ? answers.q2Custom : (Q2_TAGLINES[answers.q2!] ?? '');
      const businessCategory = Q1_OPTIONS.find(o => o.id === q1)?.cat ?? 'physical-products';

      // Theme colors from registry
      const themeMeta = THEMES.find(t => t.id === q7);
      const colors = {
        primary: themeMeta?.previewAccent ?? '#0EA5E9',
        secondary: themeMeta?.previewBg ?? '#FFFFFF',
      };

      const pendingStore = {
        storeSlug,
        storeName: businessName,
        logoUrl: null,
        primaryColor: colors.primary,
        secondaryColor: colors.secondary,
        businessCategory,
        currency: 'NGN',
        contactEmail: email,
        contactPhone: '',
        status: 'draft' as const,
        theme: q7,
        tagline,
        storePolicy: '',
        paystackPublicKey: '',
        enabledProductTypes: ['physical'],
        pickupLocations: [],
        customDomain: null,
        customDomainStatus: 'pending' as const,
        customDomainVerifiedAt: null,
        domainPurchaseRecord: null,
        onboardingAnswers: {
          ...answers,
          businessType: businessCategory,
          businessName,
        },
        productCategory: q1,
      };

      // Save pending store data to user doc for the success page to pick up
      await db.doc(`users/${userId}`).set({
        pendingStore,
        onboardingComplete: false,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      posthog.capture('sell_onboarding_answers_saved', {
        q1: answers.q1,
        q3: answers.q3,
        q4: answers.q4,
        q5: answers.q5,
        q6: answers.q6,
        theme: q7,
      });

      setShowPayment(true);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save onboarding data');
      setLoading(false);
    }
  };

  // ── Create free store (pay-as-you-go) ───────────────────────────────────
  const handleCreateFreeStore = async () => {
    setIsProcessingPayment(true);
    setError('');
    try {
      const { data: { user: currentUser } } = await supabaseClient.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      const db = getDatabase();
      const userSnap = await db.doc(`users/${currentUser.id}`).get();
      const userData = userSnap.exists ? userSnap.data() : {};
      const pendingStore = userData?.pendingStore as any;

      if (!pendingStore) throw new Error('Store setup data missing — please go back and review your answers.');

      const businessName = pendingStore.storeName || userData?.businessName || 'My Store';

      // Create store config from pending data (pay-as-you-go: 30% commission, no monthly fee)
      const configData = {
        storeSlug: pendingStore.storeSlug,
        storeName: businessName,
        logoUrl: pendingStore.logoUrl ?? null,
        primaryColor: pendingStore.primaryColor,
        secondaryColor: pendingStore.secondaryColor,
        businessCategory: pendingStore.businessCategory,
        currency: pendingStore.currency || 'NGN',
        contactEmail: currentUser.email || '',
        contactPhone: '',
        status: 'draft',
        theme: pendingStore.theme,
        tagline: pendingStore.tagline || '',
        storePolicy: '',
        paystackPublicKey: '',
        enabledProductTypes: ['physical'],
        pickupLocations: [],
        customDomain: null,
        customDomainStatus: 'pending',
        customDomainVerifiedAt: null,
        domainPurchaseRecord: null,
        onboardingAnswers: pendingStore.onboardingAnswers || {},
        billingModel: 'pay_as_you_go',
        billingStatus: 'active',
        commissionRate: 0.3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.doc(`businesses/${businessId}/store/config`).set(configData);
      await db.doc(`storeIndex/${pendingStore.storeSlug}`).set({
        businessId, storeName: businessName, updatedAt: new Date().toISOString(),
      });

      // Create placeholder products
      const PLACEHOLDER_PRODUCTS: Record<string, { title: string; price: number; desc: string }[]> = {
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

      const category = pendingStore.productCategory || 'products';
      const products = PLACEHOLDER_PRODUCTS[category as keyof typeof PLACEHOLDER_PRODUCTS] || PLACEHOLDER_PRODUCTS.products;

      for (const p of products) {
        const productId = `prod_${Math.random().toString(36).slice(2, 10)}`;
        await db.doc(`businesses/${businessId}/storeProducts/${productId}`).set({
          id: productId,
          title: p.title,
          description: p.desc,
          price: p.price,
          compareAtPrice: null,
          images: [],
          category: category,
          type: 'simple',
          status: 'draft',
          metadata: {},
          stock: null,
          variants: [],
          isSubscription: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Clear pending store data
      const updatedUserData = { ...userData };
      delete updatedUserData.pendingStore;
      updatedUserData.onboardingComplete = true;
      await db.doc(`users/${currentUser.id}`).set(updatedUserData);

      posthog.capture('sell_payg_store_created', { businessId });

      router.push('/dashboard/customize');
    } catch (err: any) {
      console.error('MO Sell free store creation error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setIsProcessingPayment(false);
    }
  };

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
              <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.text1, marginBottom: 4 }}>
                {!otpSent ? 'Create your account' : 'Verify your email'}
              </h1>
              <p style={{ fontSize: 14, color: C.text2 }}>
                {!otpSent ? 'Step 1 of 3 — Account info' : `Enter the 6-digit code sent to ${email}`}
              </p>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: C.redBg, color: C.red, fontSize: 13, marginBottom: 16 }}>{error}</div>
            )}

            {!otpSent ? (
              <>
                <button type="button" onClick={handleGoogleSignup} disabled={loading}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    width: '100%', padding: '13px', borderRadius: 10,
                    border: `1.5px solid ${C.border}`, background: C.surface,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    color: C.text1, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14,
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.borderColor = C.primary; } }}
                  onMouseLeave={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; } }}
                >
                  <GoogleMark />
                  {loading ? 'Redirecting...' : 'Continue with Google'}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                  <span style={{ fontSize: 12, color: C.text3, fontWeight: 500 }}>or sign up with email</span>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                </div>
              </>
            ) : null}

            {!otpSent ? (
              <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                  {loading ? 'Sending code...' : 'Continue →'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <input
                  type="text" placeholder="Enter 6-digit code" required value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  style={{ padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontFamily: FONT_BODY, outline: 'none', background: '#F8FBFF', textAlign: 'center', letterSpacing: 8, fontSize: 24 }}
                />
                <button type="submit" disabled={loading || otp.length !== 6} style={{
                  padding: '13px', borderRadius: 10, border: 'none',
                  cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer',
                  background: loading || otp.length !== 6 ? C.text3 : C.green,
                  color: 'white', fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15,
                  boxShadow: loading || otp.length !== 6 ? 'none' : '0 4px 16px rgba(22,163,74,0.25)',
                }}>
                  {loading ? 'Verifying...' : 'Verify Email →'}
                </button>
                <button type="button" onClick={() => { setOtpSent(false); setOtp(''); }}
                  style={{ padding: '10px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.surface, color: C.text2, cursor: 'pointer', fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13 }}>
                  ← Back to edit email
                </button>
              </form>
            )}

            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: C.text2 }}>
              Already have an account? <a href="/login" style={{ color: C.primary, fontWeight: 600, textDecoration: 'none' }}>Log in</a>
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
              <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.text1, marginBottom: 4 }}>Name your business</h1>
              <p style={{ fontSize: 14, color: C.text2 }}>Step 2 of 3 — What should we call your store?</p>
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
            STEP 3 — Qualifying Questions + Payment
        ════════════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div style={{
            background: C.surface, borderRadius: 20, padding: '32px 28px',
            border: `1px solid ${C.border}`, boxShadow: '0 8px 32px rgba(14,88,140,0.08)',
            transition: 'opacity 0.25s',
          }}>
            {!showPayment ? (
              <>
                {/* Progress bar — 7 segments */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28 }}>
                  {[0, 1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 4, borderRadius: 2,
                      background: i <= questionIdx ? C.primary : C.border,
                      transition: 'background 0.3s',
                    }} />
                  ))}
                </div>

                {/* ── Q1: What do you sell? ────────────────────────────── */}
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
                          <button key={opt.id} type="button" onClick={() => setAnswers(prev => ({ ...prev, q1: opt.id }))}
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

                {/* ── Q2: Who is your audience? ────────────────────────── */}
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
                          <button key={opt.id} type="button" onClick={() => setAnswers(prev => ({ ...prev, q2: opt.id, q2Custom: '' }))}
                            style={{
                              padding: '10px 20px', borderRadius: 100, border: `2px solid ${selected ? C.primary : C.border}`,
                              background: selected ? C.primary : C.surface,
                              color: selected ? 'white' : C.text1,
                              cursor: 'pointer', fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13,
                              transition: 'all 0.2s',
                            }}
                          >{opt.label}</button>
                        );
                      })}
                      <button type="button" onClick={() => setAnswers(prev => ({ ...prev, q2: 'custom' }))}
                        style={{
                          padding: '10px 20px', borderRadius: 100, border: `2px solid ${answers.q2 === 'custom' ? C.primary : C.border}`,
                          background: answers.q2 === 'custom' ? C.primary : C.surface,
                          color: answers.q2 === 'custom' ? 'white' : C.text1,
                          cursor: 'pointer', fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13,
                          transition: 'all 0.2s',
                        }}
                      >Other</button>
                    </div>
                    {answers.q2 === 'custom' && (
                      <input type="text" placeholder="Describe your audience..." value={answers.q2Custom}
                        onChange={e => setAnswers(prev => ({ ...prev, q2Custom: e.target.value }))} autoFocus
                        style={{
                          width: '100%', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`,
                          fontSize: 14, fontFamily: FONT_BODY, outline: 'none', background: '#F8FBFF',
                          boxSizing: 'border-box',
                        }}
                      />
                    )}
                  </div>
                )}

                {/* ── Q3: Business owner or creator? ───────────────────── */}
                {questionIdx === 2 && (
                  <div>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                      <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.text1, marginBottom: 4 }}>
                        Are you a business owner or creator?
                      </h1>
                      <p style={{ fontSize: 14, color: C.text2 }}>This helps us tailor your experience</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      {Q3_OPTIONS_USER.map(opt => {
                        const selected = answers.q3 === opt.id;
                        return (
                          <button key={opt.id} type="button" onClick={() => setAnswers(prev => ({ ...prev, q3: opt.id }))}
                            style={{
                              padding: '20px 12px', borderRadius: 14, border: `2px solid ${selected ? C.primary : C.border}`,
                              background: selected ? '#F0F9FF' : C.surface, cursor: 'pointer',
                              textAlign: 'center', transition: 'all 0.2s',
                              boxShadow: selected ? '0 0 0 3px rgba(14,165,233,0.12)' : 'none',
                            }}
                          >
                            <div style={{ fontSize: 28, marginBottom: 8 }}>{opt.emoji}</div>
                            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14, color: C.text1, marginBottom: 2 }}>{opt.label}</div>
                            <div style={{ fontSize: 11, color: C.text3 }}>{opt.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Q4: Selling history ──────────────────────────────── */}
                {questionIdx === 3 && (
                  <div>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                      <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.text1, marginBottom: 4 }}>
                        How long have you been selling online?
                      </h1>
                      <p style={{ fontSize: 14, color: C.text2 }}>Your experience level</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {Q4_OPTIONS.map(opt => {
                        const selected = answers.q4 === opt.id;
                        return (
                          <button key={opt.id} type="button" onClick={() => setAnswers(prev => ({ ...prev, q4: opt.id }))}
                            style={{
                              padding: '16px 14px', borderRadius: 12, border: `2px solid ${selected ? C.primary : C.border}`,
                              background: selected ? '#F0F9FF' : C.surface, cursor: 'pointer',
                              textAlign: 'center', transition: 'all 0.2s',
                              boxShadow: selected ? '0 0 0 3px rgba(14,165,233,0.12)' : 'none',
                            }}
                          >
                            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, color: C.text1, marginBottom: 2 }}>{opt.label}</div>
                            <div style={{ fontSize: 12, color: C.text3 }}>{opt.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Q5: Monthly revenue ──────────────────────────────── */}
                {questionIdx === 4 && (
                  <div>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                      <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.text1, marginBottom: 4 }}>
                        What's your monthly revenue?
                      </h1>
                      <p style={{ fontSize: 14, color: C.text2 }}>We'll tailor features to your stage</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {Q5_OPTIONS.map(opt => {
                        const selected = answers.q5 === opt.id;
                        return (
                          <button key={opt.id} type="button" onClick={() => setAnswers(prev => ({ ...prev, q5: opt.id }))}
                            style={{
                              padding: '16px 14px', borderRadius: 12, border: `2px solid ${selected ? C.primary : C.border}`,
                              background: selected ? '#F0F9FF' : C.surface, cursor: 'pointer',
                              textAlign: 'center', transition: 'all 0.2s',
                              boxShadow: selected ? '0 0 0 3px rgba(14,165,233,0.12)' : 'none',
                              opacity: opt.id === 'prefer_not_say' ? 0.7 : 1,
                            }}
                          >
                            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, color: C.text1, marginBottom: 2 }}>{opt.label}</div>
                            <div style={{ fontSize: 12, color: C.text3 }}>{opt.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Q6: Social following ─────────────────────────────── */}
                {questionIdx === 5 && (
                  <div>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                      <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.text1, marginBottom: 4 }}>
                        What's your social media following?
                      </h1>
                      <p style={{ fontSize: 14, color: C.text2 }}>Help us understand your reach</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {Q6_OPTIONS.map(opt => {
                        const selected = answers.q6 === opt.id;
                        return (
                          <button key={opt.id} type="button" onClick={() => setAnswers(prev => ({ ...prev, q6: opt.id }))}
                            style={{
                              padding: '16px 14px', borderRadius: 12, border: `2px solid ${selected ? C.primary : C.border}`,
                              background: selected ? '#F0F9FF' : C.surface, cursor: 'pointer',
                              textAlign: 'center', transition: 'all 0.2s',
                              boxShadow: selected ? '0 0 0 3px rgba(14,165,233,0.12)' : 'none',
                            }}
                          >
                            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, color: C.text1, marginBottom: 2 }}>{opt.label}</div>
                            <div style={{ fontSize: 12, color: C.text3 }}>{opt.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Q7: Pick a vibe / theme ──────────────────────────── */}
                {questionIdx === 6 && (
                  <div>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                      <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.text1, marginBottom: 4 }}>
                        Pick a vibe
                      </h1>
                      <p style={{ fontSize: 14, color: C.text2 }}>Choose a theme style for your store</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
                      {Q3_OPTIONS.map(opt => {
                        const selected = answers.q7 === opt.id;
                        return (
                          <button key={opt.id} type="button" onClick={() => setAnswers(prev => ({ ...prev, q7: opt.id }))}
                            style={{
                              borderRadius: 16, border: `3px solid ${selected ? opt.accent : C.border}`,
                              background: C.surface, cursor: 'pointer', overflow: 'hidden',
                              transition: 'all 0.25s', padding: 0,
                              boxShadow: selected ? `0 0 0 3px ${opt.accent}33` : 'none',
                            }}
                          >
                            <div style={{
                              height: 140, background: opt.bg,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              position: 'relative',
                            }}>
                              {opt.badge && (
                                <span style={{
                                  position: 'absolute', top: 8, right: 8,
                                  fontSize: 9, fontWeight: 700, padding: '2px 8px',
                                  borderRadius: 100, color: opt.badge.color, background: opt.badge.bg,
                                }}>{opt.badge.label}</span>
                              )}
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: opt.accent, margin: '0 auto 8px' }} />
                                <div style={{ width: 50, height: 5, borderRadius: 3, background: opt.accent, margin: '0 auto 5px', opacity: 0.5 }} />
                                <div style={{ width: 70, height: 5, borderRadius: 3, background: opt.accent, margin: '0 auto 5px', opacity: 0.3 }} />
                                <div style={{ width: 40, height: 5, borderRadius: 3, background: opt.accent, margin: '0 auto', opacity: 0.2 }} />
                              </div>
                            </div>
                            <div style={{ padding: '10px 10px', textAlign: 'center' }}>
                              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13, color: C.text1 }}>{opt.label}</div>
                              <div style={{ fontSize: 10, color: C.text3, marginTop: 2, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{opt.vibe}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
                  <button type="button" onClick={() => setQuestionIdx(i => Math.max(0, i - 1))}
                    disabled={questionIdx === 0}
                    style={{
                      padding: '10px 18px', borderRadius: 10, border: `1.5px solid ${C.border}`,
                      background: C.surface, color: C.text1, cursor: questionIdx === 0 ? 'not-allowed' : 'pointer',
                      fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13,
                      opacity: questionIdx === 0 ? 0.4 : 1,
                    }}
                  >← Back</button>

                  {questionIdx < 6 ? (
                    <button type="button" onClick={() => setQuestionIdx(i => i + 1)}
                      disabled={
                        (questionIdx === 0 && !answers.q1) ||
                        (questionIdx === 1 && (!answers.q2 || (answers.q2 === 'custom' && !answers.q2Custom.trim()))) ||
                        (questionIdx === 2 && !answers.q3) ||
                        (questionIdx === 3 && !answers.q4) ||
                        (questionIdx === 4 && !answers.q5) ||
                        (questionIdx === 5 && !answers.q6)
                      }
                      style={{
                        padding: '10px 22px', borderRadius: 10, border: 'none',
                        background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                        color: 'white', cursor: 'pointer',
                        fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13,
                        opacity:
                          (questionIdx === 0 && !answers.q1) ||
                          (questionIdx === 1 && (!answers.q2 || (answers.q2 === 'custom' && !answers.q2Custom.trim()))) ||
                          (questionIdx === 2 && !answers.q3) ||
                          (questionIdx === 3 && !answers.q4) ||
                          (questionIdx === 4 && !answers.q5) ||
                          (questionIdx === 5 && !answers.q6) ? 0.4 : 1,
                      }}
                    >Next →</button>
                  ) : (
                    <button type="button" disabled={!answers.q7 || loading}
                      onClick={handleSavePendingStore}
                      style={{
                        padding: '10px 22px', borderRadius: 10, border: 'none',
                        background: (!answers.q7 || loading) ? C.border : C.green,
                        color: 'white', cursor: 'pointer',
                        fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13,
                      }}
                    >{loading ? 'Saving...' : 'Continue → $10'}</button>
                  )}
                </div>
              </>
            ) : (
              <>
                {error && (
                  <div style={{ padding: '10px 14px', borderRadius: 10, background: C.redBg, color: C.red, fontSize: 13, marginBottom: 16 }}>{error}</div>
                )}

                {/* Payment step indicator */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
                  {[1, 2, 3].map(s => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700,
                        background: s < 3 ? `linear-gradient(135deg, ${C.primary}, ${C.accent})` : C.green,
                        color: 'white',
                      }}>
                        {s < 3 ? '✓' : s}
                      </div>
                      {s < 3 && <div style={{ width: 24, height: 2, background: `linear-gradient(90deg, ${C.primary}, ${C.green})`, borderRadius: 1 }} />}
                    </div>
                  ))}
                </div>

                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center mb-4">
                    <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png" alt="MO Sell" style={{ width: 56, height: 56, objectFit: 'contain' }} />
                  </div>
                  <h1 className="text-3xl font-bold mb-3" style={{ color: C.text1, fontFamily: FONT_DISPLAY }}>
                    Start Selling with MO
                  </h1>
                  <p style={{ color: C.text2, maxWidth: 400, margin: '0 auto', fontSize: 14 }}>
                    Start selling free. Pay 30% only when you sell.
                  </p>
                </div>

                <div className="rounded-2xl p-6 mb-6" style={{
                  background: C.surface,
                  border: `2px solid ${C.primary}`,
                  boxShadow: '0 8px 32px rgba(14,165,233,0.12)',
                }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: C.primary }}>
                        PAY AS YOU GO
                      </span>
                      <h2 className="text-xl font-bold mt-2" style={{ color: C.text1, fontFamily: FONT_DISPLAY }}>
                        Free — no monthly fee
                      </h2>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold" style={{ color: C.primary, fontFamily: FONT_DISPLAY }}>
                        ₦0
                      </div>
                      <div className="text-xs" style={{ color: C.text3 }}>to start</div>
                    </div>
                  </div>

                  <div className="rounded-xl p-4 mb-4" style={{ background: `${C.primary}15` }}>
                    <div className="grid grid-cols-2 gap-3">
                      {['AI-powered store builder', 'Unlimited products', 'Paystack payments', '10 premium themes', 'Custom domain', 'Real-time analytics'].map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm" style={{ color: C.text2 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-center text-xs" style={{ color: C.text3 }}>
                    Pay 30% commission per sale · No card required · Cancel anytime
                  </div>
                </div>

                <button type="button" onClick={() => setShowPayment(false)}
                  style={{
                    padding: '10px 18px', borderRadius: 10, border: `1.5px solid ${C.border}`,
                    background: C.surface, color: C.text1, cursor: 'pointer',
                    fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13, marginBottom: 12,
                    width: '100%',
                  }}
                >← Back to review answers</button>

                <button onClick={handleCreateFreeStore} disabled={isProcessingPayment}
                  className="w-full py-4 rounded-xl text-white font-bold text-lg transition"
                  style={{
                    background: isProcessingPayment ? C.text3 : `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`,
                    cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
                    boxShadow: isProcessingPayment ? 'none' : '0 6px 24px rgba(14,165,233,0.30)',
                    fontFamily: FONT_DISPLAY,
                  }}
                >
                  {isProcessingPayment ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}>
                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                      </svg>
                      Creating your store...
                    </span>
                  ) : 'Create my free store →'}
                </button>

                <div className="mt-8 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl mb-2">🆓</div>
                    <div className="text-xs" style={{ color: C.text3 }}>No Card Needed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-2">✓</div>
                    <div className="text-xs" style={{ color: C.text3 }}>Cancel Anytime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-2">⚡</div>
                    <div className="text-xs" style={{ color: C.text3 }}>Instant Access</div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: C.text3 }}>
          © {new Date().getFullYear()} Busmo · MO Sell
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
