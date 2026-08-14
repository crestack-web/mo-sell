/**
 * Shared Apify runner used by MO-sell routes that scrape social platforms.
 *
 *   run-sync-get-dataset-items → runs the actor and returns dataset rows.
 *
 * The token is server-only (APIFY_KEY / APIFY_TOKEN). Keep actor IDs and
 * timeouts configurable via env so operators can swap actors without code.
 */

const DEFAULT_RUN_TIMEOUT_SEC = 90;

export function apifyToken(): string | null {
  return process.env.APIFY_KEY || process.env.APIFY_TOKEN || null;
}

export async function runApify(
  actor: string,
  input: Record<string, unknown>,
  timeoutSec: number = DEFAULT_RUN_TIMEOUT_SEC,
): Promise<any[]> {
  const token = apifyToken();
  if (!token) throw new Error('Apify token not configured');

  const url = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=${timeoutSec}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), (timeoutSec + 20) * 1000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Apify actor run failed (${res.status}) ${text.slice(0, 200)}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } finally {
    clearTimeout(timer);
  }
}
