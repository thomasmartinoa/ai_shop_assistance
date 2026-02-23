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
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const url = `${SUPABASE_URL}/functions/v1/${functionName}`;

        // Get auth token if available, fall back to anon key
        let authToken = anonKey || '';
        if (supabase) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                authToken = session.access_token;
            }
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
        };
        if (anonKey) {
            headers['apikey'] = anonKey;
        }

        let response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        // If session token expired (401), retry with anon key
        if (response.status === 401 && anonKey && authToken !== anonKey) {
            console.warn(`Edge function ${functionName}: 401 with session token, retrying with anon key`);
            headers['Authorization'] = `Bearer ${anonKey}`;
            response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });
        }

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
