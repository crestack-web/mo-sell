/**
 * Supabase Authentication
 * 
 * Replaces Firebase Auth with Supabase Auth.
 * Provides helper functions for authentication and session management.
 */

import { supabaseServer } from './supabase-server';
import type { User } from '@supabase/supabase-js';

// Helper function to check if Supabase is available
function isSupabaseAvailable(): boolean {
  return supabaseServer !== null;
}

/**
 * Get the current authenticated user from the session
 * Works with Supabase Auth tokens
 * 
 * @returns User object if authenticated, null otherwise
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    // Get session from Supabase
    if (!supabaseServer) {
      return null;
    }
    
    const { data: { session } } = await supabaseServer.auth.getSession();
    
    if (!session?.user) {
      return null;
    }

    return session.user;
  } catch (error) {
    console.error('[Auth] Failed to get current user:', error);
    return null;
  }
}

/**
 * Verify a user's email using a token
 * 
 * @param token - Email verification token
 * @returns Success status
 */
export async function verifyEmail(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabaseServer) {
      return { success: false, error: 'Service unavailable' };
    }
    
    const { data, error } = await supabaseServer.auth.verifyOtp({
      token_hash: token,
      type: 'email',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[Auth] Email verification failed:', error);
    return { success: false, error: 'Verification failed' };
  }
}

/**
 * Send password reset email
 * 
 * @param email - User's email address
 * @returns Success status
 */
export async function sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabaseServer) {
      return { success: false, error: 'Service unavailable' };
    }
    
    const { error } = await supabaseServer.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://mo-sell.store'}/auth/reset-password`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[Auth] Password reset email failed:', error);
    return { success: false, error: 'Failed to send reset email' };
  }
}

/**
 * Update user password
 * 
 * @param newPassword - New password
 * @returns Success status
 */
export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isSupabaseAvailable()) {
      return { success: false, error: 'Service unavailable' };
    }
    
    const { error } = await supabaseServer!.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[Auth] Password update failed:', error);
    return { success: false, error: 'Failed to update password' };
  }
}

/**
 * Update user profile
 * 
 * @param updates - User profile updates
 * @returns Success status
 */
export async function updateUserProfile(updates: {
  email?: string;
  password?: string;
  data?: { full_name?: string; avatar_url?: string };
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isSupabaseAvailable()) {
      return { success: false, error: 'Service unavailable' };
    }
    
    const { error } = await supabaseServer!.auth.updateUser(updates);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[Auth] Profile update failed:', error);
    return { success: false, error: 'Failed to update profile' };
  }
}

/**
 * Sign out the current user
 * 
 * @returns Success status
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isSupabaseAvailable()) {
      return { success: false, error: 'Service unavailable' };
    }
    
    const { error } = await supabaseServer!.auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[Auth] Sign out failed:', error);
    return { success: false, error: 'Failed to sign out' };
  }
}

/**
 * Get user profile from database
 * 
 * @param userId - User ID
 * @returns User profile or null
 */
export async function getUserProfile(userId: string): Promise<{
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  business_id?: string;
} | null> {
  try {
    if (!isSupabaseAvailable()) {
      return null;
    }
    
    const { data, error } = await supabaseServer!
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('[Auth] Failed to get user profile:', error);
    return null;
  }
}

/**
 * Create a new user account
 * 
 * @param email - User email
 * @param password - User password
 * @param fullName - User's full name
 * @returns User object or error
 */
export async function createUser(
  email: string,
  password: string,
  fullName?: string
): Promise<{ user: User | null; error?: string }> {
  try {
    if (!isSupabaseAvailable()) {
      return { user: null, error: 'Service unavailable' };
    }
    
    const { data, error } = await supabaseServer!.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      return { user: null, error: error.message };
    }

    return { user: data.user };
  } catch (error) {
    console.error('[Auth] User creation failed:', error);
    return { user: null, error: 'Failed to create user' };
  }
}

/**
 * Sign in with email and password
 * 
 * @param email - User email
 * @param password - User password
 * @returns Session data or error
 */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<{ session: any; user: User | null; error?: string }> {
  try {
    if (!isSupabaseAvailable()) {
      return { session: null, user: null, error: 'Service unavailable' };
    }
    
    const { data, error } = await supabaseServer!.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { session: null, user: null, error: error.message };
    }

    return { session: data.session, user: data.user };
  } catch (error) {
    console.error('[Auth] Sign in failed:', error);
    return { session: null, user: null, error: 'Failed to sign in' };
  }
}

/**
 * Sign in with OAuth provider
 * 
 * @param provider - OAuth provider (google, github, etc.)
 * @returns Redirect URL or error
 */
export async function signInWithOAuth(provider: 'google' | 'github' | 'facebook'): Promise<{ url: string | null; error?: string }> {
  try {
    if (!isSupabaseAvailable()) {
      return { url: null, error: 'Service unavailable' };
    }
    
    const { data, error } = await supabaseServer!.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://mo-sell.store'}/auth/callback`,
      },
    });

    if (error) {
      return { url: null, error: error.message };
    }

    return { url: data.url };
  } catch (error) {
    console.error('[Auth] OAuth sign in failed:', error);
    return { url: null, error: 'Failed to sign in' };
  }
}

/**
 * Refresh the current session
 * 
 * @returns New session or null
 */
export async function refreshSession(): Promise<any> {
  try {
    if (!isSupabaseAvailable()) {
      return null;
    }
    
    const { data, error } = await supabaseServer!.auth.refreshSession();

    if (error) {
      return null;
    }

    return data.session;
  } catch (error) {
    console.error('[Auth] Session refresh failed:', error);
    return null;
  }
}