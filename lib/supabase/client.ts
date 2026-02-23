import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Check if Supabase is properly configured (not placeholder values)
 */
function isSupabaseConfigured(): boolean {
  if (!supabaseUrl || !supabaseAnonKey) {
    return false;
  }
  
  // Check for placeholder values
  if (
    supabaseUrl.includes('your-project') ||
    supabaseUrl === 'https://your-project.supabase.co' ||
    supabaseAnonKey === 'your-anon-key-here' ||
    supabaseAnonKey.length < 20
  ) {
    return false;
  }
  
  return true;
}

// Singleton client instance
let client: SupabaseClient<Database> | null = null;

/**
 * Create a Supabase client for browser use.
 * Uses implicit OAuth flow (tokens in URL hash) — ideal for static exports.
 */
export function createClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  // Return singleton — prevents re-creating client on every render
  if (client) return client;

  client = createSupabaseClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      flowType: 'implicit',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return client;
}

export function getSupabaseClient(): SupabaseClient<Database> | null {
  return createClient();
}
