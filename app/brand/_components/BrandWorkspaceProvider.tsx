'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';

export interface WorkspaceOrder {
  id: string;
  status?: string;
  paymentStatus?: string;
  brandId?: string;
  creatorId?: string;
  productName?: string;
  brief?: string;
  deliverables?: string;
  deadline?: string | null;
  videoLength?: string | null;
  agreedPrice?: number | null;
  platformFee?: number | null;
  creatorPayout?: number | null;
  depositAmount?: number | null;
  balanceAmount?: number | null;
  draftVideoUrl?: string | null;
  finalVideoUrl?: string | null;
  review?: string | null;
  rejectionReason?: string | null;
  disputeReason?: string | null;
  requestedAt?: string | null;
  acceptedAt?: string | null;
  draftSubmittedAt?: string | null;
  completedAt?: string | null;
  paidOutAt?: string | null;
  paystackTransferCode?: string | null;
  creator?: any;
  [key: string]: any;
}

interface WorkspaceValue {
  brand: any;
  user: any;
  orders: WorkspaceOrder[];
  purchases: any[];
  transactions: any[];
  loading: boolean;
  refreshing: boolean;
  briefModalOpen: boolean;
  setBriefModalOpen: (open: boolean) => void;
  briefPrefill: any;
  setBriefPrefill: (creator: any | null) => void;
  refresh: () => Promise<void>;
  createBrief: (payload: Record<string, any>) => Promise<any>;
  reviewVideo: (orderId: string, stage: 'draft' | 'final', decision: 'approve' | 'reject', note?: string) => Promise<any>;
  payBalance: (orderId: string) => Promise<any>;
  releasePayout: (orderId: string) => Promise<any>;
  openDispute: (orderId: string, reason: string, note?: string) => Promise<any>;
  updateProfile: (payload: Record<string, string>) => Promise<any>;
}

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

export function useBrandWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useBrandWorkspace must be used inside BrandWorkspaceProvider');
  return ctx;
}

export function BrandWorkspaceProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [brand, setBrand] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<WorkspaceOrder[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [briefModalOpen, setBriefModalOpen] = useState(false);
  const [briefPrefill, setBriefPrefill] = useState<any>(null);

  const request = useCallback(async (body?: Record<string, any>) => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const response = await fetch('/api/brand/workspace', {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok || json.error) {
      throw new Error(json.error || `Request failed (${response.status})`);
    }
    return json;
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await request();
      setBrand(data.brand ?? null);
      setOrders(data.orders ?? []);
      setPurchases(data.purchases ?? []);
      setTransactions(data.transactions ?? []);
    } catch (error) {
      console.error('[BrandWorkspace] load failed:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user: authUser } } = await supabaseClient.auth.getUser();
      if (!active) return;
      if (!authUser) {
        router.push('/brand-auth/login');
        setLoading(false);
        return;
      }
      setUser(authUser);
      await refresh();
    })();
    return () => { active = false; };
  }, [refresh, router]);

  const createBrief = useCallback(async (payload: Record<string, any>) => {
    const result = await request({ action: 'create_brief', ...payload });
    await refresh();
    return result;
  }, [request, refresh]);

  const reviewVideo = useCallback(async (
    orderId: string,
    stage: 'draft' | 'final',
    decision: 'approve' | 'reject',
    note?: string
  ) => {
    const result = await request({ action: 'review_video', orderId, stage, decision, note });
    await refresh();
    return result;
  }, [request, refresh]);

  const payBalance = useCallback(async (orderId: string) => {
    const result = await request({ action: 'pay_balance', orderId });
    await refresh();
    return result;
  }, [request, refresh]);

  const releasePayout = useCallback(async (orderId: string) => {
    const result = await request({ action: 'release_payout', orderId });
    await refresh();
    return result;
  }, [request, refresh]);

  const openDispute = useCallback(async (orderId: string, reason: string, note?: string) => {
    const result = await request({ action: 'open_dispute', orderId, reason, note });
    await refresh();
    return result;
  }, [request, refresh]);

  const updateProfile = useCallback(async (payload: Record<string, string>) => {
    const result = await request({ action: 'update_profile', ...payload });
    await refresh();
    return result;
  }, [request, refresh]);

  const value = useMemo<WorkspaceValue>(() => ({
    brand,
    user,
    orders,
    purchases,
    transactions,
    loading,
    refreshing,
    briefModalOpen,
    setBriefModalOpen,
    briefPrefill,
    setBriefPrefill,
    refresh,
    createBrief,
    reviewVideo,
    payBalance,
    releasePayout,
    openDispute,
    updateProfile,
  }), [
    brand, user, orders, purchases, transactions, loading, refreshing,
    briefModalOpen, briefPrefill, refresh, createBrief, reviewVideo, payBalance, releasePayout, openDispute, updateProfile,
  ]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
