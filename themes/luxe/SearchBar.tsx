'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ThemeSearchBarProps } from '../types';

export function LuxeSearchBar({ initialQuery = '', placeholder = 'Search products…', storeSlug, compact, autoFocus = false }: ThemeSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/store/${storeSlug}?q=${encodeURIComponent(q)}`);
  };

  const clear = () => {
    setQuery('');
    router.push(`/store/${storeSlug}`);
  };

  return (
    <form onSubmit={submit} role="search" style={{ display: 'flex', gap: 8, maxWidth: compact ? 420 : 560, width: '100%' }}>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Search products"
        autoFocus={autoFocus}
        style={{
          flex: 1, minWidth: 0, padding: '12px 18px',
          background: '#141414', border: '1px solid #2A2A2A', borderRadius: 2,
          color: '#F5F5F0', fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: '0.9rem', outline: 'none', boxShadow: 'none', boxSizing: 'border-box',
        }}
      />
      <button type="submit" style={{
        padding: '0 22px', background: 'transparent', color: '#C9A84C',
        border: '1px solid #C9A84C', borderRadius: 2,
        fontWeight: 600, fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase',
        cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif",
        display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        {!compact && <span>Search</span>}
      </button>
      {initialQuery && (
        <button type="button" onClick={clear} aria-label="Clear search" style={{
          background: 'none', border: '1px solid #2A2A2A', color: '#A0A09A', borderRadius: 2,
          padding: '0 16px', cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: '0.78rem', whiteSpace: 'nowrap',
        }}>
          Clear
        </button>
      )}
    </form>
  );
}
