/**
 * Ask MO — Safety & context utilities
 *
 * - Token estimation + history chunking (prevents Groq HTTP 413 "Request too large")
 * - Output sanitizer (never leaks internal context, keys, paths, or schema to the user)
 */

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

export const TOKEN_BUDGET = 8000;
export const LAST_TURNS = 5;

export interface HistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Reduce conversation history so system prompt + history + current message
 * stay under the token budget. Keeps only the last N turns; older turns are
 * dropped (caller may summarize them via Groq before rebuilding the payload).
 */
export function chunkHistory(
  systemPrompt: string,
  history: HistoryTurn[],
  message: string,
): { kept: HistoryTurn[]; dropped: HistoryTurn[] } {
  const total =
    estimateTokens(systemPrompt) +
    history.reduce((s, h) => s + estimateTokens(h.content), 0) +
    estimateTokens(message);

  if (total <= TOKEN_BUDGET) {
    return { kept: history, dropped: [] };
  }

  let kept = history.slice(-LAST_TURNS);
  let dropped = history.slice(0, Math.max(0, history.length - LAST_TURNS));

  const budgetFor = (turns: HistoryTurn[]) =>
    estimateTokens(systemPrompt) +
    turns.reduce((s, h) => s + estimateTokens(h.content), 0) +
    estimateTokens(message);

  // Trim further until it fits (worst case: keep only the current message).
  while (kept.length > 0 && budgetFor(kept) > TOKEN_BUDGET) {
    dropped = [...dropped, kept[0]];
    kept = kept.slice(1);
  }

  return { kept, dropped };
}

const SECRET_PATTERNS: RegExp[] = [
  /\b(sk-[A-Za-z0-9_-]{10,}|gsk_[A-Za-z0-9_-]{10,}|rk_[A-Za-z0-9_-]{10,}|eyJ[A-Za-z0-9_-]{10,}|AIza[A-Za-z0-9_-]{10,}|ghp_[A-Za-z0-9_-]{10,}|xox[baprs]-[A-Za-z0-9-]{10,})\b/g,
  /\b(api[_-]?key|access[_-]?token|client[_-]?secret|private[_-]?key|service[_-]?role[_-]?key|password|authorization|bearer|org_id|organization[_-]?id|secret[_-]?key)\b\s*[:=]\s*"?[A-Za-z0-9._\-/]{8,}"?/gi,
];

/**
 * Strip anything from a model response that must never reach the user:
 * fenced JSON, file paths, credentials/keys, org ids, and leaked DB rows.
 */
export function sanitizeOutput(text: string): string {
  if (!text) return text;

  let out = text;

  // 1. Remove any fenced code blocks (```json, ``` etc.) entirely
  out = out.replace(/```[a-zA-Z0-9]*\s*[\s\S]*?```/g, '');

  // 2. Remove multi-line leaked JSON objects (database rows / internal tooling)
  out = out.replace(/\{\s*[\r\n]+\s*"[^"]+"\s*:[\s\S]*?\n\s*}/g, '[redacted]');

  // 3. Redact secrets & key-value credential lines
  for (const pattern of SECRET_PATTERNS) {
    out = out.replace(pattern, '[REDACTED]');
  }

  // 4. Redact file paths (Windows, POSIX, relative)
  out = out.replace(/\b(?:[A-Za-z]:\\[^\s,;)]*|\/(?:usr|home|etc|opt|var|tmp|app|api|lib|node_modules)\/[^\s,;)]*|\.\.?\/[^\s,;)]*)/g, '[path]');

  // 5. Redact any inline JSON key:value pairs that mention credentials
  out = out.replace(/\{\s*"[^"]*(?:key|token|secret|password|url|path|id)"\s*:\s*"[^"]{6,}"\s*(?:,\s*"[^"]+"\s*:\s*"[^"]*"\s*)*\}/g, '[redacted]');

  // 6. Collapse leftover stray fences and trim
  out = out.replace(/```/g, '').replace(/\n{3,}/g, '\n\n').trim();

  return out;
}
