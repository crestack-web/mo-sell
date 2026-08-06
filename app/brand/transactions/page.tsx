'use client';

import React, { useState, useEffect } from 'react';
import { getDatabase } from '@/lib/database/adapter';
import { supabaseClient } from '@/lib/supabase-client';
import { 
  Receipt, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  Filter, 
  Download,
  CheckCircle, 
  Clock, 
  XCircle,
  Loader2,
  Calendar
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
  videoId?: string;
}

export default function BrandTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      const db = getDatabase();
      
      // Get brand ID
      const brandQuery = await db.collection('brands').where('userId', '==', user.id).limit(1).get();
      if (brandQuery.docs.length === 0) return;
      
      const brandId = brandQuery.docs[0].id;

      // Get transactions
      const transactionsQuery = await db.collection('wallet_transactions')
        .where('brandId', '==', brandId)
        .get();
      
      const txs = transactionsQuery.docs.map(doc => doc.data() as Transaction);
      setTransactions(txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const txDate = new Date(tx.createdAt);
      const now = new Date();
      if (dateFilter === 'today') {
        matchesDate = txDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = txDate >= weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = txDate >= monthAgo;
      }
    }

    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

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
    return amount >= 0 ? `+$${amount.toFixed(2)}` : `-$${Math.abs(amount).toFixed(2)}`;
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Description', 'Amount', 'Balance Before', 'Balance After', 'Status', 'Payment Method'];
    const rows = filteredTransactions.map(tx => [
      formatDate(tx.createdAt),
      tx.type,
      tx.description,
      formatAmount(tx.amount),
      `$${tx.balanceBefore.toFixed(2)}`,
      `$${tx.balanceAfter.toFixed(2)}`,
      tx.status,
      tx.paymentMethod || 'N/A',
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: THEME.text1, fontFamily: FONTS.display, marginBottom: 8 }}>
            Transactions
          </h1>
          <p style={{ fontSize: 16, color: THEME.text2 }}>
            Full ledger of all wallet top-ups, purchases, and refunds
          </p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={filteredTransactions.length === 0}
          style={{
            padding: '12px 20px',
            background: filteredTransactions.length === 0 ? THEME.surfaceHover : THEME.primary,
            border: 'none',
            borderRadius: 8,
            color: 'white',
            fontSize: 14,
            fontWeight: 600,
            cursor: filteredTransactions.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => filteredTransactions.length > 0 && (e.currentTarget.style.background = THEME.primaryHover)}
          onMouseLeave={(e) => filteredTransactions.length > 0 && (e.currentTarget.style.background = THEME.primary)}
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div style={{ 
        padding: 20, 
        borderRadius: 12, 
        background: THEME.surface, 
        border: `1px solid ${THEME.border}`,
        marginBottom: 24,
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={18} color={THEME.text3} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              background: THEME.bg,
              border: `1px solid ${THEME.border}`,
              borderRadius: 8,
              color: THEME.text1,
              fontSize: 14,
              outline: 'none',
            }}
            onFocus={(e) => e.target.style.borderColor = THEME.primary}
            onBlur={(e) => e.target.style.borderColor = THEME.border}
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{
            padding: '10px 16px',
            background: THEME.bg,
            border: `1px solid ${THEME.border}`,
            borderRadius: 8,
            color: THEME.text1,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          <option value="all">All Types</option>
          <option value="topup">Top-ups</option>
          <option value="purchase">Purchases</option>
          <option value="refund">Refunds</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '10px 16px',
            background: THEME.bg,
            border: `1px solid ${THEME.border}`,
            borderRadius: 8,
            color: THEME.text1,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{
            padding: '10px 16px',
            background: THEME.bg,
            border: `1px solid ${THEME.border}`,
            borderRadius: 8,
            color: THEME.text1,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Transactions Table */}
      {filteredTransactions.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 80, 
          borderRadius: 16, 
          background: THEME.surface, 
          border: `1px solid ${THEME.border}`,
        }}>
          <Receipt size={64} color={THEME.text3} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: 20, fontWeight: 600, color: THEME.text1, marginBottom: 8 }}>
            No transactions found
          </h3>
          <p style={{ fontSize: 14, color: THEME.text2 }}>
            {transactions.length === 0 
              ? "You haven't made any transactions yet" 
              : 'Try adjusting your filters'}
          </p>
        </div>
      ) : (
        <div style={{ 
          borderRadius: 16, 
          background: THEME.surface, 
          border: `1px solid ${THEME.border}`,
          overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
          {/* Table Header */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '200px 1fr 120px 120px 120px 120px 100px',
            minWidth: 980,
            padding: 16,
            background: THEME.bg,
            borderBottom: `1px solid ${THEME.border}`,
            fontSize: 13,
            fontWeight: 600,
            color: THEME.text2,
          }}>
            <div>Date</div>
            <div>Description</div>
            <div>Type</div>
            <div>Amount</div>
            <div>Balance Before</div>
            <div>Balance After</div>
            <div>Status</div>
          </div>

          {/* Table Rows */}
          {filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '200px 1fr 120px 120px 120px 120px 100px',
                minWidth: 980,
                padding: 16,
                borderBottom: `1px solid ${THEME.border}`,
                fontSize: 14,
                alignItems: 'center',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = THEME.surfaceHover}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ color: THEME.text3, fontSize: 13 }}>
                {formatDate(tx.createdAt)}
              </div>
              
              <div style={{ color: THEME.text1, fontWeight: 500 }}>
                {tx.description}
              </div>

              <div>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 500,
                  background: tx.type === 'topup' ? `${THEME.success}15` : tx.type === 'purchase' ? `${THEME.primary}15` : `${THEME.error}15`,
                  color: tx.type === 'topup' ? THEME.success : tx.type === 'purchase' ? THEME.primary : THEME.error,
                }}>
                  {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                </span>
              </div>

              <div style={{ 
                color: tx.amount >= 0 ? THEME.success : THEME.error, 
                fontWeight: 600,
                fontFamily: FONTS.display,
              }}>
                {formatAmount(tx.amount)}
              </div>

              <div style={{ color: THEME.text2 }}>
                ${tx.balanceBefore.toFixed(2)}
              </div>

              <div style={{ color: THEME.text2 }}>
                ${tx.balanceAfter.toFixed(2)}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                  {tx.status === 'completed' ? (
                    <>
                      <CheckCircle size={14} color={THEME.success} />
                      <span style={{ color: THEME.success }}>Completed</span>
                    </>
                  ) : tx.status === 'pending' ? (
                    <>
                      <Clock size={14} color={THEME.text3} />
                      <span style={{ color: THEME.text3 }}>Pending</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={14} color={THEME.error} />
                      <span style={{ color: THEME.error }}>Failed</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}