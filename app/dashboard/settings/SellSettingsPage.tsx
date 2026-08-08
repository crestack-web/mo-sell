'use client';

import React, { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import { getDatabase } from '@/lib/database/adapter';
import { getStorage } from '@/lib/storage/adapter';
import { supabaseClient } from '@/lib/supabase-client';
import { useSell } from '@/context/SellContext';

import styles from './SellSettingsPage.module.css';

const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR'];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 30);
}

export function SellSettingsPage() {
  const { user, storeConfig, refreshStoreConfig, showToast, navigateTo } = useSell();

  // Form state mirroring storeConfig
  const [storeName, setStoreName]           = useState('');
  const [storeSlug, setStoreSlug]           = useState('');
  const [primaryColor, setPrimary]          = useState('#0EA5E9');
  const [secondaryColor, setSecondary]      = useState('#6366F1');
  const [currency, setCurrency]             = useState('NGN');
  const [contactEmail, setEmail]            = useState('');
  const [contactPhone, setPhone]            = useState('');
  const [paystackPublicKey, setPaystackKey] = useState('');
  const [payoutBankName, setPayoutBankName]         = useState('');
  const [payoutBankCode, setPayoutBankCode]          = useState('');
  const [payoutAccountNumber, setPayoutAccountNum]  = useState('');
  const [payoutAccountName, setPayoutAccountName]   = useState('');
  const [useOwnPaystack, setUseOwnPaystack]         = useState(false);
  const [paystackSecretKey, setPaystackSecretKey]   = useState('');
  const [banks, setBanks] = useState<{ code: string; name: string }[]>([]);
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [customDomain, setCustomDomain]     = useState('');
  const [logoUrl, setLogoUrl]               = useState<string | null>(null);
  const [imageFile, setImageFile]           = useState<File | null>(null);
  const [imagePreview, setImagePreview]     = useState<string | null>(null);

  const [saving, setSaving]                 = useState(false);
  const [verifying, setVerifying]           = useState(false);
  const [dirty, setDirty]                   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const currencySym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : currency + ' ';
  const fmtEarnings = (n: number) => `${currencySym}${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const [earningsStats, setEarningsStats] = useState<{ totalGross: number; totalCommission: number; totalNet: number; available: number } | null>(null);
  const [loadingEarnings, setLoadingEarnings] = useState(false);

  const managedPayments = (storeConfig as any)?.managedPayments === true;

  useEffect(() => {
    if (!user?.businessId || !managedPayments) { setEarningsStats(null); return; }
    let cancelled = false;
    setLoadingEarnings(true);
    (async () => {
      try {
        const db = getDatabase();
        const snap = await db.collection(`businesses/${user.businessId}/storeEarnings`).limit(1000).get();
        const earnings = snap.docs.map(d => ({ ...d.data() as any, createdAt: new Date(d.data().createdAt || Date.now()) }));
        if (cancelled) return;
        setEarningsStats({
          totalGross:      earnings.reduce((s: number, e: any) => s + (e.grossAmount ?? 0), 0),
          totalCommission: earnings.reduce((s: number, e: any) => s + (e.commissionAmount ?? 0), 0),
          totalNet:        earnings.reduce((s: number, e: any) => s + (e.netAmount ?? 0), 0),
          available:       earnings.filter((e: any) => e.status === 'available').reduce((s: number, e: any) => s + (e.netAmount ?? 0), 0),
        });
      } catch { /* ignore */ } finally { if (!cancelled) setLoadingEarnings(false); }
    })();
    return () => { cancelled = true; };
  }, [user?.businessId, managedPayments]);

  // Sync from storeConfig on load
  useEffect(() => {
    if (!storeConfig) return;
    setStoreName(storeConfig.storeName ?? '');
    setStoreSlug(storeConfig.storeSlug ?? '');
    setPrimary(storeConfig.primaryColor ?? '#0EA5E9');
    setSecondary(storeConfig.secondaryColor ?? '#6366F1');
    setCurrency(storeConfig.currency ?? 'NGN');
    setEmail(storeConfig.contactEmail ?? '');
    setPhone(storeConfig.contactPhone ?? '');
    setPaystackKey((storeConfig as any).paystackPublicKey ?? '');
    setPayoutBankName((storeConfig as any).payoutBankName ?? '');
    setPayoutBankCode((storeConfig as any).payoutBankCode ?? '');
    setPayoutAccountNum((storeConfig as any).payoutAccountNumber ?? '');
    setPayoutAccountName((storeConfig as any).payoutAccountName ?? '');
    setUseOwnPaystack((storeConfig as any).useOwnPaystack ?? false);
    setPaystackSecretKey((storeConfig as any).paystackSecretKey ?? '');
    setCustomDomain(storeConfig.customDomain ?? '');
    setLogoUrl(storeConfig.logoUrl ?? null);
    setImagePreview(storeConfig.logoUrl ?? null);
  }, [storeConfig]);

  // Load bank list
  useEffect(() => {
    fetch('/api/sell/verify-bank')
      .then(r => r.json())
      .then((d: { banks?: { code: string; name: string }[] }) => { if (d.banks) setBanks(d.banks); })
      .catch(() => {});
  }, []);

  const handleVerifyAccount = useCallback(async () => {
    if (!payoutAccountNumber || payoutAccountNumber.length !== 10 || !payoutBankCode) {
      showToast('Enter a valid 10-digit account number and select a bank', 'error');
      return;
    }
    setVerifyingAccount(true);
    try {
      const res = await fetch('/api/sell/verify-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountNumber: payoutAccountNumber, bankCode: payoutBankCode }),
      });
      const data = await res.json() as { accountName?: string; error?: string };
      if (!res.ok || !data.accountName) {
        showToast(data.error ?? 'Could not verify account', 'error');
        return;
      }
      setPayoutAccountName(data.accountName);
      const bank = banks.find(b => b.code === payoutBankCode);
      if (bank) setPayoutBankName(bank.name);
      mark();
      showToast('Account verified!', 'success');
    } catch {
      showToast('Verification failed. Try again.', 'error');
    } finally {
      setVerifyingAccount(false);
    }
  }, [payoutAccountNumber, payoutBankCode, banks, showToast]);

  const mark = () => setDirty(true);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5MB', 'error'); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    mark();
  };

  const handleSave = useCallback(async () => {
    if (!user?.businessId) return;
    setSaving(true);
    try {
      const db = getDatabase();
      let finalLogoUrl = logoUrl;

      if (imageFile) {
        const storage = getStorage();
        const path = `stores/${user.businessId}/logo_${Date.now()}_${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        finalLogoUrl = await storage.upload(imageFile, path);
      }

      const finalSlug = slugify(storeSlug || storeName);

      await db.doc(`businesses/${user.businessId}/store/config`).set({
        storeName: storeName.trim(),
        storeSlug: finalSlug,
        primaryColor, secondaryColor,
        currency, contactEmail, contactPhone,
        paystackPublicKey,
        managedPayments: true,
        payoutBankName: payoutBankName.trim(),
        payoutBankCode: payoutBankCode.trim(),
        payoutAccountNumber: payoutAccountNumber.trim(),
        payoutAccountName: payoutAccountName.trim(),
        useOwnPaystack,
        paystackSecretKey: useOwnPaystack ? paystackSecretKey.trim() : null,
        logoUrl: finalLogoUrl,
        customDomain: customDomain.trim() || null,
        customDomainStatus: (() => {
          const savedDomain = (storeConfig as any)?.customDomain ?? '';
          const newDomain   = customDomain.trim();
          if (!newDomain || newDomain !== savedDomain) return 'pending';
          return (storeConfig as any)?.customDomainStatus ?? 'pending';
        })(),
        customDomainVerifiedAt: (() => {
          const savedDomain = (storeConfig as any)?.customDomain ?? '';
          const newDomain   = customDomain.trim();
          if (!newDomain || newDomain !== savedDomain) return null;
          return (storeConfig as any)?.customDomainVerifiedAt ?? null;
        })(),
        updatedAt: new Date().toISOString(),
        createdAt: (storeConfig as any)?.createdAt ?? new Date().toISOString(),
      }, { merge: true });

      // Keep storeIndex in sync for O(1) slug -> businessId lookup
      if (finalSlug) {
        await db.collection('storeIndex').doc(finalSlug).set({
          businessId: user.businessId,
          storeName: storeName.trim(),
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }

      await refreshStoreConfig();
      setImageFile(null);
      setDirty(false);
      showToast('Settings saved', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save settings', 'error');
    } finally { setSaving(false); }
  }, [user, storeName, storeSlug, primaryColor, secondaryColor, currency, contactEmail, contactPhone, paystackPublicKey, customDomain, logoUrl, imageFile, storeConfig, refreshStoreConfig, showToast, payoutBankName, payoutBankCode, payoutAccountNumber, payoutAccountName, useOwnPaystack, paystackSecretKey]);

  const handleVerifyDomain = useCallback(async () => {
    if (!customDomain.trim() || !user?.businessId) return;

    // Guard: domain in the input must match what's saved in database
    if (customDomain.trim() !== (storeConfig?.customDomain ?? '')) {
      showToast('Save your settings first before verifying the domain', 'error');
      return;
    }

    setVerifying(true);
    try {
      const res = await fetch('/api/store/domain/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: user.businessId, customDomain: customDomain.trim() }),
      });
      const data = await res.json() as { verified?: boolean; error?: string };

      if (!res.ok) {
        showToast(data.error ?? 'Verification failed', 'error');
        return;
      }

      await refreshStoreConfig();
      showToast(
        data.verified
          ? 'Domain verified!'
          : 'CNAME not found yet — DNS can take up to 48 hours',
        data.verified ? 'success' : 'error',
      );
    } catch {
      showToast('Verification failed — please try again', 'error');
    } finally {
      setVerifying(false);
    }
  }, [customDomain, storeConfig?.customDomain, user?.businessId, refreshStoreConfig, showToast]);

  const handlePublish = useCallback(async (status: 'active' | 'paused' | 'draft') => {
    if (!user?.businessId) return;
    try {
      const db = getDatabase();
      const slug = storeConfig?.storeSlug;
      await db.doc(`businesses/${user.businessId}/store/config`).set({
        status,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      if (slug && status === 'active') {
        await db.collection('storeIndex').doc(slug).set({
          businessId: user.businessId,
          storeName: storeConfig?.storeName ?? '',
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
      await refreshStoreConfig();
      showToast(status === 'active' ? 'Store is now live!' : status === 'paused' ? 'Store paused' : 'Store set to draft', 'success');
    } catch { showToast('Failed to update store status', 'error'); }
  }, [user?.businessId, storeConfig, refreshStoreConfig, showToast]);

  const status    = (storeConfig as any)?.status ?? 'draft';
  const domStatus = (storeConfig as any)?.customDomainStatus ?? 'pending';
  const verifiedCustomDomain = storeConfig?.customDomain && domStatus === 'verified' ? storeConfig.customDomain : null;
  const liveUrl   = storeConfig?.storeSlug
    ? (verifiedCustomDomain ?? `${process.env.NEXT_PUBLIC_APP_URL}/${storeConfig.storeSlug}`)
    : null;

  const domainStatusClass =
    domStatus === 'verified' ? styles.domainVerified :
    domStatus === 'failed'   ? styles.domainFailed   :
    customDomain             ? styles.domainPending  : styles.domainNone;

  const domainStatusLabel =
    domStatus === 'verified' ? '✓ Verified' :
    domStatus === 'failed'   ? '✗ Failed'   :
    customDomain             ? 'Pending DNS' : 'Not set';

  return (
    <div className={styles.page}>
      <div><h2 className={styles.heading}>Store Settings</h2><p className={styles.sub}>Configure your store identity, domain, and payment settings.</p></div>

      {/* Store status card */}
      <div className={styles.statusCard}>
        <div className={[styles.statusCardIcon, status === 'active' ? styles.statusCardIconActive : status === 'paused' ? styles.statusCardIconPaused : styles.statusCardIconDraft].join(' ')}>
          {status === 'active'
            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sell-green)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            : status === 'paused'
            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sell-red)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/></svg>
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sell-amber)" strokeWidth="2.5"><path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z"/></svg>}
        </div>
        <div className={styles.statusCardBody}>
          <p className={styles.statusCardTitle}>
            {status === 'active' ? 'Your store is live' : status === 'paused' ? 'Store is paused' : 'Store is in draft'}
          </p>
          <p className={styles.statusCardSub}>
            {status === 'active' && liveUrl
              ? <>Accessible at <a href={verifiedCustomDomain ? `https://${verifiedCustomDomain}` : `/${storeConfig?.storeSlug}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--sell-primary)' }}>{liveUrl}</a></>
              : status === 'paused' ? 'Customers see a temporarily unavailable page' : 'Not visible to customers yet'}
          </p>
        </div>
        <div className={styles.statusCardActions}>
          {status !== 'active'  && <button className={`${styles.btn} ${styles.btnGreen}`}  onClick={() => handlePublish('active')}>Publish</button>}
          {status === 'active'  && <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => handlePublish('paused')}>Pause store</button>}
          {status === 'paused'  && <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => handlePublish('draft')}>Set to draft</button>}
          {status !== 'active' && liveUrl && (
            <a href={`/${storeConfig?.storeSlug}`} target="_blank" rel="noopener noreferrer" className={`${styles.btn} ${styles.btnGhost}`}>Preview</a>
          )}
        </div>
      </div>

      {/* Identity */}
      <div className={styles.card}>
        <div className={styles.cardHeader}><div><p className={styles.cardTitle}>Store identity</p><p className={styles.cardSub}>Name, logo, and brand colors</p></div></div>
        <div className={styles.cardBody}>
          {/* Logo */}
          <div className={styles.logoRow}>
            <div className={styles.logoPreview}>
              {imagePreview
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={imagePreview} alt="logo" />
                : <span>{storeName.charAt(0).toUpperCase() || '?'}</span>}
            </div>
            <div className={styles.logoActions}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} style={{ fontSize: '0.8rem', padding: '7px 12px' }} onClick={() => fileRef.current?.click()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Upload logo
              </button>
              {imagePreview && <button className={`${styles.btn} ${styles.btnGhost}`} style={{ fontSize: '0.78rem', padding: '7px 12px' }} onClick={() => { setImagePreview(null); setImageFile(null); setLogoUrl(null); mark(); }}>Remove</button>}
              <p style={{ fontSize: '0.72rem', color: 'var(--sell-text-3)' }}>PNG, JPG, WebP · max 5MB</p>
            </div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={handleImageChange} />
          </div>

          {/* Name + Slug */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Store name *</label>
              <input className={styles.formInput} value={storeName} onChange={e => { setStoreName(e.target.value); if (!storeConfig) setStoreSlug(slugify(e.target.value)); mark(); }} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Store URL slug</label>
              <input className={styles.formInput} value={storeSlug} onChange={e => { setStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); mark(); }} />
              <p className={styles.formHint}>Only lowercase letters, numbers, hyphens</p>
            </div>
          </div>
          {storeSlug && (
            <div className={styles.urlRow}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" color="var(--sell-text-3)"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
              <span className={styles.urlBase}>mo-sell.store/</span>
              <span className={styles.urlSlug}>{storeSlug}</span>
            </div>
          )}

          {/* Colors */}
          <div className={styles.colorsRow}>
            <div className={styles.colorGroup}>
              <label className={styles.formLabel}>Primary color</label>
              <div className={styles.colorWrap}>
                <input type="color" value={primaryColor} onChange={e => { setPrimary(e.target.value); mark(); }} className={styles.colorSwatch} style={{ background: primaryColor }} />
                <input className={styles.colorInput} value={primaryColor} onChange={e => { setPrimary(e.target.value); mark(); }} placeholder="#0EA5E9" />
              </div>
              <div className={styles.colorPreview} style={{ background: primaryColor }}>Buttons & links</div>
            </div>
            <div className={styles.colorGroup}>
              <label className={styles.formLabel}>Accent color</label>
              <div className={styles.colorWrap}>
                <input type="color" value={secondaryColor} onChange={e => { setSecondary(e.target.value); mark(); }} className={styles.colorSwatch} style={{ background: secondaryColor }} />
                <input className={styles.colorInput} value={secondaryColor} onChange={e => { setSecondary(e.target.value); mark(); }} placeholder="#6366F1" />
              </div>
              <div className={styles.colorPreview} style={{ background: secondaryColor }}>Accents & badges</div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact & currency */}
      <div className={styles.card}>
        <div className={styles.cardHeader}><div><p className={styles.cardTitle}>Contact & currency</p><p className={styles.cardSub}>Shown on order confirmation emails and receipts</p></div></div>
        <div className={styles.cardBody}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Contact email</label>
              <input className={styles.formInput} type="email" value={contactEmail} onChange={e => { setEmail(e.target.value); mark(); }} placeholder="hello@yourbrand.com" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Contact phone</label>
              <input className={styles.formInput} value={contactPhone} onChange={e => { setPhone(e.target.value); mark(); }} placeholder="+234 800 000 0000" />
            </div>
          </div>
          <div className={styles.formGroup} style={{ maxWidth: 200 }}>
            <label className={styles.formLabel}>Store currency</label>
            <select className={styles.formSelect} value={currency} onChange={e => { setCurrency(e.target.value); mark(); }}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Payments */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <p className={styles.cardTitle}>Payments</p>
            <p className={styles.cardSub}>How you receive money from sales</p>
          </div>
        </div>
        <div className={styles.cardBody}>
          {/* Info banner */}
          <div style={{
            display: 'flex', gap: 12, padding: '12px 14px',
            background: 'var(--sell-primary-lt)', borderRadius: 10,
            border: '1px solid var(--sell-primary)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sell-primary)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--sell-primary)', marginBottom: 3 }}>Busmo collects payments for you</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--sell-text-2)', lineHeight: 1.5 }}>
                All payments are processed through Busmo's secure Paystack account. A <strong>5% commission</strong> is deducted per sale. Your net earnings appear in the Earnings dashboard and you can request a payout anytime.
              </p>
            </div>
          </div>

          {/* Bank details for payouts */}
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--sell-text-2)', marginTop: 14, marginBottom: 8 }}>Your payout bank account</p>

          {/* Bank selector */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Bank</label>
            <select
              className={styles.formSelect}
              value={payoutBankCode}
              onChange={e => {
                const code = e.target.value;
                setPayoutBankCode(code);
                const bank = banks.find(b => b.code === code);
                if (bank) setPayoutBankName(bank.name);
                mark();
              }}
            >
              <option value="">Select your bank</option>
              {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </div>

          {/* Account number + verify */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Account number</label>
              <input
                className={styles.formInput}
                value={payoutAccountNumber}
                onChange={e => { setPayoutAccountNum(e.target.value.replace(/\D/g, '')); setPayoutAccountName(''); mark(); }}
                placeholder="0123456789"
                maxLength={10}
              />
            </div>
            <div className={styles.formGroup} style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost}`}
                style={{ height: 38, fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                onClick={handleVerifyAccount}
                disabled={verifyingAccount || payoutAccountNumber.length !== 10 || !payoutBankCode}
              >
                {verifyingAccount ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 14, height: 14, animation: 'spin 0.7s linear infinite' }}>
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                ) : 'Verify'}
              </button>
            </div>
          </div>

          {/* Account name (verified) */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Account name</label>
            <input
              className={styles.formInput}
              value={payoutAccountName}
              onChange={e => { setPayoutAccountName(e.target.value); mark(); }}
              placeholder={payoutAccountNumber.length === 10 && payoutBankCode ? 'Click Verify above' : 'Select bank and enter account number first'}
              readOnly={verifyingAccount}
              style={payoutAccountName ? { background: 'var(--sell-surface-2, #f0fdf4)', borderColor: '#16a34a' } : {}}
            />
            {payoutAccountName && (
              <p style={{ fontSize: '0.7rem', color: '#16a34a', marginTop: 3, fontWeight: 600 }}>✓ Account verified</p>
            )}
          </div>

          {/* Earnings summary */}
          {managedPayments && (
            <div style={{ marginTop: 14, borderTop: '1px solid var(--sell-border)', paddingTop: 14 }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--sell-text-2)', marginBottom: 10 }}>Your earnings</p>
              {loadingEarnings ? (
                <p style={{ fontSize: '0.78rem', color: 'var(--sell-text-3)' }}>Loading...</p>
              ) : earningsStats ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ background: 'var(--sell-bg)', borderRadius: 8, padding: '10px 12px' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--sell-text-3)', marginBottom: 2 }}>Total Sales</p>
                    <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--sell-text-1)' }}>
                      {fmtEarnings(earningsStats.totalGross)}
                    </p>
                  </div>
                  <div style={{ background: 'var(--sell-bg)', borderRadius: 8, padding: '10px 12px' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--sell-text-3)', marginBottom: 2 }}>Commission (5%)</p>
                    <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--sell-red, #ef4444)' }}>
                      -{fmtEarnings(earningsStats.totalCommission)}
                    </p>
                  </div>
                  <div style={{ background: 'var(--sell-bg)', borderRadius: 8, padding: '10px 12px' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--sell-text-3)', marginBottom: 2 }}>Net Earnings</p>
                    <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--sell-green, #16a34a)' }}>
                      {fmtEarnings(earningsStats.totalNet)}
                    </p>
                  </div>
                  <div style={{ background: 'var(--sell-primary-lt)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--sell-primary)' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--sell-primary)', marginBottom: 2, fontWeight: 600 }}>Available to Payout</p>
                    <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--sell-primary)' }}>
                      {fmtEarnings(earningsStats.available)}
                    </p>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.78rem', color: 'var(--sell-text-3)' }}>No earnings yet.</p>
              )}
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost}`}
                style={{ marginTop: 10, fontSize: '0.8rem' }}
                onClick={() => navigateTo('earnings')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
                View full Earnings & Payouts
              </button>
            </div>
          )}

          {/* Advanced: Own Paystack Key */}
          <div style={{ marginTop: 20, borderTop: '1px solid var(--sell-border)', paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: useOwnPaystack ? 10 : 0 }}>
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--sell-text-2)' }}>Use your own Paystack account</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--sell-text-3)', marginTop: 2 }}>Advanced — connect your Paystack to collect payments directly</p>
              </div>
              <button
                type="button"
                onClick={() => { setUseOwnPaystack(v => !v); mark(); }}
                style={{
                  width: 46, height: 26, borderRadius: 100, border: 'none', cursor: 'pointer', padding: 3,
                  background: useOwnPaystack ? 'var(--sell-primary)' : 'var(--sell-border)',
                  transition: 'background 0.2s', flexShrink: 0, position: 'relative',
                }}
                aria-pressed={useOwnPaystack}
              >
                <span style={{
                  display: 'block', width: 20, height: 20, borderRadius: '50%',
                  background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  transform: useOwnPaystack ? 'translateX(20px)' : 'translateX(0)',
                  transition: 'transform 0.2s',
                }} />
              </button>
            </div>

            {useOwnPaystack && (
              <>
                <div style={{
                  display: 'flex', gap: 10, padding: '10px 12px',
                  background: 'rgba(245,158,11,0.08)', borderRadius: 8,
                  border: '1px solid rgba(245,158,11,0.2)', marginBottom: 12,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sell-amber)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <p style={{ fontSize: '0.72rem', color: 'var(--sell-text-2)', lineHeight: 1.5 }}>
                    When enabled, payments go directly to your Paystack account. Busmo's 5% commission will be invoiced separately. You'll need to configure your own webhook URL in your Paystack dashboard.
                  </p>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Paystack Secret Key</label>
                  <input className={styles.formInput} type="password" value={paystackSecretKey} onChange={e => { setPaystackSecretKey(e.target.value); mark(); }} placeholder="sk_live_…" />
                  <p className={styles.formHint}>Found in your Paystack dashboard under Settings → API Keys. This is stored securely and only used for your transactions.</p>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Paystack Public Key</label>
                  <input className={styles.formInput} value={paystackPublicKey} onChange={e => { setPaystackKey(e.target.value); mark(); }} placeholder="pk_live_…" />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Custom domain */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div><p className={styles.cardTitle}>Custom domain</p><p className={styles.cardSub}>Connect your own domain to your store</p></div>
          <span className={`${styles.domainStatus} ${domainStatusClass}`}>{domainStatusLabel}</span>
        </div>
        <div className={styles.cardBody}>
          {domStatus === 'failed' && customDomain && (
            <div className={styles.warningBanner}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sell-amber)" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 2 }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span><strong>{customDomain}</strong> is not pointing to Busmo yet. Check your DNS settings and try verifying again.</span>
            </div>
          )}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Domain name</label>
            <input className={styles.formInput} value={customDomain} onChange={e => { setCustomDomain(e.target.value.toLowerCase().trim()); mark(); }} placeholder="shop.yourbrand.com" />
            <p className={styles.formHint}>Enter your domain without https:// — e.g. shop.yourbrand.com</p>
          </div>
          {customDomain && (
            <div className={styles.dnsInstructions}>
              <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--sell-text-1)', marginBottom: 4 }}>Add this DNS record at your registrar:</p>
              <div className={styles.dnsRow}><span className={styles.dnsKey}>Type</span><span className={styles.dnsValue}>CNAME</span></div>
              <div className={styles.dnsRow}><span className={styles.dnsKey}>Host</span><span className={styles.dnsValue}>{customDomain.split('.').slice(0, -2).join('.') || '@'}</span></div>
              <div className={styles.dnsRow}><span className={styles.dnsKey}>Value</span><span className={styles.dnsValue}>store.busmo.io</span></div>
              <div className={styles.dnsRow}><span className={styles.dnsKey}>TTL</span><span className={styles.dnsValue}>3600</span></div>
            </div>
          )}
          {customDomain && (
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleVerifyDomain} disabled={verifying} style={{ alignSelf: 'flex-start' }}>
              {verifying
                ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>Verifying…</>
                : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Verify domain</>}
            </button>
          )}
        </div>
      </div>

      {/* Theme Display */}


      {/* Save bar */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardTitle}>Save changes</div>
            <div className={styles.cardSub}>Publish your updated store settings</div>
          </div>
          <span className={styles.saveBarMsg}>{dirty ? 'You have unsaved changes' : 'All changes saved'}</span>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.saveRow}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSave} disabled={saving || !dirty}>
              {saving
                ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>Saving…</>
                : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Save settings</>}
            </button>
            {dirty && (
              <button
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={() => {
                  if (!storeConfig) { setDirty(false); return; }
                  setStoreName(storeConfig.storeName ?? '');
                  setStoreSlug(storeConfig.storeSlug ?? '');
                  setPrimary(storeConfig.primaryColor ?? '#0EA5E9');
                  setSecondary(storeConfig.secondaryColor ?? '#6366F1');
                  setCurrency(storeConfig.currency ?? 'NGN');
                  setEmail(storeConfig.contactEmail ?? '');
                  setPhone(storeConfig.contactPhone ?? '');
                  setPaystackKey((storeConfig as any).paystackPublicKey ?? '');
                  setPayoutBankName((storeConfig as any).payoutBankName ?? '');
                  setPayoutBankCode((storeConfig as any).payoutBankCode ?? '');
                  setPayoutAccountNum((storeConfig as any).payoutAccountNumber ?? '');
                  setPayoutAccountName((storeConfig as any).payoutAccountName ?? '');
                  setUseOwnPaystack((storeConfig as any).useOwnPaystack ?? false);
                  setPaystackSecretKey((storeConfig as any).paystackSecretKey ?? '');
                  setCustomDomain(storeConfig.customDomain ?? '');
                  setLogoUrl(storeConfig.logoUrl ?? null);
                  setImagePreview(storeConfig.logoUrl ?? null);
                  setImageFile(null);
                  setDirty(false);
                }}
                disabled={saving}
              >
                Discard
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className={styles.card} style={{ borderColor: 'var(--sell-danger-border, rgba(239,68,68,0.2))' }}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>Logout</div>
        </div>
        <div className={styles.cardBody}>
          <p className={styles.formHint} style={{ margin: 0 }}>Sign out of your account</p>
          <button
            className={`${styles.btn} ${styles.btnDanger}`}
            onClick={async () => {
              await supabaseClient.auth.signOut();
              window.location.href = '/login';
            }}
            style={{ alignSelf: 'flex-start' }}
          >
            Logout
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}