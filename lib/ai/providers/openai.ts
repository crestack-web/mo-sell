import { AI_CONFIG } from '../config';
import type { AIProvider } from '../types';
import { makeOpenAICompatibleProvider } from './base';

/** OpenAI — premium/deep-reasoning and multilingual fallback provider. */
export const openaiProvider: AIProvider = makeOpenAICompatibleProvider({
  id: 'openai',
  apiKey: AI_CONFIG.openai.apiKey,
  baseURL: AI_CONFIG.openai.baseURL,
  defaultModel: AI_CONFIG.openai.defaultModel,
  capabilities: {
    streaming: true,
    tools: true,
    structuredOutput: true,
  },
});
