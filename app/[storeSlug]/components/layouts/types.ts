'use client';

import type { ProductCardData } from '@/themes/types';

export interface CustomLink {
  id: string;
  label: string;
  url: string;
}

export interface LinkBioConfig {
  avatarUrl: string | null;
  name: string;
  bio: string;
  socials: { platform: string; url: string }[];
  displayType: 'button' | 'callout' | 'minimal';
  backgroundType: 'solid' | 'gradient' | 'image' | 'pattern';
  backgroundValue: string;
  productVisibility: Record<string, boolean>;
  customLinks?: CustomLink[];
  productOrder?: string[];
}

export interface LayoutProps {
  config: {
    storeSlug: string;
    storeName: string;
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    currency: string;
    tagline: string | null;
    contactEmail: string;
    contactPhone: string;
    paystackPublicKey: string;
  };
  bio: {
    avatarUrl: string | null;
    name: string;
    bio: string;
    socials: { platform: string; url: string }[];
    displayType: 'button' | 'callout' | 'minimal';
    backgroundType: 'solid' | 'gradient' | 'image' | 'pattern';
    backgroundValue: string;
    customLinks: CustomLink[];
  };
  visibleProducts: (ProductCardData & { description?: string; digitalFileUrl?: string | null })[];
  isLightBg: boolean;
  textColor: string;
  textColor2: string;
  textColor3: string;
  onProductClick: (product: ProductCardData & { description?: string; digitalFileUrl?: string | null }) => void;
}
