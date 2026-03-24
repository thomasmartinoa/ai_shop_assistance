# Architecture

**Analysis Date:** 2026-03-24

## Pattern Overview

**Overall:** Static-exported client-side SPA with BaaS (Backend-as-a-Service)

**Key Characteristics:**
- Fully client-rendered Next.js 14 App Router with `output: 'export'` (no server components, no API routes)
- All server-side logic delegated to Supabase Edge Functions (Deno)
- Voice-first interaction model: Speech Recognition -> NLP (Dialogflow CX via Edge Function) -> Intent Router -> State Machine -> Action -> TTS Response
- Dual-mode operation: real Supabase backend or self-contained demo mode with in-memory data
- Multi-tenant by design with Row Level Security (each shopkeeper sees only their own data)

## Layers

**Presentation Layer (Pages):**
- Purpose: Route-level components that compose UI from hooks, contexts, and child components
- Location: `app/`
- Contains: Page components (`page.tsx`), layouts (`layout.tsx`), route groups `(auth)` and `(app)`
- Depends on: Contexts (`AuthContext`, `ProductsContext`), Hooks (`useVoice`, `useProducts`, `useTransactions`), UI Components
- Used by: Next.js router

**Layout Layer:**
- Purpose: Structural shell providing navigation, auth guards, and responsive layout
- Location: `app/(app)/layout.tsx`, `components/layout/`
- Contains: `Sidebar.tsx` (desktop nav), `BottomTabs.tsx` (mobile nav), `AppHeader.tsx` (mobile header)
- Depends on: `AuthContext`, `ProductsContext`
- Used by: All `(app)` route pages

**Context Layer (State Providers):**
- Purpose: Global state management via React Context + hooks
- Location: `contexts/`
- Contains: `AuthContext.tsx` (auth state, shop data, demo mode), `ProductsContext.tsx` (product catalog wrapper)
- Depends on: Supabase client, custom hooks
- Used by: All app components

**Hook Layer (Business Logic):**
- Purpose: Encapsulate data fetching, voice interaction, and business logic
- Location: `hooks/`
- Contains: `useVoice.ts` (STT/TTS), `useProducts.ts` (CRUD + fuzzy search), `useTransactions.ts` (sales data queries)
- Depends on: Supabase client, Edge Functions, Web APIs
- Used by: Pages and contexts

**NLP Layer (Voice Intelligence):**
- Purpose: Process voice transcripts into structured intents and entities
- Location: `lib/nlp/`
- Contains: `useSmartNLP.ts` (hook), `dialogflow.ts` (CX Edge Function client), `intent-router.ts` (intent-to-action mapping)
- Depends on: Edge Functions (`dialogflow-cx-detect`)
- Used by: `app/(app)/voice-hub/page.tsx`

**Voice Layer (Audio I/O):**
- Purpose: Manage speech recognition and text-to-speech with fallback chains
- Location: `hooks/useVoice.ts`, `lib/voice/responses-ml.ts`
- Contains: Web Speech API wrapper, TTS fallback chain (Sarvam -> Google -> Browser), Malayalam response templates
- Depends on: Browser Web Speech API, Edge Functions (`sarvam-tts`, `google-tts`)
- Used by: Voice Hub page

**Data Access Layer:**
- Purpose: Supabase client singleton and Edge Function call utility
- Location: `lib/supabase/`
- Contains: `client.ts` (singleton with config validation), `edge-functions.ts` (generic Edge Function caller with auth token injection)
- Depends on: `@supabase/supabase-js`, environment variables
- Used by: All hooks and contexts

**UI Component Layer:**
- Purpose: Reusable presentational components
- Location: `components/`
- Contains: `ui/` (shadcn/ui primitives), `voice/` (mic button, conversation log, live cart), `billing/` (payment overlay), `dashboard/` (stat cards, charts), `shared/` (toast), `layout/` (sidebar, header, bottom tabs)
- Depends on: `@radix-ui/*`, `lucide-react`, `recharts`, `lib/utils`
- Used by: Page components

**Static Data Layer:**
- Purpose: Product catalog, constants, and type definitions
- Location: `lib/data/`, `lib/constants.ts`, `types/`
- Contains: `products.ts` (~100 Kerala products with Malayalam names, aliases, pricing), `constants.ts` (voice settings, GST rates, categories), `database.ts` (Supabase schema types)
- Depends on: Nothing
- Used by: Hooks, NLP, pages

## Data Flow

**Voice Command to Action (Primary Flow):**

1. User taps mic button -> `VoiceMicButton` calls `toggleListening()` from `useVoice`
2. `useVoice` starts Web Speech API (`SpeechRecognition`) with `ml-IN` locale
3. Speech recognized -> `onResult` callback fires with transcript
4. `VoiceHubPage` receives transcript via `useEffect` watching `transcript` state
5. Transcript normalized: Malayalam transliterations mapped to English (`useSmartNLP.normalizeTranscript`)
6. Normalized text sent to Dialogflow CX via Edge Function (`dialogflow-cx-detect`)
7. CX response parsed into `NLPResult` with intent, entities, products
8. `routeIntent()` maps CX intent to `RouterAction` (operation + mode + voice response)
9. Voice Hub billing state machine processes operation based on current `BillingPhase`
10. Action executed (e.g., add to cart, check stock, show QR)
11. Malayalam voice response generated from `lib/voice/responses-ml.ts` templates
12. Response spoken via TTS fallback chain: Sarvam AI -> Google TTS -> Browser TTS

**Product Search Flow:**

1. NLP extracts product name from voice command (English or Malayalam)
2. `useProducts.findProduct(query)` called with extracted name
3. Fuzzy matching algorithm searches `name_en`, `name_ml`, and `aliases` array
4. Best match above 0.5 threshold returned
5. Product data used for cart pricing, stock checks, location queries

**Authentication Flow:**

1. User lands on `/` -> `app/page.tsx` checks auth state from `AuthContext`
2. Redirects to `/login` (unauthenticated), `/onboarding` (no shop), or `/dashboard` (ready)
3. Login page offers Google OAuth or Demo Mode
4. Google OAuth: Supabase `signInWithOAuth` with implicit flow (tokens in URL hash)
5. Auth state change triggers `onAuthStateChange` listener in `AuthContext`
6. Shop data fetched from `shops` table using `owner_id = auth.uid()`
7. If no shop found -> redirect to `/onboarding` wizard

**Transaction Completion Flow:**

1. Voice Hub billing state machine reaches payment confirmation
2. `completeSale()` builds transaction record from cart items
3. Transaction INSERT to Supabase `transactions` table with JSONB `items` array
4. Stock decremented for each product via `updateStock()` calls
5. Products list refreshed via `loadProducts()`
6. `PaymentSuccessOverlay` shown with animated confirmation
7. Cart cleared, billing phase reset to `idle`

**State Management:**

- **Auth state:** `AuthContext` manages `user`, `session`, `shop`, `isLoading`, `isDemoMode` via `useState`. Auth listener (`onAuthStateChange`) updates state on auth events.
- **Products state:** `ProductsContext` wraps `useProducts` hook, providing shared product list across all `(app)` routes. Products loaded once on mount, updated in-memory after CRUD operations.
- **Billing state:** Local `useState` in `VoiceHubPage` manages cart items (`CartItem[]`), billing phase (`BillingPhase`), conversation messages, and QR data. Not persisted between page navigations.
- **Transaction state:** `useTransactions` hook fetches from Supabase on mount with period filtering. No caching layer.
- **Voice state:** `useVoice` hook manages `VoiceState` (`idle`/`listening`/`processing`/`speaking`/`error`), transcript, and interim transcript via `useState` + `useRef`.

## Key Abstractions

**BillingPhase State Machine:**
- Purpose: Manages the conversational billing flow through 7 phases
- Examples: `app/(app)/voice-hub/page.tsx` (lines 21-28)
- Pattern: Finite state machine with phase transitions driven by NLP intents
- Phases: `idle` -> `collecting` -> `waiting_for_more` -> `confirming_items` -> `asking_payment` -> `awaiting_cash`/`showing_qr`
- Timers: 5s "anything else?" prompt after items added, 15s "have you paid?" reminder during cash payment

**NLPResult -> RouterAction:**
- Purpose: Decouple NLP output from UI action handling
- Examples: `lib/nlp/intent-router.ts`
- Pattern: Intent string mapped to operation enum, operation mapped to HubMode, voice response generated from templates
- 30+ intent-to-operation mappings covering billing, stock, inventory, reports, payment, and system intents

**TTS Fallback Chain:**
- Purpose: Ensure Malayalam voice output works across environments
- Examples: `hooks/useVoice.ts` (lines 430-516)
- Pattern: Chain of responsibility: Sarvam AI (best quality) -> Google TTS Edge Function -> Browser Web Speech Synthesis
- Each level catches errors and falls back to the next

**Demo Mode:**
- Purpose: Full app functionality without Supabase connection
- Examples: `contexts/AuthContext.tsx` (DEMO_SHOP, DEMO_USER), `hooks/useProducts.ts` (DEMO_PRODUCTS)
- Pattern: Null-check on Supabase client (`createClient()` returns `null` if not configured). All CRUD operations have dual code paths: Supabase or in-memory state updates.

**Product Fuzzy Search:**
- Purpose: Match voice-recognized text (often inaccurate) to product catalog
- Examples: `hooks/useProducts.ts` (lines 38-106)
- Pattern: Score-based matching across `name_en`, `name_ml`, and `aliases[]` with exact (1.0), contains (0.9), starts-with (0.85), and character-by-character (0.7) scoring. Threshold: 0.5.

## Entry Points

**Root Page (`/`):**
- Location: `app/page.tsx`
- Triggers: Direct navigation, app launch
- Responsibilities: Auth-based redirect to `/login`, `/onboarding`, or `/dashboard`

**Root Layout:**
- Location: `app/layout.tsx`
- Triggers: Every page render
- Responsibilities: Wraps app in `Providers` (AuthProvider + ToastProvider), loads Inter font

**App Layout:**
- Location: `app/(app)/layout.tsx`
- Triggers: All authenticated routes (`/dashboard`, `/voice-hub`, `/billing`, `/inventory`, `/reports`, `/settings`)
- Responsibilities: Auth guard (redirect to `/login` if unauthenticated), wraps in `ProductsProvider`, renders sidebar/header/bottom-tabs shell, prefetches all routes

**Voice Hub:**
- Location: `app/(app)/voice-hub/page.tsx`
- Triggers: User navigates to Voice Hub tab
- Responsibilities: Core voice interaction page. Instantiates `useVoice`, `useSmartNLP`, manages billing state machine, renders mic button, conversation log, and live cart.

## Error Handling

**Strategy:** Defensive with graceful degradation. No global error boundary wrapping the full app (one was planned but not implemented in the current codebase).

**Patterns:**
- **Supabase null checks:** Every Supabase operation first checks `createClient()` return value. If `null` (not configured), falls back to demo mode behavior.
- **Edge Function errors:** `callEdgeFunction()` catches all errors and returns `{ data: null, error: string }`. Callers check error and fall back (e.g., TTS fallback chain).
- **Auth timeout:** 8-second timeout in `AuthContext` auth initialization. If Supabase auth doesn't respond, forces `isLoading = false` to prevent infinite loading.
- **Speech recognition errors:** `no-speech` errors auto-restart recognition. `aborted` errors silently ignored. Real errors set `VoiceState` to `'error'` with 2s auto-reset to `'idle'`.
- **Toast notifications:** `toast.error()` / `toast.success()` for user-facing feedback. Global singleton pattern via module-level `globalAddToast` function.

## Cross-Cutting Concerns

**Logging:** Console-based with emoji prefixes for quick scanning:
- Voice: `console.log('🎤 ...')`
- TTS: `console.log('🔊 ...')`
- NLP: `console.log('🧠 ...')`
- Auth: `console.log('[Auth] ...')`
- Products: `console.log('[Products] ...')`
- No structured logging or remote log aggregation.

**Validation:** Minimal. Form validation is manual (check for empty strings, parse numbers). Zod is a dependency but not currently used for runtime validation. No input sanitization.

**Authentication:** Google OAuth via Supabase Auth with implicit flow. Row Level Security (RLS) on all three tables ensures data isolation per user. Auth token auto-injected into Edge Function calls. Demo mode bypasses all auth with hardcoded user/shop objects.

**Internationalization:** Bilingual by design. All voice responses in Malayalam (`lib/voice/responses-ml.ts`). UI labels in English. Product names stored in both English (`name_en`) and Malayalam (`name_ml`). Voice recognition configured for `ml-IN` locale with Malayalam-to-English normalization for common words (UPI, GPay, cash, etc.).

## Routing Structure

**Route Groups:**

```
app/
├── layout.tsx              # Root: Providers wrapper (AuthProvider + ToastProvider)
├── page.tsx                # "/": Auth redirect dispatcher
├── providers.tsx           # Client component wrapping providers
│
├── (auth)/                 # Unauthenticated routes (no nav shell)
│   ├── login/page.tsx      # "/login": Google OAuth + Demo Mode
│   └── onboarding/page.tsx # "/onboarding": 3-step shop setup wizard
│
└── (app)/                  # Authenticated routes (with nav shell)
    ├── layout.tsx          # Auth guard + ProductsProvider + Sidebar/Header/BottomTabs
    ├── dashboard/page.tsx  # "/dashboard": Stats, charts, recent transactions
    ├── voice-hub/page.tsx  # "/voice-hub": Voice billing (main feature)
    ├── billing/page.tsx    # "/billing": Sales history table with filters
    ├── inventory/page.tsx  # "/inventory": Product CRUD with grid/list views
    ├── reports/page.tsx    # "/reports": Analytics with Recharts (area, pie)
    └── settings/page.tsx   # "/settings": Shop details, UPI, GSTIN, sign out
```

**Navigation:** Desktop uses `Sidebar` (left, 264px fixed). Mobile uses `BottomTabs` (bottom bar, 64px) with "More" overflow menu for Reports and Settings.

## Architectural Decisions and Trade-offs

**Static Export (No SSR):**
- Decision: `output: 'export'` in `next.config.js`
- Reason: Deploy to Cloudflare Pages (free, India POPs). Vercel Hobby prohibits commercial use.
- Trade-off: No server components, no API routes, no middleware. All data fetching is client-side.

**Supabase Edge Functions (Not Next.js API Routes):**
- Decision: External API calls (Sarvam TTS, Google TTS, Dialogflow CX) run in Supabase Edge Functions
- Reason: Static export cannot have API routes. Edge Functions are free on Supabase free tier.
- Trade-off: Cold start latency on first call. Secrets managed in Supabase dashboard, not in codebase.

**Pattern-Based NLP with CX Fallback:**
- Decision: Dialogflow CX Playbook as primary NLP, ultra-light local regex as fallback
- Reason: CX provides Gemini-powered intent detection for complex Malayalam. Local fallback ensures basic functionality (confirm/cancel/greeting) even when CX is unreachable.
- Trade-off: CX requires Edge Function roundtrip (~200-500ms). Local fallback only handles ~6 basic intents.

**Singleton Supabase Client:**
- Decision: Module-level singleton in `lib/supabase/client.ts`
- Reason: Prevents creating new client on every render. Uses implicit OAuth flow for static export compatibility.
- Trade-off: Client created at module load time, cannot be server-side rendered.

**Demo Mode as First-Class Citizen:**
- Decision: Every data operation has a demo mode branch that operates on in-memory state
- Reason: Allows app evaluation without Supabase project. Kerala shopkeepers may test before setting up backend.
- Trade-off: Dual code paths in every hook. Demo data resets on page refresh.

---

*Architecture analysis: 2026-03-24*
