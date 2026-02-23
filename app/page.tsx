'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { isLoading, isAuthenticated, shop } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && shop) {
      router.replace('/dashboard');
    } else if (isAuthenticated && !shop) {
      router.replace('/onboarding');
    } else {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, shop, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-page">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
    </div>
  );
}
