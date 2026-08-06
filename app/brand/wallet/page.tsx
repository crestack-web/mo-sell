'use client';

import React, { useState, useEffect } from 'react';
import { getDatabase } from '@/lib/database/adapter';
import { supabaseClient } from '@/lib/supabase-client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/brand/ToastProvider';
import { convertFromUsd, convertToUsd, getUserCountryCode } from '@/lib/currency';
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  History, 
  CheckCircle, 
  Clock, 
  XCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';

// ── Theme ────────────────────────────────────────────────────────────────────
const THEME = {
  bg: '#0A0A0B',
  surface: '#141416',
  surfaceHover: '#1A1A1D',
  border: '#2A2A2E',
  primary: '#6366F1',
  primaryHover: '#4F46E5',
  text1: '#FFFFFF',
  text2: '#A1A1AA',
  text3: '#71717A',
  success: '#10B981',
  error: '#EF4444',
};

const FONTS = {
  display: "'Inter', system-ui, sans-serif",
  body: "'Inter', system-ui, sans-serif",
};

interface Transaction {
  id: string;
  type: 'topup' | 'purchase' | 'refund';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
  paymentMethod?: string;
}

type TopUpCurrency = 'USD' | 'NGN';

const TOPUP_AMOUNTS: Record<TopUpCurrency, number[]> = {
  USD: [50, 100, 250],
  NGN: [25000, 50000, 100000],
};
const MIN_TOPUP_USD = 10;

export default function BrandWalletPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSuccess, showError } = useToast();
  const success = searchParams.get('success');
  const error = searchParams.get('error');

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [toppingUp, setToppingUp] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [currency, setCurrency] = useState<TopUpCurrency>('USD');

  const currencySymbol = currency === 'NGN' ? '₦' : '$';
  const minAmount = currency === 'NGN'
    ? Math.round(convertFromUsd(MIN_TOPUP_USD, 'NG'))
    : MIN_TOPUP_USD;

  useEffect(() => {
    loadWalletData();
    
    // Show success/error messages from URL params
    if (success === 'topup_completed') {
      showSuccess('Wallet topped up successfully!');
    }
    if (error) {
      showError('Wallet operation failed. Please try again.');
    }
  }, [success, error, showSuccess, showError]);

  const loadWalletData = async () => {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      const db = getDatabase();
      
      // Get brand data
      const brandQuery = await db.collection('brands').where('userId', '==', user.id).limit(1).get();
      if (brandQuery.docs.length === 0) return;
      
      const brand = brandQuery.docs[0].data();
      const id = brandQuery.docs[0].id;

      setBalance(Number(brand.walletBalance) || 0);

      const savedCurrency = brand.topupCurrency as TopUpCurrency | undefined;
      if (savedCurrency === 'NGN' || savedCurrency === 'USD') {
        setCurrency(savedCurrency);
      } else if (['NG', 'GH', 'NE', 'CM'].includes(getUserCountryCode())) {
        setCurrency('NGN');
      }

      // Get transactions
      const transactionsQuery = await db.collection('wallet_transactions')
        .where('brandId', '==', id)
        .get();
      
      const txs = transactionsQuery.docs.map(doc => doc.data() as Transaction);
      setTransactions(txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async (amount: number) => {
    setToppingUp(true);
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      const db = getDatabase();
      const brandQuery = await db.collection('brands').where('userId', '==', user.id).limit(1).get();
      if (brandQuery.docs.length === 0) return;
      
      const id = brandQuery.docs[0].id;

      const response = await fetch(`/api/brand/wallet/topup?amount=${amount}&brandId=${id}&currency=${currency}`, {
        method: 'POST',
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to initialize top-up');

      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      }
    } catch (error: any) {
      console.error('Top-up error:', error);
      alert(error.message || 'Failed to initialize top-up');
    } finally {
      setToppingUp(false);
    }
  };

  const handleCustomTopUp = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (amount < minAmount) {
      alert(`Minimum top-up amount is ${currencySymbol}${minAmount.toLocaleString()}`);
      return;
    }
    handleTopUp(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number) => {
    const n = Number(amount) || 0;
    return n >= 0 ? `+$${n.toFixed(2)}` : `-$${Math.abs(n).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: THEME.primary }} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: THEME.text1, fontFamily: FONTS.display, marginBottom: 8 }}>
          Wallet
        </h1>
        <p style={{ fontSize: 16, color: THEME.text2 }}>
          Manage your wallet balance and view transaction history
        </p>
      </div>

      {/* Balance Card */}
      <div style={{ 
        padding: 32, 
        borderRadius: 16, 
        background: `linear-gradient(135deg, ${THEME.primary} 0%, #8B5CF6 100%)`,
        marginBottom: 32,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Wallet size={24} color="white" />
            <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
              Current Balance
            </span>
          </div>
          <div style={{ fontSize: 56, fontWeight: 700, color: 'white', fontFamily: FONTS.display, marginBottom: 24 }}>
            ${balance.toFixed(2)}
          </div>
          <button
            onClick={() => document.getElementById('topup-section')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              padding: '14px 28px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 8,
              color: 'white',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          >
            <Plus size={18} />
            Top Up Wallet
            <ArrowUpRight size={18} />
          </button>
        </div>
      </div>

      {/* Top Up Section */}
      <div id="topup-section" style={{ 
        padding: 24, 
        borderRadius: 16, 
        background: THEME.surface, 
        border: `1px solid ${THEME.border}`,
        marginBottom: 32,
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: THEME.text1, fontFamily: FONTS.display, marginBottom: 20 }}>
          Top Up Wallet
        </h2>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: THEME.text2, marginBottom: 12 }}>
            Top-Up Currency
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            {(['USD', 'NGN'] as TopUpCurrency[]).map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCurrency(c);
                  setSelectedAmount(null);
                  setCustomAmount('');
                }}
                style={{
                  padding: '12px 20px',
                  background: currency === c ? `${THEME.primary}20` : THEME.bg,
                  border: currency === c ? `2px solid ${THEME.primary}` : `1px solid ${THEME.border}`,
                  borderRadius: 8,
                  color: currency === c ? THEME.primary : THEME.text1,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {c === 'NGN' ? '₦ Naira (NGN)' : '$ Dollar (USD)'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: THEME.text2, marginBottom: 12 }}>
            Quick Amount
          </label>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {TOPUP_AMOUNTS[currency].map((amount) => (
              <button
                key={amount}
                onClick={() => {
                  setSelectedAmount(amount);
                  setCustomAmount('');
                }}
                disabled={toppingUp}
                style={{
                  padding: '14px 28px',
                  background: selectedAmount === amount ? `${THEME.primary}20` : THEME.bg,
                  border: selectedAmount === amount ? `2px solid ${THEME.primary}` : `1px solid ${THEME.border}`,
                  borderRadius: 8,
                  color: selectedAmount === amount ? THEME.primary : THEME.text1,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: toppingUp ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => !toppingUp && (e.currentTarget.style.borderColor = THEME.primary)}
                onMouseLeave={(e) => !toppingUp && (e.currentTarget.style.borderColor = selectedAmount === amount ? THEME.primary : THEME.border)}
              >
                {currencySymbol}{amount.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: THEME.text2, marginBottom: 12 }}>
            Or Enter Custom Amount
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ 
                position: 'absolute', 
                left: 14, 
                top: '50%', 
                transform: 'translateY(-50%)', 
                fontSize: 16, 
                fontWeight: 600, 
                color: THEME.text3 
              }}>
                {currencySymbol}
              </span>
              <input
                type="number"
                placeholder="0.00"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                disabled={toppingUp}
                min="10"
                step="1"
                style={{
                  width: '100%',
                  padding: '14px 14px 14px 36px',
                  background: THEME.bg,
                  border: `1px solid ${THEME.border}`,
                  borderRadius: 8,
                  color: THEME.text1,
                  fontSize: 16,
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = THEME.primary}
                onBlur={(e) => e.target.style.borderColor = THEME.border}
              />
            </div>
            <button
              onClick={handleCustomTopUp}
              disabled={toppingUp || !customAmount}
              style={{
                padding: '14px 28px',
                background: toppingUp || !customAmount ? THEME.surfaceHover : THEME.primary,
                border: 'none',
                borderRadius: 8,
                color: 'white',
                fontSize: 15,
                fontWeight: 600,
                cursor: toppingUp || !customAmount ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => !toppingUp && customAmount && (e.currentTarget.style.background = THEME.primaryHover)}
              onMouseLeave={(e) => !toppingUp && customAmount && (e.currentTarget.style.background = THEME.primary)}
            >
              {toppingUp ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Processing...
                </>
              ) : (
                <>
                  Top Up
                  <ArrowUpRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>

        {selectedAmount && (
          <button
            onClick={() => handleTopUp(selectedAmount)}
            disabled={toppingUp}
            style={{
              width: '100%',
              padding: 14,
              background: toppingUp ? THEME.surfaceHover : THEME.primary,
              border: 'none',
              borderRadius: 8,
              color: 'white',
              fontSize: 15,
              fontWeight: 600,
              cursor: toppingUp ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => !toppingUp && (e.currentTarget.style.background = THEME.primaryHover)}
            onMouseLeave={(e) => !toppingUp && (e.currentTarget.style.background = THEME.primary)}
          >
            {toppingUp ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Processing...
              </>
            ) : (
              `Top Up ${currencySymbol}${selectedAmount.toLocaleString()}`
            )}
          </button>
        )}

        {(() => {
          const raw = selectedAmount ?? parseFloat(customAmount);
          if (!raw || isNaN(raw)) return null;
          const chargeNgn = currency === 'NGN'
            ? Math.round(raw)
            : Math.round(convertFromUsd(raw, 'NG'));
          const creditUsd = currency === 'NGN'
            ? convertToUsd(raw, 'NG')
            : raw;
          return (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: THEME.bg, border: `1px solid ${THEME.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: THEME.text2, marginBottom: 6 }}>
                <span>Paystack charge (NGN)</span>
                <span style={{ color: THEME.text1, fontWeight: 600 }}>₦{chargeNgn.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: THEME.text2 }}>
                <span>Wallet credit</span>
                <span style={{ color: THEME.text1, fontWeight: 600 }}>${Number(creditUsd).toFixed(2)}</span>
              </div>
            </div>
          );
        })()}

        <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: `${THEME.primary}10`, border: `1px solid ${THEME.primary}30` }}>
          <div style={{ display: 'flex', gap: 8, fontSize: 13, color: THEME.text2 }}>
            <AlertCircle size={16} color={THEME.primary} />
            <span>Minimum top-up amount is {currencySymbol}{minAmount.toLocaleString()}. All payments are processed securely via Paystack.</span>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div style={{ 
        padding: 24, 
        borderRadius: 16, 
        background: THEME.surface, 
        border: `1px solid ${THEME.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <History size={20} color={THEME.primary} />
          <h2 style={{ fontSize: 20, fontWeight: 600, color: THEME.text1, fontFamily: FONTS.display }}>
            Transaction History
          </h2>
        </div>

        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: THEME.text3 }}>
            <History size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p style={{ fontSize: 14 }}>No transactions yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {transactions.map((tx) => (
              <div
                key={tx.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 16,
                  borderRadius: 8,
                  background: THEME.bg,
                  border: `1px solid ${THEME.border}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 8, 
                    background: tx.type === 'topup' ? `${THEME.success}15` : tx.type === 'purchase' ? `${THEME.primary}15` : `${THEME.error}15`,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                  }}>
                    {tx.type === 'topup' ? (
                      <Plus size={20} color={THEME.success} />
                    ) : tx.type === 'purchase' ? (
                      <Wallet size={20} color={THEME.primary} />
                    ) : (
                      <ArrowUpRight size={20} color={THEME.error} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: THEME.text1, marginBottom: 2 }}>
                      {tx.description}
                    </div>
                    <div style={{ fontSize: 12, color: THEME.text3, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} />
                      {formatDate(tx.createdAt)}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: 16, 
                    fontWeight: 600, 
                    color: Number(tx.amount) >= 0 ? THEME.success : THEME.error,
                    fontFamily: FONTS.display,
                  }}>
                    {formatAmount(tx.amount)}
                  </div>
                  <div style={{ fontSize: 12, color: THEME.text3, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                    {tx.status === 'completed' ? (
                      <>
                        <CheckCircle size={12} color={THEME.success} />
                        Completed
                      </>
                    ) : tx.status === 'pending' ? (
                      <>
                        <Clock size={12} color={THEME.text3} />
                        Pending
                      </>
                    ) : (
                      <>
                        <XCircle size={12} color={THEME.error} />
                        Failed
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}