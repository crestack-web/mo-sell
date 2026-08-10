import { AI_CONFIG } from '../config';
import { anthropicMessages } from '../http';
import type { AIProvider, GenerateTextRequest, GenerateTextResult } from '../types';

/** Claude (Anthropic) — premium ebook/PDF generation provider. */
export const anthropicProvider: AIProvider = {
  id: 'anthropic',
  defaultModel: AI_CONFIG.anthropic.defaultModel,
  capabilities: {
    streaming: false,
    tools: false,
    structuredOutput: false,
  },
  async generateText(req: GenerateTextRequest): Promise<GenerateTextResult> {
    const apiKey = AI_CONFIG.anthropic.apiKey;
    if (!apiKey) {
      throw new Error('anthropic provider is not configured (API_KEY missing)');
    }
    const started = Date.now();
    const model = req.model || AI_CONFIG.anthropic.defaultModel;

    // Anthropic has no `system` role inside messages — it lives top-level.
    const systemParts: string[] = [];
    if (req.system) systemParts.push(req.system);
    for (const m of req.messages) {
      if (m.role === 'system') systemParts.push(m.content);
    }
    const messages = req.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const result = await anthropicMessages({
      baseURL: AI_CONFIG.anthropic.baseURL,
      apiKey,
      model,
      system: systemParts.length > 0 ? systemParts.join('\n\n') : undefined,
      messages,
      temperature: req.temperature,
      maxTokens: req.maxTokens,
    });

    return {
      text: result.text,
      model,
      provider: 'anthropic',
      usage: result.usage,
      latencyMs: Date.now() - started,
    };
  },
};
