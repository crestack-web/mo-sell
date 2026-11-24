'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';
import { AuthShell } from '../_components/AuthShell';
import {
  AlertCircle, ArrowRight, Briefcase, Building, CheckCircle2, Globe,
  Loader2, Lock, Mail, Phone,
} from 'lucide-react';
import styles from '../brand-auth.module.css';

export const dynamic = 'force-dynamic';

type FormData = {
  brandName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  website: string;
  industry: string;
};

const INDUSTRIES = [
  'Fashion & Apparel', 'Beauty & Cosmetics', 'Food & Beverage', 'Technology',
  'Health & Wellness', 'Fitness', 'Travel & Tourism', 'Entertainment',
  'Gaming', 'Education', 'Home & Garden', 'Automotive', 'Other',
];

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

function BrandRegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/brand/dashboard';
  const loginHref = `/brand-auth/login?redirect=${encodeURIComponent(redirectTo)}`;

  const [formData, setFormData] = useState<FormData>({
    brandName: '', email: '', password: '', confirmPassword: '', phone: '', website: '', industry: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [otp, setOtp] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.brandName.trim()) return fail('Brand name is required');
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return fail('Valid email is required');
    if (formData.password.length < 8) return fail('Password must be at least 8 characters');
    if (formData.password !== formData.confirmPassword) return fail('Passwords do not match');
    if (!formData.phone.trim()) return fail('Phone number is required');
    if (!formData.industry) return fail('Please select an industry');
    return true;
  };

  function fail(message: string): false {
    setError(message);
    return false;
  }

  const handleSendOTP = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setError('');
    try {
      // Start a clean session so a previous creator login can't leak through.
      const { data: existingUser } = await supabaseClient.auth.getUser();
      if (existingUser.user) await supabaseClient.auth.signOut();

      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, name: formData.brandName }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to send verification code');
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return fail('Please enter a valid 6-digit code');
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/brand/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          code: otp,
          brandName: formData.brandName,
          phone: formData.phone,
          website: formData.website,
          industry: formData.industry,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create account');
      }

      const result = await response.json().catch(() => ({}));
      // Extra accounts with the same email use an internal auth alias.
      const { error: signInError } = await supabaseClient.auth.signInWithPassword({
        email: result.authEmail || formData.email,
        password: formData.password,
      });
      if (signInError) throw new Error(signInError.message || 'Account created. Please sign in.');

      fetch('/api/email/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'brand',
          email: formData.email,
          name: formData.brandName,
          brandName: formData.brandName,
        }),
      }).catch(() => {});

      setStep('success');
      setTimeout(() => router.push(redirectTo), 2000);
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, name: formData.brandName }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to resend code');
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
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

  if (step === 'success') {
    return (
      <AuthShell
        eyebrow="All set"
        title="Your brand workspace is ready"
        description="Redirecting you to your dashboard…"
        steps={3}
        currentStep={3}
      >
        <div className={styles.center}>
          <div className={styles.successCard}>
            <div className={styles.successIcon}><CheckCircle2 size={32} /></div>
            <Loader2 size={20} className={`${styles.spinner} ${styles.footerText}`} />
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Get started"
      title={step === 'form' ? 'Create your brand account' : 'Verify your email'}
      description={
        step === 'form'
          ? 'Brief creators, buy videos and manage payouts in one place. Your email can also be used for a creator account.'
          : `Enter the 6-digit code sent to ${formData.email}.`
      }
      steps={2}
      currentStep={step === 'form' ? 1 : 2}
      footer={
        step === 'form' ? (
          <p className={styles.footerText}>
            Already have an account? <button type="button" onClick={() => router.push(loginHref)}>Sign in</button>
          </p>
        ) : undefined
      }
    >
      {error && (
        <div className={`${styles.alert} ${styles.alertError}`} role="alert">
          <AlertCircle size={16} /> <span>{error}</span>
        </div>
      )}

      {step === 'form' ? (
        <div className={styles.fields}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="brandName">Brand name</label>
            <div className={styles.inputWrap}>
              <Building size={17} className={styles.inputIcon} />
              <input id="brandName" className={styles.input} name="brandName" value={formData.brandName} onChange={handleChange} placeholder="Your brand name" />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email address</label>
            <div className={styles.inputWrap}>
              <Mail size={17} className={styles.inputIcon} />
              <input id="email" className={styles.input} type="email" name="email" value={formData.email} onChange={handleChange} placeholder="brand@company.com" autoComplete="email" />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">Password</label>
              <div className={styles.inputWrap}>
                <Lock size={17} className={styles.inputIcon} />
                <input id="password" className={styles.input} type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min. 8 characters" autoComplete="new-password" />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="confirmPassword">Confirm password</label>
              <div className={styles.inputWrap}>
                <Lock size={17} className={styles.inputIcon} />
                <input id="confirmPassword" className={styles.input} type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Repeat password" autoComplete="new-password" />
              </div>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="phone">Phone number</label>
            <div className={styles.inputWrap}>
              <Phone size={17} className={styles.inputIcon} />
              <input id="phone" className={styles.input} type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+234 800 000 0000" autoComplete="tel" />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="website">Website <span style={{ color: 'var(--ba-subtle)' }}>(optional)</span></label>
              <div className={styles.inputWrap}>
                <Globe size={17} className={styles.inputIcon} />
                <input id="website" className={styles.input} type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://yourbrand.com" />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="industry">Industry</label>
              <div className={styles.inputWrap}>
                <Briefcase size={17} className={styles.inputIcon} />
                <select id="industry" className={styles.select} name="industry" value={formData.industry} onChange={handleChange}>
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((industry) => <option key={industry} value={industry}>{industry}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className={styles.divider}>
            <span className={styles.dividerLine} /> or <span className={styles.dividerLine} />
          </div>

          <button className={styles.socialButton} onClick={handleGoogleAuth} disabled={loading} type="button">
            <GoogleMark /> Continue with Google
          </button>

          <button className={styles.primaryButton} onClick={handleSendOTP} disabled={loading} type="button">
            {loading ? <><Loader2 size={17} className={styles.spinner} /> Sending code…</> : <>Send verification code <ArrowRight size={17} /></>}
          </button>
        </div>
      ) : (
        <div className={styles.fields}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="otp">Verification code</label>
            <div className={styles.inputWrap}>
              <Mail size={17} className={styles.inputIcon} />
              <input
                id="otp"
                className={`${styles.input} ${styles.inputMono}`}
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                autoFocus
              />
            </div>
          </div>

          <button className={styles.primaryButton} onClick={handleVerifyOTP} disabled={loading} type="button">
            {loading ? <><Loader2 size={17} className={styles.spinner} /> Creating account…</> : <><CheckCircle2 size={17} /> Verify & create account</>}
          </button>
          <button className={styles.ghostButton} onClick={handleResendOTP} disabled={loading} type="button">Resend code</button>
          <button className={styles.textButton} onClick={() => setStep('form')} disabled={loading} type="button">← Back to registration</button>
        </div>
      )}
    </AuthShell>
  );
}

export default function BrandRegisterPage() {
  return (
    <Suspense fallback={<div className={styles.page} />}>
      <BrandRegisterPageContent />
    </Suspense>
  );
}
