'use client';

import React from 'react';
import { Package } from 'lucide-react';
import { ContentGenerator } from './ContentGenerator';
import { ProductContentCard } from './ProductContentCard';
import { s } from './shared';
import { useContentHub } from './ContentHubContext';
import generatorStyles from './ContentHub.module.css';

export function IdeasTab() {
  const { user, storeConfig, products, productsLoading, selectedProduct, handleSelectProduct, handleScheduleIdea, currency } = useContentHub();

  const audienceContext = [
    storeConfig?.storeName ? `Store: ${storeConfig.storeName}` : '',
    storeConfig?.businessCategory ? `Category: ${storeConfig.businessCategory}` : '',
    storeConfig?.tagline ? `Tagline: ${storeConfig.tagline}` : '',
    products.length ? `Catalog: ${products.map(p => p.displayName).join(', ')}` : '',
  ].filter(Boolean).join('. ');

  return (
    <div>
      <div style={s.cardHeader}>
        <div>
          <p style={s.cardTitle}>Content Ideas</p>
          <p style={s.cardSub}>Turn your products into content that sells</p>
        </div>
      </div>
      <div style={s.cardBody}>
        <div className={generatorStyles.gallerySection}>
          <span className={generatorStyles.galleryLabel}>
            {products.length > 0 ? `Your Products (${products.length})` : 'Products'}
          </span>

          {productsLoading ? (
            <div className={generatorStyles.productGrid}>
              {[1, 2, 3].map(i => (
                <div key={i} className={generatorStyles.card} style={{ opacity: 0.5, pointerEvents: 'none' }}>
                  <div className={generatorStyles.cardImageWrap} />
                  <div className={generatorStyles.cardBody}>
                    <div className={generatorStyles.cardName}>&nbsp;</div>
                    <div className={generatorStyles.cardMeta}>&nbsp;</div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className={generatorStyles.productGrid}>
              <div className={generatorStyles.emptyState}>
                <Package size={48} className={generatorStyles.emptyIcon} />
                <p className={generatorStyles.emptyTitle}>No products yet</p>
                <p className={generatorStyles.emptyText}>
                  Add your first product to get content ideas, scripts, and selling tips tailored for it.
                </p>
              </div>
            </div>
          ) : (
            <div className={generatorStyles.productGrid}>
              {products.map(p => (
                <ProductContentCard
                  key={p.id}
                  product={p}
                  selected={selectedProduct?.id === p.id}
                  onSelect={handleSelectProduct}
                  currency={currency}
                />
              ))}
            </div>
          )}
        </div>

        {selectedProduct && (
          <ContentGenerator
            product={selectedProduct}
            onClose={() => handleSelectProduct(selectedProduct)}
            currency={currency}
            audienceContext={audienceContext}
            businessId={user?.businessId}
            onScheduleIdea={(idea) => handleScheduleIdea(idea, selectedProduct)}
          />
        )}
      </div>
    </div>
  );
}
