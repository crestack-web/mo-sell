/**
 * AI provider configuration.
 *
 * Everything provider/model related is env-driven — no hard-coded model names
 * in business logic. All keys are server-only; nothing here is exported to
 * client-side code.
 */

import type { ProviderId, TaskType } from './types';

export interface ProviderConfig {
  apiKey?: string;
  defaultModel: string;
  baseURL: string;
}

function pick(...values: Array<string | undefined>): string | undefined {
  return values.find((v) => v && v.trim().length > 0);
}

export const AI_CONFIG: Record<ProviderId, ProviderConfig> = {
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    // GROQ_DEFAULT_MODEL is the new explicit knob; falls back to the legacy
    // AI_MODEL / AI_MODEL_FAST vars so existing deploys keep working.
    defaultModel:
      pick(
        process.env.GROQ_DEFAULT_MODEL,
        process.env.GROQ_FAST_MODEL,
        process.env.AI_MODEL,
        process.env.AI_MODEL_FAST,
      ) || 'llama-3.3-70b-versatile',
    baseURL: 'https://api.groq.com/openai/v1',
  },
  mistral: {
    apiKey: process.env.MISTRAL_API_KEY,
    defaultModel: process.env.MISTRAL_DEFAULT_MODEL || 'open-mistral-nemo',
    baseURL: 'https://api.mistral.ai/v1',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini',
    baseURL: 'https://api.openai.com/v1',
  },
};

/** Master switch. When false (default) every route uses Groq as today. */
export const AI_ROUTING_ENABLED =
  process.env.AI_ROUTING_ENABLED === 'true';

/**
 * Optional global override: 'auto' (router) | 'groq' | 'mistral' | 'openai'.
 * Lets operators force one provider for testing without touching code.
 */
export const AI_PROVIDER_OVERRIDE = (process.env.AI_PROVIDER ||
  'auto') as ProviderId | 'auto';

export const MISTRAL_ENABLED =
  (process.env.MISTRAL_ENABLED ?? 'true') !== 'false' &&
  Boolean(AI_CONFIG.mistral.apiKey);

export const OPENAI_ENABLED =
  (process.env.OPENAI_ENABLED ?? 'true') !== 'false' &&
  Boolean(AI_CONFIG.openai.apiKey);

export const GROQ_ENABLED =
  (process.env.GROQ_ENABLED ?? 'true') !== 'false' &&
  Boolean(AI_CONFIG.groq.apiKey);

// ─── Token & cost guards (Phase 17) ──────────────────────────────────────────

export const AI_LIMITS = {
  /** Per-request caps. */
  MAX_INPUT_TOKENS_PER_REQUEST: Number(
    process.env.MAX_INPUT_TOKENS_PER_REQUEST || 12000,
  ),
  MAX_OUTPUT_TOKENS_PER_REQUEST: Number(
    process.env.MAX_OUTPUT_TOKENS_PER_REQUEST || 8192,
  ),
  /** OpenAI has the strictest limits. */
  MAX_OPENAI_REQUESTS_PER_USER_PER_DAY: Number(
    process.env.MAX_OPENAI_REQUESTS_PER_USER_PER_DAY || 20,
  ),
  MAX_OPENAI_REQUESTS_PER_BUSINESS_PER_DAY: Number(
    process.env.MAX_OPENAI_REQUESTS_PER_BUSINESS_PER_DAY || 40,
  ),
} as const;

/** $ per 1M tokens — used only for estimated-cost reporting. */
export const MODEL_PRICE_PER_1M: Record<string, { input: number; output: number }> = {
  'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
  'llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
  'open-mistral-nemo': { input: 0.15, output: 0.15 },
  'mistral-small-latest': { input: 0.1, output: 0.3 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
};

/** Router policy: preferred provider per complexity (Phase 5). */
export const ROUTING_POLICY: Record<
  'LOW' | 'MEDIUM' | 'HIGH',
  ProviderId[]
> = {
  // LOW: Mistral or Groq (cheap + fast).
  LOW: ['mistral', 'groq'],
  // MEDIUM: Mistral by default.
  MEDIUM: ['mistral', 'groq'],
  // HIGH: OpenAI premium, then Mistral/Groq fallback.
  HIGH: ['openai', 'mistral', 'groq'],
};

/** Tasks that prefer a specific provider regardless of complexity. */
export const TASK_PROVIDER_PREFERENCE: Partial<Record<TaskType, ProviderId>> = {
  // PDF ebook generation is a strict-JSON, token-gated paid feature — keep it
  // on the proven Groq versatile model until benchmarked against others.
  pdf_ebook: 'groq',
  history_summary: 'groq',
};

/**
 * Per-task model overrides per provider. Preserves the existing behaviour
 * where Ask MO chat uses the fast Groq model and PDFs use PDF_MODEL, while
 * keeping model names configurable (never hard-coded in business logic).
 */
export const TASK_MODELS: Partial<Record<ProviderId, Partial<Record<TaskType, string>>>> = {
  groq: {
    ask_mo_chat: pick(process.env.GROQ_FAST_MODEL, process.env.AI_MODEL_FAST) || 'llama-3.1-8b-instant',
    pdf_ebook: process.env.PDF_MODEL || 'llama-3.3-70b-versatile',
  },
};
