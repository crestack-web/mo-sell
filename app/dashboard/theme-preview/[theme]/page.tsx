'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { StorefrontCanvas } from '@/components/StorefrontCanvas';
import type { StorefrontTheme, StorefrontProduct, StoreCollection, StoreSection } from '@/types/mo-sell.types';

const VALID_THEMES: StorefrontTheme[] = ['luxe','atelier','citrus','nordly','neotech','terra','volt','botanica','prism','ankara','midnight','harmattan','neon','sunset','mono'];

export default function ThemePreviewPage() {
  const params = useParams<{ theme: string }>();
  const searchParams = useSearchParams();
  const [data, setData] = useState<{
    products: StorefrontProduct[];
    collections: StoreCollection[];
    sections?: StoreSection[];
  } | null>(null);

  useEffect(() => {
    const businessId = searchParams.get('businessId');

    // Try sessionStorage first (set by ThemeEditorPage)
    try {
      const raw = sessionStorage.getItem('mobilePreviewData');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.products?.length || parsed.collections?.length) {
          setData({
            products: parsed.products ?? [],
            collections: parsed.collections ?? [],
            sections: parsed.sections ?? undefined,
          });
          return;
        }
      }
    } catch {}

    // Fallback: fetch from API
    if (businessId) {
      const baseUrl = '';
      Promise.all([
        fetch(`${baseUrl}/api/store/products?businessId=${businessId}&available=true`).then(r => r.ok ? r.json() : { products: [] }),
        fetch(`${baseUrl}/api/store/collections?businessId=${businessId}`).then(r => r.ok ? r.json() : { collections: [] }),
      ]).then(([pData, cData]) => {
        setData({
          products: pData.products ?? [],
          collections: cData.collections ?? [],
        });
      }).catch(() => {});
    }
  }, [searchParams]);

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
