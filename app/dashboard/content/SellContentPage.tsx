'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { Sparkles, Package } from 'lucide-react';
import { initializeFirebase } from '@/lib/firebase';
import { useSell } from '@/context/SellContext';
import { ProductContentCard } from './ProductContentCard';
import { ContentGenerator } from './ContentGenerator';
import styles from './SellContentPage.module.css';

interface Product {
  id: string;
  displayName: string;
  price: number;
  productType: string;
  images: string[];
  category: string;
  description?: string;
  tags?: string[];
}

export function SellContentPage() {
  const { user, storeConfig } = useSell();
  const currency = storeConfig?.currency ?? 'NGN';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const loadProducts = useCallback(async () => {
    if (!user?.businessId) return;
    try {
      const { firestore } = initializeFirebase();
      const snap = await getDocs(
        collection(firestore, 'businesses', user.businessId, 'storeProducts')
      );
      const items = snap.docs.map(d => ({
        id: d.id,
        displayName: d.data().displayName ?? '',
        price: d.data().price ?? 0,
        productType: d.data().productType ?? 'physical',
        images: d.data().images ?? [],
        category: d.data().category ?? '',
        description: d.data().description ?? '',
        tags: d.data().tags ?? [],
      })) as Product[];
      items.sort((a, b) => a.displayName.localeCompare(b.displayName));
      setProducts(items);
    } catch (err) {
      console.error('[SellContentPage] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.businessId]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleSelect = (product: Product) => {
    setSelectedProduct(prev => prev?.id === product.id ? null : product);
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.heading}>Content Hub</h2>
          <p className={styles.sub}>Turn your products into content that sells</p>
        </div>
      </div>

      {/* Product Gallery */}
      <div className={styles.gallerySection}>
        <span className={styles.galleryLabel}>
          {products.length > 0 ? `Your Products (${products.length})` : 'Products'}
        </span>

        {loading ? (
          <div className={styles.productGrid}>
            {[1, 2, 3].map(i => (
              <div key={i} className={styles.card} style={{ opacity: 0.5, pointerEvents: 'none' }}>
                <div className={styles.cardImageWrap} />
                <div className={styles.cardBody}>
                  <div className={styles.cardName}>&nbsp;</div>
                  <div className={styles.cardMeta}>&nbsp;</div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className={styles.productGrid}>
            <div className={styles.emptyState}>
              <Package size={48} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>No products yet</p>
              <p className={styles.emptyText}>
                Add your first product to get content ideas, scripts, and selling tips tailored for it.
              </p>
            </div>
          </div>
        ) : (
          <div className={styles.productGrid}>
            {products.map(p => (
              <ProductContentCard
                key={p.id}
                product={p}
                selected={selectedProduct?.id === p.id}
                onSelect={handleSelect}
                currency={currency}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content Generator Panel */}
      {selectedProduct && (
        <ContentGenerator
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          currency={currency}
        />
      )}
    </div>
  );
}
