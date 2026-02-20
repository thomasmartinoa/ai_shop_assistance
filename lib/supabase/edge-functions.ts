import { getSupabaseClient } from './client';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * Call a Supabase Edge Function with automatic auth token injection
 */
export async function callEdgeFunction<T = any>(
    functionName: string,
    body: Record<string, unknown>
): Promise<{ data: T | null; error: string | null }> {
    try {
        const supabase = getSupabaseClient();

        // Build the Edge Function URL
        const url = `${SUPABASE_URL}/functions/v1/${functionName}`;

        // Get auth token if available
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (supabase) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }
        }

        // Fallback: use anon key if no session
        if (!headers['Authorization']) {
            const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
            if (anonKey) {
                headers['Authorization'] = `Bearer ${anonKey}`;
                headers['apikey'] = anonKey;
            }
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: response.statusText }));
            return { data: null, error: errorData.error || `Edge function error: ${response.status}` };
        }

        const data = await response.json();
        return { data, error: null };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Edge function ${functionName} error:`, message);
        return { data: null, error: message };
    }
}

/**
 * Check if Edge Functions are available (Supabase configured)
 */
export function isEdgeFunctionsAvailable(): boolean {
    return !!SUPABASE_URL && !SUPABASE_URL.includes('your-project');
}
