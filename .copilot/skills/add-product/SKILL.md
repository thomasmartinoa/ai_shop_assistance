---
name: add-product
description: Add a new product to the Shopkeeper AI system across all layers - Dialogflow entity, demo products, and optionally Supabase. Use when user asks to add a new product, new item, or expand the product catalog. Also use when user says "add product", "new item", "new product", "expand catalog".
tools: Read, Bash, Edit, Write, Grep, Glob
---

# Add Product

Add a new product to the Shopkeeper AI system. This updates ALL layers to keep everything in sync:

1. **Dialogflow `product` entity** - so voice commands recognize the product
2. **Demo products** in `hooks/useProducts.ts` - for offline/demo mode
3. **Setup script** `scripts/setup-dialogflow.mjs` - source of truth for Dialogflow
4. **Supabase `products` table** - for production data (optional)

## Required Information

For each new product, collect:

| Field | Example | Required |
|-------|---------|----------|
| English name | "Cardamom" | Yes |
| Malayalam name | "ഏലക്ക" | Yes |
| Aliases | ["elakka", "cardamom", "elaichi"] | Yes |
| Price (₹) | 1800 | Yes |
| Cost price (₹) | 1500 | No |
| Unit | kg, g, litre, ml, piece | Yes |
| Category | groceries, oils, dairy, spices, personal-care, beverages | Yes |
| GST rate (%) | 0, 5, 12, 18, 28 | Yes |
| Min stock alert | 5 | Yes |
| Shelf location | "B2" | No |

## Step-by-Step Workflow

### Step 1: Update Dialogflow Product Entity

Add the new product to the `product` entity in `scripts/setup-dialogflow.mjs`:

```javascript
// In ENTITY_TYPES[0].entities array, add:
{ value: 'മലയാളം_name', synonyms: ['മലയാളം_name', 'english_name', 'alias1', 'alias2'] },
```

Then push to Dialogflow:

```bash
cd /e/coding/ai_shop_assistance && node -e "
const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');
const creds = JSON.parse(fs.readFileSync('lock/shopkeeper-ai-2f59b5ac8bf4.json', 'utf-8'));
const auth = new GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/dialogflow'] });

const NEW_PRODUCT = {
  value: 'MALAYALAM_NAME',
  synonyms: ['MALAYALAM_NAME', 'ENGLISH_NAME', 'ALIAS1', 'ALIAS2']
};

(async () => {
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();

  // Get existing product entity type
  const listRes = await fetch('https://dialogflow.googleapis.com/v2/projects/' + creds.project_id + '/agent/entityTypes', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const data = await listRes.json();
  const productEntity = data.entityTypes.find(e => e.displayName === 'product');

  if (!productEntity) { console.error('product entity not found'); return; }

  // Add new entry
  const entityId = productEntity.name.split('/').pop();
  const updateRes = await fetch('https://dialogflow.googleapis.com/v2/projects/' + creds.project_id + '/agent/entityTypes/' + entityId + '/entities:batchCreate', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ entities: [NEW_PRODUCT] })
  });
  console.log('Dialogflow:', updateRes.status === 200 ? 'SUCCESS' : 'FAILED (' + updateRes.status + ')');
})();
"
```

### Step 2: Update Demo Products

Add to the `DEMO_PRODUCTS` array in `hooks/useProducts.ts`:

```typescript
{
  id: 'demo-NEW',
  shop_id: 'demo-shop-id',
  name_en: 'English Name',
  name_ml: 'മലയാളം Name',
  category: 'category',
  price: PRICE,
  cost_price: COST,
  unit: 'unit',
  stock: STOCK,
  min_stock: MIN,
  gst_rate: GST,
  aliases: ['alias1', 'alias2'],
  shelf_location: 'SHELF',
  barcode: null,
  image_url: null,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
},
```

### Step 3: Update Setup Script

Add the product to `ENTITY_TYPES[0].entities` in `scripts/setup-dialogflow.mjs` so it persists on re-runs.

### Step 4: Verify

Test the product is recognized:

```bash
cd /e/coding/ai_shop_assistance && node -e "
const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');
const creds = JSON.parse(fs.readFileSync('lock/shopkeeper-ai-2f59b5ac8bf4.json', 'utf-8'));
const auth = new GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/dialogflow'] });
(async () => {
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  const sid = 'test-' + Date.now();
  const res = await fetch('https://dialogflow.googleapis.com/v2/projects/' + creds.project_id + '/agent/sessions/' + sid + ':detectIntent', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ queryInput: { text: { text: 'ഒരു MALAYALAM_NAME', languageCode: 'ml' } } }),
  });
  const data = await res.json();
  const qr = data.queryResult || {};
  console.log('Intent:', qr.intent?.displayName);
  console.log('Params:', JSON.stringify(qr.parameters));
})();
"
```

## Common Kerala Shop Products to Add

| English | Malayalam | Aliases | Unit | GST |
|---------|----------|---------|------|-----|
| Cardamom | ഏലക്ക | elakka, elaichi | g | 5% |
| Chilli Powder | മുളക് പൊടി | mulaku podi | kg | 5% |
| Turmeric | മഞ്ഞൾ പൊടി | manjal, haldi | kg | 5% |
| Coriander Powder | മല്ലിപ്പൊടി | mallipodi, dhaniya | kg | 5% |
| Black Pepper | കുരുമുളക് | kurumulaku, pepper | kg | 5% |
| Mustard Seeds | കടുക് | kaduku, mustard | kg | 5% |
| Jaggery | ശർക്കര | sharkkara, gur | kg | 0% |
| Tamarind | പുളി | puli, imli | kg | 5% |
| Detergent | ഡിറ്റർജന്റ് | detergent, surf | piece | 18% |
| Shampoo | ഷാമ്പൂ | shampoo | piece | 18% |
| Cooking Oil | പാചക എണ്ണ | pachaka enna, cooking oil | litre | 5% |
| Eggs | മുട്ട | mutta, egg | piece | 0% |
