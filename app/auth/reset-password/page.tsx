'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';

export const dynamic = 'force-dynamic';

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  primary: '#0EA5E9', accent: '#6366F1', bg: '#F0F9FF',
  surface: '#FFFFFF', border: '#E0EFFA',
  text1: '#0C1A2E', text2: '#3D5A7A', text3: '#8AAABF',
  red: '#DC2626', redBg: '#FEE2E2', green: '#16A34A', greenBg: '#DCFCE7',
};
const FONT_DISPLAY = "'Clash Display','Plus Jakarta Sans',sans-serif";
const FONT_BODY    = "'Plus Jakarta Sans',system-ui,sans-serif";

function Field({ label, id, type = 'text', value, onChange, placeholder, autoComplete, disabled }: {
  label: string; id: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  autoComplete?: string; disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 13, fontWeight: 600, color: C.text2, fontFamily: FONT_BODY }}>
        {label}
      </label>
      <input
        id={id} type={type} value={value} autoComplete={autoComplete}
        disabled={disabled} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          padding: '12px 14px', borderRadius: 10, fontSize: 14,
          fontFamily: FONT_BODY, color: C.text1, background: '#F8FBFF',
          outline: 'none', transition: 'all 0.18s ease',
          border: `1.5px solid ${focused ? C.primary : C.border}`,
          boxShadow: focused ? '0 0 0 3px rgba(14,165,233,0.12)' : 'none',
          opacity: disabled ? 0.6 : 1,
        }}
      />
    </div>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [validLink, setValidLink] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabaseClient.auth.getSession().then((res: { data: { session: unknown }; error: { message: string } | null }) => {
      if (res.error || !res.data.session) {
        setValidLink(false);
      } else {
        setValidLink(true);
      }
      setChecking(false);
    });
  }, []);

  const passwordValid = password.length >= 8 && password === confirm;

  async function handleReset() {
    if (!passwordValid) {
      setError('Password must be at least 8 characters and match the confirmation.');
      return;
    }
    setLoading(true); setError('');
    try {
      const { error } = await supabaseClient.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => router.replace('/login'), 1800);
    } catch (err: any) {
      setError(err?.message || 'Could not update password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

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

          {/* Card */}
          <div style={{
            background: C.surface, borderRadius: 24, padding: '28px 28px 32px',
            border: `1px solid ${C.border}`,
            boxShadow: '0 4px 6px rgba(0,0,0,0.03), 0 24px 56px rgba(14,165,233,0.10)',
            display: 'flex', flexDirection: 'column', gap: 22,
          }}>

            {/* Header */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png" alt="MO Sell" style={{ height: 36, width: 'auto', objectFit: 'contain', marginBottom: 4 }} />
              <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.text1, letterSpacing: '-0.025em', lineHeight: 1.2, margin: 0 }}>
                Reset your password
              </h1>
              <p style={{ fontSize: 14, color: C.text2, margin: 0, lineHeight: 1.5 }}>
                Choose a new password for your MO Sell account.
              </p>
            </div>

            {checking && (
              <p style={{ fontSize: 13, color: C.text3, margin: 0 }}>Checking your reset link…</p>
            )}

            {!checking && !validLink && (
              <>
                <p style={{ fontSize: 13, color: C.red, background: C.redBg, padding: '10px 14px', borderRadius: 9, margin: 0 }}>
                  This reset link is invalid or has expired. Please request a new one.
                </p>
                <button onClick={() => router.replace('/login')} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '13px 24px', borderRadius: 12, border: 'none', fontFamily: FONT_DISPLAY,
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`,
                  color: 'white',
                }}>
                  Back to sign in
                </button>
              </>
            )}

            {!checking && validLink && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {done && (
                  <p style={{ fontSize: 13, color: C.green, background: C.greenBg, padding: '10px 14px', borderRadius: 9, margin: 0 }}>
                    ✓ Password updated — taking you back to sign in.
                  </p>
                )}
                {error && !done && (
                  <p style={{ fontSize: 13, color: C.red, background: C.redBg, padding: '10px 14px', borderRadius: 9, margin: 0 }}>
                    {error}
                  </p>
                )}
                <Field label="New password" id="rp-password" type="password" value={password}
                  onChange={setPassword} placeholder="Min 8 characters" autoComplete="new-password" disabled={loading || done} />
                <Field label="Confirm new password" id="rp-confirm" type="password" value={confirm}
                  onChange={setConfirm} placeholder="Repeat password" autoComplete="new-password" disabled={loading || done} />

                <button onClick={handleReset} disabled={!passwordValid || loading || done} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '13px 24px', borderRadius: 12, border: 'none', fontFamily: FONT_DISPLAY,
                  fontSize: 15, fontWeight: 700,
                  cursor: !passwordValid || loading || done ? 'not-allowed' : 'pointer',
                  background: !passwordValid || loading || done
                    ? '#BAE6FD'
                    : `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`,
                  color: 'white',
                  boxShadow: !passwordValid || loading || done ? 'none' : '0 4px 14px rgba(14,165,233,0.30)',
                  transition: 'all 0.18s ease',
                }}>
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </div>
            )}

          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', justifyContent: 'center', paddingTop: 4,
            fontSize: 13, color: C.text2,
          }}>
            <a href="/login" style={{ color: C.primary, textDecoration: 'none', fontWeight: 600 }}
              onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline')}
              onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none')}>
              ← Back to sign in
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
