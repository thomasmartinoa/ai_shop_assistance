'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomTabs } from '@/components/layout/BottomTabs';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoading, isAuthenticated, shop, isDemoMode } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (!shop && !isDemoMode) {
      router.replace('/onboarding');
    }
  }, [isLoading, isAuthenticated, shop, isDemoMode, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-page pb-20 lg:pb-6">
          {children}
        </main>
        <BottomTabs />
      </div>
    </div>
  );
}
