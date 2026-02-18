---
name: malayalam-i18n
description: Manage Malayalam translations, voice responses, and language-specific features for the Shopkeeper AI. Use when user asks about Malayalam text, translations, voice responses, language support, or localization. Also use when user says "Malayalam", "translation", "language", "i18n", "localization", "voice response", "ml-IN".
tools: Read, Bash, Edit, Write, Grep, Glob
---

# Malayalam Internationalization

Manage Malayalam translations, voice responses, and language-specific features for Kerala shopkeepers.

## Context

- **Primary UI Language**: English (labels, navigation)
- **Voice Input**: Malayalam (`ml-IN`)
- **Voice Output**: Malayalam (Sarvam AI Bulbul v2)
- **Product Names**: Dual (English + Malayalam)
- **Voice Responses**: Malayalam

## Key Files

| File | Purpose |
|------|---------|
| `lib/constants.ts` | ML_RESPONSES - Malayalam voice response templates |
| `lib/nlp/intent.ts` | Intent types with response templates |
| `hooks/useVoice.ts` | Speech synthesis language config |
| `hooks/useProducts.ts` | Product Malayalam names + aliases |
| `scripts/setup-dialogflow.mjs` | Dialogflow training phrases (Malayalam + English) |

## Voice Response Templates

Location: `lib/constants.ts` → `ML_RESPONSES`

| Key | Malayalam | English Translation |
|-----|----------|-------------------|
| listening | ഞാൻ കേൾക്കുന്നു | I'm listening |
| processing | കാത്തിരിക്കൂ | Please wait |
| item_added | ശരി, {item} ബില്ലിൽ ചേർത്തു | OK, added {item} to bill |
| item_removed | {item} ബില്ലിൽ നിന്ന് മാറ്റി | Removed {item} from bill |
| bill_total | ആകെ തുക {amount} രൂപ | Total amount {amount} rupees |
| bill_cleared | ബിൽ ക്ലിയർ ചെയ്തു | Bill cleared |
| stock_check | {product} സ്റ്റോക്ക് {amount} {unit} ഉണ്ട് | {product} stock: {amount} {unit} |
| stock_low | {product} സ്റ്റോക്ക് കുറവാണ്! | {product} stock is low! |
| not_understood | ക്ഷമിക്കണം, മനസ്സിലായില്ല | Sorry, didn't understand |
| greeting | നമസ്കാരം! എന്ത് സഹായം വേണം? | Hello! How can I help? |
| payment_upi | QR കോഡ് കാണിക്കുന്നു | Showing QR code |
| payment_cash | കാഷ് പേമെന്റ് ശരി | Cash payment OK |
| confirm | ശരി! | OK! |
| cancel | റദ്ദാക്കി | Cancelled |

## Malayalam Number Words

Common number words shopkeepers use:

| Malayalam | Number | Romanized |
|----------|--------|-----------|
| ഒന്ന് | 1 | onnu |
| രണ്ട് | 2 | randu |
| മൂന്ന് | 3 | moonnu |
| നാല് | 4 | naalu |
| അഞ്ച് | 5 | anchu |
| ആറ് | 6 | aaru |
| ഏഴ് | 7 | ezhu |
| എട്ട് | 8 | ettu |
| ഒൻപത് | 9 | onpathu |
| പത്ത് | 10 | pathu |
| ഇരുപത് | 20 | irupathu |
| അമ്പത് | 50 | ampathu |
| നൂറ് | 100 | nooru |
| അര | 0.5 | ara (half) |
| കാൽ | 0.25 | kaal (quarter) |
| മുക്കാൽ | 0.75 | mukkaal (three-quarter) |

## Malayalam Unit Words

| Malayalam | Unit | Romanized |
|----------|------|-----------|
| കിലോ | kg | kilo |
| ഗ്രാം | g | graam |
| ലിറ്റർ | litre | littar |
| മില്ലി | ml | milli |
| എണ്ണം | piece/count | ennam |
| പായ്ക്കറ്റ് | packet | paykkattu |
| ഡസൻ | dozen | dasan |

## Adding New Malayalam Text

When adding new voice responses or UI text:

1. **Voice Response**: Add to `ML_RESPONSES` in `lib/constants.ts`
2. **Dialogflow Response**: Add to intent `messages` in `scripts/setup-dialogflow.mjs`
3. **Product Name**: Add `name_ml` + `aliases` in `hooks/useProducts.ts`
4. **Entity Synonym**: Add to Dialogflow entity via `/dialogflow-manage`

## Malayalam Typography CSS

```css
/* Add Malayalam font support */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Malayalam:wght@400;500;700&display=swap');

.text-malayalam {
  font-family: 'Noto Sans Malayalam', sans-serif;
  line-height: 1.8; /* Malayalam needs more line height */
  font-size: 1.1em; /* Slightly larger for readability */
}
```

## Common Malayalam Phrases for UI

| English | Malayalam |
|---------|----------|
| Billing | ബില്ലിംഗ് |
| Inventory | ഇൻവെന്ററി |
| Reports | റിപ്പോർട്ട് |
| Settings | സെറ്റിംഗ്സ് |
| Dashboard | ഡാഷ്ബോർഡ് |
| Save | സേവ് ചെയ്യുക |
| Cancel | റദ്ദാക്കുക |
| Delete | ഡിലീറ്റ് ചെയ്യുക |
| Search | തിരയുക |
| Add | ചേർക്കുക |
| Total | ആകെ |
| Price | വില |
| Stock | സ്റ്റോക്ക് |
| Low Stock | സ്റ്റോക്ക് കുറവ് |
| Out of Stock | സ്റ്റോക്ക് ഇല്ല |

## Web Speech API Malayalam Config

```typescript
// Recognition
recognition.lang = 'ml-IN'; // Malayalam - India
recognition.continuous = true;
recognition.interimResults = true;

// Synthesis (browser fallback)
const utterance = new SpeechSynthesisUtterance(text);
utterance.lang = 'ml-IN';
utterance.rate = 0.9; // Slightly slower for clarity
utterance.pitch = 1.0;
```

## Testing Malayalam Input

Common test phrases and expected parsing:

| Input | Product | Quantity | Unit |
|-------|---------|----------|------|
| രണ്ട് കിലോ അരി | Rice | 2 | kg |
| ഒരു സോപ്പ് | Soap | 1 | piece |
| അര കിലോ ചായപ്പൊടി | Tea Powder | 0.5 | kg |
| മൂന്ന് ലിറ്റർ പാൽ | Milk | 3 | litre |
| 5 kg sugar | Sugar | 5 | kg |
