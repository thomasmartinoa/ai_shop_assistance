import { createBrowserClient } from '@supabase/ssr';
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

/**
 * Create a Supabase client for browser use
 */
export function createClient() {
  // Return null if credentials are missing or placeholder (demo mode)
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured or using placeholder values. Running in demo mode.');
    return null;
  }

  return createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!);
}

// Export a singleton instance for convenience
let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!client) {
    client = createClient();
  }
  return client;
}
