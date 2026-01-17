/**
 * Enhanced Intent Detection System with Fuzzy Matching
 * 
 * This module provides robust intent detection with:
 * - Fuzzy string matching for speech recognition errors
 * - Multiple pattern matching strategies
 * - Malayalam and English support
 * - Entity extraction with normalization
 * - Confidence scoring
 */

import type { DialogflowIntentType, DialogflowEntity } from './dialogflow';

// Product name normalization - handles common speech recognition errors
const PRODUCT_VARIATIONS: Record<string, string[]> = {
  'Rice': [
    'അരി', 'ari', 'rice', 'റൈസ്', 'arroz', 'ary', 'ari yum', 'അരിയും',
    'ari ye', 'aari', 'aary', 'ariyum', 'നെല്ല്', 'rice um'
  ],
  'Sugar': [
    'പഞ്ചസാര', 'panjasara', 'sugar', 'ഷുഗർ', 'pancha sara', 'panchara',
    'പഞ്ചസരം', 'shughar', 'sugar um', 'panja sara', 'പഞ്ചസാരം'
  ],
  'Coconut Oil': [
    'വെളിച്ചെണ്ണ', 'velichenna', 'coconut oil', 'കോക്കനട്ട് ഓയിൽ',
    'velichennu', 'vellachenna', 'oil', 'enna', 'എണ്ണ'
  ],
  'Tea Powder': [
    'ചായപ്പൊടി', 'chayappodi', 'tea powder', 'tea', 'ടീ', 'chaya',
    'ചായ', 'chayapodi', 'tea podi', 'ചായപ്പൊടി യും'
  ],
  'Milk': [
    'പാൽ', 'paal', 'milk', 'മിൽക്ക്', 'pal', 'palu', 'പാല്',
    'milk um', 'പാലും'
  ],
  'Wheat Flour': [
    'ഗോതമ്പ്', 'gothambu', 'wheat flour', 'wheat', 'ഗോതമ്പു പൊടി',
    'atta', 'ആട്ട', 'gothampum', 'goa thambu'
  ],
  'Salt': [
    'ഉപ്പ്', 'uppu', 'salt', 'സാൾട്ട്', 'uppum', 'ഉപ്പും',
    'salt um', 'uppoo'
  ],
  'Soap': [
    'സോപ്പ്', 'soap', 'സോപ്', 'സോപ്പും', 'soppu', 'soapum'
  ],
};

// Build reverse lookup map for fast matching
const PRODUCT_NAME_MAP = new Map<string, string>();
for (const [productName, variations] of Object.entries(PRODUCT_VARIATIONS)) {
  for (const variant of variations) {
    PRODUCT_NAME_MAP.set(variant.toLowerCase(), productName);
  }
}

// Malayalam number words to digits with more variations
const NUMBER_WORDS: Record<string, number> = {
  'ഒന്ന്': 1, 'ഒരു': 1, 'ഒരെണ്ണം': 1, 'oru': 1, 'one': 1,
  'രണ്ട്': 2, 'രണ്ടെണ്ണം': 2, 'randu': 2, 'two': 2,
  'മൂന്ന്': 3, 'മൂന്നെണ്ണം': 3, 'moonnu': 3, 'three': 3,
  'നാല്': 4, 'നാലെണ്ണം': 4, 'nalu': 4, 'four': 4, 'നാലു': 4,
  'അഞ്ച്': 5, 'അഞ്ചെണ്ണം': 5, 'anchu': 5, 'five': 5, 'അഞ്ചു': 5,
  'ആറ്': 6, 'ആറെണ്ണം': 6, 'aaru': 6, 'six': 6, 'ആറു': 6,
  'ഏഴ്': 7, 'ഏഴെണ്ണം': 7, 'ezhu': 7, 'seven': 7, 'ഏഴു': 7,
  'എട്ട്': 8, 'എട്ടെണ്ണം': 8, 'ettu': 8, 'eight': 8, 'എട്ടു': 8,
  'ഒൻപത്': 9, 'ഒമ്പതെണ്ണം': 9, 'onpathu': 9, 'nine': 9, 'ഒമ്പത്': 9,
  'പത്ത്': 10, 'പത്തെണ്ണം': 10, 'pathu': 10, 'ten': 10, 'പത്തു': 10,
  'അര': 0.5, 'half': 0.5, 'ara': 0.5,
  'കാൽ': 0.25, 'quarter': 0.25, 'kaal': 0.25,
  'മുക്കാൽ': 0.75, 'mukaal': 0.75,
};

// Unit normalization with more variations
const UNIT_WORDS: Record<string, string> = {
  'കിലോ': 'kg', 'കിലോഗ്രാം': 'kg', 'kg': 'kg', 'kilo': 'kg',
  'കിലൊ': 'kg', 'കിലോ ഗ്രാം': 'kg', 'kilograms': 'kg',
  'ഗ്രാം': 'g', 'gm': 'g', 'gram': 'g', 'grams': 'g',
  'ലിറ്റർ': 'litre', 'liter': 'litre', 'litre': 'litre', 'l': 'litre',
  'ലിറ്റര്': 'litre', 'ലിത്തർ': 'litre',
  'മില്ലി': 'ml', 'ml': 'ml', 'milliliter': 'ml',
  'എണ്ണം': 'piece', 'piece': 'piece', 'pieces': 'piece',
  'പായ്ക്ക്': 'pack', 'pack': 'pack', 'packet': 'pack',
};

/**
 * Normalize text for matching - removes punctuation, extra spaces
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract number from text (supports Malayalam words and digits)
 */
function extractNumber(text: string): number | null {
  const normalized = normalizeText(text);
  const words = normalized.split(/\s+/);
  
  // Check for Malayalam/English number words first
  for (const word of words) {
    if (NUMBER_WORDS[word] !== undefined) {
      return NUMBER_WORDS[word];
    }
  }
  
  // Check for digits
  const digitMatch = text.match(/(\d+(?:\.\d+)?)/);
  if (digitMatch) {
    return parseFloat(digitMatch[1]);
  }
  
  return null;
}

/**
 * Extract unit from text
 */
function extractUnit(text: string): string {
  const normalized = normalizeText(text);
  const words = normalized.split(/\s+/);
  
  for (const word of words) {
    if (UNIT_WORDS[word]) {
      return UNIT_WORDS[word];
    }
  }
  
  // Default based on context
  return 'kg';
}

/**
 * Extract product name using fuzzy matching
 */
function extractProduct(text: string): string | null {
  const normalized = normalizeText(text);
  
  // First try exact matches
  for (const [key, productName] of PRODUCT_NAME_MAP.entries()) {
    if (normalized.includes(key)) {
      return productName;
    }
  }
  
  // Try fuzzy matching for each word
  const words = normalized.split(/\s+/);
  for (const word of words) {
    if (word.length < 2) continue;
    
    // Find best fuzzy match
    let bestMatch: string | null = null;
    let bestScore = 0;
    
    for (const [key, productName] of PRODUCT_NAME_MAP.entries()) {
      const score = fuzzyMatch(word, key);
      if (score > bestScore && score > 0.6) {
        bestScore = score;
        bestMatch = productName;
      }
    }
    
    if (bestMatch) {
      return bestMatch;
    }
  }
  
  return null;
}

/**
 * Simple fuzzy matching algorithm (Dice coefficient)
 */
function fuzzyMatch(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 < 2 || len2 < 2) {
    return str1 === str2 ? 1.0 : 0.0;
  }
  
  const bigrams1 = new Set<string>();
  const bigrams2 = new Set<string>();
  
  for (let i = 0; i < len1 - 1; i++) {
    bigrams1.add(str1.substring(i, i + 2));
  }
  
  for (let i = 0; i < len2 - 1; i++) {
    bigrams2.add(str2.substring(i, i + 2));
  }
  
  let intersection = 0;
  for (const bigram of bigrams1) {
    if (bigrams2.has(bigram)) {
      intersection++;
    }
  }
  
  return (2.0 * intersection) / (bigrams1.size + bigrams2.size);
}

/**
 * Enhanced intent patterns with multiple variations
 */
interface IntentMatcher {
  intent: DialogflowIntentType;
  patterns: RegExp[];
  keywords: string[];
  confidence: number;
}

const INTENT_MATCHERS: IntentMatcher[] = [
  {
    intent: 'billing.add',
    patterns: [
      // Number + unit + product patterns
      /(\d+(?:\.\d+)?)\s*(?:കിലോ|kg|കിലൊ|litre|ലിറ്റർ|piece|എണ്ണം|gram|ഗ്രാം)?\s+/i,
      // Product + number patterns
      /(?:അരി|പഞ്ചസാര|വെളിച്ചെണ്ണ|ചായപ്പൊടി|പാൽ|ഗോതമ്പ്|ഉപ്പ്|സോപ്പ്|rice|sugar|oil|tea|milk|wheat|salt|soap)/i,
    ],
    keywords: ['add', 'ചേർക്കുക', 'ചേർക്കൂ', 'കൂട്ടുക', 'ചേർത്തൂ', 'എടുത്തൂ', 'വേണം'],
    confidence: 0.9,
  },
  {
    intent: 'billing.complete',
    patterns: [
      /(?:ബിൽ|bill)\s*(?:ചെയ്യൂ|ചെയ്യണം|ആക്കൂ)/i,
      /(?:കഴിഞ്ഞു|മതി|ഇല്ല|done|finish|complete|അത്രതന്നെ|അത്ര)/i,
    ],
    keywords: ['bill', 'ബിൽ', 'done', 'കഴിഞ്ഞു', 'മതി', 'complete', 'finish'],
    confidence: 0.95,
  },
  {
    intent: 'billing.total',
    patterns: [
      /(?:ടോട്ടൽ|total|എത്ര|മൊത്തം|ആകെ)/i,
    ],
    keywords: ['total', 'ടോട്ടൽ', 'എത്ര', 'ആകെ'],
    confidence: 0.9,
  },
  {
    intent: 'general.confirm',
    patterns: [
      /^(?:yes|ശരി|okay|ok|ആണ്|ഓ|ഉവ്വ്|അതേ)$/i,
    ],
    keywords: ['yes', 'ശരി', 'ok', 'okay'],
    confidence: 0.95,
  },
  {
    intent: 'general.addmore',
    patterns: [
      /(?:കൂടി|more|വേറെ|ഇനിയും|വേണം|another)/i,
    ],
    keywords: ['കൂടി', 'more', 'വേറെ', 'ഇനിയും', 'വേണം'],
    confidence: 0.9,
  },
  {
    intent: 'billing.remove',
    patterns: [
      /(?:മാറ്റുക|remove|കളയുക|delete)/i,
    ],
    keywords: ['remove', 'മാറ്റുക', 'കളയുക', 'delete'],
    confidence: 0.9,
  },
  {
    intent: 'payment.upi',
    patterns: [
      /(?:qr|upi|gpay|paytm|google\s*pay|phone\s*pay|കാണിക്കുക)/i,
    ],
    keywords: ['qr', 'upi', 'gpay', 'payment'],
    confidence: 0.95,
  },
  {
    intent: 'payment.cash',
    patterns: [
      /(?:cash|കാഷ്|പണം|രൂപ)/i,
    ],
    keywords: ['cash', 'കാഷ്', 'പണം'],
    confidence: 0.95,
  },
];

/**
 * Enhanced intent detection with multi-stage matching
 */
export function detectIntentEnhanced(text: string): {
  intent: DialogflowIntentType;
  confidence: number;
  entities: DialogflowEntity;
} {
  const normalized = normalizeText(text);
  
  console.log('🔍 Enhanced Intent Detection:', text);
  console.log('🔍 Normalized:', normalized);
  
  let bestMatch: { intent: DialogflowIntentType; confidence: number } = {
    intent: 'fallback',
    confidence: 0,
  };
  
  // Stage 1: Pattern matching
  for (const matcher of INTENT_MATCHERS) {
    let matchScore = 0;
    
    // Check patterns
    for (const pattern of matcher.patterns) {
      if (pattern.test(text)) {
        matchScore += 0.5;
        console.log('🔍 Pattern matched:', matcher.intent);
        break;
      }
    }
    
    // Check keywords
    for (const keyword of matcher.keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        matchScore += 0.3;
        console.log('🔍 Keyword matched:', keyword, 'for', matcher.intent);
      }
    }
    
    // Calculate final confidence
    const confidence = Math.min(matchScore * matcher.confidence, 0.95);
    
    if (confidence > bestMatch.confidence) {
      bestMatch = { intent: matcher.intent, confidence };
    }
  }
  
  // Stage 2: Extract entities
  const entities: DialogflowEntity = {};
  
  const quantity = extractNumber(text);
  if (quantity !== null) {
    entities.quantity = quantity;
    console.log('🔍 Quantity extracted:', quantity);
  }
  
  const unit = extractUnit(text);
  if (unit) {
    entities.unit = unit;
    console.log('🔍 Unit extracted:', unit);
  }
  
  const product = extractProduct(text);
  if (product) {
    entities.product = product;
    console.log('🔍 Product extracted:', product);
    // Boost confidence if product found for billing.add
    if (bestMatch.intent === 'billing.add' || bestMatch.intent === 'fallback') {
      bestMatch.intent = 'billing.add';
      bestMatch.confidence = Math.max(bestMatch.confidence, 0.8);
    }
  }
  
  console.log('🔍 Final result:', bestMatch.intent, 'confidence:', bestMatch.confidence);
  
  return {
    intent: bestMatch.intent,
    confidence: bestMatch.confidence,
    entities,
  };
}

/**
 * Validate extracted entities for specific intents
 */
export function validateIntent(
  intent: DialogflowIntentType,
  entities: DialogflowEntity
): boolean {
  switch (intent) {
    case 'billing.add':
      // Need at least a product
      return !!entities.product;
    case 'billing.remove':
      // Need a product to remove
      return !!entities.product;
    case 'inventory.check':
      // Can check with or without product
      return true;
    default:
      return true;
  }
}
