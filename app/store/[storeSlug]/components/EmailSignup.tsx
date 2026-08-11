'use client';

import React, { useState } from 'react';

interface Props {
  businessId: string;
  storeSlug: string;
  heading?: string;
  subheading?: string;
  placeholder?: string;
  buttonLabel?: string;
  compact?: boolean;
}

export function EmailSignup({
  businessId, storeSlug,
  heading = 'Join our community',
  subheading = 'Get the latest updates, offers and more.',
  placeholder = 'Enter your email',
  buttonLabel = 'Subscribe',
  compact = false,
}: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setErrorMsg('Please enter a valid email.');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/store/customers/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, storeSlug, email: email.trim() }),
      });
      if (!res.ok) throw new Error('Subscription failed');
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
      setErrorMsg('Something went wrong. Please try again.');
    }
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setStatus('idle'); }}
          placeholder={placeholder}
          required
          style={{
            flex: 1, minWidth: 200, padding: '10px 14px',
            borderRadius: 8, border: '1.5px solid var(--sf-border)',
            background: 'var(--sf-surface)', color: 'var(--sf-text-1)',
            fontSize: '0.875rem', outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          style={{
            padding: '10px 20px', borderRadius: 8, border: 'none',
            background: 'var(--sf-primary)', color: '#fff',
            fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
            opacity: status === 'loading' ? 0.7 : 1,
          }}
        >
          {status === 'loading' ? '...' : buttonLabel}
        </button>
        {status === 'success' && (
          <span style={{ color: 'var(--sf-green, #22C55E)', fontSize: '0.8rem', fontWeight: 600 }}>Subscribed!</span>
        )}
        {status === 'error' && (
          <span style={{ color: '#EF4444', fontSize: '0.8rem' }}>{errorMsg}</span>
        )}
      </form>
    );
  }

  return (
    <div className="sf-page" style={{ textAlign: 'center', padding: '64px 24px' }}>
      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--sf-text-1)', marginBottom: 8 }}>{heading}</h2>
      <p style={{ color: 'var(--sf-text-2)', marginBottom: 28, maxWidth: 440, marginInline: 'auto' }}>{subheading}</p>

      {status === 'success' ? (
        <div style={{
          padding: '20px 32px', borderRadius: 12,
          background: 'var(--sf-surface, #111)', border: '1px solid var(--sf-border, #222)',
          display: 'inline-block',
        }}>
          <p style={{ color: 'var(--sf-green, #22C55E)', fontWeight: 700, fontSize: '1.05rem' }}>You&apos;re subscribed!</p>
          <p style={{ color: 'var(--sf-text-3)', fontSize: '0.85rem', marginTop: 4 }}>Thank you for joining.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{
          display: 'flex', gap: 10, maxWidth: 460, marginInline: 'auto',
          flexWrap: 'wrap', justifyContent: 'center',
        }}>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setStatus('idle'); }}
            placeholder={placeholder}
            required
            style={{
              flex: 1, minWidth: 220, padding: '14px 18px',
              borderRadius: 10, border: '1.5px solid var(--sf-border, #222)',
              background: 'var(--sf-surface, #111)', color: 'var(--sf-text-1)',
              fontSize: '0.95rem', outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              padding: '14px 28px', borderRadius: 10, border: 'none',
              background: 'var(--sf-primary)', color: '#fff',
              fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
              opacity: status === 'loading' ? 0.7 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {status === 'loading' ? 'Subscribing...' : buttonLabel}
          </button>
        </form>
      )}

      {status === 'error' && (
        <p style={{ color: '#EF4444', fontSize: '0.85rem', marginTop: 12 }}>{errorMsg}</p>
      )}
    </div>
  );
}
