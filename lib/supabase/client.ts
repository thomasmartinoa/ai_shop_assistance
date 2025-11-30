import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Create a Supabase client for browser use
 */
export function createClient() {
  // Return a dummy client if credentials are missing (dev mode without Supabase)
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured. Running in demo mode.');
    // Return null to indicate no Supabase connection
    return null;
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

// Export a singleton instance for convenience
let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!client) {
    client = createClient();
  }
  return client;
}
