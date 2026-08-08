'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

const C = {
  primary: '#0EA5E9',
  accent: '#6366F1',
  bg: '#F0F9FF',
  surface: '#FFFFFF',
  border: '#E0EFFA',
  text1: '#0C1A2E',
  text2: '#3D5A7A',
  text3: '#8AAABF',
};

const FONT_BODY = "'Plus Jakarta Sans',system-ui,sans-serif";
const FONT_DISPLAY = "'Clash Display','Plus Jakarta Sans',sans-serif";
const WHATSAPP_NUMBER = '+2349124559388';

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

const SUGGESTIONS = [
  'How do I set up my store?',
  'How do I create a product?',
  'How do I receive payments?',
  'How do I customise my theme?',
];

const MO_AVATAR = '🤖';

// MO character SVG component
function MOIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="36" fill="url(#moGradient)"/>
      <circle cx="28" cy="35" r="5" fill="white"/>
      <circle cx="52" cy="35" r="5" fill="white"/>
      <path d="M30 52Q40 60 50 52" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      <defs>
        <linearGradient id="moGradient" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0EA5E9"/>
          <stop offset="1" stopColor="#6366F1"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

let msgCounter = 0;
const nextId = () => `sc_${Date.now()}_${++msgCounter}`;

export function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [inited, setInited] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<{ role: 'user' | 'model'; parts: { text: string }[] }[]>([]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    if (!inited) {
      setInited(true);
    }
  }, [inited]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    setShowWelcome(false);
    const trimmed = text.trim();
    const userMsg: Message = { id: nextId(), role: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const userHistoryEntry = { role: 'user' as const, parts: [{ text: trimmed }] };

    try {
      const res = await fetch('/api/support-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          conversationHistory: historyRef.current,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get response');

      const botMsg: Message = { id: nextId(), role: 'bot', text: data.answer };
      setMessages(prev => [...prev, botMsg]);
      historyRef.current = [
        ...historyRef.current,
        userHistoryEntry,
        { role: 'model', parts: [{ text: data.answer }] },
      ];
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Something went wrong';
      setMessages(prev => [
        ...prev,
        { id: nextId(), role: 'bot', text: `Sorry, I couldn't process that. ${errMsg}` },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=Hi%20MO%20Sell%20Support%2C%20I%20need%20help%20with`;

  const hasMessages = messages.length > 0;

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 9999,
          width: 56,
          height: 56,
          borderRadius: 28,
          border: 'none',
          background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`,
          color: 'white',
          cursor: 'pointer',
          boxShadow: '0 6px 24px rgba(14,165,233,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        aria-label={open ? 'Close support chat' : 'Open support chat'}
      >
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <MOIcon size={28} />
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 88,
            right: 20,
            zIndex: 9999,
            width: 380,
            maxHeight: 600,
            background: C.surface,
            borderRadius: 18,
            border: `1px solid ${C.border}`,
            boxShadow: '0 16px 48px rgba(12,26,46,0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: FONT_BODY,
            animation: 'scFadeIn 0.25s ease',
            transformOrigin: 'bottom right',
          }}
        >
          <div style={{
            background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MOIcon size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 15, fontFamily: FONT_DISPLAY }}>
                MO Support
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: '#4ADE80' }} />
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>Online</span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: 8,
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
              }}
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 14px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            minHeight: 200,
            maxHeight: 380,
            background: C.bg,
          }}>
            {!hasMessages && showWelcome && (
              <div style={{
                textAlign: 'center',
                padding: '20px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}>
                <div style={{ fontSize: 36 }}>👋</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: C.text1, fontFamily: FONT_DISPLAY }}>
                  Need help with MO Sell?
                </div>
                <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.5, maxWidth: 280 }}>
                  Ask me anything about setting up your store, creating products, payments, or any other support question.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', marginTop: 8 }}>
                  {SUGGESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 10,
                        border: `1px solid ${C.border}`,
                        background: C.surface,
                        color: C.text1,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: FONT_BODY,
                        transition: 'border-color 0.15s',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} style={{
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              }}>
                {msg.role === 'bot' && (
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem',
                  }}>
                    {MO_AVATAR}
                  </div>
                )}
                <div style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: 14,
                  fontSize: 13,
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                  ...(msg.role === 'user' ? {
                    background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                    color: 'white',
                    borderTopRightRadius: 4,
                  } : {
                    background: C.surface,
                    color: C.text1,
                    border: `1px solid ${C.border}`,
                    borderTopLeftRadius: 4,
                  }),
                }}>
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '0.75rem' }}>{MO_AVATAR}</span>
                </div>
                <div style={{
                  display: 'flex', gap: 3,
                  padding: '10px 14px',
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  borderTopLeftRadius: 4,
                }}>
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: C.text3,
                        animation: 'scPulse 1s ease-in-out infinite',
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div style={{
            padding: '10px 14px 14px',
            borderTop: `1px solid ${C.border}`,
            background: C.surface,
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                rows={1}
                disabled={loading}
                style={{
                  flex: 1,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontSize: 13,
                  fontFamily: FONT_BODY,
                  color: C.text1,
                  background: C.bg,
                  resize: 'none',
                  outline: 'none',
                  minHeight: 40,
                  lineHeight: 1.4,
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  border: 'none',
                  background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  opacity: !input.trim() || loading ? 0.5 : 1,
                  transition: 'opacity 0.15s',
                }}
                aria-label="Send message"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 10,
                padding: '10px 14px',
                borderRadius: 10,
                background: '#25D366',
                color: 'white',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 700,
                fontFamily: FONT_BODY,
                transition: 'opacity 0.2s',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.57 24l6.305-1.654a11.882 11.882 0 005.176 1.174h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Chat with support on WhatsApp
            </a>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scFadeIn {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes scPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </>
  );
}
