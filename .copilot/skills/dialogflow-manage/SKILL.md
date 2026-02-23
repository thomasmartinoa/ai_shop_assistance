---
name: dialogflow-manage
description: Manage Dialogflow ES intents, entities, and training phrases for the Shopkeeper AI project. Use when user asks to add/update/delete intents, add training phrases, create entities, test intent detection, or manage Dialogflow configuration. Also use when user says "dialogflow", "intent", "training phrases", "entities", or "NLP setup".
tools: Read, Bash, Edit, Write, Grep, Glob
---

# Dialogflow ES Management

Manage Dialogflow ES (v2) intents, entities, and training phrases for the Shopkeeper AI Assistant via the REST API.

## Context

- **Project ID**: `shopkeeper-ai`
- **Service Account**: `dialogflow-client@shopkeeper-ai.iam.gserviceaccount.com`
- **Credentials File**: `lock/shopkeeper-ai-2f59b5ac8bf4.json`
- **API Version**: Dialogflow ES v2
- **Primary Language**: Malayalam (`ml`)
- **Fallback Language**: English (`en`)
- **Setup Script**: `scripts/setup-dialogflow.mjs`

## Available Operations

### 1. List All Intents
```bash
cd /e/coding/ai_shop_assistance && node -e "
const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');
const creds = JSON.parse(fs.readFileSync('lock/shopkeeper-ai-2f59b5ac8bf4.json', 'utf-8'));
const auth = new GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/dialogflow'] });
(async () => {
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  const res = await fetch('https://dialogflow.googleapis.com/v2/projects/' + creds.project_id + '/agent/intents', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const data = await res.json();
  (data.intents || []).forEach(i => console.log(i.displayName + ' (' + (i.trainingPhrases?.length || '?') + ' phrases)'));
})();
"
```

### 2. List All Entity Types
```bash
cd /e/coding/ai_shop_assistance && node -e "
const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');
const creds = JSON.parse(fs.readFileSync('lock/shopkeeper-ai-2f59b5ac8bf4.json', 'utf-8'));
const auth = new GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/dialogflow'] });
(async () => {
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  const res = await fetch('https://dialogflow.googleapis.com/v2/projects/' + creds.project_id + '/agent/entityTypes', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const data = await res.json();
  (data.entityTypes || []).forEach(e => console.log(e.displayName + ' (' + (e.entities?.length || 0) + ' entries)'));
})();
"
```

### 3. Test Intent Detection
```bash
cd /e/coding/ai_shop_assistance && node -e "
const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');
const creds = JSON.parse(fs.readFileSync('lock/shopkeeper-ai-2f59b5ac8bf4.json', 'utf-8'));
const auth = new GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/dialogflow'] });
const TEXT = 'YOUR_TEST_TEXT_HERE';
const LANG = 'ml';
(async () => {
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  const sid = 'test-' + Date.now();
  const res = await fetch('https://dialogflow.googleapis.com/v2/projects/' + creds.project_id + '/agent/sessions/' + sid + ':detectIntent', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ queryInput: { text: { text: TEXT, languageCode: LANG } } }),
  });
  const data = await res.json();
  const qr = data.queryResult || {};
  console.log('Intent:', qr.intent?.displayName);
  console.log('Confidence:', ((qr.intentDetectionConfidence||0)*100).toFixed(0) + '%');
  console.log('Parameters:', JSON.stringify(qr.parameters));
  console.log('Fulfillment:', qr.fulfillmentText);
})();
"
```

### 4. Full Reset & Recreate
```bash
cd /e/coding/ai_shop_assistance && node scripts/setup-dialogflow.mjs
```

### 5. Create/Update Intent via REST API
To add a new intent or update training phrases, use the Dialogflow ES v2 REST API:
- **Create**: `POST /v2/projects/{project}/agent/intents`
- **Update**: `PATCH /v2/projects/{project}/agent/intents/{intentId}`
- **Delete**: `DELETE /v2/projects/{project}/agent/intents/{intentId}`

### 6. Create/Update Entity Type
- **Create**: `POST /v2/projects/{project}/agent/entityTypes`
- **Update**: `PATCH /v2/projects/{project}/agent/entityTypes/{entityTypeId}`

## Current Intents

| Intent | Category | Description |
|--------|----------|-------------|
| billing.add | Billing | Add items to bill |
| billing.remove | Billing | Remove items from bill |
| billing.clear | Billing | Clear entire bill |
| billing.total | Billing | Get bill total |
| billing.complete | Billing | Complete transaction |
| inventory.check | Inventory | Check stock levels |
| inventory.add | Inventory | Add to stock |
| payment.upi | Payment | UPI/QR payment |
| payment.cash | Payment | Cash payment |
| report.today | Reports | Today's sales |
| report.week | Reports | Weekly report |
| navigation.billing | Navigation | Go to billing |
| navigation.inventory | Navigation | Go to inventory |
| general.greeting | General | Hello/Hi |
| general.help | General | Help request |
| general.confirm | General | Yes/OK |
| general.cancel | General | No/Cancel |
| general.addmore | General | Add more items |

## Current Entities

| Entity | Type | Entries |
|--------|------|---------|
| product | MAP | 15 Kerala shop products (Malayalam + English + aliases) |
| unit | MAP | kg, g, litre, ml, piece, dozen |
| payment-method | MAP | upi, cash, credit |
| time-period | MAP | today, yesterday, week, month |

## Guidelines
- Always use Malayalam (`ml`) as the primary language code
- Include English fallback training phrases for each intent
- Product names MUST include Malayalam name, English name, and romanized aliases
- After modifying intents/entities, Dialogflow auto-trains (no manual train needed)
- Test with `detectIntent` after changes to verify accuracy
- Keep the `scripts/setup-dialogflow.mjs` file updated as the source of truth
