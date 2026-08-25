export function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}

/**
 * Extract TikTok numeric video id from common URL shapes:
 * - https://www.tiktok.com/@user/video/7123456789012345678
 * - https://m.tiktok.com/v/7123456789012345678.html
 * - https://www.tiktok.com/embed/v2/7123456789012345678
 * Short links (vm.tiktok.com / tiktok.com/t/) return null — use blockquote embed instead.
 */
export function getTikTokVideoId(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    if (!host.includes('tiktok.com')) return null;

    // /@user/video/1234567890
    const pathMatch = u.pathname.match(/\/video\/(\d+)/);
    if (pathMatch) return pathMatch[1];

    // /v/1234567890.html
    const vMatch = u.pathname.match(/\/v\/(\d+)/);
    if (vMatch) return vMatch[1];

    // /embed/v2/1234567890 or /player/v1/1234567890
    const embedMatch = u.pathname.match(/\/(?:embed\/v2|player\/v1)\/(\d+)/);
    if (embedMatch) return embedMatch[1];

    return null;
  } catch {
    const loose = url.match(/\/video\/(\d+)/) || url.match(/\/v\/(\d+)/);
    return loose ? loose[1] : null;
  }
}

export function isTikTokUrl(url: string): boolean {
  if (!url) return false;
  try {
    const host = new URL(url.trim()).hostname.replace(/^www\./, '').toLowerCase();
    return host === 'tiktok.com' || host.endsWith('.tiktok.com');
  } catch {
    return /tiktok\.com/i.test(url);
  }
}

/** Cloudinary video delivery URL (res.cloudinary.com/.../video/upload/...). */
export function isCloudinaryVideo(url: string): boolean {
  if (!url) return false;
  return /res\.cloudinary\.com\/[^/]+\/video\/upload\//i.test(url);
}

/**
 * First-frame poster for a Cloudinary video URL.
 * Converts .../video/upload/v123/foo.mp4 → .../video/upload/so_0,f_jpg,q_auto/v123/foo.jpg
 */
export function getCloudinaryVideoThumbnail(url: string): string | null {
  if (!isCloudinaryVideo(url)) return null;
  try {
    const withTransform = url.replace(
      /(\/video\/upload\/)/i,
      '$1so_0,f_jpg,q_auto/',
    );
    return withTransform.replace(/\.(mp4|webm|mov|m3u8|ogg)(\?.*)?$/i, '.jpg$2');
  } catch {
    return null;
  }
}

export function getVideoThumbnail(video: {
  url?: string;
  thumbnail?: string | null;
  thumbnailUrl?: string | null;
}): string | null {
  if (video.thumbnailUrl) return video.thumbnailUrl;
  if (video.thumbnail) return video.thumbnail;
  const url = video.url ?? '';
  const id = getYouTubeId(url);
  if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  const cloudThumb = getCloudinaryVideoThumbnail(url);
  if (cloudThumb) return cloudThumb;
  return null;
}

/**
 * In-page embed URL for YouTube or TikTok (when a numeric video id is available).
 * Returns null for short TikTok links — caller should use TikTok blockquote embed.
 */
export function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null;
  const yt = getYouTubeId(url);
  if (yt) return `https://www.youtube.com/embed/${yt}?autoplay=1&rel=0`;

  const tt = getTikTokVideoId(url);
  if (tt) return `https://www.tiktok.com/embed/v2/${tt}?autoplay=1`;

  return null;
}

/** True if the browser can play the URL with a native <video> element. */
export function isDirectVideo(url: string): boolean {
  if (!url) return false;
  if (/\.(mp4|webm|mov|ogg|m4v)(\?|#|$)/i.test(url)) return true;
  if (isCloudinaryVideo(url)) return true;
  return false;
}

/** Fetch TikTok oEmbed thumbnail (server-side only — TikTok blocks browser CORS). */
export async function fetchTikTokThumbnail(url: string): Promise<string | null> {
  if (!url || !isTikTokUrl(url)) return null;
  try {
    // Prefer a canonical video URL when we already have an id (oEmbed is more reliable)
    let oembedUrl = url.trim();
    const id = getTikTokVideoId(oembedUrl);
    if (id) {
      oembedUrl = `https://www.tiktok.com/video/${id}`;
    }

    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(oembedUrl)}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { thumbnail_url?: string };
    return data.thumbnail_url ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolve a display thumbnail for any supported video URL.
 * Sync sources first; for TikTok falls back to oEmbed (async, server-side).
 */
export async function resolveVideoThumbnail(video: {
  url?: string;
  thumbnail?: string | null;
  thumbnailUrl?: string | null;
}): Promise<string | null> {
  const sync = getVideoThumbnail(video);
  if (sync) return sync;
  const url = video.url ?? '';
  if (isTikTokUrl(url)) return fetchTikTokThumbnail(url);
  return null;
}
