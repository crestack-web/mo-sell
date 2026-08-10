/**
 * Deterministic model router (Phase 3–5).
 *
 * Every AI request is classified into a task + complexity + language, then a
 * provider chain is selected from the routing policy in lib/ai/config.ts.
 * Routing is rule-based and explainable — never random.
 */

import {
  AI_PROVIDER_OVERRIDE,
  GROQ_ENABLED,
  MISTRAL_ENABLED,
  OPENAI_ENABLED,
  ANTHROPIC_ENABLED,
  ROUTING_POLICY,
  TASK_PROVIDER_PREFERENCE,
} from './config';
import type { Complexity, ProviderId, TaskType } from './types';

export interface RouterDecision {
  candidates: ProviderId[];
  complexity: Complexity;
  isHausa: boolean;
  isMixedLanguage: boolean;
  reasons: string[];
}

// ─── Language detection (initial heuristic — benchmark before trusting) ──────

const HAUSA_WORDS = [
  'sannu', 'ina kwana', 'yaya', 'wannan', 'wancan', 'gobe', 'jibi', 'kudi',
  'saya', 'siyar', 'kasuwanci', 'farashi', 'kayan', 'littafi', 'samfurin',
  'talla', 'kyauta', 'masu', 'abin', 'komai', 'wani', 'don haka', 'shi ke nan',
  'na son', 'ina so', 'ba na', 'kuma', 'amma', 'idan', 'lokacin', 'bayan',
  'nawa', 'yadda', 'cikin', 'gidan', 'aiki', 'hanya', 'bukata', 'koyarwa',
  'bidiyo', 'daɗi', 'kyau', 'riba', 'asara', 'sabon', 'tsohon', 'mai sayarwa',
];

const ENGLISH_WORDS = [
  'the', 'and', 'for', 'with', 'you', 'your', 'my', 'store', 'product',
  'want', 'make', 'create', 'this', 'that', 'are', 'how', 'what', 'please',
  'help', 'better', 'change',
];

function detectLanguage(message: string): { isHausa: boolean; isMixed: boolean } {
  const lower = ` ${message.toLowerCase()} `;
  const hausaHits = HAUSA_WORDS.filter(
    (w) => lower.includes(` ${w} `) || lower.includes(` ${w}`) || lower.includes(`${w} `),
  ).length;
  const englishHits = ENGLISH_WORDS.filter((w) => new RegExp(`\\b${w}\\b`, 'i').test(message)).length;

  const isHausa = hausaHits >= 2;
  const isMixed = isHausa && englishHits >= 2;

  return { isHausa, isMixed };
}

// ─── Complexity classification (deterministic keyword rules) ─────────────────

const HIGH_PATTERNS = [
  /\b(strateg|business plan|growth plan|market research|market analysis|pricing strateg|break[- ]even|profit margin|competitor|how (do|can|should) i (grow|scale|expand)|optimiz|analyz|compare|long[- ]term|invest|forecast|projection)\b/i,
  /\b(help me decide|not sure what|could go either way|trade[- ]off|what should i do|weigh (the )?options)\b/i,
  /\b(difficult|complex|complicated|multistep|multi[- ]step|deep (dive|reasoning|analysis))\b/i,
];

const MEDIUM_PATTERNS = [
  /\b(create|make|build|generate|write|draft|design|redesign)\b.{0,40}\b(product|ebook|pdf|collection|description|content|storefront|section|theme|marketing|tagline|faq)\b/i,
  /\b(add|update|change|modify)\b.{0,40}\b(section|collection|product|theme|color|storefront|faq|price|name)\b/i,
  /\b(recommend|suggest)\b/i,
  /\b(analy[sz]e|review)\b.{0,40}\b(catalog|store|products|sales|orders)\b/i,
  /\b(ebook|chapters|cover page|pdf)\b/i,
  /\b(rewrite|improve|better|shorten|expand)\b.{0,30}\b(description|copy|title|text)\b/i,
];

const LOW_PATTERNS = [
  /\b(hi|hello|hey|sannu|good (morning|afternoon|evening))\b/i,
  /\b(what can you do|how do i|how to|help me|thanks|thank you|ok|okay)\b/i,
  /\b(what is|what's|how much|how many|tell me about|can you)\b/i,
];

function classifyComplexity(message: string): { complexity: Complexity; reasons: string[] } {
  const reasons: string[] = [];

  for (const p of HIGH_PATTERNS) {
    if (p.test(message)) {
      reasons.push('high-complexity keyword matched');
      return { complexity: 'HIGH', reasons };
    }
  }
  for (const p of MEDIUM_PATTERNS) {
    if (p.test(message)) {
      reasons.push('medium-complexity keyword matched');
      return { complexity: 'MEDIUM', reasons };
    }
  }
  for (const p of LOW_PATTERNS) {
    if (p.test(message)) {
      reasons.push('low-complexity keyword matched');
      return { complexity: 'LOW', reasons };
    }
  }

  // Unmatched: long messages lean MEDIUM, short ones LOW.
  if (message.length >= 120) {
    reasons.push('no keyword match, message length >= 120');
    return { complexity: 'MEDIUM', reasons };
  }
  reasons.push('no keyword match, short message');
  return { complexity: 'LOW', reasons };
}

// ─── Default complexity per fixed task ───────────────────────────────────────

const TASK_COMPLEXITY: Record<TaskType, Complexity> = {
  ask_mo_chat: 'LOW', // overridden per message below
  ask_mo_content_ideas: 'MEDIUM',
  store_wizard: 'MEDIUM',
  support_chat: 'LOW',
  content_generate_ideas: 'MEDIUM',
  ugc_content_ideas: 'MEDIUM',
  pdf_ebook: 'MEDIUM',
  history_summary: 'LOW',
};

function isEnabled(id: ProviderId): boolean {
  switch (id) {
    case 'groq': return GROQ_ENABLED;
    case 'mistral': return MISTRAL_ENABLED;
    case 'openai': return OPENAI_ENABLED;
    case 'anthropic': return ANTHROPIC_ENABLED;
  }
}

function dedupe(ids: ProviderId[]): ProviderId[] {
  return [...new Set(ids)];
}

/**
 * Deterministically pick the provider chain for a request.
 *
 * @param task      fixed per-route task class
 * @param userText  the current user message (for language/complexity)
 */
export function selectProviders(
  task: TaskType,
  userText: string,
): RouterDecision {
  const reasons: string[] = [];

  // Global override — manual provider selection without touching code.
  if (AI_PROVIDER_OVERRIDE !== 'auto') {
    const forced = AI_PROVIDER_OVERRIDE;
    reasons.push(`AI_PROVIDER override -> ${forced}`);
    return {
      candidates: dedupe([forced, ...ROUTING_POLICY.LOW]).filter(isEnabled),
      complexity: TASK_COMPLEXITY[task],
      isHausa: false,
      isMixedLanguage: false,
      reasons,
    };
  }

  const { isHausa, isMixed } = detectLanguage(userText);
  if (isHausa) reasons.push(isMixed ? 'mixed Hausa/English detected' : 'Hausa detected');

  const dynamic = classifyComplexity(userText);
  let complexity: Complexity;
  if (task === 'ask_mo_chat') {
    complexity = dynamic.complexity;
    reasons.push(...dynamic.reasons);
  } else {
    complexity = TASK_COMPLEXITY[task];
    reasons.push(`task ${task} -> ${complexity}`);
  }

  // Task pinned to a specific provider (e.g. PDF ebook stays on Groq).
  const pinned = TASK_PROVIDER_PREFERENCE[task];
  let base = pinned ? [pinned, ...ROUTING_POLICY[complexity]] : ROUTING_POLICY[complexity];

  // Hausa + HIGH → OpenAI first (premium multilingual reasoning, cost-gated).
  if (isHausa && complexity === 'HIGH') {
    base = ['openai', ...base.filter((p) => p !== 'openai')];
    reasons.push('Hausa + HIGH -> OpenAI preferred');
  }

  const candidates = dedupe(base).filter(isEnabled);
  if (candidates.length === 0) {
    // Last-resort fallback: Groq even if its flag is off but key exists.
    candidates.push('groq');
    reasons.push('all providers disabled, forcing groq');
  }

  return {
    candidates,
    complexity,
    isHausa,
    isMixedLanguage: isMixed,
    reasons,
  };
}
