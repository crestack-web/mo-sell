import { NextRequest, NextResponse } from 'next/server';
import { xai } from 'xai-sdk';

const MODEL = process.env.AI_MODEL || 'grok-4';

const CONTENT_IDEAS_SYSTEM_PROMPT = `
You are MO — the AI commerce assistant inside Busmo, Africa's business operating system.
You help merchants create compelling marketing content for their products.

For the given product, generate a set of marketing content ideas in JSON format.
Return ONLY valid JSON wrapped in \`\`\`content_ideas\n ... \n\`\`\` — no other text.

The JSON must have this structure:
{
  "socialCaptions": [
    { "platform": "Instagram", "caption": "...", "hashtags": "#tag1 #tag2 #tag3" },
    { "platform": "Twitter/X", "caption": "..." },
    { "platform": "Facebook", "caption": "..." }
  ],
  "adCopy": [
    { "headline": "...", "body": "...", "cta": "..." }
  ],
  "emailMarketing": {
    "subject": "...",
    "previewText": "...",
    "body": "..."
  },
  "seoDescription": "...",
  "shortDescription": "...",
  "keySellingPoints": ["point1", "point2", "point3"],
  "marketingAngle": "..."
}

Guidelines:
- Write for the African market (Nigeria, Ghana, Kenya, South Africa, etc.)
- Use compelling, action-oriented language that drives sales
- Social captions should be 1-3 sentences + hashtags (for Instagram include 5-8 relevant hashtags)
- Ad copy should have a clear hook, benefit, and call-to-action
- The email body should be 3-5 short paragraphs
- SEO description should be 150-160 characters
- Keep everything specific to the actual product data provided — never generic
- If the product has specific features, benefits, or audience, highlight them
- Write in fluent, natural English with occasional Nigerian/West African flavour where appropriate
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product, instruction } = body as {
      product: Record<string, unknown>;
      instruction?: string;
    };

    if (!product?.displayName) {
      return NextResponse.json({ error: 'Product displayName is required' }, { status: 400 });
    }

    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

    const client = new xai.Client({ apiKey });

    const productContext = [
      `Product Name: ${product.displayName}`,
      `Description: ${product.description || 'Not provided'}`,
      `Price: ${product.price ?? 'Not set'}`,
      `Category: ${product.category || 'Not set'}`,
      `Product Type: ${product.productType || 'Not set'}`,
      `Tags: ${(product.tags as string[] || []).join(', ') || 'None'}`,
      product.digitalSubtype ? `Digital Subtype: ${product.digitalSubtype}` : null,
    ].filter(Boolean).join('\n');

    const userMessage = instruction
      ? `PRODUCT DATA:\n${productContext}\n\nREFINEMENT INSTRUCTION:\n${instruction}`
      : `Generate marketing content ideas for this product:\n${productContext}`;

    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: CONTENT_IDEAS_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.8,
      max_tokens: 8192,
    });

    const raw = response.choices[0]?.message?.content || '';

    const match = raw.match(/```content_ideas\n([\s\S]+?)\n```/);
    let contentIdeas: Record<string, unknown> | null = null;

    if (match) {
      try { contentIdeas = JSON.parse(match[1]); }
      catch { /* fall through to re-generation attempt */ }
    }

    if (!contentIdeas) {
      try { contentIdeas = JSON.parse(raw); }
      catch { /* return null */ }
    }

    return NextResponse.json({ contentIdeas, provider: 'grok' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isKeyError = msg.includes('API_KEY') || msg.includes('quota') || msg.includes('permission');
    return NextResponse.json(
      {
        error: isKeyError ? 'AI service configuration error' : 'Failed to generate content ideas',
        details: msg,
      },
      { status: isKeyError ? 503 : 500 }
    );
  }
}
