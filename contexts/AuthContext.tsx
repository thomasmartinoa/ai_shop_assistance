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
  signInWithOtp: (phone: string) => Promise<{ error: Error | null }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: Error | null }>;
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
    const initAuth = async () => {
      // If Supabase is not configured, just stop loading
      // Don't auto-enable demo mode - let user click "Get Started" first
      if (!isSupabaseConfigured) {
        console.log('Supabase not configured, demo mode available');
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase!.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchShop(session.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes only if Supabase is configured
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            await fetchShop(session.user.id);
          } else {
            setShop(null);
          }
        }
      );

      return () => subscription.unsubscribe();
    }
  }, [supabase, fetchShop, isSupabaseConfigured, enableDemoMode]);

  // Sign in with phone OTP
  const signInWithOtp = async (phone: string) => {
    if (!isSupabaseConfigured || !supabase) {
      // In demo mode, proceed to OTP step (don't auto-login yet)
      // This allows user to see the OTP verification flow
      return { error: null, isDemo: true };
    }

    try {
      // Format phone number for India
      const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      return { error: error ? new Error(error.message) : null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Verify OTP
  const verifyOtp = async (phone: string, token: string) => {
    if (!isSupabaseConfigured || !supabase) {
      // In demo mode, accept demo OTP
      if (token === '123456') {
        enableDemoMode();
        return { error: null };
      }
      return { error: new Error('Demo OTP is 123456') };
    }

    try {
      const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
      
      const { error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token,
        type: 'sms',
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
    signInWithOtp,
    verifyOtp,
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
