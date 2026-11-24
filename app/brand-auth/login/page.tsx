'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';
import { getDatabase } from '@/lib/database/adapter';
import { resolveModuleAuthEmails } from '@/lib/account-identity';
import { AuthShell } from '../_components/AuthShell';
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Lock, Mail } from 'lucide-react';
import styles from '../brand-auth.module.css';

export const dynamic = 'force-dynamic';

type FormData = { email: string; password: string };

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

function BrandLoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/brand/dashboard';
  const registerHref = `/brand-auth/register?redirect=${encodeURIComponent(redirectTo)}`;

  const [formData, setFormData] = useState<FormData>({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    const err = searchParams.get('error');
    if (err === 'oauth_failed') setError('Google sign-in failed. Please try again.');
    else if (err === 'inactive') setError('Your account is not active. Please contact support.');
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setResetSent(false);
  };

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Valid email is required');
      return;
    }
    if (!formData.password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // A real email may have several module accounts. Only brand identities
      // are tried, so a creator account never opens the brand dashboard.
      await supabaseClient.auth.signOut();
      const authEmails = await resolveModuleAuthEmails(formData.email, 'brand');
      const db = getDatabase();
      let lastError: any = null;

      for (const authEmail of authEmails) {
        const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
          email: authEmail,
          password: formData.password,
        });

        if (authError || !authData?.user) {
          lastError = authError;
          continue;
        }

        const brandDoc = await db.doc(`brands/${authData.user.id}`).get();
        if (!brandDoc.exists) {
          await supabaseClient.auth.signOut();
          continue;
        }

        if (brandDoc.data()?.status !== 'active') {
          await supabaseClient.auth.signOut();
          setError('Your account is not active. Please contact support.');
          return;
        }

        router.push(redirectTo);
        return;
      }

      if (lastError) {
        const message = String(lastError.message || '').toLowerCase();
        setError(
          message.includes('invalid login') || message.includes('invalid credentials')
            ? 'Invalid email or password.'
            : lastError.message || 'Login failed. Please check your credentials.'
        );
        return;
      }
      setError('No brand account found for this email. Please register first.');
    } catch (err: any) {
      console.error('Brand login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email.trim()) {
      setError('Enter your email first, then choose reset password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [authEmail = formData.email] = await resolveModuleAuthEmails(formData.email, 'brand');
      const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(authEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (resetError) throw resetError;
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || 'Could not send reset email. Check the address and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      const { error: oauthError } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/brand-auth/callback?redirect=${encodeURIComponent(redirectTo)}` },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      console.error('Google auth error:', err);
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to Brand Studio"
      description="Manage briefs, creator videos and payouts from one workspace."
      footer={
        <p className={styles.footerText}>
          New to MO Sell? <button type="button" onClick={() => router.push(registerHref)}>Create a brand account</button>
        </p>
      }
    >
      {error && (
        <div className={`${styles.alert} ${styles.alertError}`} role="alert">
          <AlertCircle size={16} /> <span>{error}</span>
        </div>
      )}
      {resetSent && (
        <div className={`${styles.alert} ${styles.alertSuccess}`}>
          <CheckCircle2 size={16} /> <span>Password reset link sent. Check your inbox.</span>
        </div>
      )}

      <button className={styles.socialButton} onClick={handleGoogleAuth} disabled={loading} type="button">
        <GoogleMark /> Continue with Google
      </button>

      <div className={styles.divider}>
        <span className={styles.dividerLine} /> or <span className={styles.dividerLine} />
      </div>

      <form onSubmit={handleLogin} className={styles.fields}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="brand-email">Email address</label>
          <div className={styles.inputWrap}>
            <Mail size={17} className={styles.inputIcon} />
            <input
              id="brand-email"
              className={styles.input}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="brand@company.com"
              autoComplete="email"
              autoFocus
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="brand-password">Password</label>
          <div className={styles.inputWrap}>
            <Lock size={17} className={styles.inputIcon} />
            <input
              id="brand-password"
              className={styles.input}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
        </div>

        <div className={styles.fieldMeta}>
          <button className={styles.linkButton} type="button" onClick={handleForgotPassword} disabled={loading}>
            Forgot password?
          </button>
        </div>

        <button className={styles.primaryButton} type="submit" disabled={loading}>
          {loading ? <><Loader2 size={17} className={styles.spinner} /> Signing in…</> : <>Sign in <ArrowRight size={17} /></>}
        </button>
      </form>
    </AuthShell>
  );
}

export default function BrandLoginPage() {
  return (
    <Suspense fallback={<div className={styles.page} />}>
      <BrandLoginPageContent />
    </Suspense>
  );
}
