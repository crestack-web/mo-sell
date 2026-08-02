/**
 * AI Service using Groq
 * 
 * Provides AI-powered features using Groq's fast inference.
 * Uses llama-3.1-8b-instant model for product descriptions and other AI tasks.
 */

import Groq from 'groq-sdk';

// Initialize Groq client
const groqApiKey = process.env.GROQ_API_KEY;

if (!groqApiKey) {
  console.warn('[AI] GROQ_API_KEY not found in environment variables');
}

export const groq = new Groq({
  apiKey: groqApiKey || 'dummy-key',
});

/**
 * Generate a product description using AI
 * 
 * @param productName - The name of the product
 * @param category - Optional category for better context
 * @param tone - Tone of the description (professional, casual, luxury, etc.)
 * @returns Generated product description
 */
export async function generateProductDescription(
  productName: string,
  category?: string,
  tone: 'professional' | 'casual' | 'luxury' | 'friendly' = 'professional'
): Promise<string> {
  if (!groqApiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  try {
    const toneInstructions = {
      professional: 'Use a professional and polished tone',
      casual: 'Use a casual and friendly tone',
      luxury: 'Use a luxurious and sophisticated tone',
      friendly: 'Use a warm and approachable tone',
    };

    const prompt = `Generate a compelling product description for "${productName}"${category ? ` in the ${category} category` : ''}. 

${toneInstructions[tone]}. 

The description should:
- Be 2-3 sentences long
- Highlight key benefits
- Be engaging and persuasive
- Not use emojis or markdown formatting

Product description:`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 150,
      top_p: 1,
    });

    const description = completion.choices[0]?.message?.content?.trim() || '';
    return description;
  } catch (error) {
    console.error('[AI] Failed to generate product description:', error);
    throw new Error('Failed to generate product description');
  }
}

/**
 * Generate marketing content for a product
 * 
 * @param productName - The name of the product
 * @param contentType - Type of content to generate (headline, tagline, description)
 * @returns Generated marketing content
 */
export async function generateMarketingContent(
  productName: string,
  contentType: 'headline' | 'tagline' | 'description' = 'headline'
): Promise<string> {
  if (!groqApiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  try {
    const instructions = {
      headline: 'Generate a catchy headline (max 10 words)',
      tagline: 'Generate a memorable tagline (max 8 words)',
      description: 'Generate a detailed product description (3-4 sentences)',
    };

    const prompt = `${instructions[contentType]} for the product "${productName}".

Requirements:
- Be creative and engaging
- Focus on benefits
- No emojis or markdown

${contentType === 'description' ? 'Description:' : 'Output:'}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.8,
      max_tokens: contentType === 'description' ? 200 : 50,
      top_p: 1,
    });

    const content = completion.choices[0]?.message?.content?.trim() || '';
    return content;
  } catch (error) {
    console.error('[AI] Failed to generate marketing content:', error);
    throw new Error('Failed to generate marketing content');
  }
}

/**
 * Generate email content for order confirmation
 * 
 * @param customerName - Name of the customer
 * @param orderNumber - Order number
 * @param items - List of items in the order
 * @returns Generated email content
 */
export async function generateOrderConfirmationEmail(
  customerName: string,
  orderNumber: string,
  items: Array<{ name: string; quantity: number }>
): Promise<{ subject: string; body: string }> {
  if (!groqApiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  try {
    const itemsList = items.map(item => `- ${item.name} (x${item.quantity})`).join('\n');

    const prompt = `Generate a professional order confirmation email for ${customerName}.

Order details:
- Order number: ${orderNumber}
- Items:
${itemsList}

Generate:
1. An email subject line (max 8 words)
2. A brief email body (2-3 paragraphs) thanking the customer and confirming the order

Format your response as:
SUBJECT: [subject line]
BODY: [email body]`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 300,
      top_p: 1,
    });

    const response = completion.choices[0]?.message?.content?.trim() || '';
    
    // Parse the response
    const subjectMatch = response.match(/SUBJECT:\s*(.+)/i);
    const bodyMatch = response.match(/BODY:\s*([\s\S]+)/i);

    return {
      subject: subjectMatch?.[1]?.trim() || `Order ${orderNumber} Confirmed`,
      body: bodyMatch?.[1]?.trim() || `Thank you for your order ${orderNumber}!`,
    };
  } catch (error) {
    console.error('[AI] Failed to generate order confirmation email:', error);
    throw new Error('Failed to generate order confirmation email');
  }
}

/**
 * Chat completion with Groq
 * 
 * @param messages - Array of chat messages
 * @param systemPrompt - Optional system prompt
 * @returns AI response
 */
export async function chatCompletion(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  systemPrompt?: string
): Promise<string> {
  if (!groqApiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages,
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 500,
      top_p: 1,
    });

    return completion.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('[AI] Chat completion failed:', error);
    throw new Error('AI chat completion failed');
  }
}