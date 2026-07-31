export function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

export function getVideoThumbnail(video: { url?: string; thumbnail?: string | null; thumbnailUrl?: string | null }): string | null {
  if (video.thumbnailUrl) return video.thumbnailUrl;
  if (video.thumbnail) return video.thumbnail;
  const id = getYouTubeId(video.url ?? '');
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

export function getVideoEmbedUrl(url: string): string | null {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null;
}

export function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|mov|ogg)(\?|#|$)/i.test(url);
}
