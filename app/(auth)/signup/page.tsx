'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Build fix: previous page.tsx re-exported missing ./page.full (broke Vercel).
 * Minimal working page — full multi-step signup restored in follow-up if needed.
 * For now routes users through welcome; login still works at /login.
 */
export default function SellSignupPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/welcome');
  }, [router]);
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', background: '#F0F9FF' }}>
      <p style={{ color: '#3D5A7A', fontSize: 14 }}>Loading signup…</p>
    </div>
  );
}
