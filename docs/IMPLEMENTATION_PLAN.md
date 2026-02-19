# Implementation Plan - Production Ready

**Reference**: `docs/plans/2026-02-19-production-ready-design.md`
**Approach**: Fix broken things first, then connect to Supabase, then polish.

---

## Phase 0: Supabase Project Setup
**Dependency**: None (must be done first)
**Estimated scope**: Infrastructure only

### Tasks
- [ ] Create Supabase project in Mumbai region (ap-south-1)
- [ ] Apply `supabase/migrations/001_initial_schema.sql` migration
- [ ] Enable Phone Auth provider in Supabase dashboard
- [ ] Configure Twilio for SMS OTP (Supabase Auth settings)
- [ ] Set environment variables in `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Verify Supabase connection works (test query from app)
- [ ] Run `supabase gen types typescript` to update `types/database.ts`

### Acceptance Criteria
- App connects to real Supabase (no demo mode fallback)
- Login with Phone OTP sends real SMS
- Tables (shops, products, transactions) exist with RLS enabled

---

## Phase 1: Fix Broken UI Components
**Dependency**: None (can run parallel with Phase 0)
**Estimated scope**: 4 files

### Task 1.1: Fix Inventory Add Product Form
**File**: `app/(app)/inventory/page.tsx`
- Connect input `value` and `onChange` to `newProduct` state
- Wire "Save Product" button to `handleAddProduct`
- Add form validation (name required, price > 0)
- Clear form on successful save

### Task 1.2: Fix Settings Save
**File**: `app/(app)/settings/page.tsx`
- Replace mock `setTimeout` with real Supabase `shops` table update
- Add optimistic update to AuthContext shop state
- Add form validation for UPI ID and GSTIN formats

### Task 1.3: Add Toast Notification System
**Files**: `components/ui/toast.tsx`, `app/layout.tsx`
- Install shadcn toast component OR `sonner` library
- Add toast provider to root layout
- Replace all `alert()` calls with toast notifications
- Create reusable toast helpers: `showSuccess()`, `showError()`

### Acceptance Criteria
- Adding a product in inventory works and shows in the list
- Settings save persists (or shows error if Supabase not connected)
- All user feedback uses toast notifications, zero `alert()` calls

---

## Phase 2: Supabase Edge Functions
**Dependency**: Phase 0 (Supabase project must exist)
**Estimated scope**: 3 Edge Functions + client-side updates

### Task 2.1: Create `sarvam-tts` Edge Function
- Port `app/api/sarvam-tts/route.ts` logic to Deno
- Set `SARVAM_API_KEY` as Supabase secret
- Require JWT auth (verify Supabase token)
- Test with curl

### Task 2.2: Create `google-tts` Edge Function
- Port `app/api/tts/route.ts` logic to Deno
- No secrets needed
- Require JWT auth
- Test with curl

### Task 2.3: Create `dialogflow-detect` Edge Function
- Port `app/api/dialogflow/detect/route.ts` logic to Deno
- Set Dialogflow credentials as Supabase secrets:
  - `DIALOGFLOW_PROJECT_ID`
  - `DIALOGFLOW_CLIENT_EMAIL`
  - `DIALOGFLOW_PRIVATE_KEY`
- Require JWT auth
- Test with curl

### Task 2.4: Update Client-Side Code
**Files**: `hooks/useVoice.ts`, `lib/nlp/dialogflow.ts`
- Create `lib/supabase/edge-functions.ts` utility for calling Edge Functions
- Update `useVoice.ts` TTS calls to use Edge Function URLs
- Update `dialogflow.ts` to call Edge Function instead of `/api/dialogflow/detect`
- Pass Supabase auth token in all Edge Function requests
- Maintain fallback chain: Sarvam -> Google TTS -> Browser TTS

### Task 2.5: Remove Old API Routes
**Files to delete**:
- `app/api/sarvam-tts/route.ts`
- `app/api/tts/route.ts`
- `app/api/dialogflow/detect/route.ts`

### Acceptance Criteria
- Malayalam TTS works via Supabase Edge Function (Sarvam AI)
- Dialogflow intent detection works via Edge Function
- Fallback chain works when primary service unavailable
- No API routes remain in the Next.js app
- `next build` completes without errors

---

## Phase 3: Transaction Persistence & Stock Management
**Dependency**: Phase 0 (Supabase must be connected)
**Estimated scope**: 3 new files + 2 modified files

### Task 3.1: Create Transaction Hook
**New file**: `hooks/useTransactions.ts`
- `saveTransaction(cart, paymentMethod)`: Write to `transactions` table
- `getTransactions(shopId, dateRange)`: Query transactions with filters
- `getSalesStats(shopId, period)`: Aggregate sales for reports
- `getTopProducts(shopId, period)`: Top selling products

### Task 3.2: Integrate Billing with Transactions
**File**: `app/(app)/billing/page.tsx`
- After payment confirmation, call `saveTransaction()`
- Decrement stock for each item in cart via `updateStock()`
- Show success toast with transaction total
- Clear cart only after successful save
- Handle save failure: keep cart, show error toast, allow retry

### Task 3.3: Connect Reports to Real Data
**File**: `app/(app)/reports/page.tsx`
- Replace `MOCK_STATS` with `useTransactions` hook queries
- Replace `MOCK_TOP_PRODUCTS` with real aggregation
- Add loading states while data fetches
- Handle empty state (no transactions yet)

### Acceptance Criteria
- Completing a bill saves a transaction record in Supabase
- Product stock decrements after each sale
- Reports page shows real sales data from transactions
- Empty state shown when no transactions exist

---

## Phase 4: Polish & Build Verification
**Dependency**: Phases 1-3 complete
**Estimated scope**: Bug fixes + build validation

### Task 4.1: Error Handling Audit
- Add error boundaries around main page components
- Ensure all Supabase calls have try/catch with toast feedback
- Add loading spinners for all async operations
- Test Supabase connection failure graceful degradation

### Task 4.2: Build Verification
- Run `next build` and fix any errors
- Verify static export produces correct output
- Test all pages work after build
- Verify no dead imports from removed API routes

### Task 4.3: PWA Assets
- Generate proper PNG icons from SVG (192x192, 512x512)
- Update `manifest.json` with correct icon paths
- Verify PWA installability in Chrome DevTools

### Task 4.4: Update CLAUDE.md
- Update phase status (mark completed items)
- Document new Edge Functions architecture
- Update file structure (new files, removed API routes)
- Document Supabase setup requirements

### Acceptance Criteria
- `next build` succeeds with zero errors
- App works in demo mode (no Supabase)
- App works with real Supabase
- PWA is installable
- CLAUDE.md reflects actual project state

---

## Execution Order Summary

```
Phase 0 (Supabase Setup) ──┐
                            ├── Phase 2 (Edge Functions)
Phase 1 (Fix Broken UI) ───┤
                            ├── Phase 3 (Transactions)
                            │
                            └── Phase 4 (Polish)
```

Phase 0 and Phase 1 can run **in parallel**.
Phase 2 requires Phase 0.
Phase 3 requires Phase 0.
Phase 4 requires all prior phases.

---

## Files Changed Summary

### New Files
| File | Purpose |
|------|---------|
| `hooks/useTransactions.ts` | Transaction CRUD + report queries |
| `lib/supabase/edge-functions.ts` | Edge Function calling utility |
| `components/ui/toaster.tsx` | Toast notification component |

### Modified Files
| File | Changes |
|------|---------|
| `app/(app)/billing/page.tsx` | Save transactions, decrement stock |
| `app/(app)/inventory/page.tsx` | Fix add product form bindings |
| `app/(app)/reports/page.tsx` | Replace mock data with real queries |
| `app/(app)/settings/page.tsx` | Real Supabase save |
| `app/layout.tsx` | Add toast provider |
| `hooks/useVoice.ts` | Point TTS to Edge Functions |
| `lib/nlp/dialogflow.ts` | Point to Edge Function |
| `CLAUDE.md` | Update documentation |

### Deleted Files
| File | Reason |
|------|--------|
| `app/api/sarvam-tts/route.ts` | Migrated to Edge Function |
| `app/api/tts/route.ts` | Migrated to Edge Function |
| `app/api/dialogflow/detect/route.ts` | Migrated to Edge Function |

### Supabase Edge Functions (Deployed via MCP/CLI)
| Function | Source |
|----------|--------|
| `sarvam-tts` | Port of `app/api/sarvam-tts/route.ts` |
| `google-tts` | Port of `app/api/tts/route.ts` |
| `dialogflow-detect` | Port of `app/api/dialogflow/detect/route.ts` |
