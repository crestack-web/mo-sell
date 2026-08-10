/**
 * Minimal OpenAI-compatible chat completions transport shared by all
 * providers (Groq, Mistral, OpenAI). Keeps the error vocabulary the existing
 * routes depend on (API_KEY / quota / permission) so error handling survives
 * the migration untouched.
 */

import type { ChatMessage, TokenUsage } from './types';

const DEFAULT_TIMEOUT_MS = 60000;

export interface ChatCompletionParams {
  baseURL: string;
  apiKey: string;
  providerLabel: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface ChatCompletionResult {
  text: string;
  usage?: TokenUsage;
}

interface RawCompletionResponse {
  choices?: Array<{
    message?: { content?: string | null };
    text?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string };
}

export async function chatCompletion(
  params: ChatCompletionParams,
): Promise<ChatCompletionResult> {
  const {
    baseURL,
    apiKey,
    providerLabel,
    model,
    messages,
    temperature,
    maxTokens,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = params;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${baseURL.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        ...(temperature !== undefined ? { temperature } : {}),
        ...(maxTokens !== undefined ? { max_tokens: maxTokens } : {}),
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error(`${providerLabel} request timed out after ${timeoutMs}ms`);
    }
    throw new Error(`${providerLabel} network error: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    let detail = '';
    try {
      const errBody = (await res.json()) as RawCompletionResponse;
      detail = errBody?.error?.message || JSON.stringify(errBody);
    } catch {
      detail = await res.text().catch(() => '');
    }

    const status = res.status;
    const suffix = detail ? `: ${detail}` : '';
    const isKeyIssue = /api.?key|authentication|incorrect/i.test(detail);
    if (status === 401 || (status === 400 && isKeyIssue)) {
      throw new Error(`Invalid API_KEY provided to ${providerLabel} (HTTP ${status})${suffix}`);
    }
    if (status === 403) {
      throw new Error(`Permission denied by ${providerLabel} (HTTP 403)${suffix}`);
    }
    if (status === 429) {
      throw new Error(`Rate limit or quota exceeded by ${providerLabel} (HTTP 429)${suffix}`);
    }
    throw new Error(`${providerLabel} API error (HTTP ${status})${suffix}`);
  }

  const data = (await res.json()) as RawCompletionResponse;

  const text =
    data.choices?.[0]?.message?.content ?? data.choices?.[0]?.text ?? '';

  let usage: TokenUsage | undefined;
  if (data.usage) {
    const input = data.usage.prompt_tokens ?? 0;
    const output = data.usage.completion_tokens ?? 0;
    usage = {
      inputTokens: input,
      outputTokens: output,
      totalTokens: data.usage.total_tokens ?? input + output,
    };
  }

  return { text, usage };
}

export interface AnthropicMessagesParams {
  baseURL: string;
  apiKey: string;
  model: string;
  system?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

/**
 * Minimal Anthropic Messages API transport (native shape — NOT the OpenAI
 * compatible endpoint). Mirrors the error vocabulary of `chatCompletion` so
 * the retry/fallback logic in runAI keeps working unchanged.
 */
export async function anthropicMessages(
  params: AnthropicMessagesParams,
): Promise<ChatCompletionResult> {
  const {
    baseURL,
    apiKey,
    model,
    system,
    messages,
    temperature,
    maxTokens,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = params;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${baseURL.replace(/\/+$/, '')}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens ?? 4096,
        ...(system ? { system } : {}),
        messages: messages.map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        ...(temperature !== undefined ? { temperature } : {}),
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error('Anthropic request timed out after ' + timeoutMs + 'ms');
    }
    throw new Error(`Anthropic network error: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    let detail = '';
    try {
      const errBody = (await res.json()) as {
        error?: { message?: string };
      };
      detail = errBody?.error?.message || JSON.stringify(errBody);
    } catch {
      detail = await res.text().catch(() => '');
    }

    const status = res.status;
    const suffix = detail ? `: ${detail}` : '';
    const isKeyIssue = /api.?key|authentication|incorrect/i.test(detail);
    if (status === 401 || (status === 400 && isKeyIssue)) {
      throw new Error(`Invalid API_KEY provided to Anthropic (HTTP ${status})${suffix}`);
    }
    if (status === 403) {
      throw new Error(`Permission denied by Anthropic (HTTP 403)${suffix}`);
    }
    if (status === 429 || status === 529) {
      throw new Error(`Rate limit or quota exceeded by Anthropic (HTTP ${status})${suffix}`);
    }
    throw new Error(`Anthropic API error (HTTP ${status})${suffix}`);
  }

  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };

  const text = data.content?.find((c) => c.type === 'text')?.text ?? '';

  let usage: TokenUsage | undefined;
  if (data.usage) {
    const input = data.usage.input_tokens ?? 0;
    const output = data.usage.output_tokens ?? 0;
    usage = {
      inputTokens: input,
      outputTokens: output,
      totalTokens: input + output,
    };
  }

  return { text, usage };
}
