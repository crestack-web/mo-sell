'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabaseClient } from '@/lib/supabase-client';
import posthog from 'posthog-js';

const FONT_BODY = 'system-ui, -apple-system, sans-serif';
const FONT_DISPLAY = FONT_BODY;
const C = {
  primary: '#0EA5E9',
  accent: '#6366F1',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  text1: '#0F172A',
  text2: '#475569',
  text3: '#94A3B8',
  bg: '#F4F8FC',
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30);
}

function BusmoMark() {
  return (
    <img
      src="https://busmo.app/sidebar-logo.png"
      alt=""
      width={18}
      height={18}
      style={{ borderRadius: 4, objectFit: 'contain' }}
      onError={(e) => {
        const el = e.currentTarget;
        el.style.display = 'none';
      }}
    />
  );
}

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

const inputStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 10,
  border: `1.5px solid ${C.border}`,
  fontSize: 14,
  fontFamily: FONT_BODY,
  color: C.text1,
  background: '#F8FBFF',
  outline: 'none',
};

export default function SellSignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');

  useEffect(() => {
    if (searchParams.get('onboarding') === '1') {
      setStep(2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function ensureCleanSession() {
    try {
      const { data } = await supabaseClient.auth.getSession();
      if (data.session) await supabaseClient.auth.signOut();
    } catch {
      /* ignore */
    }
  }

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');
    try {
      await ensureCleanSession();
      const { error: oauthError } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (oauthError) throw oauthError;
    } catch (err: unknown) {
      console.error('[Signup] Google auth error:', err);
      setError('Google sign-up failed. Please try again.');
      setLoading(false);
    }
  };

  const handleBusmoSignup = () => {
    setLoading(true);
    setError('');
    const busmoUrl = (process.env.NEXT_PUBLIC_BUSMO_APP_URL || 'https://busmo.app').replace(/\/$/, '');
    window.location.href = `${busmoUrl}/auth/mo-sell-handoff`;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-otp', email, password, fullName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send verification code');
      setOtpSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
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
        body: JSON.stringify({ action: 'verify-otp', email, otp, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to verify email');

      setUserId(data.userId);
      setBusinessId(data.businessId);

      const signIn = await supabaseClient.auth.signInWithPassword({ email, password });
      if (signIn.error) {
        throw new Error('Account created, but auto sign-in failed. Please try logging in.');
      }

      posthog.capture('sell_signup_completed', { step: 1 });
      setStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to verify email');
    } finally {
      setLoading(false);
    }
  };

  const handleStoreSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const slug = storeSlug || slugify(storeName);
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete-onboarding',
          storeName,
          storeSlug: slug,
          businessId: businessId || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to set up store');
      posthog.capture('sell_signup_completed', { step: 2 });
      router.replace('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to set up store');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: FONT_BODY }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ background: C.surface, borderRadius: 16, padding: 28, border: `1px solid ${C.border}`, boxShadow: '0 8px 30px rgba(15,23,42,0.06)' }}>
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text1 }}>Create your Mo-sell account</h1>
            <p style={{ fontSize: 14, color: C.text2, margin: '6px 0 0' }}>
              {!otpSent && step === 1 ? 'Step 1 of 3 — Account info' : otpSent && step === 1 ? `Code sent to ${email}` : 'Set up your store'}
            </p>
          </div>

          {error ? (
            <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: '#FEF2F2', color: '#B91C1C', fontSize: 13 }}>{error}</div>
          ) : null}

          {step === 1 && !otpSent ? (
            <>
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  width: '100%', padding: 13, borderRadius: 10,
                  border: `1.5px solid ${C.border}`, background: C.surface,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  color: C.text1, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14, marginBottom: 10,
                }}
              >
                <GoogleMark />
                {loading ? 'Redirecting…' : 'Continue with Google'}
              </button>

              <button
                type="button"
                onClick={handleBusmoSignup}
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  width: '100%', padding: 13, borderRadius: 10,
                  border: `1.5px solid ${C.border}`, background: C.surface,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  color: C.text1, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14, marginBottom: 16,
                }}
              >
                <BusmoMark />
                {loading ? 'Redirecting…' : 'Continue with Busmo'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: C.border }} />
                <span style={{ fontSize: 12, color: C.text3, fontWeight: 500 }}>or email</span>
                <div style={{ flex: 1, height: 1, background: C.border }} />
              </div>

              <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input type="text" placeholder="Full name" required value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
                <input type="email" placeholder="Email address" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
                <input type="password" placeholder="Password (min 6 characters)" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: 13, borderRadius: 10, border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    background: loading ? C.text3 : `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                    color: '#fff', fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15,
                  }}
                >
                  {loading ? 'Sending…' : 'Continue'}
                </button>
              </form>
              <p style={{ marginTop: 16, fontSize: 13, color: C.text2, textAlign: 'center' }}>
                Already have an account? <Link href="/login" style={{ color: C.primary, fontWeight: 600 }}>Log in</Link>
              </p>
            </>
          ) : null}

          {step === 1 && otpSent ? (
            <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input type="text" placeholder="6-digit code" required value={otp} maxLength={6} onChange={(e) => setOtp(e.target.value)} style={inputStyle} />
              <button type="submit" disabled={loading} style={{
                padding: 13, borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? C.text3 : `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                color: '#fff', fontWeight: 700, fontSize: 15,
              }}>
                {loading ? 'Verifying…' : 'Verify email'}
              </button>
            </form>
          ) : null}

          {step === 2 ? (
            <form onSubmit={handleStoreSetup} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input type="text" placeholder="Store name" required value={storeName} onChange={(e) => {
                setStoreName(e.target.value);
                setStoreSlug(slugify(e.target.value));
              }} style={inputStyle} />
              <input type="text" placeholder="Store slug" required value={storeSlug} onChange={(e) => setStoreSlug(slugify(e.target.value))} style={inputStyle} />
              <button type="submit" disabled={loading} style={{
                padding: 13, borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? C.text3 : `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                color: '#fff', fontWeight: 700, fontSize: 15,
              }}>
                {loading ? 'Saving…' : 'Finish setup'}
              </button>
            </form>
          ) : null}
        </div>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: C.text3 }}>
          © {new Date().getFullYear()} Busmo · Mo-sell
        </p>
      </div>
    </div>
  );
}
