'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';
import { getDatabase } from '@/lib/database/adapter';
import { ArrowRight, Mail, Lock, Building, Loader2, AlertCircle } from 'lucide-react';

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
  email: string;
  password: string;
}

function BrandLoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/brand/dashboard';

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleLogin = async () => {
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
      // Sign in with Supabase
      const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Login failed');
      }

      // Check if brand profile exists
      const db = getDatabase();
      const brandDoc = await db.doc(`brands/${authData.user.id}`).get();
      
      if (!brandDoc.exists) {
        await supabaseClient.auth.signOut();
        setError('No brand account found. Please register first.');
        setLoading(false);
        return;
      }

      const brandData = brandDoc.data();
      if (brandData.status !== 'active') {
        await supabaseClient.auth.signOut();
        setError('Your account is not active. Please contact support.');
        setLoading(false);
        return;
      }

      // Redirect to dashboard
      router.push(redirectTo);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: THEME.bg, fontFamily: FONTS.body }}>
      {/* Left Side - Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          {/* Logo */}
          <div style={{ marginBottom: 40, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: THEME.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building size={24} color="white" />
            </div>
            <span style={{ fontSize: 24, fontWeight: 700, color: THEME.text1, fontFamily: FONTS.display }}>
              UGC Marketplace
            </span>
          </div>

          <h1 style={{ fontSize: 32, fontWeight: 700, color: THEME.text1, marginBottom: 8, fontFamily: FONTS.display }}>
            Brand Sign In
          </h1>
          <p style={{ fontSize: 16, color: THEME.text2, marginBottom: 32 }}>
            Access your dashboard to manage UGC purchases and analytics
          </p>

          {error && (
            <div style={{ padding: 12, borderRadius: 8, background: `${THEME.error}15`, border: `1px solid ${THEME.error}30`, color: THEME.error, fontSize: 14, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: THEME.text2, marginBottom: 8 }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={20} color={THEME.text3} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  placeholder="brand@company.com"
                  autoFocus
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
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={20} color={THEME.text3} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  placeholder="••••••••"
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

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {/* TODO: Implement password reset */}}
                style={{ background: 'none', border: 'none', color: THEME.primary, fontSize: 13, cursor: 'pointer' }}
              >
                Forgot password?
              </button>
            </div>

            <button
              onClick={handleLogin}
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
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>

          <p style={{ fontSize: 14, color: THEME.text3, textAlign: 'center', marginTop: 24 }}>
            Don't have a brand account?{' '}
            <button
              onClick={() => router.push('/brand/register' + (redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''))}
              style={{ background: 'none', border: 'none', color: THEME.primary, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
            >
              Register as Brand
            </button>
          </p>
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
            Welcome Back
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.9)', marginBottom: 32, lineHeight: 1.6 }}>
            Access your dashboard to manage your UGC video library, track performance, and handle payments seamlessly.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                📊
              </div>
              <span style={{ fontSize: 16, color: 'white' }}>View your purchased videos</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                💳
              </div>
              <span style={{ fontSize: 16, color: 'white' }}>Manage wallet balance</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                📈
              </div>
              <span style={{ fontSize: 16, color: 'white' }}>Track video performance</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                📋
              </div>
              <span style={{ fontSize: 16, color: 'white' }}>View transaction history</span>
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

export default function BrandLoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: THEME.bg }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: THEME.primary }} />
      </div>
    }>
      <BrandLoginPageContent />
    </Suspense>
  );
}