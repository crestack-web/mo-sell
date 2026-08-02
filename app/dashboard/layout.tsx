'use client';

import React from 'react';
import { SupabaseProvider } from '@/lib/supabase/provider';
import { SellProvider } from '@/context/SellContext';
import { SellAuthGuard } from '@/components/SellAuthGuard';
import { SellShell } from '@/components/SellShell';
import '@/app/sell-tokens.css';

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseProvider>
      <SellProvider>
        <SellAuthGuard>
          <SellShell>{children}</SellShell>
        </SellAuthGuard>
      </SellProvider>
    </SupabaseProvider>
  );
}
