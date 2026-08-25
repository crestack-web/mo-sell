'use client';

import React, { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { getVideoThumbnail, isDirectVideo, isTikTokUrl } from '@/lib/youtube';

/**
 * Poster image for a portfolio/sample video.
 * Uses stored / YouTube / Cloudinary thumbs immediately; for TikTok, fetches
 * oEmbed poster via /api/video/thumbnail when none is stored.
 */
export function VideoPoster({
  video,
  playIconSize = 18,
}: {
  video: { url?: string; thumbnail?: string | null; thumbnailUrl?: string | null };
  playIconSize?: number;
}) {
  const sync = getVideoThumbnail(video);
  const [thumb, setThumb] = useState<string | null>(sync);
  const [failed, setFailed] = useState(false);
  const url = video.url ?? '';
  const canNative = isDirectVideo(url);

  useEffect(() => {
    setThumb(sync);
    setFailed(false);
    if (sync || !url || !isTikTokUrl(url)) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/video/thumbnail?url=${encodeURIComponent(url)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.thumbnailUrl) setThumb(data.thumbnailUrl);
      } catch {
        /* keep placeholder */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, sync]);

  return (
    <>
      {thumb && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : null}
      {canNative && (!thumb || failed) ? (
        <video
          src={url}
          muted
          playsInline
          preload="metadata"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: thumb && !failed ? 'absolute' : 'relative',
            inset: 0,
          }}
        />
      ) : null}
      {(!thumb || failed) && !canNative ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            opacity: 0.6,
            background: isTikTokUrl(url)
              ? 'linear-gradient(135deg, #111827, #000000)'
              : undefined,
          }}
        >
          {isTikTokUrl(url) ? (
            <svg width={28} height={28} viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
            </svg>
          ) : (
            <Play size={20} color="#6B7280" />
          )}
        </div>
      ) : null}
      <div
        style={{
          position: 'absolute',
          width: Math.round(playIconSize * 2.4),
          height: Math.round(playIconSize * 2.4),
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.3)',
          pointerEvents: 'none',
        }}
      >
        <Play size={playIconSize} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
      </div>
    </>
  );
}
