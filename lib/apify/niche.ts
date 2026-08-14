/**
 * Map a store's business category + catalog into real social hashtags,
 * search terms and relevance keywords for trending-content discovery.
 * Pure helpers — no I/O.
 */

export interface NicheProduct {
  name?: string;
  category?: string;
  tags?: string[];
}

const AUDIENCE_CATEGORIES: { category: string; keywords: string[] }[] = [
  { category: 'Fashion & Beauty', keywords: ['fashion', 'style', 'outfit', 'beauty', 'makeup', 'skincare', 'hair', 'nails', 'ootd', 'drip', 'streetwear'] },
  { category: 'Fitness & Health', keywords: ['fitness', 'gym', 'workout', 'health', 'wellness', 'yoga', 'weightloss', 'nutrition', 'homeworkout', 'muscle'] },
  { category: 'Food & Cooking', keywords: ['food', 'recipe', 'cooking', 'bake', 'baking', 'restaurant', 'foodie', 'mealprep', 'tasty', 'chef', 'snack'] },
  { category: 'Tech & Gaming', keywords: ['tech', 'gaming', 'gamer', 'phone', 'pc', 'laptop', 'app', 'startup', 'ai', 'programming', 'android', 'ios', 'fortnite', 'games'] },
  { category: 'Travel & Lifestyle', keywords: ['travel', 'vacation', 'explore', 'adventure', 'lifestyle', 'vlog', 'journey', 'wanderlust', 'relax', 'vibes'] },
  { category: 'Business & Finance', keywords: ['business', 'money', 'finance', 'entrepreneur', 'marketing', 'sales', 'investing', 'makemoney', 'brand', 'sidehustle', 'career'] },
  { category: 'Education & DIY', keywords: ['learn', 'tutorial', 'howto', 'tips', 'diy', 'study', 'science', 'facts', 'school', 'math', 'history', 'knowledge'] },
  { category: 'Comedy & Entertainment', keywords: ['funny', 'comedy', 'memes', 'prank', 'entertainment', 'movie', 'music', 'celebrity', 'drama', 'humor', 'dance', 'sing'] },
  { category: 'Parenting & Family', keywords: ['parenting', 'mom', 'dad', 'kids', 'family', 'baby', 'toddler', 'mum'] },
  { category: 'Pets & Animals', keywords: ['dog', 'cat', 'pets', 'animals', 'puppy', 'kitten', 'pet'] },
];

/** Broad content keywords for the business types actually stored in the app. */
const STORE_TYPE_KEYWORDS: Record<string, string[]> = {
  'physical-products': ['unboxing', 'haul', 'shopping', 'smallbusiness', 'onlineshop', 'products', 'brand', 'restock', 'sale'],
  courses: ['course', 'learning', 'tutorial', 'onlinecourse', 'upskill', 'education', 'study', 'certification', 'masterclass'],
  services: ['service', 'consultation', 'booking', 'expert', 'advice', 'client', 'results', 'transformation', 'coaching'],
  'digital-products': ['template', 'ebook', 'digitalproduct', 'printable', 'notion', 'canva', 'preset', 'download', 'design'],
};

/** Split free text into lowercase alphanumeric tokens. */
function tokens(value: string | null | undefined): string[] {
  return (value || '').toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

/** Match a free-text category to a content niche (keyword or group name substring). */
function matchNiche(text: string): string[] | null {
  const t = (text || '').toLowerCase();
  for (const c of AUDIENCE_CATEGORIES) {
    const groupParts = c.category.toLowerCase().split(' & ');
    if (
      c.keywords.some(k => t.includes(k)) ||
      groupParts.some(part => part.length >= 3 && t.includes(part))
    ) {
      return c.keywords;
    }
  }
  return null;
}

/** Collapse a keyword into a TikTok-safe tag (letters/digits only). */
function toTag(keyword: string): string {
  return keyword.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Build the TikTok hashtags/search terms + a relevance keyword list for a store.
 * `category` is the stored business type (physical-products/courses/services/
 * digital-products); `products` supply the real niche via category + tags.
 */
export function nicheInput(category?: string | null, products: NicheProduct[] = []) {
  const cat = (category || '').toLowerCase();
  const keywords: string[] = [];
  const searchTerms: string[] = [];

  const addKeyword = (kw: string, searchable = false) => {
    const k = kw.toLowerCase();
    if (k.length < 3 || keywords.includes(k)) return;
    keywords.push(k);
    if (searchable) searchTerms.push(kw);
  };

  // 1. Business type → broad content keywords.
  for (const [type, kws] of Object.entries(STORE_TYPE_KEYWORDS)) {
    if (cat.includes(type)) {
      kws.forEach(k => addKeyword(k));
      break;
    }
  }

  // 2. Category free-text (falls back to niche keywords if it reads like one).
  const catNiche = matchNiche(cat);
  if (catNiche) catNiche.forEach(k => addKeyword(k));
  tokens(cat).slice(0, 3).forEach(k => addKeyword(k, true));

  // 3. Products: category + tags are the strongest niche signal.
  for (const p of products.slice(0, 5)) {
    const pNiche = matchNiche(p.category || '');
    if (pNiche) pNiche.forEach(k => addKeyword(k));
    tokens(p.category).slice(0, 4).forEach(k => addKeyword(k, true));
    (p.tags || []).forEach(t => addKeyword(t, true));
    if (p.name) searchTerms.push(p.name);
  }

  // Hashtags = single-token keywords, capped at 10.
  const hashtags: string[] = [];
  for (const kw of keywords) {
    const tag = toTag(kw);
    if (tag.length >= 3 && !hashtags.includes(tag)) hashtags.push(tag);
    if (hashtags.length >= 10) break;
  }

  if (searchTerms.length === 0) searchTerms.push(cat || 'trending');

  return { hashtags, searchTerms, keywords };
}

/** Primary niche hashtags for a category label (kept for tooling/back-compat). */
export function nicheHashtags(category?: string): string[] {
  return nicheInput(category, []).hashtags;
}
