# Testing Patterns

**Analysis Date:** 2026-03-24

## Test Framework

**Runner:**
- None installed. There is no test framework configured in this project.
- No `jest`, `vitest`, `mocha`, `@testing-library/*`, or any test runner in `package.json` dependencies.

**Assertion Library:**
- None installed.

**Run Commands:**
```bash
npm run lint            # ESLint via next lint (only quality check available)
npm run type-check      # TypeScript type checking (tsc --noEmit)
npm run build           # Build verification (next build)
```

## Test File Organization

**Location:**
- No test files exist anywhere in the project source (outside `node_modules/`).
- No `__tests__/` directories.
- No `*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `*.spec.tsx` files in the project.

**Naming:**
- Not applicable (no tests exist).

**Structure:**
- Not applicable.

## Test Infrastructure Status

**The project has zero automated tests.** The only quality gates are:

1. **`npm run lint`** - ESLint via `eslint-config-next` (Next.js default rules)
   - No custom `.eslintrc` file at project root
   - Uses Next.js built-in ESLint configuration
   - No Prettier configured

2. **`npm run type-check`** - TypeScript strict mode checking (`tsc --noEmit`)
   - `tsconfig.json` has `"strict": true`

3. **`npm run build`** - Static export build (`next build` with `output: 'export'`)
   - Build success is used as a proxy for correctness
   - Referenced in CLAUDE.md: "Build verification: `next build` exit code 0"

## CI/CD Integration

**CI Pipeline:** None detected.
- No `.github/workflows/` directory in project root
- No `Jenkinsfile`, `.gitlab-ci.yml`, `bitbucket-pipelines.yml`, or `Dockerfile`
- No Cloudflare Pages build configuration file (deployment mentioned in docs but not configured in repo)

## Coverage

**Requirements:** None enforced.

**Coverage reporting:** Not available (no test framework).

## Test Types

**Unit Tests:**
- Not present. Functions like `fuzzyMatch()` (`hooks/useProducts.ts`), `normalizeQuantity()` (`app/(app)/voice-hub/page.tsx`), `normalizeTranscript()` (`lib/nlp/useSmartNLP.ts`), `formatCurrency()` (`lib/utils.ts`), and `fillTemplate()` (`lib/voice/responses-ml.ts`) are pure functions that would benefit from unit tests.

**Integration Tests:**
- Not present. The Supabase query logic in hooks (`useProducts`, `useTransactions`), the edge function calls (`callEdgeFunction`), and the NLP pipeline (`useSmartNLP` + `detectIntent`) are untested.

**E2E Tests:**
- Not present. No Playwright, Cypress, or similar framework.

**Component Tests:**
- Not present. No `@testing-library/react` or similar. Components like `VoiceMicButton`, `LiveCart`, `StatCard`, `ConversationLog` are untested.

## What Should Be Tested (Priority Order)

### High Priority - Pure Functions (Easy Wins)

**`lib/utils.ts`** - Core utility functions:
- `formatCurrency()` - INR formatting
- `formatDate()` / `formatTime()` - Date formatting
- `cn()` - Tailwind class merging
- `debounce()` - Debounce behavior
- `isSpeechRecognitionSupported()` / `isSpeechSynthesisSupported()` - Browser API checks

**`hooks/useProducts.ts`** - Product search logic:
- `fuzzyMatch()` - String similarity scoring
- `searchProduct()` - Product lookup by name/alias/Malayalam

**`app/(app)/voice-hub/page.tsx`** - Unit conversion:
- `normalizeQuantity()` - g/kg, ml/litre conversions

**`lib/nlp/useSmartNLP.ts`** - Transcript normalization:
- `normalizeTranscript()` - Malayalam-to-English word mapping
- `detectLocalFallback()` - Regex-based intent detection

**`lib/voice/responses-ml.ts`** - Response generation:
- `fillTemplate()` - Template variable substitution
- `toMalayalamNumber()` / `toMalayalamUnit()` - Localization helpers
- All template functions in `BILLING`, `PAYMENT`, `STOCK`, `INVENTORY`, `REPORTS`

**`lib/nlp/intent-router.ts`** - Intent routing:
- `routeIntent()` - NLP result to action mapping
- `modeForOperation()` - Operation to UI mode mapping
- `isBillingAdd()`, `isConfirm()`, `isCancel()` - Intent type checks

### Medium Priority - Hook Logic

**`hooks/useTransactions.ts`**:
- `getPeriodRange()` - Date range calculation
- Stats aggregation (sales total, order count, avg order)
- Top products aggregation from JSONB items

**`hooks/useProducts.ts`**:
- CRUD operations (with mock Supabase)
- Demo mode fallback behavior
- `getLowStockProducts()` filtering

**`contexts/AuthContext.tsx`**:
- Auth state transitions
- Demo mode enable/disable
- Shop fetch on user change

### Lower Priority - Component/E2E

**Component rendering tests:**
- `StatCard` - Renders value, title, trend indicator
- `LiveCart` - Item display, total calculation, empty state
- `VoiceMicButton` - State-based icon/label rendering
- `ConversationLog` - Message display, auto-scroll
- `PaymentSuccessOverlay` - Amount display, auto-dismiss

**State machine tests (complex):**
- Voice Hub billing state machine (`BillingPhase` transitions)
- Full billing flow: add items -> confirm -> payment -> complete

## Recommended Test Setup

To add testing to this project, install:

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom @testing-library/user-event
```

**Suggested `vitest.config.ts`:**
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

**Suggested `vitest.setup.ts`:**
```typescript
import '@testing-library/jest-dom';
```

**Add to `package.json` scripts:**
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

**Suggested test file locations (co-located):**
```
lib/
  utils.test.ts
  nlp/
    useSmartNLP.test.ts
    intent-router.test.ts
  voice/
    responses-ml.test.ts
hooks/
  useProducts.test.ts
  useTransactions.test.ts
components/
  voice/
    VoiceMicButton.test.tsx
    LiveCart.test.tsx
  dashboard/
    StatCard.test.tsx
```

## Example Test Patterns (How Tests Should Look)

**Pure function test (`lib/utils.test.ts`):**
```typescript
import { describe, it, expect } from 'vitest';
import { formatCurrency, cn } from './utils';

describe('formatCurrency', () => {
  it('formats INR with no decimals for whole numbers', () => {
    expect(formatCurrency(500)).toBe('₹500');
  });

  it('formats INR with decimals when needed', () => {
    expect(formatCurrency(99.50)).toBe('₹99.50');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('₹0');
  });
});

describe('cn', () => {
  it('merges Tailwind classes correctly', () => {
    expect(cn('px-4 py-2', 'px-8')).toBe('px-8 py-2');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', true && 'visible')).toBe('base visible');
  });
});
```

**Search logic test (`hooks/useProducts.test.ts`):**
```typescript
import { describe, it, expect } from 'vitest';
// Import the pure functions (may need to export them)

describe('fuzzyMatch', () => {
  it('returns 1 for exact match', () => {
    expect(fuzzyMatch('rice', 'rice')).toBe(1);
  });

  it('returns high score for contains match', () => {
    expect(fuzzyMatch('rice', 'basmati rice')).toBeGreaterThan(0.7);
  });

  it('returns 0 for no match', () => {
    expect(fuzzyMatch('xyz', 'rice')).toBe(0);
  });
});
```

**NLP fallback test (`lib/nlp/useSmartNLP.test.ts`):**
```typescript
import { describe, it, expect } from 'vitest';

describe('detectLocalFallback', () => {
  it('detects confirm intent for Malayalam "ശരി"', () => {
    const result = detectLocalFallback('ശരി');
    expect(result.intent).toBe('confirm');
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('detects cancel intent', () => {
    const result = detectLocalFallback('cancel');
    expect(result.intent).toBe('cancel');
  });

  it('returns fallback for unknown text', () => {
    const result = detectLocalFallback('random gibberish');
    expect(result.intent).toBe('fallback');
    expect(result.confidence).toBe(0);
  });
});
```

**Intent router test (`lib/nlp/intent-router.test.ts`):**
```typescript
import { describe, it, expect } from 'vitest';
import { routeIntent, isBillingAdd, isConfirm } from './intent-router';

describe('routeIntent', () => {
  it('routes billing.add to add_to_cart operation', () => {
    const result = routeIntent({
      intent: 'billing.add',
      confidence: 0.95,
      entities: { product: 'Rice', quantity: 2 },
      products: [],
      source: 'cx',
      rawQuery: 'add 2kg rice',
    });
    expect(result.operation).toBe('add_to_cart');
    expect(result.mode).toBe('billing');
  });

  it('routes unknown intent to none operation', () => {
    const result = routeIntent({
      intent: 'fallback',
      confidence: 0,
      entities: {},
      products: [],
      source: 'local',
      rawQuery: 'hello',
    });
    expect(result.operation).toBe('none');
    expect(result.mode).toBe('idle');
  });
});
```

## Mocking Guidance

**Supabase client mock:**
```typescript
import { vi } from 'vitest';

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => null,       // Demo mode
  getSupabaseClient: () => null,
}));
```

**Browser API mocks (for voice tests):**
```typescript
// Mock window.SpeechRecognition
Object.defineProperty(window, 'SpeechRecognition', {
  value: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    abort: vi.fn(),
    continuous: false,
    interimResults: false,
    lang: '',
    onresult: null,
    onerror: null,
    onend: null,
  })),
});
```

**Edge function mock:**
```typescript
vi.mock('@/lib/supabase/edge-functions', () => ({
  callEdgeFunction: vi.fn().mockResolvedValue({ data: null, error: null }),
  isEdgeFunctionsAvailable: () => false,
}));
```

## Test Coverage Gaps Summary

| Area | Files | Risk | Priority |
|------|-------|------|----------|
| Pure utilities | `lib/utils.ts`, `lib/voice/responses-ml.ts` | Low (simple functions, easy to test) | High (quick wins) |
| Product search | `hooks/useProducts.ts` (fuzzyMatch, searchProduct) | Medium (voice commands depend on this) | High |
| NLP local fallback | `lib/nlp/useSmartNLP.ts` | High (affects billing flow when CX is down) | High |
| Intent routing | `lib/nlp/intent-router.ts` | Medium (maps intents to actions) | High |
| Unit conversion | `voice-hub/page.tsx` (normalizeQuantity) | High (wrong conversion = wrong bill) | High |
| Transaction stats | `hooks/useTransactions.ts` | Low (display only) | Medium |
| Auth flow | `contexts/AuthContext.tsx` | Medium (login/logout/demo) | Medium |
| Component rendering | All components in `components/` | Low (visual only) | Low |
| Billing state machine | `voice-hub/page.tsx` | High (complex state transitions) | Medium (complex to test) |
| E2E billing flow | Full app | High (money involved) | Low (requires E2E framework) |

---

*Testing analysis: 2026-03-24*
