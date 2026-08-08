import { AI_CONFIG } from '../config';
import type { AIProvider } from '../types';
import { makeOpenAICompatibleProvider } from './base';

/** Groq — the existing default/fast provider. */
export const groqProvider: AIProvider = makeOpenAICompatibleProvider({
  id: 'groq',
  apiKey: AI_CONFIG.groq.apiKey,
  baseURL: AI_CONFIG.groq.baseURL,
  defaultModel: AI_CONFIG.groq.defaultModel,
  capabilities: {
    streaming: true,
    tools: true,
    structuredOutput: false,
  },
});
