'use client';

import dynamic from 'next/dynamic';

const UGCMarketplacePage = dynamic(() => import('./UGCMarketplacePage').then(m => ({ default: m.UGCMarketplacePage })), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
      <div style={{ width: 28, height: 28, border: '2.5px solid #e5e7eb', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  ),
});

export default function UGCClientWrapper() {
  return <UGCMarketplacePage />;
}
