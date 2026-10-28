'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase-client';
import { useSell } from '@/context/SellContext';
import styles from './SellReferralsPage.module.css';

interface ReferralRow {
  id: string;
  referredBusinessId: string | null;
  status: string;
  rewardAmount: number;
  createdAt: string;
  rewardedAt?: string | null;
}

interface ReferralData {
  code: string;
  shareUrl: string;
  rewardPerSaleNgn: number;
  balance: number;
  totalEarned: number;
  stats: { total: number; signedUp: number; rewarded: number };
  referrals: ReferralRow[];
}

function fmtNgn(n: number) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

export function SellReferralsPage() {
  const { user, showToast } = useSell();
  const businessId = user?.businessId;
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not signed in');
      const res = await fetch(`/api/referrals?businessId=${encodeURIComponent(businessId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setData(json);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load referrals', 'error');
    } finally {
      setLoading(false);
    }
  }, [businessId, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied`, 'success');
    } catch {
      showToast('Could not copy', 'error');
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.muted}>Loading referral program…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.page}>
        <p className={styles.muted}>Could not load referral data.</p>
        <button type="button" className={styles.primaryBtn} onClick={load}>Retry</button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Refer & earn</h1>
        <p className={styles.sub}>
          Share MO Sell with other merchants. When they make their first paid sale, you earn{' '}
          <strong>{fmtNgn(data.rewardPerSaleNgn)}</strong> credit.
        </p>
      </header>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Balance</span>
          <span className={styles.statValue}>{fmtNgn(data.balance)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total earned</span>
          <span className={styles.statValue}>{fmtNgn(data.totalEarned)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Signups</span>
          <span className={styles.statValue}>{data.stats.signedUp}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Rewarded</span>
          <span className={styles.statValue}>{data.stats.rewarded}</span>
        </div>
      </div>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Your referral link</h2>
        <p className={styles.muted}>Anyone who joins with this link is tied to your account.</p>
        <div className={styles.linkRow}>
          <code className={styles.linkBox}>{data.shareUrl}</code>
          <button type="button" className={styles.primaryBtn} onClick={() => copy(data.shareUrl, 'Link')}>
            Copy link
          </button>
        </div>
        <div className={styles.codeRow}>
          <span className={styles.muted}>Code</span>
          <strong className={styles.code}>{data.code}</strong>
          <button type="button" className={styles.ghostBtn} onClick={() => copy(data.code, 'Code')}>
            Copy code
          </button>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>How it works</h2>
        <ol className={styles.steps}>
          <li>Share your unique link or code with other business owners.</li>
          <li>They create a MO Sell store using your link.</li>
          <li>When their store completes its first paid customer order, you get {fmtNgn(data.rewardPerSaleNgn)} referral credit.</li>
          <li>Credits appear in your balance and can offset platform fees over time.</li>
        </ol>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Your referrals</h2>
        {data.referrals.length === 0 ? (
          <p className={styles.muted}>No referrals yet — share your link to get started.</p>
        ) : (
          <ul className={styles.list}>
            {data.referrals.map(r => (
              <li key={r.id} className={styles.listItem}>
                <div>
                  <div className={styles.listTitle}>
                    {r.referredBusinessId ? `Store ${r.referredBusinessId.slice(0, 10)}…` : 'Pending signup'}
                  </div>
                  <div className={styles.muted}>
                    Joined {new Date(r.createdAt).toLocaleDateString()}
                    {r.rewardedAt ? ` · Rewarded ${new Date(r.rewardedAt).toLocaleDateString()}` : ''}
                  </div>
                </div>
                <div className={styles.listRight}>
                  <span className={[styles.badge, styles[`badge_${r.status}`] || ''].join(' ')}>
                    {r.status === 'rewarded' ? 'Rewarded' : r.status === 'signed_up' ? 'Signed up' : r.status}
                  </span>
                  {Number(r.rewardAmount) > 0 && (
                    <span className={styles.rewardAmt}>{fmtNgn(Number(r.rewardAmount))}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
