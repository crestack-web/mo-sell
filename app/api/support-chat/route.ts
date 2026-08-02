import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'xai-sdk';

const MODEL = process.env.AI_MODEL || 'grok-4';

const SUPPORT_SYSTEM_PROMPT = `
You are MO — the AI support agent for MO Sell by Busmo, Africa's business operating system.
You help creators and sellers with all MO Sell support activities.

WHAT YOU CAN HELP WITH:
- Store setup and configuration
- Product creation and management (physical, digital, services)
- Payment and Paystack integration
- Theme and design customization
- Shipping and delivery
- Account and billing questions
- General MO Sell features and capabilities
- Troubleshooting common issues

HOW TO RESPOND:
- Be friendly, helpful, and conversational
- Keep responses short and practical (2-4 sentences)
- If you can't solve a problem, suggest contacting the support team on WhatsApp
- Never make up information about pricing or features you're unsure about
- For complex technical issues, recommend WhatsApp support

When the user asks to speak to a human or needs complex help, remind them they can reach the support team on WhatsApp at +234 912 455 9388.
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

    const client = new Client({ apiKey });

    // Convert conversation history to Grok format
    const messages = [
      { role: 'system' as const, content: SUPPORT_SYSTEM_PROMPT },
      ...conversationHistory.map((h: { role: string; parts: { text: string }[] }) => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.parts[0]?.text || '',
      })),
      { role: 'user' as const, content: message },
    ];

    const response = await client.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    });

    const text = response.choices[0]?.message?.content || '';

    return NextResponse.json({ answer: text, provider: 'grok' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[SupportChat] Error:', msg);
    return NextResponse.json(
      { error: 'Failed to generate response', details: msg },
      { status: 500 }
    );
  }
}
