import { NextRequest, NextResponse } from 'next/server';

const MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-pro'];

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

async function callGemini(apiKey: string, modelName: string, systemPrompt: string, message: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: message }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 8192 },
      }),
    }
  );
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini ${modelName} returned ${res.status}: ${errBody.slice(0, 200)}`);
  }
  const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[]; error?: { message?: string } };
  if (data.error) throw new Error(data.error.message ?? 'Unknown Gemini error');
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty response');
  return text;
}

async function callWithFallback(apiKey: string, systemPrompt: string, message: string): Promise<string> {
  let lastError: unknown = null;
  for (const modelName of MODELS) {
    try { return await callGemini(apiKey, modelName, systemPrompt, message); }
    catch (err) { lastError = err; continue; }
  }
  throw lastError;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productName, brief, deliverables } = body as { productName?: string; brief?: string; deliverables?: string };

    if (!productName || !brief) {
      return NextResponse.json({ error: 'productName and brief are required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey || apiKey === 'your-google-ai-api-key') {
      return NextResponse.json({ error: 'AI service not configured', details: 'GOOGLE_GENAI_API_KEY is missing.' }, { status: 503 });
    }

    const context = [
      `Product: ${productName}`,
      `Brief: ${brief}`,
      deliverables ? `Deliverables: ${deliverables}` : null,
    ].filter(Boolean).join('\n');

    const raw = await callWithFallback(apiKey, UGC_IDEAS_SYSTEM_PROMPT, `Generate UGC video content ideas for this request:\n${context}`);

    const match = raw.match(/```ugc_ideas\n([\s\S]+?)\n```/);
    let ideas: Record<string, unknown> | null = null;
    if (match) { try { ideas = JSON.parse(match[1]); } catch { /* fall through */ } }
    if (!ideas) { try { ideas = JSON.parse(raw); } catch { /* return null */ } }

    return NextResponse.json({ ideas });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isKeyError = msg.includes('API_KEY') || msg.includes('quota') || msg.includes('permission');
    return NextResponse.json(
      { error: isKeyError ? 'AI service configuration error' : 'Failed to generate ideas', details: msg },
      { status: isKeyError ? 503 : 500 }
    );
  }
}
