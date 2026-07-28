import React, { useState, useMemo } from 'react';
import { Lightbulb, Video, Copy, Sparkles, Check, X, AlertCircle } from 'lucide-react';
import styles from './SellContentPage.module.css';

interface Product {
  id: string;
  displayName: string;
  price: number;
  productType: string;
  images: string[];
  category: string;
  description?: string;
  tags?: string[];
}

interface Idea {
  id: number;
  hook: string;
  format: string;
  cta: string;
  platforms: string[];
}

interface Script {
  text: string;
  caption: string;
  hashtags: string[];
}

interface Tip {
  icon: string;
  text: string;
}

// ── Mock content templates per product type ────────────────────────────────

const IDEAS_BY_TYPE: Record<string, Array<{ hook: string; format: string; cta: string; platforms: string[] }>> = {
  physical: [
    { hook: '"Stop scrolling — this changes everything"', format: '15s TikTok/Reel', cta: 'Shop now via link', platforms: ['tiktok', 'ig'] },
    { hook: '"Before vs After using [product]"', format: 'Carousel (5 slides)', cta: 'Swipe up to order', platforms: ['ig', 'pinterest'] },
    { hook: '"Only X left in stock!"', format: 'Story with countdown sticker', cta: 'Tap to buy before it\'s gone', platforms: ['ig', 'fb'] },
    { hook: '"Here\'s why everyone is switching to [product]"', format: '30s YouTube Short', cta: 'Link in bio to get yours', platforms: ['youtube', 'tiktok'] },
    { hook: '"Unboxing [product] — first impressions"', format: '60s Livestream clip', cta: 'DM to order', platforms: ['tiktok', 'ig'] },
    { hook: '"3 ways to style / use [product]"', format: 'Carousel (4 slides)', cta: 'Save this for later', platforms: ['pinterest', 'ig'] },
    { hook: '"Customer just received their order! 🎉"', format: 'UGC repost + testimonial', cta: 'Get yours — link below', platforms: ['ig', 'tiktok'] },
    { hook: '"Price alert: [product] is now [discount]% off"', format: 'Text-only Tweet / X post', cta: 'Shop the deal', platforms: ['twitter', 'ig'] },
    { hook: '"What\'s in my bag? feat. [product]"', format: '15s TikTok point-of-view', cta: 'Tap the link to shop', platforms: ['tiktok', 'ig'] },
    { hook: '"Gift idea alert 🎁 [product] for [occasion]"', format: 'Pinterest Pin + description', cta: 'Click to gift', platforms: ['pinterest', 'ig'] },
  ],
  digital: [
    { hook: '"The #1 mistake [audience] makes (and how to fix it)"', format: '30s Educational Reel', cta: 'Download the guide — link in bio', platforms: ['tiktok', 'ig'] },
    { hook: '"I tried [method] for 30 days — results shocked me"', format: 'Carousel (6 slides)', cta: 'Get the same system — link below', platforms: ['ig', 'pinterest'] },
    { hook: '"Free lesson inside 👀"', format: '15s teaser + swipe-up', cta: 'DM "LESSON" for free chapter', platforms: ['ig', 'tiktok'] },
    { hook: '"Stop wasting money on [alternative] — do this instead"', format: 'Thread / Twitter space', cta: 'Full guide in bio', platforms: ['twitter', 'ig'] },
    { hook: '"What my students are saying..."', format: 'Testimonial carousel', cta: 'Join 500+ students — start today', platforms: ['ig', 'fb'] },
    { hook: '"3 tools every [audience] needs in 2026"', format: '15s TikTok listicle', cta: 'Grab the bundle — link in bio', platforms: ['tiktok', 'ig'] },
    { hook: '"Behind the scenes: creating [digital product]"', format: '60s YouTube Short', cta: 'Get early access', platforms: ['youtube', 'tiktok'] },
    { hook: '"Day 1 vs Day 30 using [product]"', format: 'Split-screen video', cta: 'Start your journey — link below', platforms: ['tiktok', 'ig'] },
    { hook: '"Why [number] people downloaded this last week"', format: 'Story with poll sticker', cta: 'Swipe up to download', platforms: ['ig', 'fb'] },
    { hook: '"Your [audience] needs this — here\'s why"', format: 'LinkedIn carousel post', cta: 'Comment "INFO" for details', platforms: ['linkedin', 'twitter'] },
  ],
  service: [
    { hook: '"Booking now open for [month] 📅"', format: 'Announcement post', cta: 'DM to reserve your slot', platforms: ['ig', 'fb'] },
    { hook: '"What to expect during your [service] session"', format: '30s explainer video', cta: 'Book your session — link in bio', platforms: ['tiktok', 'ig'] },
    { hook: '"Client transformation: [before] → [after]"', format: 'Before/after carousel', cta: 'Ready for your glow-up? DM us', platforms: ['ig', 'pinterest'] },
    { hook: '"3 signs you need [service] right now"', format: 'Carousel (4 slides)', cta: 'Book a consultation', platforms: ['ig', 'linkedin'] },
    { hook: '"A day in the life of a [profession]"', format: '60s vlog-style video', cta: 'Book your appointment below', platforms: ['tiktok', 'youtube'] },
    { hook: '"FAQ: Everything you want to know about [service]"', format: 'Thread / long-form caption', cta: 'Save this for later', platforms: ['twitter', 'ig'] },
    { hook: '"Limited slots available — don\'t miss out"', format: 'Story with countdown', cta: 'Tap to book now', platforms: ['ig', 'fb'] },
    { hook: '"Why [audience] is choosing [service] over [alternative]"', format: 'Comparison carousel', cta: 'See the difference — book today', platforms: ['ig', 'linkedin'] },
    { hook: '"Client review: [name] shares their experience"', format: 'Video testimonial + text overlay', cta: 'Be the next success story', platforms: ['tiktok', 'ig'] },
    { hook: '"How to prepare for your first [service]"', format: 'Checklist carousel', cta: 'Book with confidence — link below', platforms: ['pinterest', 'ig'] },
  ],
};

const SCRIPTS_BY_TYPE: Record<string, Array<{ text: string; caption: string; hashtags: string[] }>> = {
  physical: [
    {
      text: `[Opens with product in hand, close-up shot]

"Okay, let me show you why everyone’s talking about this.

[sound effect: whoosh]

[Cut to lifestyle shot — product in use]

This isn't just another [product category]. It's built different. The quality? Top tier. The design? Chef's kiss.

[Quick cuts: 3 different angles]

Here's the thing — once you try it, you won't go back. Period.

[Smile at camera]

Grab yours at the link in my bio before they sell out. Trust me on this one."`,
      caption: `The one you've been waiting for 🔥

Premium quality. Unbeatable value. Limited stock.

Tap the link to get yours 👆`,
      hashtags: ['#musthave', '#shopnow', '#qualityfirst', '#trending', '#limitedstock'],
    },
    {
      text: `[Talking to camera, casual style]

"So I got this [product] last week and... wow.

[Show product packaging / unboxing]

Look at this. The details are insane. And it feels amazing.

[Demo shot: using the product]

I've been using it every single day since I got it. Worth every kobo.

[Close-up of product feature]

Here's a discount code just for you guys: [CODE] for 10% off.

[Winks at camera]

Go grab it — link in bio. You can thank me later."`,
      caption: `Unboxing my new favourite thing 📦✨

Swipe up to get yours with 10% off — code in video!

#unboxing #productreview #musthave #shopsmall`,
      hashtags: ['#unboxing', '#productreview', '#musthave', '#shopsmall', '#newarrival'],
    },
  ],
  digital: [
    {
      text: `[Sitting at desk, warm lighting, laptop visible]

"You've been overcomplicating this. Let me show you the simpler way.

[Screen recording overlay]

I spent [X months/years] figuring this out so you don't have to. Inside this [guide/course], I cover:

• [Point 1] — the game changer
• [Point 2] — most people miss this
• [Point 3] — implement this TODAY

[Cut back to talking]

The best part? You can start implementing in the next 10 minutes.

[Smile]

Download link in bio. Your future self will thank you."`,
      caption: `Stop overcomplicating things 🛑

I created the exact system that saved me [X hours/money]. Now it's yours.

Link in bio to get instant access 👆`,
      hashtags: ['#digitalproduct', '#learnonline', '#productivity', '#growth', '#bangforbuck'],
    },
    {
      text: `[Split screen: frustrated person on left, happy person on right]

"This was me before [product]. And this is me after.

[Transition to talking head]

Honestly, I didn't think it would make this much difference. But within [timeframe], I saw:

1. [Result 1]
2. [Result 2]
3. [Result 3]

[Screenshots of results/testimonials]

Here's the thing — knowledge is only power if you APPLY it. This [course/guide] gives you the exact steps.

[Finger point at camera]

No fluff. Just results.

Link in bio. Start today."`,
      caption: `Before vs After — the results speak for themselves 📈

Ready to transform? Link in bio.

#beforeandafter #results #digitalcourse #growthmindset #transformation`,
      hashtags: ['#beforeandafter', '#results', '#digitalcourse', '#growthmindset', '#transformation'],
    },
  ],
  service: [
    {
      text: `[Professional setting, smiling warmly]

"Hey! Want to know what a [service] session with me looks like?

[Cut to clip of session in progress]

We start with a quick chat to understand where you are and where you want to be. Then we dive into the work.

[Quick cuts of you working with client]

By the end, you'll have:

• [Benefit 1]
• [Benefit 2]
• [Benefit 3]

[Back to camera]

Sounds good? Sessions are filling up fast for this month.

DM me the word 'BOOK' and let's make it happen."`,
      caption: `Your transformation starts here ✨

Limited slots available this month. DM 'BOOK' to reserve yours.

#consultation #services #transformation #booknow #experiencethemo`,
      hashtags: ['#consultation', '#services', '#transformation', '#booknow', '#experiencethemo'],
    },
  ],
};

const TIPS_BY_TYPE: Record<string, Tip[]> = {
  physical: [
    { icon: '📸', text: 'Show it in use — lifestyle photos and videos sell better than studio shots.' },
    { icon: '📦', text: 'Bundle related items together for a higher perceived value.' },
    { icon: '⏰', text: 'Create urgency: "Only 5 left" or "Sale ends tonight" drives action.' },
    { icon: '⭐', text: 'Social proof wins — share customer reviews and unboxing videos.' },
    { icon: '🎯', text: 'Target a specific pain point: "Tired of [problem]? This solves it."' },
    { icon: '📊', text: 'Use comparison posts: "Our quality vs competitors" builds trust.' },
  ],
  digital: [
    { icon: '🎯', text: 'Show the outcome, not the product — sell the transformation, not the file.' },
    { icon: '🎁', text: 'Give away one free lesson/template to build trust and collect emails.' },
    { icon: '⭐', text: 'Social proof: share testimonials, reviews, and user-generated content.' },
    { icon: '📊', text: 'Use before/after: "Here\'s what [customer] achieved using my system."' },
    { icon: '🔗', text: 'Create a lead magnet — a free mini-version that leads to the full product.' },
    { icon: '📱', text: 'Tease on multiple platforms: short video on TikTok, deep dive on YouTube.' },
  ],
  service: [
    { icon: '🤝', text: 'Show the human side — introduce yourself and your personality.' },
    { icon: '⭐', text: 'Client testimonials are gold — feature them prominently.' },
    { icon: '📅', text: 'Urgency: "Only 3 slots left this month" creates FOMO.' },
    { icon: '🎬', text: 'Show clips from actual sessions (with permission) to build trust.' },
    { icon: '❓', text: 'Answer FAQs in content — "What to expect from your first session."' },
    { icon: '📈', text: 'Share results/case studies: "Client X achieved Y in Z weeks."' },
  ],
};

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ── Component ──────────────────────────────────────────────────────────────

interface Props {
  product: Product;
  onClose: () => void;
  currency: string;
}

export function ContentGenerator({ product, onClose, currency }: Props) {
  const [activeTab, setActiveTab] = useState<'ideas' | 'scripts' | 'tips'>('ideas');
  const [doneIdeas, setDoneIdeas] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const type = product.productType === 'digital' ? 'digital' : product.productType === 'service' ? 'service' : 'physical';

  const ideas = useMemo(() => shuffleArray(IDEAS_BY_TYPE[type] ?? IDEAS_BY_TYPE.physical).slice(0, 5), [type]);
  const scripts = useMemo(() => shuffleArray(SCRIPTS_BY_TYPE[type] ?? SCRIPTS_BY_TYPE.physical).slice(0, 2), [type]);
  const tips = useMemo(() => shuffleArray(TIPS_BY_TYPE[type] ?? TIPS_BY_TYPE.physical).slice(0, 4), [type]);

  const toggleDone = (id: number) => {
    setDoneIdeas(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const copyScript = (script: Script) => {
    const text = `${script.text}\n\n📝 Caption:\n${script.caption}\n\n🏷️ Hashtags:\n${script.hashtags.join(' ')}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.panelHeader}>
        <div className={styles.panelProductInfo}>
          <span className={styles.panelProductName}>{product.displayName}</span>
          <span className={styles.panelProductType}>{product.productType} · {product.description?.slice(0, 80)}</span>
        </div>
        <button className={styles.panelClose} onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'ideas' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('ideas')}
        >
          <Lightbulb size={15} />
          Ideas
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'scripts' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('scripts')}
        >
          <Video size={15} />
          Scripts
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'tips' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('tips')}
        >
          <AlertCircle size={15} />
          Sell Tips
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'ideas' && (
          <>
            {loading ? (
              <div className={styles.generating}>
                <Sparkles className={styles.spin} size={28} />
                <span>Generating content ideas...</span>
              </div>
            ) : (
              ideas.map((idea, i) => (
                <div key={i} className={styles.ideaCard}>
                  <span className={styles.ideaNumber}>Idea #{i + 1}</span>
                  <div className={styles.ideaHook}>{idea.hook}</div>
                  <div className={styles.ideaMeta}>
                    <span className={styles.ideaFormat}>{idea.format}</span>
                    <span className={styles.ideaCta}>CTA: {idea.cta}</span>
                  </div>
                  <div className={styles.platformIcons}>
                    Best for: {idea.platforms.map(p => {
                      const labels: Record<string, string> = { tiktok: '🎵', ig: '📷', youtube: '▶️', twitter: '🐦', pinterest: '📌', fb: '👍', linkedin: '💼' };
                      return <span key={p} className={styles.platformIcon}>{labels[p] || p}</span>;
                    })}
                  </div>
                  <div className={styles.ideaActions}>
                    <button
                      className={`${styles.doneBtn} ${doneIdeas.has(i) ? styles.doneBtnDone : ''}`}
                      onClick={() => toggleDone(i)}
                    >
                      <Check size={12} />
                      {doneIdeas.has(i) ? 'Done' : 'Mark as Done'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'scripts' && (
          <>
            {loading ? (
              <div className={styles.generating}>
                <Sparkles className={styles.spin} size={28} />
                <span>Writing script...</span>
              </div>
            ) : (
              scripts.map((script, i) => (
                <div key={i} className={styles.scriptBlock}>
                  <span className={styles.scriptLabel}>Script {i + 1} — 20-30 second video</span>
                  <div className={styles.scriptContent}>{script.text}</div>
                  <span className={styles.scriptLabel}>Caption</span>
                  <div className={styles.scriptContent}>{script.caption}</div>
                  <span className={styles.scriptLabel}>Hashtags</span>
                  <div className={styles.scriptContent}>{script.hashtags.join('  ')}</div>
                  <button
                    className={`${styles.copyBtn} ${copied ? styles.copyBtnCopied : ''}`}
                    onClick={() => copyScript(script)}
                  >
                    <Copy size={13} />
                    {copied ? 'Copied!' : 'Copy All'}
                  </button>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'tips' && (
          <>
            {loading ? (
              <div className={styles.generating}>
                <Sparkles className={styles.spin} size={28} />
                <span>Loading tips...</span>
              </div>
            ) : (
              tips.map((tip, i) => (
                <div key={i} className={styles.tipCard}>
                  <span className={styles.tipIcon}>{tip.icon}</span>
                  <span className={styles.tipText}>{tip.text}</span>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
