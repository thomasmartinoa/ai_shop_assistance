# Coding Conventions

**Analysis Date:** 2026-03-24

## Naming Patterns

**Files:**
- React components: `PascalCase.tsx` (e.g., `components/voice/VoiceMicButton.tsx`, `components/dashboard/StatCard.tsx`)
- Custom hooks: `useCamelCase.ts` (e.g., `hooks/useVoice.ts`, `hooks/useProducts.ts`, `hooks/useTransactions.ts`)
- Utility modules: `camelCase.ts` (e.g., `lib/utils.ts`, `lib/constants.ts`)
- NLP modules: `kebab-case.ts` (e.g., `lib/nlp/intent-router.ts`, `lib/voice/responses-ml.ts`)
- Type definition files: `camelCase.ts` (e.g., `types/database.ts`)
- Context providers: `PascalCaseContext.tsx` (e.g., `contexts/AuthContext.tsx`, `contexts/ProductsContext.tsx`)
- Page files: always `page.tsx` (Next.js App Router convention)
- Layout files: always `layout.tsx`

**Functions:**
- Use `camelCase` for all functions and handlers
- Handler functions: prefix with `handle` (e.g., `handleSave`, `handleDelete`, `handleSignOut`)
- Boolean getters: no prefix, use descriptive names (e.g., `isSupabaseConfigured()`, `isEdgeFunctionsAvailable()`)
- Data fetchers: descriptive verb (e.g., `loadProducts`, `fetchShop`, `fetchSalesStats`)

**Variables:**
- Use `camelCase` for variables and state
- Boolean variables: prefix with `is`/`has` (e.g., `isLoading`, `isAuthenticated`, `isDemoMode`, `hasLoadedRef`)
- Refs: suffix with `Ref` (e.g., `recognitionRef`, `cartRef`, `phaseRef`, `speakRef`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `VOICE_SETTINGS`, `GST_RATES`, `DEMO_PRODUCTS`)

**Types/Interfaces:**
- Use `PascalCase` for types and interfaces
- Interface names are nouns without prefix: `Product`, `Shop`, `Transaction`, `CartItem`
- Prop interfaces: `ComponentNameProps` (e.g., `VoiceMicButtonProps`, `RevenueChartProps`, `LiveCartProps`)
- Option interfaces: `UseHookNameOptions` (e.g., `UseVoiceOptions`, `UseProductsOptions`)
- Return type interfaces: `UseHookNameReturn` (e.g., `UseVoiceReturn`, `UseTransactionsReturn`)

## Component Patterns

**Standard component structure (named export, function declaration):**

```typescript
'use client';

import { useState, useCallback } from 'react';
import { SomeIcon } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [state, setState] = useState(false);

  const handleClick = useCallback(() => {
    // logic
  }, []);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
      <h2 className="font-semibold text-gray-900">{title}</h2>
      <Button onClick={handleClick}>Action</Button>
    </div>
  );
}
```

**Page component pattern (default export):**

```typescript
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useSharedProducts } from '@/contexts/ProductsContext';

export default function PageName() {
  const { shop } = useAuth();
  const { products, isLoading } = useSharedProducts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin mb-3" />
        <p className="text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Page Title</h1>
        <p className="text-gray-500 text-sm mt-1">Subtitle</p>
      </div>
      {/* Content */}
    </div>
  );
}
```

**Key component conventions:**
- All page and interactive components use `'use client'` directive
- Pages use `export default function`
- Reusable components use named `export function`
- shadcn/ui components use `React.forwardRef` with `displayName`
- Props are destructured in function signature
- No prop spreading to DOM elements (except shadcn/ui `{...props}`)
- Inline skeleton components defined within page files (e.g., `SkeletonCard` in `app/(app)/dashboard/page.tsx`)

## TypeScript Usage

**Strict mode is enabled** in `tsconfig.json`.

**Interface vs Type:**
- Use `interface` for object shapes (props, data models, context types)
- Use `type` for unions, aliases, and utility types (e.g., `type VoiceState = 'idle' | 'listening' | ...`)
- Use `type` for re-exporting database row types: `type Product = Database['public']['Tables']['products']['Row']`

**Database types pattern** (`types/database.ts`):
```typescript
export interface Database {
  public: {
    Tables: {
      tablename: {
        Row: { /* all fields */ };
        Insert: { /* required + optional fields */ };
        Update: { /* all optional */ };
        Relationships: [];
      };
    };
  };
}

// Helper aliases
export type Product = Database['public']['Tables']['products']['Row'];
export type ProductInsert = Database['public']['Tables']['products']['Insert'];
export type ProductUpdate = Database['public']['Tables']['products']['Update'];
```

**Generics usage:**
- `callEdgeFunction<T = any>()` in `lib/supabase/edge-functions.ts` for typed edge function responses
- `createSupabaseClient<Database>()` for typed Supabase client
- Standard React generics: `useState<VoiceState>('idle')`, `useRef<HTMLDivElement>(null)`

**`as const` assertions for constant objects:**
```typescript
export const VOICE_SETTINGS = {
  lang: 'ml-IN',
  continuous: true,
} as const;

export const GST_RATES = {
  EXEMPT: 0, LOW: 5, STANDARD: 12,
} as const;
```

**Union types for state machines:**
```typescript
type BillingPhase = 'idle' | 'collecting' | 'waiting_for_more' | 'confirming_items' | 'asking_payment' | 'awaiting_cash' | 'showing_qr';
export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';
export type HubMode = 'idle' | 'billing' | 'stock' | 'inventory' | 'reports' | 'payment';
```

## Import Organization

**Order (observed pattern):**
1. `'use client'` directive (always first line when needed)
2. React imports (`react`, `react-dom`)
3. Next.js imports (`next/navigation`, `next/link`)
4. Third-party library imports (`lucide-react`, `recharts`, `qrcode`, `@supabase/*`, `@radix-ui/*`)
5. Internal imports via `@/` path alias:
   - Contexts (`@/contexts/AuthContext`)
   - Hooks (`@/hooks/useVoice`)
   - Lib/utilities (`@/lib/utils`, `@/lib/constants`)
   - Components (`@/components/ui/button`, `@/components/shared/Toast`)
   - Types (`@/types/database`)

**Path Aliases:**
- `@/*` maps to project root (`./`) configured in `tsconfig.json`
- Always use `@/` for internal imports (never relative `../` paths)

**Import style examples from pages:**
```typescript
// From app/(app)/inventory/page.tsx - representative ordering
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSharedProducts } from '@/contexts/ProductsContext';
import { formatCurrency } from '@/lib/utils';
import { PRODUCT_CATEGORIES, UNIT_TYPES } from '@/lib/constants';
import { toast } from '@/components/shared/Toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import type { Product } from '@/types/database';
```

**Note:** Import ordering is not strictly enforced by a linter. The pattern above is the observed convention but is sometimes varied (lucide icons mixed with other imports).

## State Management Patterns

**Context + Hook pattern:**
- Global state uses React Context with a custom hook consumer
- Pattern: `AuthContext.tsx` provides `AuthProvider` + `useAuth()` hook
- Pattern: `ProductsContext.tsx` provides `ProductsProvider` + `useSharedProducts()` hook
- Context consumers always throw if used outside provider:

```typescript
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

**Provider nesting** (in `app/providers.tsx`):
```typescript
<AuthProvider>
  <ToastProvider>{children}</ToastProvider>
</AuthProvider>
```

Then `ProductsProvider` wraps only the `(app)` layout (not auth pages) in `app/(app)/layout.tsx`.

**Local state patterns:**
- `useState` for UI state (filters, search, dialog open, form data)
- `useRef` for mutable values that should not trigger re-renders (timers, previous values, recognition instance)
- `useCallback` for all handler functions passed as props or used in effects
- `useMemo` for filtered/computed data lists

**Demo mode fallback:** All data hooks support a `isDemoMode` flag where Supabase is replaced with static `DEMO_PRODUCTS` or `DEMO_SHOP` data. Check pattern:
```typescript
const supabase = createClient();
const isDemoMode = supabase === null;

if (isDemoMode) {
  // Use static data
} else {
  // Query Supabase
}
```

**Supabase client singleton:** `lib/supabase/client.ts` returns `null` if env vars are not configured. All consumers must handle `null`:
```typescript
const supabase = createClient();
if (!supabase) return;
```

## Error Handling Patterns

**Supabase query errors:** Destructure `error` and throw or handle inline:
```typescript
const { data, error: supabaseError } = await supabase.from('products').select('*');
if (supabaseError) throw supabaseError;
```

**Hook return pattern** - return `{ data, error }` from mutation functions:
```typescript
const addProduct = async (product) => {
  try {
    const { data, error } = await supabase.from('products').insert(product);
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('Error adding product:', err);
    return { data: null, error: err as Error };
  }
};
```

**Toast notifications for user-facing errors:**
```typescript
import { toast } from '@/components/shared/Toast';

// In handlers:
if (error) toast.error('Failed to save product');
else toast.success('Product updated');
```

**Edge function error handling** - graceful fallback chain:
```typescript
// Sarvam TTS → Google TTS → Browser TTS
// Each level catches errors and falls back to the next
```

**Effect cleanup with `cancelled` flag:**
```typescript
useEffect(() => {
  let cancelled = false;
  async function fetch() {
    // ...
    if (cancelled) return;
    setData(result);
  }
  fetch();
  return () => { cancelled = true; };
}, [deps]);
```

**console.error/console.log for debugging:**
- `console.error` for actual errors
- `console.log` with emoji prefixes for debug context: `'[Auth]'`, `'[Products]'`, `'[CX Response]'`
- Voice system uses emoji prefixes: microphone for recognition, speaker for synthesis, brain for NLP

## Styling Conventions

**Tailwind CSS with shadcn/ui theming:**

**Color system (CSS variables in `app/globals.css`):**
- Primary: orange (hsl `24 94% 53%`)
- Use semantic tokens: `bg-primary`, `text-primary-foreground`, `bg-destructive`
- Custom semantic colors: `bg-page` (#F9FAFB), `bg-surface` (#FFFFFF)
- Stat card colors use inline `style` with hex values (not Tailwind classes)

**Common Tailwind patterns:**
```typescript
// Card container
"rounded-2xl bg-white p-5 shadow-sm border border-gray-100"

// Page wrapper
"min-h-screen bg-page p-4 sm:p-6 lg:p-8 space-y-6"

// Section header
<h1 className="text-2xl font-bold text-gray-900">Title</h1>
<p className="text-gray-500 text-sm mt-1">Subtitle</p>

// Loading spinner
<Loader2 className="h-8 w-8 animate-spin" />
<div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />

// Empty state
<div className="flex flex-col items-center justify-center py-16 text-gray-400">
  <Icon className="h-12 w-12 mb-3" />
  <p className="font-medium text-gray-600">No items</p>
  <p className="text-sm mt-1">Description</p>
</div>

// Stat card icon container
<div className="rounded-lg bg-blue-50 p-2.5">
  <Package className="h-5 w-5 text-blue-600" />
</div>
```

**Responsive patterns:**
- Mobile-first approach
- `sm:`, `lg:`, `xl:` breakpoints for responsive layouts
- Mobile bottom tabs (`components/layout/BottomTabs.tsx`) hidden on desktop (`lg:hidden`)
- Desktop sidebar (`components/layout/Sidebar.tsx`) hidden on mobile (`hidden lg:flex`)
- Grid layouts: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`

**shadcn/ui usage:**
- Components installed via `components.json` (style: `default`, RSC: `true`)
- All shadcn components in `components/ui/` directory
- Use `cn()` utility for conditional class merging: `cn('base-classes', conditional && 'added-class')`
- Variants via `cva` (class-variance-authority) for `Button` component
- Radix UI primitives wrapped with Tailwind styling

**Custom animations (defined in `tailwind.config.ts`):**
- `animate-pulse-ring` - voice button listening state
- `animate-voice-wave` - audio visualization
- `animate-fade-in` - toast entrance
- `animate-pop-in` - payment success checkmark
- `animate-float-up` - celebration particles
- `animate-overlay-in` - modal backdrop

**Icon library:** `lucide-react` exclusively. Standard size classes:
- Navigation icons: `w-5 h-5`
- Action buttons: `h-4 w-4`
- Large empty states: `h-12 w-12`
- Small inline: `h-3 w-3` or `h-3.5 w-3.5`

## Voice/NLP Code Patterns

**TTS fallback chain (in `hooks/useVoice.ts`):**
```
speak(text) → speakWithSarvamTTS() → speakWithGoogleTTS() → speakWithBrowserTTS()
```
Each layer catches errors and delegates to the next. Edge functions are called for Sarvam and Google TTS.

**NLP processing pipeline (in `lib/nlp/useSmartNLP.ts`):**
```
1. normalizeTranscript(text)          // Convert Malayalam STT of English words
2. detectIntent(normalized)           // Dialogflow CX via Edge Function
3. detectLocalFallback(normalized)    // Ultra-light regex fallback
```

**Intent routing pattern (in `lib/nlp/intent-router.ts`):**
```
NLPResult → routeIntent() → RouterAction { mode, operation, entities, voiceResponse }
```

**Billing state machine (in `app/(app)/voice-hub/page.tsx`):**
- Finite states: `idle → collecting → waiting_for_more → confirming_items → asking_payment → awaiting_cash/showing_qr`
- State stored in both `useState` and `useRef` (ref used in timer callbacks)
- Timer-based transitions with `startAskMoreTimer()` and `startPaymentReminder()`

**Malayalam response library (`lib/voice/responses-ml.ts`):**
- Organized by domain: `BILLING`, `PAYMENT`, `STOCK`, `INVENTORY`, `REPORTS`, `SYSTEM`, `CONFIRM`
- Each is an object with static strings or template functions
- Template functions take typed parameters: `BILLING.item_added(quantity: number, unit: string, productMl: string)`
- Use `toMalayalamUnit()` and `toMalayalamNumber()` for localization

**Product search pattern (in `hooks/useProducts.ts`):**
- `fuzzyMatch()` scores 0-1 between needle/haystack
- `searchProduct()` checks `name_en`, `name_ml`, and `aliases[]` array
- Threshold: score > 0.5 required for a match

## Module Design

**Exports:**
- Components: named export (`export function ComponentName`)
- Pages: default export (`export default function PageName`)
- Hooks: named export (`export function useHookName`)
- Types: named export (`export type TypeName`, `export interface InterfaceName`)
- Constants: named export (`export const CONSTANT_NAME`)

**Barrel files:** Not used. Each file is imported directly by path.

**Re-exports:** Types re-exported from modules that define them:
```typescript
// lib/nlp/useSmartNLP.ts
export type { DialogflowIntentType, DialogflowEntity, CXProduct };
```

## Comments

**When to comment:**
- JSDoc comments on public hook functions and utility functions
- Section dividers using `// ─── Section Name ───` pattern (used extensively in `voice-hub/page.tsx` and `intent-router.ts`)
- Inline comments for non-obvious logic (unit conversion, state machine transitions)
- Malayalam text always has English translation in comments

**JSDoc style:**
```typescript
/**
 * Calculate fuzzy match score between two strings
 * Higher score = better match (0-1)
 */
function fuzzyMatch(needle: string, haystack: string): number { ... }

/** After items added, wait `delay` ms then ask "anything else?" */
const startAskMoreTimer = useCallback((delay = 5000) => { ... });
```

**Section divider pattern:**
```typescript
// ─── Types ──────────────────────────────────────────────────────────────────
// ─── Helpers ────────────────────────────────────────────────────────────────
// ─── Component ──────────────────────────────────────────────────────────────
```

## Logging

**Framework:** `console` (no structured logging library)

**Patterns:**
- Emoji prefixes for subsystem identification in development:
  - Voice recognition: `console.log('microphone Recognition started')`
  - Voice synthesis: `console.log('speaker Speaking with Sarvam AI TTS:', text)`
  - NLP: `console.log('brain CX NLP: Processing:', text)`
- Bracket prefix for services: `console.log('[Auth] fetchShop called for userId:', userId)`
- `console.error` for caught errors
- `console.warn` for fallback situations: `console.warn('Edge function: 401 with session token, retrying')`

---

*Convention analysis: 2026-03-24*
