// Brand Database Schema Types

export interface Brand {
  id: string;
  brandName: string;
  email: string;
  phone: string;
  website?: string;
  industry: string;
  walletBalance: number;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'suspended' | 'pending';
}

export interface PurchasedVideo {
  id: string;
  brandId: string;
  videoId: string;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  creatorAvatar?: string;
  videoTitle: string;
  videoThumbnail: string;
  videoUrl: string;
  platform: 'tiktok' | 'instagram' | 'youtube' | 'other';
  price: number;
  paymentMethod: 'wallet' | 'direct';
  licenseType: 'commercial' | 'exclusive' | 'standard';
  purchaseDate: string;
  licenseExpiry?: string;
  platformViews?: number;
  platformLikes?: number;
  platformComments?: number;
  platformShares?: number;
  status: 'active' | 'expired' | 'refunded';
  campaignId?: string;
  tags?: string[];
}

export interface WalletTransaction {
  id: string;
  brandId: string;
  type: 'topup' | 'purchase' | 'refund' | 'withdrawal';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  videoId?: string;
  paymentMethod?: 'paystack' | 'flutterwave' | 'card' | 'paypal';
  paymentReference?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface VideoPerformance {
  id: string;
  purchasedVideoId: string;
  brandId: string;
  date: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  source: 'api' | 'manual';
}

export interface Campaign {
  id: string;
  brandId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  budget: number;
  spent: number;
  status: 'active' | 'completed' | 'paused';
  videoIds: string[];
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface BrandResponse {
  success: boolean;
  brand?: Brand;
  error?: string;
}

export interface PurchasedVideosResponse {
  success: boolean;
  videos?: PurchasedVideo[];
  total?: number;
  error?: string;
}

export interface WalletBalanceResponse {
  success: boolean;
  balance?: number;
  error?: string;
}

export interface TransactionsResponse {
  success: boolean;
  transactions?: WalletTransaction[];
  total?: number;
  error?: string;
}

export interface TopUpResponse {
  success: boolean;
  authorizationUrl?: string;
  reference?: string;
  error?: string;
}

export interface PurchaseVideoResponse {
  success: boolean;
  purchasedVideo?: PurchasedVideo;
  transaction?: WalletTransaction;
  error?: string;
}