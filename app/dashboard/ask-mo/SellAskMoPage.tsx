'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSell } from '@/context/SellContext';
import { getDatabase } from '@/lib/database/adapter';
import { EbookPreviewModal } from '@/app/store-components/EbookPreviewModal';
import styles from './SellAskMoPage.module.css';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TokenData {
  balance: number;
  costs: { chat: number; chatWithMedia: number; ebookCreate: number; ebookEdit: number };
}

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
  pdf?: { title?: string; url?: string | null; dataUrl?: string | null; pageCount?: number } | null;
  needsTokens?: boolean;
  applied?: boolean;
  approved?: boolean;
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

interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  price: number;
  popular?: boolean;
}

const TOKEN_PACKAGES: TokenPackage[] = [
  { id: 'starter', name: 'Starter Pack', tokens: 1_000, price: 5_000 },
  { id: 'standard', name: 'Standard Pack', tokens: 3_000, price: 12_000, popular: true },
  { id: 'pro', name: 'Pro Pack', tokens: 10_000, price: 30_000 },
  { id: 'enterprise', name: 'Enterprise Pack', tokens: 25_000, price: 60_000 },
];

const PDF_TOKEN_COST = 500;

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

// MO character SVG component
function MOAvatar({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          {/* eslint-disable-next-line */}
          {`
          /* Head tilts left-right while thinking */
          #mo-head {
            transform-origin: 40px 58px;
            animation: headTilt 1.8s ease-in-out infinite;
          }
          @keyframes headTilt {
            0%   { transform: rotate(0deg); }
            20%  { transform: rotate(-8deg); }
            50%  { transform: rotate(7deg); }
            80%  { transform: rotate(-5deg); }
            100% { transform: rotate(0deg); }
          }

          /* Eyes look left then right */
          #eye-left {
            animation: eyeLeft 1.8s ease-in-out infinite;
          }
          #eye-right {
            animation: eyeRight 1.8s ease-in-out infinite;
          }
          @keyframes eyeLeft {
            0%,100% { transform: translate(0,0); }
            20%     { transform: translate(-1.5px, 0.5px); }
            50%     { transform: translate(1.5px, 0px); }
            80%     { transform: translate(-1px, 0px); }
          }
          @keyframes eyeRight {
            0%,100% { transform: translate(0,0); }
            20%     { transform: translate(-1.5px, 0.5px); }
            50%     { transform: translate(1.5px, 0px); }
            80%     { transform: translate(-1px, 0px); }
          }

          /* Thinking dots float up and fade */
          #dot1 { animation: floatDot 1.8s ease-in-out infinite 0s; }
          #dot2 { animation: floatDot 1.8s ease-in-out infinite 0.3s; }
          #dot3 { animation: floatDot 1.8s ease-in-out infinite 0.6s; }
          @keyframes floatDot {
            0%   { transform: translateY(0px); opacity: 0; }
            20%  { opacity: 1; }
            70%  { transform: translateY(-8px); opacity: 0.9; }
            100% { transform: translateY(-14px); opacity: 0; }
          }

          /* Mouth changes to a small "hmm" flat line while thinking */
          #mo-mouth {
            animation: mouthThink 1.8s ease-in-out infinite;
          }
          @keyframes mouthThink {
            0%,100% { d: path("M30 43 Q40 50 50 43"); }
            30%,70% { d: path("M32 45 Q40 45 48 45"); }
          }

          /* Cheek blush pulses */
          #blush-left, #blush-right {
            animation: blushPulse 1.8s ease-in-out infinite;
          }
          @keyframes blushPulse {
            0%,100% { opacity: 0.35; }
            50%     { opacity: 0.6; }
          }
          `}
        </style>
      </defs>

      {/* Background circle */}
      <circle cx="40" cy="40" r="38" fill="#162334"/>

      {/* Thinking dots above head */}
      <circle id="dot1" cx="55" cy="18" r="2" fill="#1DB954"/>
      <circle id="dot2" cx="61" cy="13" r="2.5" fill="#1DB954"/>
      <circle id="dot3" cx="68" cy="7" r="3" fill="#1DB954"/>

      {/* Head group (everything that tilts) */}
      <g id="mo-head">
        {/* Face */}
        <circle cx="40" cy="37" r="21" fill="#F5C9A0"/>

        {/* Hair */}
        <path d="M19 33 C19 19 61 19 61 33 L61 26 C61 14 19 14 19 26 Z" fill="#2C1A0E"/>

        {/* Eye whites + irises */}
        <ellipse cx="31" cy="36" rx="4" ry="4.5" fill="#1A2B3C"/>
        <ellipse cx="49" cy="36" rx="4" ry="4.5" fill="#1A2B3C"/>

        {/* Eye glints (move with eye animation) */}
        <g id="eye-left">
          <circle cx="32.5" cy="34.5" r="1.5" fill="white"/>
        </g>
        <g id="eye-right">
          <circle cx="50.5" cy="34.5" r="1.5" fill="white"/>
        </g>

        {/* Cheek blush */}
        <ellipse id="blush-left"  cx="23" cy="41" rx="4" ry="2.5" fill="#F4A535" opacity="0.35"/>
        <ellipse id="blush-right" cx="57" cy="41" rx="4" ry="2.5" fill="#F4A535" opacity="0.35"/>

        {/* Mouth */}
        <path id="mo-mouth" d="M30 43 Q40 50 50 43" stroke="#CC7A3A" strokeWidth="2" strokeLinecap="round" fill="none"/>
      </g>

      {/* Body (stays still) */}
      <ellipse cx="40" cy="65" rx="16" ry="7" fill="#1DB954" opacity="0.9"/>
      <rect x="32" y="58" width="16" height="9" rx="5" fill="#F5C9A0"/>
      <polygon points="36,58 44,58 42,66 38,66" fill="#1DB954"/>
    </svg>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CURRENCY_SYMBOL: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  GHS: 'GH₵',
  KES: 'KSh',
  ZAR: 'R',
  UGX: 'USh',
  TZS: 'TSh',
  XOF: 'FCFA',
  XAF: 'FCFA',
};

function currencySymbol(currency?: string | null): string {
  return CURRENCY_SYMBOL[(currency || 'NGN').toUpperCase()] || '₦';
}

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

// Conversations are stored in the dedicated ai_conversations table (one row per
// conversation, scoped by businessId). The old Firestore-style subcollection
// path ('businesses/{userId}/aiConversations') mapped to a table name that
// never existed in Postgres, so history never persisted.
function getConvDoc(convId: string) {
  return getDatabase().collection('ai_conversations').doc(convId);
}

function getConvQuery(businessId: string) {
  return getDatabase().collection('ai_conversations').where('businessId', '==', businessId);
}

// Tracks which conversation to restore on the next visit (id = businessId).
function getConvMetaDoc(businessId: string) {
  return getDatabase().collection('ai_conversation_meta').doc(businessId);
}

function newConvId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Surface chat-history persistence failures once per session instead of
// swallowing them (a missing ai_conversations table fails silently otherwise).
let chatPersistWarned = false;
function warnChatPersist(showToast: (message: string, type?: 'error' | 'success' | 'info') => void): void {
  if (chatPersistWarned) return;
  chatPersistWarned = true;
  showToast('Chat history failed to save. Please report this.', 'error');
}

// Strip large base64 payloads before persisting so a single document never
// exceeds the 1 MB Firestore limit (which silently dropped whole conversations).
function sanitizeMessagesForSave(msgs: ChatMessage[]): ChatMessage[] {
  return msgs.map(m => ({
    ...m,
    attachments: m.attachments?.map(a => (a.data ? { ...a, data: '' } : a)),
    pdf: m.pdf ? { ...m.pdf, dataUrl: m.pdf.dataUrl ? '' : m.pdf.dataUrl } : m.pdf,
  }));
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
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [buyingPackage, setBuyingPackage] = useState<string | null>(null);
  const [convId, setConvId] = useState<string | null>(null);
  const convIdRef = useRef<string | null>(null);
  const createdAtRef = useRef<number>(0);


  // ── Fetch token data ──
  const fetchTokenData = useCallback(async () => {
    if (!user?.businessId) return;
    try {
      const res = await fetch(`/api/sell/ask-mo/tokens?businessId=${user.businessId}`);
      if (res.ok) {
        const data = await res.json();
        setTokenData(data);
      }
    } catch { /* non-fatal */ }
  }, [user?.businessId]);

  useEffect(() => {
    fetchTokenData();
  }, [fetchTokenData]);

  // ── Buy tokens (Paystack) ────────────────────────────────────────────────

  const handleBuyTokens = useCallback(async (packageId: string) => {
    if (!user?.businessId || !user.email) {
      showToast('Account details missing. Please try again.', 'error');
      return;
    }
    setBuyingPackage(packageId);
    try {
      const res = await fetch('/api/sell/ask-mo/tokens/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: user.businessId, packageId, email: user.email }),
      });
      const data = await res.json();
      if (!res.ok || !data.paystackUrl) {
        throw new Error(data.error || 'Failed to start purchase');
      }
      window.location.href = data.paystackUrl;
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Purchase failed', 'error');
      setBuyingPackage(null);
    }
  }, [user?.businessId, user?.email, showToast]);

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
      const ext = mimeType === 'audio/webm' ? 'webm' : 'm4a';
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
        if (recordingChunksRef.current.length === 0) return;
        const blob = new Blob(recordingChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onload = () => {
          const data = (reader.result as string).split(',')[1];
          if (!data) return;
          setAttachments(prev => [...prev, { id: nextMsgId(), type: 'audio', name: `Voice note.${ext}`, data, mimeType }]);
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
      console.log('[AskMo] Recording started, mimeType:', mimeType);
    } catch (err) {
      console.error('[AskMo] Mic error:', err);
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
        // The meta doc points at the currently-open conversation so the last
        // chat is restored on the next visit.
        const metaSnap = await getConvMetaDoc(user.businessId!).get();
        const activeConvId = metaSnap.exists ? (metaSnap.data()?.activeConvId ?? null) : null;
        if (activeConvId) {
          const snap = await getConvDoc(activeConvId).get();
          if (snap.exists) {
            const data = snap.data();
            if (data.messages?.length) {
              setMessages(data.messages);
              setConversationHistory(data.conversationHistory ?? []);
              convIdRef.current = activeConvId;
              createdAtRef.current = data.createdAt ?? Date.now();
              setConvId(activeConvId);
            }
          }
        }
      } catch (e) {
        console.error('Ask MO load failed:', e);
        warnChatPersist(showToast);
      }
    })();
  }, [user?.businessId, showToast]);

  // ── Save active conversation ───────────────────────────────────────────

  const saveConversation = useCallback(
    async (msgs: ChatMessage[], hist: { role: 'user' | 'model'; parts: { text: string }[] }[], id?: string | null) => {
      const convIdToSave = id ?? convIdRef.current;
      if (!user?.businessId || !convIdToSave || msgs.length === 0) return;
      try {
        await getConvDoc(convIdToSave).set({
          businessId: user.businessId,
          messages: sanitizeMessagesForSave(msgs),
          conversationHistory: hist,
          preview: msgs.find(m => m.role === 'user')?.text?.slice(0, 80) ?? '',
          createdAt: createdAtRef.current || Date.now(),
          updatedAt: Date.now(),
        }, { merge: true });
        // Remember which conversation to restore on next visit.
        await getConvMetaDoc(user.businessId).set({ activeConvId: convIdToSave, updatedAt: Date.now() }, { merge: true });
      } catch (e) {
        console.error('Ask MO save failed:', e);
        warnChatPersist(showToast);
      }
    },
    [user?.businessId, showToast]
  );

  // Auto-save (debounced)
  useEffect(() => {
    if (!loadedRef.current || messages.length === 0) return;
    const t = setTimeout(() => saveConversation(messages, conversationHistory), 500);
    return () => clearTimeout(t);
  }, [messages, conversationHistory, saveConversation]);

  // Save on visibility change (tab switch, minimize, navigation)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && messagesRef.current.length > 0) {
        saveConversation(messagesRef.current, historyRef.current);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [saveConversation]);

  // Save immediately on unmount so navigating away doesn't lose messages
  useEffect(() => {
    return () => {
      if (messagesRef.current.length > 0) {
        saveConversation(messagesRef.current, historyRef.current);
      }
    };
  }, [saveConversation]);

  // ── Load conversation history list ─────────────────────────────────────

  const loadHistory = useCallback(async () => {
    if (!user?.businessId) return;
    setHistoryLoading(true);
    try {
      const snap = await getConvQuery(user.businessId).limit(100).get();
      const list: Conversation[] = [];
      snap.docs.forEach(d => {
        const data = d.data();
        if (!data.messages?.length) return;
        list.push({
          id: d.id,
          preview: data.preview ?? data.messages?.[0]?.text?.slice(0, 60) ?? 'Empty conversation',
          messageCount: data.messages?.length ?? 0,
          createdAt: data.createdAt ?? data.updatedAt ?? 0,
          updatedAt: data.updatedAt ?? 0,
        });
      });
      list.sort((a, b) => b.updatedAt - a.updatedAt);
      setConversations(list);
    } catch { /* silent */ }
    setHistoryLoading(false);
  }, [user?.businessId]);

  useEffect(() => {
    if (historyOpen) loadHistory();
  }, [historyOpen, loadHistory]);

  // ── Load a past conversation ───────────────────────────────────────────

  const loadConversation = useCallback(
    async (convIdToLoad: string) => {
      if (!user?.businessId) return;
      try {
        const snap = await getConvDoc(convIdToLoad).get();
        if (snap.exists) {
          const data = snap.data();
          setMessages(data.messages ?? []);
          setConversationHistory(data.conversationHistory ?? []);
          convIdRef.current = convIdToLoad;
          createdAtRef.current = data.createdAt ?? Date.now();
          setConvId(convIdToLoad);
          await getConvMetaDoc(user.businessId).set({ activeConvId: convIdToLoad, updatedAt: Date.now() }, { merge: true });
          setHistoryOpen(false);
        } else {
          showToast('Conversation not found', 'error');
        }
      } catch {
        showToast('Failed to load conversation', 'error');
      }
    },
    [user?.businessId, showToast]
  );

  // ── New chat ───────────────────────────────────────────────────────────

  const handleNewChat = useCallback(async () => {
    // Point the meta doc at no conversation so the next visit starts fresh.
    // The previous conversation is already saved as its own history entry.
    if (user?.businessId) {
      try {
        await getConvMetaDoc(user.businessId).set(
          { activeConvId: null, updatedAt: Date.now() },
          { merge: true },
        );
      } catch { /* silent */ }
    }
    convIdRef.current = null;
    createdAtRef.current = 0;
    setConvId(null);
    setMessages([]);
    setConversationHistory([]);
    setInput('');
    setAttachments([]);
  }, [user?.businessId]);

  // ── Delete a past conversation ─────────────────────────────────────────

  const deleteConversation = useCallback(
    async (convIdToDelete: string) => {
      if (!user?.businessId) return;
      try {
        await getConvDoc(convIdToDelete).delete();
        if (convIdToDelete === convIdRef.current) {
          convIdRef.current = null;
          createdAtRef.current = 0;
          setConvId(null);
          setMessages([]);
          setConversationHistory([]);
          await getConvMetaDoc(user.businessId).set(
            { activeConvId: null, updatedAt: Date.now() },
            { merge: true },
          );
        }
        setConversations(prev => prev.filter(c => c.id !== convIdToDelete));
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
      const userHistoryEntry = { role: 'user' as const, parts: [{ text: messageText || '(attachment)' }] };

      // Start a conversation doc on the first message so the chat is saved to
      // history even if the user navigates away before the debounced save.
      if (!convIdRef.current) {
        convIdRef.current = newConvId();
        createdAtRef.current = Date.now();
      }
      const cid = convIdRef.current;
      setConvId(cid);
      const nextMessages = [...messagesRef.current, userMsg];
      const nextHistory = [...historyRef.current, userHistoryEntry];
      saveConversation(nextMessages, nextHistory, cid);

      setMessages(nextMessages);
      setInput('');
      setAttachments([]);
      setLoading(true);

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
        if (!res.ok) {
          throw new Error(data.error || data.details || 'Failed to get response');
        }

        if (data.purchaseRequired) {
          showToast('PDF & ebook creation needs Ask MO tokens. Buy tokens to continue.', 'info');
          setTokenModalOpen(true);
        }

        // Refresh token balance
        fetchTokenData();

        // proposedProduct = ebook content for inline review (not yet created)
        const productToShow = data.proposedProduct ?? data.newProduct ?? null;

        // Use the raw response for conversation history so the AI retains
        // full context (including JSON blocks) on follow-up turns
        const historyText = data.raw || data.answer;

        const botMsg: ChatMessage = {
          id: nextMsgId(),
          role: 'bot',
          text: data.answer,
          storeUpdate: data.storeUpdate ?? null,
          newProduct: productToShow,
          editProduct: data.editProduct ?? null,
          pdf: data.pdf ?? null,
          needsTokens: !!data.pdfBlocked,
          showPreview: !!(data.storeUpdate || productToShow || data.editProduct || data.pdf || data.pdfBlocked),
        };

        setMessages(prev => {
          const updated = [...prev];

          // If an editProduct was returned for an existing product, update the original card
          if (data.editProduct && data.editProduct.id) {
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].newProduct && (updated[i].newProduct as any).id === data.editProduct.id) {
                updated[i] = { ...updated[i], newProduct: data.editProduct, showPreview: true };
                break;
              }
            }
          }

          // If a proposedProduct came back (tweak to a pre-approval proposal),
          // update the last message that had a proposal with pdfContent
          if (data.proposedProduct) {
            for (let i = updated.length - 1; i >= 0; i--) {
              const existing = updated[i].newProduct as any;
              if (existing?.pdfContent?.chapters?.length && !existing.digitalFileUrl) {
                updated[i] = { ...updated[i], newProduct: data.proposedProduct, showPreview: true };
                break;
              }
            }
          }

          updated.push(botMsg);
          return updated;
        });

        setConversationHistory(prev => [
          ...prev,
          userHistoryEntry,
          { role: 'model', parts: [{ text: historyText }] },
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
    [loading, user, storeConfig, conversationHistory, attachments, showToast, tokenData, fetchTokenData, saveConversation]
  );

  // ── Apply store update ─────────────────────────────────────────────────

  const applyStoreUpdate = useCallback(
    async (update: Record<string, unknown>, messageId: string) => {
      if (!user?.businessId) return;
      try {
        const db = getDatabase();
        const cfgRef = db.doc(`businesses/${user.businessId}/store/config`);
        const fieldsToUpdate: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(update)) {
          if (value !== null && value !== undefined && value !== '') fieldsToUpdate[key] = value;
        }
        if (Object.keys(fieldsToUpdate).length === 0) { showToast('No changes to apply', 'info'); return; }
        await cfgRef.update(fieldsToUpdate);
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
        const data = await res.json().catch(() => null);
        if (!data || !res.ok || !data.success) {
          throw new Error((data && (data.error || data.details)) || 'Approval failed');
        }

        // Update the message with the created product (now has id + digitalFileUrl)
        // Do NOT set productCreated yet — user must click "Looks Good" or "Publish to Store"
        setMessages(prev => prev.map(msg => {
          if (msg.id === msgId) {
            return {
              ...msg,
              approved: true,
              newProduct: { ...productData, ...data.product },
            };
          }
          return msg;
        }));

        showToast('Product created successfully! Preview it below.', 'success');
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
      const db = getDatabase();
      const productRef = db.doc(`businesses/${user.businessId}/storeProducts/${productId}`);
      await productRef.update({ available: true, featured: true });
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
          <MOAvatar size={40} />
          <div className={styles.headerInfo}>
            <span className={styles.headerName}>MO</span>
            <span className={styles.headerStatus}>AI Commerce Assistant</span>
          </div>
          {tokenData && (
            <button
              className={styles.tokenBadge}
              onClick={() => setTokenModalOpen(true)}
              title={`${tokenData.balance} tokens remaining · click to buy`}
              style={{ border: 'none', font: 'inherit' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v12"/><path d="M9 9h4a2 2 0 010 4H9"/>
              </svg>
              <span className={styles.tokenBalance}>{tokenData.balance}</span>
              <span className={styles.tokenBuyHint}>+ Buy</span>
            </button>
          )}
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
              <MOAvatar size={60} />
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
                    <MOAvatar size={32} />
                  )}
                    <div className={styles.messageContent}>
                      <div className={styles.messageBubble}>
                        {msg.attachments?.map(a => (
                          <div key={a.id} className={styles.attachmentPreview}>
                            {a.type === 'image' && a.data ? (
                              <img src={`data:${a.mimeType};base64,${a.data}`} alt={a.name} className={styles.attachmentImage} />
                            ) : a.type === 'audio' && a.data ? (
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

                    {/* ── Designed PDF Ebook Card ── */}
                    {msg.pdf && (
                      <div className={styles.actionCard}>
                        <div className={styles.actionCardHeader}>
                          <span className={styles.actionCardIcon}>📕</span>
                          Designed PDF Ebook
                        </div>
                        <div className={styles.actionCardBody}>
                          {msg.pdf.title && (
                            <div className={styles.actionCardRow}><span className={styles.actionCardLabel}>Title</span><span className={styles.actionCardValue}>{msg.pdf.title}</span></div>
                          )}
                          {msg.pdf.pageCount && (
                            <div className={styles.actionCardRow}><span className={styles.actionCardLabel}>Pages</span><span className={styles.actionCardValue}>{msg.pdf.pageCount} pages · colorful design</span></div>
                          )}
                          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <a
                              href={msg.pdf.url ?? msg.pdf.dataUrl ?? '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${styles.confirmBtn} ${styles.confirmBtnPrimary}`}
                              style={{ flex: 1, textAlign: 'center' }}
                            >
                              ⬇ Download PDF
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Tokens Required Card ── */}
                    {msg.needsTokens && (
                      <div className={styles.actionCard}>
                        <div className={styles.actionCardHeader}>
                          <span className={styles.actionCardIcon}>🪙</span>
                          Tokens Required
                        </div>
                        <div className={styles.actionCardBody}>
                          <div className={styles.actionCardRow}><span className={styles.actionCardLabel}>Cost per PDF</span><span className={styles.actionCardValue}>{PDF_TOKEN_COST} tokens</span></div>
                          <div className={styles.actionCardRow}><span className={styles.actionCardLabel}>Your balance</span><span className={styles.actionCardValue}>{tokenData?.balance ?? 0} tokens</span></div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <button
                              className={`${styles.confirmBtn} ${styles.confirmBtnPrimary}`}
                              style={{ flex: 1 }}
                              onClick={() => setTokenModalOpen(true)}
                            >
                              🪙 Buy tokens
                            </button>
                          </div>
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
                          <div className={styles.actionCardRow}><span className={styles.actionCardLabel}>Price</span><span className={styles.actionCardValue}>{currencySymbol(typeof msg.newProduct.currency === 'string' ? msg.newProduct.currency : null)}{Number(msg.newProduct.price).toLocaleString()}</span></div>
                          {msg.newProduct.category ? <div className={styles.actionCardRow}><span className={styles.actionCardLabel}>Category</span><span className={styles.actionCardValue}>{String(msg.newProduct.category)}</span></div> : null}
                          {(msg.newProduct.productType === 'physical' && msg.newProduct.stock != null) ? <div className={styles.actionCardRow}><span className={styles.actionCardLabel}>Stock</span><span className={styles.actionCardValue}>{String(msg.newProduct.stock)}</span></div> : null}
                          {msg.newProduct.sku ? <div className={styles.actionCardRow}><span className={styles.actionCardLabel}>SKU</span><span className={styles.actionCardValue}>{String(msg.newProduct.sku)}</span></div> : null}
                          {msg.newProduct.deliveryNote ? (
                            <div className={styles.actionCardRow}><span className={styles.actionCardLabel}>Delivery note</span><span className={styles.actionCardValue}>{String(msg.newProduct.deliveryNote)}</span></div>
                          ) : null}
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
                          {msg.productCreated ? (
                            <span className={styles.appliedLabel}>✓ Product live in your store</span>
                          ) : (msg.approved || (msg.newProduct as any)?.id || msg.newProduct?.digitalFileUrl) ? (
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
                  <MOAvatar size={32} />
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
          <div className={styles.inputFooter}>
            <p className={styles.inputHint}>MO can update your store and create products. Always review changes before publishing.</p>
            {tokenData && (
              <span className={styles.tokenCost} title={`Chat: ${tokenData.costs.chat} tokens, with media: ${tokenData.costs.chatWithMedia}, ebook: ${tokenData.costs.ebookCreate} | Balance: ${tokenData.balance}`}>
                {attachments.length > 0 ? tokenData.costs.chatWithMedia : tokenData.costs.chat} tok
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── History Panel ── */}
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

      {/* ── Token Purchase Modal ── */}
      {tokenModalOpen && (
        <div className={styles.tokenModalBackdrop} onClick={() => setTokenModalOpen(false)}>
          <div className={styles.tokenModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.tokenModalHeader}>
              <span className={styles.tokenModalTitle}>Buy Ask MO Tokens</span>
              <button className={styles.tokenModalClose} onClick={() => setTokenModalOpen(false)} aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className={styles.tokenModalBody}>
              <p className={styles.tokenModalSubtitle}>
                PDF &amp; ebook creation costs {PDF_TOKEN_COST} tokens per file. Your balance: <b>{tokenData?.balance ?? 0}</b>.
              </p>
              <div className={styles.tokenPackages}>
                {TOKEN_PACKAGES.map(pkg => (
                  <div key={pkg.id} className={`${styles.tokenPackage} ${pkg.popular ? styles.tokenPackagePopular : ''}`}>
                    <div className={styles.tokenPackageName}>{pkg.name}{pkg.popular ? <span className={styles.tokenPackageTag}>Popular</span> : null}</div>
                    <div className={styles.tokenPackageTokens}>{pkg.tokens.toLocaleString()} tokens</div>
                    <div className={styles.tokenPackagePrice}>₦{pkg.price.toLocaleString()}</div>
                    <button
                      className={`${styles.confirmBtn} ${styles.confirmBtnPrimary}`}
                      style={{ width: '100%', justifyContent: 'center' }}
                      disabled={buyingPackage === pkg.id}
                      onClick={() => handleBuyTokens(pkg.id)}
                    >
                      {buyingPackage === pkg.id ? 'Redirecting…' : 'Buy'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
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
