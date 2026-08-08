'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';
import { ArrowRight, Mail, Lock, Building, Phone, Globe, Briefcase, CheckCircle, Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

// ── Theme ────────────────────────────────────────────────────────────────────
const THEME = {
  bg: '#0A0A0B',
  surface: '#141416',
  surfaceHover: '#1A1A1D',
  border: '#2A2A2E',
  primary: '#6366F1',
  primaryHover: '#4F46E5',
  text1: '#FFFFFF',
  text2: '#A1A1AA',
  text3: '#71717A',
  success: '#10B981',
  error: '#EF4444',
};

const FONTS = {
  display: "'Inter', system-ui, sans-serif",
  body: "'Inter', system-ui, sans-serif",
};

interface FormData {
  brandName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  website: string;
  industry: string;
}

const INDUSTRIES = [
  'Fashion & Apparel',
  'Beauty & Cosmetics',
  'Food & Beverage',
  'Technology',
  'Health & Wellness',
  'Fitness',
  'Travel & Tourism',
  'Entertainment',
  'Gaming',
  'Education',
  'Home & Garden',
  'Automotive',
  'Other',
];

function BrandRegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/brand/dashboard';

  const [formData, setFormData] = useState<FormData>({
    brandName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    website: '',
    industry: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.brandName.trim()) {
      setError('Brand name is required');
      return false;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Valid email is required');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!formData.industry) {
      setError('Please select an industry');
      return false;
    }
    return true;
  };

  const handleSendOTP = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      // Check if email already exists
      const { data: existingUser } = await supabaseClient.auth.getUser();
      if (existingUser.user) {
        await supabaseClient.auth.signOut();
      }

      // Send OTP via email (server generates + stores the code)
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send OTP');
      }

      setOtpSent(true);
      setStep('otp');
    } catch (err: any) {
      console.error('OTP send error:', err);
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create the account + brand profile server-side (bypasses RLS)
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

      // Establish the client session so dashboard reads work
      const { error: signInError } = await supabaseClient.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        setError(signInError.message || 'Account created. Please sign in.');
        setLoading(false);
        return;
      }

      // Send brand welcome email (non-blocking)
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
      
      // Redirect after delay
      setTimeout(() => {
        router.push(redirectTo);
      }, 2000);
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      if (!response.ok) throw new Error('Failed to resend OTP');
      setOtpSent(true);
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
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/brand-auth/callback${redirectTo && redirectTo !== '/brand/dashboard' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google auth error:', err);
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const GoogleMark = () => (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );


  if (step === 'success') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: THEME.bg, fontFamily: FONTS.body }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80, borderRadius: '50%', background: `${THEME.success}20`, marginBottom: 24 }}>
            <CheckCircle size={40} color={THEME.success} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: THEME.text1, marginBottom: 12, fontFamily: FONTS.display }}>
            Account Created!
          </h1>
          <p style={{ fontSize: 16, color: THEME.text2, marginBottom: 24 }}>
            Redirecting to your dashboard...
          </p>
          <Loader2 size={24} color={THEME.primary} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: THEME.bg, fontFamily: FONTS.body }}>
      {/* Left Side - Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          {/* Logo */}
          <div style={{ marginBottom: 40, display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png" alt="MO Sell" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
            <span style={{ fontSize: 24, fontWeight: 700, color: THEME.text1, fontFamily: FONTS.display }}>
              MO Sell
            </span>
          </div>

          {step === 'form' ? (
            <>
              <h1 style={{ fontSize: 32, fontWeight: 700, color: THEME.text1, marginBottom: 8, fontFamily: FONTS.display }}>
                Create Brand Account
              </h1>
              <p style={{ fontSize: 16, color: THEME.text2, marginBottom: 32 }}>
                Start discovering and purchasing UGC content from top creators
              </p>

              {error && (
                <div style={{ padding: 12, borderRadius: 8, background: `${THEME.error}15`, border: `1px solid ${THEME.error}30`, color: THEME.error, fontSize: 14, marginBottom: 24 }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: THEME.text2, marginBottom: 8 }}>
                    Brand Name *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Building size={20} color={THEME.text3} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      name="brandName"
                      value={formData.brandName}
                      onChange={handleChange}
                      placeholder="Your Brand Name"
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 44px',
                        background: THEME.surface,
                        border: `1px solid ${THEME.border}`,
                        borderRadius: 8,
                        color: THEME.text1,
                        fontSize: 15,
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => e.target.style.borderColor = THEME.primary}
                      onBlur={(e) => e.target.style.borderColor = THEME.border}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: THEME.text2, marginBottom: 8 }}>
                    Email Address *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={20} color={THEME.text3} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="brand@company.com"
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 44px',
                        background: THEME.surface,
                        border: `1px solid ${THEME.border}`,
                        borderRadius: 8,
                        color: THEME.text1,
                        fontSize: 15,
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => e.target.style.borderColor = THEME.primary}
                      onBlur={(e) => e.target.style.borderColor = THEME.border}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: THEME.text2, marginBottom: 8 }}>
                      Password *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={20} color={THEME.text3} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min 8 characters"
                        style={{
                          width: '100%',
                          padding: '12px 12px 12px 44px',
                          background: THEME.surface,
                          border: `1px solid ${THEME.border}`,
                          borderRadius: 8,
                          color: THEME.text1,
                          fontSize: 15,
                          outline: 'none',
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => e.target.style.borderColor = THEME.primary}
                        onBlur={(e) => e.target.style.borderColor = THEME.border}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: THEME.text2, marginBottom: 8 }}>
                      Confirm Password *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={20} color={THEME.text3} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm password"
                        style={{
                          width: '100%',
                          padding: '12px 12px 12px 44px',
                          background: THEME.surface,
                          border: `1px solid ${THEME.border}`,
                          borderRadius: 8,
                          color: THEME.text1,
                          fontSize: 15,
                          outline: 'none',
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => e.target.style.borderColor = THEME.primary}
                        onBlur={(e) => e.target.style.borderColor = THEME.border}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: THEME.text2, marginBottom: 8 }}>
                    Phone Number *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={20} color={THEME.text3} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 234 567 8900"
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 44px',
                        background: THEME.surface,
                        border: `1px solid ${THEME.border}`,
                        borderRadius: 8,
                        color: THEME.text1,
                        fontSize: 15,
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => e.target.style.borderColor = THEME.primary}
                      onBlur={(e) => e.target.style.borderColor = THEME.border}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: THEME.text2, marginBottom: 8 }}>
                    Website
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Globe size={20} color={THEME.text3} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://yourbrand.com"
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 44px',
                        background: THEME.surface,
                        border: `1px solid ${THEME.border}`,
                        borderRadius: 8,
                        color: THEME.text1,
                        fontSize: 15,
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => e.target.style.borderColor = THEME.primary}
                      onBlur={(e) => e.target.style.borderColor = THEME.border}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: THEME.text2, marginBottom: 8 }}>
                    Industry *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Briefcase size={20} color={THEME.text3} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <select
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 44px',
                        background: THEME.surface,
                        border: `1px solid ${THEME.border}`,
                        borderRadius: 8,
                        color: formData.industry ? THEME.text1 : THEME.text3,
                        fontSize: 15,
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        cursor: 'pointer',
                      }}
                      onFocus={(e) => e.target.style.borderColor = THEME.primary}
                      onBlur={(e) => e.target.style.borderColor = THEME.border}
                    >
                      <option value="">Select your industry</option>
                      {INDUSTRIES.map(ind => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
                  <div style={{ flex: 1, height: 1, background: THEME.border }} />
                  <span style={{ fontSize: 12, color: THEME.text3 }}>or</span>
                  <div style={{ flex: 1, height: 1, background: THEME.border }} />
                </div>

                <button
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: 14,
                    background: THEME.surface,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 8,
                    color: THEME.text1,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.background = THEME.surfaceHover)}
                  onMouseLeave={(e) => !loading && (e.currentTarget.style.background = THEME.surface)}
                >
                  <GoogleMark />
                  Sign up with Google
                </button>

                <button
                  onClick={handleSendOTP}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: 14,
                    background: loading ? THEME.surfaceHover : THEME.primary,
                    border: 'none',
                    borderRadius: 8,
                    color: 'white',
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.background = THEME.primaryHover)}
                  onMouseLeave={(e) => !loading && (e.currentTarget.style.background = THEME.primary)}
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                      Sending Code...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>

              <p style={{ fontSize: 14, color: THEME.text3, textAlign: 'center', marginTop: 24 }}>
                Already have an account?{' '}
                <button
                  onClick={() => router.push('/brand-auth/login' + (redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''))}
                  style={{ background: 'none', border: 'none', color: THEME.primary, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
                >
                  Sign In
                </button>
              </p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 32, fontWeight: 700, color: THEME.text1, marginBottom: 8, fontFamily: FONTS.display }}>
                Verify Your Email
              </h1>
              <p style={{ fontSize: 16, color: THEME.text2, marginBottom: 32 }}>
                Enter the 6-digit code sent to {formData.email}
              </p>

              {error && (
                <div style={{ padding: 12, borderRadius: 8, background: `${THEME.error}15`, border: `1px solid ${THEME.error}30`, color: THEME.error, fontSize: 14, marginBottom: 24 }}>
                  {error}
                </div>
              )}

              {otpSent && (
                <div style={{ padding: 12, borderRadius: 8, background: `${THEME.success}15`, border: `1px solid ${THEME.success}30`, color: THEME.success, fontSize: 14, marginBottom: 24 }}>
                  Verification code sent successfully!
                </div>
              )}

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: THEME.text2, marginBottom: 8 }}>
                  Verification Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  style={{
                    width: '100%',
                    padding: 14,
                    background: THEME.surface,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 8,
                    color: THEME.text1,
                    fontSize: 20,
                    letterSpacing: 8,
                    textAlign: 'center',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = THEME.primary}
                  onBlur={(e) => e.target.style.borderColor = THEME.border}
                />
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: 14,
                  background: loading ? THEME.surfaceHover : THEME.primary,
                  border: 'none',
                  borderRadius: 8,
                  color: 'white',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginBottom: 16,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.background = THEME.primaryHover)}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.background = THEME.primary)}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    Verifying...
                  </>
                ) : (
                  'Verify & Create Account'
                )}
              </button>

              <button
                onClick={handleResendOTP}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: 14,
                  background: 'transparent',
                  border: `1px solid ${THEME.border}`,
                  borderRadius: 8,
                  color: THEME.text2,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.borderColor = THEME.primary, e.currentTarget.style.color = THEME.primary)}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.borderColor = THEME.border, e.currentTarget.style.color = THEME.text2)}
              >
                Resend Code
              </button>

              <button
                onClick={() => setStep('form')}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: 12,
                  background: 'transparent',
                  border: 'none',
                  color: THEME.text3,
                  fontSize: 13,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: 16,
                }}
              >
                ← Back to registration
              </button>
            </>
          )}
        </div>
      </div>

      {/* Right Side - Hero */}
      <div style={{ 
        flex: 1, 
        display: 'none', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 40,
        background: `linear-gradient(135deg, ${THEME.primary} 0%, #8B5CF6 100%)`,
      }} className="hero-section">
        <div style={{ maxWidth: 480 }}>
          <h1 style={{ fontSize: 48, fontWeight: 700, color: 'white', marginBottom: 24, fontFamily: FONTS.display, lineHeight: 1.2 }}>
            Discover Premium UGC Content
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.9)', marginBottom: 32, lineHeight: 1.6 }}>
            Access thousands of high-quality user-generated content from vetted creators. Manage your purchases, track performance, and scale your brand with authentic content.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={16} color="white" />
              </div>
              <span style={{ fontSize: 16, color: 'white' }}>Wallet-based payments</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={16} color="white" />
              </div>
              <span style={{ fontSize: 16, color: 'white' }}>Direct payment options</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={16} color="white" />
              </div>
              <span style={{ fontSize: 16, color: 'white' }}>Video performance analytics</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={16} color="white" />
              </div>
              <span style={{ fontSize: 16, color: 'white' }}>License management</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (min-width: 1024px) {
          .hero-section {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function BrandRegisterPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: THEME.bg }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: THEME.primary }} />
      </div>
    }>
      <BrandRegisterPageContent />
    </Suspense>
  );
}