import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { runAIOnce } from '@/lib/ai';
import { TASK_MAX_OUTPUT_TOKENS } from '@/lib/ai/types';

const WIZARD_SYSTEM_PROMPT = `
You are MO — the AI commerce assistant inside Busmo, Africa's business operating system.
Your job is to help sellers generate product listings for their online store.

WHO YOU ARE:
- A product strategist who has helped hundreds of African sellers launch products
- Direct, warm, specific — never generic or robotic
- You understand the Nigerian/African market deeply — pricing, customer expectations

YOUR TASK:
The seller gives you an instruction and an exact JSON shape to fill. Generate the
product details they asked for and return them ONLY inside that JSON.

RULES:
- Follow the user's instruction exactly. They specify which fields to produce.
- Return ONLY a single valid JSON object — no markdown, no code fences, no
  preamble, no closing remarks, no other text before or after the JSON.
- Never ask clarifying questions. Use sensible, specific defaults based on the
  product name and category.
- Descriptions: 2–3 sentences, customer-facing, compelling, and specific (materials,
  features, who it's for).
- Prices: competitive for the Nigerian/African market, sensible for the product type.
- Category: pick one of Fashion & Clothing, Beauty & Personal Care, Food & Groceries,
  Electronics, Home & Kitchen, Health & Wellness, Sports & Fitness, Art & Crafts,
  Services, Other, digital.
- Tags: 3–5 short, relevant tags.
- If the user included context like an existing product name, keep and build on it.

TONE EXAMPLES:
- {"displayName":"Premium Ribbed Polo","description":"...","price":4500,"category":"Fashion & Clothing","tags":["polo shirt","casual wear","mens fashion"]}
- {"displayName":"Mastering Entrepreneurship","description":"...","price":1500,"category":"digital","tags":["entrepreneurship","business"],"author":"Ada Obi","pageCount":200}
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, businessId, conversationHistory = [] } = body as {
      message: string;
      businessId?: string;
      conversationHistory: { role: 'user' | 'model'; parts: [{ text: string }] }[];
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    let inventoryContext = '';
    if (businessId) {
      try {
        const supabase = getSupabaseServer();
        const { data: rows, error } = await supabase
          .from('storeProducts')
          .select('*')
          .eq('businessId', businessId)
          .eq('available', true)
          .limit(20);
        if (!error && rows && rows.length > 0) {
          const names = rows
            .map((d: any) => (d.displayName ?? d.name ?? '') as string)
            .filter(Boolean)
            .slice(0, 10)
            .join(', ');
          if (names) {
            inventoryContext = `\n\nEXISTING INVENTORY (use for better suggestions): ${names}`;
          }
        }
      } catch { /* non-fatal */ }
    }

    // Convert conversation history to chat format
    const messages = [
      ...conversationHistory.map((h) => ({
        role: (h.role === 'model' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: h.parts[0]?.text || '',
      })),
      { role: 'user' as const, content: message },
    ];

    const result = await runAIOnce({
      task: 'store_wizard',
      system: WIZARD_SYSTEM_PROMPT + inventoryContext,
      messages,
      temperature: 0.8,
      maxTokens: TASK_MAX_OUTPUT_TOKENS.store_wizard,
      businessId,
    });

    const raw = result.text;
    return NextResponse.json({ answer: raw, provider: result.provider });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isKeyError = msg.includes('API_KEY') || msg.includes('quota') || msg.includes('permission');
    return NextResponse.json(
      {
        error: isKeyError ? 'AI service configuration error' : 'Failed to generate response',
        details: msg,
      },
      { status: isKeyError ? 503 : 500 }
    );
  }
}
