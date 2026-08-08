/**
 * Provider-agnostic AI types.
 *
 * MO-sell business logic talks to this interface only. Providers are selected
 * by the model router (lib/ai/router.ts), never hard-coded in a route.
 */

export type ProviderId = 'groq' | 'mistral' | 'openai';

export type Complexity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface GenerateTextRequest {
  /** Optional system instructions (kept separate from messages). */
  system?: string;
  messages: ChatMessage[];
  temperature?: number;
  /** Hard cap on output tokens for this call. */
  maxTokens?: number;
  /** Task classification used by the router for provider selection. */
  task: TaskType;
  /** Context for usage logging / OpenAI spend guards. */
  businessId?: string;
  /** Optional override — bypasses routing (used for manual testing). */
  provider?: ProviderId;
  /** Optional explicit model (operator knob via env, e.g. PDF_MODEL). */
  model?: string;
}

export interface GenerateTextResult {
  text: string;
  model: string;
  provider: ProviderId;
  usage?: TokenUsage;
  latencyMs?: number;
  /** When a fallback provider was used after the primary failed. */
  fallbackFrom?: ProviderId;
}

export interface AIProvider {
  id: ProviderId;
  defaultModel: string;
  /**
   * Explicit capability flags — providers differ, so capabilities are exposed
   * rather than hidden behind a fake abstraction. MO-sell currently only needs
   * text generation, so the rest are declared for future use.
   */
  capabilities: {
    streaming: boolean;
    tools: boolean;
    structuredOutput: boolean;
  };
  generateText(req: GenerateTextRequest): Promise<GenerateTextResult>;
}

/**
 * MO-sell task classes. Each route maps to a task so the router can pick a
 * provider per task + complexity instead of routing on percentages.
 */
export type TaskType =
  | 'ask_mo_chat'
  | 'ask_mo_content_ideas'
  | 'store_wizard'
  | 'support_chat'
  | 'content_generate_ideas'
  | 'ugc_content_ideas'
  | 'pdf_ebook'
  | 'history_summary';

/** Context budgets per task — never send the whole store to the model. */
export const TASK_CONTEXT_BUDGET: Record<TaskType, number> = {
  ask_mo_chat: 6000,
  ask_mo_content_ideas: 4000,
  store_wizard: 4000,
  support_chat: 2000,
  content_generate_ideas: 5000,
  ugc_content_ideas: 3000,
  pdf_ebook: 6000,
  history_summary: 1500,
};

/** Output caps per task — concise by default, larger only when required. */
export const TASK_MAX_OUTPUT_TOKENS: Record<TaskType, number> = {
  ask_mo_chat: 8192,
  ask_mo_content_ideas: 8192,
  store_wizard: 2048,
  support_chat: 1024,
  content_generate_ideas: 4096,
  ugc_content_ideas: 8192,
  pdf_ebook: 1200,
  history_summary: 200,
};
