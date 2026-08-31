'use client';

import React, { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import { getDatabase } from '@/lib/database/adapter';
import { getStorage } from '@/lib/storage/adapter';
import { supabaseClient } from '@/lib/supabase-client';
import { BusmoConnectCard } from './BusmoConnectCard';
import { useSell } from '@/context/SellContext';
import styles from './SellSettingsPage.module.css';

const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR'];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 30);
}

export function SellSettingsPage() {
  const { user, storeConfig, refreshStoreConfig, showToast, navigateTo } = useSell();
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [primaryColor, setPrimary] = useState('#0EA5E9');
  const [secondaryColor, setSecondary] = useState('#6366F1');
  const [currency, setCurrency] = useState('NGN');
  const [contactEmail, setEmail] = useState('');
  const [contactPhone, setPhone] = useState('');
  const [paystackPublicKey, setPaystackKey] = useState('');
  const [payoutBankName, setPayoutBankName] = useState('');
  const [payoutBankCode, setPayoutBankCode] = useState('');
  const [payoutAccountNumber, setPayoutAccountNum] = useState('');
  const [payoutAccountName, setPayoutAccountName] = useState('');
  const [useOwnPaystack, setUseOwnPaystack] = useState(false);
  const [paystackSecretKey, setPaystackSecretKey] = useState('');
  const [banks, setBanks] = useState<{ code: string; name: string }[]>([]);
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [customDomain, setCustomDomain] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [dirty, setDirty] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [earningsStats, setEarningsStats] = useState<{ totalGross: number; totalCommission: number; totalNet: number; available: number } | null>(null);
  const [loadingEarnings, setLoadingEarnings] = useState(false);
  const managedPayments = (storeConfig as any)?.managedPayments === true;
  const currencySym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : currency + ' ';
  const fmtEarnings = (n: number) => `${currencySym}${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  useEffect(() => {
    if (!user?.businessId || !managedPayments) { setEarningsStats(null); return; }
    let cancelled = false;
    setLoadingEarnings(true);
    (async () => {
      try {
        const db = getDatabase();
        const snap = await db.collection(`businesses/${user.businessId}/storeEarnings`).limit(1000).get();
        const earnings = snap.docs.map(d => ({ ...d.data() as any }));
        if (cancelled) return;
        setEarningsStats({
          totalGross: earnings.reduce((s: number, e: any) => s + (e.grossAmount ?? 0), 0),
          totalCommission: earnings.reduce((s: number, e: any) => s + (e.commissionAmount ?? 0), 0),
          totalNet: earnings.reduce((s: number, e: any) => s + (e.netAmount ?? 0), 0),
          available: earnings.filter((e: any) => e.status === 'available').reduce((s: number, e: any) => s + (e.netAmount ?? 0), 0),
        });
      } catch { /* ignore */ } finally { if (!cancelled) setLoadingEarnings(false); }
    })();
    return () => { cancelled = true; };
  }, [user?.businessId, managedPayments]);

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

  useEffect(() => {
    fetch('/api/sell/verify-bank').then(r => r.json()).then((d: any) => { if (d.banks) setBanks(d.banks); }).catch(() => {});
  }, []);

  const mark = () => setDirty(true);

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
        storeName: storeName.trim(), storeSlug: finalSlug, primaryColor, secondaryColor,
        currency, contactEmail, contactPhone, paystackPublicKey, managedPayments: true,
        payoutBankName: payoutBankName.trim(), payoutBankCode: payoutBankCode.trim(),
        payoutAccountNumber: payoutAccountNumber.trim(), payoutAccountName: payoutAccountName.trim(),
        useOwnPaystack, paystackSecretKey: useOwnPaystack ? paystackSecretKey.trim() : null,
        logoUrl: finalLogoUrl, customDomain: customDomain.trim() || null,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      if (finalSlug) {
        await db.collection('storeIndex').doc(finalSlug).set({
          businessId: user.businessId, storeName: storeName.trim(), updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
      await refreshStoreConfig();
      setDirty(false);
      showToast('Settings saved', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save settings', 'error');
    } finally { setSaving(false); }
  }, [user, storeName, storeSlug, primaryColor, secondaryColor, currency, contactEmail, contactPhone, paystackPublicKey, customDomain, logoUrl, imageFile, refreshStoreConfig, showToast, payoutBankName, payoutBankCode, payoutAccountNumber, payoutAccountName, useOwnPaystack, paystackSecretKey]);

  const status = (storeConfig as any)?.status ?? 'draft';
  const liveUrl = storeConfig?.storeSlug ? `${process.env.NEXT_PUBLIC_APP_URL}/store/${storeConfig.storeSlug}` : null;

  return (
    <div className={styles.page}>
      <div><h2 className={styles.heading}>Store Settings</h2><p className={styles.sub}>Configure your store identity, domain, payments, and Busmo inventory link.</p></div>

      <div className={styles.card}>
        <div className={styles.cardHeader}><div><p className={styles.cardTitle}>Store identity</p></div></div>
        <div className={styles.cardBody}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Store name *</label>
              <input className={styles.formInput} value={storeName} onChange={e => { setStoreName(e.target.value); mark(); }} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Store URL slug</label>
              <input className={styles.formInput} value={storeSlug} onChange={e => { setStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); mark(); }} />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Contact email</label>
              <input className={styles.formInput} type="email" value={contactEmail} onChange={e => { setEmail(e.target.value); mark(); }} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Currency</label>
              <select className={styles.formSelect} value={currency} onChange={e => { setCurrency(e.target.value); mark(); }}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <BusmoConnectCard businessId={user?.businessId} showToast={(m) => showToast(m, 'success')} />

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div><div className={styles.cardTitle}>Save changes</div></div>
          <span className={styles.saveBarMsg}>{dirty ? 'You have unsaved changes' : 'All changes saved'}</span>
        </div>
        <div className={styles.cardBody}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSave} disabled={saving || !dirty}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardBody}>
          <button className={`${styles.btn} ${styles.btnDanger}`} onClick={async () => {
            await supabaseClient.auth.signOut();
            window.location.href = '/login';
          }}>Logout</button>
        </div>
      </div>
    </div>
  );
}
