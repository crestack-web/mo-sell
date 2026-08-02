'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';

export const dynamic = 'force-dynamic';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabaseClient.auth.getSession();
      
      if (error) {
        console.error('Auth callback error:', error);
        router.replace('/sell-login?error=oauth_failed');
        return;
      }

      if (data.session) {
        // Successfully authenticated
        router.replace('/dashboard');
      } else {
        // No session, redirect to login
        router.replace('/sell-login');
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
