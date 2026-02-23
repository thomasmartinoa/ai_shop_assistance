'use client';

import { usePathname } from 'next/navigation';
import { Mic, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function FloatingMic() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Hide on voice-hub page — voice is already integrated there
  if (pathname === '/voice-hub') return null;

  return (
    <>
      {/* Panel */}
      {isOpen && (
        <div className={cn(
          'fixed z-40 bg-white rounded-2xl shadow-2xl border border-border p-4',
          'bottom-[88px] right-4 lg:bottom-20 lg:right-6',
          'w-72'
        )}>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <p className="text-sm font-medium text-foreground">Voice Assistant</p>
          </div>
          <p className="text-xs text-muted-foreground text-center py-4">
            🎤 Tap the mic button and speak in Malayalam or English
          </p>
          <p className="text-xs text-muted-foreground/60 text-center">
            "അരി 2 കിലോ ബില്ലിൽ ചേർക്കൂ" · "Check rice stock"
          </p>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className={cn(
          'fixed z-40 rounded-full shadow-lg transition-all duration-200 active:scale-95',
          'h-14 w-14 flex items-center justify-center',
          'bottom-[88px] right-4 lg:bottom-6 lg:right-6',
          isOpen
            ? 'bg-slate-700 text-white shadow-slate-300'
            : 'bg-primary text-white shadow-primary/30'
        )}
        aria-label="Voice assistant"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Mic className="h-6 w-6" />}
      </button>
    </>
  );
}
