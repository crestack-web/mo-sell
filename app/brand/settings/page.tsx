'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, ShieldCheck, Wallet, Save, Loader2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';
import { useBrandWorkspace } from '../_components/BrandWorkspaceProvider';
import { useToast } from '@/components/brand/ToastProvider';
import { formatKobo } from '../_components/shared';
import styles from '../brand-studio.module.css';

export default function BrandSettingsPage() {
  const router = useRouter();
  const { brand, user, orders, updateProfile } = useBrandWorkspace();
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState({ brandName: '', email: '', phone: '', website: '', industry: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!brand) return;
    setForm({
      brandName: brand.brandName ?? '',
      email: brand.email ?? user?.email ?? '',
      phone: brand.phone ?? '',
      website: brand.website ?? '',
      industry: brand.industry ?? '',
    });
  }, [brand, user?.email]);

  const totalSpend = orders
    .filter((o) => o.paymentStatus !== 'PENDING_DEPOSIT')
    .reduce((sum, o) => sum + (o.agreedPrice ?? 0), 0);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      showSuccess('Brand profile updated.');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Could not save profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await supabaseClient.auth.signOut();
    router.push('/brand-auth/login');
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className={styles.pageHead}>
        <div>
          <div className={styles.pageEyebrow}><Settings size={12} /> Account</div>
          <h1 className={styles.pageTitle}>Brand settings</h1>
          <p className={styles.pageSubtitle}>Keep your profile current so creators know who they’re working with.</p>
        </div>
        <button className={styles.ghostButton} onClick={handleLogout}>
          <LogOut size={14} /> Sign out
        </button>
      </div>

      <div className={`${styles.grid} ${styles.twoCol}`}>
        <form className={styles.card} onSubmit={handleSave}>
          <div className={styles.cardHead}>
            <div>
              <p className={styles.cardTitle}>Profile details</p>
              <p className={styles.cardSub}>Shown to creators on briefs and collaborations</p>
            </div>
            <ShieldCheck size={16} color="var(--bs-success)" />
          </div>
          <div className={styles.cardBody}>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Brand name</label>
                <input className={styles.input} value={form.brandName} onChange={(e) => setForm({ ...form, brandName: e.target.value })} required />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Contact email</label>
                <input className={styles.input} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Phone</label>
                <input className={styles.input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+234…" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Industry</label>
                <input className={styles.input} value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="e.g. Beauty & skincare" />
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label}>Website</label>
                <input className={styles.input} value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://yourbrand.com" />
              </div>
            </div>
          </div>
          <div className={styles.modalFoot}>
            <button className={styles.primaryButton} type="submit" disabled={saving}>
              {saving ? <Loader2 size={14} className={styles.spinner} /> : <Save size={14} />}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <p className={styles.cardTitle}>Account snapshot</p>
              <Wallet size={16} color="var(--bs-accent)" />
            </div>
            <div className={styles.cardBody}>
              {[
                ['Account ID', user?.id ? `${user.id.slice(0, 12)}…` : '—'],
                ['Status', brand?.status || 'active'],
                ['Wallet balance', `$${Number(brand?.walletBalance ?? 0).toFixed(2)}`],
                ['Collaboration spend', formatKobo(totalSpend)],
                ['Briefs sent', String(orders.length)],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--bs-border)', fontSize: 12 }}>
                  <span style={{ color: 'var(--bs-subtle)' }}>{label}</span>
                  <span style={{ color: 'var(--bs-text)', fontWeight: 650 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardBody}>
              <p className={styles.cardTitle} style={{ marginBottom: 8 }}>How payments work</p>
              <p className={styles.cardSub} style={{ lineHeight: 1.7, margin: 0 }}>
                A 50% deposit is collected when you send a brief and held until a draft is submitted. After you approve the
                draft, the remaining balance is collected. Once you approve the final video, the creator’s payout is sent
                directly to their bank account.
              </p>
              <button className={styles.softButton} style={{ marginTop: 14 }} onClick={() => router.push('/brand/payouts')}>
                Manage payouts
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
