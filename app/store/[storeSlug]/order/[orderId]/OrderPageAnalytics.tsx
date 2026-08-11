'use client';

import { useEffect } from 'react';

interface OrderPageAnalyticsProps {
  storeSlug: string;
  businessId: string;
}

export default function OrderPageAnalytics({ storeSlug, businessId }: OrderPageAnalyticsProps) {
  useEffect(() => {
    fetch('/api/store/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'page_view',
        storeSlug,
        businessId,
        pageType: 'order_confirmation',
      }),
    }).catch(() => {});
  }, [storeSlug, businessId]);

  return null;
}
