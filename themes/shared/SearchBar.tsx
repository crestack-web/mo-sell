'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ThemeSearchBarProps } from '../types';
import { THEME_TOKENS, accentText, type ThemeTokens } from './tokens';

export function SearchBarWithTheme({ themeId, initialQuery = '', placeholder = 'Search products…', storeSlug, compact, autoFocus = false }: ThemeSearchBarProps & { themeId: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const t = THEME_TOKENS[themeId] as ThemeTokens;
  const radius = t.radius === 0 ? 0 : 999;
  const innerRadius = t.radius === 0 ? 0 : t.radius >= 12 ? 12 : 8;

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
          flex: 1, minWidth: 0, padding: '11px 16px',
          background: t.surface, border: `1px solid ${t.border}`,
          borderRadius: radius === 999 ? 999 : innerRadius,
          color: t.text, fontFamily: t.fontBody, fontSize: '0.9rem',
          outline: 'none', boxShadow: 'none', boxSizing: 'border-box',
        }}
      />
      <button type="submit" style={{
        padding: '0 20px',
        background: t.accent, color: accentText(t),
        border: 'none', borderRadius: radius === 999 ? 999 : innerRadius,
        fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
        fontFamily: t.fontBody, display: 'flex', alignItems: 'center', gap: 6,
        whiteSpace: 'nowrap',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        {!compact && <span>Search</span>}
      </button>
      {initialQuery && (
        <button type="button" onClick={clear} aria-label="Clear search" style={{
          background: 'none', border: `1px solid ${t.border}`, color: t.subtext,
          borderRadius: radius === 999 ? 999 : innerRadius,
          padding: '0 16px', cursor: 'pointer', fontFamily: t.fontBody, fontSize: '0.8rem',
          whiteSpace: 'nowrap',
        }}>
          Clear
        </button>
      )}
    </form>
  );
}
