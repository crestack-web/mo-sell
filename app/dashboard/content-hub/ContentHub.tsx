'use client';

import React from 'react';
import { Lightbulb, Calendar, TrendingUp, Megaphone, BarChart3, Users } from 'lucide-react';
import { ContentHubProvider, useContentHub } from './ContentHubContext';
import { IdeasTab } from './IdeasTab';
import { CalendarTab } from './CalendarTab';
import { TrendsTab } from './TrendsTab';
import { CampaignsTab } from './CampaignsTab';
import { AnalyticsTab } from './AnalyticsTab';
import { UgcTab } from './UgcTab';
import { s } from './shared';

export const dynamic = 'force-dynamic';

const TABS = [
  { id: 'ideas',     label: 'Ideas',     icon: Lightbulb },
  { id: 'calendar',  label: 'Calendar',  icon: Calendar },
  { id: 'trends',    label: 'Trends',    icon: TrendingUp },
  { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'ugc',       label: 'UGC',       icon: Users },
] as const;

type TabId = (typeof TABS)[number]['id'];

function TabHost() {
  const { activeTab, setActiveTab, UGC } = useContentHub();
  const { ugcProfile, setUgcView } = UGC;

  return (
    <div style={s.page}>
      {/* Header */}
      <div>
        <h2 style={s.heading}>Content Hub</h2>
        <p style={s.sub}>Create, schedule, and analyze your content across all platforms</p>
      </div>

      {/* Tabs */}
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
              style={{
                flex: 1, padding: '12px 16px', border: 'none', background: 'none',
                fontSize: '0.82rem', fontWeight: 600,
                color: active ? 'var(--sell-primary)' : 'var(--sell-text-3)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                borderBottom: active ? '2px solid var(--sell-primary)' : '2px solid transparent',
                transition: 'color 0.15s, border-color 0.15s', whiteSpace: 'nowrap',
              }}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'ugc') setUgcView(ugcProfile ? 'dashboard' : 'apply');
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={s.card}>
        {activeTab === 'ideas' && <IdeasTab />}
        {activeTab === 'calendar' && <CalendarTab />}
        {activeTab === 'trends' && <TrendsTab />}
        {activeTab === 'campaigns' && <CampaignsTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'ugc' && <UgcTab />}
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
