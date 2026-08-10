import { runAIOnce } from '../lib/ai';
import { selectProviders } from '../lib/ai/router';

async function main() {
  const message = `Generate product details. Write a short, compelling product description (2-3 sentences). Speak directly to the customer. No bullet points.\n\nReturn ONLY a JSON object (no markdown, no code fences, no other text) with these fields:\n{"displayName":"...","description":"2-3 sentence compelling product description","price":number,"category":"one of: Fashion & Clothing, Beauty & Personal Care, Food & Groceries, Electronics, Home & Kitchen, Health & Wellness, Sports & Fitness, Art & Crafts, Services, Other, digital","tags":["tag1","tag2","tag3"]}\n\nContext: New product, no details yet.`;

  const decision = selectProviders('store_wizard', message);
  console.log('candidates:', decision.candidates, 'reasons:', decision.reasons);

  try {
    const res = await runAIOnce({
      task: 'store_wizard',
      system: 'You are MO — the AI commerce architect inside Busmo.',
      user: message,
      temperature: 0.8,
      maxTokens: 2048,
    });
    console.log('OK provider=', res.provider, 'model=', res.model);
    console.log('text head:', res.text.slice(0, 200));
  } catch (err) {
    console.error('FAILED:', err);
  }
}

main();
