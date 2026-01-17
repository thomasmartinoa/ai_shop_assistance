'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/shared/Sidebar';
import { Header } from '@/components/shared/Header';
import { Loader2 } from 'lucide-react';

// TEMPORARY: Set to true to bypass login for testing
const BYPASS_AUTH_FOR_TESTING = true;

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isLoading, isAuthenticated, shop } = useAuth();

  useEffect(() => {
    // Skip auth redirect when bypassing for testing
    if (BYPASS_AUTH_FOR_TESTING) return;
    
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading state (skip if bypassing auth)
  if (isLoading && !BYPASS_AUTH_FOR_TESTING) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render if not authenticated (skip if bypassing auth)
  if (!isAuthenticated && !BYPASS_AUTH_FOR_TESTING) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
