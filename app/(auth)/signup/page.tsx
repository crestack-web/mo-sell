'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';
import { getDatabase } from '@/lib/database/adapter';
import posthog from 'posthog-js';

const C = {
  primary: '#0EA5E9',
  primaryDk: '#0369A1',
  accent: '#6366F1',
  bg: '#F0F9FF',
  surface: '#FFFFFF',
  border: '#E0EFFA',
  text1: '#0C1A2E',
  text2: '#3D5A7A',
  text3: '#8AAABF',
  green: '#16A34A',
  greenBg: '#DCFCE7',
  red: '#DC2626',
  redBg: '#FEE2E2',
};
const FONT_DISPLAY = "'Clash Display','Plus Jakarta Sans',sans-serif";
const FONT_BODY = "'Plus Jakarta Sans',system-ui,sans-serif";

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
      onError={(e) => { e.currentTarget.style.display = 'none'; }}
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
  outline: 'none',
  background: '#F8FBFF',
  width: '100%',
  boxSizing: 'border-box',
};

export default function SellSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [otpSent, setOtpSent] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [businessId, setBusinessId] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('onboarding') !== '1') return;
    (async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.user) {
        router.replace('/signup');
        return;
      }
      const db = getDatabase();
      const userDoc = await db.doc(`users/${session.user.id}`).get();
      const userData = userDoc.exists ? userDoc.data() : {};
      setUserId(session.user.id);
      setBusinessId(userData.businessId || `biz_${session.user.id.slice(0, 12)}`);
      setEmail(session.user.email || '');
      setFullName(
        userData.fullName ||
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          ''
      );
      if (userData.businessName) setBusinessName(userData.businessName);
      setStep(userData.onboardingComplete ? 3 : 2);
    })();
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

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const db = getDatabase();
      await db.doc(`businesses/${businessId}`).set(
        { businessName, updatedAt: new Date().toISOString() },
        { merge: true }
      );
      if (userId) {
        await db.doc(`users/${userId}`).set(
          { businessName, onboardingComplete: false, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      }
      posthog.capture('sell_signup_completed', { step: 2 });
      setStep(3);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFreeStore = async () => {
    setCreating(true);
    setError('');
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.user || !session.access_token) {
        throw new Error('Not authenticated. Please sign in again.');
      }
      const bid = businessId || `biz_${session.user.id.slice(0, 12)}`;
      const name = businessName.trim() || 'My Store';
      const response = await fetch('/api/auth/complete-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ businessName: name, businessId: bid }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }
      posthog.capture('sell_payg_store_created', { businessId: data.businessId || bid });
      router.push('/dashboard/overview?welcome=1');
    } catch (err: unknown) {
      console.error('[Signup] store creation error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setCreating(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      background: `linear-gradient(135deg, ${C.bg} 0%, #E0E7FF 100%)`,
      fontFamily: FONT_BODY,
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700,
                background: step >= s ? `linear-gradient(135deg, ${C.primary}, ${C.accent})` : C.border,
                color: step >= s ? '#fff' : C.text3,
              }}>{s}</div>
              {s < 3 && <div style={{ width: 24, height: 2, background: step > s ? C.primary : C.border, borderRadius: 1 }} />}
            </div>
          ))}
        </div>

        <div style={{
          background: C.surface, borderRadius: 20, padding: '32px 28px',
          border: `1px solid ${C.border}`, boxShadow: '0 8px 32px rgba(14,88,140,0.08)',
        }}>
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: C.redBg, color: C.red, fontSize: 13, marginBottom: 16 }}>{error}</div>
          )}

          {step === 1 && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png"
                  alt="Mo-sell"
                  style={{ width: 48, height: 48, objectFit: 'contain', marginBottom: 12 }}
                />
                <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.text1, margin: '0 0 4px' }}>
                  {!otpSent ? 'Create your account' : 'Verify your email'}
                </h1>
                <p style={{ fontSize: 14, color: C.text2, margin: 0 }}>
                  {!otpSent ? 'Step 1 of 3 — Account info' : `Code sent to ${email}`}
                </p>
              </div>

              {!otpSent ? (
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
                    <input type="text" placeholder="Full name" required value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} />
                    <input type="email" placeholder="Email address" required value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
                    <input type="password" placeholder="Password (min 6 characters)" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
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
                      {loading ? 'Sending code…' : 'Continue →'}
                    </button>
                  </form>
                </>
              ) : (
                <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input
                    type="text" placeholder="6-digit code" required value={otp} maxLength={6}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    style={{ ...inputStyle, textAlign: 'center', letterSpacing: 8, fontSize: 22 }}
                  />
                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    style={{
                      padding: 13, borderRadius: 10, border: 'none',
                      cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer',
                      background: loading || otp.length !== 6 ? C.text3 : C.green,
                      color: '#fff', fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15,
                    }}
                  >
                    {loading ? 'Verifying…' : 'Verify email →'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(''); setError(''); }}
                    style={{
                      padding: 10, borderRadius: 10, border: `1.5px solid ${C.border}`,
                      background: C.surface, color: C.text2, cursor: 'pointer',
                      fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13,
                    }}
                  >
                    ← Edit email
                  </button>
                </form>
              )}

              <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: C.text2 }}>
                Already have an account?{' '}
                <a href="/login" style={{ color: C.primary, fontWeight: 600, textDecoration: 'none' }}>Log in</a>
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.text1, margin: '0 0 4px' }}>Name your business</h1>
                <p style={{ fontSize: 14, color: C.text2, margin: 0 }}>Step 2 of 3 — Store name</p>
              </div>
              <form onSubmit={handleSaveBusiness} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input type="text" placeholder="Business name" required value={businessName} onChange={e => setBusinessName(e.target.value)} style={inputStyle} />
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
                  {loading ? 'Saving…' : 'Continue →'}
                </button>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png"
                  alt="Mo-sell"
                  style={{ width: 48, height: 48, objectFit: 'contain', marginBottom: 12 }}
                />
                <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.text1, margin: '0 0 4px' }}>Start selling free</h1>
                <p style={{ fontSize: 14, color: C.text2, margin: 0 }}>Pay 20% only when you sell · No card required</p>
              </div>
              <div style={{ borderRadius: 14, border: `2px solid ${C.primary}`, padding: 16, marginBottom: 16, background: `${C.primary}10` }}>
                <div style={{ fontWeight: 700, color: C.text1, marginBottom: 8, fontFamily: FONT_DISPLAY }}>{businessName || 'Your store'}</div>
                <ul style={{ margin: 0, paddingLeft: 18, color: C.text2, fontSize: 13, lineHeight: 1.6 }}>
                  <li>AI-powered store builder</li>
                  <li>Unlimited products</li>
                  <li>Paystack payments</li>
                  <li>20% commission · cancel anytime</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={handleCreateFreeStore}
                disabled={creating}
                style={{
                  width: '100%', padding: 14, borderRadius: 12, border: 'none',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  background: creating ? C.text3 : `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                  color: '#fff', fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, marginBottom: 10,
                }}
              >
                {creating ? 'Creating your store…' : 'Create my free store →'}
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={creating}
                style={{
                  width: '100%', padding: 10, borderRadius: 10, border: `1.5px solid ${C.border}`,
                  background: C.surface, color: C.text2, cursor: 'pointer',
                  fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13,
                }}
              >
                ← Back
              </button>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: C.text3 }}>
          © {new Date().getFullYear()} Busmo · Mo-sell
        </p>
      </div>
    </div>
  );
}
