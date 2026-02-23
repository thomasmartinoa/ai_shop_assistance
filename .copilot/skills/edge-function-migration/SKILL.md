---
name: edge-function-migration
description: Migrate Next.js API routes to Supabase Edge Functions for static export compatibility. Use when user asks about API routes not working, static export issues, edge functions, serverless functions, or deployment API problems. Also use when user says "edge function", "API route", "static export", "serverless", "migrate API".
tools: Read, Bash, Edit, Write, Grep, Glob
---

# Edge Function Migration

Migrate Next.js API routes to Supabase Edge Functions. This is CRITICAL because the project uses `output: 'export'` (static export) which **does not support API routes**.

## The Problem

```
next.config.js → output: 'export'
                    ↓
API routes are EXCLUDED from the build
                    ↓
/api/dialogflow/detect → 404 in production
/api/sarvam-tts → 404 in production
/api/tts → 404 in production
```

## API Routes to Migrate

| Current Route | Purpose | Priority |
|---------------|---------|----------|
| `app/api/dialogflow/detect/route.ts` | Dialogflow ES intent detection (protects credentials) | HIGH |
| `app/api/sarvam-tts/route.ts` | Sarvam AI Malayalam TTS | HIGH |
| `app/api/tts/route.ts` | Google TTS fallback | MEDIUM |

## Migration Steps

### Step 1: Create Supabase Edge Function

Each API route becomes a Deno-based Edge Function:

```typescript
// supabase/functions/dialogflow-detect/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req: Request) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { text, sessionId, languageCode } = await req.json();
    // ... migrate logic from route.ts

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
```

### Step 2: Deploy via MCP

Use `mcp__supabase__deploy_edge_function` to deploy each function.

### Step 3: Update Frontend Calls

Replace `/api/...` calls with Supabase Edge Function URLs:

```typescript
// Before (Next.js API route)
const res = await fetch('/api/dialogflow/detect', { method: 'POST', body: ... });

// After (Supabase Edge Function)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const res = await fetch(`${SUPABASE_URL}/functions/v1/dialogflow-detect`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  },
  body: ...
});
```

## Key Differences: Next.js API Route vs Edge Function

| Feature | Next.js API Route | Supabase Edge Function |
|---------|-------------------|------------------------|
| Runtime | Node.js | Deno |
| Imports | `require()` / `import` | `import` (ESM only) |
| Env vars | `process.env.XXX` | `Deno.env.get('XXX')` |
| Crypto | `crypto` module | Web Crypto API |
| Response | `NextResponse.json()` | `new Response()` |
| Auth | Middleware | JWT in Authorization header |
| CORS | Automatic | Must add manually |

## Environment Variables

Edge Functions access env vars differently. Set secrets via Supabase dashboard:
- `DIALOGFLOW_PROJECT_ID`
- `DIALOGFLOW_CLIENT_EMAIL`
- `DIALOGFLOW_PRIVATE_KEY`
- `SARVAM_API_KEY`

## Files to Update After Migration

| File | Change |
|------|--------|
| `lib/nlp/dialogflow.ts` | Update fetch URL to Edge Function |
| `hooks/useVoice.ts` | Update TTS fetch URL |
| `lib/nlp/useSmartNLP.ts` | Update Dialogflow endpoint |
| `app/(app)/billing/page.tsx` | Verify NLP calls work |
| `app/(app)/inventory/page.tsx` | Verify voice commands work |

## Testing After Migration

1. Deploy Edge Function via MCP
2. Test with curl:
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/dialogflow-detect \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"text": "രണ്ട് കിലോ അരി", "languageCode": "ml"}'
```
3. Update frontend URLs
4. Test full voice → NLP → action flow in browser
