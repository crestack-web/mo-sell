/**
 * Supabase Client
 * 
 * Provides a Supabase client for client-side operations.
 * This is used for authentication and database operations on the client.
 */

import { createClient } from '@supabase/supabase-js';

let supabaseClientInstance: ReturnType<typeof createClient> | null = null;

export const supabaseClient = (() => {
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time, return a mock client to prevent build failures
    if (typeof window === 'undefined') {
      return createClient('https://mock.supabase.co', 'mock-key', {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      }) as any;
    }
    throw new Error('Missing Supabase environment variables');
  }

  supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return supabaseClientInstance;
})();
