/**
 * Extract and parse a fenced action block (store_update, bio_update, etc.).
 * Tolerates common model formatting drift:
 * - optional language tags (```json store_update)
 * - missing/extra newlines around fences
 * - trailing commas in JSON
 * - single quotes (light repair)
 */
export function extractFencedJson(
  text: string,
  blockName: string,
): Record<string, unknown> | null {
  if (!text) return null;
  const patterns = [
    new RegExp('```(?:json\\s+)?' + blockName + '\\s*\\n([\\s\\S]*?)\\n?```', 'i'),
    new RegExp('```(?:json\\s+)?' + blockName + '\\s*([\\s\\S]*?)```', 'i'),
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (!m?.[1]) continue;
    const raw = m[1].trim();
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      try {
        const repaired = raw
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/'/g, '"');
        return JSON.parse(repaired) as Record<string, unknown>;
      } catch (e) {
        console.error(`[AskMo] Failed to parse ${blockName} JSON:`, e, raw.slice(0, 200));
      }
    }
  }
  return null;
}
