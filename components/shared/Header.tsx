'use client';

import { useState } from 'react';
import { Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const { shop, user } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white border-b h-16 flex items-center justify-between px-4 lg:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Page title - dynamic based on route */}
      <div className="flex-1 lg:flex-none">
        <h1 className="text-lg font-semibold hidden lg:block">
          {shop?.name || 'Shopkeeper AI'}
        </h1>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {/* Notification badge */}
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        {/* User avatar */}
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
          {user?.phone?.slice(-2) || 'U'}
        </div>
      </div>
    </header>
  );
}
