---
name: billing-flow
description: Debug and test the billing workflow for the Shopkeeper AI. Use when user asks about billing issues, cart problems, payment flow, QR code, GST calculation, or the voice-to-bill pipeline. Also use when user says "billing", "cart", "payment", "QR", "GST", "receipt", "transaction".
tools: Read, Bash, Edit, Write, Grep, Glob
---

# Billing Flow Management

Debug and manage the complete billing pipeline: Voice Command → NLP → Product Match → Cart → GST → Payment → Receipt.

## Architecture

```
Voice Input (Malayalam)
    ↓
Web Speech API (ml-IN)
    ↓
Transcript Text
    ↓
Smart NLP (Dialogflow + Local)
    ↓
Intent + Entities (product, quantity, unit)
    ↓
Product Lookup (fuzzy match)
    ↓
Cart State (React useReducer)
    ↓
GST Calculation
    ↓
Payment (UPI QR / Cash)
    ↓
Transaction Record (Supabase)
```

## Key Files

| File | Purpose |
|------|---------|
| `app/(app)/billing/page.tsx` | Main billing page UI |
| `lib/nlp/useSmartNLP.ts` | NLP intent detection |
| `hooks/useProducts.ts` | Product database + fuzzy search |
| `hooks/useVoice.ts` | Voice recognition + TTS |
| `components/billing/UpiQrCode.tsx` | UPI QR code component |
| `components/billing/BillDisplay.tsx` | Bill display component |
| `components/billing/CartItem.tsx` | Individual cart item |
| `lib/billing/cart.ts` | Cart state management |
| `lib/billing/gst.ts` | GST calculations |
| `lib/billing/qr.ts` | UPI QR generation |

## Billing Flow Steps

### 1. Voice to Intent
User says: "രണ്ട് കിലോ അരി" (2 kg rice)
- Web Speech API captures → "രണ്ട് കിലോ അരി"
- Smart NLP detects → intent: `billing.add`, entities: { product: "അരി", number: 2, unit: "kg" }

### 2. Product Lookup
- Extract product name from entities
- Fuzzy match against products database (name_en, name_ml, aliases)
- Return matched product with price, unit, GST rate

### 3. Cart Management
- Add item: { product_id, name, quantity, unit, price, gst_rate }
- Remove item by product name
- Clear cart
- Calculate subtotal, GST, total

### 4. GST Calculation
```
Item total = quantity × price
GST amount = item total × (gst_rate / 100)
Subtotal = sum of all item totals
Total GST = sum of all GST amounts
Grand Total = Subtotal + Total GST - Discount
```

GST rates for common products:
| Product | GST Rate |
|---------|----------|
| Rice, Milk, Salt, Wheat Flour | 0% |
| Sugar, Coconut Oil, Tea Powder | 5% |
| Soap | 18% |

### 5. Payment
- **UPI**: Generate QR code with UPI URL format: `upi://pay?pa={upi_id}&pn={shop_name}&am={amount}&cu=INR`
- **Cash**: Mark as cash payment
- **Credit**: Record as unpaid (customer phone required)

### 6. Transaction Record
Save to `transactions` table:
```json
{
  "shop_id": "uuid",
  "items": [{ "product_id": "...", "name": "Rice", "qty": 2, "price": 55, "gst": 0 }],
  "subtotal": 110,
  "gst_amount": 0,
  "total": 110,
  "payment_method": "cash",
  "payment_status": "completed"
}
```

## Debugging Checklist

1. **Voice not captured?** → Check browser mic permissions, ensure HTTPS
2. **Wrong intent?** → Run `/voice-test`, add training phrases via `/dialogflow-manage`
3. **Product not found?** → Check aliases in `useProducts.ts`, add to Dialogflow `product` entity
4. **Wrong quantity?** → Check entity extraction in NLP response
5. **GST wrong?** → Check `gst_rate` on the product record
6. **QR not showing?** → Check UPI ID in shop settings
7. **Transaction not saving?** → Check Supabase connection, RLS policies

## Voice Responses (Malayalam)

| Action | Response |
|--------|----------|
| Item added | "ശരി, {quantity} {unit} {product} ബില്ലിൽ ചേർത്തു" |
| Item removed | "{product} ബില്ലിൽ നിന്ന് മാറ്റി" |
| Bill total | "ആകെ തുക {total} രൂപ" |
| Bill cleared | "ബിൽ ക്ലിയർ ചെയ്തു" |
| Payment UPI | "QR കോഡ് കാണിക്കുന്നു, {total} രൂപ" |
| Payment cash | "കാഷ് പേമെന്റ്, {total} രൂപ" |
