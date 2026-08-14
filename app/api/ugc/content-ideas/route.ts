import { NextRequest, NextResponse } from 'next/server';
import { runAIOnce, parseAIJson } from '@/lib/ai';
import { TASK_MAX_OUTPUT_TOKENS } from '@/lib/ai/types';

const UGC_IDEAS_SYSTEM_PROMPT = `
You are MO — an AI assistant that helps UGC creators generate video content ideas from buyer briefs.

Given a buyer's request details (product name, brief, deliverables), generate content ideas for the creator to film.

Return ONLY valid JSON wrapped in \`\`\`ugc_ideas\n ... \n\`\`\` — no other text.

The JSON must have this structure:
{
  "videoHooks": [
    "Hook 1 - grab attention in first 3 seconds",
    "Hook 2 - different angle",
    "Hook 3 - another approach"
  ],
  "contentAngles": [
    { "angle": "Problem/Solution", "description": "Show the problem the product solves", "suggestedScript": "Quick script outline..." },
    { "angle": "Testimonial Style", "description": "Act as a satisfied customer", "suggestedScript": "Quick script outline..." },
    { "angle": "Educational", "description": "Teach something related to the product", "suggestedScript": "Quick script outline..." }
  ],
  "suggestedHashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "visualIdeas": ["Visual concept 1", "Visual concept 2", "Visual concept 3"],
  "callToAction": "Suggested CTA for the video"
}

Guidelines:
- Focus on short-form video content (TikTok, Reels, Shorts)
- Hooks must be punchy and attention-grabbing within 3 seconds
- Content angles should be specific to the product/brand
- Visual ideas should be actionable for a solo creator
- Keep the language natural and engaging
- Write for the African market (Nigeria, Ghana, Kenya, etc.)
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productName, brief, deliverables } = body as { productName?: string; brief?: string; deliverables?: string };

    if (!productName || !brief) {
      return NextResponse.json({ error: 'productName and brief are required' }, { status: 400 });
    }

    const context = [
      `Product: ${productName}`,
      `Brief: ${brief}`,
      deliverables ? `Deliverables: ${deliverables}` : null,
    ].filter(Boolean).join('\n');

    const userMessage = `Generate UGC video content ideas for this request:\n${context}`;

    const result = await runAIOnce({
      task: 'ugc_content_ideas',
      system: UGC_IDEAS_SYSTEM_PROMPT,
      user: userMessage,
      temperature: 0.8,
      maxTokens: TASK_MAX_OUTPUT_TOKENS.ugc_content_ideas,
    });

    const raw = result.text;

    const match = raw.match(/```ugc_ideas\n([\s\S]+?)\n```/);
    let ideas: Record<string, unknown> | null = null;
    if (match) { try { ideas = JSON.parse(match[1]); } catch { /* fall through */ } }
    if (!ideas) { ideas = parseAIJson(raw); }

    return NextResponse.json({ ideas, provider: result.provider });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isKeyError = msg.includes('API_KEY') || msg.includes('quota') || msg.includes('permission');
    return NextResponse.json(
      { error: isKeyError ? 'AI service configuration error' : 'Failed to generate ideas', details: msg },
      { status: isKeyError ? 503 : 500 }
    );
  }
}
