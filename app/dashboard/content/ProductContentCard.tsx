import React from 'react';
import { Sparkles, Package } from 'lucide-react';
import styles from './SellContentPage.module.css';

interface Product {
  id: string;
  displayName: string;
  price: number;
  productType: string;
  images: string[];
  category: string;
}

interface Props {
  product: Product;
  selected: boolean;
  onSelect: (p: Product) => void;
  currency: string;
}

function fmt(n: number, currency = 'NGN') {
  const s = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
  if (n >= 1_000_000) return `${s}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${s}${(n / 1_000).toFixed(1)}K`;
  return `${s}${n.toLocaleString()}`;
}

function emoji(cat: string) {
  const m: Record<string, string> = {
    fashion: '👗', beauty: '💄', food: '🍔', electronics: '📱',
    home: '🏠', health: '💊', services: '⚙️', digital: '📥',
  };
  return m[cat?.toLowerCase().split(' ')[0]] ?? '📦';
}

export function ProductContentCard({ product, selected, onSelect, currency }: Props) {
  return (
    <div
      className={`${styles.card} ${selected ? styles.cardSelected : ''}`}
      onClick={() => onSelect(product)}
    >
      <div className={styles.cardImageWrap}>
        {product.images[0] ? (
          <img src={product.images[0]} alt={product.displayName} className={styles.cardImage} />
        ) : (
          <span className={styles.cardImagePlaceholder}>{emoji(product.category)}</span>
        )}
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardName}>{product.displayName}</div>
        <div className={styles.cardMeta}>
          <span className={styles.cardPrice}>{fmt(product.price, currency)}</span>
          <span className={styles.cardType}>{product.productType}</span>
        </div>
        <div className={styles.cardAction}>
          <button className={styles.generateBtn} onClick={(e) => { e.stopPropagation(); onSelect(product); }}>
            <Sparkles size={14} />
            Generate Ideas
          </button>
        </div>
      </div>
    </div>
  );
}
