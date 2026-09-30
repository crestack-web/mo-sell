/**
 * Allowlist of emails and store slugs that receive a purple verified badge on
 * their link-in-bio page (next to the creator name). Expand these lists as more
 * creators are approved.
 */
const VERIFIED_EMAILS = new Set(
  [
    'abdussalammuhammadsani7@gmail.com',
  ].map((e) => e.trim().toLowerCase()),
);

const VERIFIED_SLUGS = new Set(
  [
    'majnun',
  ].map((s) => s.trim().toLowerCase()),
);

export function isVerifiedCreator(
  email?: string | null,
  storeSlug?: string | null,
): boolean {
  if (email && VERIFIED_EMAILS.has(email.trim().toLowerCase())) return true;
  if (storeSlug && VERIFIED_SLUGS.has(storeSlug.trim().toLowerCase())) return true;
  return false;
}
