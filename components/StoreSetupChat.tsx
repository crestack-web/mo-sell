'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getDatabase } from '@/lib/database/adapter';
import { useSell } from '@/context/SellContext';
import styles from './StoreSetupChat.module.css';

type Role = 'user' | 'assistant';

interface Msg {
  id: string;
  role: Role;
  text: string;
  storeUpdate?: Record<string, unknown> | null;
  newProduct?: Record<string, unknown> | null;
  applied?: boolean;
  productCreated?: boolean;
}

const MO_AVATAR = 'https://res.cloudinary.com/dzjoqbg2u/image/upload/v1784793259/mo_sell_chat_ucbw3x.png';
const SETUP_DONE_KEY = 'mo-sell-ai-setup-done';

function uid() {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

const OPENER =
  "Hey — I'm MO. Tell me what you sell (or want to sell), and I'll build your storefront — theme, branding, and a starter product — through this chat. No template browsing.";

export function StoreSetupChat({
  defaultOpen = false,
  onComplete,
}: {
  defaultOpen?: boolean;
  onComplete?: () => void;
}) {
  const { user, storeConfig, showToast, refreshStoreConfig, navigateTo } = useSell();
  const [open, setOpen] = useState(defaultOpen);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { id: 'opener', role: 'assistant', text: OPENER },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const storeSlug = storeConfig?.storeSlug as string | undefined;

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [input]);

  const applyStoreUpdate = useCallback(
    async (update: Record<string, unknown>) => {
      if (!user?.businessId) return false;
      const fields: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(update)) {
        if (v !== null && v !== undefined && v !== '') fields[k] = v;
      }
      if (!Object.keys(fields).length) return false;
      // Prefer active store after setup
      if (!fields.status) fields.status = 'active';
      const db = getDatabase();
      await db.doc(`businesses/${user.businessId}/store/config`).set(fields, { merge: true });
      await refreshStoreConfig();
      return true;
    },
    [user?.businessId, refreshStoreConfig],
  );

  const applyProduct = useCallback(
    async (productData: Record<string, unknown>) => {
      if (!user?.businessId) return false;
      const res = await fetch('/api/sell/ask-mo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: user.businessId,
          storeConfig: storeConfig ?? null,
          productData,
        }),
      });
      const data = await res.json().catch(() => null);
      return !!(res.ok && data?.success);
    },
    [user?.businessId, storeConfig],
  );

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || !user?.businessId) return;
    setInput('');
    const userMsg: Msg = { id: uid(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const history = [...messages, userMsg]
        .filter(m => m.id !== 'opener' || m.role === 'user')
        .map(m => ({
          role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
          parts: [{ text: m.text }],
        }));

      const res = await fetch('/api/sell/ask-mo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          businessId: user.businessId,
          conversationHistory: history,
          storeConfig: storeConfig ?? null,
          mode: 'store_setup',
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) throw new Error(data?.error || 'MO could not reply');

      let bot: Msg = {
        id: uid(),
        role: 'assistant',
        text: data.answer || data.raw || 'Done.',
        storeUpdate: data.storeUpdate ?? null,
        newProduct: data.newProduct ?? data.proposedProduct ?? null,
      };

      // Auto-apply during setup so the store is built for them
      if (bot.storeUpdate && Object.values(bot.storeUpdate).some(v => v != null && v !== '')) {
        try {
          const ok = await applyStoreUpdate(bot.storeUpdate);
          if (ok) {
            bot = { ...bot, applied: true };
            setPreviewKey(k => k + 1);
            showToast('Store branding applied', 'success');
          }
        } catch {
          showToast('Could not apply store settings', 'error');
        }
      }

      if (bot.newProduct && bot.newProduct.displayName) {
        try {
          // Skip digital products that need PDF chapters — physical/audio ok without file for draft
          const pType = String(bot.newProduct.productType || 'physical');
          const subtype = String(bot.newProduct.digitalSubtype || '');
          const needsPdf = pType === 'digital' && !['audio', 'video', 'ticket', 'coaching'].includes(subtype);
          if (!needsPdf) {
            const ok = await applyProduct(bot.newProduct);
            if (ok) {
              bot = { ...bot, productCreated: true };
              setPreviewKey(k => k + 1);
              showToast('Starter product added', 'success');
            }
          }
        } catch {
          /* product optional */
        }
      }

      if (bot.applied) {
        try {
          localStorage.setItem(SETUP_DONE_KEY, '1');
        } catch { /* */ }
        onComplete?.();
      }

      setMessages(prev => [...prev, bot]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Setup chat failed', 'error');
      setMessages(prev => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          text: 'Something glitched on my side. Send that again — or describe your business in one sentence.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [
    input,
    loading,
    user?.businessId,
    messages,
    storeConfig,
    applyStoreUpdate,
    applyProduct,
    showToast,
    onComplete,
  ]);

  const markDoneAndPreview = () => {
    try {
      localStorage.setItem(SETUP_DONE_KEY, '1');
    } catch { /* */ }
    onComplete?.();
    if (storeConfig?.storeSlug) {
      window.open(`/store/${storeConfig.storeSlug}`, '_blank', 'noopener,noreferrer');
    } else {
      navigateTo('theme-editor');
    }
  };

  if (!open) {
    return (
      <button type="button" className={styles.launchCard} onClick={() => setOpen(true)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MO_AVATAR} alt="" className={styles.launchAvatar} />
        <div className={styles.launchBody}>
          <strong>Let MO build your store</strong>
          <span>Tell MO what you sell. It sets up your look and first product.</span>
        </div>
        <span className={styles.launchCta} aria-hidden>→</span>
      </button>
    );
  }

  const hasPreview = !!storeSlug;

  return (
    <section className={[styles.panel, hasPreview ? styles.panelWithPreview : ''].join(' ')}>
      <div className={styles.chatCol}>
        <header className={styles.panelHeader}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MO_AVATAR} alt="MO" className={styles.headerAvatar} />
          <div className={styles.headerText}>
            <h3 className={styles.panelTitle}>MO</h3>
            <p className={styles.panelSub}>
              <span className={styles.liveDot} aria-hidden />
              {loading ? 'Building your store…' : 'Your store builder'}
            </p>
          </div>
          {hasPreview && (
            <button
              type="button"
              className={styles.ghostBtn + ' ' + styles.previewToggle}
              onClick={() => setShowPreview(v => !v)}
            >
              {showPreview ? 'Chat' : 'Preview'}
            </button>
          )}
          <button type="button" className={styles.ghostBtn} onClick={() => setOpen(false)} aria-label="Minimise">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="6" y1="12" x2="18" y2="12" /></svg>
          </button>
        </header>

        <div className={[styles.thread, showPreview ? styles.hideOnMobile : ''].join(' ')} ref={threadRef}>
          {messages.map(m =>
            m.role === 'assistant' ? (
              <div key={m.id} className={styles.botRow}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={MO_AVATAR} alt="" className={styles.rowAvatar} />
                <div className={styles.botBody}>
                  <p className={styles.botText}>{m.text}</p>
                  {(m.applied || m.productCreated) && (
                    <div className={styles.chips}>
                      {m.applied && <span className={styles.chip}>✓ Store updated</span>}
                      {m.productCreated && <span className={styles.chip}>✓ Product added</span>}
                      {m.applied && (
                        <button type="button" className={styles.chipBtn} onClick={markDoneAndPreview}>
                          Open store ↗
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div key={m.id} className={styles.userRow}>
                <p className={styles.userBubble}>{m.text}</p>
              </div>
            ),
          )}
          {loading && (
            <div className={styles.botRow}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={MO_AVATAR} alt="" className={styles.rowAvatar} />
              <div className={styles.dots} aria-label="MO is typing"><span /><span /><span /></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {showPreview && hasPreview && (
          <div className={styles.mobilePreview}>
            <iframe key={previewKey} src={`/store/${storeSlug}`} title="Store preview" className={styles.previewFrame} />
          </div>
        )}

        <div className={styles.composer}>
          <textarea
            ref={inputRef}
            rows={1}
            className={styles.input}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Tell MO what you sell…"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            disabled={loading}
          />
          <div className={styles.composerBar}>
            <span className={styles.hint}>e.g. handmade soaps in Lagos</span>
            <button
              type="button"
              className={styles.sendBtn}
              onClick={send}
              disabled={loading || !input.trim()}
              aria-label="Send"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>
            </button>
          </div>
        </div>
      </div>

      {hasPreview && (
        <aside className={styles.previewCol} aria-label="Live store preview">
          <div className={styles.previewLabel}>
            <span className={styles.liveDot} aria-hidden /> Live preview
          </div>
          <div className={styles.phone}>
            <iframe key={previewKey} src={`/store/${storeSlug}`} title="Store preview" className={styles.previewFrame} />
            {loading && <div className={styles.previewShimmer} aria-hidden />}
          </div>
        </aside>
      )}
    </section>
  );
}

export function isAiSetupDone(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(SETUP_DONE_KEY) === '1';
  } catch {
    return false;
  }
}
