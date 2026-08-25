'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  getVideoEmbedUrl,
  isDirectVideo,
  isTikTokUrl,
  getTikTokVideoId,
} from '@/lib/youtube';

/**
 * Renders YouTube / TikTok embed or native <video> for direct/Cloudinary URLs.
 * TikTok short links (vm.tiktok.com / tiktok.com/t/) are resolved server-side
 * to a numeric video id, then played via the official embed player.
 */
export function VideoEmbed({
  url,
  style,
}: {
  url: string;
  style?: React.CSSProperties;
}) {
  const boxStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 420,
    aspectRatio: '9 / 16',
    maxHeight: '90dvh',
    background: '#000',
    borderRadius: 16,
    overflow: 'hidden',
    ...style,
  };

  const immediateEmbed = getVideoEmbedUrl(url);
  const needsResolve = !immediateEmbed && isTikTokUrl(url) && !getTikTokVideoId(url);

  const [resolvedEmbed, setResolvedEmbed] = useState<string | null>(null);
  const [resolveFailed, setResolveFailed] = useState(false);
  const [resolving, setResolving] = useState(needsResolve);

  useEffect(() => {
    if (!needsResolve) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/video/resolve?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (cancelled) return;
        if (data?.embedUrl) {
          setResolvedEmbed(data.embedUrl);
        } else {
          setResolveFailed(true);
        }
      } catch {
        if (!cancelled) setResolveFailed(true);
      } finally {
        if (!cancelled) setResolving(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, needsResolve]);

  const embed = immediateEmbed || resolvedEmbed;

  if (resolving) {
    return (
      <div
        style={{
          ...boxStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9CA3AF',
          fontSize: 14,
        }}
      >
        Loading TikTok…
      </div>
    );
  }

  if (embed) {
    return (
      <div style={boxStyle}>
        <iframe
          src={embed}
          title="Video preview"
          style={{ width: '100%', height: '100%', border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  if (isDirectVideo(url)) {
    return (
      <video
        src={url}
        controls
        autoPlay
        playsInline
        preload="auto"
        style={{ ...boxStyle, objectFit: 'contain' }}
      />
    );
  }

  // Last-resort TikTok blockquote (official embed.js) when resolve fails
  if (isTikTokUrl(url) && !resolveFailed) {
    return <TikTokBlockquoteEmbed url={url} style={boxStyle} />;
  }

  if (isTikTokUrl(url)) {
    return <TikTokBlockquoteEmbed url={url} style={boxStyle} />;
  }

  return (
    <div style={{ color: '#FFFFFF', fontSize: 14, textAlign: 'center', padding: 24 }}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#0EA5E9', fontWeight: 600 }}
      >
        Open video
      </a>
    </div>
  );
}

function TikTokBlockquoteEmbed({
  url,
  style,
}: {
  url: string;
  style?: React.CSSProperties;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoId = getTikTokVideoId(url);

  useEffect(() => {
    const existing = document.querySelector('script[data-tiktok-embed]');
    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      if (typeof w.tiktokEmbed?.lib?.render === 'function') {
        try {
          w.tiktokEmbed.lib.render(containerRef.current);
        } catch {
          /* ignore */
        }
      }
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://www.tiktok.com/embed.js';
    script.async = true;
    script.setAttribute('data-tiktok-embed', '1');
    document.body.appendChild(script);
  }, [url]);

  return (
    <div
      ref={containerRef}
      style={{
        ...style,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'auto',
      }}
    >
      <blockquote
        className="tiktok-embed"
        cite={url}
        data-video-id={videoId ?? undefined}
        style={{ maxWidth: 325, minWidth: 280, margin: 0 }}
      >
        <section>
          <a href={url} target="_blank" rel="noopener noreferrer">
            View on TikTok
          </a>
        </section>
      </blockquote>
    </div>
  );
}
