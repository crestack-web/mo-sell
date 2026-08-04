/**
 * Supabase Server Client
 * 
 * Provides a Supabase client for server-side operations.
 * This is used for authentication and database operations on the server.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// During build time, environment variables might not be available
// Return a mock client or handle gracefully
if (!supabaseUrl || !supabaseServiceKey) {
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    console.warn('Missing Supabase environment variables');
  }
}

export const supabaseServer = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
