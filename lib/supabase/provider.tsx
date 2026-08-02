'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabaseClient } from '../supabase-client';

// Internal state for user authentication
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Supabase context
export interface SupabaseContextState {
  areServicesAvailable: boolean;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useSupabase()
export interface SupabaseServicesAndUser {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const SupabaseContext = createContext<SupabaseContextState | undefined>(undefined);

/**
 * SupabaseProvider manages and provides Supabase authentication state.
 */
export const SupabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
  });

  // Effect to subscribe to Supabase auth state changes
  useEffect(() => {
    setUserAuthState({ user: null, isUserLoading: true, userError: null });

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (event, session) => {
        try {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setUserAuthState({ user: session?.user ?? null, isUserLoading: false, userError: null });
          } else if (event === 'SIGNED_OUT') {
            setUserAuthState({ user: null, isUserLoading: false, userError: null });
          }
        } catch (error) {
          console.error("SupabaseProvider: onAuthStateChange error:", error);
          setUserAuthState({ user: null, isUserLoading: false, userError: error as Error });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Memoize the context value
  const contextValue = useMemo((): SupabaseContextState => {
    return {
      areServicesAvailable: true,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [userAuthState]);

  return (
    <SupabaseContext.Provider value={contextValue}>
      {children}
    </SupabaseContext.Provider>
  );
};

/**
 * Hook to access Supabase authentication state.
 * Throws error if used outside provider.
 */
export const useSupabase = (): SupabaseServicesAndUser => {
  const context = useContext(SupabaseContext);

  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider.');
  }

  return {
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError } = useSupabase();
  return { user, isUserLoading, userError };
};
