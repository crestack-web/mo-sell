export const SOCIAL_PLATFORMS = ['instagram', 'tiktok', 'twitter', 'youtube', 'whatsapp'] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

const PLATFORM_URLS: Record<string, (handle: string) => string> = {
  instagram: (h) => `https://instagram.com/${h}`,
  twitter:   (h) => `https://twitter.com/${h}`,
  youtube:   (h) => `https://youtube.com/@${h}`,
  tiktok:    (h) => `https://tiktok.com/@${h}`,
  whatsapp:  (h) => `https://wa.me/${h.replace(/\D/g, '')}`,
};

/**
 * Turns a social link value into a full clickable URL.
 *
 * Accepts either a complete link ("https://instagram.com/adaobi") or a bare
 * username/handle ("@adaobi" or "adaobi", a phone number for WhatsApp). Full
 * URLs are returned untouched; anything else is expanded into a platform URL.
 */
export function socialUrl(platform: string, value: string): string {
  const v = (value ?? '').trim();
  if (!v) return '';
  if (/^(https?|mailto):/i.test(v)) return v;
  if (/^[^\s@]+\.[^\s@]+(?:\/.*)?$/.test(v)) return `https://${v}`;
  const handle = v.replace(/^@+/, '').trim();
  const builder = PLATFORM_URLS[platform];
  return handle ? builder(handle) : v;
}
