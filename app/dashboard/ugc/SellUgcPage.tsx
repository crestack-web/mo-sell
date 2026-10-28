'use client';

import React, { useEffect } from 'react';
import { ContentHubProvider, useContentHub } from '../content-hub/ContentHubContext';
import { UgcTab } from '../content-hub/UgcTab';
import { s } from '../content-hub/shared';

function UgcBody() {
  const { setActiveTab, UGC } = useContentHub();
  const { ugcProfile, setUgcView } = UGC;

  useEffect(() => {
    setActiveTab('ugc');
    setUgcView(ugcProfile ? 'dashboard' : 'apply');
  }, [setActiveTab, setUgcView, ugcProfile]);

  return (
    <div style={s.page}>
      <div>
        <h2 style={s.heading}>UGC Creator</h2>
        <p style={s.sub}>
          Build your creator profile, win brand briefs, and manage UGC orders — separate from your store content studio.
        </p>
      </div>
      <div style={s.card}>
        <UgcTab />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function SellUgcPage() {
  return (
    <ContentHubProvider>
      <UgcBody />
    </ContentHubProvider>
  );
}
