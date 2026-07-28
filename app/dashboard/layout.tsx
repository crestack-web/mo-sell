'use client';

import React from 'react';
import { FirebaseProvider } from '@/lib/firebase/provider';
import { initializeFirebase } from '@/lib/firebase';
import { SellProvider } from '@/context/SellContext';
import { SellAuthGuard } from '@/components/SellAuthGuard';
import { SellShell } from '@/components/SellShell';
import '@/app/sell-tokens.css';

export default function SellLayout({ children }: { children: React.ReactNode }) {
  const firebase = initializeFirebase();

  return (
    <FirebaseProvider {...firebase}>
      <SellProvider>
        <SellAuthGuard>
          <SellShell>{children}</SellShell>
        </SellAuthGuard>
      </SellProvider>
    </FirebaseProvider>
  );
}
