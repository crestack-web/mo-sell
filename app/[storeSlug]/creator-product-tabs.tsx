'use client';

import React, { useState, useMemo } from 'react';
import type { ProductCardData } from '@/themes/types';

interface CreatorProductTabsProps {
  products: ProductCardData[];
  storeSlug: string;
  currency: string;
  ProductCard: React.ComponentType<{ product: ProductCardData; storeSlug: string; currency: string }>;
  columns?: number;
}

export function CreatorProductTabs({ products, storeSlug, currency, ProductCard, columns = 3 }: CreatorProductTabsProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'digital' | 'physical'>('all');

  const tabs = useMemo(() => {
    const hasDigital = products.some(p => p.productType === 'digital');
    const hasPhysical = products.some(p => p.productType === 'physical' || p.productType === 'service');
    const result: { id: 'all' | 'digital' | 'physical'; label: string }[] = [{ id: 'all', label: 'All Products' }];
    if (hasDigital) result.push({ id: 'digital', label: 'Digital' });
    if (hasPhysical) result.push({ id: 'physical', label: 'Physical' });
    return result;
  }, [products]);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return products;
    if (activeTab === 'digital') return products.filter(p => p.productType === 'digital');
    return products.filter(p => p.productType === 'physical' || p.productType === 'service');
  }, [products, activeTab]);

  if (tabs.length <= 1) {
    return (
      <div className="sf-product-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 24 }}>
        {products.map(p => (
          <ProductCard key={p.id} product={p} storeSlug={storeSlug} currency={currency} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="sf-product-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`sf-product-tab ${activeTab === tab.id ? 'sf-product-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="sf-product-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 24 }}>
        {filtered.length > 0 ? (
          filtered.map(p => (
            <ProductCard key={p.id} product={p} storeSlug={storeSlug} currency={currency} />
          ))
        ) : (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9CA3AF', fontSize: '0.9rem', gridColumn: '1 / -1' }}>
            No {activeTab === 'digital' ? 'digital' : 'physical'} products yet.
          </div>
        )}
      </div>
    </div>
  );
}
