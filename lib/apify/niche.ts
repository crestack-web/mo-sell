/**
 * Map a store's business category + catalog into real social hashtags and
 * search terms for trending-content discovery. Pure helpers — no I/O.
 */

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

/** Collapse a display name into a TikTok-safe tag (letters/digits only). */
function slugify(value: string): string {
  const words = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 3);
  return words.join('');
}

/** Primary niche hashtags for a category label (always includes a fallback). */
export function nicheHashtags(category?: string): string[] {
  const cat = (category || '').toLowerCase();
  let match: string[] | null = null;
  for (const c of AUDIENCE_CATEGORIES) {
    if (c.keywords.some((k) => cat.includes(k))) {
      match = c.keywords;
      break;
    }
  }
  const base = match || ['trending', 'viral', 'fyp'];
  const slug = slugify(cat);
  if (slug && !base.includes(slug)) return [...base.slice(0, 4), slug];
  return base.slice(0, 5);
}

/**
 * Build the Apify TikTok scraper hashtag input for a store.
 * `category` is the business category; `productNames` are catalog items, which
 * get added as product-specific hashtags so trends stay relevant to the store.
 */
export function nicheInput(category?: string, productNames: string[] = []) {
  const hashtags = [...nicheHashtags(category)];
  for (const name of productNames.slice(0, 5)) {
    const tag = slugify(name);
    if (tag && !hashtags.includes(tag)) hashtags.push(tag);
  }
  const searchTerms = [
    category || 'trending',
    ...productNames.slice(0, 3),
  ].filter(Boolean);
  return { hashtags, searchTerms };
}
