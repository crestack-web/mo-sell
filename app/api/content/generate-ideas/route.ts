import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `You are MO, an AI content strategist for African e-commerce merchants.

You are given a product PLUS a business/audience profile (store name, category, tagline, and the full product catalog). Your ideas must be UNIQUELY tailored to this specific audience — never generic.

Respond with valid JSON only — no markdown, no code fences:

{
  "audienceNote": "one sentence describing who this store's audience is and what kind of content resonates with them",
  "ideas": [
    {
      "hook": "attention-grabbing hook for the post (1 sentence, specific to this product AND this store's audience)",
      "format": "content format (e.g. '15s TikTok/Reel', 'Carousel (5 slides)', 'Story with poll')",
      "cta": "call-to-action (e.g. 'Shop now via link in bio')",
      "platforms": ["tiktok", "ig"],
      "bestDay": "best weekday to post (e.g. 'Saturday')",
      "bestTime": "best time to post in WAT (e.g. '6pm WAT')"
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

Generate exactly 5 ideas, 2 scripts, and 4 tips. Make hooks specific to the product AND the audience — reference the store's niche, price point, audience pain points, and other products in the catalog when relevant. Never use generic placeholders like "[product]" or "[audience]". Suggest realistic best days/times for the Nigerian/African social audience.`;

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const {
      displayName, description, price, category, productType,
      storeName, businessCategory, tagline, storeSlug, productCount, catalogSummary, audienceHint, audienceContext,
    } = body;
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

    const audienceInfo = [
      storeName ? `Store name: ${storeName}` : '',
      storeSlug ? `Store URL: ${storeSlug}` : '',
      businessCategory ? `Business category: ${businessCategory}` : '',
      tagline ? `Tagline: ${tagline}` : '',
      audienceHint ? `Audience/context from user: ${audienceHint}` : '',
      audienceContext ? `Audience & store context: ${audienceContext}` : '',
      productCount ? `Total products in catalog: ${productCount}` : '',
      catalogSummary ? `Other products in catalog: ${catalogSummary}` : '',
    ].filter(Boolean).join('\n');

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\nGenerate content ideas for this product:\n${productInfo}\n\nAudience & store context:\n${audienceInfo || '(none provided — still make reasonable audience assumptions from the product)'}` }] }],
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
