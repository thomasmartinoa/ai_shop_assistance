# Implementation Plan - Production Ready

**Reference**: `docs/plans/2026-02-19-production-ready-design.md`
**Status**: ✅ ALL PHASES COMPLETE (Feb 20, 2026)

---

## Phase 0: Supabase Project Setup ✅
**Dependency**: None (must be done first)

### Tasks
- [x] Create Supabase project in Mumbai region (ap-south-1) — `ctrjetjhwvgqoqpbytyb`
- [x] Apply `supabase/migrations/001_initial_schema.sql` migration
- [x] Enable Phone Auth provider in Supabase dashboard
- [x] Set environment variables in `.env.local`
- [x] Verify Supabase connection works
- [x] Run `supabase gen types typescript` to update `types/database.ts`

### Acceptance Criteria ✅
- App connects to real Supabase
- Tables (shops, products, transactions) exist with RLS enabled

---

## Phase 1: Fix Broken UI Components ✅
**Dependency**: None

### Task 1.1: Fix Inventory Add Product Form ✅
**File**: `app/(app)/inventory/page.tsx`
- [x] Connect input `value` and `onChange` to `newProduct` state
- [x] Wire "Save Product" button to `handleAddProduct`
- [x] Add form validation (name required, price > 0)
- [x] Clear form on successful save

### Task 1.2: Fix Settings Save ✅
**File**: `app/(app)/settings/page.tsx`
- [x] Replace mock with real Supabase `shops` table update
- [x] INSERT for new users, UPDATE for existing shops
- [x] Added new user welcome banner

### Task 1.3: Add Toast Notification System ✅
**Files**: `components/shared/Toast.tsx`, `app/layout.tsx`
- [x] Created custom Toast component with success/error/info types
- [x] Added toast provider to root layout
- [x] Replaced all `alert()` calls with toast notifications
- [x] Created `ErrorBoundary.tsx` with retry UI

---

## Phase 2: Supabase Edge Functions ✅
**Dependency**: Phase 0

### Task 2.1: `sarvam-tts` Edge Function ✅
- [x] Ported to Deno, deployed to Supabase
- [x] JWT auth enabled

### Task 2.2: `google-tts` Edge Function ✅
- [x] Ported to Deno, deployed to Supabase
- [x] JWT auth enabled

### Task 2.3: `dialogflow-detect` Edge Function ✅
- [x] Ported to Deno with JWT-based Google OAuth2
- [x] JWT auth enabled

### Task 2.4: Update Client-Side Code ✅
- [x] Created `lib/supabase/edge-functions.ts` utility
- [x] Updated `useVoice.ts` TTS calls
- [x] Updated `dialogflow.ts` to call Edge Function
- [x] Auth token passed in all requests
- [x] Fallback chain: Sarvam → Google TTS → Browser TTS

### Task 2.5: Remove Old API Routes ✅
- [x] Deleted `app/api/sarvam-tts/route.ts`
- [x] Deleted `app/api/tts/route.ts`
- [x] Deleted `app/api/dialogflow/detect/route.ts`

---

## Phase 3: Transaction Persistence & Stock Management ✅
**Dependency**: Phase 0

### Task 3.1: Transaction Hook ✅
**File**: `hooks/useTransactions.ts`
- [x] `getTransactions(shopId, dateRange)`: Query with filters
- [x] `getSalesStats(shopId, period)`: Aggregate sales
- [x] `getTopProducts(shopId, period)`: Top sellers

### Task 3.2: Billing Integration ✅
**File**: `app/(app)/billing/page.tsx`
- [x] `completeTransaction()` saves to `transactions` table
- [x] Decrements `products.stock` after sale
- [x] Success toast with transaction total
- [x] Error handling with try/catch

### Task 3.3: Reports with Real Data ✅
**File**: `app/(app)/reports/page.tsx`
- [x] Replaced `MOCK_STATS` with `useTransactions` hook
- [x] Loading states while data fetches
- [x] Empty state when no transactions exist

---

## Phase 4: Polish & Build Verification ✅
**Dependency**: Phases 1-3

### Task 4.1: Error Handling Audit ✅
- [x] `ErrorBoundary` component wrapping pages
- [x] All Supabase calls have try/catch with toast
- [x] Loading spinners for all async operations

### Task 4.2: Build Verification ✅
- [x] `next build` exit code 0
- [x] Static export produces correct output
- [x] No dead imports from removed API routes

### Task 4.3: Dashboard Real Data ✅
- [x] Replaced hardcoded mock stats with `useTransactions`
- [x] Loading spinners per card

### Task 4.4: Update CLAUDE.md ✅
- [x] Updated phase status
- [x] Documented Edge Functions architecture
- [x] Updated file structure
- [x] Added Session 5 changelog
- [x] Cleaned up Known Issues table

---

## Remaining (Deferred - Not Blocking MVP)

- [ ] Cloudflare Pages deployment
- [ ] Edge Function secrets in Supabase dashboard (SARVAM_API_KEY + Dialogflow creds)
- [ ] Keep-alive cron job (Supabase pausing prevention)
- [ ] PWA icons (generate PNGs from SVG)
- [ ] Remove leftover test pages

---

## Files Changed Summary

### New Files
| File | Purpose |
|------|---------|
| `hooks/useTransactions.ts` | Transaction queries + report data |
| `lib/supabase/edge-functions.ts` | Edge Function calling utility |
| `components/shared/Toast.tsx` | Toast notification system |
| `components/shared/ErrorBoundary.tsx` | Error boundary with retry |

### Modified Files
| File | Changes |
|------|---------|
| `app/(app)/billing/page.tsx` | Save transactions, decrement stock |
| `app/(app)/inventory/page.tsx` | Fix add product form bindings |
| `app/(app)/reports/page.tsx` | Real data from Supabase |
| `app/(app)/dashboard/page.tsx` | Real data from Supabase |
| `app/(app)/settings/page.tsx` | INSERT for new users, UPDATE for existing |
| `app/(auth)/login/page.tsx` | Dev test OTP bypass |
| `app/layout.tsx` | Add toast + error boundary providers |
| `hooks/useVoice.ts` | Point TTS to Edge Functions |
| `lib/nlp/dialogflow.ts` | Point to Edge Function |
| `contexts/AuthContext.tsx` | Dev test phone bypass |

### Deleted Files
| File | Reason |
|------|--------|
| `app/api/sarvam-tts/route.ts` | Migrated to Edge Function |
| `app/api/tts/route.ts` | Migrated to Edge Function |
| `app/api/dialogflow/detect/route.ts` | Migrated to Edge Function |

### Supabase Edge Functions (Deployed)
| Function | Purpose |
|----------|---------|
| `sarvam-tts` | Malayalam TTS via Sarvam AI |
| `google-tts` | Fallback TTS via Google Translate |
| `dialogflow-detect` | NLP intent detection via Dialogflow ES |
