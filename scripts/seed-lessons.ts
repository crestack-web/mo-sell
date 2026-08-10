/**
 * Seed MO's Little Lessons
 * 
 * This script populates the mo_lessons table with initial educational content.
 * Run with: npx tsx scripts/seed-lessons.ts
 */

import { getSupabaseServer } from '../lib/database/postgresql-adapter';

const lessons = [
  {
    slug: 'getting-first-sale',
    title: 'Getting your first online sale',
    description: 'How to move from zero to your first paying customer without overthinking it.',
    icon: '💰',
    read_time: '5 min read',
    category: 'sales',
    difficulty: 'beginner',
    featured: true,
    order_index: 1,
    content: {
      sections: [
        {
          type: 'heading',
          level: 2,
          content: 'Start with what you have'
        },
        {
          type: 'paragraph',
          content: 'The biggest mistake new sellers make is waiting until everything is "perfect" before launching. The truth is, your first sale doesn\'t require a perfect website, professional photos, or a huge social media following. It requires one person who wants what you have.'
        },
        {
          type: 'tip',
          content: 'Your first sale is about validation, not perfection. Focus on finding one person willing to pay, then improve from there.'
        },
        {
          type: 'heading',
          level: 2,
          content: 'Tell people what you sell'
        },
        {
          type: 'paragraph',
          content: 'You can\'t make a sale if people don\'t know you exist. Start with your existing network:'
        },
        {
          type: 'list',
          items: [
            'Post on your personal social media accounts',
            'Tell friends and family in person',
            'Share in relevant WhatsApp groups or communities',
            'Send a simple message to past contacts who might be interested'
          ]
        },
        {
          type: 'heading',
          level: 2,
          content: 'Make it easy to buy'
        },
        {
          type: 'paragraph',
          content: 'Remove every possible friction point from the buying process:'
        },
        {
          type: 'list',
          items: [
            'Clear pricing with no hidden fees',
            'Simple payment options (mobile money, bank transfer)',
            'Clear delivery or pickup instructions',
            'Your contact information visible and accessible'
          ]
        },
        {
          type: 'tip',
          content: 'The fewer steps between "I want this" and "I bought this," the more likely you are to make the sale.'
        },
        {
          type: 'heading',
          level: 2,
          content: 'Ask for the sale'
        },
        {
          type: 'paragraph',
          content: 'Sounds obvious, but many new sellers never actually ask people to buy. Be direct and confident:'
        },
        {
          type: 'list',
          items: [
            '"I\'m taking orders this week if you\'re interested."',
            '"Let me know if you\'d like to secure one before they\'re gone."',
            '"I can set one aside for you if you\'d like."'
          ]
        },
        {
          type: 'heading',
          level: 2,
          content: 'Deliver on your promise'
        },
        {
          type: 'paragraph',
          content: 'Your first sale is the beginning of your reputation. Deliver exactly what you promised, when you promised it. A happy first customer becomes your best marketing.'
        }
      ]
    }
  },
  {
    slug: 'pricing-products',
    title: 'Pricing your products right',
    description: 'Strategies for setting prices that feel fair to customers and sustainable for you.',
    icon: '🏷️',
    read_time: '7 min read',
    category: 'business',
    difficulty: 'intermediate',
    featured: true,
    order_index: 2,
    content: {
      sections: [
        {
          type: 'heading',
          level: 2,
          content: 'Know your costs'
        },
        {
          type: 'paragraph',
          content: 'Before setting any price, you need to understand what it costs you to create and deliver your product. Calculate:'
        },
        {
          type: 'list',
          items: [
            'Materials and supplies',
            'Your time (be realistic about this)',
            'Packaging and presentation',
            'Delivery or shipping costs',
            'Platform fees or transaction costs',
            'Marketing and promotion expenses'
          ]
        },
        {
          type: 'tip',
          content: 'Many sellers forget to include their own time in costs. Your labor has value - factor it in from the start.'
        },
        {
          type: 'heading',
          level: 2,
          content: 'Research your market'
        },
        {
          type: 'paragraph',
          content: 'Look at what similar products are selling for. This isn\'t about copying others - it\'s about understanding customer expectations and market positioning.'
        },
        {
          type: 'list',
          items: [
            'Check competitors\' prices',
            'Look at different price tiers in your market',
            'Consider what makes your product unique',
            'Think about who your ideal customer is'
          ]
        },
        {
          type: 'heading',
          level: 2,
          content: 'Choose your pricing strategy'
        },
        {
          type: 'paragraph',
          content: 'There are several common approaches to pricing:'
        },
        {
          type: 'list',
          items: [
            'Cost-plus pricing: Calculate costs, add your desired margin',
            'Competitor-based pricing: Price based on what others charge',
            'Value-based pricing: Price based on the value to the customer',
            'Penetration pricing: Start low to gain market share, then increase'
          ]
        },
        {
          type: 'tip',
          content: 'Value-based pricing often works best for unique products. If your product solves a specific problem or delivers unique value, customers will pay accordingly.'
        },
        {
          type: 'heading',
          level: 2,
          content: 'Test and adjust'
        },
        {
          type: 'paragraph',
          content: 'Your initial price is a hypothesis, not a permanent decision. Pay attention to:'
        },
        {
          type: 'list',
          items: [
            'Customer feedback on pricing',
            'Sales volume at different price points',
            'How quickly products sell',
            'Customer demographics and their price sensitivity'
          ]
        },
        {
          type: 'heading',
          level: 2,
          content: 'Build in room for growth'
        },
        {
          type: 'paragraph',
          content: 'Set prices that allow you to improve and scale. If you\'re barely breaking even, you won\'t be able to invest in better materials, marketing, or business growth.'
        }
      ]
    }
  },
  {
    slug: 'product-photography',
    title: 'Product photography basics',
    description: 'Simple techniques to make your products look professional with just a phone.',
    icon: '📸',
    read_time: '6 min read',
    category: 'marketing',
    difficulty: 'beginner',
    featured: false,
    order_index: 3,
    content: {
      sections: [
        {
          type: 'heading',
          level: 2,
          content: 'Lighting is everything'
        },
        {
          type: 'paragraph',
          content: 'Good lighting is the difference between amateur and professional photos. You don\'t need expensive equipment - natural light is your best friend.'
        },
        {
          type: 'list',
          items: [
            'Shoot near a window during daylight hours',
            'Avoid direct sunlight (it creates harsh shadows)',
            'Use a white reflector (even a piece of paper) to fill shadows',
            'Avoid mixed light sources (don\'t mix window light with indoor lights)'
          ]
        },
        {
          type: 'tip',
          content: 'Overcast days are actually perfect for product photography - the clouds act as a natural diffuser, creating soft, even light.'
        },
        {
          type: 'heading',
          level: 2,
          content: 'Keep it simple'
        },
        {
          type: 'paragraph',
          content: 'Your product should be the star of the photo. Remove distractions and keep backgrounds clean and simple.'
        },
        {
          type: 'list',
          items: [
            'Use a plain background (white, gray, or a complementary color)',
            'Remove clutter from the frame',
            'Focus on the product, not decorative elements',
            'Leave space around the product for text overlays later'
          ]
        },
        {
          type: 'heading',
          level: 2,
          content: 'Show multiple angles'
        },
        {
          type: 'paragraph',
          content: 'Customers want to see what they\'re buying from all sides. Capture:'
        },
        {
          type: 'list',
          items: [
            'Front view (the hero shot)',
            'Side views',
            'Back view (especially important for clothing or wearable items)',
            'Detail shots (texture, special features, labels)',
            'Scale shots (show size relative to everyday objects)'
          ]
        },
        {
          type: 'heading',
          level: 2,
          content: 'Use props strategically'
        },
        {
          type: 'paragraph',
          content: 'Props can help customers understand your product\'s use and scale, but use them sparingly.'
        },
        {
          type: 'list',
          items: [
            'Show lifestyle context (how the product is used)',
            'Include size references (coins, hands, everyday objects)',
            'Add complementary colors but don\'t overwhelm',
            'Keep props relevant to your product\'s purpose'
          ]
        },
        {
          type: 'tip',
          content: 'A good rule of thumb: if you\'re not sure whether a prop helps, leave it out. Simplicity usually wins.'
        },
        {
          type: 'heading',
          level: 2,
          content: 'Edit lightly'
        },
        {
          type: 'paragraph',
          content: 'Basic photo editing can improve your images, but avoid over-processing. Focus on:'
        },
        {
          type: 'list',
          items: [
            'Straightening and cropping',
            'Adjusting brightness and contrast',
            'Correcting color balance',
            'Sharpening slightly',
            'Removing minor blemishes or dust'
          ]
        }
      ]
    }
  },
  {
    slug: 'converting-followers',
    title: 'Converting social followers',
    description: 'Turn your Instagram or TikTok audience into paying customers without being pushy.',
    icon: '📱',
    read_time: '8 min read',
    category: 'marketing',
    difficulty: 'intermediate',
    featured: true,
    order_index: 4,
    content: {
      sections: [
        {
          type: 'heading',
          level: 2,
          content: 'Build trust first'
        },
        {
          type: 'paragraph',
          content: 'People buy from people they trust. Before you can sell to your social media audience, you need to establish credibility and connection.'
        },
        {
          type: 'list',
          items: [
            'Share your story and journey',
            'Show behind-the-scenes of your process',
            'Be consistent in your posting and quality',
            'Engage genuinely with your audience',
            'Demonstrate expertise in your area'
          ]
        },
        {
          type: 'tip',
          content: 'Think of social media as building relationships, not just building an audience. The sale comes after the relationship is established.'
        },
        {
          type: 'heading',
          level: 2,
          content: 'Provide value consistently'
        },
        {
          type: 'paragraph',
          content: 'Your social media content should give value before asking for anything in return. This could be:'
        },
        {
          type: 'list',
          items: [
            'Educational content about your niche',
            'Entertainment that relates to your product',
            'Inspiration and ideas',
            'Solutions to problems your audience faces',
            'Exclusive tips or insights'
          ]
        },
        {
          type: 'heading',
          level: 2,
          content: 'Make the connection clear'
        },
        {
          type: 'paragraph',
          content: 'When you do promote your products, make the connection between your content and what you\'re selling obvious and natural.'
        },
        {
          type: 'list',
          items: [
            'Show how your product solves a problem you\'ve discussed',
            'Demonstrate your product in action',
            'Share customer results and testimonials',
            'Create content that naturally leads to your product',
            'Use storytelling to connect problems to solutions'
          ]
        },
        {
          type: 'heading',
          level: 2,
          content: 'Create urgency without pressure'
        },
        {
          type: 'paragraph',
          content: 'Urgency motivates action, but pressure creates resistance. Find the balance:'
        },
        {
          type: 'list',
          items: [
            'Limited-time offers with clear deadlines',
            'Limited quantity (when genuine)',
            'Special bonuses for early action',
            'Seasonal or timely relevance',
            'Exclusive access for your followers'
          ]
        },
        {
          type: 'tip',
          content: 'The best urgency feels like an opportunity, not a threat. "Get this before it\'s gone" works better than "Buy now or else."'
        },
        {
          type: 'heading',
          level: 2,
          content: 'Make it easy to take action'
        },
        {
          type: 'paragraph',
          content: 'When someone is ready to buy, remove every obstacle:'
        },
        {
          type: 'list',
          items: [
            'Clear calls-to-action in your posts and bio',
            'Direct links to purchase (not "link in bio" when possible)',
            'Multiple purchase options',
            'Simple checkout process',
            'Responsive customer service for questions'
          ]
        },
        {
          type: 'heading',
          level: 2,
          content: 'Nurture after the sale'
        },
        {
          type: 'paragraph',
          content: 'The relationship doesn\'t end at purchase. Continue providing value to turn customers into repeat buyers and advocates.'
        }
      ]
    }
  },
  {
    slug: 'shipping-essentials',
    title: 'Shipping essentials',
    description: 'What you need to know about delivery options, packaging, and customer expectations.',
    icon: '📦',
    read_time: '5 min read',
    category: 'operations',
    difficulty: 'beginner',
    featured: false,
    order_index: 5,
    content: {
      sections: [
        {
          type: 'heading',
          level: 2,
          content: 'Choose the right shipping method'
        },
        {
          type: 'paragraph',
          content: 'Different products and customer needs require different shipping approaches. Consider:'
        },
        {
          type: 'list',
          items: [
            'Product size and weight',
            'Value and fragility of items',
            'Customer location and urgency',
            'Your budget and margin',
            'Available delivery services in your area'
          ]
        },
        {
          type: 'tip',
          content: 'Start simple. You can always expand shipping options as you grow. Many successful sellers start with local delivery or basic courier services.'
        },
        {
          type: 'heading',
          level: 2,
          content: 'Package for protection'
        },
        {
          type: 'paragraph',
          content: 'Your packaging is both protection and branding. Invest in materials that will get your product to the customer safely.'
        },
        {
          type: 'list',
          items: [
            'Use appropriate box sizes (not too big, not too small)',
            'Add cushioning materials (bubble wrap, paper, foam)',
            'Secure items so they don\'t shift during transit',
            'Waterproof outer packaging when needed',
            'Include clear labeling and handling instructions'
          ]
        },
        {
          type: 'heading',
          level: 2,
          content: 'Set clear expectations'
        },
        {
          type: 'paragraph',
          content: 'Communication prevents disappointment and builds trust. Be upfront about:'
        },
        {
          type: 'list',
          items: [
            'Delivery timeframes (and be realistic)',
            'Shipping costs and any additional fees',
            'Tracking availability',
            'What happens if there are delivery issues',
            'Your return or exchange policy'
          ]
        },
        {
          type: 'heading',
          level: 2,
          content: 'Price shipping appropriately'
        },
        {
          type: 'paragraph',
          content: 'Shipping costs can make or break your margins. Calculate carefully:'
        },
        {
          type: 'list',
          items: [
            'Actual carrier costs',
            'Packaging materials',
            'Your time for packing and coordination',
            'Insurance for valuable items',
            'Potential returns or lost shipments'
          ]
        },
        {
          type: 'tip',
          content: 'Consider offering free shipping above a certain order value. This can increase average order size and customer satisfaction.'
        },
        {
          type: 'heading',
          level: 2,
          content: 'Track and communicate'
        },
        {
          type: 'paragraph',
          content: 'Keep customers informed throughout the shipping process:'
        },
        {
          type: 'list',
          items: [
            'Send confirmation when order ships',
            'Provide tracking information when available',
            'Update on any delays or issues',
            'Confirm delivery',
            'Follow up to ensure satisfaction'
          ]
        }
      ]
    }
  },
  {
    slug: 'understanding-analytics',
    title: 'Understanding your analytics',
    description: 'How to read your store data and make decisions that actually grow your business.',
    icon: '📊',
    read_time: '6 min read',
    category: 'business',
    difficulty: 'intermediate',
    featured: false,
    order_index: 6,
    content: {
      sections: [
        {
          type: 'heading',
          level: 2,
          content: 'Focus on metrics that matter'
        },
        {
          type: 'paragraph',
          content: 'Not all data is equally important. Focus on metrics that directly impact your business decisions:'
        },
        {
          type: 'list',
          items: [
            'Revenue and profit (not just sales volume)',
            'Customer acquisition cost',
            'Average order value',
            'Conversion rate',
            'Customer lifetime value',
            'Return customer rate'
          ]
        },
        {
          type: 'tip',
          content: 'Vanity metrics like total followers or page views look good but don\'t necessarily translate to business success. Focus on actionable metrics.'
        },
        {
          type: 'heading',
          level: 2,
          content: 'Track trends over time'
        },
        {
          type: 'paragraph',
          content: 'Single data points can be misleading. Look for patterns and trends:'
        },
        {
          type: 'list',
          items: [
            'Week-over-week and month-over-month changes',
            'Seasonal patterns and cycles',
            'Impact of marketing campaigns or promotions',
            'Response to price changes or new products',
            'Customer behavior changes over time'
          ]
        },
        {
          type: 'heading',
          level: 2,
          content: 'Segment your data'
        },
        {
          type: 'paragraph',
          content: 'Aggregated data can hide important insights. Break down your analytics by:'
        },
        {
          type: 'list',
          items: [
            'Product categories or individual products',
            'Customer demographics or location',
            'Traffic sources (where customers come from)',
            'Time of day or day of week',
            'New vs. returning customers'
          ]
        },
        {
          type: 'heading',
          level: 2,
          content: 'Test and measure'
        },
        {
          type: 'paragraph',
          content: 'Use your analytics to guide experiments and improvements:'
        },
        {
          type: 'list',
          items: [
            'A/B test different product descriptions or images',
            'Try different pricing strategies and measure impact',
            'Test marketing messages and channels',
            'Experiment with product bundles or promotions',
            'Measure the impact of website or process changes'
          ]
        },
        {
          type: 'tip',
          content: 'The best analytics approach is: form a hypothesis, test it, measure results, and iterate. Data should inform decisions, not replace judgment.'
        },
        {
          type: 'heading',
          level: 2,
          content: 'Set actionable goals'
        },
        {
          type: 'paragraph',
          content: 'Turn your analytics insights into specific, measurable goals:'
        },
        {
          type: 'list',
          items: [
            'Increase conversion rate by X%',
            'Reduce customer acquisition cost by Y',
            'Improve average order value to Z amount',
            'Increase repeat customer rate to W%',
            'Achieve specific revenue targets within timeframes'
          ]
        },
        {
          type: 'heading',
          level: 2,
          content: 'Review regularly'
        },
        {
          type: 'paragraph',
          content: 'Make analytics review a regular part of your business routine. Weekly or monthly reviews help you stay on track and catch issues early.'
        }
      ]
    }
  }
];

async function seedLessons() {
  console.log('🌱 Starting to seed MO lessons...');
  
  try {
    const supabase = getSupabaseServer();
    
    // Clear existing lessons
    console.log('🧹 Clearing existing lessons...');
    const { error: deleteError } = await supabase
      .from('mo_lessons')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteError) {
      console.error('Error clearing existing lessons:', deleteError);
      return;
    }
    
    // Insert new lessons
    console.log('📚 Inserting lessons...');
    const { error: insertError } = await supabase
      .from('mo_lessons')
      .insert(lessons);
    
    if (insertError) {
      console.error('Error inserting lessons:', insertError);
      return;
    }
    
    console.log('✅ Successfully seeded MO lessons!');
    console.log(`📝 Inserted ${lessons.length} lessons`);
    
    // Verify insertion
    const { data: verifyData, error: verifyError } = await supabase
      .from('mo_lessons')
      .select('slug, title');
    
    if (verifyError) {
      console.error('Error verifying lessons:', verifyError);
    } else {
      console.log('📋 Lessons in database:');
      verifyData?.forEach(lesson => {
        console.log(`   - ${lesson.slug}: ${lesson.title}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error seeding lessons:', error);
  }
}

// Run the seed function
seedLessons();
