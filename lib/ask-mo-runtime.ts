import { runAI, runAIOnce } from '@/lib/ai';
import { estimateTokens, chunkHistory } from '@/lib/ask-mo-safety';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { COMPACT_SYSTEM_PROMPT } from '@/lib/ask-mo-system';

interface AttachmentData {
  id: string;
  type: 'image' | 'audio' | 'file';
  name: string;
  data: string;
  mimeType: string;
}

/**
 * Build a compact description of the merchant's CURRENT storefront + link-in-bio
 * so MO is aware of both pages when proposing changes. Returns '' when no
 * config is provided.
 */
export function buildStoreContext(storeConfig: Record<string, unknown> | null | undefined): string {
  if (!storeConfig || typeof storeConfig !== 'object') return '';

  const linkBio = (storeConfig as any).linkBio as Record<string, unknown> | null | undefined;

  const storefrontLines = [
    storeConfig.storeName ? `Store name: ${storeConfig.storeName}` : '',
    storeConfig.storeSlug ? `Store URL: /store/${storeConfig.storeSlug}` : '',
    storeConfig.businessCategory ? `Category: ${storeConfig.businessCategory}` : '',
    storeConfig.tagline ? `Tagline: ${storeConfig.tagline}` : '',
    storeConfig.primaryColor ? `Primary color: ${storeConfig.primaryColor}` : '',
    storeConfig.secondaryColor ? `Secondary color: ${storeConfig.secondaryColor}` : '',
    storeConfig.theme ? `Theme: ${storeConfig.theme}` : '',
    storeConfig.storePolicy ? `Store policy: ${String(storeConfig.storePolicy).slice(0, 120)}` : '',
  ].filter(Boolean);

  const socials = Array.isArray(linkBio?.socials)
    ? (linkBio.socials as any[]).map(s => `${s?.platform} (${s?.url})`).join(', ')
    : '';
  const customLinks = Array.isArray(linkBio?.customLinks)
    ? (linkBio.customLinks as any[]).map(l => `${l?.label}: ${l?.url}`).join(', ')
    : '';

  const bioLines = [
    linkBio?.name ? `Display name: ${linkBio.name}` : '',
    linkBio?.bio ? `Bio: ${String(linkBio.bio).slice(0, 120)}` : '',
    (storeConfig as any).linkBioTheme ? `Link-in-bio theme: ${(storeConfig as any).linkBioTheme}` : '',
    linkBio?.backgroundType ? `Background: ${linkBio.backgroundType}` : '',
    linkBio?.displayType ? `Product display style: ${linkBio.displayType}` : '',
    socials ? `Socials: ${socials}` : '',
    customLinks ? `Custom links: ${customLinks}` : '',
  ].filter(Boolean);

  const blocks: string[] = [];
  if (storefrontLines.length) {
    blocks.push(`CURRENT STOREFRONT:\n${storefrontLines.map(l => `- ${l}`).join('\n')}`);
  }
  if (bioLines.length) {
    blocks.push(`CURRENT LINK IN BIO (page at /${storeConfig.storeSlug ?? '...'}):\n${bioLines.map(l => `- ${l}`).join('\n')}`);
  }

  return blocks.join('\n\n');
}

/**
 * Fetch the merchant's existing products so MO can edit real ones by exact id.
 * Returns a compact list (id, name, price, type, category) or '' when empty.
 */
export async function buildCatalogContext(businessId: string | null | undefined): Promise<string> {
  if (!businessId) return '';
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('storeProducts')
      .select('id, displayName, price, currency, productType, digitalSubtype, category, available')
      .eq('businessId', businessId)
      .order('createdAt', { ascending: false })
      .limit(50);

    if (error || !data || data.length === 0) return '';

    const lines = data.map((p: any) => {
      const price = `${p.price ?? 0} ${p.currency ?? 'NGN'}`;
      const type = p.productType === 'physical' ? 'physical' : p.productType || 'digital';
      const sub = p.digitalSubtype ? ` (${p.digitalSubtype})` : '';
      const hidden = p.available === false ? ' [hidden]' : '';
      return `- id: ${p.id} | ${p.displayName ?? 'Unnamed product'} | ${price} | ${type}${sub} | category: ${p.category ?? 'general'}${hidden}`;
    });

    return `CURRENT PRODUCTS (these are the merchant's existing products — use the exact "id:" when returning edit_product):\n${lines.join('\n')}`;
  } catch (err) {
    console.error('[AskMo] buildCatalogContext error:', err);
    return '';
  }
}

export async function summarizeHistory(
  turns: { role: 'user' | 'assistant'; content: string }[],
): Promise<string> {
  const res = await runAIOnce({
    task: 'history_summary',
    system: 'You compress a conversation into 2-3 short sentences capturing the user\'s goal and facts already established. Output only the summary, no preamble.',
    messages: [
      ...turns,
      { role: 'user', content: 'Summarize the earlier conversation in 2-3 short sentences.' },
    ],
    temperature: 0,
    maxTokens: 200,
  });
  return res.text.trim();
}

export async function callGrok(
  systemPrompt: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  message: string,
  attachments?: AttachmentData[],
  maxTokens = 8192,
): Promise<{ text: string; retried: boolean; provider: string }> {
  const attachmentNote = attachments && attachments.length > 0 ? '\n\nAttachments included in conversation.' : '';

  const buildMessages = (
    hist: { role: 'user' | 'assistant'; content: string }[],
    summary?: string,
  ): { role: 'user' | 'assistant' | 'system'; content: string }[] => [
    ...(summary ? [{ role: 'system' as const, content: `Earlier conversation summary: ${summary}` }] : []),
    ...hist,
    { role: 'user', content: message + attachmentNote },
  ];

  // 1. Token budget enforcement — summarize old turns, keep last 5 + current
  let messages = buildMessages(history);
  const estimated = messages.reduce((s, m) => s + estimateTokens(m.content), 0);

  if (estimated > 8000) {
    const { kept, dropped } = chunkHistory(systemPrompt, history, message + attachmentNote);
    let summary = '';
    if (dropped.length > 0) {
      summary = await summarizeHistory(dropped).catch(() => '');
    }
    messages = buildMessages(kept, summary || undefined);
  }

  let retried = false;
  try {
    const result = await runAI({
      task: 'ask_mo_chat',
      system: systemPrompt,
      messages,
      temperature: 0.35,
      maxTokens,
    });
    const text = result.text;
    if (!text) throw new Error('Grok returned empty response');
    return { text, retried, provider: result.provider };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isTooLarge = /413|too large|request too large|token limit/i.test(msg);

    if (!isTooLarge) throw err;

    // 2. Auto-retry with an aggressively compact prompt on 413
    retried = true;
    console.warn('[AskMo] First attempt failed (request too large), retrying compact:', msg);
    const compact: { role: 'user' | 'assistant' | 'system'; content: string }[] = [
      ...history.slice(-2),
      { role: 'user', content: message.slice(0, 4000) + attachmentNote },
    ];
    const result = await runAI({
      task: 'ask_mo_chat',
      system: COMPACT_SYSTEM_PROMPT,
      messages: compact,
      temperature: 0.35,
      maxTokens: 2048,
    });
    const text = result.text;
    if (!text) throw err;
    return { text, retried, provider: result.provider };
  }
}
