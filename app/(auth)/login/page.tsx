'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, signInWithGoogle, enableDemoMode } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  const handleGoogle = async () => {
    await signInWithGoogle();
  };

  const handleDemo = () => {
    enableDemoMode();
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-50 mb-4">
            <ShoppingBag className="w-7 h-7 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ShopKeeper AI</h1>
          <p className="text-sm text-gray-500 mt-1">Smart assistant for Kerala shopkeepers</p>
        </div>

        {/* Google Sign In */}
        <Button
          onClick={handleGoogle}
          className="w-full h-12 text-base font-medium bg-orange-500 hover:bg-orange-600"
        >
          Continue with Google
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 uppercase">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Demo Mode */}
        <button
          onClick={handleDemo}
          className="w-full text-sm text-gray-500 hover:text-orange-600 py-2 transition-colors"
        >
          Try Demo Mode →
        </button>
      </div>
    </div>
  );
}
