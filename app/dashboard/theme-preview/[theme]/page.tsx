'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { StorefrontCanvas } from '@/components/StorefrontCanvas';
import type { StorefrontTheme, StorefrontProduct, StoreCollection, StoreSection } from '@/types/mo-sell.types';

const VALID_THEMES: StorefrontTheme[] = ['luxe','glow','market','creator','link','pulse','vault','atlas','spark','bazaar'];

export default function ThemePreviewPage() {
  const params = useParams<{ theme: string }>();
  const searchParams = useSearchParams();
  const [data, setData] = useState<{
    products: StorefrontProduct[];
    collections: StoreCollection[];
    sections?: StoreSection[];
  } | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('mobilePreviewData');
      if (raw) {
        const parsed = JSON.parse(raw);
        setData({
          products: parsed.products ?? [],
          collections: parsed.collections ?? [],
          sections: parsed.sections ?? undefined,
        });
      }
    } catch {}
  }, []);

  const theme = (params.theme as StorefrontTheme);
  if (!VALID_THEMES.includes(theme)) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Invalid theme</div>;
  }

  const primary   = searchParams.get('primary')   ?? undefined;
  const secondary = searchParams.get('secondary') ?? undefined;
  const storeName = searchParams.get('storeName') ?? 'Your Store';
  const tagline   = searchParams.get('tagline')   ?? 'Shop our latest collection';

  return (
    <div style={{ width: 375, minHeight: '100vh', overflow: 'hidden' }}>
      <StorefrontCanvas
        theme={theme}
        storeName={storeName}
        tagline={tagline}
        primaryColor={primary}
        secondaryColor={secondary}
        width={375}
        products={data?.products}
        collections={data?.collections}
        sections={data?.sections}
      />
    </div>
  );
}
