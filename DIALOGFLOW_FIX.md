# Dialogflow Accuracy Fix Guide

## Problem Analysis

Your Dialogflow is connected successfully (you see `[dialogflow]` indicator), but accuracy is low because:

### 1. **Missing Training Phrases in Dialogflow Console**
- You've created the API credentials and connection
- But you haven't created the intents and training phrases yet
- Dialogflow needs training data to recognize Malayalam voice commands

### 2. **Entity Configuration Issues**
- Custom entities (@product, @unit) need to be created
- Product synonyms need Malayalam variations
- Parameter names in Dialogflow must match code expectations

### 3. **No Debug Visibility**
- Can't see what Dialogflow is returning
- Can't diagnose intent detection failures

## Solution: Complete Dialogflow Setup

### STEP 1: Verify Current Status

First, let's test what Dialogflow is currently returning. Open your browser console (F12) when using the app, and look for:

```
[Dialogflow Response] { queryText: ..., intent: ..., confidence: ..., parameters: ... }
[Dialogflow Parsed] { intent: ..., confidence: ..., entities: ... }
```

This will show you what Dialogflow thinks you said and what intent it detected.

### STEP 2: Create Intents in Dialogflow Console

Go to [Dialogflow Console](https://dialogflow.cloud.google.com/)

#### Intent 1: billing.add
**Purpose:** Add items to bill

**Training Phrases:**
```
രണ്ട് കിലോ അരി
ഒരു കിലോ പഞ്ചസാര
3 litre വെളിച്ചെണ്ണ
അരി രണ്ട് കിലോ ചേർക്കുക
ചായപ്പൊടി 1 kg
പഞ്ചസാര 5 കിലോ
വെളിച്ചെണ്ണ 2 ലിറ്റർ
ഒരു സോപ്പ് ചേർക്കുക
പാൽ ഒരു ലിറ്റർ add
rice 2 kg
sugar 1 kilo
```

**Parameters:**
1. **product** (Required: No, Entity: @product, Value: $product)
2. **quantity** (Required: No, Entity: @sys.number, Value: $quantity)
3. **unit** (Required: No, Entity: @unit, Value: $unit)

**Responses:**
```
$quantity $unit $product ബില്ലിൽ ചേർത്തു
```

#### Intent 2: billing.remove
**Training Phrases:**
```
അരി മാറ്റുക
പഞ്ചസാര remove
ഒഴിവാക്കുക വെളിച്ചെണ്ണ
അരി delete
remove rice
```

**Parameters:**
1. **product** (Required: Yes, Entity: @product, Value: $product, Prompt: "ഏത് ഉൽപ്പന്നം മാറ്റണം?")

**Responses:**
```
$product ബില്ലിൽ നിന്ന് മാറ്റി
```

#### Intent 3: billing.clear
**Training Phrases:**
```
ബിൽ ക്ലിയർ
clear bill
പുതിയ ബിൽ
എല്ലാം മാറ്റുക
reset bill
clear all
```

**Responses:**
```
ബിൽ ക്ലിയർ ചെയ്തു
```

#### Intent 4: billing.total
**Training Phrases:**
```
ടോട്ടൽ എത്ര
total
മൊത്തം
ആകെ എത്ര
bill total
how much
```

**Responses:**
```
മൊത്തം കാണിക്കുന്നു
```

#### Intent 5: inventory.check
**Training Phrases:**
```
അരി എത്ര ഉണ്ട്
rice stock
സ്റ്റോക്ക് check
പഞ്ചസാര stock എത്ര
വെളിച്ചെണ്ണ എത്ര ബാക്കി
check sugar stock
how much rice in stock
```

**Parameters:**
1. **product** (Required: No, Entity: @product, Value: $product)

**Responses:**
```
സ്റ്റോക്ക് നോക്കുന്നു
```

#### Intent 6: inventory.add
**Training Phrases:**
```
50 കിലോ അരി സ്റ്റോക്കിൽ ചേർക്കുക
stock add 100 kg sugar
വെളിച്ചെണ്ണ 20 ലിറ്റർ add stock
rice 50 kg stock
add 100 kg sugar to stock
```

**Parameters:**
1. **product** (Required: Yes, Entity: @product, Value: $product)
2. **quantity** (Required: Yes, Entity: @sys.number, Value: $quantity)
3. **unit** (Required: No, Entity: @unit, Value: $unit)

**Responses:**
```
$quantity $unit $product സ്റ്റോക്കിൽ ചേർത്തു
```

#### Intent 7: payment.upi
**Training Phrases:**
```
QR കാണിക്കുക
show QR
UPI payment
GPay
PhonePe
QR code
```

**Responses:**
```
QR കോഡ് കാണിക്കുന്നു
```

#### Intent 8: general.greeting
**Training Phrases:**
```
നമസ്കാരം
hello
hi
hai
vanakkam
ഹലോ
```

**Responses:**
```
നമസ്കാരം! എന്ത് സഹായം വേണം?
```

#### Intent 9: general.help
**Training Phrases:**
```
സഹായം
help
എന്താ ചെയ്യുക
what can you do
commands
```

**Responses:**
```
നിങ്ങൾക്ക് ബില്ലിൽ ഉൽപ്പന്നങ്ങൾ ചേർക്കാം, സ്റ്റോക്ക് നോക്കാം, റിപ്പോർട്ട് കാണാം
```

### STEP 3: Create Custom Entities

#### Entity: @product
**Entity type:** Custom
**Auto expansion:** OFF

| Value | Synonyms (comma separated) |
|-------|----------|
| Rice | അരി, ari, chawal, rice, റൈസ് |
| Sugar | പഞ്ചസാര, panchara, cheeni, sugar, ഷുഗർ |
| Coconut Oil | വെളിച്ചെണ്ണ, velichenna, coconut oil, എണ്ണ |
| Tea Powder | ചായപ്പൊടി, chaya, tea powder, tea, ടീ |
| Milk | പാൽ, paal, milk, പാല് |
| Wheat Flour | ഗോതമ്പ്, gothambu, wheat flour, wheat, ആട്ട |
| Salt | ഉപ്പ്, uppu, salt, സാൾട്ട് |
| Soap | സോപ്പ്, soap, സോപ്പ് |

**Important:** Match these EXACTLY with your product names in the database.

#### Entity: @unit
**Entity type:** Custom
**Auto expansion:** OFF

| Value | Synonyms |
|-------|----------|
| kg | കിലോ, kilo, kilogram, കിലോഗ്രാം |
| litre | ലിറ്റർ, liter, L, ലിറ്റര് |
| piece | എണ്ണം, pieces, nos, number, pcs |

### STEP 4: Test in Dialogflow Console

Before testing in the app:

1. Go to Dialogflow Console → Select your agent
2. Use the "Try it now" box on the right
3. Type: "രണ്ട് കിലോ അരി"
4. Check:
   - Intent detected: `billing.add`
   - Parameters extracted: `product: Rice`, `quantity: 2`, `unit: kg`

If this doesn't work, add more training phrases with variations.

### STEP 5: Test in Your App

1. Restart dev server: `npm run dev`
2. Open browser console (F12)
3. Go to billing page
4. Tap microphone and say: "രണ്ട് കിലോ അരി"
5. Check console logs:
   ```
   [Dialogflow Response] { queryText: "രണ്ട് കിലോ അരി", intent: "billing.add", confidence: 0.98, parameters: { product: "Rice", quantity: 2, unit: "kg" } }
   ```

### STEP 6: Improve Confidence with More Training Phrases

If confidence is low (< 0.7), add more training phrases for each intent:

**For billing.add:**
```
Add more variations:
- മൂന്ന് കിലോ ഉപ്പ്
- സോപ്പ് രണ്ട് എണ്ണം
- പാൽ ഒരു ലിറ്റർ കൂടി
- അരി 5 kg add
- 10 kg sugar please
- I need 2 litres of oil
```

**For inventory.check:**
```
- അരിയുടെ സ്റ്റോക്ക്
- എത്ര പഞ്ചസാര ബാക്കിയുണ്ട്
- show rice stock
- sugar balance
- stock level of rice
```

## Expected Results

### Good Accuracy (> 90%)
- Intent detection confidence should be > 0.8
- Entities extracted correctly
- Works for Malayalam, English, and Manglish (mixed)

### After Fix:
```
User says: "രണ്ട് കിലോ അരി"
↓
Web Speech API transcribes: "രണ്ട് കിലോ അരി"
↓
Dialogflow detects:
  - Intent: billing.add (confidence: 0.95)
  - Entities: { product: "Rice", quantity: 2, unit: "kg" }
↓
App finds product "Rice" in database
↓
Adds to cart with price ₹45/kg → Total ₹90
```

## Troubleshooting

### "Default Fallback Intent" detected every time
**Problem:** Your intent has no training phrases or too few
**Fix:** Add at least 10 training phrases per intent with variations

### Wrong product extracted (e.g., "ari" → not found)
**Problem:** Entity synonyms don't match or are incomplete
**Fix:** 
1. Check @product entity has Malayalam synonyms
2. Add transliterated versions (ari, panchara, etc.)
3. Ensure entity values match your product database names EXACTLY

### Quantity not extracted
**Problem:** Quantity parameter not configured or Malayalam numbers not recognized
**Fix:**
1. Make sure parameter uses @sys.number entity (not @number or custom)
2. Test with both Malayalam (രണ്ട്) and English (2) numbers
3. Add training phrases with both formats

### Unit not extracted
**Problem:** @unit entity missing or synonyms incomplete
**Fix:** Add all Malayalam variations: കിലോ, ലിറ്റർ, എണ്ണം

### Confidence < 0.5
**Problem:** Not enough training data
**Fix:** Add 20+ training phrases per intent with:
- Different word orders: "അരി രണ്ട് കിലോ" vs "രണ്ട് കിലോ അരി"
- Mixed languages: "rice 2 kilo", "2 kg അരി"
- Natural variations: "ചേർക്കുക", "add", "കൂടി വേണം"

## Quick Test Commands

Use these to test each intent:

| Malayalam | English | Expected Intent |
|-----------|---------|----------------|
| രണ്ട് കിലോ അരി | two kg rice | billing.add |
| അരി മാറ്റുക | remove rice | billing.remove |
| ബിൽ ക്ലിയർ | clear bill | billing.clear |
| ടോട്ടൽ എത്ര | what's the total | billing.total |
| അരി എത്ര ഉണ്ട് | how much rice in stock | inventory.check |
| QR കാണിക്കുക | show QR | payment.upi |
| നമസ്കാരം | hello | general.greeting |

## Performance Benchmarks

After proper setup:

| Metric | Target | Method |
|--------|--------|--------|
| Intent accuracy | > 90% | Add 15+ training phrases per intent |
| Entity extraction | > 85% | Complete synonyms in custom entities |
| Confidence score | > 0.8 | Diverse training phrases |
| Response time | < 500ms | Already optimized (server-side) |

## Next Steps

1. **Complete all intents** - Create billing.add, billing.remove, etc. in Dialogflow Console
2. **Create entities** - @product with all your products, @unit with Malayalam units
3. **Add training phrases** - 15+ per intent with Malayalam/English/Manglish variations
4. **Test each intent** - Use Dialogflow console's "Try it now" before testing in app
5. **Check console logs** - Browser console shows what Dialogflow returns
6. **Iterate** - Add more training phrases for intents with low confidence

## Cost Monitoring

With free tier (1000 queries/day):
- ~30 queries/hour for 8-hour shop = 240 queries/day
- You have plenty of headroom
- Monitor in Google Cloud Console → Dialogflow API → Quotas

## Support

If accuracy is still low after following this guide:
1. Share browser console logs showing `[Dialogflow Response]`
2. Share screenshot of your intent configuration in Dialogflow Console
3. Share example phrases that are failing with their confidence scores
