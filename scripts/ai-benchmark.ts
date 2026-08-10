/**
 * AI provider benchmark — run the same scenarios against every enabled
 * provider and compare latency, token usage, and estimated cost.
 *
 * Usage:
 *   npx tsx scripts/ai-benchmark.ts                 # all providers + scenarios
 *   npx tsx scripts/ai-benchmark.ts --provider groq # only Groq
 *   npx tsx scripts/ai-benchmark.ts --scenario 3    # only scenario index 3
 *
 * Results are NOT written to the `ai_usage` table — this is read-only
 * measurement so the router policy can be tuned before enabling routing.
 */

import { existsSync, readFileSync } from 'node:fs';

// ─── Minimal .env loader (same pattern as apply-migrations.ts) ───────────────

function loadEnvFile(file: string): void {
  if (!existsSync(file)) return;
  const text = readFileSync(file, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const args = process.argv.slice(2);
const providerFilter = (() => {
  const i = args.indexOf('--provider');
  return i >= 0 ? args[i + 1] : undefined;
})();
const scenarioFilter = (() => {
  const i = args.indexOf('--scenario');
  return i >= 0 ? Number(args[i + 1]) : undefined;
})();

interface Scenario {
  name: string;
  task: Parameters<typeof import('../lib/ai/router').selectProviders>[0];
  system?: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  maxTokens?: number;
}

const scenarios: Scenario[] = [
  {
    name: 'support-chat: greeting',
    task: 'support_chat',
    messages: [{ role: 'user', content: 'hi, what can you do?' }],
    maxTokens: 1024,
  },
  {
    name: 'support-chat: how-to',
    task: 'support_chat',
    messages: [{ role: 'user', content: 'how do I change my store name in Busmo?' }],
    maxTokens: 1024,
  },
  {
    name: 'ask-mo: greeting',
    task: 'ask_mo_chat',
    messages: [{ role: 'user', content: 'hello' }],
  },
  {
    name: 'ask-mo: product question',
    task: 'ask_mo_chat',
    messages: [{ role: 'user', content: 'what is a good price for a digital product like an ebook?' }],
  },
  {
    name: 'ask-mo: create ebook',
    task: 'ask_mo_chat',
    messages: [{ role: 'user', content: 'create a product — an ebook about meal prep for busy Nigerians, 6 chapters, price 3000' }],
  },
  {
    name: 'ask-mo: recommend branding',
    task: 'ask_mo_chat',
    messages: [{ role: 'user', content: 'recommend a tagline and brand colors for my fashion store' }],
  },
  {
    name: 'ask-mo: pricing strategy (HIGH)',
    task: 'ask_mo_chat',
    messages: [{ role: 'user', content: 'analyze my pricing strategy for a skincare line and help me decide whether to keep premium pricing or compete on price — weigh the trade-offs' }],
  },
  {
    name: 'ask-mo: Hausa + growth (HIGH)',
    task: 'ask_mo_chat',
    messages: [{ role: 'user', content: 'ina son taimako a kan farashin kayayyakin kasuwanci na, na son ganin yadda zan inganta riba — analyze my pricing and growth plan and tell me what to do' }],
  },
  {
    name: 'content: generate ideas',
    task: 'content_generate_ideas',
    system: 'Generate 5 content ideas for the product. Return JSON.',
    messages: [{ role: 'user', content: 'Product: SheaGlow moisturizer. Category: beauty. Store: Lagos boutique.' }],
    maxTokens: 4096,
  },
  {
    name: 'ugc: video ideas',
    task: 'ugc_content_ideas',
    messages: [{ role: 'user', content: 'Product: meal prep containers. Brief: short TikTok-style UGC videos showing weekly prep.' }],
    maxTokens: 4096,
  },
  {
    name: 'ask-mo: refine content ideas',
    task: 'ask_mo_content_ideas',
    messages: [{ role: 'user', content: 'Product Name: Ankara dress. Description: handmade. Refine the ideas for Instagram.' }],
    maxTokens: 4096,
  },
  {
    name: 'wizard: start store',
    task: 'store_wizard',
    messages: [{ role: 'user', content: 'I sell handmade candles' }],
    maxTokens: 2048,
  },
  {
    name: 'pdf: meal prep ebook (strict JSON)',
    task: 'pdf_ebook',
    system: 'Output ONLY a valid JSON object with keys cover_collage and ebook_recipe_5page.',
    messages: [{ role: 'user', content: 'create a meal prep ebook with 3 recipe pages and images' }],
    maxTokens: 1200,
  },
  {
    name: 'history-summary: compress turns',
    task: 'history_summary',
    system: 'Compress the conversation into 2-3 short sentences. Output only the summary.',
    messages: [
      { role: 'user', content: 'I sell shoes in Abuja.' },
      { role: 'assistant', content: 'Got it — a footwear store in Abuja.' },
      { role: 'user', content: 'I want a store named StepWell with a green theme.' },
    ],
    maxTokens: 200,
  },
  {
    name: 'ask-mo: long catalog context (MEDIUM)',
    task: 'ask_mo_chat',
    messages: [
      {
        role: 'user',
        content:
          'My store sells ankara dresses, beaded sandals, and handbags. I have about 40 products and my best seller is the Ankara summer dress. I want to grow my sales next month by running promotions and improving my product pages.',
      },
    ],
  },
];

interface Row {
  provider: string;
  model: string;
  ok: boolean;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  error?: string;
}

async function main() {
  const { getProvider } = await import('../lib/ai/providers');
  const { selectProviders } = await import('../lib/ai/router');
  const { MODEL_PRICE_PER_1M } = await import('../lib/ai/config');
  const { GROQ_ENABLED, MISTRAL_ENABLED, OPENAI_ENABLED, ANTHROPIC_ENABLED } = await import('../lib/ai/config');

  const enabled: Array<'groq' | 'mistral' | 'openai' | 'anthropic'> = [];
  if (GROQ_ENABLED) enabled.push('groq');
  if (MISTRAL_ENABLED) enabled.push('mistral');
  if (OPENAI_ENABLED) enabled.push('openai');
  if (ANTHROPIC_ENABLED) enabled.push('anthropic');

  if (providerFilter) {
    const only = enabled.filter((p) => p === providerFilter);
    if (only.length === 0) {
      console.error(`Provider "${providerFilter}" is not enabled (or key missing). Enabled: ${enabled.join(', ') || 'none'}`);
      process.exit(1);
    }
  }

  const enabledProviders = providerFilter ? enabled.filter((p) => p === providerFilter) : enabled;
  if (enabledProviders.length === 0) {
    console.error('No providers enabled. Check GROQ_API_KEY / MISTRAL_API_KEY / OPENAI_API_KEY.');
    process.exit(1);
  }

  const rows: Row[] = [];
  const selected = scenarios.filter((_, i) => scenarioFilter === undefined || i === scenarioFilter);

  for (const scenario of selected) {
    const decision = selectProviders(scenario.task, scenario.messages[scenario.messages.length - 1].content);
    console.log(`\n=== ${scenario.name} (task=${scenario.task}) ===`);
    console.log(`    routing: complexity=${decision.complexity} hausa=${decision.isHausa} → ${decision.candidates.join(' > ')}`);

    for (const providerId of enabledProviders) {
      const provider = getProvider(providerId);
      const started = Date.now();
      try {
        const res = await provider.generateText({
          task: scenario.task,
          system: scenario.system,
          messages: scenario.messages as never,
          temperature: 0.3,
          maxTokens: scenario.maxTokens,
        });
        const price = MODEL_PRICE_PER_1M[res.model] ?? { input: 0.5, output: 1.5 };
        const cost =
          ((res.usage?.inputTokens ?? 0) * price.input + (res.usage?.outputTokens ?? 0) * price.output) / 1_000_000;
        const latencyMs = Date.now() - started;
        rows.push({
          provider: providerId,
          model: res.model,
          ok: res.text.trim().length > 0,
          latencyMs,
          inputTokens: res.usage?.inputTokens ?? 0,
          outputTokens: res.usage?.outputTokens ?? 0,
          cost,
        });
        const preview = res.text.replace(/\s+/g, ' ').trim().slice(0, 80);
        console.log(
          `  [${providerId}] ${res.model}  ${latencyMs}ms  ${res.usage?.inputTokens ?? '?'}/${res.usage?.outputTokens ?? '?'} tok  $${cost.toFixed(4)}\n      "${preview}${res.text.length > 80 ? '…' : ''}"`,
        );
      } catch (err) {
        const latencyMs = Date.now() - started;
        const msg = err instanceof Error ? err.message : String(err);
        rows.push({ provider: providerId, model: provider.defaultModel, ok: false, latencyMs, inputTokens: 0, outputTokens: 0, cost: 0, error: msg });
        console.log(`  [${providerId}] FAILED ${latencyMs}ms — ${msg.slice(0, 120)}`);
      }
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log('\n\n===== SUMMARY =====');
  for (const p of enabledProviders) {
    const pRows = rows.filter((r) => r.provider === p);
    if (pRows.length === 0) continue;
    const okRows = pRows.filter((r) => r.ok);
    const avgLatency = okRows.length ? Math.round(okRows.reduce((s, r) => s + r.latencyMs, 0) / okRows.length) : 0;
    const avgTokens = okRows.length
      ? Math.round(okRows.reduce((s, r) => s + r.inputTokens + r.outputTokens, 0) / okRows.length)
      : 0;
    const totalCost = okRows.reduce((s, r) => s + r.cost, 0);
    console.log(
      `  ${p}: ${okRows.length}/${pRows.length} ok | avg ${avgLatency}ms | avg ${avgTokens} tok | est total $${totalCost.toFixed(4)}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
