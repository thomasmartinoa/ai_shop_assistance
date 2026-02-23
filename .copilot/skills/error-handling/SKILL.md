---
name: error-handling
description: Implement error handling, loading states, error boundaries, toast notifications, and recovery flows for the Shopkeeper AI. Use when user asks about error handling, loading states, error boundaries, toast notifications, crash recovery, or user feedback. Also use when user says "error", "loading", "toast", "notification", "crash", "fallback", "error boundary".
tools: Read, Bash, Edit, Write, Grep, Glob
---

# Error Handling & User Feedback

Implement comprehensive error handling, loading states, and user feedback for the Shopkeeper AI Assistant.

## Current Gaps

| Area | Status |
|------|--------|
| Error boundaries | Not implemented |
| Toast notifications | Not implemented |
| Loading skeletons | Not implemented |
| API error handling | Basic try/catch only |
| Offline detection | Not implemented |
| Voice error recovery | Basic (auto-restart) |
| Form validation | Not implemented |

## Error Handling Strategy

### Layer 1: React Error Boundaries

```typescript
// components/shared/ErrorBoundary.tsx
'use client';
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">
            എന്തോ പിശക് സംഭവിച്ചു
          </h2>
          <p className="text-gray-600 mb-4">Something went wrong</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-primary text-white rounded-lg"
          >
            വീണ്ടും ശ്രമിക്കുക (Try Again)
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### Layer 2: Toast Notifications

```typescript
// Simple toast system (no external dependency)
// components/shared/Toast.tsx
'use client';
import { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<{
  showToast: (message: string, type?: ToastType) => void;
}>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div key={toast.id} className={`px-4 py-3 rounded-lg shadow-lg text-white
            ${toast.type === 'success' ? 'bg-green-600' : ''}
            ${toast.type === 'error' ? 'bg-red-600' : ''}
            ${toast.type === 'warning' ? 'bg-orange-600' : ''}
            ${toast.type === 'info' ? 'bg-blue-600' : ''}
          `}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
```

### Layer 3: Loading States

```typescript
// components/shared/Loading.tsx
export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded"
          style={{ width: `${100 - i * 15}%` }} />
      ))}
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <LoadingSpinner />
      <p className="mt-4 text-gray-500">കാത്തിരിക്കൂ... (Loading...)</p>
    </div>
  );
}
```

### Layer 4: API Error Handling

```typescript
// lib/utils/api-error.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function safeFetch<T>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const errorText = await res.text();
      return { data: null, error: `API Error (${res.status}): ${errorText}` };
    }
    const data = await res.json();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: (err as Error).message };
  }
}
```

### Layer 5: Voice Error Recovery

Current implementation in `useVoice.ts` auto-restarts on `no-speech` error. Additional recovery:

| Error | Recovery |
|-------|----------|
| `no-speech` | Auto-restart recognition |
| `audio-capture` | Prompt user to check mic permissions |
| `not-allowed` | Show permission request UI |
| `network` | Fallback to local NLP |
| `aborted` | User cancelled, do nothing |
| TTS fails | Fallback chain: Sarvam → Google → Browser |
| Dialogflow timeout | Fallback to local pattern matching |

### Layer 6: Form Validation

```typescript
// Using Zod (already installed)
import { z } from 'zod';

const productSchema = z.object({
  name_en: z.string().min(1, 'English name required'),
  name_ml: z.string().min(1, 'Malayalam name required'),
  price: z.number().positive('Price must be positive'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  unit: z.enum(['kg', 'g', 'litre', 'ml', 'piece', 'dozen']),
  gst_rate: z.number().min(0).max(28),
});

const shopSchema = z.object({
  name: z.string().min(1, 'Shop name required'),
  phone: z.string().regex(/^\+91\d{10}$/, 'Valid Indian phone number required'),
  upi_id: z.string().regex(/^[\w.-]+@[\w]+$/, 'Valid UPI ID required').optional(),
});
```

## Implementation Checklist

- [ ] Add `ErrorBoundary` wrapper to `app/(app)/layout.tsx`
- [ ] Add `ToastProvider` to `app/layout.tsx`
- [ ] Create `Loading` component for all pages
- [ ] Add `safeFetch` wrapper to all API calls
- [ ] Add Zod validation to all forms
- [ ] Add voice error recovery messages in Malayalam
- [ ] Add offline detection banner
- [ ] Add retry logic for Supabase queries
