import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `You are MO, an AI content strategist for African e-commerce merchants.

Given a product description, generate compelling content marketing ideas tailored to the Nigerian/African market.

Respond with valid JSON only — no markdown, no code fences:

{
  "ideas": [
    {
      "hook": "attention-grabbing hook for the post (1 sentence, make it specific to this product)",
      "format": "content format (e.g. '15s TikTok/Reel', 'Carousel (5 slides)', 'Story with poll')",
      "cta": "call-to-action (e.g. 'Shop now via link in bio')",
      "platforms": ["tiktok", "ig"]
    }
  ],
  "scripts": [
    {
      "text": "full video script with scene directions in [brackets], 20-30 seconds long",
      "caption": "social media caption for the post (2-3 sentences with emojis)",
      "hashtags": ["#hashtag1", "#hashtag2"]
    }
  ],
  "tips": [
    {
      "icon": "emoji relevant to the tip",
      "text": "actionable selling tip specific to this product type"
    }
  ]
}

Generate exactly 5 ideas, 2 scripts, and 4 tips. Make hooks specific to the product — reference its name, category, price point, and target audience. Never use generic placeholders like "[product]" or "[audience]".`;

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { displayName, description, price, category, productType } = body;
    if (!displayName) {
      return NextResponse.json({ error: 'displayName required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const productInfo = [
      `Product: ${displayName}`,
      description ? `Description: ${description}` : '',
      price ? `Price: ${price}` : '',
      category ? `Category: ${category}` : '',
      productType ? `Type: ${productType}` : '',
    ].filter(Boolean).join('\n');

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\nGenerate content ideas for this product:\n${productInfo}` }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 4096 },
    });

    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI response was not valid JSON');
    }

    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json(data);
  } catch (err) {
    console.error('[generate-ideas] Error:', err);
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg || 'Internal server error' }, { status: 500 });
  }
}
