import type { StorefrontTheme } from '@/types/mo-sell.types';

// ─── Shared product data shape ──────────────────────────────────────────────

export interface ProductCardData {
  id: string;
  displayName: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  category: string;
  available: boolean;
  stock: number;
  productType: 'physical' | 'digital' | 'service';
  description?: string;
  rating?: number;
  reviewCount?: number;
  customerInfoFields?: string[];
}

export interface CollectionData {
  id: string;
  title: string;
  coverImageUrl: string | null;
  description: string;
  productCount?: number;
}

// ─── Theme component interfaces ─────────────────────────────────────────────

export interface ThemeProductCardProps {
  product: ProductCardData;
  storeSlug: string;
  currency: string;
}

export interface ThemeCollectionCardProps {
  collection: CollectionData;
  storeSlug: string;
  index: number;
}

export interface ThemeHeroSocialLinks {
  instagram?: string;
  twitter?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  whatsapp?: string;
}

export interface ThemeHeroProps {
  storeName: string;
  tagline?: string | null;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  ctaLabel?: string;
  ctaUrl?: string;
  backgroundImage?: string | null;
  businessCategory?: string;
  textAlign?: 'left' | 'center' | 'right';
  buttonStyle?: 'pill' | 'square' | 'rounded';
  socialLinks?: ThemeHeroSocialLinks;
  badgeText?: string | null;
  showBadge?: boolean;
  bgColor?: string | null;
  bodyTextColor?: string | null;
}

export interface ThemeSearchBarProps {
  storeSlug: string;
  initialQuery?: string;
  placeholder?: string;
  compact?: boolean;
  autoFocus?: boolean;
}

export interface ThemeCollectionPageProps {
  collection: {
    title: string;
    description?: string;
    coverImageUrl?: string | null;
    productCount?: number;
  };
  products: ProductCardData[];
  storeSlug: string;
  currency: string;
  ProductCard: React.ComponentType<ThemeProductCardProps>;
}

export interface ThemeProductPageProps {
  product: {
    id: string;
    displayName: string;
    description: string;
    price: number;
    compareAtPrice: number | null;
    images: string[];
    category: string;
    stock: number;
    productType: 'physical' | 'digital' | 'service';
    tags: string[];
    deliveryNote: string | null;
    digitalFileUrl: string | null;
    customerInfoFields?: string[];
  };
  storeSlug: string;
  currency: string;
}

export interface ThemeComponents {
  ProductCard: React.ComponentType<ThemeProductCardProps>;
  CollectionCard: React.ComponentType<ThemeCollectionCardProps>;
  Hero: React.ComponentType<ThemeHeroProps>;
  ProductPage: React.ComponentType<ThemeProductPageProps>;
  SearchBar: React.ComponentType<ThemeSearchBarProps>;
  CollectionPage?: React.ComponentType<ThemeCollectionPageProps>;
  cssClass?: string; // Additional CSS class to apply to the page wrapper
}
