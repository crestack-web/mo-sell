'use client';

import React from 'react';
import { ToastProvider } from '@/components/brand/ToastProvider';
import { BrandWorkspaceProvider } from './_components/BrandWorkspaceProvider';
import { BrandShell } from './_components/BrandShell';

export default function BrandDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <BrandWorkspaceProvider>
        <BrandShell>{children}</BrandShell>
      </BrandWorkspaceProvider>
    </ToastProvider>
  );
}
