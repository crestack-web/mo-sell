import React, { useState, useEffect, useRef } from 'react';
import { Lightbulb, Video, Copy, Sparkles, Check, X, AlertCircle, RefreshCw } from 'lucide-react';
import styles from './ContentHub.module.css';

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

interface ApiResponse {
  ideas: Idea[];
  scripts: Script[];
  tips: Tip[];
  error?: string;
}

const PLATFORM_ICONS: Record<string, string> = {
  tiktok: '🎵', ig: '📷', youtube: '▶️', twitter: '🐦',
  pinterest: '📌', fb: '👍', linkedin: '💼',
};

interface Props {
  product: Product;
  onClose: () => void;
  currency: string;
}

export function ContentGenerator({ product, onClose, currency }: Props) {
  const [activeTab, setActiveTab] = useState<'ideas' | 'scripts' | 'tips'>('ideas');
  const [doneIdeas, setDoneIdeas] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<ApiResponse | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    loadIdeas();
  }, []);

  const loadIdeas = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/content/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: product.displayName,
          description: product.description,
          price: product.price,
          category: product.category,
          productType: product.productType,
        }),
      });
      const json: ApiResponse = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate ideas');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

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
      <div className={styles.panelHeader}>
        <div className={styles.panelProductInfo}>
          <span className={styles.panelProductName}>{product.displayName}</span>
          <span className={styles.panelProductType}>{product.productType} · {product.description?.slice(0, 80)}</span>
        </div>
        <button className={styles.panelClose} onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'ideas' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('ideas')}
        >
          <Lightbulb size={15} /> Ideas
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'scripts' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('scripts')}
        >
          <Video size={15} /> Scripts
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'tips' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('tips')}
        >
          <AlertCircle size={15} /> Sell Tips
        </button>
      </div>

      <div className={styles.tabContent}>
        {loading ? (
          <div className={styles.generating}>
            <Sparkles className={styles.spin} size={28} />
            <span>Generating content ideas with MO...</span>
          </div>
        ) : error ? (
          <div className={styles.generating} style={{ gap: 12 }}>
            <AlertCircle size={28} style={{ opacity: 0.5 }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--sell-text-3)', textAlign: 'center', maxWidth: 320 }}>
              {error}
            </span>
            <button onClick={loadIdeas} className={styles.regenerateBtn}>
              <RefreshCw size={13} /> Try again
            </button>
          </div>
        ) : !data ? null : (
          <>
            {activeTab === 'ideas' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                  <button onClick={loadIdeas} className={styles.regenerateBtn}>
                    <RefreshCw size={13} /> Regenerate
                  </button>
                </div>
                {data.ideas.map((idea, i) => (
                  <div key={i} className={styles.ideaCard}>
                    <span className={styles.ideaNumber}>Idea #{i + 1}</span>
                    <div className={styles.ideaHook}>{idea.hook}</div>
                    <div className={styles.ideaMeta}>
                      <span className={styles.ideaFormat}>{idea.format}</span>
                      <span className={styles.ideaCta}>CTA: {idea.cta}</span>
                    </div>
                    <div className={styles.platformIcons}>
                      Best for: {idea.platforms.map(p => (
                        <span key={p} className={styles.platformIcon}>{PLATFORM_ICONS[p] || p}</span>
                      ))}
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
                ))}
              </>
            )}

            {activeTab === 'scripts' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                  <button onClick={loadIdeas} className={styles.regenerateBtn}>
                    <RefreshCw size={13} /> Regenerate
                  </button>
                </div>
                {data.scripts.map((script, i) => (
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
                ))}
              </>
            )}

            {activeTab === 'tips' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                  <button onClick={loadIdeas} className={styles.regenerateBtn}>
                    <RefreshCw size={13} /> Regenerate
                  </button>
                </div>
                {data.tips.map((tip, i) => (
                  <div key={i} className={styles.tipCard}>
                    <span className={styles.tipIcon}>{tip.icon}</span>
                    <span className={styles.tipText}>{tip.text}</span>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
