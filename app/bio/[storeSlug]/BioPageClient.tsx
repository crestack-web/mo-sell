'use client';

import React from 'react';
import { getThemeCssVars } from '@/components/StorefrontCanvas';
import { LinkBioPage } from '../../[storeSlug]/components/LinkBioPage';

interface BioPageClientProps {
  theme: string;
  primary: string;
  secondary: string;
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
  products: any[];
  linkBio: any;
}

export function BioPageClient({ theme, primary, secondary, config, products, linkBio }: BioPageClientProps) {
  const themeVars = getThemeCssVars(theme as any, primary, secondary);
  return (
    <div style={themeVars as React.CSSProperties}>
      <LinkBioPage
        theme={theme}
        config={config}
        products={products}
        linkBio={linkBio}
      />
    </div>
  );
}
