'use client';

import React from 'react';
import { s } from './shared';
import { RecommendationsPanel } from './RecommendationsPanel';

export function TrendsTab() {
  return (
    <div>
      <div style={s.cardHeader}>
        <div>
          <p style={s.cardTitle}>Trending</p>
          <p style={s.cardSub}>Trending topics and formats relevant to your products, recommended by MO</p>
        </div>
      </div>
      <div style={s.cardBody}>
        <RecommendationsPanel
          title="Trending Ideas for Your Store"
          subtitle="MO analyzes your store and best sellers to surface trending formats worth posting now. Ideas load automatically — schedule any of them straight to the calendar."
          autoLoad
        />
      </div>
    </div>
  );
}
