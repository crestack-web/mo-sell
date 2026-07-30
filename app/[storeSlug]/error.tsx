'use client';

import React from 'react';

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ textAlign: 'center', maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <span style={{ fontSize: '3rem', display: 'block', marginBottom: 16 }}>⚠️</span>
      <h1 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--sf-text-1, #F5F0E8)' }}>Something went wrong</h1>
      <p style={{ fontSize: '0.85rem', color: 'var(--sf-text-2, #A89878)', margin: '0 0 24px', lineHeight: 1.6 }}>
        We couldn&apos;t load this page. Please try again or contact the store owner.
      </p>
      <button
        onClick={reset}
        style={{
          padding: '10px 28px', borderRadius: 8,
          border: '1px solid var(--sf-primary, #C9A84C)', color: 'var(--sf-primary, #C9A84C)',
          background: 'transparent', fontSize: '0.83rem', fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  );
}
