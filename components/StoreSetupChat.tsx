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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
        <div className={styles.launchIcon}>✦</div>
        <div className={styles.launchBody}>
          <strong>Build your store with MO</strong>
          <span>Chat what you sell — MO picks the theme, branding, and a starter product for you.</span>
        </div>
        <span className={styles.launchCta}>Start chat →</span>
      </button>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Store setup with MO</h3>
          <p className={styles.panelSub}>Conversational — no template picker</p>
        </div>
        <button type="button" className={styles.collapseBtn} onClick={() => setOpen(false)} aria-label="Collapse">
          −
        </button>
      </div>

      <div className={styles.thread}>
        {messages.map(m => (
          <div
            key={m.id}
            className={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleBot].join(' ')}
          >
            <p className={styles.bubbleText}>{m.text}</p>
            {m.applied && <div className={styles.flag}>Store updated</div>}
            {m.productCreated && <div className={styles.flag}>Product added</div>}
            {m.storeUpdate && m.applied && (
              <button type="button" className={styles.previewBtn} onClick={markDoneAndPreview}>
                Preview store →
              </button>
            )}
          </div>
        ))}
        {loading && <div className={styles.typing}>MO is building…</div>}
        <div ref={bottomRef} />
      </div>

      <div className={styles.composer}>
        <input
          className={styles.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="e.g. I sell handmade soaps in Lagos"
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          disabled={loading}
        />
        <button type="button" className={styles.sendBtn} onClick={send} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>
    </div>
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
