'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const pageTitles: Record<string, string> = {
  '/voice-hub': 'Voice Hub',
  '/dashboard': 'Dashboard',
  '/billing': 'Billing & Transactions',
  '/inventory': 'Inventory',
  '/reports': 'Reports & Analytics',
  '/settings': 'Settings',
};

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const { user, shop } = useAuth();
  const pageTitle = pageTitles[pathname] || 'ShopKeeper AI';

  const phone = user?.phone?.replace('+91', '') || '';
  const initials = phone ? phone.slice(-2) : 'SK';

  return (
    <header className="sticky top-0 z-20 flex items-center h-14 px-4 bg-white/90 backdrop-blur border-b border-border/60 gap-3">
      {/* Mobile menu button */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-foreground truncate">{pageTitle}</h1>
        {shop && (
          <p className="text-xs text-muted-foreground truncate hidden sm:block">{shop.name}</p>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <button className="p-2 rounded-lg hover:bg-muted transition-colors relative">
          <Bell className="h-4.5 w-4.5 text-muted-foreground" style={{ width: '18px', height: '18px' }} />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-destructive rounded-full" />
        </button>
        <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center ml-1">
          <span className="text-xs font-semibold text-primary">{initials}</span>
        </div>
      </div>
    </header>
  );
}
