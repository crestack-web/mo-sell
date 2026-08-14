'use client';

import React from 'react';
import { Megaphone, Trash2 } from 'lucide-react';
import { s, Spinner } from './shared';
import { useContentHub } from './ContentHubContext';

export function CampaignsTab() {
  const { selectedProduct, campaigns, campaignLoading, handleLaunchCampaign, handleToggleTask, handleDeleteCampaign } = useContentHub();

  return (
    <div>
      <div style={s.cardHeader}>
        <div>
          <p style={s.cardTitle}>Campaigns</p>
          <p style={s.cardSub}>Launch and manage 7-day content campaigns</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--sell-text-2)' }}>
            {selectedProduct ? `Product: ${selectedProduct.displayName}` : 'Select a product from the Ideas tab first'}
          </span>
          <button style={s.btnPrimary} onClick={handleLaunchCampaign} disabled={!selectedProduct}>
            <Megaphone size={14} />
            Launch 7-Day Campaign
          </button>
        </div>
      </div>
      <div style={s.cardBody}>
        {campaigns.length === 0 && !campaignLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '40px 20px', color: 'var(--sell-text-3)', textAlign: 'center' }}>
            <Megaphone size={40} style={{ opacity: 0.3 }} />
            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--sell-text-2)' }}>No campaigns yet</p>
            <p style={{ fontSize: '0.85rem', maxWidth: 340 }}>Select a product and launch a 7-day campaign to get a structured content plan.</p>
          </div>
        ) : campaignLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, color: 'var(--sell-text-3)', fontSize: '0.85rem', gap: 8 }}>
            <Spinner size={18} />
            Loading campaigns…
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {campaigns.map(campaign => {
              const done = campaign.days.filter(d => d.done).length;
              const total = campaign.days.length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <div key={campaign.id} style={{ border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', background: 'var(--sell-surface-2)', borderBottom: '1px solid var(--sell-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--sell-text-1)' }}>{campaign.productName}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--sell-text-3)' }}>7-Day Campaign · {done}/{total} tasks done · {pct}%</p>
                      <div style={{ height: 5, borderRadius: 99, background: 'var(--sell-border)', overflow: 'hidden', marginTop: 6, maxWidth: 260 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--sell-green)' : 'var(--sell-primary)', transition: 'width 0.3s ease', borderRadius: 99 }} />
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      style={{ background: 'none', border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', cursor: 'pointer', color: 'var(--sell-text-3)', display: 'flex', padding: '5px 8px', transition: 'color 0.15s, border-color 0.15s' }}
                      title="Delete campaign"
                      aria-label={`Delete campaign for ${campaign.productName}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {campaign.days.map((day, di) => (
                      <label
                        key={di}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px',
                          cursor: 'pointer', fontSize: '0.82rem', color: day.done ? 'var(--sell-text-3)' : 'var(--sell-text-1)',
                          textDecoration: day.done ? 'line-through' : 'none',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={day.done}
                          onChange={() => handleToggleTask(campaign.id, di)}
                          style={{ accentColor: 'var(--sell-green)' }}
                        />
                        <span style={{ fontWeight: 600, minWidth: 30, color: 'var(--sell-text-3)' }}>Day {day.day}</span>
                        <span>{day.task}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
