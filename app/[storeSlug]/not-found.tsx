import React from 'react';

export default function StorefrontNotFound() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <span style={{ fontSize: '3rem', display: 'block', marginBottom: 16 }}>🔍</span>
      <h1 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--sf-text-1, #F5F0E8)' }}>Store not found</h1>
      <p style={{ fontSize: '0.85rem', color: 'var(--sf-text-2, #A89878)', margin: 0, lineHeight: 1.6 }}>
        This store doesn&apos;t exist or hasn&apos;t been published yet.
      </p>
    </div>
  );
}
