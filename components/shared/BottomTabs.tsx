'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Mic, LayoutDashboard, Receipt, Package, MoreHorizontal, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';

const tabs = [
  { href: '/voice-hub', label: 'Voice', icon: Mic },
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/billing', label: 'Billing', icon: Receipt },
  { href: '/inventory', label: 'Stock', icon: Package },
];

const moreTabs = [
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function BottomTabs() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close more menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false);
      }
    }
    if (showMore) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMore]);

  const isMoreActive = moreTabs.some(t => t.href === pathname);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-border/60 lg:hidden safe-area-bottom">
      <div className="flex items-stretch h-16">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors relative',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-b-full" />
              )}
              <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
              <span className={cn('text-[10px] font-medium', isActive ? 'font-semibold' : '')}>{label}</span>
            </Link>
          );
        })}

        {/* More button */}
        <div ref={moreRef} className="flex-1 relative">
          <button
            onClick={() => setShowMore(v => !v)}
            className={cn(
              'w-full h-full flex flex-col items-center justify-center gap-0.5 py-2 transition-colors',
              isMoreActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {isMoreActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-b-full" />
            )}
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>

          {showMore && (
            <div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-xl border border-border p-1.5 min-w-[150px]">
              {moreTabs.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setShowMore(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                    pathname === href ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
