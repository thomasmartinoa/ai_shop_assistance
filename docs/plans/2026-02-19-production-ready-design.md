# Production-Ready Design Document

**Date**: 2026-02-19
**Goal**: Make existing features work end-to-end with real Supabase backend

---

## 1. Current State Analysis

### What Works (Demo Mode Only)
| Feature | Status | Issue |
|---------|--------|-------|
| Landing page | Working | No issues |
| Login (Phone OTP) | Working | Demo mode only, Supabase OTP untested |
| Voice recognition (ml-IN) | Working | Continuous listening, good accuracy |
| Local NLP pattern matching | Working | Handles 15+ intent types |
| Billing page + voice cart | Working | Cart state in memory, never persisted |
| Inventory page + voice | Working | Demo products only, add form broken |
| Reports page | Partial | 100% mock data, no real queries |
| Settings page | Partial | Form renders but save does nothing |
| UPI QR code | Working | QR generation works client-side |
| TTS (Sarvam/Google/Browser) | Broken in prod | API routes incompatible with static export |

### Critical Bugs
1. **API routes + static export conflict**: `next.config.js` has `output: 'export'` but 3 API routes exist (`/api/tts`, `/api/sarvam-tts`, `/api/dialogflow/detect`). Static export ignores API routes entirely.
2. **Inventory add form disconnected**: Input fields in the add product modal don't use `value`/`onChange` bindings to `newProduct` state.
3. **Transactions never saved**: Billing page clears cart on payment but never writes to `transactions` table.
4. **Settings save is a mock**: `handleSave` has a `setTimeout` fake delay, no actual Supabase write.
5. **Stock never decremented**: When items are billed, product stock is not reduced.

### Missing Pieces (Required for Production)
- Supabase project setup + schema migration
- Edge Functions for TTS and Dialogflow
- Transaction persistence after billing
- Stock decrement on sale
- Real reports from transaction data
- Settings save to Supabase
- Error handling / toast notifications
- PWA icons (only SVG placeholder exists)

---

## 2. Architecture Decisions

### 2.1 API Route Migration Strategy

**Decision**: Migrate all 3 API routes to Supabase Edge Functions (Deno runtime).

**Why**:
- Keeps `output: 'export'` for Cloudflare Pages (free, fast, India POPs)
- Supabase Edge Functions are free tier (500K invocations/month)
- Deno runtime is compatible with existing fetch-based logic
- Secrets managed via Supabase dashboard (no env exposure)

**Edge Functions to Create**:
| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `sarvam-tts` | Malayalam TTS via Sarvam AI | Yes (JWT) |
| `google-tts` | Fallback TTS via Google Translate | Yes (JWT) |
| `dialogflow-detect` | NLP intent detection | Yes (JWT) |

**Client-side changes**: Replace `/api/*` fetch calls with Supabase Edge Function URLs.

### 2.2 Data Flow: Billing to Transaction

```
Voice Command
  -> NLP Intent Detection
  -> Cart State (React useState)
  -> Payment Confirmation
  -> Write Transaction to Supabase
  -> Decrement Product Stock
  -> Clear Cart
  -> Voice Confirmation
```

### 2.3 Supabase Setup

**Region**: Mumbai (ap-south-1) - lowest latency to Kerala
**Schema**: Use existing `001_initial_schema.sql` migration
**Auth**: Phone OTP (Twilio integration via Supabase)
**RLS**: Already defined in schema, just needs to be applied

---

## 3. Component-Level Changes

### 3.1 Billing Page (`app/(app)/billing/page.tsx`)
- **Add**: `saveTransaction()` function that writes to Supabase `transactions` table
- **Add**: Stock decrement after successful payment
- **Fix**: Replace `alert('Bill completed!')` with actual transaction save
- **Add**: Receipt generation (jsPDF) after transaction
- **Add**: Toast notifications for success/error feedback

### 3.2 Inventory Page (`app/(app)/inventory/page.tsx`)
- **Fix**: Connect add product form inputs to `newProduct` state (line 359-384)
- **Fix**: Wire `handleAddProduct` to the "Save Product" button
- **Add**: Edit product functionality (currently button exists but does nothing)
- **Add**: Delete product with confirmation

### 3.3 Reports Page (`app/(app)/reports/page.tsx`)
- **Replace**: Mock data with Supabase queries on `transactions` table
- **Add**: `useTransactions` hook for fetching/aggregating sales data
- **Add**: Date range filtering (today/week/month queries)
- **Add**: Real top products calculation from transaction items

### 3.4 Settings Page (`app/(app)/settings/page.tsx`)
- **Fix**: `handleSave` to actually write to Supabase `shops` table
- **Add**: Success/error toast feedback
- **Add**: Form validation (UPI ID format, GSTIN format)

### 3.5 Voice Hook (`hooks/useVoice.ts`)
- **Change**: Replace `/api/sarvam-tts` and `/api/tts` URLs with Supabase Edge Function URLs
- **Add**: Pass Supabase auth token in Edge Function requests

### 3.6 Smart NLP (`lib/nlp/useSmartNLP.ts`)
- **Change**: Replace `/api/dialogflow/detect` with Supabase Edge Function URL
- **Add**: Pass Supabase auth token in request

### 3.7 New: Transaction Hook (`hooks/useTransactions.ts`)
- **Create**: Hook for saving transactions and querying reports
- Functions: `saveTransaction()`, `getTransactions()`, `getSalesStats()`

### 3.8 New: Toast/Notification System
- **Install**: `sonner` or use shadcn `toast` component
- **Add**: Toast provider in root layout
- **Use**: Throughout billing, settings, inventory for user feedback

---

## 4. Supabase Edge Functions Spec

### 4.1 `sarvam-tts` Function
```
POST /functions/v1/sarvam-tts
Body: { text: string, lang: string }
Response: { audioUrl: string, format: string }
Secrets: SARVAM_API_KEY
```

### 4.2 `google-tts` Function
```
POST /functions/v1/google-tts
Body: { text: string, lang: string }
Response: { audioUrl: string, format: string }
No secrets needed (uses Google Translate unofficial API)
```

### 4.3 `dialogflow-detect` Function
```
POST /functions/v1/dialogflow-detect
Body: { text: string, sessionId: string, languageCode: string }
Response: { queryResult: { intent, fulfillmentText, parameters } }
Secrets: DIALOGFLOW_PROJECT_ID, DIALOGFLOW_CLIENT_EMAIL, DIALOGFLOW_PRIVATE_KEY
```

---

## 5. Error Handling Strategy

| Scenario | Handling |
|----------|----------|
| Supabase down | Fall back to demo mode, show toast warning |
| Edge Function timeout | Fall back to browser TTS / local NLP |
| Voice recognition fails | Show error state, allow retry |
| Transaction save fails | Keep cart, show error toast, allow retry |
| Network offline | Show offline banner (future: PWA offline support) |

---

## 6. Success Criteria

The app is "production-ready" when:
1. A new user can sign up via Phone OTP (real Supabase auth)
2. Shop settings save and persist across sessions
3. Voice billing adds real products from Supabase inventory
4. Completed bills save as transactions in the database
5. Product stock decrements after each sale
6. Reports show real sales data from transactions
7. TTS works via Supabase Edge Function (Sarvam AI)
8. Dialogflow NLP works via Supabase Edge Function
9. Error states show toast notifications (not `alert()`)
10. App builds successfully with `next build` (static export)
