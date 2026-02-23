'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Mic, LayoutDashboard, Receipt, Package, BarChart3, Settings,
  LogOut, Store, X, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { href: '/voice-hub', label: 'Voice Hub', icon: Mic, description: 'Voice commands' },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview' },
  { href: '/billing', label: 'Billing', icon: Receipt, description: 'Transactions' },
  { href: '/inventory', label: 'Inventory', icon: Package, description: 'Products' },
  { href: '/reports', label: 'Reports', icon: BarChart3, description: 'Analytics' },
  { href: '/settings', label: 'Settings', icon: Settings, description: 'Preferences' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { shop, signOut } = useAuth();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Store className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-foreground">ShopKeeper AI</p>
            <p className="text-[10px] text-muted-foreground">Voice-First Commerce</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 rounded-md hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Shop Info */}
      {shop && (
        <div className="px-4 py-3 border-b border-border/60 bg-muted/30">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Your Shop</p>
          <p className="text-sm font-semibold text-foreground truncate">{shop.name}</p>
          {shop.name_ml && <p className="text-xs text-muted-foreground truncate">{shop.name_ml}</p>}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative',
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
              )}
              <Icon className={cn('h-4.5 w-4.5 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} style={{ width: '18px', height: '18px' }} />
              <span>{label}</span>
              {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 text-primary" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Logout */}
      <div className="px-3 pb-4 border-t border-border/60 pt-3">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all w-full text-left"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col border-r border-border bg-white z-30">
        <SidebarContent />
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl lg:hidden">
            <SidebarContent />
          </div>
        </>
      )}
    </>
  );
}
