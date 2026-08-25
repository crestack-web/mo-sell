'use client';

import React, { useState, useMemo } from 'react';
import type { ProductCardData } from '@/themes/types';
import { ProductModal } from './ProductModal';
import { getLinkBioLayout } from './layouts/index';
import type { CustomLink } from './layouts/index';
import { isVerifiedCreator } from '@/lib/verified-creators';

interface LinkBioConfig {
  avatarUrl: string | null;
  name: string;
  bio: string;
  socials: { platform: string; url: string }[];
  displayType: 'button' | 'callout' | 'minimal';
  backgroundType: 'solid' | 'gradient' | 'image' | 'pattern';
  backgroundValue: string;
  productVisibility: Record<string, boolean>;
  productDisplayTypes?: Record<string, 'button' | 'callout' | 'minimal'>;
  customLinks?: CustomLink[];
  productOrder?: string[];
}

interface LinkBioPageProps {
  theme: string;
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
  products: (ProductCardData & { description?: string; digitalFileUrl?: string | null })[];
  linkBio?: LinkBioConfig | null;
}

export function LinkBioPage({ theme, config, products, linkBio }: LinkBioPageProps) {
  const [selectedProduct, setSelectedProduct] = useState<
    (ProductCardData & { description?: string; digitalFileUrl?: string | null }) | null
  >(null);

  const raw = (linkBio ?? {}) as Partial<LinkBioConfig>;
  const bio = {
    avatarUrl: 'avatarUrl' in raw ? raw.avatarUrl : config.logoUrl,
    name: raw.name || config.storeName,
    bio: raw.bio || (config.tagline ?? ''),
    socials: Array.isArray(raw.socials) ? raw.socials : [],
    displayType: raw.displayType || ('button' as const),
    backgroundType: raw.backgroundType || ('solid' as const),
    backgroundValue: raw.backgroundValue || '#0A0A0A',
    productVisibility: raw.productVisibility ?? {},
    productDisplayTypes: raw.productDisplayTypes ?? {},
    customLinks: Array.isArray(raw.customLinks) ? raw.customLinks : [],
    productOrder: Array.isArray(raw.productOrder) ? raw.productOrder : [],
  };

  const displayType = bio.displayType || 'button';
  const bgType = bio.backgroundType || 'solid';
  const bgValue = bio.backgroundValue || '#0A0A0A';
  const LIGHT_BGS = ['#FFFFFF', '#F9FAFB', '#FFF7ED', '#ECFDF5', '#F0F9FF', '#FFC93C', '#EDE7D9'];
  const isLightBg = bgType === 'solid' && LIGHT_BGS.includes(bgValue);
  const textColor = isLightBg ? '#0f172a' : '#fff';
  const textColor2 = isLightBg ? '#64748b' : 'rgba(255,255,255,0.7)';
  const textColor3 = isLightBg ? '#94a3b8' : 'rgba(255,255,255,0.4)';

  const visibleProducts = useMemo(() => {
    const filtered = products.filter(p => bio.productVisibility?.[p.id] !== false);
    if (bio.productOrder && bio.productOrder.length > 0) {
      const ordered = bio.productOrder.map(id => filtered.find(p => p.id === id)).filter(Boolean) as typeof filtered;
      const remaining = filtered.filter(p => !bio.productOrder!.includes(p.id));
      return [...ordered, ...remaining];
    }
    return filtered;
  }, [products, bio.productVisibility, bio.productOrder]);

  // Default solid backgrounds fall back to the theme palette bg so each theme
  // renders with its design look out of the box. Custom backgrounds still win.
  const isDefaultSolid = bgType === 'solid' && (!bgValue || bgValue === '#0A0A0A');
  const bgStyle: React.CSSProperties = bgType === 'image' ? { backgroundColor: '#111' } :
    bgType === 'pattern' ? { backgroundColor: '#111' } :
    isDefaultSolid ? { background: 'var(--sf-bg, #0A0A0A)' } :
    { background: bgValue };

  const Layout = getLinkBioLayout(theme);

  return (
    <>
      <div style={{
        minHeight: '100dvh',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        ...bgStyle,
        position: 'relative', overflow: 'hidden',
      }}>
        {bgType === 'image' && bgValue && (
          <img src={bgValue} alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
          />
        )}
        {bgType === 'pattern' && bgValue && (
          <img src={bgValue} alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15, zIndex: 0 }}
          />
        )}
        <div style={{ position: 'relative', zIndex: 1, width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Layout
            config={config}
            bio={bio}
            visibleProducts={visibleProducts}
            isLightBg={isLightBg}
            textColor={textColor}
            textColor2={textColor2}
            textColor3={textColor3}
            verified={isVerifiedCreator(config.contactEmail)}
            onProductClick={(p) => { window.location.href = `/${config.storeSlug}/product/${p.id}`; }}
          />
        </div>
      </div>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          storeSlug={config.storeSlug}
          currency={config.currency}
          primaryColor={config.primaryColor}
          paystackPublicKey={config.paystackPublicKey}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
}
