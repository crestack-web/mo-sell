'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSell } from '@/context/SellContext';
import { doc, updateDoc, getDoc, setDoc, deleteDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import { EbookPreviewModal } from '@/app/store-components/EbookPreviewModal';
import styles from './SellAskMoPage.module.css';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Attachment {
  id: string;
  type: 'image' | 'audio' | 'file';
  name: string;
  data: string;
  mimeType: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  attachments?: Attachment[];
  storeUpdate?: Record<string, unknown> | null;
  newProduct?: Record<string, unknown> | null;
  editProduct?: Record<string, unknown> | null;
  applied?: boolean;
  productCreated?: boolean;
  showPreview?: boolean;
}

interface Conversation {
  id: string;
  preview: string;
  messageCount: number;
  createdAt: number;
  updatedAt: number;
}

interface Suggestion {
  icon: string;
  label: string;
  message: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SUGGESTIONS: Suggestion[] = [
  { icon: '✏️', label: 'Change store name', message: 'Change my store name to ' },
  { icon: '🎨', label: 'Update colors', message: 'Change my store colors to something more vibrant' },
  { icon: '📦', label: 'Create a product', message: 'Create a digital product for my store' },
  { icon: '📚', label: 'Create an ebook', message: 'Create an ebook product for my store' },
  { icon: '💡', label: 'Collection ideas', message: 'Suggest some collection names for my store' },
  { icon: '🏷️', label: 'Update tagline', message: 'Change my store tagline to something catchy' },
];

const MO_AVATAR = 'https://res.cloudinary.com/dzjoqbg2u/image/upload/v1784793259/mo_sell_chat_ucbw3x.png';

// ─── Helpers ─────────────────────────────────────────────────────────────────

let msgIdCounter = 0;
function nextMsgId(): string {
  return `msg_${Date.now()}_${++msgIdCounter}`;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getConvCollection(userId: string) {
  const { firestore } = initializeFirebase();
  return collection(firestore, 'businesses', userId, 'aiConversations');
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SellAskMoPage() {
  const { storeConfig, user, showToast } = useSell();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<
    { role: 'user' | 'model'; parts: { text: string }[] }[]
  >([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadedRef = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  const historyRef = useRef<{ role: 'user' | 'model'; parts: { text: string }[] }[]>([]);
  const [previewEbook, setPreviewEbook] = useState<{ url: string; title: string } | null>(null);

  // Keep refs in sync
  messagesRef.current = messages;
  historyRef.current = conversationHistory;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  // ── File picker ────────────────────────────────────────────────────────

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const file = files[0];
    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showToast('File too large. Maximum size is 20 MB.', 'error');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const data = (reader.result as string).split(',')[1];
      const type: 'image' | 'audio' | 'file' = file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'file';
      setAttachments(prev => [...prev, { id: nextMsgId(), type, name: file.name, data, mimeType: file.type }]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [showToast]);

  // ── Voice recording ────────────────────────────────────────────────────

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;
      recordingChunksRef.current = [];
      setRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordingChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        setRecording(false);
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
        const blob = new Blob(recordingChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onload = () => {
          const data = (reader.result as string).split(',')[1];
          setAttachments(prev => [...prev, { id: nextMsgId(), type: 'audio', name: 'Voice note.webm', data, mimeType: 'audio/webm' }]);
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
    } catch {
      showToast('Microphone access denied', 'error');
    }
  }, [showToast]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  }, []);

  // ── Load active conversation from Firestore ────────────────────────────

  useEffect(() => {
    if (!user?.businessId || loadedRef.current) return;
    loadedRef.current = true;

    (async () => {
      try {
        const convRef = doc(getConvCollection(user.businessId!), 'active');
        const snap = await getDoc(convRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.messages?.length) {
            setMessages(data.messages);
            setConversationHistory(data.conversationHistory ?? []);
            setActiveConvId('active');
          }
        }
      } catch {
        // Start fresh
      }
    })();
  }, [user?.businessId]);

  // ── Save active conversation ───────────────────────────────────────────

  const saveActive = useCallback(
    async (msgs: ChatMessage[], hist: { role: 'user' | 'model'; parts: { text: string }[] }[]) => {
      if (!user?.businessId || msgs.length === 0) return;
      try {
        const convRef = doc(getConvCollection(user.businessId), 'active');
        await setDoc(convRef, {
          messages: msgs,
          conversationHistory: hist,
          updatedAt: Date.now(),
        }, { merge: true });
      } catch (e) { console.error('Ask MO save failed:', e); }
    },
    [user?.businessId]
  );

  // Auto-save (debounced)
  useEffect(() => {
    if (!loadedRef.current || messages.length === 0) return;
    const t = setTimeout(() => saveActive(messages, conversationHistory), 500);
    return () => clearTimeout(t);
  }, [messages, conversationHistory, saveActive]);

  // Save on visibility change (tab switch, minimize, navigation)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && messagesRef.current.length > 0) {
        saveActive(messagesRef.current, historyRef.current);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [saveActive]);

  // Save immediately on unmount so navigating away doesn't lose messages
  useEffect(() => {
    return () => {
      if (messagesRef.current.length > 0) {
        saveActive(messagesRef.current, historyRef.current);
      }
    };
  }, [saveActive]);

  // ── Load conversation history list ─────────────────────────────────────

  const loadHistory = useCallback(async () => {
    if (!user?.businessId) return;
    setHistoryLoading(true);
    try {
      const q = query(
        getConvCollection(user.businessId),
        orderBy('updatedAt', 'desc'),
        limit(50)
      );
      const snap = await getDocs(q);
      const list: Conversation[] = [];
      snap.forEach(d => {
        if (d.id === 'active') return;
        const data = d.data();
        list.push({
          id: d.id,
          preview: data.preview ?? data.messages?.[0]?.text?.slice(0, 60) ?? 'Empty conversation',
          messageCount: data.messages?.length ?? 0,
          createdAt: data.createdAt ?? data.updatedAt ?? 0,
          updatedAt: data.updatedAt ?? 0,
        });
      });
      setConversations(list);
    } catch { /* silent */ }
    setHistoryLoading(false);
  }, [user?.businessId]);

  useEffect(() => {
    if (historyOpen) loadHistory();
  }, [historyOpen, loadHistory]);

  // ── Load a past conversation ───────────────────────────────────────────

  const loadConversation = useCallback(
    async (convId: string) => {
      if (!user?.businessId) return;
      try {
        // Save current as history first
        if (messagesRef.current.length > 0) {
          const currentRef = doc(getConvCollection(user.businessId), 'current-' + Date.now());
          await setDoc(currentRef, {
            messages: messagesRef.current,
            conversationHistory: historyRef.current,
            preview: messagesRef.current.find(m => m.role === 'user')?.text?.slice(0, 60) ?? '',
            createdAt: historyRef.current[0] ? Date.now() : Date.now(),
            updatedAt: Date.now(),
          });
        }

        const snap = await getDoc(doc(getConvCollection(user.businessId), convId));
        if (snap.exists()) {
          const data = snap.data();
          setMessages(data.messages ?? []);
          setConversationHistory(data.conversationHistory ?? []);
          setActiveConvId(convId);
          setHistoryOpen(false);
        }
      } catch {
        showToast('Failed to load conversation', 'error');
      }
    },
    [user?.businessId, showToast]
  );

  // ── New chat ───────────────────────────────────────────────────────────

  const handleNewChat = useCallback(async () => {
    // Archive current conversation if it has messages
    if (user?.businessId && messagesRef.current.length > 0) {
      try {
        const archiveRef = doc(getConvCollection(user.businessId), 'archive-' + Date.now());
        await setDoc(archiveRef, {
          messages: messagesRef.current,
          conversationHistory: historyRef.current,
          preview: messagesRef.current.find(m => m.role === 'user')?.text?.slice(0, 60) ?? '',
          createdAt: historyRef.current.length > 0 ? Date.now() : Date.now(),
          updatedAt: Date.now(),
        });
        // Clear active
        const activeRef = doc(getConvCollection(user.businessId), 'active');
        await setDoc(activeRef, { messages: [], conversationHistory: [], updatedAt: Date.now() }, { merge: true });
      } catch { /* silent */ }
    }
    setMessages([]);
    setConversationHistory([]);
    setActiveConvId(null);
    setInput('');
    setAttachments([]);
  }, [user?.businessId]);

  // ── Delete a past conversation ─────────────────────────────────────────

  const deleteConversation = useCallback(
    async (convId: string) => {
      if (!user?.businessId) return;
      try {
        await deleteDoc(doc(getConvCollection(user.businessId), convId));
        setConversations(prev => prev.filter(c => c.id !== convId));
        showToast('Conversation deleted', 'info');
      } catch { /* silent */ }
    },
    [user?.businessId, showToast]
  );

  // ── Send message ───────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      const hasAttachments = attachments.length > 0;
      if (!text.trim() && !hasAttachments) return;
      if (!user?.businessId) {
        showToast('Business ID not found. Please try again.', 'error');
        return;
      }

      const messageText = text.trim();
      const currentAttachments = [...attachments];
      const userMsg: ChatMessage = { id: nextMsgId(), role: 'user', text: messageText, attachments: currentAttachments };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setAttachments([]);
      setLoading(true);

      const userHistoryEntry = { role: 'user' as const, parts: [{ text: messageText || '(attachment)' }] };

      try {
        const res = await fetch('/api/sell/ask-mo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: messageText,
            attachments: currentAttachments,
            businessId: user.businessId,
            storeConfig: storeConfig ?? null,
            conversationHistory: conversationHistory,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.details || 'Failed to get response');

        // proposedProduct = ebook content for inline review (not yet created)
        const productToShow = data.proposedProduct ?? data.newProduct ?? null;

        const botMsg: ChatMessage = {
          id: nextMsgId(),
          role: 'bot',
          text: data.answer,
          storeUpdate: data.storeUpdate ?? null,
          newProduct: productToShow,
          editProduct: data.editProduct ?? null,
          showPreview: !!(data.storeUpdate || productToShow || data.editProduct),
        };

        // If an editProduct was returned for an existing product, find original and update
        if (data.editProduct && data.editProduct.id) {
          setMessages(prev => {
            const updated = [...prev];
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].newProduct && (updated[i].newProduct as any).id === data.editProduct.id) {
                updated[i] = { ...updated[i], newProduct: data.editProduct, showPreview: true };
                break;
              }
            }
            updated.push(botMsg);
            return updated;
          });
        } else {
          setMessages(prev => [...prev, botMsg]);
        }
        setConversationHistory(prev => [
          ...prev,
          userHistoryEntry,
          { role: 'model', parts: [{ text: data.answer }] },
        ]);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Something went wrong';
        setMessages(prev => [
          ...prev,
          { id: nextMsgId(), role: 'bot', text: `Sorry, I couldn't process that. ${errMsg}` },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, user, storeConfig, conversationHistory, attachments, showToast]
  );

  // ── Apply store update ─────────────────────────────────────────────────

  const applyStoreUpdate = useCallback(
    async (update: Record<string, unknown>, messageId: string) => {
      if (!user?.businessId) return;
      try {
        const { firestore } = initializeFirebase();
        const cfgRef = doc(firestore, 'businesses', user.businessId, 'store', 'config');
        const fieldsToUpdate: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(update)) {
          if (value !== null && value !== undefined && value !== '') fieldsToUpdate[key] = value;
        }
        if (Object.keys(fieldsToUpdate).length === 0) { showToast('No changes to apply', 'info'); return; }
        await updateDoc(cfgRef, fieldsToUpdate);
        setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, applied: true } : msg));
        showToast('Store updated successfully!', 'success');
      } catch (err) {
        showToast(`Failed to update store: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      }
    },
    [user, showToast]
  );

  // ── Mark product created ───────────────────────────────────────────────

  const markProductCreated = useCallback((messageId: string) => {
    setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, productCreated: true } : msg));
    showToast('Product is now live in your store!', 'success');
  }, [showToast]);

  // ── Approve proposed product (generate PDF + create in Firestore) ──────

  const approveProduct = useCallback(
    async (msgId: string, productData: Record<string, unknown>) => {
      if (!user?.businessId) return;
      setLoading(true);
      try {
        const res = await fetch('/api/sell/ask-mo', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId: user.businessId,
            storeConfig: storeConfig ?? null,
            productData,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || data.details || 'Approval failed');

        // Update the message with the created product (now has id + digitalFileUrl)
        // Do NOT set productCreated yet — user must click "Looks Good" or "Publish to Store"
        setMessages(prev => prev.map(msg => {
          if (msg.id === msgId) {
            return {
              ...msg,
              newProduct: { ...productData, ...data.product },
            };
          }
          return msg;
        }));

        showToast('Ebook created successfully! Preview it below.', 'success');
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Failed to approve product';
        showToast(errMsg, 'error');
      } finally {
        setLoading(false);
      }
    },
    [user?.businessId, storeConfig, showToast]
  );

  // ── Open product PDF in new tab ───────────────────────────────────────

  const openProductPdf = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  // ── Make product public ───────────────────────────────────────────────

  const publishProduct = useCallback(async (messageId: string, productId: string) => {
    if (!user?.businessId) return;
    try {
      const { firestore } = initializeFirebase();
      const productRef = doc(firestore, 'businesses', user.businessId, 'storeProducts', productId);
      await updateDoc(productRef, { available: true, featured: true });
      setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, productCreated: true } : msg));
      showToast('Product is now public in your store!', 'success');
    } catch {
      showToast('Failed to publish product.', 'error');
    }
  }, [user?.businessId, showToast]);

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleSuggestion = useCallback((s: Suggestion) => sendMessage(s.message), [sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
    },
    [input, sendMessage]
  );

  const autoResize = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, []);

  const showWelcome = messages.length === 0 && !loading;

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      {/* ── Main Chat ── */}
      <div className={styles.chatContainer}>
        {/* ── Chat Header ── */}
        <div className={styles.chatHeader}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MO_AVATAR} alt="MO" className={styles.headerAvatar} />
          <div className={styles.headerInfo}>
            <span className={styles.headerName}>MO</span>
            <span className={styles.headerStatus}>AI Commerce Assistant</span>
          </div>
          <div className={styles.headerActions}>
            <button
              className={styles.headerBtn}
              onClick={() => setHistoryOpen(true)}
              title="Chat history"
              aria-label="Open chat history"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span className={styles.headerBtnLabel}>History</span>
            </button>
            <div className={styles.headerDivider} />
            <button
              className={styles.headerBtn}
              onClick={handleNewChat}
              title="Start new conversation"
              aria-label="New chat"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span className={styles.headerBtnLabel}>New</span>
            </button>
          </div>
        </div>

        {/* ── Messages Area ── */}
        <div className={styles.messagesArea}>
          {showWelcome ? (
            <div className={styles.welcomeState}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={MO_AVATAR} alt="MO" className={styles.moAvatar} />
              <h2 className={styles.welcomeTitle}>Hey! I&apos;m MO</h2>
              <p className={styles.welcomeSubtitle}>
                Your AI commerce assistant. I can help you edit your store, create digital products,
                and grow your business. What do you need?
              </p>
              <div className={styles.suggestions}>
                {SUGGESTIONS.map((s) => (
                  <button key={s.label} className={styles.suggestionChip} onClick={() => handleSuggestion(s)}>
                    <span className={styles.suggestionIcon}>{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id} className={`${styles.messageRow} ${styles[msg.role]}`}>
                  {msg.role === 'bot' && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={MO_AVATAR} alt="MO" className={styles.botAvatar} />
                  )}
                    <div className={styles.messageContent}>
                      <div className={styles.messageBubble}>
                        {msg.attachments?.map(a => (
                          <div key={a.id} className={styles.attachmentPreview}>
                            {a.type === 'image' ? (
                              <img src={`data:${a.mimeType};base64,${a.data}`} alt={a.name} className={styles.attachmentImage} />
                            ) : a.type === 'audio' ? (
                              <audio controls src={`data:${a.mimeType};base64,${a.data}`} className={styles.attachmentAudio} />
                            ) : (
                              <div className={styles.attachmentFile}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                {a.name}
                              </div>
                            )}
                          </div>
                        ))}
                        {msg.text}
                      </div>

                    {/* ── Store Update Card ── */}
                    {msg.storeUpdate && !isAllNull(msg.storeUpdate) && (
                      <div className={styles.actionCard}>
                        <div className={styles.actionCardHeader}>
                          <span className={styles.actionCardIcon}>✏️</span>
                          Store Update
                        </div>
                        <div className={styles.actionCardBody}>
                          {Object.entries(msg.storeUpdate)
                            .filter(([, v]) => v !== null && v !== undefined)
                            .map(([key, value]) => (
                              <div key={key} className={styles.actionCardRow}>
                                <span className={styles.actionCardLabel}>{formatLabel(key)}</span>
                                <span className={styles.actionCardValue}>{formatValue(key, value)}</span>
                              </div>
                            ))}
                        </div>
                        <div className={styles.actionCardFooter}>
                          {msg.applied ? (
                            <span className={styles.appliedLabel}>✓ Applied</span>
                          ) : (
                            <>
                              <button className={`${styles.confirmBtn} ${styles.confirmBtnPrimary}`} onClick={() => applyStoreUpdate(msg.storeUpdate!, msg.id)}>Apply Changes</button>
                              <button className={`${styles.confirmBtn} ${styles.confirmBtnSecondary}`} onClick={() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, storeUpdate: null } : m))}>Dismiss</button>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── New Product Card ── */}
                    {msg.newProduct && (
                      <div className={styles.actionCard}>
                        <div className={styles.actionCardHeader}>
                          <span className={styles.actionCardIcon}>📦</span>
                          {msg.editProduct ? 'Updated Product' : 'New Product'}
                        </div>
                        <div className={styles.actionCardBody}>
                          <div className={styles.actionCardRow}><span className={styles.actionCardLabel}>Name</span><span className={styles.actionCardValue}>{String(msg.newProduct.displayName)}</span></div>
                          <div className={styles.actionCardRow}><span className={styles.actionCardLabel}>Type</span><span className={styles.actionCardValue}>{String(msg.newProduct.digitalSubtype || msg.newProduct.productType)}</span></div>
                          <div className={styles.actionCardRow}><span className={styles.actionCardLabel}>Price</span><span className={styles.actionCardValue}>₦{Number(msg.newProduct.price).toLocaleString()}</span></div>
                          {msg.newProduct.category ? <div className={styles.actionCardRow}><span className={styles.actionCardLabel}>Category</span><span className={styles.actionCardValue}>{String(msg.newProduct.category)}</span></div> : null}
                          {msg.newProduct.description ? (
                            <div style={{ fontSize: '11.5px', color: 'var(--sell-text-muted, #6b7280)', lineHeight: 1.5, marginTop: 4 }}>
                              {String(msg.newProduct.description)}
                            </div>
                          ) : null}

                          {/* ── Scrollable Ebook Content (proposal mode) ── */}
                          {!msg.newProduct.digitalFileUrl && (msg.newProduct as any).pdfContent?.chapters && (
                            <>
                              <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: 'var(--sell-text, #1a1a1a)' }}>
                                📄 {((msg.newProduct as any).pdfContent.chapters as any[]).length} Chapters
                                {' '}·{' '}
                                ✍️ ~{((msg.newProduct as any).pdfContent.chapters as any[]).reduce((sum: number, ch: any) => sum + (ch.body?.split(/\s+/).length || 0), 0).toLocaleString()} words
                              </div>
                              <div className={styles.ebookContent}>
                                {((msg.newProduct as any).pdfContent.chapters as any[]).map((ch: any, i: number) => (
                                  <div key={i} className={styles.ebookChapter}>
                                    <div className={styles.ebookChapterNum}>CHAPTER {i + 1}</div>
                                    <div className={styles.ebookChapterHeading}>{ch.heading}</div>
                                    <div className={styles.ebookChapterBody}>{ch.body}</div>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}

                          {/* ── Post-approval: Preview / Download / Publish ── */}
                          {msg.newProduct?.digitalFileUrl && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                              <button
                                onClick={() => setPreviewEbook({ url: String(msg.newProduct!.digitalFileUrl), title: String(msg.newProduct!.displayName || 'Ebook Preview') })}
                                className={styles.previewBtn}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                </svg>
                                Preview ebook
                              </button>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                  onClick={() => openProductPdf(String(msg.newProduct!.digitalFileUrl))}
                                  className={`${styles.confirmBtn} ${styles.confirmBtnSecondary}`}
                                  style={{ flex: 1 }}
                                >
                                  ⬇ Open PDF
                                </button>
                                {(msg.newProduct as any).id && !msg.productCreated && (
                                  <button
                                    onClick={() => publishProduct(msg.id, String(msg.newProduct!.id))}
                                    className={`${styles.confirmBtn} ${styles.confirmBtnPrimary}`}
                                    style={{ flex: 1 }}
                                  >
                                    🌐 Publish to Store
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className={styles.actionCardFooter}>
                          {msg.productCreated && msg.newProduct?.digitalFileUrl ? (
                            <span className={styles.appliedLabel}>✓ Product live in your store</span>
                          ) : msg.newProduct?.digitalFileUrl ? (
                            <>
                              <button
                                className={`${styles.confirmBtn} ${styles.confirmBtnPrimary}`}
                                onClick={() => markProductCreated(msg.id)}
                              >
                                ✓ Looks Good
                              </button>
                              <button
                                className={`${styles.confirmBtn} ${styles.confirmBtnSecondary}`}
                                onClick={() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, newProduct: null } : m))}
                              >
                                Dismiss
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className={`${styles.confirmBtn} ${styles.confirmBtnPrimary}`}
                                onClick={() => approveProduct(msg.id, msg.newProduct as Record<string, unknown>)}
                                disabled={loading}
                              >
                                ✓ Looks Good
                              </button>
                              <button
                                className={`${styles.confirmBtn} ${styles.confirmBtnSecondary}`}
                                onClick={() => {
                                  const name = String(msg.newProduct?.displayName || 'the product');
                                  setInput(`I want to tweak ${name} — `);
                                  inputRef.current?.focus();
                                }}
                              >
                                ✏️ Tweak
                              </button>
                              <button
                                className={`${styles.confirmBtn} ${styles.confirmBtnSecondary}`}
                                onClick={() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, newProduct: null } : m))}
                              >
                                Dismiss
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className={`${styles.messageRow} ${styles.bot}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={MO_AVATAR} alt="MO" className={styles.botAvatar} />
                  <div className={styles.typingDots}>
                    <div className={styles.typingDot} />
                    <div className={styles.typingDot} />
                    <div className={styles.typingDot} />
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Area ── */}
        <div className={styles.inputArea}>
          {attachments.length > 0 && (
            <div className={styles.attachmentBar}>
              {attachments.map(a => (
                <div key={a.id} className={styles.attachmentChip}>
                  {a.type === 'image' && <span className={styles.attachmentChipIcon}>🖼️</span>}
                  {a.type === 'audio' && <span className={styles.attachmentChipIcon}>🎤</span>}
                  {a.type === 'file' && <span className={styles.attachmentChipIcon}>📎</span>}
                  <span className={styles.attachmentChipName}>{a.name}</span>
                  <button className={styles.attachmentChipRemove} onClick={() => removeAttachment(a.id)} aria-label="Remove attachment">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className={styles.inputWrapper}>
            <button
              className={styles.actionBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              aria-label="Attach file or image"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
              </svg>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*,audio/*,.pdf,.doc,.docx,.txt,.csv" className={styles.hiddenInput} onChange={handleFileSelect} />
            <button
              className={`${styles.actionBtn} ${recording ? styles.actionBtnActive : ''}`}
              onClick={recording ? stopRecording : startRecording}
              disabled={loading}
              aria-label={recording ? 'Stop recording' : 'Record voice'}
            >
              {recording ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                  <path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              )}
            </button>
            {recording && (
              <span className={styles.recordingBadge}>
                <span className={styles.recordingDot} />
                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
              </span>
            )}
            <textarea
              ref={inputRef}
              className={styles.inputField}
              placeholder="Ask MO anything about your store..."
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
            />
            <button
              className={styles.sendBtn}
              onClick={() => sendMessage(input)}
              disabled={(!input.trim() && attachments.length === 0) || loading}
              aria-label="Send message"
            >
              <svg className={styles.sendBtnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          <p className={styles.inputHint}>MO can update your store and create products. Always review changes before publishing.</p>
        </div>
      </div>

      {/* ── History Panel (after chat so z-index wins) ── */}
      {historyOpen && (
        <>
          <div className={styles.historyBackdrop} onClick={() => setHistoryOpen(false)} />
          <div className={`${styles.historyPanel} ${styles.historyPanelOpen}`}>
            <div className={styles.historyHeader}>
              <span className={styles.historyTitle}>Chat History</span>
              <button className={styles.historyClose} onClick={() => setHistoryOpen(false)} aria-label="Close history">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className={styles.historyList}>
              {historyLoading && <p className={styles.historyEmpty}>Loading...</p>}
              {!historyLoading && conversations.length === 0 && (
                <p className={styles.historyEmpty}>No past conversations yet.</p>
              )}
              {conversations.map(c => (
                <div key={c.id} className={styles.historyItem} onClick={() => loadConversation(c.id)}>
                  <div className={styles.historyItemContent}>
                    <p className={styles.historyItemPreview}>{c.preview}</p>
                    <p className={styles.historyItemMeta}>{c.messageCount} messages · {timeAgo(c.updatedAt)}</p>
                  </div>
                  <button
                    className={styles.historyItemDelete}
                    onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                    aria-label="Delete conversation"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Ebook preview modal */}
      <EbookPreviewModal
        open={!!previewEbook}
        onClose={() => setPreviewEbook(null)}
        fileUrl={previewEbook?.url ?? ''}
        title={previewEbook?.title ?? ''}
        accentColor="var(--sell-accent, #6366f1)"
      />
    </div>
  );
}

// ─── Utility functions ───────────────────────────────────────────────────────

function isAllNull(obj: Record<string, unknown>): boolean {
  return Object.values(obj).every(v => v === null || v === undefined);
}

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ');
}

function formatValue(key: string, value: unknown): React.ReactNode {
  if (key === 'primaryColor' || key === 'secondaryColor') {
    const hex = String(value);
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 3, background: hex, border: '1px solid rgba(0,0,0,0.1)' }} />
        {hex}
      </span>
    );
  }
  return String(value ?? '');
}
