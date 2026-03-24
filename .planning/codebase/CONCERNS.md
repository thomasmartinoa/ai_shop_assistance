# Codebase Concerns

**Analysis Date:** 2026-03-24

## Tech Debt

**Excessive console.log statements throughout voice/auth code:**
- Issue: Over 70 `console.log`/`console.warn`/`console.error` calls scattered across production code with emoji prefixes. No logging framework, no log levels, no conditional logging.
- Files: `hooks/useVoice.ts` (45+ log statements), `contexts/AuthContext.tsx` (10+ log statements), `hooks/useProducts.ts` (7+ log statements), `lib/nlp/useSmartNLP.ts` (4 log statements), `lib/nlp/dialogflow.ts` (5 log statements)
- Impact: Console noise in production. Leaks internal state to users who open DevTools. Performance overhead from string concatenation in hot paths (voice recognition events fire frequently).
- Fix approach: Introduce a lightweight logger utility (`lib/utils/logger.ts`) with `dev`/`prod` modes. Replace all `console.log` with `logger.debug()`, `console.error` with `logger.error()`. Only emit logs in development. Strip or level-gate in production builds.

**Demo mode code deeply interleaved with production logic:**
- Issue: Demo mode (fake user, fake shop, fake product data) is woven into `AuthContext`, `useProducts`, `Sidebar`, `AppHeader`, `inventory/page.tsx`, and `app/(app)/layout.tsx`. Every CRUD operation has `if (isDemoMode) { ... }` branches, doubling code paths without test coverage.
- Files: `contexts/AuthContext.tsx` (lines 30-53, 87-102, 170-176, 192-198), `hooks/useProducts.ts` (lines 8-28, 115-123, 145, 185-193, 221-229, 262-266, 291-294), `components/layout/Sidebar.tsx` (lines 29-32), `components/layout/AppHeader.tsx` (lines 13-15), `app/(auth)/login/page.tsx` (lines 31-34, 63-69), `app/(app)/layout.tsx` (line 28)
- Impact: Maintenance burden -- every feature change requires updating both real and demo paths. Demo paths silently swallow errors and give false confidence. `DEMO_PRODUCTS` use `Math.random()` for stock which means inconsistent behavior across renders.
- Fix approach: Extract demo mode into a separate `DemoProvider` that wraps `AuthProvider` and injects mock Supabase responses at the client level, eliminating per-hook branching.

**Hardcoded 5% GST rate in billing calculations:**
- Issue: GST is hardcoded as `* 0.05` (5%) in four places instead of using each product's `gst_rate` field from the database. The schema supports per-product GST rates (0%, 5%, 12%, 18%, 28%) but they are ignored during billing.
- Files: `app/(app)/voice-hub/page.tsx` (lines 178, 183, 203, 673), `components/voice/LiveCart.tsx` (line 25)
- Impact: Incorrect tax calculations for products with different GST slabs. Shopkeepers in India are legally required to charge correct GST rates. This could cause compliance issues.
- Fix approach: Calculate GST per cart item using `item.gstRate` (passed through from product lookup). Sum individual item GST amounts for the bill total. The `GST_RATES` constant in `lib/constants.ts` already defines the correct rates.

**Hardcoded profit margin estimate (15%):**
- Issue: Profit report voice command uses `stats.sales * 0.15` as a flat 15% profit estimate instead of computing actual profit from `cost_price` data in the products table.
- Files: `app/(app)/voice-hub/page.tsx` (line 639)
- Impact: Misleading profit reports. Products have `cost_price` fields specifically for profit calculation, but they are unused.
- Fix approach: Join transaction items with product cost_price data to compute actual margins. Fall back to estimated % only when cost_price is null.

**`google-auth-library` in devDependencies but unused in client code:**
- Issue: `google-auth-library` (^10.5.0) is listed as a devDependency but is a Node.js-only server-side library. It was likely used for local Dialogflow testing but is not imported anywhere in the Next.js codebase. It adds unnecessary install weight.
- Files: `package.json` (line 49)
- Impact: Unnecessary dependency, ~5MB+ of Node.js packages installed for no purpose.
- Fix approach: Remove from `package.json` if no longer needed for local testing scripts.

**`window.confirm()` still used for delete actions:**
- Issue: `window.confirm()` is used for product deletion instead of the custom Toast/Dialog system used elsewhere. Inconsistent UX.
- Files: `app/(app)/inventory/page.tsx` (line 107)
- Impact: Jarring native browser dialog in an otherwise polished UI. Blocks the main thread.
- Fix approach: Replace with a confirmation Dialog component using the existing shadcn/ui Dialog.

**Onboarding debug logging left in production:**
- Issue: `console.log('[Onboarding] Rendered with:', ...)` logs user ID, email, and shop ID to the console on every render of the onboarding page.
- Files: `app/(auth)/onboarding/page.tsx` (lines 126-134)
- Impact: Leaks user PII to browser console. The comment says "DEBUG: show auth state to diagnose redirect issue" -- this should have been removed after the redirect issue was fixed.
- Fix approach: Remove the debug block entirely.

**`new Promise(async ...)` anti-pattern:**
- Issue: Two TTS functions wrap an `async` function inside `new Promise()`, which is a known anti-pattern that can swallow errors or cause unhandled rejections.
- Files: `hooks/useVoice.ts` (lines 372, 434)
- Impact: If the async body throws before any `resolve()` call, the promise hangs forever. Errors may not propagate correctly.
- Fix approach: Convert to plain `async` functions. The `new Promise` wrapper is unnecessary since the inner code is already `async`.

**Inconsistent TransactionItem schema:**
- Issue: `TransactionItem` in `types/database.ts` defines many optional field name variants (`name`, `product_name`, `name_ml`, `product_name_ml`, `price`, `unit_price`). The `useTransactions.ts` hook also defines its own `Transaction.items` type with yet another set of optional variants. Code throughout uses fallback chains like `item.product_name || item.name || item.name_en || 'Unknown'`.
- Files: `types/database.ts` (lines 178-191), `hooks/useTransactions.ts` (lines 30-41), `app/(app)/billing/page.tsx` (lines 23-25), `app/(app)/reports/page.tsx` (line 23)
- Impact: Data written in different sessions may have inconsistent field names, making aggregation unreliable. The `getItemName()` helper is duplicated across pages.
- Fix approach: Standardize the transaction item shape to a single schema. Write a migration script to normalize existing JSONB data. Create a single `getItemName()` utility.

## Known Bugs

**Stock decrement is sequential and non-atomic:**
- Symptoms: During `completeSale()`, stock for each cart item is decremented one at a time using separate Supabase update calls in a `for...of` loop. If one update fails, prior decrements are not rolled back.
- Files: `app/(app)/voice-hub/page.tsx` (lines 222-227)
- Trigger: Multi-item sale where one product has been deleted or its ID changed between cart add and checkout.
- Workaround: None. Stock can become inconsistent.

**Product lookup during checkout uses fuzzy search instead of ID:**
- Symptoms: `completeSale()` looks up products by name (`findProduct(item.name) || findProduct(item.nameMl)`) instead of storing the product ID in the cart item. Fuzzy matching could return the wrong product if names are similar.
- Files: `app/(app)/voice-hub/page.tsx` (line 223)
- Trigger: Two products with similar names (e.g., "Rice" and "Red Rice") -- fuzzy match may return the wrong one.
- Workaround: None currently.

**Onboarding sets `name_ml` to English name for products:**
- Symptoms: When creating products during onboarding, `name_ml` is set to the English name (`p.name_en`) instead of asking the user for a Malayalam name. Voice search by Malayalam name will fail for these products.
- Files: `app/(auth)/onboarding/page.tsx` (line 224)
- Trigger: Any product created during onboarding flow.
- Workaround: User must manually edit each product in inventory to add Malayalam name.

## Security Considerations

**No input validation or sanitization on user inputs:**
- Risk: UPI ID, phone numbers, shop names, and product names are stored directly without validation. Malicious or malformed input could cause issues with QR generation (UPI string injection) or display.
- Files: `app/(app)/settings/page.tsx` (no validation on UPI ID format), `app/(auth)/onboarding/page.tsx` (minimal validation -- only checks name non-empty), `app/(app)/inventory/page.tsx` (only checks name and price non-empty)
- Current mitigation: Supabase RLS prevents cross-user data access. But there is no format validation on UPI IDs, phone numbers, or GSTIN.
- Recommendations: Add Zod validation schemas (already a dependency) for UPI ID format (`xxx@provider`), Indian phone number format (`+91XXXXXXXXXX`), GSTIN format (15-char alphanumeric). Sanitize product names before using in voice responses.

**Implicit OAuth flow exposes tokens in URL hash:**
- Risk: The Supabase client uses `flowType: 'implicit'` which puts access tokens in the URL hash fragment. While hash fragments are not sent to servers, they can leak through browser history, shared screenshots, or referrer headers.
- Files: `lib/supabase/client.ts` (line 45)
- Current mitigation: Cloudflare Pages HTTPS prevents network interception. Token auto-refresh is enabled.
- Recommendations: Switch to PKCE flow (`flowType: 'pkce'`) when possible. Implicit flow was chosen for static export compatibility but PKCE can work with client-only apps.

**Edge function auth falls back to anon key on 401:**
- Risk: When a session token gets a 401, the edge function caller retries with the anon key. This means edge functions may execute without knowing who the user is if their session expired.
- Files: `lib/supabase/edge-functions.ts` (lines 41-49)
- Current mitigation: Edge functions (TTS, Dialogflow) do not access user data -- they are utility functions. But this pattern could be dangerous if applied to user-data-accessing functions.
- Recommendations: Add comments clearly marking this as intentional for utility functions. Do not apply this pattern to functions that access user-scoped data.

**No CSRF protection on state-changing operations:**
- Risk: All database mutations happen via direct Supabase client calls from the browser. There is no CSRF token mechanism.
- Files: All pages that call `supabase.from(...).insert/update/delete`
- Current mitigation: Supabase uses Bearer token auth (not cookies), which is inherently CSRF-resistant. This is a non-issue for the current architecture.
- Recommendations: No action needed as long as auth remains token-based.

## Performance Bottlenecks

**Voice Hub page is 782 lines -- largest component with no code splitting:**
- Problem: `app/(app)/voice-hub/page.tsx` is a single 782-line component containing the entire billing state machine, cart logic, NLP routing, sale completion, stock updates, QR generation, and all UI rendering.
- Files: `app/(app)/voice-hub/page.tsx`
- Cause: All billing logic is co-located in one file for rapid development. No separation of concerns.
- Improvement path: Extract the billing state machine into a custom hook (`useBillingStateMachine`). Move cart manipulation into `useCart` hook. Keep only rendering logic in the page component. This also enables unit testing of the state machine.

**36KB static product catalog bundled into client JS:**
- Problem: `lib/data/products.ts` is a 775-line, 36KB file containing ~100 hardcoded Kerala products. This is bundled into the client JavaScript for demo mode and used as fallback data.
- Files: `lib/data/products.ts`
- Cause: Products need to be available for demo mode without a Supabase connection.
- Improvement path: Lazy-load the demo products catalog only when demo mode is activated. Use `dynamic import()` so it is tree-shaken for authenticated users.

**Sequential stock decrements during sale completion:**
- Problem: Each cart item's stock is decremented via a separate `await updateStock()` call in a `for...of` loop. A 5-item cart makes 5 sequential HTTP requests.
- Files: `app/(app)/voice-hub/page.tsx` (lines 222-227)
- Cause: Simple implementation without batch optimization.
- Improvement path: Use a Supabase RPC (stored procedure) to decrement all stocks in a single atomic transaction. Or at minimum use `Promise.all()` for parallel execution.

**Transaction data not paginated:**
- Problem: `useTransactions` fetches up to 365 days of transactions in a single query with no pagination or limit.
- Files: `hooks/useTransactions.ts` (lines 115-118)
- Cause: Simple initial implementation.
- Improvement path: Add pagination (e.g., 50 transactions per page) with cursor-based pagination using `created_at`. Add `.limit(50)` to the query.

**No image optimization -- images unoptimized flag set:**
- Problem: `next.config.js` sets `images: { unoptimized: true }` which disables Next.js image optimization. Required for static export but means no automatic WebP conversion, resizing, or lazy loading through Next.js Image component.
- Files: `next.config.js` (line 6)
- Cause: Static export to Cloudflare Pages does not support Next.js Image Optimization API.
- Improvement path: Use Cloudflare Images or manual `<img>` with `loading="lazy"` and pre-optimized assets.

## Fragile Areas

**Voice recognition restart loop:**
- Files: `hooks/useVoice.ts` (lines 210-254)
- Why fragile: The `onend` handler automatically restarts recognition when `stateRef.current === 'listening'`. The `onerror` handler for 'no-speech' also restarts after 100ms. Both use `try/catch` with empty catch blocks. If the browser limits restart frequency, this becomes a tight restart loop that silently fails.
- Safe modification: Add a restart counter with exponential backoff. Max 3 retries before stopping and notifying the user. Log restart attempts.
- Test coverage: Zero test coverage -- no test files exist in the project at all.

**Billing state machine in voice-hub page:**
- Files: `app/(app)/voice-hub/page.tsx` (lines 337-558)
- Why fragile: A 7-state state machine (`idle` -> `collecting` -> `waiting_for_more` -> `confirming_items` -> `asking_payment` -> `awaiting_cash`/`showing_qr`) with timer-based transitions. State is spread across React state (`billingPhase`), refs (`phaseRef`, `cartRef`, `askTimerRef`, `reminderTimerRef`), and closure-captured values. Race conditions possible between timer callbacks and voice input.
- Safe modification: Extract to a dedicated hook or use a state machine library (XState). Add explicit transition guards. Test each state transition independently.
- Test coverage: None.

**Auth initialization timeout logic:**
- Files: `contexts/AuthContext.tsx` (lines 114-117)
- Why fragile: An 8-second timeout forces `setIsLoading(false)` if `onAuthStateChange` never fires. This is a workaround for cases where Supabase client initialization hangs. But it means the user sees the app in an indeterminate state (not authenticated, not in demo mode, loading just stops).
- Safe modification: After timeout, redirect to login page or offer demo mode instead of silently stopping the loading spinner.
- Test coverage: None.

**Supabase client singleton with null return:**
- Files: `lib/supabase/client.ts`
- Why fragile: `createClient()` returns `null` when Supabase is not configured. Every caller must null-check. The `useProducts`, `useTransactions`, `AuthContext`, settings page, onboarding page, voice-hub page, and edge-functions utility all have different patterns for handling the null case. Missing a null check causes runtime errors.
- Safe modification: Return a dummy/noop Supabase client instead of null, or use a discriminated union type that forces callers to handle both cases at compile time.
- Test coverage: None.

## Scaling Limits

**Supabase free tier constraints:**
- Current capacity: 500MB database, 1GB storage, 50,000 monthly active users, 500MB bandwidth/day for edge functions
- Limit: Free projects pause after 7 days of inactivity. No cron job has been set up to prevent this despite being documented as needed.
- Scaling path: Set up Cloudflare Workers cron to ping Supabase every 6 days (documented in CLAUDE.md but not implemented). Upgrade to Supabase Pro ($25/month) when approaching limits.

**All transactions fetched client-side for reports:**
- Current capacity: Works fine for stores with <1000 transactions.
- Limit: A busy store making 50 transactions/day hits 18,000 transactions/year. Fetching all in a single query will become slow.
- Scaling path: Server-side aggregation via Supabase RPC/views for stats. Paginate transaction lists.

**Product search is O(n) linear scan:**
- Current capacity: ~100 products in demo, reasonable for small shops.
- Limit: If a shop grows to 1000+ products, `searchProduct()` iterates all products for every voice command.
- Scaling path: Build an index/map keyed by normalized names on product load. Or use Supabase full-text search.

## Dependencies at Risk

**Web Speech API browser support:**
- Risk: Web Speech API (`SpeechRecognition`) is only supported in Chromium-based browsers (Chrome, Edge, Samsung Internet). Firefox and Safari have limited or no support. The `ml-IN` (Malayalam) locale has variable quality across devices.
- Impact: The app's core value proposition (voice-first billing) does not work in Firefox or Safari. No graceful degradation path -- unsupported browsers see a non-functional mic button.
- Migration plan: For broader support, consider a cloud STT service (Google Cloud Speech-to-Text, Whisper) with Web Audio API for recording. This adds cost but removes browser dependency.

**Sarvam AI TTS dependency:**
- Risk: Sarvam AI is a relatively new Indian AI startup. API stability and long-term availability are not guaranteed. Edge function secret (API key) must be manually configured.
- Impact: If Sarvam goes down, TTS falls back to Google TTS -> browser TTS. The fallback chain is implemented but each level degrades voice quality significantly for Malayalam.
- Migration plan: The fallback chain (Sarvam -> Google -> Browser) is already implemented. Monitor Sarvam uptime. Consider caching common TTS responses.

**Dialogflow CX dependency for NLP:**
- Risk: Dialogflow CX requires Google Cloud billing account. Free tier has limits (0-1000 sessions/month). The Edge Function for CX detection must be deployed separately and is not included in the repo (no `supabase/functions/` directory found locally).
- Impact: When Dialogflow CX is unavailable, the local fallback in `useSmartNLP.ts` only handles basic intents (confirm, cancel, greeting, UPI, cash, bill-it, location). Product name extraction and complex billing intents fail silently, returning `'fallback'` intent.
- Migration plan: Expand local NLP patterns to handle billing.add with product extraction as a fallback. The old pattern-based NLP code may still exist but is not imported.

## Missing Critical Features

**No PWA icons -- manifest references files that do not exist:**
- Problem: `public/manifest.json` references 8 PNG icon files (`/icons/icon-72x72.png` through `/icons/icon-512x512.png`) but the `public/icons/` directory is empty. Only `public/icon.svg` exists.
- Blocks: PWA install prompt, home screen icon, splash screen on mobile devices.

**No service worker -- no offline capability:**
- Problem: No service worker file exists. The app requires an active internet connection for all operations. By design (per CLAUDE.md), but this is a significant gap for the target market (Kerala shopkeepers may have unreliable connectivity).
- Blocks: Offline billing, cached product data, background sync of transactions.

**No ErrorBoundary component despite being documented as complete:**
- Problem: CLAUDE.md changelog claims "ErrorBoundary component" was created, but no `ErrorBoundary.tsx` file exists in `components/shared/`. The file is listed in the project structure documentation but was never created or was deleted.
- Blocks: Unhandled React errors will crash the entire app with a white screen instead of showing a retry UI.

**No cron job to prevent Supabase free tier pausing:**
- Problem: Supabase free projects pause after 7 days of inactivity. CLAUDE.md documents this as a known issue with the workaround "Set up Cloudflare Workers to ping every 6 days" but this has not been implemented.
- Blocks: Production reliability -- the database will go offline after a week of low usage.

**No test suite at all:**
- Problem: Zero test files exist in the codebase. No `*.test.ts`, `*.spec.ts`, or `__tests__/` directories. No test configuration (jest.config, vitest.config). The `package.json` has no test command.
- Blocks: Safe refactoring, CI/CD pipeline, regression detection.

## Test Coverage Gaps

**Complete absence of tests:**
- What's not tested: Everything. No unit tests, integration tests, or e2e tests exist.
- Files: Entire codebase -- `hooks/`, `lib/`, `contexts/`, `app/`, `components/`
- Risk: Any change can break any feature without detection. The billing state machine, NLP routing, fuzzy product matching, GST calculation, and auth flows are all untested.
- Priority: **High**. Start with:
  1. Unit tests for `lib/nlp/intent-router.ts` (pure function, easy to test)
  2. Unit tests for `hooks/useProducts.ts` `searchProduct()` / `fuzzyMatch()` functions
  3. Unit tests for `normalizeQuantity()` in `app/(app)/voice-hub/page.tsx`
  4. Integration tests for the billing state machine
  5. E2E tests for the complete billing flow

## Deployment Concerns

**Edge functions not version-controlled locally:**
- Problem: The 3 Supabase Edge Functions (`sarvam-tts`, `google-tts`, `dialogflow-cx-detect`) are deployed to Supabase but no `supabase/functions/` directory with their source code exists in the repository.
- Impact: Edge function code cannot be reviewed, tested, or redeployed from the repository. Changes require manual editing in the Supabase dashboard.
- Fix approach: Create `supabase/functions/` with the edge function source code. Add deployment instructions to documentation.

**Static export may not match all route patterns:**
- Problem: The app uses `output: 'export'` for Cloudflare Pages, which generates static HTML. Dynamic route patterns, middleware, and API routes are not available.
- Files: `next.config.js` (line 3)
- Impact: Cannot add server-side features without changing deployment strategy. All auth, data, and API interactions must go through client-side Supabase calls.

**Google Fonts loaded from CDN on every page load:**
- Problem: Inter font is loaded via `<link>` tag from Google Fonts CDN in `app/layout.tsx`. This adds an external dependency and a render-blocking request.
- Files: `app/layout.tsx` (lines 18-21)
- Impact: Slower initial page load, especially on slow connections. Font flash on slow networks.
- Fix approach: Use `next/font/google` to self-host the font via Next.js built-in optimization (works with static export).

---

*Concerns audit: 2026-03-24*
