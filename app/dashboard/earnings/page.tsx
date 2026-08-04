'use client';

import nextDynamic from 'next/dynamic';

export const dynamic = 'force-dynamic';

const SellEarningsPage = nextDynamic(() => import('./SellEarningsPage').then(m => ({ default: m.SellEarningsPage })), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 200 }}>
      <div style={{ width: 28, height: 28, border: '2.5px solid var(--sell-border, #e5e7eb)', borderTopColor: 'var(--sell-primary, #0ea5e9)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  ),
});

export default function Page() {
  return <SellEarningsPage />;
}
