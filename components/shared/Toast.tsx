'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev, { id, type, message }]);

      // Auto dismiss after 3 seconds
      setTimeout(() => dismissToast(id), 3000);
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; icon: typeof CheckCircle }> = {
  success: { bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle },
  error: { bg: 'bg-red-50', border: 'border-red-200', icon: AlertCircle },
  warning: { bg: 'bg-orange-50', border: 'border-orange-200', icon: AlertTriangle },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: Info },
};

const TOAST_TEXT: Record<ToastType, string> = {
  success: 'text-green-800',
  error: 'text-red-800',
  warning: 'text-orange-800',
  info: 'text-blue-800',
};

const TOAST_ICON_COLOR: Record<ToastType, string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-orange-500',
  info: 'text-blue-500',
};

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const style = TOAST_STYLES[toast.type];
        const Icon = style.icon;
        return (
          <div
            key={toast.id}
            className={`${style.bg} ${style.border} border rounded-lg p-3 shadow-lg flex items-start gap-3 animate-in slide-in-from-right-5`}
            role="alert"
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${TOAST_ICON_COLOR[toast.type]}`} />
            <p className={`text-sm flex-1 ${TOAST_TEXT[toast.type]}`}>{toast.message}</p>
            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
