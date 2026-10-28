'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ThemeTokens } from './tokens';

function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Deterministic bar heights from a seed so the waveform is stable per track. */
function buildBars(count: number, seed: string): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const n = (h % 1000) / 1000;
    // Wave-like envelope: higher in the middle
    const env = 0.35 + 0.65 * Math.sin((i / count) * Math.PI);
    bars.push(0.18 + n * 0.82 * env);
  }
  return bars;
}

export function WaveAudioPlayer({
  src,
  title,
  t,
  accentLabel = 'Preview',
}: {
  src: string;
  title?: string;
  t: ThemeTokens;
  accentLabel?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  const bars = useMemo(() => buildBars(48, src + (title || '')), [src, title]);
  const progress = duration > 0 ? Math.min(1, current / duration) : 0;

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onTime = () => setCurrent(el.currentTime || 0);
    const onMeta = () => {
      setDuration(el.duration || 0);
      setReady(true);
    };
    const onEnded = () => {
      setPlaying(false);
      setCurrent(0);
    };
    const onErr = () => {
      setError(true);
      setPlaying(false);
    };

    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('ended', onEnded);
    el.addEventListener('error', onErr);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('error', onErr);
    };
  }, [src]);

  // Pause when src changes
  useEffect(() => {
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    setReady(false);
    setError(false);
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
  }, [src]);

  const toggle = useCallback(async () => {
    const el = audioRef.current;
    if (!el || error) return;
    if (playing) {
      el.pause();
      setPlaying(false);
      return;
    }
    try {
      await el.play();
      setPlaying(true);
    } catch {
      setError(true);
      setPlaying(false);
    }
  }, [playing, error]);

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const el = audioRef.current;
      const track = trackRef.current;
      if (!el || !track || !duration) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      el.currentTime = ratio * duration;
      setCurrent(ratio * duration);
    },
    [duration],
  );

  return (
    <div
      style={{
        borderRadius: Math.max(t.radius, 14),
        border: `1px solid ${t.border}`,
        background: `linear-gradient(145deg, ${t.surface} 0%, ${t.bg} 120%)`,
        padding: '14px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ambient glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 80% 60% at 10% 0%, ${t.accent}22, transparent 55%)`,
          pointerEvents: 'none',
        }}
      />

      <audio ref={audioRef} src={src} preload="metadata" playsInline />

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Play button */}
        <button
          type="button"
          onClick={toggle}
          disabled={error}
          aria-label={playing ? 'Pause preview' : 'Play preview'}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: 'none',
            flexShrink: 0,
            cursor: error ? 'not-allowed' : 'pointer',
            background: error
              ? t.border
              : `linear-gradient(135deg, ${t.accent} 0%, ${t.accent2} 100%)`,
            color: '#0A0A0F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: playing ? `0 0 0 4px ${t.accent}33` : `0 4px 16px ${t.accent}44`,
            transition: 'box-shadow 0.2s, transform 0.15s',
          }}
        >
          {playing ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}>
              <path d="M8 5.14v13.72a1 1 0 001.5.86l11-6.86a1 1 0 000-1.72l-11-6.86A1 1 0 008 5.14z" />
            </svg>
          )}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: t.accent2,
              }}
            >
              {error ? 'Preview unavailable' : accentLabel}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: t.subtext, fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(current)} / {ready ? formatTime(duration) : '—:——'}
            </span>
          </div>

          {/* Waveform + seek */}
          <div
            ref={trackRef}
            role="slider"
            aria-label="Seek preview"
            aria-valuemin={0}
            aria-valuemax={Math.floor(duration) || 0}
            aria-valuenow={Math.floor(current)}
            tabIndex={0}
            onClick={e => seekFromClientX(e.clientX)}
            onKeyDown={e => {
              const el = audioRef.current;
              if (!el || !duration) return;
              if (e.key === 'ArrowRight') {
                el.currentTime = Math.min(duration, current + 2);
              } else if (e.key === 'ArrowLeft') {
                el.currentTime = Math.max(0, current - 2);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 2,
              height: 40,
              cursor: duration ? 'pointer' : 'default',
              userSelect: 'none',
            }}
          >
            {bars.map((h, i) => {
              const filled = i / bars.length <= progress;
              return (
                <span
                  key={i}
                  style={{
                    flex: 1,
                    height: `${Math.round(h * 100)}%`,
                    minHeight: 4,
                    borderRadius: 2,
                    background: filled
                      ? i % 4 === 0
                        ? t.accent2
                        : t.accent
                      : t.border,
                    opacity: filled ? 1 : 0.55,
                    transition: 'background 0.08s linear',
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {title ? (
        <p
          style={{
            position: 'relative',
            margin: '10px 0 0',
            fontSize: '0.8rem',
            color: t.subtext,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </p>
      ) : null}
    </div>
  );
}
