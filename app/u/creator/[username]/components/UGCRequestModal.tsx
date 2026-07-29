'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { X, Loader2, Check, FileText } from 'lucide-react';

interface UGCRequestModalProps {
  open: boolean;
  onClose: () => void;
  creatorId: string;
  creatorName: string;
  price30s: number;
  price60s: number;
  deliveryDays: number;
}

export function UGCRequestModal({ open, onClose, creatorId, creatorName, price30s, price60s, deliveryDays }: UGCRequestModalProps) {
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestCompany, setGuestCompany] = useState('');
  const [productName, setProductName] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [brief, setBrief] = useState('');
  const [letCreatorScript, setLetCreatorScript] = useState(false);
  const [videoLength, setVideoLength] = useState<'30s' | '60s'>('30s');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    if (open) {
      setStep('form');
      setError('');
      setSubmitting(false);
      setGuestName('');
      setGuestEmail('');
      setGuestCompany('');
      setProductName('');
      setProductUrl('');
      setBrief('');
      setLetCreatorScript(false);
      setVideoLength('30s');
      setDeadline('');
    }
  }, [open]);

  const selectedPrice = videoLength === '30s' ? price30s : price60s;
  const depositAmount = Math.round(selectedPrice * 0.5);

  const handleSubmit = useCallback(async () => {
    if (!guestName.trim() || !guestEmail.trim() || !productName.trim() || !brief.trim()) {
      setError('Please fill in name, email, product name, and brief');
      return;
    }
    if (!guestEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const body: Record<string, any> = {
        creatorId,
        creatorUsername: window.location.pathname.split('/').pop(),
        productName: productName.trim(),
        productUrl: productUrl.trim() || null,
        brief: brief.trim(),
        scriptByCreator: letCreatorScript,
        videoLength,
        deadline: deadline || null,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestCompany: guestCompany.trim() || null,
      };
      const res = await fetch('/api/ugc/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Request failed. Please try again.');
        setSubmitting(false);
        return;
      }
      if (data.paystackUrl) {
        setStep('payment');
        const popup = window.open(data.paystackUrl, '_blank');
        if (!popup) {
          window.location.href = data.paystackUrl;
        }
        const checkInterval = setInterval(async () => {
          try {
            const checkRes = await fetch(`/api/ugc/request/status?reference=${data.reference}`);
            const checkData = await checkRes.json();
            if (checkData.status === 'success') {
              clearInterval(checkInterval);
              setStep('success');
              setSubmitting(false);
            }
          } catch {}
        }, 3000);
        setTimeout(() => {
          clearInterval(checkInterval);
          setSubmitting(false);
          setStep('success');
        }, 120000);
      } else {
        setError('Payment initialization failed. Please try again.');
        setSubmitting(false);
      }
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  }, [guestName, guestEmail, guestCompany, productName, productUrl, brief, letCreatorScript, videoLength, deadline, creatorId]);

  if (!open) return null;

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 999,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24,
  };

  const modal: React.CSSProperties = {
    fontFamily: 'var(--font-jakarta), sans-serif',
    background: '#FFFFFF', borderRadius: 20, maxWidth: 520,
    width: '100%', maxHeight: '90dvh', overflow: 'auto',
    padding: 32, position: 'relative',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  };

  const label: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, color: '#374151',
    marginBottom: 6, display: 'block',
  };

  const input: React.CSSProperties = {
    fontFamily: 'var(--font-jakarta), sans-serif', fontSize: 14,
    padding: '9px 12px', borderRadius: 8,
    border: '1.5px solid #E5E7EB', background: '#FFFFFF',
    color: '#111827', outline: 'none', width: '100%',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  };

  const btnPrimary: React.CSSProperties = {
    width: '100%', padding: '13px 0',
    background: submitting ? '#9CA3AF' : '#0EA5E9',
    color: '#FFFFFF', border: 'none', borderRadius: 10,
    cursor: submitting ? 'not-allowed' : 'pointer',
    fontSize: 15, fontWeight: 600,
    fontFamily: 'var(--font-jakarta), sans-serif',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  };

  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          disabled={submitting}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
            padding: 6, borderRadius: 8, display: 'flex',
            color: '#9CA3AF',
          }}
        ><X size={18} /></button>

        {step === 'success' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: '#D1FAE5', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Check size={32} color="#059669" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: '#111827' }}>
              Request Sent!
            </h2>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 4px', lineHeight: 1.6 }}>
              Your request has been sent to {creatorName}.
            </p>
            <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
              They will review and respond within 24 hours.
            </p>
            <button
              onClick={onClose}
              style={{
                marginTop: 24, padding: '11px 32px',
                background: '#0EA5E9', color: '#FFFFFF',
                border: 'none', borderRadius: 10, cursor: 'pointer',
                fontSize: 14, fontWeight: 600,
                fontFamily: 'var(--font-jakarta), sans-serif',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#0284C7'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#0EA5E9'; }}
            >Done</button>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: '#111827' }}>
              Request Video from {creatorName}
            </h2>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 20px' }}>
              Fill in your details and what you need
            </p>

            {/* Price selector */}
            <div style={{
              display: 'flex', gap: 10, marginBottom: 20,
            }}>
              <button
                onClick={() => setVideoLength('30s')}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 10,
                  border: videoLength === '30s' ? '2px solid #0EA5E9' : '1.5px solid #E5E7EB',
                  background: videoLength === '30s' ? '#F0F9FF' : '#FFFFFF',
                  cursor: 'pointer', textAlign: 'center', fontFamily: 'var(--font-jakarta), sans-serif',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: videoLength === '30s' ? '#0369A1' : '#374151' }}>
                  30s Video
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: videoLength === '30s' ? '#0369A1' : '#111827', marginTop: 4 }}>
                  ₦{(price30s / 100).toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                  50% deposit: ₦{(Math.round(price30s * 0.5) / 100).toLocaleString()}
                </div>
              </button>
              <button
                onClick={() => setVideoLength('60s')}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 10,
                  border: videoLength === '60s' ? '2px solid #0EA5E9' : '1.5px solid #E5E7EB',
                  background: videoLength === '60s' ? '#F0F9FF' : '#FFFFFF',
                  cursor: 'pointer', textAlign: 'center', fontFamily: 'var(--font-jakarta), sans-serif',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: videoLength === '60s' ? '#0369A1' : '#374151' }}>
                  60s Video
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: videoLength === '60s' ? '#0369A1' : '#111827', marginTop: 4 }}>
                  ₦{(price60s / 100).toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                  50% deposit: ₦{(Math.round(price60s * 0.5) / 100).toLocaleString()}
                </div>
              </button>
            </div>

            {error && (
              <div style={{
                padding: 12, background: '#FEF2F2', borderRadius: 8,
                border: '1px solid #FECACA', marginBottom: 16,
                fontSize: 13, color: '#DC2626',
              }}>{error}</div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              {/* Guest fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={label}>Your Name *</label>
                  <input
                    style={input} placeholder="Your full name"
                    value={guestName} onChange={(e) => setGuestName(e.target.value)}
                    disabled={submitting}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#0EA5E9'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
                  />
                </div>
                <div>
                  <label style={label}>Email *</label>
                  <input
                    style={input} placeholder="you@example.com"
                    type="email" value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    disabled={submitting}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#0EA5E9'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={label}>Company <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optional)</span></label>
                <input
                  style={input} placeholder="Your brand or company name"
                  value={guestCompany} onChange={(e) => setGuestCompany(e.target.value)}
                  disabled={submitting}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#0EA5E9'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
                />
              </div>

              {/* Product Name */}
              <div style={{ marginBottom: 12 }}>
                <label style={label}>Product Name *</label>
                <input
                  style={input} placeholder="e.g. Organic Skincare Set"
                  value={productName} onChange={(e) => setProductName(e.target.value)}
                  disabled={submitting}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#0EA5E9'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
                />
              </div>

              {/* Product URL */}
              <div style={{ marginBottom: 12 }}>
                <label style={label}>Product URL <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optional)</span></label>
                <input
                  style={input} placeholder="https://yourstore.com/product"
                  value={productUrl} onChange={(e) => setProductUrl(e.target.value)}
                  disabled={submitting}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#0EA5E9'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
                />
              </div>

              {/* Brief */}
              <div style={{ marginBottom: 12 }}>
                <label style={label}>Brief *</label>
                <textarea
                  style={{ ...input, resize: 'vertical', minHeight: 80, lineHeight: 1.5 }}
                  placeholder="Describe your brand, product, and the type of content you want..."
                  value={brief} onChange={(e) => setBrief(e.target.value)}
                  rows={4} disabled={submitting}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#0EA5E9'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
                />
              </div>

              {/* Let creator propose script */}
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  id="let-script"
                  checked={letCreatorScript}
                  onChange={(e) => setLetCreatorScript(e.target.checked)}
                  disabled={submitting}
                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#0EA5E9' }}
                />
                <label htmlFor="let-script" style={{ fontSize: 13, color: '#6B7280', cursor: 'pointer' }}>
                  Let the creator propose a script
                </label>
              </div>

              {/* Deadline */}
              <div style={{ marginBottom: 24 }}>
                <label style={label}>Deadline <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optional)</span></label>
                <input
                  type="date" style={input}
                  value={deadline} onChange={(e) => setDeadline(e.target.value)}
                  disabled={submitting}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#0EA5E9'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
                />
              </div>

              {/* Submit */}
              <button type="submit" disabled={submitting} style={btnPrimary}
                onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = '#0284C7'; }}
                onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = '#0EA5E9'; }}
              >
                {submitting ? (
                  <><Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Processing...</>
                ) : (
                  <><FileText size={16} /> Submit Request &middot; Pay 50% Deposit (₦{(depositAmount / 100).toLocaleString()})</>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
