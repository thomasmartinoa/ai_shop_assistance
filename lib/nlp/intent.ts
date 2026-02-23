import { INTENT_TYPES } from '@/lib/constants';

export type IntentType = typeof INTENT_TYPES[keyof typeof INTENT_TYPES];

export interface Intent {
  type: IntentType;
  confidence: number;
  entities: Record<string, string | number>;
  rawText: string;
}

// Malayalam number words to digits
const MALAYALAM_NUMBERS: Record<string, number> = {
  'ഒന്ന്': 1, 'ഒരു': 1, 'ഒരെണ്ണം': 1,
  'രണ്ട്': 2, 'രണ്ടെണ്ണം': 2,
  'മൂന്ന്': 3, 'മൂന്നെണ്ണം': 3,
  'നാല്': 4, 'നാലെണ്ണം': 4,
  'അഞ്ച്': 5, 'അഞ്ചെണ്ണം': 5,
  'ആറ്': 6, 'ആറെണ്ണം': 6,
  'ഏഴ്': 7, 'ഏഴെണ്ണം': 7,
  'എട്ട്': 8, 'എട്ടെണ്ണം': 8,
  'ഒൻപത്': 9, 'ഒമ്പതെണ്ണം': 9,
  'പത്ത്': 10, 'പത്തെണ്ണം': 10,
  'അര': 0.5, 'അരക്കിലോ': 0.5,
  'കാൽ': 0.25, 'കാൽക്കിലോ': 0.25,
  'മുക്കാൽ': 0.75,
};

// Unit mappings
const UNIT_PATTERNS: Record<string, string> = {
  'കിലോ': 'kg', 'കിലോഗ്രാം': 'kg', 'kg': 'kg',
  'ഗ്രാം': 'g', 'gm': 'g', 'gram': 'g',
  'ലിറ്റർ': 'l', 'liter': 'l', 'litre': 'l',
  'മില്ലി': 'ml', 'ml': 'ml',
  'എണ്ണം': 'piece', 'പായ്ക്ക്': 'pack', 'pack': 'pack',
};

// Intent patterns with regular expressions
interface IntentPattern {
  type: IntentType;
  patterns: RegExp[];
  priority: number;
}

const INTENT_PATTERNS: IntentPattern[] = [
  // Billing - Add items
  {
    type: INTENT_TYPES.BILLING_ADD,
    patterns: [
      // Malayalam patterns
      /(?:ഒരു|രണ്ട്|മൂന്ന്|നാല്|അഞ്ച്|ആറ്|ഏഴ്|എട്ട്|ഒൻപത്|പത്ത്|\d+(?:\.\d+)?)\s*(?:കിലോ|ഗ്രാം|ലിറ്റർ|മില്ലി|എണ്ണം|പായ്ക്ക്)?\s*(.+)/i,
      /(.+)\s*(?:ഒരു|രണ്ട്|മൂന്ന്|നാല്|അഞ്ച്|ആറ്|ഏഴ്|എട്ട്|ഒൻപത്|പത്ത്|\d+(?:\.\d+)?)\s*(?:കിലോ|ഗ്രാം|ലിറ്റർ|മില്ലി|എണ്ണം|പായ്ക്ക്)?/i,
      /ചേർക്കൂ\s+(.+)/i,
      /ബില്ലിൽ\s+(.+)\s*ചേർക്കൂ/i,
      // English patterns
      /add\s+(.+)/i,
      /(\d+(?:\.\d+)?)\s*(?:kg|g|l|ml|piece|pack)?\s*(?:of\s+)?(.+)/i,
    ],
    priority: 5,
  },
  
  // Billing - Remove items
  {
    type: INTENT_TYPES.BILLING_REMOVE,
    patterns: [
      /(.+)\s*(?:മാറ്റൂ|കളയൂ|ഒഴിവാക്കൂ)/i,
      /(?:മാറ്റൂ|കളയൂ|ഒഴിവാക്കൂ)\s+(.+)/i,
      /remove\s+(.+)/i,
      /delete\s+(.+)/i,
    ],
    priority: 4,
  },
  
  // Billing - Clear all
  {
    type: INTENT_TYPES.BILLING_CLEAR,
    patterns: [
      /(?:മുഴുവൻ|എല്ലാം)\s*(?:മാറ്റൂ|കളയൂ|ക്ലിയർ)/i,
      /ബിൽ\s*ക്ലിയർ/i,
      /clear\s*(?:all|bill)/i,
      /cancel\s*bill/i,
    ],
    priority: 3,
  },
  
  // Stock check
  {
    type: INTENT_TYPES.STOCK_CHECK,
    patterns: [
      /(.+)\s*(?:സ്റ്റോക്ക്|stock)\s*(?:എത്ര|ഉണ്ടോ|how\s*much)?/i,
      /(?:സ്റ്റോക്ക്|stock)\s*(?:എത്ര|check)?\s*(.+)?/i,
      /(.+)\s*(?:ഉണ്ടോ|ബാക്കി)/i,
      /check\s+stock\s*(?:of|for)?\s*(.+)?/i,
    ],
    priority: 3,
  },
  
  // Location find
  {
    type: INTENT_TYPES.LOCATION_FIND,
    patterns: [
      /(.+)\s*എവിടെ/i,
      /(.+)\s*(?:ഏത്|which)\s*(?:ഷെൽഫ്|shelf|rack)/i,
      /where\s*(?:is|are)?\s*(.+)/i,
      /find\s+(.+)/i,
    ],
    priority: 3,
  },
  
  // Bill total
  {
    type: INTENT_TYPES.BILL_TOTAL,
    patterns: [
      /(?:ടോട്ടൽ|total|ആകെ)\s*(?:എത്ര|തുക)?/i,
      /ബിൽ\s*(?:എത്ര|തുക)?/i,
      /(?:what'?s|show)\s*(?:the\s+)?(?:total|bill)/i,
    ],
    priority: 2,
  },
  
  // Payment UPI/QR
  {
    type: INTENT_TYPES.PAYMENT_UPI,
    patterns: [
      /(?:QR|ക്യൂആർ)\s*(?:കോഡ്|code)?\s*(?:കാണിക്കൂ|show)?/i,
      /(?:GPay|ഗൂഗിൾ\s*പേ|PhonePe|UPI)\s*(?:പേമെന്റ്|payment)?/i,
      /show\s*(?:QR|payment)/i,
      /upi\s*(?:payment|pay)?/i,
    ],
    priority: 2,
  },
  
  // Payment Cash
  {
    type: INTENT_TYPES.PAYMENT_CASH,
    patterns: [
      /(?:ക്യാഷ്|cash)\s*(?:പേമെന്റ്|payment)?/i,
      /(?:പണം|paisa)\s*(?:വാങ്ങി|received)/i,
      /cash\s*(?:received|done)/i,
    ],
    priority: 2,
  },
  
  // Confirm
  {
    type: INTENT_TYPES.CONFIRM,
    patterns: [
      /^(?:ശരി|ഉവ്വ്|ഓക്കേ|okay|ok|yes|yeah|ശെരി|ആണ്)$/i,
      /(?:ശരി|ഓക്കേ|yes)\s*(?:ആണ്|ചെയ്യൂ|do\s*it)?/i,
      /confirm/i,
    ],
    priority: 1,
  },
  
  // Cancel
  {
    type: INTENT_TYPES.CANCEL,
    patterns: [
      /^(?:വേണ്ട|ഇല്ല|no|nope|cancel|ക്യാൻസൽ)$/i,
      /(?:വേണ്ട|cancel)\s*(?:ചെയ്യൂ)?/i,
    ],
    priority: 1,
  },
  
  // Help
  {
    type: INTENT_TYPES.HELP,
    patterns: [
      /(?:സഹായം|help|എന്താണ്\s*ചെയ്യാൻ\s*കഴിയുക)/i,
      /(?:what|how)\s*(?:can|to)\s*(?:you|I)\s*(?:do|use)/i,
      /എന്തൊക്കെ\s*(?:ചെയ്യാൻ|ചോദിക്കാൻ)\s*(?:പറ്റും|കഴിയും)/i,
    ],
    priority: 1,
  },

  // Inventory - Add to stock
  {
    type: INTENT_TYPES.INVENTORY_ADD,
    patterns: [
      /(?:സ്റ്റോക്കിൽ|stock\s*(?:il|il))\s*ചേർക്കൂ/i,
      /(.+)\s*(?:സ്റ്റോക്ക്)\s*(?:ഇടൂ|ചേർക്കൂ|കൂട്ടൂ)/i,
      /(?:stock|സ്റ്റോക്ക്)\s*(?:add|ചേർക്കൂ)/i,
      /(?:stock\s*update|ഇൻവെന്ററി\s*ചേർക്കൂ)/i,
      /(\d+(?:\.\d+)?)\s*(?:കിലോ|kg|piece|litre|pack)?\s*(.+)\s*(?:stock|സ്റ്റോക്ക്)/i,
    ],
    priority: 4,
  },

  // Inventory - Update price
  {
    type: INTENT_TYPES.INVENTORY_UPDATE,
    patterns: [
      /(.+)\s*(?:വില|price)\s*(?:\d+)\s*(?:ആക്കൂ|ആക്കുക|set|update)/i,
      /(?:വില|price)\s*(?:മാറ്റൂ|update|change)/i,
      /(.+)\s*(?:price|വില)\s*(\d+)/i,
    ],
    priority: 3,
  },

  // Inventory - Low stock check
  {
    type: INTENT_TYPES.INVENTORY_CHECK,
    patterns: [
      /(?:ലോ\s*സ്റ്റോക്ക്|low\s*stock|കുറഞ്ഞ\s*സ്റ്റോക്ക്)/i,
      /(?:ഏത്|which)\s*(?:ഉൽപ്പന്നം|products?)\s*(?:കുറഞ്ഞ|low)/i,
    ],
    priority: 3,
  },

  // Reports - Today's sales
  {
    type: INTENT_TYPES.REPORTS_TODAY,
    patterns: [
      /(?:ഇന്ന്|today)\s*(?:സെയിൽ|sale|sales|വിറ്റ|വരുമാനം|income)/i,
      /(?:ഇന്നത്തെ)\s*(?:ആകെ|total|തുക|sales)/i,
      /today\s*(?:sales|total|report)/i,
    ],
    priority: 3,
  },

  // Reports - This week
  {
    type: INTENT_TYPES.REPORTS_WEEK,
    patterns: [
      /(?:ഈ\s*ആഴ്ച|this\s*week)\s*(?:സെയിൽ|sales|total)/i,
      /(?:weekly|ആഴ്ചത്തെ)\s*(?:report|sales|സെയിൽ)/i,
    ],
    priority: 3,
  },

  // Reports - Product-specific sales
  {
    type: INTENT_TYPES.REPORTS_PRODUCT,
    patterns: [
      /(.+)\s*(?:എത്ര|how\s*much)\s*(?:വിറ്റ|sold|sales)/i,
      /(?:how\s*much)\s*(.+)\s*(?:sold|sold\s*today)/i,
    ],
    priority: 3,
  },

  // Reports - Profit
  {
    type: INTENT_TYPES.REPORTS_PROFIT,
    patterns: [
      /(?:ലാഭം|profit|earnings?)\s*(?:ഇന്ന്|today|ഈ\s*ആഴ്ച|this\s*week)?/i,
      /(?:ഇന്നത്തെ|today'?s?)\s*(?:ലാഭം|profit)/i,
    ],
    priority: 3,
  },
];

/**
 * Extract quantity from text
 */
export function extractQuantity(text: string): number {
  // Check Malayalam number words
  for (const [word, num] of Object.entries(MALAYALAM_NUMBERS)) {
    if (text.includes(word)) {
      return num;
    }
  }
  
  // Check for digits
  const digitMatch = text.match(/(\d+(?:\.\d+)?)/);
  if (digitMatch) {
    return parseFloat(digitMatch[1]);
  }
  
  // Default to 1
  return 1;
}

/**
 * Extract unit from text
 */
export function extractUnit(text: string): string {
  const lowerText = text.toLowerCase();
  
  for (const [pattern, unit] of Object.entries(UNIT_PATTERNS)) {
    if (lowerText.includes(pattern.toLowerCase())) {
      return unit;
    }
  }
  
  return 'piece';
}

/**
 * Extract product name from text
 */
export function extractProductName(text: string): string {
  // Remove quantity words
  let cleaned = text;
  
  // Remove Malayalam numbers
  for (const word of Object.keys(MALAYALAM_NUMBERS)) {
    cleaned = cleaned.replace(new RegExp(word, 'gi'), '');
  }
  
  // Remove units
  for (const unit of Object.keys(UNIT_PATTERNS)) {
    cleaned = cleaned.replace(new RegExp(unit, 'gi'), '');
  }
  
  // Remove digits
  cleaned = cleaned.replace(/\d+(?:\.\d+)?/g, '');
  
  // Remove common words
  cleaned = cleaned.replace(/(?:ചേർക്കൂ|മാറ്റൂ|കളയൂ|add|remove|of|the)/gi, '');
  
  // Clean up whitespace
  return cleaned.trim().replace(/\s+/g, ' ');
}

/**
 * Classify intent from speech text
 */
export function classifyIntent(text: string): Intent {
  const normalizedText = text.trim().toLowerCase();
  
  let bestMatch: Intent = {
    type: INTENT_TYPES.UNKNOWN,
    confidence: 0,
    entities: {},
    rawText: text,
  };
  
  // Try each pattern
  for (const { type, patterns, priority } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        const confidence = 0.5 + (priority * 0.1);
        
        if (confidence > bestMatch.confidence) {
          bestMatch = {
            type,
            confidence,
            entities: {},
            rawText: text,
          };
          
          // Extract entities based on intent type
          if (type === INTENT_TYPES.BILLING_ADD || type === INTENT_TYPES.BILLING_REMOVE) {
            bestMatch.entities.quantity = extractQuantity(text);
            bestMatch.entities.unit = extractUnit(text);
            bestMatch.entities.productName = extractProductName(text);
          }
          
          if (type === INTENT_TYPES.STOCK_CHECK || type === INTENT_TYPES.LOCATION_FIND) {
            bestMatch.entities.productName = extractProductName(match[1] || text);
          }
        }
      }
    }
  }
  
  return bestMatch;
}
