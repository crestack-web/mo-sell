/**
 * Minimal Groq client backed by fetch.
 *
 * Groq's API is OpenAI-compatible: POST /chat/completions on
 * https://api.groq.com/openai/v1. The dashboard previously imported
 * `Client` from the `xai-sdk` npm package (an empty stub) and used the
 * xAI API; it now talks to Groq, so this module provides the same
 * `Client.chat.completions.create(...)` surface with a real
 * implementation.
 */

const DEFAULT_BASE_URL = 'https://api.groq.com/openai/v1';

export interface ClientOptions {
  apiKey: string;
  baseURL?: string;
}

export interface CompletionParams {
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  max_tokens?: number;
}

export interface CompletionResponse {
  choices: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export interface Chat {
  completions: {
    create(params: CompletionParams): Promise<CompletionResponse>;
  };
}

export class Client {
  chat: Chat;

  private apiKey: string;
  private baseURL: string;

  constructor(options: ClientOptions) {
    if (!options.apiKey) {
      throw new Error('GROQ_API_KEY is required');
    }
    this.apiKey = options.apiKey;
    this.baseURL = (options.baseURL || DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.chat = {
      completions: {
        create: (params) => this.createCompletion(params),
      },
    };
  }

  private async createCompletion(params: CompletionParams): Promise<CompletionResponse> {
    const res = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
        ...(params.max_tokens !== undefined ? { max_tokens: params.max_tokens } : {}),
      }),
    });

    if (!res.ok) {
      let detail = '';
      try {
        const errBody = await res.json();
        detail = errBody?.error?.message || JSON.stringify(errBody);
      } catch {
        detail = await res.text().catch(() => '');
      }

      const status = res.status;
      const suffix = detail ? `: ${detail}` : '';
      const isKeyIssue = /api.?key|authentication|incorrect/i.test(detail);
      if (status === 401 || (status === 400 && isKeyIssue)) {
        throw new Error(`Invalid API_KEY provided to Groq (HTTP ${status})${suffix}`);
      }
      if (status === 403) {
        throw new Error(`Permission denied by Groq (HTTP 403)${suffix}`);
      }
      if (status === 429) {
        throw new Error(`Rate limit or quota exceeded by Groq (HTTP 429)${suffix}`);
      }
      throw new Error(`Groq API error (HTTP ${status})${suffix}`);
    }

    return (await res.json()) as CompletionResponse;
  }
}
