import { AI_CONFIG } from '../config';
import type { AIProvider } from '../types';
import { makeOpenAICompatibleProvider } from './base';

/** Mistral — general-purpose agent provider. */
export const mistralProvider: AIProvider = makeOpenAICompatibleProvider({
  id: 'mistral',
  apiKey: AI_CONFIG.mistral.apiKey,
  baseURL: AI_CONFIG.mistral.baseURL,
  defaultModel: AI_CONFIG.mistral.defaultModel,
  capabilities: {
    streaming: true,
    tools: true,
    structuredOutput: true,
  },
});
