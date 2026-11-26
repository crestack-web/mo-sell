'use client';

import React, { useState } from 'react';
import { supabaseClient } from '@/lib/supabase-client';
import { getDatabase } from '@/lib/database/adapter';
import { resolveModuleAuthEmails } from '@/lib/account-identity';

export const dynamic = 'force-dynamic';

const C = {
  primary: '#0EA5E9', accent: '#6366F1', bg: '#F0F9FF',
  surface: '#FFFFFF', border: '#E0EFFA',
  text1: '#0C1A2E', text2: '#3D5A7A', text3: '#8AAABF',
  red: '#DC2626', redBg: '#FEE2E2', green: '#16A34A', greenBg: '#DCFCE7',
};
const FONT_DISPLAY = "'Clash Display','Plus Jakarta Sans',sans-serif";
const FONT_BODY = "'Plus Jakarta Sans',system-ui,sans-serif";

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

function Field({
  label, id, type = 'text', value, onChange, placeholder, autoComplete, disabled,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 13, fontWeight: 600, color: C.text2, fontFamily: FONT_BODY }}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 10,
          fontSize: 14, fontFamily: FONT_BODY, color: C.text1, background: '#F8FBFF',
          outline: 'none', transition: 'all 0.18s ease',
          border: `1.5px solid ${focused ? C.primary : C.border}`,
          boxShadow: focused ? '0 0 0 3px rgba(14,165,233,0.12)' : 'none',
          opacity: disabled ? 0.6 : 1,
        }}
      />
    </div>
  );
}

export default function SellLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSignIn = emailValid && password.length >= 6;

  function goToDashboard() {
    window.location.assign('/dashboard');
  }

  // Best-effort: clear a previous account session before switching accounts.
  async function ensureCleanSession() {
    try {
      const { data } = await supabaseClient.auth.getSession();
      if (data.session) await supabaseClient.auth.signOut();
    } catch {
      // Ignore session cleanup errors and let auth return the actionable error.
    }
  }

  async function handleEmailLogin(event?: React.FormEvent) {
    event?.preventDefault();
    if (!emailValid) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');
    setResetSent(false);
    try {
      await ensureCleanSession();
      const authEmails = await resolveModuleAuthEmails(email.trim(), 'creator');
      const db = getDatabase();
      let lastError: { code?: string; message?: string } | null = null;

      for (const authEmail of authEmails) {
        const { data, error: signInError } = await supabaseClient.auth.signInWithPassword({
          email: authEmail,
          password,
        });
        if (signInError || !data?.user) {
          lastError = signInError;
          continue;
        }

        // The same real email may also own a brand account. Only accept a creator profile.
        const profile = await db.doc(`users/${data.user.id}`).get();
        if (profile.exists) {
          goToDashboard();
          return;
        }
        await supabaseClient.auth.signOut();
      }

      if (lastError) throw lastError;
      setError('No creator account found for this email. Please sign up first.');
    } catch (err) {
      const authError = err as { code?: string; message?: string };
      const code = authError?.code ?? '';
      const message = authError?.message ?? '';
      if (code === 'invalid_credentials' || message === 'Invalid login credentials') {
        setError('Invalid email or password.');
      } else if (code === 'email_not_confirmed') {
        setError('Please verify your email before signing in.');
      } else if (code === 'over_email_send_rate_limit' || message === 'Too many requests') {
        setError('Too many attempts. Try again later.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError('');
    setResetSent(false);
    try {
      await ensureCleanSession();
      const { error: oauthError } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (oauthError) throw oauthError;
      // Supabase redirects the current tab to Google and returns to /auth/callback.
    } catch (err) {
      const authError = err as { code?: string };
      if (!['popup_closed', 'cancelled'].includes(authError?.code ?? '')) {
        setError('Google sign-in failed. Please try again.');
      }
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError('Enter your email first, then click forgot password.');
      return;
    }
    if (!emailValid) {
      setError('Enter a valid email address first.');
      return;
    }
    setLoading(true);
    setError('');
    setResetSent(false);
    try {
      const [authEmail = email.trim()] = await resolveModuleAuthEmails(email.trim(), 'creator');
      const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(authEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (resetError) throw resetError;
      setResetSent(true);
    } catch {
      setError('Could not send reset email. Check the address and try again.');
    } finally {
      setLoading(false);
    }
  }

  const primaryButtonStyle: React.CSSProperties = {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '13px 24px', borderRadius: 12, border: 'none', fontFamily: FONT_DISPLAY,
    fontSize: 15, fontWeight: 700, cursor: !canSignIn || loading ? 'not-allowed' : 'pointer',
    background: !canSignIn || loading ? '#BAE6FD' : `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`,
    color: !canSignIn || loading ? '#7AABCC' : 'white',
    boxShadow: !canSignIn || loading ? 'none' : '0 4px 14px rgba(14,165,233,0.30)',
    transition: 'all 0.18s ease',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: ${FONT_BODY}; background: ${C.bg}; }
      `}</style>

      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px 16px', background: C.bg, fontFamily: FONT_BODY,
        backgroundImage: 'radial-gradient(circle, rgba(14,165,233,0.10) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}>
        <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            background: C.surface, borderRadius: 24, padding: '28px 28px 32px',
            border: `1px solid ${C.border}`,
            boxShadow: '0 4px 6px rgba(0,0,0,0.03), 0 24px 56px rgba(14,165,233,0.10)',
            display: 'flex', flexDirection: 'column', gap: 22,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png" alt="MO Sell" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
              </div>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.text1, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
                Sign in to your store
              </h1>
              <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.5 }}>
                Manage products, orders and analytics.
              </p>
            </div>

            {error && (
              <p role="alert" style={{ fontSize: 13, color: C.red, background: C.redBg, padding: '10px 14px', borderRadius: 9 }}>
                {error}
              </p>
            )}
            {resetSent && (
              <p role="status" style={{ fontSize: 13, color: C.green, background: C.greenBg, padding: '10px 14px', borderRadius: 9 }}>
                ✓ Reset link sent — check your inbox.
              </p>
            )}

            <form onSubmit={(event) => void handleEmailLogin(event)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Email address" id="sl-email" type="email" value={email}
                onChange={(value) => { setEmail(value); setError(''); setResetSent(false); }}
                placeholder="you@example.com" autoComplete="email" disabled={loading} />
              <Field label="Password" id="sl-password" type="password" value={password}
                onChange={(value) => { setPassword(value); setError(''); setResetSent(false); }}
                placeholder="Your password" autoComplete="current-password" disabled={loading} />

              <div style={{ textAlign: 'right', marginTop: -6 }}>
                <button type="button" onClick={() => void handleForgotPassword()} disabled={loading} style={{
                  background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: 13, color: C.primary, fontWeight: 600, fontFamily: FONT_BODY, padding: 0,
                }}>
                  Forgot password?
                </button>
              </div>

              <button type="submit" disabled={!canSignIn || loading} style={primaryButtonStyle}>
                {loading ? 'Signing in…' : 'Sign in to MO Sell'}
                {!loading && <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: C.text3, fontSize: 12, fontWeight: 600 }}>
              <span style={{ height: 1, flex: 1, background: C.border }} />
              OR CONTINUE WITH
              <span style={{ height: 1, flex: 1, background: C.border }} />
            </div>

            <button type="button" onClick={() => void handleGoogleLogin()} disabled={loading} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '13px 24px', borderRadius: 12, border: `1.5px solid ${C.border}`, background: 'white',
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: FONT_BODY,
              fontSize: 14, fontWeight: 700, color: C.text1,
              boxShadow: '0 1px 4px rgba(14,88,140,0.07)', opacity: loading ? 0.65 : 1,
              transition: 'all 0.18s ease',
            }}>
              <GoogleMark />
              {loading ? 'Signing in…' : 'Continue with Google'}
            </button>

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
              paddingTop: 16, borderTop: `1px solid ${C.border}`, fontSize: 13, color: C.text2,
            }}>
              <a href="/welcome" style={{ color: C.text2, textDecoration: 'none', fontWeight: 500 }}>
                ← About MO Sell
              </a>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <a href="/signup" style={{ color: C.primary, textDecoration: 'none', fontWeight: 600 }}>Creator signup →</a>
                <span style={{ color: C.text3 }}>|</span>
                <a href="/brand-auth/register" style={{ color: C.accent, textDecoration: 'none', fontWeight: 600 }}>Brand signup →</a>
              </div>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 11, color: C.text3 }}>
            © {new Date().getFullYear()} Busmo · MO Sell · Built for African commerce
          </p>
        </div>
      </div>
    </>
  );
}
