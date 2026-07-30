'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Lightbulb, Video, Copy, Sparkles, Check, X, AlertCircle, Mail, Search, Send } from 'lucide-react';
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
  digitalSubtype?: string | null;
}

interface SocialCaption {
  platform: string;
  caption: string;
  hashtags?: string;
}

interface AdCopyItem {
  headline: string;
  body: string;
  cta: string;
}

interface EmailMarketing {
  subject: string;
  previewText: string;
  body: string;
}

interface ContentIdeas {
  socialCaptions?: SocialCaption[];
  adCopy?: AdCopyItem[];
  emailMarketing?: EmailMarketing;
  seoDescription?: string;
  shortDescription?: string;
  keySellingPoints?: string[];
  marketingAngle?: string;
}

type TabId = 'social' | 'scripts' | 'email' | 'seo';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'social',  label: 'Social',  icon: <Lightbulb size={15} /> },
  { id: 'scripts', label: 'Scripts', icon: <Video size={15} /> },
  { id: 'email',   label: 'Email',   icon: <Mail size={15} /> },
  { id: 'seo',     label: 'SEO',     icon: <Search size={15} /> },
];

interface Props {
  product: Product;
  onClose: () => void;
  currency: string;
}

export function ContentGenerator({ product, onClose, currency }: Props) {
  const [contentIdeas, setContentIdeas] = useState<ContentIdeas | null>(null);
  const [loading, setLoading] = useState(true);
  const [refining, setRefining] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('social');
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  const generate = useCallback(async (refineInstruction?: string) => {
    if (refineInstruction) setRefining(true);
    else setLoading(true);

    try {
      const res = await fetch('/api/sell/ask-mo/content-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: {
            displayName: product.displayName,
            description: product.description,
            price: product.price,
            category: product.category,
            productType: product.productType,
            digitalSubtype: product.digitalSubtype,
            tags: product.tags ?? [],
          },
          instruction: refineInstruction,
        }),
      });
      const data = await res.json();
      if (data.contentIdeas) {
        setContentIdeas(data.contentIdeas);
        setInstruction('');
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
      setRefining(false);
    }
  }, [product]);

  useEffect(() => { generate(); }, [generate]);

  const handleRefine = () => {
    if (!instruction.trim() || refining) return;
    generate(instruction.trim());
  };

  const copyText = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLabel(label);
      setTimeout(() => setCopiedLabel(null), 2000);
    } catch { /* silent */ }
  };

  const renderLoader = (msg: string) => (
    <div className={styles.generating}>
      <Sparkles className={styles.spin} size={28} />
      <span>{msg}</span>
    </div>
  );

  const buildCopyText = () => {
    if (!contentIdeas) return '';
    const parts: string[] = [];
    contentIdeas.socialCaptions?.forEach(s => {
      parts.push(`[${s.platform}]\n${s.caption}${s.hashtags ? '\n' + s.hashtags : ''}`);
    });
    contentIdeas.adCopy?.forEach(a => {
      parts.push(`[Ad] ${a.headline}\n${a.body}\nCTA: ${a.cta}`);
    });
    if (contentIdeas.emailMarketing) {
      const e = contentIdeas.emailMarketing;
      parts.push(`[Email]\nSubject: ${e.subject}\nPreview: ${e.previewText}\n\n${e.body}`);
    }
    if (contentIdeas.seoDescription) parts.push(`[SEO]\n${contentIdeas.seoDescription}`);
    if (contentIdeas.keySellingPoints?.length) {
      parts.push(`[Key Selling Points]\n${contentIdeas.keySellingPoints.map(p => `• ${p}`).join('\n')}`);
    }
    return parts.join('\n\n---\n\n');
  };

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.panelHeader}>
        <div className={styles.panelProductInfo}>
          <span className={styles.panelProductName}>{product.displayName}</span>
          <span className={styles.panelProductType}>
            {product.productType}{product.category ? ` · ${product.category}` : ''}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {contentIdeas && (
            <button
              className={styles.copyBtn}
              onClick={() => copyText('all', buildCopyText())}
              style={{ alignSelf: 'auto' }}
            >
              {copiedLabel === 'all' ? <Check size={13} /> : <Copy size={13} />}
              {copiedLabel === 'all' ? 'Copied!' : 'Copy All'}
            </button>
          )}
          <button className={styles.panelClose} onClick={onClose}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      {contentIdeas && (
        <div className={styles.tabs}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {loading || refining ? renderLoader(refining ? 'MO is refining...' : 'MO is generating content ideas...') : !contentIdeas ? (
          <div className={styles.generating} style={{ padding: 40 }}>
            <AlertCircle size={28} style={{ opacity: 0.3 }} />
            <span>Could not generate content ideas. Try refining below.</span>
          </div>
        ) : activeTab === 'social' && contentIdeas.socialCaptions ? (
          contentIdeas.socialCaptions.map((item, i) => (
            <div key={i} className={styles.ideaCard}>
              <div className={styles.ideaRow}>
                <span className={styles.ideaNumber}>{item.platform}</span>
                {item.hashtags && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--sell-primary)' }}>
                    {item.hashtags}
                  </span>
                )}
              </div>
              <div className={styles.ideaHook}>{item.caption}</div>
              <div className={styles.ideaActions}>
                <button
                  className={`${styles.doneBtn} ${copiedLabel === `social-${i}` ? styles.doneBtnDone : ''}`}
                  onClick={() => copyText(`social-${i}`, `${item.caption}${item.hashtags ? '\n' + item.hashtags : ''}`)}
                >
                  {copiedLabel === `social-${i}` ? <Check size={12} /> : <Copy size={12} />}
                  {copiedLabel === `social-${i}` ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          ))
        ) : activeTab === 'scripts' && contentIdeas.adCopy ? (
          contentIdeas.adCopy.map((item, i) => (
            <div key={i} className={styles.scriptBlock}>
              <span className={styles.scriptLabel}>Script {i + 1}</span>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--sell-text-1)' }}>{item.headline}</div>
              <div className={styles.scriptContent}>{item.body}</div>
              <div style={{
                alignSelf: 'flex-start', padding: '6px 14px', borderRadius: 20,
                background: 'var(--sell-primary)', color: '#fff', fontSize: '0.78rem', fontWeight: 600,
              }}>
                CTA: {item.cta}
              </div>
              <button
                className={`${styles.copyBtn} ${copiedLabel === `ad-${i}` ? styles.copyBtnCopied : ''}`}
                onClick={() => copyText(`ad-${i}`, `${item.headline}\n${item.body}\nCTA: ${item.cta}`)}
              >
                {copiedLabel === `ad-${i}` ? <Check size={13} /> : <Copy size={13} />}
                {copiedLabel === `ad-${i}` ? 'Copied!' : 'Copy'}
              </button>
            </div>
          ))
        ) : activeTab === 'email' && contentIdeas.emailMarketing ? (
          <div className={styles.scriptBlock}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className={styles.scriptLabel}>Subject</span>
              <div className={styles.ideaHook}>{contentIdeas.emailMarketing.subject}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className={styles.scriptLabel}>Preview Text</span>
              <div style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--sell-text-2)' }}>
                {contentIdeas.emailMarketing.previewText}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className={styles.scriptLabel}>Email Body</span>
              <div className={styles.scriptContent}>{contentIdeas.emailMarketing.body}</div>
            </div>
            <button
              className={`${styles.copyBtn} ${copiedLabel === 'email' ? styles.copyBtnCopied : ''}`}
              onClick={() => {
                const em = contentIdeas!.emailMarketing!;
                copyText('email', `Subject: ${em.subject}\nPreview: ${em.previewText}\n\n${em.body}`);
              }}
            >
              {copiedLabel === 'email' ? <Check size={13} /> : <Copy size={13} />}
              {copiedLabel === 'email' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        ) : activeTab === 'seo' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {contentIdeas.seoDescription && (
              <div className={styles.scriptBlock}>
                <span className={styles.scriptLabel}>SEO Meta Description</span>
                <div className={styles.scriptContent}>{contentIdeas.seoDescription}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--sell-text-3)' }}>
                  {contentIdeas.seoDescription.length} characters
                </div>
                <button
                  className={`${styles.copyBtn} ${copiedLabel === 'seo' ? styles.copyBtnCopied : ''}`}
                  onClick={() => copyText('seo', contentIdeas.seoDescription!)}
                >
                  {copiedLabel === 'seo' ? <Check size={13} /> : <Copy size={13} />}
                  {copiedLabel === 'seo' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}
            {contentIdeas.shortDescription && (
              <div className={styles.scriptBlock}>
                <span className={styles.scriptLabel}>Short Description</span>
                <div className={styles.scriptContent}>{contentIdeas.shortDescription}</div>
                <button
                  className={`${styles.copyBtn} ${copiedLabel === 'short-desc' ? styles.copyBtnCopied : ''}`}
                  onClick={() => copyText('short-desc', contentIdeas.shortDescription!)}
                >
                  {copiedLabel === 'short-desc' ? <Check size={13} /> : <Copy size={13} />}
                  {copiedLabel === 'short-desc' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}
            {contentIdeas.keySellingPoints && contentIdeas.keySellingPoints.length > 0 && (
              <div className={styles.scriptBlock}>
                <span className={styles.scriptLabel}>Key Selling Points</span>
                <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8, color: 'var(--sell-text-1)' }}>
                  {contentIdeas.keySellingPoints.map((p, i) => (
                    <li key={i} style={{ fontSize: '0.85rem' }}>{p}</li>
                  ))}
                </ul>
                <button
                  className={`${styles.copyBtn} ${copiedLabel === 'ksp' ? styles.copyBtnCopied : ''}`}
                  onClick={() => copyText('ksp', contentIdeas.keySellingPoints!.map(p => `• ${p}`).join('\n'))}
                >
                  {copiedLabel === 'ksp' ? <Check size={13} /> : <Copy size={13} />}
                  {copiedLabel === 'ksp' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}
            {contentIdeas.marketingAngle && (
              <div className={styles.scriptBlock}>
                <span className={styles.scriptLabel}>Marketing Angle</span>
                <div className={styles.scriptContent}>{contentIdeas.marketingAngle}</div>
                <button
                  className={`${styles.copyBtn} ${copiedLabel === 'angle' ? styles.copyBtnCopied : ''}`}
                  onClick={() => copyText('angle', contentIdeas.marketingAngle!)}
                >
                  {copiedLabel === 'angle' ? <Check size={13} /> : <Copy size={13} />}
                  {copiedLabel === 'angle' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}
          </div>
        ) : activeTab === 'social' ? (
          <div className={styles.generating} style={{ padding: 40 }}>
            <AlertCircle size={28} style={{ opacity: 0.3 }} />
            <span>No social captions generated. Try a different product or refine below.</span>
          </div>
        ) : activeTab === 'scripts' ? (
          <div className={styles.generating} style={{ padding: 40 }}>
            <AlertCircle size={28} style={{ opacity: 0.3 }} />
            <span>No ad scripts generated. Try a different product or refine below.</span>
          </div>
        ) : activeTab === 'email' ? (
          <div className={styles.generating} style={{ padding: 40 }}>
            <AlertCircle size={28} style={{ opacity: 0.3 }} />
            <span>No email content generated. Try a different product or refine below.</span>
          </div>
        ) : (
          <div className={styles.generating} style={{ padding: 40 }}>
            <AlertCircle size={28} style={{ opacity: 0.3 }} />
            <span>No SEO content generated. Try a different product or refine below.</span>
          </div>
        )}
      </div>

      {/* Footer — Refine input */}
      {contentIdeas && (
        <div style={{
          padding: '12px 18px', borderTop: '1px solid var(--sell-border)',
          display: 'flex', gap: 6, alignItems: 'center',
        }}>
          <input
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleRefine(); }}
            placeholder="Ask MO to refine — e.g. make it more playful, add emojis, shorter..."
            disabled={loading || refining}
            style={{
              flex: 1, padding: '9px 12px', borderRadius: 'var(--sell-radius-sm)',
              border: '1px solid var(--sell-border)', background: 'var(--sell-bg)',
              fontSize: '0.78rem', color: 'var(--sell-text-1)', outline: 'none',
              fontFamily: 'var(--sell-font-body)',
            }}
          />
          <button
            onClick={handleRefine}
            disabled={loading || refining || !instruction.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 14px', borderRadius: 'var(--sell-radius-sm)',
              border: 'none', background: 'var(--sell-accent)',
              color: '#fff', fontSize: '0.78rem', fontWeight: 600,
              cursor: 'pointer', opacity: instruction.trim() ? 1 : 0.5,
              whiteSpace: 'nowrap',
            }}
          >
            {refining ? (
              <Sparkles className={styles.spin} size={14} />
            ) : (
              <Send size={14} />
            )}
            {refining ? 'Refining...' : 'Ask MO'}
          </button>
        </div>
      )}
    </div>
  );
}
