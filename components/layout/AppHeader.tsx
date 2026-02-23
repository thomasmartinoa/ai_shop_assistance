'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AppHeader() {
  const { user, shop, isDemoMode, signOut } = useAuth();

  const displayName = shop?.name || (isDemoMode ? 'Demo Store' : 'My Shop');
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 lg:hidden flex items-center justify-between bg-white border-b border-gray-100 h-14 px-4">
      <span className="text-base font-semibold text-gray-900">ShopKeeper AI</span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 text-sm font-medium">
            {initial}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => signOut()} className="text-red-600">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
