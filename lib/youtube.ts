export function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}

/** Cloudinary video delivery URL (res.cloudinary.com/.../video/upload/...). */
export function isCloudinaryVideo(url: string): boolean {
  if (!url) return false;
  return /res\.cloudinary\.com\/[^/]+\/video\/upload\//i.test(url);
}

/**
 * First-frame poster for a Cloudinary video URL.
 * Converts .../video/upload/v123/foo.mp4 → .../video/upload/so_0,f_jpg/v123/foo.jpg
 */
export function getCloudinaryVideoThumbnail(url: string): string | null {
  if (!isCloudinaryVideo(url)) return null;
  try {
    // Insert transformation after /video/upload/
    const withTransform = url.replace(
      /(\/video\/upload\/)/i,
      '$1so_0,f_jpg,q_auto/',
    );
    // Prefer .jpg extension for the poster
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

export function getVideoEmbedUrl(url: string): string | null {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null;
}

/** True if the browser can play the URL with a native <video> element. */
export function isDirectVideo(url: string): boolean {
  if (!url) return false;
  if (/\.(mp4|webm|mov|ogg|m4v)(\?|#|$)/i.test(url)) return true;
  // Cloudinary video delivery is typically progressive MP4 even without extension
  if (isCloudinaryVideo(url)) return true;
  return false;
}
