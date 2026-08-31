'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';
import { getDatabase } from '@/lib/database/adapter';

export default function BusmoCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Signing you in with Busmo…');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (!token) {
          setStatus('Missing Busmo token.');
          router.replace('/signup?error=busmo_token');
          return;
        }

        const res = await fetch('/api/auth/busmo-handoff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setStatus(json.error || 'Busmo sign-in failed');
          setTimeout(() => router.replace('/signup?error=busmo_failed'), 2000);
          return;
        }

        if (json.hashedToken) {
          const { error } = await supabaseClient.auth.verifyOtp({
            token_hash: json.hashedToken,
            type: 'email',
          });
          if (error) {
            console.error('[busmo-callback] verifyOtp', error);
            setStatus('Could not establish session. Try logging in with the same email.');
            setTimeout(() => router.replace('/login'), 2500);
            return;
          }
        }

        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session?.user) {
          setStatus('Session missing. Redirecting to login…');
          setTimeout(() => router.replace('/login'), 2000);
          return;
        }

        const user = session.user;
        const db = getDatabase();
        const userDoc = await db.doc(`users/${user.id}`).get();
        const displayName =
          json.fullName ||
          (user.user_metadata?.full_name as string) ||
          user.email?.split('@')[0] ||
          'User';

        if (userDoc.exists && userDoc.data()?.businessId) {
          if (!cancelled) router.replace('/dashboard');
          return;
        }

        const businessId =
          userDoc.exists && userDoc.data()?.businessId
            ? userDoc.data()!.businessId
            : `biz_${user.id.slice(0, 12)}`;

        if (!userDoc.exists) {
          await db.doc(`users/${user.id}`).set({
            displayName,
            email: user.email || json.email || '',
            businessId,
            plan: 'starter',
            moSellAccess: true,
            emailVerified: true,
            onboardingComplete: false,
            source: 'busmo',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        if (!cancelled) {
          setStatus('Account ready — continuing…');
          router.replace('/signup?onboarding=1');
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setStatus('Something went wrong.');
          setTimeout(() => router.replace('/signup'), 2000);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F4F8FC', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 32, maxWidth: 360, width: '100%',
        textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          width: 36, height: 36, margin: '0 auto 16px', borderRadius: '50%',
          border: '3px solid #7c3aed', borderTopColor: 'transparent',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ margin: 0, fontSize: 14, color: '#334155', fontWeight: 500 }}>{status}</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
