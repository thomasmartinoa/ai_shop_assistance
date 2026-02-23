'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Shop } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  shop: Shop | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshShop: () => Promise<void>;
  enableDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo shop for testing without Supabase
const DEMO_SHOP: Shop = {
  id: 'demo-shop-id',
  owner_id: 'demo-user-id',
  name: 'Demo Store',
  name_ml: 'ഡെമോ സ്റ്റോർ',
  address: 'Demo Address, Kerala',
  phone: '+919876543210',
  upi_id: 'demostore@upi',
  gstin: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Demo user for testing
const DEMO_USER = {
  id: 'demo-user-id',
  phone: '+919876543210',
  email: null,
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as unknown as User;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const supabase = createClient();

  // Check if we're in demo mode (no Supabase)
  const isSupabaseConfigured = supabase !== null;

  // Fetch shop data for the current user
  const fetchShop = useCallback(async (userId: string) => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (new user)
      console.error('Error fetching shop:', error);
    }
    setShop(data);
  }, [supabase]);

  const refreshShop = useCallback(async () => {
    if (isDemoMode) {
      setShop(DEMO_SHOP);
      return;
    }
    if (user) {
      await fetchShop(user.id);
    }
  }, [user, fetchShop, isDemoMode]);

  // Enable demo mode
  const enableDemoMode = useCallback(() => {
    setIsDemoMode(true);
    setUser(DEMO_USER);
    setShop(DEMO_SHOP);
    setIsLoading(false);
  }, []);

  // Initialize auth state
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      console.log('[Auth] Supabase not configured, demo mode available');
      setIsLoading(false);
      return;
    }

    console.log('[Auth] Initializing auth...');

    // Safety timeout — never spin forever
    const timeout = setTimeout(() => {
      console.warn('[Auth] Auth init timed out after 8s, forcing loaded state');
      setIsLoading(false);
    }, 8000);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] onAuthStateChange:', event, session ? 'has session' : 'no session');
        setSession(session);
        setUser(session?.user ?? null);

        try {
          if (session?.user) {
            await fetchShop(session.user.id);
          } else {
            setShop(null);
          }
        } catch (err) {
          console.error('[Auth] fetchShop error in onAuthStateChange:', err);
        }
        clearTimeout(timeout);
        setIsLoading(false);
      }
    );

    // Get the current session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('[Auth] getSession result:', session ? 'has session' : 'no session');
      try {
        if (session) {
          setSession(session);
          setUser(session.user);
          await fetchShop(session.user.id);
        }
      } catch (err) {
        console.error('[Auth] fetchShop error in getSession:', err);
      }
      clearTimeout(timeout);
      setIsLoading(false);
    }).catch((err) => {
      console.error('[Auth] getSession error:', err);
      clearTimeout(timeout);
      setIsLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [supabase, fetchShop, isSupabaseConfigured]);

  // Sign in with Google OAuth
  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured || !supabase) {
      enableDemoMode();
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin + '/dashboard' : undefined,
        },
      });
      return { error: error ? new Error(error.message) : null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign out
  const signOut = async () => {
    if (isDemoMode) {
      setIsDemoMode(false);
      setUser(null);
      setSession(null);
      setShop(null);
      return;
    }

    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setShop(null);
  };

  const value = {
    user,
    session,
    shop,
    isLoading,
    isAuthenticated: !!user || isDemoMode,
    isDemoMode,
    signInWithGoogle,
    signOut,
    refreshShop,
    enableDemoMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
