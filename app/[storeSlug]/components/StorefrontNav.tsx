'use client';

import React, { useEffect, useState } from 'react';
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
  /** 'left' = logo left, 'center' = logo centered, 'minimal' = no header */
  headerStyle?: 'left' | 'center' | 'minimal';
}

export function StorefrontNav({ storeName, logoUrl, storeSlug, businessId, hideStoreNameWithLogo, headerStyle = 'left' }: Props) {
  const { totalItems, toggleCart } = useCart();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!businessId) return;
    fetch(`/api/store/collections?businessId=${businessId}`)
      .then(r => r.ok ? r.json() : { collections: [] })
      .then(d => setCollections((d.collections ?? []).slice(0, 5)))
      .catch(() => {});
  }, [businessId]);

  if (headerStyle === 'minimal') return null;

  const logoBlock = (
    <Link href={`/${storeSlug}`} style={{ textDecoration: 'none' }}>
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
          href={`/${storeSlug}/collections/${col.id}`}
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

  const cartAndMenu = (
    <>
      <button
        className="sf-nav-menu sf-nav-mobile-only"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
        aria-expanded={mobileMenuOpen}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <button className="sf-nav-cart" onClick={toggleCart} aria-label="Open cart">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.74l1.38-9.26H6"/>
        </svg>
        <span className="sf-nav-cart-text">Cart</span>
        {totalItems > 0 && <span className="sf-cart-badge">{totalItems}</span>}
      </button>
    </>
  );

  const mobileMenu = mobileMenuOpen && collections.length > 0 ? (
    <div className="sf-nav-mobile-menu">
      {collections.map(col => (
        <Link
          key={col.id}
          href={`/${storeSlug}/collections/${col.id}`}
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
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {cartAndMenu}
          </div>
        </div>
        {collectionsLinks}
        {mobileMenu}
      </nav>
    );
  }

  /* ── Left header (default): logo left, collections center, cart right ── */
  return (
    <nav className="sf-nav">
      {logoBlock}
      {collectionsLinks}
      <div className="sf-nav-spacer" />
      {cartAndMenu}
      {mobileMenu}
    </nav>
  );
}