# Dialogflow Setup Guide for Malayalam Voice Commerce

This guide walks you through setting up Google Cloud Dialogflow for your shopkeeper assistant.

## Why Dialogflow?

- **High accuracy** for Malayalam language
- **Free tier**: 1,000 text queries/day (plenty for small shops)
- **Entity extraction**: Automatically extracts product names, quantities, units
- **Context awareness**: Maintains conversation context

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project"
3. Name it something like `shopkeeper-ai`
4. Note your **Project ID** (e.g., `shopkeeper-ai-123456`)

## Step 2: Enable Dialogflow API

1. In your project, go to **APIs & Services** → **Enable APIs**
2. Search for "Dialogflow API"
3. Click **Enable**

## Step 3: Create Service Account

1. Go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Name: `dialogflow-client`
4. Role: **Dialogflow API Client**
5. Click **Create Key** → **JSON**
6. Download the JSON file (keep it safe!)

## Step 4: Create Dialogflow Agent

1. Go to [Dialogflow Console](https://dialogflow.cloud.google.com/)
2. Create a new agent
3. **Agent Name**: `ShopkeeperAI`
4. **Default Language**: Malayalam (ml)
5. **Google Project**: Select your project
6. Click **Create**

## Step 5: Create Intents

Create the following intents in your Dialogflow agent:

### billing.add
**Training Phrases (Malayalam):**
```
രണ്ട് കിലോ അരി
ഒരു കിലോ പഞ്ചസാര
3 litre വെളിച്ചെണ്ണ
അരി രണ്ട് കിലോ ചേർക്കുക
ചായപ്പൊടി 1 kg
```

**Parameters:**
| Parameter | Entity | Value |
|-----------|--------|-------|
| product | @product | $product |
| quantity | @sys.number | $quantity |
| unit | @unit | $unit |

### billing.remove
**Training Phrases:**
```
അരി മാറ്റുക
പഞ്ചസാര remove
ഒഴിവാക്കുക വെളിച്ചെണ്ണ
```

### billing.clear
**Training Phrases:**
```
ബിൽ ക്ലിയർ
clear bill
പുതിയ ബിൽ
എല്ലാം മാറ്റുക
```

### billing.total
**Training Phrases:**
```
ടോട്ടൽ എത്ര
total
മൊത്തം
ആകെ എത്ര
```

### inventory.add
**Training Phrases:**
```
50 കിലോ അരി സ്റ്റോക്കിൽ ചേർക്കുക
stock add 100 kg sugar
വെളിച്ചെണ്ണ 20 ലിറ്റർ add stock
```

### inventory.check
**Training Phrases:**
```
അരി എത്ര ഉണ്ട്
rice stock
സ്റ്റോക്ക് check
പഞ്ചസാര stock എത്ര
```

### payment.upi
**Training Phrases:**
```
QR കാണിക്കുക
show QR
UPI payment
GPay
```

### general.greeting
**Training Phrases:**
```
നമസ്കാരം
hello
hi
hai
```

### general.help
**Training Phrases:**
```
സഹായം
help
എന്താ ചെയ്യുക
```

## Step 6: Create Entities

### @product (Custom Entity)
Add your products:
| Value | Synonyms |
|-------|----------|
| Rice | അരി, ari, chawal |
| Sugar | പഞ്ചസാര, panchara, cheeni |
| Coconut Oil | വെളിച്ചെണ്ണ, velichenna |
| Tea Powder | ചായപ്പൊടി, chaya, tea |
| Milk | പാൽ, paal |
| Wheat Flour | ഗോതമ്പ്, gothambu, wheat |
| Salt | ഉപ്പ്, uppu |
| Soap | സോപ്പ്, soap |

### @unit (Custom Entity)
| Value | Synonyms |
|-------|----------|
| kg | കിലോ, kilo, kilogram |
| litre | ലിറ്റർ, liter, L |
| piece | എണ്ണം, pieces, nos |

## Step 7: Configure Environment Variables

Add these to your `.env.local` file:

```env
# Dialogflow Configuration
DIALOGFLOW_PROJECT_ID=your-project-id
DIALOGFLOW_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
DIALOGFLOW_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Public (for client-side check only)
NEXT_PUBLIC_DIALOGFLOW_PROJECT_ID=your-project-id
```

**Important:** Copy the private key from your downloaded JSON file. Keep the `\n` characters for newlines.

## Step 8: Test

1. Restart your dev server: `npm run dev`
2. Go to the billing page
3. Tap the microphone
4. Say: "രണ്ട് കിലോ അരി" (two kilos of rice)
5. Check the debug info shows `[dialogflow]`

## Troubleshooting

### "Dialogflow credentials not configured"
- Check your `.env.local` file has all three variables
- Restart the dev server after adding env variables

### "Dialogflow API error"
- Make sure Dialogflow API is enabled in Google Cloud
- Check service account has "Dialogflow API Client" role
- Verify project ID matches

### Intent not detected correctly
- Add more training phrases in Dialogflow console
- Include variations with different word orders
- Test in Dialogflow console first

## Local Fallback

Even without Dialogflow configured, the app uses local pattern matching as fallback. The local NLP:
- Works offline
- Supports basic Malayalam commands
- Detects products from your inventory
- 70% accuracy (vs 95%+ with Dialogflow)

## Cost Estimation

**Free Tier (ES Edition):**
- 1,000 text queries/day
- ~30 queries/hour for 8-hour shop
- Plenty for typical small shop usage

**If you exceed free tier:**
- $0.002 per text request
- 10,000 queries = $20/month

## Security Notes

1. Never commit `.env.local` to git
2. Keep service account JSON file secure
3. API route protects credentials server-side
4. Consider IP restrictions in Google Cloud for production
