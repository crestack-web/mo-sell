'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';
import { getDatabase } from '@/lib/database/adapter';

export const dynamic = 'force-dynamic';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabaseClient.auth.getSession();

      if (error) {
        console.error('Auth callback error:', error);
        router.replace('/login?error=oauth_failed');
        return;
      }

      if (!data.session) {
        // No session, redirect to login
        router.replace('/login');
        return;
      }

      const user = data.session.user;

      // Ensure the creator has a users/{id} profile so onboarding can load.
      // (Google sign-ins create the auth user but not the profile row.)
      try {
        const db = getDatabase();
        const userDoc = await db.doc(`users/${user.id}`).get();
        const userData = userDoc.exists ? userDoc.data() : {};

        const displayName =
          (user.user_metadata?.full_name as string) ||
          (user.user_metadata?.name as string) ||
          user.email?.split('@')[0] ||
          'User';

        // Existing user who has already onboarded → dashboard
        if (userDoc.exists && userData.businessId) {
          router.replace('/dashboard');
          return;
        }

        // New Google sign-up → create profile + business, then continue onboarding
        // (same flow as the email OTP signup) so the user is not dropped into the
        // legacy $10 subscription page.
        const businessId = `biz_${user.id.slice(0, 12)}`;

        if (!userDoc.exists) {
          await db.doc(`users/${user.id}`).set({
            displayName,
            email: user.email || '',
            businessId,
            plan: 'starter',
            moSellAccess: true,
            emailVerified: true,
            onboardingComplete: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          // Send creator welcome email (non-blocking, new sign-ups only)
          fetch('/api/email/welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role: 'creator',
              email: user.email,
              name: displayName,
            }),
          }).catch(() => {});
        } else if (!userData.onboardingComplete) {
          await db.doc(`users/${user.id}`).set(
            { businessId, updatedAt: new Date().toISOString() },
            { merge: true },
          );
        }

        await db.doc(`businesses/${businessId}`).set(
          {
            ownerUserId: user.id,
            businessName: `${displayName}'s Business`,
            businessType: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );

        router.replace('/signup?onboarding=1');
      } catch (profileError) {
        console.error('Auth callback: failed to ensure user profile:', profileError);
        // Still send to onboarding — complete-onboarding API can create missing rows
        router.replace('/signup?onboarding=1');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F0F9FF' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 mx-auto mb-6" style={{ borderColor: '#0EA5E9' }} />
        <h2 className="text-xl font-semibold mb-2" style={{ color: '#0C1A2E' }}>Signing you in...</h2>
        <p style={{ color: '#3D5A7A' }}>Please wait</p>
      </div>
    </div>
  );
}
