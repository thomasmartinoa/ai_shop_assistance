---
name: deploy-cloudflare
description: Build and deploy the Shopkeeper AI app to Cloudflare Pages with pre-flight checks. Use when user asks to deploy, build, publish, or push to production. Also use when user says "deploy", "cloudflare", "production", "build", "publish".
tools: Read, Bash, Edit, Write, Grep, Glob
---

# Deploy to Cloudflare Pages

Build and deploy the Shopkeeper AI Assistant as a static Next.js export to Cloudflare Pages.

## Context

- **Build Output**: Static export (`output: 'export'` in next.config.js)
- **Output Directory**: `out/`
- **Target**: Cloudflare Pages
- **Framework**: Next.js 14 (static export, no SSR)

## CRITICAL: API Routes Won't Work in Static Export

The project has `output: 'export'` in `next.config.js` which means:
- API routes (`app/api/*`) will NOT be included in the build
- These need to be moved to Supabase Edge Functions or Cloudflare Workers:
  - `/api/dialogflow/detect` → Supabase Edge Function
  - `/api/sarvam-tts` → Supabase Edge Function
  - `/api/tts` → Supabase Edge Function

## Pre-Flight Checklist

Before deploying, verify these:

### 1. Build Check
```bash
cd /e/coding/ai_shop_assistance && npm run build
```

### 2. Environment Variables Check
Ensure these are set in Cloudflare Pages dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` (your .pages.dev URL)
- `NEXT_PUBLIC_DIALOGFLOW_PROJECT_ID`

### 3. Static Export Validation
```bash
# Check output directory exists and has content
ls -la /e/coding/ai_shop_assistance/out/
# Verify key pages exist
ls /e/coding/ai_shop_assistance/out/index.html
ls /e/coding/ai_shop_assistance/out/billing/index.html
ls /e/coding/ai_shop_assistance/out/inventory/index.html
```

### 4. Test Pages to Exclude
Remove or ignore test pages before production deploy:
- `app/test-dialogflow/`
- `app/test-dialogflow-connection/`
- `app/test-intent/`

### 5. PWA Manifest Check
Verify `public/manifest.json` has correct `start_url` and icon paths.

## Deploy Commands

### First-time Setup
```bash
# Install Wrangler (Cloudflare CLI)
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create Pages project
wrangler pages project create shopkeeper-ai
```

### Deploy
```bash
cd /e/coding/ai_shop_assistance

# Build
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy out/ --project-name=shopkeeper-ai
```

### Deploy to Preview (Staging)
```bash
wrangler pages deploy out/ --project-name=shopkeeper-ai --branch=preview
```

## Post-Deploy Checklist

1. **Verify app loads** at the deployed URL
2. **Check HTTPS** is active (required for Web Speech API)
3. **Test voice** on mobile device (Chrome for Android)
4. **Verify Supabase connection** (not demo mode)
5. **Test UPI QR** generation
6. **Check PWA** install prompt works

## Supabase Keep-Alive

Free Supabase projects pause after 7 days of inactivity. Set up a Cloudflare Workers cron:

```javascript
// Cloudflare Worker - runs every 6 days
export default {
  async scheduled(event, env) {
    await fetch(env.SUPABASE_URL + '/rest/v1/', {
      headers: { 'apikey': env.SUPABASE_ANON_KEY }
    });
  }
};
```

Configure with cron trigger: `0 0 */6 * *` (every 6 days)

## Known Limitations

- No server-side rendering (static export only)
- API routes must be external (Edge Functions)
- Images are unoptimized (no Next.js image optimization)
- First load may be slow on 2G connections in rural Kerala
