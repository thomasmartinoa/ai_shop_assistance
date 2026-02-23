'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

type ToastHandler = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

let globalAddToast: ((message: string, type: ToastType) => void) | null = null;

export const toast: ToastHandler = {
  success: (message: string) => globalAddToast?.(message, 'success'),
  error: (message: string) => globalAddToast?.(message, 'error'),
  info: (message: string) => globalAddToast?.(message, 'info'),
};

const typeStyles: Record<ToastType, string> = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-blue-600 text-white',
};

function ToastItem({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(item.id), 3000);
    return () => clearTimeout(timer);
  }, [item.id, onDismiss]);

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm animate-fade-in min-w-[280px] max-w-[400px]',
        typeStyles[item.type]
      )}
    >
      <span className="flex-1">{item.message}</span>
      <button onClick={() => onDismiss(item.id)} className="flex-shrink-0 opacity-80 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    globalAddToast = addToast;
    return () => {
      globalAddToast = null;
    };
  }, [addToast]);

  return (
    <>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map((t) => (
              <div key={t.id} className="pointer-events-auto">
                <ToastItem item={t} onDismiss={dismissToast} />
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
