/**
 * AI orchestrator — the single entry point every MO-sell route uses.
 *
 *   request → classify → select provider chain → execute (with safe retry)
 *            → fallback on failure → log usage → return
 *
 * Providers are swappable (GROQ → MISTRAL → OPENAI) without touching the
 * routes. Groq remains the default when routing is disabled.
 */

import { AI_LIMITS, AI_ROUTING_ENABLED, AI_PROVIDER_OVERRIDE, TASK_MODELS } from './config';
import { getProvider } from './providers';
import { selectProviders } from './router';
import { estimateCost, logUsage, openaiQuotaAvailable } from './usage';
import type {
  GenerateTextRequest,
  GenerateTextResult,
  ProviderId,
  TokenUsage,
} from './types';

const TRANSIENT_ERROR = /timeout|429|rate limit|quota|overloaded|busy|5\d\d|network|try again/i;

export interface RoutingInfo {
  complexity?: string;
  hausa: boolean;
  mixedLanguage: boolean;
  reasons: string[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function lastUserMessage(req: GenerateTextRequest): string {
  for (let i = req.messages.length - 1; i >= 0; i--) {
    if (req.messages[i].role === 'user') return req.messages[i].content;
  }
  return '';
}

async function attemptProvider(
  providerId: ProviderId,
  req: GenerateTextRequest,
): Promise<GenerateTextResult> {
  const provider = getProvider(providerId);
  const taskModel = TASK_MODELS[providerId]?.[req.task];
  return provider.generateText({
    ...req,
    provider: providerId,
    model: req.model || taskModel,
    maxTokens: Math.min(req.maxTokens ?? AI_LIMITS.MAX_OUTPUT_TOKENS_PER_REQUEST, AI_LIMITS.MAX_OUTPUT_TOKENS_PER_REQUEST),
  });
}

/**
 * Run an AI request with deterministic routing + controlled fallback.
 *
 * When AI_ROUTING_ENABLED=false (default) everything goes to Groq, exactly as
 * today. Enabling routing activates the task/complexity-based policy.
 */
export async function runAI(req: GenerateTextRequest): Promise<GenerateTextResult & {
  routing?: RoutingInfo;
}> {
  const userText = lastUserMessage(req);

  // Input budget guard (chars/4 estimate, matches ask-mo-safety).
  const estimatedInput = req.system
    ? Math.ceil((req.system.length + req.messages.reduce((s, m) => s + m.content.length, 0)) / 4)
    : Math.ceil(req.messages.reduce((s, m) => s + m.content.length, 0) / 4);
  if (estimatedInput > AI_LIMITS.MAX_INPUT_TOKENS_PER_REQUEST) {
    throw new Error('Request too large for the AI service. Shorten the message and try again.');
  }

  // ── Provider selection ─────────────────────────────────────────────────
  let candidates: ProviderId[];
  let routingInfo: RoutingInfo | undefined = undefined;

  if (!AI_ROUTING_ENABLED && AI_PROVIDER_OVERRIDE === 'auto') {
    // Legacy behaviour: Groq only.
    candidates = ['groq'];
  } else {
    const decision = selectProviders(req.task, userText);
    candidates = decision.candidates;
    routingInfo = {
      complexity: decision.complexity,
      hausa: decision.isHausa,
      mixedLanguage: decision.isMixedLanguage,
      reasons: decision.reasons,
    };
  }

  // ── OpenAI spend guard (only when OpenAI is the intended provider) ─────
  if (candidates[0] === 'openai') {
    const available = await openaiQuotaAvailable(req.businessId);
    if (!available) {
      // Downgrade safely to the next provider instead of a hard failure.
      const cheaper = candidates.find((p) => p !== 'openai');
      if (!cheaper) {
        throw new Error('Daily OpenAI limit reached. Try again tomorrow.');
      }
      candidates = [cheaper, ...candidates.filter((p) => p !== cheaper && p !== 'openai')];
    }
  }

  // ── Execute with controlled retry + fallback ───────────────────────────
  let lastError: unknown = null;
  let fallbackFrom: ProviderId | undefined;

  for (let i = 0; i < candidates.length; i++) {
    const providerId = candidates[i];
    const isOpenAI = providerId === 'openai';

    try {
      const result = await attemptProvider(providerId, req);

      // Record usage (non-fatal).
      const usage = result.usage;
      void logUsage({
        provider: providerId,
        model: result.model,
        task: req.task,
        businessId: req.businessId,
        inputTokens: usage?.inputTokens ?? 0,
        outputTokens: usage?.outputTokens ?? 0,
        latencyMs: result.latencyMs,
        success: true,
        fallbackFrom,
        estimatedCost: estimateCost(result.model, usage),
      });

      return { ...result, fallbackFrom, routing: routingInfo };
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);

      // Record the failed attempt.
      void logUsage({
        provider: providerId,
        model: getProvider(providerId).defaultModel,
        task: req.task,
        businessId: req.businessId,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: undefined,
        success: false,
        fallbackFrom,
        estimatedCost: 0,
      });

      const retryable = TRANSIENT_ERROR.test(msg);
      const hasNext = i + 1 < candidates.length;

      if (retryable && !isOpenAI) {
        // Cheap providers get ONE safe retry; OpenAI never auto-retries to
        // avoid duplicate charges.
        await sleep(300);
        try {
          const retried = await attemptProvider(providerId, req);
          const usage = retried.usage;
          void logUsage({
            provider: providerId,
            model: retried.model,
            task: req.task,
            businessId: req.businessId,
            inputTokens: usage?.inputTokens ?? 0,
            outputTokens: usage?.outputTokens ?? 0,
            latencyMs: retried.latencyMs,
            success: true,
            fallbackFrom,
            estimatedCost: estimateCost(retried.model, usage),
          });
          return { ...retried, fallbackFrom, routing: routingInfo };
        } catch (retryErr) {
          lastError = retryErr;
        }
      }

      if (hasNext) {
        fallbackFrom = providerId;
        await sleep(150);
        continue;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('AI service failed on all providers');
}

/** Convenience: single-shot completion helper used by the simpler routes. */
export async function runAIOnce(params: {
  task: GenerateTextRequest['task'];
  system?: string;
  user?: string;
  messages?: GenerateTextRequest['messages'];
  temperature?: number;
  maxTokens?: number;
  businessId?: string;
  model?: string;
}): Promise<GenerateTextResult> {
  const messages = params.messages?.length
    ? params.messages
    : [{ role: 'user' as const, content: params.user ?? '' }];
  return runAI({
    task: params.task,
    system: params.system,
    messages,
    temperature: params.temperature,
    maxTokens: params.maxTokens,
    businessId: params.businessId,
    model: params.model,
  });
}
