/**
 * Base provider factory for OpenAI-compatible APIs (Groq, Mistral, OpenAI).
 * Capability differences between providers are declared explicitly.
 */

import { chatCompletion } from '../http';
import type { AIProvider, GenerateTextRequest, GenerateTextResult, ProviderId } from '../types';

interface CompatibleProviderOptions {
  id: ProviderId;
  apiKey?: string;
  baseURL: string;
  defaultModel: string;
  capabilities: AIProvider['capabilities'];
}

export function makeOpenAICompatibleProvider(
  options: CompatibleProviderOptions,
): AIProvider {
  const { id, apiKey, baseURL, defaultModel, capabilities } = options;

  const label = id.charAt(0).toUpperCase() + id.slice(1);

  return {
    id,
    defaultModel,
    capabilities,
    async generateText(req: GenerateTextRequest): Promise<GenerateTextResult> {
      if (!apiKey) {
        throw new Error(`${id} provider is not configured (API_KEY missing)`);
      }
      const started = Date.now();
      const messages = [
        ...(req.system ? [{ role: 'system' as const, content: req.system }] : []),
        ...req.messages,
      ];
      const result = await chatCompletion({
        baseURL,
        apiKey,
        providerLabel: label,
        model: req.model || defaultModel,
        messages,
        temperature: req.temperature,
        maxTokens: req.maxTokens,
      });
      return {
        text: result.text,
        model: req.model || defaultModel,
        provider: id,
        usage: result.usage,
        latencyMs: Date.now() - started,
      };
    },
  };
}
