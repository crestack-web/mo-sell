'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';
import { getDatabase } from '@/lib/database/adapter';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

const THEME = {
  bg: '#0A0A0B',
  primary: '#6366F1',
  text2: '#A1A1AA',
};

function BrandAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/brand/dashboard';

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) {
          console.error('Brand auth callback error:', error);
          router.replace('/brand-auth/login?error=oauth_failed');
          return;
        }

        const user = data.session?.user;
        if (!user) {
          router.replace('/brand-auth/login');
          return;
        }

        const db = getDatabase();
        const brandDoc = await db.doc(`brands/${user.id}`).get();
        const brandData = brandDoc.data();

        if (brandDoc.exists && brandData && brandData.status !== 'active') {
          await supabaseClient.auth.signOut();
          router.replace('/brand-auth/login?error=inactive');
          return;
        }

        if (!brandDoc.exists) {
          // Auto-create a minimal brand profile so Google sign-up "just works".
          const newBrandName = user.user_metadata?.name || user.user_metadata?.full_name || (user.email ?? 'Brand').split('@')[0];
          const createResponse = await fetch('/api/brand/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accessToken: data.session.access_token,
              email: user.email,
              brandName: newBrandName,
              phone: '',
              website: '',
              industry: 'Other',
            }),
          });

          if (!createResponse.ok) {
            const createData = await createResponse.json().catch(() => ({}));
            throw new Error(createData.error || 'Failed to create brand profile');
          }

          // Send brand welcome email (non-blocking)
          fetch('/api/email/welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role: 'brand',
              email: user.email,
              name: newBrandName,
              brandName: newBrandName,
            }),
          }).catch(() => {});
        }

        router.replace(redirectTo);
      } catch (err) {
        console.error('Brand auth callback error:', err);
        router.replace('/brand-auth/login?error=oauth_failed');
      }
    };

    handleCallback();
  }, [router, redirectTo]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: THEME.bg }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #2A2A2E', borderTopColor: THEME.primary, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: THEME.text2, fontSize: 14 }}>Signing you in...</p>
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}

export default function BrandAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: THEME.bg }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: THEME.primary }} />
      </div>
    }>
      <BrandAuthCallbackContent />
    </Suspense>
  );
}
