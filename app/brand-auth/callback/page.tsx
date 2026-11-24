'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';
import { getDatabase } from '@/lib/database/adapter';
import { Loader2 } from 'lucide-react';
import { AuthShell } from '../_components/AuthShell';
import styles from '../brand-auth.module.css';

export const dynamic = 'force-dynamic';

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
    <AuthShell
      eyebrow="Almost there"
      title="Signing you in…"
      description="Setting up your brand workspace. This will only take a moment."
    >
      <div className={styles.center} style={{ padding: '24px 0' }}>
        <Loader2 size={30} className={styles.spinner} />
      </div>
    </AuthShell>
  );
}

export default function BrandAuthCallbackPage() {
  return (
    <Suspense fallback={<div className={styles.page} />}>
      <BrandAuthCallbackContent />
    </Suspense>
  );
}
