'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Store, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { signInWithGoogle, enableDemoMode } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemoMode = () => {
    enableDemoMode();
    router.push('/voice-hub');
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        if (error.message.includes('fetch') || error.message.includes('network')) {
          setError('Cannot connect to server. Try Demo Mode below.');
        } else {
          setError(error.message);
        }
      }
      // On success, Supabase redirects to Google — no router.push needed
    } catch {
      setError('Connection failed. Try Demo Mode below.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/60 via-white to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">ShopKeeper AI</h1>
          <p className="text-sm text-muted-foreground mt-1">ഷോപ്പ്കീപ്പർ AI — Voice-First Commerce</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground text-center">Welcome</h2>
            <p className="text-sm text-muted-foreground mt-0.5 text-center">Sign in to manage your shop</p>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            onClick={handleGoogleSignIn}
            className="w-full"
            size="lg"
            variant="outline"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            Continue with Google
          </Button>
        </div>

        {/* Demo mode */}
        <p className="text-center mt-6 text-xs text-muted-foreground">
          Just exploring?{' '}
          <button
            onClick={handleDemoMode}
            className="text-primary hover:underline font-medium"
          >
            Try Demo Mode
          </button>
        </p>
      </div>
    </div>
  );
}
