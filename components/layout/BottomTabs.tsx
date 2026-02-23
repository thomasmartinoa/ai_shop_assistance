'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Mic,
  Receipt,
  Package,
  MoreHorizontal,
  BarChart3,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Voice', href: '/voice-hub', icon: Mic },
  { label: 'Sales', href: '/billing', icon: Receipt },
  { label: 'Inventory', href: '/inventory', icon: Package },
];

const moreItems = [
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function BottomTabs() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = moreItems.some(
    (item) => pathname === item.href || pathname?.startsWith(item.href + '/')
  );

  return (
    <>
      {/* More menu overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMoreOpen(false)}>
          <div className="absolute bottom-16 right-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2">
            {moreItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                    isActive ? 'text-orange-500 bg-orange-50' : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-white border-t border-gray-100 h-16">
        <div className="flex items-center justify-around h-full px-2">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || pathname?.startsWith(tab.href + '/');
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex flex-col items-center gap-1 py-1 px-3 min-w-0',
                  isActive ? 'text-orange-500' : 'text-gray-400'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{tab.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn(
              'flex flex-col items-center gap-1 py-1 px-3 min-w-0',
              isMoreActive || moreOpen ? 'text-orange-500' : 'text-gray-400'
            )}
          >
            {moreOpen ? <X className="w-5 h-5" /> : <MoreHorizontal className="w-5 h-5" />}
            <span className="text-xs">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
