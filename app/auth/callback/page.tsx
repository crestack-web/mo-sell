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

      if (data.session) {
        const user = data.session.user;

        // Ensure the creator has a users/{id} profile so the dashboard can load.
        // (Google sign-ins create the auth user but not the profile row.)
        try {
          const db = getDatabase();
          const userDoc = await db.doc(`users/${user.id}`).get();
          if (!userDoc.exists) {
            const displayName =
              (user.user_metadata?.full_name as string) ||
              (user.user_metadata?.name as string) ||
              user.email?.split('@')[0] ||
              'User';
            await db.doc(`users/${user.id}`).set({
              displayName,
              email: user.email || '',
              businessId: '',
              plan: 'starter',
              moSellAccess: true,
              emailVerified: true,
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
          }
        } catch (profileError) {
          console.error('Auth callback: failed to ensure user profile:', profileError);
        }

        router.replace('/dashboard');
      } else {
        // No session, redirect to login
        router.replace('/login');
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
