# External Integrations

**Analysis Date:** 2026-03-24

## APIs & External Services

### Supabase (Primary Backend)

**Purpose:** Database, authentication, edge functions (serverless compute), and storage.

- **Project:** `ctrjetjhwvgqoqpbytyb` in Mumbai region (`asia-south1`)
- **SDK/Client:** `@supabase/supabase-js` ^2.45.0
- **Client setup:** `lib/supabase/client.ts` - Singleton browser client with implicit OAuth flow
- **Auth token:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public, row-level security enforced)
- **Client returns `null`** when Supabase is not configured, enabling graceful demo mode fallback

**Key pattern:** The Supabase client is nullable throughout the codebase. Every consumer checks for `null` and falls back to demo data. See `hooks/useProducts.ts` lines 114-116 for the pattern:
```typescript
const supabase = createClient();
const isDemoMode = supabase === null;
```

### Dialogflow CX (NLP Intent Detection)

**Purpose:** Natural language understanding for voice commands. Uses Dialogflow CX with Playbook (Gemini LLM-powered) for intent classification and entity extraction from Malayalam/English mixed speech.

- **Service:** Google Dialogflow CX (not ES)
- **Location:** `asia-south1`
- **Agent ID:** `67770bf6-84aa-4841-b21e-bf808449c8e6`
- **Client-side code:** `lib/nlp/dialogflow.ts` - Calls CX via Supabase Edge Function `dialogflow-cx-detect`
- **Hook:** `lib/nlp/useSmartNLP.ts` - Primary NLP hook, CX-first with ultra-light local regex fallback
- **Auth:** Service account credentials stored as Supabase Edge Function secrets
- **Env vars (for deploy script):**
  - `DIALOGFLOW_PROJECT_ID`
  - `DIALOGFLOW_CLIENT_EMAIL`
  - `DIALOGFLOW_PRIVATE_KEY`

**Intent types detected** (defined in `lib/nlp/dialogflow.ts`):
- `billing.add`, `billing.remove`, `billing.clear`, `billing.total`, `billing.complete`
- `stock.check`, `stock.location`
- `inventory.add`, `inventory.update`, `inventory.low_stock`, `inventory.check`
- `payment.upi`, `payment.cash`
- `report.today`, `report.week`, `report.profit`
- `confirm`, `cancel`, `help`, `greeting`, `fallback`

**Response format** includes structured `products[]` array with `name`, `nameMl`, `qty`, `unit` for multi-product billing commands.

**Fallback behavior:** When CX is unreachable or unconfigured, `useSmartNLP.ts` falls back to local regex matching for basic intents only (confirm, cancel, greeting, payment.upi, payment.cash, billing.complete, stock.location). No local product matching is attempted.

### Sarvam AI (Malayalam TTS - Primary)

**Purpose:** High-quality Malayalam text-to-speech using Bulbul v2 neural voice model.

- **Called via:** Supabase Edge Function `sarvam-tts`
- **Client code:** `hooks/useVoice.ts` function `speakWithSarvamTTS()` (line 431)
- **Auth:** `SARVAM_API_KEY` stored as Supabase Edge Function secret
- **Response:** Returns `audioUrl` (data URL) played via HTML5 `Audio` element
- **Fallback chain:** Sarvam AI -> Google TTS -> Browser Speech Synthesis

### Google Translate TTS (Malayalam TTS - Fallback)

**Purpose:** Fallback text-to-speech when Sarvam AI is unavailable.

- **Called via:** Supabase Edge Function `google-tts`
- **Client code:** `hooks/useVoice.ts` function `speakWithGoogleTTS()` (line 369)
- **Auth:** Uses Google Translate's public TTS endpoint (no API key needed in edge function)
- **Response:** Returns `audioUrl` (data URL) played via HTML5 `Audio` element
- **Fallback:** Falls back to browser's built-in Speech Synthesis API

### Web Speech API (Browser-Native, No External Service)

**Speech Recognition (STT):**
- **Implementation:** `hooks/useVoice.ts` - Wraps `window.SpeechRecognition` / `webkitSpeechRecognition`
- **Language:** `ml-IN` (Malayalam India) as primary, configurable via `VOICE_SETTINGS.lang` in `lib/constants.ts`
- **Mode:** Continuous listening with interim results, 3 max alternatives
- **Silence detection:** Custom timer (1500ms default) fires `onSilence` callback
- **Auto-restart:** Automatically restarts recognition on end/no-speech while in listening state

**Speech Synthesis (TTS - Last Resort Fallback):**
- **Implementation:** `hooks/useVoice.ts` function `speakWithBrowserTTS()` (line 329)
- **Voice preference:** Malayalam -> Hindi -> English India -> any English
- **Settings:** Rate 0.85, pitch 1.0, volume 1.0

### Google Fonts CDN

**Purpose:** Load Inter font family for UI typography.
- **URL:** `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap`
- **Loaded in:** `app/layout.tsx` via `<link>` tag in `<head>`

## Data Storage

### PostgreSQL (via Supabase)

**Connection:**
- URL: `NEXT_PUBLIC_SUPABASE_URL`
- Auth: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon key + RLS policies)
- Client: `@supabase/supabase-js` typed with `Database` interface from `types/database.ts`

**Tables (schema in `supabase/migrations/001_initial_schema.sql`):**

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `shops` | Store information per shopkeeper | `owner_id` (FK to auth.users), `name`, `name_ml`, `upi_id`, `gstin` |
| `products` | Product inventory per shop | `shop_id`, `name_en`, `name_ml`, `aliases[]`, `price`, `stock`, `unit`, `gst_rate` |
| `transactions` | Sales records | `shop_id`, `items` (JSONB array), `subtotal`, `total`, `payment_method` |

**Row Level Security (RLS):**
- All tables have RLS enabled
- `shops`: Users can only access rows where `owner_id = auth.uid()`
- `products` and `transactions`: Access gated by shop ownership (`shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())`)

**Indexes:** On `shop_id`, `name_ml`, `name_en`, `category`, `is_active`, `created_at`, `payment_method`, `owner_id`

**Triggers:** `update_updated_at_column()` auto-updates `updated_at` on shops and products

**Additional migration:** `supabase/migrations/002_update_prices_march2026.sql` (price updates)

**File Storage:**
- Supabase Storage configured (1GB free tier) for product images via `image_url` column
- Not actively used in current codebase (all `image_url` values are null in demo data)

**Caching:**
- None. All data fetched fresh from Supabase on each page load/hook mount.
- Products cached in React state via `useProducts` hook and shared via `ProductsContext`

## Authentication & Identity

**Auth Provider:** Supabase Auth with Google OAuth

- **Implementation:** `contexts/AuthContext.tsx`
- **Flow:** Google OAuth via `supabase.auth.signInWithOAuth({ provider: 'google' })`
- **Auth type:** Implicit OAuth flow (`flowType: 'implicit'`) - tokens in URL hash, ideal for static exports
- **Session:** Auto-refresh enabled, persisted to localStorage, detected from URL on redirect
- **Redirect:** After Google sign-in, redirects to `/dashboard`

**Demo Mode:**
- When Supabase is not configured (env vars missing or placeholder), the app runs in demo mode
- Demo mode provides a fake `DEMO_USER` and `DEMO_SHOP` object
- All CRUD operations work locally in React state without any backend
- Demo mode can be enabled explicitly via `enableDemoMode()` from the login page

**Shop Loading Pattern:**
- Auth state change listener sets `user` and `session`
- Separate `useEffect` fetches shop data when user changes
- Combined loading state: `isLoading || (!!user && !isDemoMode && !shopLoaded)`

## Supabase Edge Functions

**Three Edge Functions deployed** (Deno runtime on Supabase infrastructure):

| Function Name | Purpose | Auth/Secrets Required |
|---|---|---|
| `sarvam-tts` | Malayalam TTS via Sarvam AI Bulbul v2 | `SARVAM_API_KEY` |
| `google-tts` | Fallback TTS via Google Translate | None (public endpoint) |
| `dialogflow-cx-detect` | Intent detection via Dialogflow CX Playbook | `DIALOGFLOW_PROJECT_ID`, `DIALOGFLOW_CLIENT_EMAIL`, `DIALOGFLOW_PRIVATE_KEY` |

**Edge Function Client Utility:** `lib/supabase/edge-functions.ts`
- `callEdgeFunction(functionName, body)` - Generic caller with auto auth token injection
- Sends `Authorization: Bearer <session_token>` header (falls back to anon key)
- Sends `apikey` header with anon key
- Automatic retry with anon key on 401 (expired session token)
- `isEdgeFunctionsAvailable()` - Checks if Supabase URL is configured (not placeholder)

**Edge Function URL pattern:** `${SUPABASE_URL}/functions/v1/${functionName}`

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry, Datadog, or similar service)
- Errors logged to `console.error` throughout

**Logs:**
- `console.log` / `console.warn` / `console.error` with emoji prefixes for categories:
  - `[Auth]` - Authentication flow
  - `[Products]` - Product loading/CRUD
  - Voice/TTS logging with emoji prefixes
- No structured logging or log aggregation service

## CI/CD & Deployment

**Hosting:**
- Cloudflare Pages (static site hosting)
- India POPs: Mumbai, Chennai, Delhi, Kolkata (low latency for Kerala users)
- HTTPS provided automatically

**CI Pipeline:**
- None configured (no `.github/workflows/`, no `netlify.toml`, no `wrangler.toml` detected)
- Build verified manually: `next build` exit code 0

**Deployment Scripts:**
- `scripts/deploy-cx-playbook.mjs` - Updates Dialogflow CX Playbook goals, instructions, and training examples via Google Cloud API
  - Uses `google-auth-library` for authentication
  - Reads credentials from `.env.local`
  - Targets agent at `asia-south1`

## Environment Configuration

**Required env vars (`.env.local`):**

| Variable | Purpose | Required |
|----------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes (app runs in demo mode without it) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous API key | Yes (app runs in demo mode without it) |

**Optional env vars:**

| Variable | Purpose | Default |
|----------|---------|---------|
| `NEXT_PUBLIC_APP_URL` | Application base URL | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_NAME` | Display name | `Shopkeeper AI` |
| `NEXT_PUBLIC_ENABLE_VOICE` | Voice feature flag | `true` |
| `NEXT_PUBLIC_ENABLE_GST` | GST calculation flag | `true` |
| `NEXT_PUBLIC_ENABLE_REPORTS` | Reports feature flag | `true` |
| `NEXT_PUBLIC_VOICE_LANG` | Speech recognition language | `ml-IN` |
| `DIALOGFLOW_PROJECT_ID` | Dialogflow CX project (for deploy script) | - |
| `DIALOGFLOW_CLIENT_EMAIL` | Dialogflow service account email | - |
| `DIALOGFLOW_PRIVATE_KEY` | Dialogflow service account private key | - |

**Supabase Edge Function Secrets (set in Supabase Dashboard > Edge Functions > Secrets):**
- `SARVAM_API_KEY` - Sarvam AI TTS API key
- `DIALOGFLOW_PROJECT_ID` - Google Cloud project ID
- `DIALOGFLOW_CLIENT_EMAIL` - Service account email
- `DIALOGFLOW_PRIVATE_KEY` - Service account private key

**Secrets location:**
- `.env.local` for local development (gitignored)
- `.env.local.example` for template (committed)
- `lock/shopkeeper-ai-*.json` - Google service account key file (should NOT be committed)
- Supabase Dashboard for Edge Function secrets in production

## TTS Fallback Chain

The voice output system uses a 3-tier fallback chain implemented in `hooks/useVoice.ts`:

```
1. Sarvam AI TTS (Edge Function `sarvam-tts`)
   - Best quality Malayalam voice (Bulbul v2 neural model)
   - Falls back on: API error, no audio URL, network failure
       |
       v
2. Google Translate TTS (Edge Function `google-tts`)
   - Decent Malayalam pronunciation
   - Falls back on: Edge function unavailable, API error, audio playback error
       |
       v
3. Browser Speech Synthesis (window.speechSynthesis)
   - Native browser TTS, quality varies by OS/browser
   - Voice selection order: Malayalam -> Hindi -> English-IN -> any English
   - No further fallback (silent failure with state reset)
```

## NLP Processing Pipeline

Intent detection follows a CX-first architecture in `lib/nlp/useSmartNLP.ts`:

```
1. Normalize transcript (lib/nlp/useSmartNLP.ts normalizeTranscript())
   - Convert Malayalam transliterations to English: "യുപിഐ" -> "UPI", "ക്യാഷ്" -> "cash"
       |
       v
2. Dialogflow CX Playbook (via Edge Function `dialogflow-cx-detect`)
   - Gemini LLM-powered intent + entity extraction
   - Returns structured intent, products[], confidence
   - Session-based conversation tracking
       |
       v (on failure)
3. Local regex fallback (useSmartNLP.ts detectLocalFallback())
   - Only handles: confirm, cancel, greeting, payment.upi, payment.cash, billing.complete, stock.location
   - No product matching capability
       |
       v
4. Intent Router (lib/nlp/intent-router.ts routeIntent())
   - Maps intent to operation + hub mode + Malayalam voice response
   - Used by Voice Hub page to determine UI state and spoken feedback
```

## Webhooks & Callbacks

**Incoming:**
- Google OAuth callback (handled by Supabase Auth, redirects to `/dashboard`)

**Outgoing:**
- None

## Third-Party Client Libraries in Lock Directory

**Warning:** `lock/shopkeeper-ai-*.json` appears to be a Google Cloud service account key file. This directory should be verified as gitignored to prevent credential leaks.

---

*Integration audit: 2026-03-24*
