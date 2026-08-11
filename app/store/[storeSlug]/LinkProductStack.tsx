'use client';
import React from 'react';
import { ShoppingCart } from 'lucide-react';
import type { ProductCardData } from '@/themes/types';

export function LinkProductStack({ products, storeSlug, currency, emptyMessage }: {
  products: ProductCardData[];
  storeSlug: string;
  currency: string;
  emptyMessage?: string;
}) {
  if (products.length === 0) {
    return (
      <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--sf-text-3, #9CA3AF)', fontSize: '0.85rem' }}>
        {emptyMessage || 'No products yet.'}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 20px 40px', maxWidth: 480, margin: '0 auto' }}>
      {products.map(p => {
        const img = p.images?.[0];
        return (
          <a
            key={p.id}
            href={`/store/${storeSlug}/product/${p.id}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px',
              background: 'var(--sf-surface, #1a1a1a)',
              borderRadius: 12,
              textDecoration: 'none',
              transition: 'all 0.15s',
              border: '1px solid var(--sf-border, rgba(255,255,255,0.08))',
            }}
          >
            {img ? (
              <img
                src={img}
                alt={p.displayName}
                style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--sf-border, #333)', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--sf-text-1, #fff)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {p.displayName}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', fontWeight: 600, color: 'var(--sf-primary, #A78BFA)' }}>
                {currency === 'NGN' ? '₦' : '$'}{p.price.toLocaleString()}
              </p>
            </div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '7px 14px', borderRadius: 100,
              background: 'var(--sf-primary, #A78BFA)', color: '#fff',
              fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              <ShoppingCart size={13} />
              Buy Now
            </span>
          </a>
        );
      })}
    </div>
  );
}
