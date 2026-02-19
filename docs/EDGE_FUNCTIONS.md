# Supabase Edge Functions - Technical Spec

**Purpose**: Replace Next.js API routes with Supabase Edge Functions for static export compatibility.

---

## Overview

The app uses `output: 'export'` in `next.config.js` for Cloudflare Pages static deployment. This means **no server-side code** can run in Next.js. All 3 existing API routes must be migrated to Supabase Edge Functions.

### Current API Routes (To Be Removed)
```
app/api/sarvam-tts/route.ts      -> Supabase Edge Function: sarvam-tts
app/api/tts/route.ts             -> Supabase Edge Function: google-tts
app/api/dialogflow/detect/route.ts -> Supabase Edge Function: dialogflow-detect
```

---

## Edge Function 1: `sarvam-tts`

### Purpose
Convert Malayalam text to speech using Sarvam AI's Bulbul v2 model.

### Endpoint
```
POST https://<project-ref>.supabase.co/functions/v1/sarvam-tts
```

### Request
```json
{
  "text": "നമസ്കാരം, എന്ത് സഹായം വേണം?",
  "lang": "ml"
}
```

### Response
```json
{
  "success": true,
  "audioUrl": "data:audio/wav;base64,<base64-audio>",
  "format": "wav",
  "provider": "sarvam",
  "language": "ml"
}
```

### Error Response
```json
{
  "error": "Sarvam API error",
  "details": "...",
  "fallback": true
}
```

### Secrets Required
| Secret Name | Value |
|-------------|-------|
| `SARVAM_API_KEY` | Sarvam AI subscription key |

### Implementation Notes
- JWT verification enabled (only authenticated users)
- Sarvam API endpoint: `https://api.sarvam.ai/text-to-speech`
- Speaker: `karun` (male Malayalam voice)
- Model: `bulbul:v1`
- Sample rate: 8000Hz
- Returns base64 WAV audio as data URL

---

## Edge Function 2: `google-tts`

### Purpose
Fallback TTS using Google Translate's unofficial TTS endpoint.

### Endpoint
```
POST https://<project-ref>.supabase.co/functions/v1/google-tts
```

### Request
```json
{
  "text": "നമസ്കാരം",
  "lang": "ml"
}
```

### Response
```json
{
  "success": true,
  "audioUrl": "data:audio/mpeg;base64,<base64-audio>",
  "format": "mp3"
}
```

### Secrets Required
None.

### Implementation Notes
- JWT verification enabled
- Uses Google Translate TTS URL: `https://translate.google.com/translate_tts?ie=UTF-8&tl={lang}&client=tw-ob&q={text}`
- Fetches audio buffer server-side, converts to base64 data URL
- This is an unofficial API - may break. Used as fallback only.

---

## Edge Function 3: `dialogflow-detect`

### Purpose
Detect user intent from Malayalam/English text using Dialogflow ES.

### Endpoint
```
POST https://<project-ref>.supabase.co/functions/v1/dialogflow-detect
```

### Request
```json
{
  "text": "2 കിലോ അരി",
  "sessionId": "user-session-123",
  "languageCode": "ml"
}
```

### Response
```json
{
  "queryResult": {
    "intent": {
      "displayName": "billing.add"
    },
    "intentDetectionConfidence": 0.92,
    "fulfillmentText": "2 kg Rice added to bill",
    "parameters": {
      "product": "Rice",
      "quantity": 2,
      "unit": "kg"
    }
  }
}
```

### Secrets Required
| Secret Name | Value |
|-------------|-------|
| `DIALOGFLOW_PROJECT_ID` | Google Cloud project ID |
| `DIALOGFLOW_CLIENT_EMAIL` | Service account email |
| `DIALOGFLOW_PRIVATE_KEY` | Service account private key (PEM format) |

### Implementation Notes
- JWT verification enabled
- Uses Dialogflow ES v2 API (not CX)
- Implements JWT-based Google OAuth2 token exchange
- Service account must have `Dialogflow API Client` role
- Default language code: `ml` (Malayalam)
- Session ID used for conversation context

---

## Client-Side Integration

### Utility: `lib/supabase/edge-functions.ts`

```typescript
// Centralized Edge Function caller
// - Automatically includes Supabase auth token
// - Handles errors and returns typed responses
// - Provides fallback URL configuration

import { createClient } from './client';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function callEdgeFunction<T>(
  functionName: string,
  body: Record<string, unknown>
): Promise<T> {
  const supabase = createClient();
  // Get current session token
  // Call function via supabase.functions.invoke()
  // Handle errors
  // Return typed response
}
```

### Voice Hook Changes (`hooks/useVoice.ts`)

Replace:
```typescript
const response = await fetch('/api/sarvam-tts', { ... });
```

With:
```typescript
import { callEdgeFunction } from '@/lib/supabase/edge-functions';
const response = await callEdgeFunction('sarvam-tts', { text, lang });
```

### Dialogflow Changes (`lib/nlp/dialogflow.ts`)

Replace:
```typescript
const response = await fetch('/api/dialogflow/detect', { ... });
```

With:
```typescript
import { callEdgeFunction } from '@/lib/supabase/edge-functions';
const response = await callEdgeFunction('dialogflow-detect', { text, sessionId, languageCode });
```

---

## Fallback Chain

```
TTS Request
  ├── Sarvam Edge Function (primary, best quality)
  │     └── on error/timeout
  ├── Google TTS Edge Function (fallback)
  │     └── on error/timeout
  └── Browser SpeechSynthesis (last resort, no server needed)

NLP Request
  ├── Dialogflow Edge Function (primary, cloud NLP)
  │     └── on error/timeout
  └── Local Pattern Matching (fallback, no server needed)
```

---

## Deployment

Edge Functions are deployed via:
1. **Supabase MCP tool** (preferred): `mcp__supabase__deploy_edge_function`
2. **Supabase CLI**: `supabase functions deploy <name>`

Secrets are set via:
1. **Supabase Dashboard**: Project Settings > Edge Functions > Secrets
2. **Supabase CLI**: `supabase secrets set SARVAM_API_KEY=<value>`

---

## Testing

### Local Testing
```bash
# Start Supabase locally
supabase start

# Test edge function
curl -X POST http://localhost:54321/functions/v1/sarvam-tts \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"text": "നമസ്കാരം", "lang": "ml"}'
```

### Production Testing
```bash
# Test deployed function
curl -X POST https://<project-ref>.supabase.co/functions/v1/sarvam-tts \
  -H "Authorization: Bearer <user-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"text": "നമസ്കാരം", "lang": "ml"}'
```
