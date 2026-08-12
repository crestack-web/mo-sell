import React from 'react';
import { ProductCard, type ProductCardData } from './ProductCard';

interface Props {
  products: ProductCardData[];
  storeSlug: string;
  currency: string;
  emptyMessage?: string;
  columns?: number;
}

export function ProductGrid({ products, storeSlug, currency, emptyMessage = 'No products yet.', columns }: Props) {
  if (products.length === 0) {
    return (
      <div style={{
        padding: '48px 24px', textAlign: 'center',
        color: 'var(--sf-text-3)', fontSize: '0.9rem',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        width: '100%',
        boxSizing: 'border-box',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1786305125/Untitled_-_August_08_2026_at_11.22.19_m56rrv.png"
          alt=""
          style={{ width: '100%', maxWidth: 340, height: 'auto', display: 'block' }}
        />
        <span>{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div className="sf-product-grid" style={columns ? {
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: 24,
      width: '100%',
      boxSizing: 'border-box',
    } : {
      width: '100%',
      boxSizing: 'border-box',
    }}>
      {products.map(p => (
        <ProductCard key={p.id} product={p} storeSlug={storeSlug} currency={currency} />
      ))}
    </div>
  );
}
