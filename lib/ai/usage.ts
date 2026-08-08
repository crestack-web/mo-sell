/**
 * AI usage observability + OpenAI spending guards (Phases 16–17).
 *
 * Every AI call is recorded to the `ai_usage` table (provider, model, task,
 * businessId, tokens, latency, success, fallback, estimated cost). No prompt
 * content is ever logged. All DB writes are non-fatal so observability can
 * never break a request.
 */

import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { AI_LIMITS, MODEL_PRICE_PER_1M } from './config';
import type { ProviderId, TaskType, TokenUsage } from './types';

export interface UsageEntry {
  provider: ProviderId;
  model: string;
  task: TaskType;
  businessId?: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs?: number;
  success: boolean;
  fallbackFrom?: ProviderId;
  estimatedCost: number;
}

/** Rough $ estimate from token counts + known per-1M prices. */
export function estimateCost(
  model: string,
  usage: TokenUsage | undefined,
): number {
  if (!usage) return 0;
  const price = MODEL_PRICE_PER_1M[model] ?? { input: 0.5, output: 1.5 };
  return (
    (usage.inputTokens * price.input + usage.outputTokens * price.output) / 1_000_000
  );
}

/**
 * Record a request. Never throws — observability must not break the product.
 * The table may not exist yet (migration 015 not applied) → swallowed.
 */
export async function logUsage(entry: UsageEntry): Promise<void> {
  try {
    const supabase = getSupabaseServer();
    await supabase.from('ai_usage').insert({
      provider: entry.provider,
      model: entry.model,
      task: entry.task,
      businessId: entry.businessId ?? null,
      inputTokens: entry.inputTokens,
      outputTokens: entry.outputTokens,
      totalTokens: entry.inputTokens + entry.outputTokens,
      latencyMs: entry.latencyMs ?? null,
      success: entry.success,
      fallbackFrom: entry.fallbackFrom ?? null,
      estimatedCost: entry.estimatedCost,
    });
  } catch {
    // non-fatal
  }
}

/**
 * Pre-request OpenAI guard: reject when the daily request cap for this
 * business has been reached. Counting completed rows is a soft guard —
 * good enough to stop runaway spend.
 */
export async function openaiQuotaAvailable(businessId?: string): Promise<boolean> {
  if (!businessId) return true;
  const max =
    AI_LIMITS.MAX_OPENAI_REQUESTS_PER_BUSINESS_PER_DAY;

  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('ai_usage')
      .select('id')
      .eq('provider', 'openai')
      .eq('businessId', businessId)
      .gte('createdAt', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    if (error) return true; // table missing etc. — fail open
    return (data?.length ?? 0) < max;
  } catch {
    return true;
  }
}
