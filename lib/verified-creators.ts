/**
 * Allowlist of emails that receive a purple verified badge on their
 * link-in-bio page (next to the creator name). Expand this list as more
 * creators are approved.
 */
const VERIFIED_EMAILS = new Set(
  [
    'abdussalammuhammadsani7@gmail.com',
  ].map((e) => e.trim().toLowerCase()),
);

export function isVerifiedCreator(email?: string | null): boolean {
  if (!email) return false;
  return VERIFIED_EMAILS.has(email.trim().toLowerCase());
}
