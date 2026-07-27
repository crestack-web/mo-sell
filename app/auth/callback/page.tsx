'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { initializeFirebase } from '@/lib/firebase';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { Suspense } from 'react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const uid = searchParams.get('uid');

    if (!token || !uid) {
      setError('Invalid auth link. Please try logging in again.');
      return;
    }

    const firebase = initializeFirebase();
    const auth = getAuth(firebase.firebaseApp);

    signInWithCustomToken(auth, token)
      .then(() => {
        router.replace('/dashboard');
      })
      .catch((err) => {
        console.error('Auth failed:', err);
        setError('Authentication failed. Please try again.');
      });
  }, [searchParams, router]);

  if (error) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#F0F9FF', fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#EF4444', fontSize: '1rem', marginBottom: 16 }}>{error}</p>
          <a href="/login" style={{ color: '#0EA5E9', textDecoration: 'underline' }}>Go to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F0F9FF', fontFamily: 'Plus Jakarta Sans, sans-serif',
    }}>
      <p style={{ color: '#3D5A7A', fontSize: '0.875rem' }}>Signing you in...</p>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#F0F9FF',
      }}>
        <p style={{ color: '#3D5A7A', fontSize: '0.875rem' }}>Loading...</p>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
