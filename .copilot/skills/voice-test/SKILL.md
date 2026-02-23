---
name: voice-test
description: Test the full voice command pipeline for the Shopkeeper AI. Use when user wants to test voice commands, verify NLP accuracy, check speech recognition mappings, test Malayalam commands, or debug voice-to-action flow. Also use when user says "test voice", "voice pipeline", "test Malayalam", "NLP test".
tools: Read, Bash, Grep, Glob
---

# Voice Command Testing

Test the full voice-to-action pipeline: Speech Recognition → NLP (Dialogflow + local) → Action → Voice Response.

## Context

- **Speech Recognition**: Web Speech API (`ml-IN` locale)
- **NLP Pipeline**: Dialogflow ES (primary) → Local pattern matching (fallback)
- **TTS**: Sarvam AI Bulbul v2 (primary) → Google TTS → Browser TTS (fallbacks)
- **Smart NLP Hook**: `lib/nlp/useSmartNLP.ts`
- **Voice Hook**: `hooks/useVoice.ts`
- **Products**: `hooks/useProducts.ts` (8 demo products)

## Test Workflow

### Step 1: Test Dialogflow Intent Detection

Run batch intent detection tests against the live Dialogflow agent:

```bash
cd /e/coding/ai_shop_assistance && node -e "
const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');
const creds = JSON.parse(fs.readFileSync('lock/shopkeeper-ai-2f59b5ac8bf4.json', 'utf-8'));
const auth = new GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/dialogflow'] });

const tests = [
  // Billing
  ['രണ്ട് കിലോ അരി', 'ml', 'billing.add'],
  ['ഒരു സോപ്പ്', 'ml', 'billing.add'],
  ['5 കിലോ പഞ്ചസാര', 'ml', 'billing.add'],
  ['അരി മാറ്റൂ', 'ml', 'billing.remove'],
  ['ബിൽ ക്ലിയർ ചെയ്യൂ', 'ml', 'billing.clear'],
  ['ടോട്ടൽ എത്ര', 'ml', 'billing.total'],
  ['ബിൽ ചെയ്യൂ', 'ml', 'billing.complete'],
  // Inventory
  ['അരി സ്റ്റോക്ക് എത്ര', 'ml', 'inventory.check'],
  ['50 കിലോ അരി സ്റ്റോക്കിൽ ചേർക്കുക', 'ml', 'inventory.add'],
  // Payment
  ['QR കാണിക്കൂ', 'ml', 'payment.upi'],
  ['കാഷ്', 'ml', 'payment.cash'],
  // Reports
  ['ഇന്നത്തെ സെയിൽസ്', 'ml', 'report.today'],
  ['ഈ ആഴ്ചയിലെ സെയിൽസ്', 'ml', 'report.week'],
  // General
  ['നമസ്കാരം', 'ml', 'general.greeting'],
  ['ശരി', 'ml', 'general.confirm'],
  ['വേണ്ട', 'ml', 'general.cancel'],
  // English fallback
  ['add rice 2 kg', 'en', 'billing.add'],
  ['check stock sugar', 'en', 'inventory.check'],
  ['show QR', 'en', 'payment.upi'],
];

(async () => {
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  let pass = 0;
  for (const [text, lang, expected] of tests) {
    const sid = 'test-' + Date.now() + Math.random();
    const res = await fetch('https://dialogflow.googleapis.com/v2/projects/' + creds.project_id + '/agent/sessions/' + sid + ':detectIntent', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ queryInput: { text: { text, languageCode: lang } } }),
    });
    const data = await res.json();
    const qr = data.queryResult || {};
    const ok = qr.intent?.displayName === expected;
    if (ok) pass++;
    console.log((ok ? 'PASS' : 'FAIL') + ' | \"' + text + '\" -> ' + (qr.intent?.displayName || 'null') + ' (' + ((qr.intentDetectionConfidence||0)*100).toFixed(0) + '%)' + (ok ? '' : ' [expected: ' + expected + ']'));
    await new Promise(r => setTimeout(r, 200));
  }
  console.log('\\nResult: ' + pass + '/' + tests.length + ' passed');
})();
"
```

### Step 2: Test Product Fuzzy Matching

Verify that product search finds the right product from voice input:

```bash
cd /e/coding/ai_shop_assistance && node -e "
const products = [
  { name_en: 'Rice', name_ml: 'അരി', aliases: ['ari', 'chawal', 'rice'] },
  { name_en: 'Sugar', name_ml: 'പഞ്ചസാര', aliases: ['panchara', 'cheeni', 'sugar'] },
  { name_en: 'Coconut Oil', name_ml: 'വെളിച്ചെണ്ണ', aliases: ['velichenna', 'coconut oil'] },
  { name_en: 'Tea Powder', name_ml: 'ചായപ്പൊടി', aliases: ['chaya', 'tea', 'chai'] },
  { name_en: 'Milk', name_ml: 'പാൽ', aliases: ['paal', 'milk'] },
  { name_en: 'Wheat Flour', name_ml: 'ഗോതമ്പ് പൊടി', aliases: ['gothambu', 'atta', 'wheat'] },
  { name_en: 'Salt', name_ml: 'ഉപ്പ്', aliases: ['uppu', 'salt'] },
  { name_en: 'Soap', name_ml: 'സോപ്പ്', aliases: ['soap', 'sabun'] },
];
const queries = ['അരി', 'rice', 'ari', 'പഞ്ചസാര', 'sugar', 'cheeni', 'ചായ', 'milk', 'പാൽ', 'atta', 'soppu', 'സോപ്പ്'];
queries.forEach(q => {
  let best = null, score = 0;
  products.forEach(p => {
    [p.name_en, p.name_ml, ...(p.aliases||[])].forEach(n => {
      const s = n.toLowerCase().includes(q.toLowerCase()) || q.toLowerCase().includes(n.toLowerCase()) ? 0.9 : 0;
      if (s > score) { score = s; best = p; }
    });
  });
  console.log((best ? 'MATCH' : 'MISS ') + ' | \"' + q + '\" -> ' + (best?.name_en || 'null'));
});
"
```

### Step 3: Test Sarvam AI TTS

```bash
cd /e/coding/ai_shop_assistance && node -e "
(async () => {
  const res = await fetch('https://api.sarvam.ai/text-to-speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': process.env.SARVAM_API_KEY || 'sk_0yzng7z4_YPOEVylXxRyHwBmEveFbphDC'
    },
    body: JSON.stringify({
      inputs: ['ശരി, രണ്ട് കിലോ അരി ബില്ലിൽ ചേർത്തു'],
      target_language_code: 'ml-IN',
      speaker: 'karun',
      model: 'bulbul:v2'
    })
  });
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Audio received:', data.audios ? data.audios[0]?.substring(0, 50) + '...' : 'NO AUDIO');
})();
"
```

## Key Files to Check

| File | Purpose |
|------|---------|
| `hooks/useVoice.ts` | Speech recognition + TTS with fallback chain |
| `lib/nlp/useSmartNLP.ts` | Dialogflow + local NLP combined |
| `lib/nlp/dialogflow.ts` | Dialogflow client wrapper |
| `lib/nlp/enhanced-matcher.ts` | Local regex pattern matching |
| `lib/nlp/intent.ts` | Intent type definitions |
| `hooks/useProducts.ts` | Product database + fuzzy search |
| `app/api/dialogflow/detect/route.ts` | Server-side Dialogflow API |
| `app/api/sarvam-tts/route.ts` | Sarvam AI TTS API route |

## Common Issues

| Issue | Fix |
|-------|-----|
| Intent not detected | Add more training phrases via `/dialogflow-manage` |
| Product not found | Add aliases to product in `useProducts.ts` and Dialogflow `product` entity |
| TTS not speaking | Check Sarvam API key, fallback to Google TTS or browser TTS |
| Wrong language | Ensure `ml-IN` for recognition, `ml` for Dialogflow |
