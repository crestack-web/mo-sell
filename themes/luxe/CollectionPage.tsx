'use client';

import React from 'react';
import Link from 'next/link';
import type { ThemeCollectionPageProps } from '../types';

export function LuxeCollectionPage({ collection, products, storeSlug, currency, ProductCard }: ThemeCollectionPageProps) {
  return (
    <div style={{ background: '#0A0A0A', color: '#F5F5F0', minHeight: '70vh' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 5% 0' }}>
        <nav style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#606060', display: 'flex', gap: 8, marginBottom: 44 }}>
          <Link href={`/store/${storeSlug}`} style={{ color: '#C9A84C', textDecoration: 'none' }}>Store</Link>
          <span>/</span>
          <span>{collection.title}</span>
        </nav>
      </div>

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 5% 56px' }}>
        {collection.coverImageUrl && (
          <div style={{ height: 320, overflow: 'hidden', marginBottom: 44 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={collection.coverImageUrl} alt={collection.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <p style={{ fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#C9A84C', margin: 0 }}>The Collection</p>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontStyle: 'italic', fontWeight: 400,
          fontSize: 'clamp(2rem, 4.5vw, 3.4rem)',
          color: '#F5F5F0', margin: '10px 0 0',
        }}>{collection.title}</h1>
        {collection.description && (
          <p style={{ fontSize: '0.9rem', color: '#A89878', lineHeight: 1.7, maxWidth: 620, margin: '18px 0 0', fontWeight: 300 }}>
            {collection.description}
          </p>
        )}
        <div style={{ height: 1, background: '#2A2A2A', margin: '30px 0 10px' }} />
        <p style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#606060', margin: '0 0 40px' }}>
          {products.length} piece{products.length !== 1 ? 's' : ''}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 40 }}>
          {products.map(pr => (
            <ProductCard key={pr.id} product={pr} storeSlug={storeSlug} currency={currency} />
          ))}
        </div>
        {products.length === 0 && (
          <div style={{ padding: '56px 24px', textAlign: 'center', color: '#606060', fontSize: '0.9rem' }}>
            No pieces in this collection yet.
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', padding: '16px 0 80px' }}>
        <Link href={`/store/${storeSlug}`} style={{ fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#A89878', textDecoration: 'none', borderBottom: '1px solid #C9A84C', paddingBottom: 4 }}>
          ← Back to all products
        </Link>
      </div>
    </div>
  );
}
