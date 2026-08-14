'use client';

import React, { useEffect } from 'react';
import { Sparkles, Target, CalendarClock } from 'lucide-react';
import { s, Spinner, Md } from './shared';
import { useContentHub } from './ContentHubContext';

interface Props {
  title?: string;
  subtitle?: string;
  autoLoad?: boolean;
}

export function RecommendationsPanel({ title = 'MO Recommends for Your Audience', subtitle, autoLoad = false }: Props) {
  const { storeConfig, moRecommendations, recommending, recommendError, handleRecommendForAudience, handleScheduleIdea } = useContentHub();

  useEffect(() => {
    if (autoLoad && !moRecommendations && !recommending && !recommendError) {
      handleRecommendForAudience();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--sell-text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Target size={15} color="var(--sell-accent)" /> {title}
          </p>
          <p style={{ fontSize: '0.72rem', color: 'var(--sell-text-3)', margin: 0, maxWidth: 460 }}>
            {subtitle ?? `Ideas generated for ${storeConfig?.businessCategory || 'your store'} and your best-selling product — schedule them straight to the calendar.`}
          </p>
        </div>
        <button style={s.btnPrimary} onClick={handleRecommendForAudience} disabled={recommending}>
          {recommending ? <Spinner size={13} color="#fff" /> : <Sparkles size={13} />}
          {recommending ? 'MO is thinking…' : (moRecommendations ? 'Regenerate' : 'Generate Recommendations')}
        </button>
      </div>
      {recommendError && (
        <div style={{ border: '1px solid var(--sell-red)', borderRadius: 'var(--sell-radius-sm)', padding: 10, fontSize: '0.78rem', color: 'var(--sell-red)' }}>
          {recommendError}
        </div>
      )}
      {moRecommendations && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {moRecommendations.audienceNote && (
            <div style={{ display: 'flex', gap: 8, background: 'var(--sell-primary-lt)', border: '1px solid var(--sell-primary)', borderRadius: 'var(--sell-radius-sm)', padding: '10px 12px' }}>
              <Sparkles size={15} color="var(--sell-primary)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: '0.78rem', color: 'var(--sell-text-1)' }}><Md text={moRecommendations.audienceNote} /></div>
            </div>
          )}
          {(moRecommendations.ideas || []).map((idea: any, i: number) => (
            <div key={i} style={{ border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', padding: '10px 14px', background: 'var(--sell-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--sell-text-1)', margin: 0 }}>{idea.hook}</p>
                  <p style={{ fontSize: '0.74rem', color: 'var(--sell-text-2)', marginTop: 3, marginBottom: 0 }}>
                    {idea.format}
                    {idea.bestDay && idea.bestTime ? ` · Best: ${idea.bestDay}, ${idea.bestTime}` : ''}
                    {idea.cta ? ` · CTA: ${idea.cta}` : ''}
                  </p>
                </div>
                <button
                  style={{ ...s.btnGhost, flexShrink: 0, fontSize: '0.68rem', padding: '4px 10px' }}
                  onClick={() => handleScheduleIdea(idea)}
                >
                  <CalendarClock size={12} /> Schedule
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
