'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Sparkles, X, Loader2, ArrowUpRight, Info } from 'lucide-react';
import { useBrandWorkspace } from './BrandWorkspaceProvider';
import { useToast } from '@/components/brand/ToastProvider';
import { creatorInitial, formatDate, formatKobo } from './shared';
import styles from '../brand-studio.module.css';

interface CreatorOption {
  id: string;
  userId?: string;
  username?: string;
  displayName?: string;
  name?: string;
  avatarUrl?: string;
  niches?: string[];
  price30s?: number;
  price60s?: number;
  rating?: number;
  [key: string]: any;
}

export function CreateBriefModal() {
  const { briefModalOpen, setBriefModalOpen, briefPrefill, setBriefPrefill, createBrief } = useBrandWorkspace();
  const { showSuccess, showError, showInfo } = useToast();
  const [creators, setCreators] = useState<CreatorOption[]>([]);
  const [loadingCreators, setLoadingCreators] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CreatorOption | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    productName: '', productUrl: '', brief: '', deliverables: '',
    deadline: '', videoLength: '30s', bidAmount: '',
  });
  const [paymentReference, setPaymentReference] = useState<string | null>(null);

  useEffect(() => {
    if (!briefModalOpen) return;
    let active = true;
    setLoadingCreators(true);
    fetch('/api/ugc/creators')
      .then((r) => r.json())
      .then((data) => { if (active) setCreators(data.creators ?? []); })
      .catch(() => { if (active) showError('Could not load creators'); })
      .finally(() => { if (active) setLoadingCreators(false); });
    return () => { active = false; };
  }, [briefModalOpen, showError]);

  useEffect(() => {
    if (!briefModalOpen || !briefPrefill) return;
    setSelected(briefPrefill);
  }, [briefModalOpen, briefPrefill]);

  useEffect(() => {
    if (!paymentReference) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/ugc/request/status?reference=${encodeURIComponent(paymentReference)}`);
        const data = await res.json();
        if (data.status === 'success') {
          showSuccess('Deposit confirmed — your creator can start work now.');
          setPaymentReference(null);
          setBriefModalOpen(false);
          reset();
        }
      } catch { /* polling continues */ }
    }, 3500);
    return () => clearInterval(timer);
  }, [paymentReference, setBriefModalOpen, showSuccess]);

  const filteredCreators = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return creators.slice(0, 12);
    return creators.filter((c) =>
      [c.displayName, c.name, c.username, ...(c.niches ?? [])]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    ).slice(0, 20);
  }, [creators, search]);

  function reset() {
    setSelected(null);
    setBriefPrefill(null);
    setForm({ productName: '', productUrl: '', brief: '', deliverables: '', deadline: '', videoLength: '30s', bidAmount: '' });
    setSearch('');
  }

  function close() {
    if (submitting) return;
    setBriefModalOpen(false);
    setBriefPrefill(null);
  }

  const basePrice = selected ? (form.videoLength === '60s' ? selected.price60s : selected.price30s) ?? 0 : 0;
  const agreedPrice = form.bidAmount ? Math.round(Number(form.bidAmount) * 100) : basePrice;
  const deposit = Math.floor(agreedPrice / 2);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return showError('Choose a creator first');
    if (!form.productName.trim() || !form.brief.trim() || !form.deliverables.trim()) {
      return showError('Product, brief and deliverables are required');
    }
    setSubmitting(true);
    try {
      const result = await createBrief({
        creatorId: selected.id,
        creatorUsername: selected.username ?? undefined,
        productName: form.productName.trim(),
        productUrl: form.productUrl.trim() || undefined,
        brief: form.brief.trim(),
        deliverables: form.deliverables.trim(),
        deadline: form.deadline || undefined,
        videoLength: form.videoLength,
        bidAmount: form.bidAmount ? Number(form.bidAmount) : undefined,
      });
      showSuccess('Brief sent to your creator.');
      if (result.paystackUrl) {
        showInfo('Complete the 50% deposit to start the collaboration.');
        window.open(result.paystackUrl, '_blank', 'noopener,noreferrer');
        setPaymentReference(result.reference ?? null);
      } else {
        setBriefModalOpen(false);
        reset();
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Could not send brief');
    } finally {
      setSubmitting(false);
    }
  }

  if (!briefModalOpen) return null;

  return (
    <div className={styles.backdrop} onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <motion.div
        className={`${styles.modal} ${styles.modalWide}`}
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        <div className={styles.modalHead}>
          <div>
            <div className={styles.pageEyebrow}><Sparkles size={12} /> New collaboration</div>
            <h2 className={styles.modalTitle}>Send a creative brief</h2>
            <p className={styles.modalSub}>Pick a creator, describe the story you want told, and fund the first half upfront. The rest is paid after you approve the draft.</p>
          </div>
          <button className={styles.iconButton} onClick={close} aria-label="Close"><X size={17} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.field} style={{ marginBottom: 16 }}>
              <label className={styles.label}>Choose a creator <span className={styles.required}>*</span></label>
              <div className={styles.topSearch} style={{ margin: 0, width: '100%' }}>
                <Search size={15} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search creators or niches" />
              </div>
              <div className={styles.creatorList}>
                {loadingCreators && (
                  <div className={styles.infoStrip}><Loader2 size={15} className={styles.spinner} /> Loading creators…</div>
                )}
                {!loadingCreators && filteredCreators.length === 0 && (
                  <div className={styles.infoStrip}><Info size={15} /> No creators match that search.</div>
                )}
                {filteredCreators.map((creator) => {
                  const active = selected?.id === creator.id;
                  return (
                    <button
                      type="button"
                      key={creator.id}
                      className={`${styles.creatorOption} ${active ? styles.creatorOptionActive : ''}`}
                      onClick={() => setSelected(creator)}
                    >
                      <span className={styles.avatarCell}>{creatorInitial(creator.displayName || creator.name)}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span className={styles.reviewName} style={{ display: 'block' }}>
                          {creator.displayName || creator.name || creator.username || 'Creator'}
                        </span>
                        <span className={styles.videoCardSub}>
                          @{creator.username || 'creator'}
                          {creator.niches?.length ? ` · ${creator.niches.slice(0, 2).join(', ')}` : ''}
                        </span>
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 750, color: 'var(--bs-success)' }}>
                        {formatKobo(creator.price30s)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Product / campaign <span className={styles.required}>*</span></label>
                <input className={styles.input} value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} placeholder="e.g. Summer skincare launch" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Product link</label>
                <input className={styles.input} value={form.productUrl} onChange={(e) => setForm({ ...form, productUrl: e.target.value })} placeholder="https://…" />
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label}>The brief <span className={styles.required}>*</span></label>
                <textarea className={styles.textarea} value={form.brief} onChange={(e) => setForm({ ...form, brief: e.target.value })} placeholder="What should the video feel like? Who is it for? What must be said on camera?" />
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label}>Deliverables <span className={styles.required}>*</span></label>
                <input className={styles.input} value={form.deliverables} onChange={(e) => setForm({ ...form, deliverables: e.target.value })} placeholder="e.g. 1x 30s vertical video, raw footage, 2 revisions" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Deadline</label>
                <input className={styles.input} type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Video length</label>
                <select className={styles.select} value={form.videoLength} onChange={(e) => setForm({ ...form, videoLength: e.target.value })}>
                  <option value="30s">30 seconds</option>
                  <option value="60s">60 seconds</option>
                </select>
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label}>Custom offer <span className={styles.helper}>(optional, in NGN)</span></label>
                <input className={styles.input} type="number" min="0" value={form.bidAmount} onChange={(e) => setForm({ ...form, bidAmount: e.target.value })} placeholder={basePrice ? String(basePrice / 100) : 'Creator rate'} />
                <span className={styles.helper}>
                  {agreedPrice > 0
                    ? `${formatKobo(agreedPrice)} total · ${formatKobo(deposit)} deposit due now · ${formatKobo(agreedPrice - deposit)} after draft approval`
                    : 'Select a creator to see their rate.'}
                </span>
              </div>
            </div>

            <div className={styles.infoStrip} style={{ marginTop: 16 }}>
              <Info size={15} />
              <span>Your brief appears instantly in the creator’s dashboard. They accept or decline it, then submit a draft for your review. = {selected ? `Sending to @${selected.username || 'creator'}.` : 'Choose a creator to continue.'}</span>
            </div>
          </div>

          <div className={styles.modalFoot}>
            <button type="button" className={styles.ghostButton} onClick={close}>Cancel</button>
            <button type="submit" className={styles.primaryButton} disabled={submitting || !selected}>
              {submitting ? <Loader2 size={15} className={styles.spinner} /> : <ArrowUpRight size={15} />}
              {submitting ? 'Sending…' : `Send brief · ${formatKobo(deposit)} deposit`}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
