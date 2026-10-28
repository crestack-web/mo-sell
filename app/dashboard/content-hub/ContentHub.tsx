'use client';

import React from 'react';
import { Sparkles, Package, Calendar, TrendingUp, Megaphone, BarChart3 } from 'lucide-react';
import { ContentHubProvider, useContentHub } from './ContentHubContext';
import { StudioTab } from './StudioTab';
import { IdeasTab } from './IdeasTab';
import { CalendarTab } from './CalendarTab';
import { TrendsTab } from './TrendsTab';
import { CampaignsTab } from './CampaignsTab';
import { AnalyticsTab } from './AnalyticsTab';
import { s } from './shared';

export const dynamic = 'force-dynamic';

const TABS = [
  { id: 'studio',    label: 'Studio',    icon: Sparkles },
  { id: 'ideas',     label: 'Products',  icon: Package },
  { id: 'calendar',  label: 'Calendar',  icon: Calendar },
  { id: 'trends',    label: 'Trends',    icon: TrendingUp },
  { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
] as const;

type TabId = (typeof TABS)[number]['id'];

function TabHost() {
  const { activeTab, setActiveTab } = useContentHub();

  return (
    <div style={s.page}>
      <div>
        <h2 style={s.heading}>Content Hub</h2>
        <p style={s.sub}>
          Your content studio for selling online — product ideas, weekly calendar, trends, and campaigns that send people to your store.
        </p>
      </div>

      <div style={{
        display: 'flex', borderBottom: '1px solid var(--sell-border)', background: 'var(--sell-bg)',
        overflowX: 'auto',
      }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              style={{
                flex: 1, padding: '12px 16px', border: 'none', background: 'none',
                fontSize: '0.82rem', fontWeight: 600,
                color: active ? 'var(--sell-primary)' : 'var(--sell-text-3)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                borderBottom: active ? '2px solid var(--sell-primary)' : '2px solid transparent',
                transition: 'color 0.15s, border-color 0.15s', whiteSpace: 'nowrap',
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div style={s.card}>
        {activeTab === 'studio' && <StudioTab />}
        {activeTab === 'ideas' && <IdeasTab />}
        {activeTab === 'calendar' && <CalendarTab />}
        {activeTab === 'trends' && <TrendsTab />}
        {activeTab === 'campaigns' && <CampaignsTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function ContentHub() {
  return (
    <ContentHubProvider>
      <TabHost />
    </ContentHubProvider>
  );
}

export type { TabId };
