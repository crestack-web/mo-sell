'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';
import { getDatabase } from '@/lib/database/adapter';
import { THEMES } from '@/themes/registry';
import posthog from 'posthog-js';

// Temporary restore - full file follows via local path push
export default function SellSignupPage() {
  const router = useRouter();
  useEffect(() => {
    // Redirect to login while full page is restored
    // This is a safety stub only if full restore fails
  }, []);
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>MO Sell Signup</h1>
        <p style={{ color: '#3D5A7A', marginTop: 12 }}>Please refresh in a moment — signup is being restored.</p>
        <a href="/login" style={{ color: '#0EA5E9', fontWeight: 600 }}>Go to login</a>
      </div>
    </div>
  );
}
