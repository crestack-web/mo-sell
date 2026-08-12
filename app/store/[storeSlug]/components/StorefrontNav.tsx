'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';

interface Collection { id: string; title: string; }

interface Props {
  storeName: string;
  logoUrl: string | null;
  storeSlug: string;
  currency: string;
  businessId: string;
  hideStoreNameWithLogo?: boolean;
  headerStyle?: 'left' | 'center' | 'minimal';
  showSearch?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
}

export function StorefrontNav({ storeName, logoUrl, storeSlug, businessId, hideStoreNameWithLogo, headerStyle = 'left', showSearch = false }: Props) {
  const { totalItems, toggleCart } = useCart();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!businessId) return;
    fetch(`/api/store/collections?businessId=${businessId}`)
      .then(r => r.ok ? r.json() : { collections: [] })
      .then(d => setCollections((d.collections ?? []).slice(0, 5)))
      .catch(() => {});
  }, [businessId]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const params = new URLSearchParams(window.location.search);
    params.set('q', searchQuery.trim());
    window.location.search = params.toString();
    setSearchOpen(false);
  }, [searchQuery]);

  if (headerStyle === 'minimal') return null;

  const logoBlock = (
    <Link href={`/store/${storeSlug}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
      {logoUrl
        ? <img src={logoUrl} alt={storeName} style={{ height: 36, width: 'auto', borderRadius: 6, objectFit: 'contain' }} />
        : <span style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'var(--sf-primary)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '1rem',
          }}>{storeName.charAt(0).toUpperCase()}</span>
      }
      {!(hideStoreNameWithLogo && logoUrl) && (
        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--sf-text-1)' }}>{storeName}</span>
      )}
    </Link>
  );

  const collectionsLinks = collections.length > 0 ? (
    <div className="sf-nav-links sf-nav-desktop-only" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {collections.map(col => (
        <Link
          key={col.id}
          href={`/store/${storeSlug}/collections/${col.id}`}
          style={{
            fontSize: 13, fontWeight: 500, color: 'var(--sf-text-2)',
            textDecoration: 'none', padding: '6px 10px', borderRadius: 8,
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.background = 'var(--sf-border)')}
          onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.background = 'transparent')}
        >
          {col.title}
        </Link>
      ))}
    </div>
  ) : null;

  const searchButton = showSearch ? (
    <button
      onClick={() => setSearchOpen(true)}
      aria-label="Search products"
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: 6, color: 'var(--sf-text-2)', display: 'flex',
        alignItems: 'center', borderRadius: 8,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
      </svg>
    </button>
  ) : null;

  const searchOverlay = searchOpen ? (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: '15vh',
    }} onClick={() => setSearchOpen(false)}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 24,
        width: '90%', maxWidth: 480, boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
      }} onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <input
            autoFocus
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            style={{
              flex: 1, padding: '10px 14px', border: '1px solid #E5E7EB',
              borderRadius: 10, fontSize: '1rem', outline: 'none',
            }}
          />
          <button type="submit" style={{
            padding: '10px 20px', background: 'var(--sf-primary)', color: '#fff',
            border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer',
          }}>Search</button>
        </form>
      </div>
    </div>
  ) : null;

  const cartAndActions = (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center', position: 'relative' }}>
      {searchButton}
      <button
        className="sf-nav-menu sf-nav-mobile-only"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
        aria-expanded={mobileMenuOpen}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--sf-text-2)' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <button className="sf-nav-cart" onClick={toggleCart} aria-label="Open cart" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--sf-text-2)', display: 'flex', alignItems: 'center', position: 'relative' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.74l1.38-9.26H6"/>
        </svg>
        <span className="sf-nav-cart-text" style={{ fontSize: 13, marginLeft: 4 }}>Cart</span>
        {totalItems > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: 'var(--sf-primary)', color: '#fff',
            fontSize: 10, fontWeight: 700, width: 18, height: 18,
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{totalItems}</span>
        )}
      </button>
    </div>
  );

  const mobileMenu = mobileMenuOpen && collections.length > 0 ? (
    <div className="sf-nav-mobile-menu">
      {collections.map(col => (
        <Link
          key={col.id}
          href={`/store/${storeSlug}/collections/${col.id}`}
          onClick={() => setMobileMenuOpen(false)}
          className="sf-nav-mobile-link"
        >
          {col.title}
        </Link>
      ))}
    </div>
  ) : null;

  /* ── Centered header: logo centered, nav below ── */
  if (headerStyle === 'center') {
    return (
      <nav className="sf-nav" style={{ flexDirection: 'column', gap: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '0 0 4px',
        }}>
          <div />
          {logoBlock}
          {cartAndActions}
        </div>
        {collectionsLinks}
        {mobileMenu}
        {searchOverlay}
      </nav>
    );
  }

  /* ── Left header (default): logo left, collections center, cart right ── */
  return (
    <nav className="sf-nav">
      {logoBlock}
      {collectionsLinks}
      <div className="sf-nav-spacer" />
      {cartAndActions}
      {mobileMenu}
      {searchOverlay}
    </nav>
  );
}
