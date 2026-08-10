import type { AIProvider, ProviderId } from '../types';
import { groqProvider } from './groq';
import { mistralProvider } from './mistral';
import { openaiProvider } from './openai';
import { anthropicProvider } from './anthropic';

const REGISTRY: Record<ProviderId, AIProvider> = {
  groq: groqProvider,
  mistral: mistralProvider,
  openai: openaiProvider,
  anthropic: anthropicProvider,
};

export function getProvider(id: ProviderId): AIProvider {
  return REGISTRY[id];
}

export function getRegisteredProviders(): AIProvider[] {
  return Object.values(REGISTRY);
}

export { groqProvider, mistralProvider, openaiProvider, anthropicProvider };
