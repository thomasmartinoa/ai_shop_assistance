'use client';

import { useState, useCallback, useRef } from 'react';
import { detectIntent, isDialogflowConfigured, type DialogflowResponse, type DialogflowIntentType, type DialogflowEntity } from './dialogflow';

/**
 * Smart NLP Hook
 * 
 * Combines Dialogflow (when available) with local pattern matching fallback.
 * Provides accurate Malayalam intent detection for voice commands.
 */

export interface NLPResult {
  intent: DialogflowIntentType;
  confidence: number;
  entities: DialogflowEntity;
  source: 'dialogflow' | 'local';
  rawQuery: string;
  fulfillmentText?: string;
}

// Malayalam keywords for local pattern matching
const MALAYALAM_PATTERNS = {
  // Billing patterns
  'billing.add': [
    /(\d+)\s*(കിലോ|kg|കിലൊ|litre|ലിറ്റർ|piece|എണ്ണം)?\s*(അരി|പഞ്ചസാര|വെളിച്ചെണ്ണ|ചായപ്പൊടി|പാൽ|ഗോതമ്പ്|ഉപ്പ്|സോപ്പ്)/i,
    /(അരി|പഞ്ചസാര|വെളിച്ചെണ്ണ|ചായപ്പൊടി|പാൽ|ഗോതമ്പ്|ഉപ്പ്|സോപ്പ്)\s*(\d+)\s*(കിലോ|kg|ലിറ്റർ|എണ്ണം)?/i,
    /add|ചേർക്കുക|ചേർക്കൂ|കൂട്ടുക/i,
  ],
  'billing.remove': [
    /മാറ്റുക|remove|ഒഴിവാക്കുക|കളയുക|delete/i,
    /(അരി|പഞ്ചസാര|വെളിച്ചെണ്ണ|ചായപ്പൊടി|പാൽ|ഗോതമ്പ്|ഉപ്പ്|സോപ്പ്)\s*മാറ്റുക/i,
  ],
  'billing.clear': [
    /ക്ലിയർ|clear|bill clear|ബിൽ ക്ലിയർ|എല്ലാം മാറ്റുക|പുതിയ ബിൽ/i,
  ],
  'billing.total': [
    /ടോട്ടൽ|total|എത്ര|മൊത്തം|ആകെ|കൂട്ടുക/i,
  ],
  'billing.complete': [
    /complete|done|finish|കഴിഞ്ഞു|പൂർത്തിയായി|ബിൽ കഴിഞ്ഞു|bill it|bill ചെയ്യൂ|അത്രതന്നെ|മതി|ഇല്ല|no more|that's all|അത്ര മതി/i,
  ],
  
  // Inventory patterns
  'inventory.add': [
    /സ്റ്റോക്ക്.*ചേർക്കുക|add.*stock|stock.*add|ഇൻവെൻ്ററി.*ചേർക്കുക/i,
    /(\d+)\s*(കിലോ|kg|ലിറ്റർ|എണ്ണം)?\s*(അരി|പഞ്ചസാര|വെളിച്ചെണ്ണ|ചായപ്പൊടി|പാൽ|ഗോതമ്പ്|ഉപ്പ്|സോപ്പ്)\s*സ്റ്റോക്കിൽ/i,
  ],
  'inventory.check': [
    /സ്റ്റോക്ക്.*എത്ര|stock.*check|എത്ര.*ഉണ്ട്|സ്റ്റോക്ക്.*ഉണ്ട്/i,
    /(അരി|പഞ്ചസാര|വെളിച്ചെണ്ണ|ചായപ്പൊടി|പാൽ|ഗോതമ്പ്|ഉപ്പ്|സോപ്പ്)\s*എത്ര/i,
  ],
  'inventory.update': [
    /സ്റ്റോക്ക്.*അപ്ഡേറ്റ്|update.*stock|stock.*update/i,
  ],
  
  // Payment patterns
  'payment.upi': [
    /qr|QR|ക്യു ആർ|upi|gpay|phonepay|paytm|QR കാണിക്കുക|പേയ്‌മെൻ്റ്/i,
  ],
  'payment.cash': [
    /cash|കാഷ്|നോട്ട്|പൈസ|രൂപ/i,
  ],
  
  // Report patterns
  'report.today': [
    /ഇന്നത്തെ.*സെയിൽസ്|today.*sales|daily.*report|ഇന്ന്.*റിപ്പോർട്ട്/i,
  ],
  'report.week': [
    /ആഴ്ച.*റിപ്പോർട്ട്|weekly|week.*sales|this week/i,
  ],
  
  // Navigation patterns
  'navigation.billing': [
    /billing|ബിൽ|bill page|ബില്ലിംഗ്/i,
  ],
  'navigation.inventory': [
    /inventory|ഇൻവെൻ്ററി|stock page|സ്റ്റോക്ക് പേജ്/i,
  ],
  
  // General patterns
  'general.help': [
    /help|സഹായം|എന്താ ചെയ്യുക|എങ്ങനെ/i,
  ],
  'general.greeting': [
    /hello|hi|ഹലോ|നമസ്കാരം|hai/i,
  ],
  'general.cancel': [
    /cancel|റദ്ദാക്കുക|വേണ്ട|നിർത്തുക|stop|no/i,
  ],
  'general.confirm': [
    /yes|ശരി|okay|ശരിയാണ്|confirm|ശെരി|oo|ഓ|ആണ്|ഉവ്വ്|ഓക്കെ|ok|bill ചെയ്യൂ|proceed/i,
  ],
  'general.addmore': [
    /കൂടി|more|വേറെ|add more|ഇനിയും|വേണം|another|കൂടെ|മറ്റൊന്ന്|ഉണ്ട്/i,
  ],
};

// Product name mappings for entity extraction
const PRODUCT_MAPPINGS: Record<string, string> = {
  // Malayalam
  'അരി': 'Rice',
  'പഞ്ചസാര': 'Sugar',
  'വെളിച്ചെണ്ണ': 'Coconut Oil',
  'ചായപ്പൊടി': 'Tea Powder',
  'പാൽ': 'Milk',
  'ഗോതമ്പ്': 'Wheat Flour',
  'ഉപ്പ്': 'Salt',
  'സോപ്പ്': 'Soap',
  // Transliterated
  'ari': 'Rice',
  'rice': 'Rice',
  'panchara': 'Sugar',
  'sugar': 'Sugar',
  'velichenna': 'Coconut Oil',
  'coconut oil': 'Coconut Oil',
  'tea': 'Tea Powder',
  'chaya': 'Tea Powder',
  'paal': 'Milk',
  'milk': 'Milk',
  'gothambu': 'Wheat Flour',
  'wheat': 'Wheat Flour',
  'uppu': 'Salt',
  'salt': 'Salt',
  'soap': 'Soap',
};

// Unit mappings
const UNIT_MAPPINGS: Record<string, string> = {
  'കിലോ': 'kg',
  'കിലൊ': 'kg',
  'kg': 'kg',
  'kilo': 'kg',
  'ലിറ്റർ': 'litre',
  'litre': 'litre',
  'liter': 'litre',
  'എണ്ണം': 'piece',
  'piece': 'piece',
  'pieces': 'piece',
};

/**
 * Extract entities from text using local patterns
 */
function extractLocalEntities(text: string): DialogflowEntity {
  const entities: DialogflowEntity = {};
  
  // Extract quantity
  const quantityMatch = text.match(/(\d+(?:\.\d+)?)/);
  if (quantityMatch) {
    entities.quantity = parseFloat(quantityMatch[1]);
  }
  
  // Extract product
  for (const [keyword, productName] of Object.entries(PRODUCT_MAPPINGS)) {
    if (text.toLowerCase().includes(keyword.toLowerCase())) {
      entities.product = productName;
      break;
    }
  }
  
  // Extract unit
  for (const [keyword, unit] of Object.entries(UNIT_MAPPINGS)) {
    if (text.toLowerCase().includes(keyword.toLowerCase())) {
      entities.unit = unit;
      break;
    }
  }
  
  // Default unit based on quantity presence
  if (entities.quantity && !entities.unit) {
    entities.unit = 'kg'; // Default to kg
  }
  
  return entities;
}

/**
 * Detect intent using local pattern matching
 */
function detectLocalIntent(text: string): NLPResult {
  const lowerText = text.toLowerCase();
  let bestMatch: { intent: DialogflowIntentType; confidence: number } = {
    intent: 'fallback',
    confidence: 0,
  };
  
  // Check each pattern
  for (const [intent, patterns] of Object.entries(MALAYALAM_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        // Calculate confidence based on match quality
        const confidence = 0.7; // Base confidence for local matching
        if (confidence > bestMatch.confidence) {
          bestMatch = {
            intent: intent as DialogflowIntentType,
            confidence,
          };
        }
        break;
      }
    }
  }
  
  // Extract entities
  const entities = extractLocalEntities(text);
  
  // Boost confidence if entities were found
  if (entities.product || entities.quantity) {
    bestMatch.confidence = Math.min(bestMatch.confidence + 0.1, 0.9);
  }
  
  return {
    intent: bestMatch.intent,
    confidence: bestMatch.confidence,
    entities,
    source: 'local',
    rawQuery: text,
    fulfillmentText: generateLocalResponse(bestMatch.intent, entities),
  };
}

/**
 * Generate response text for local detection
 */
function generateLocalResponse(intent: DialogflowIntentType, entities: DialogflowEntity): string {
  switch (intent) {
    case 'billing.add':
      if (entities.product && entities.quantity) {
        return `${entities.quantity} ${entities.unit || 'kg'} ${entities.product} ബില്ലിൽ ചേർത്തു`;
      }
      return 'ഉൽപ്പന്നം ബില്ലിൽ ചേർത്തു';
    case 'billing.remove':
      return 'ഉൽപ്പന്നം ബില്ലിൽ നിന്ന് മാറ്റി';
    case 'billing.clear':
      return 'ബിൽ ക്ലിയർ ചെയ്തു';
    case 'billing.total':
      return 'ബില്ലിൻ്റെ ടോട്ടൽ കാണിക്കുന്നു';
    case 'inventory.check':
      return entities.product ? `${entities.product} സ്റ്റോക്ക് നോക്കുന്നു` : 'സ്റ്റോക്ക് നോക്കുന്നു';
    case 'inventory.add':
      return 'സ്റ്റോക്കിൽ ചേർക്കുന്നു';
    case 'payment.upi':
      return 'QR കോഡ് കാണിക്കുന്നു';
    case 'general.greeting':
      return 'നമസ്കാരം! എന്ത് സഹായം വേണം?';
    case 'general.help':
      return 'നിങ്ങൾക്ക് ബില്ലിൽ ഉൽപ്പന്നങ്ങൾ ചേർക്കാം, സ്റ്റോക്ക് നോക്കാം, റിപ്പോർട്ട് കാണാം';
    default:
      return 'മനസ്സിലായില്ല. വീണ്ടും പറയൂ.';
  }
}

/**
 * Smart NLP Hook - combines Dialogflow + local fallback
 */
export function useSmartNLP() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<NLPResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dialogflowAvailable = useRef<boolean | null>(null);

  /**
   * Process text and detect intent
   */
  const processText = useCallback(async (text: string): Promise<NLPResult> => {
    if (!text.trim()) {
      return {
        intent: 'fallback',
        confidence: 0,
        entities: {},
        source: 'local',
        rawQuery: text,
      };
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Try Dialogflow first if configured
      if (isDialogflowConfigured() && dialogflowAvailable.current !== false) {
        const dialogflowResult = await detectIntent(text);
        
        if (dialogflowResult) {
          dialogflowAvailable.current = true;
          const result: NLPResult = {
            intent: dialogflowResult.intent,
            confidence: dialogflowResult.confidence,
            entities: dialogflowResult.entities,
            source: 'dialogflow',
            rawQuery: text,
            fulfillmentText: dialogflowResult.fulfillmentText,
          };
          setLastResult(result);
          setIsProcessing(false);
          return result;
        } else {
          // Dialogflow failed, mark as unavailable for this session
          dialogflowAvailable.current = false;
        }
      }

      // Fall back to local pattern matching
      const localResult = detectLocalIntent(text);
      setLastResult(localResult);
      setIsProcessing(false);
      return localResult;

    } catch (err) {
      console.error('NLP processing error:', err);
      setError(err instanceof Error ? err.message : 'NLP processing failed');
      
      // Fall back to local on error
      const localResult = detectLocalIntent(text);
      setLastResult(localResult);
      setIsProcessing(false);
      return localResult;
    }
  }, []);

  /**
   * Quick local-only detection (no API call)
   */
  const processTextLocal = useCallback((text: string): NLPResult => {
    const result = detectLocalIntent(text);
    setLastResult(result);
    return result;
  }, []);

  /**
   * Check if Dialogflow is available
   */
  const checkDialogflowStatus = useCallback(async (): Promise<boolean> => {
    if (!isDialogflowConfigured()) {
      return false;
    }
    
    try {
      const result = await detectIntent('test');
      dialogflowAvailable.current = !!result;
      return !!result;
    } catch {
      dialogflowAvailable.current = false;
      return false;
    }
  }, []);

  return {
    processText,
    processTextLocal,
    checkDialogflowStatus,
    isProcessing,
    lastResult,
    error,
    isDialogflowConfigured: isDialogflowConfigured(),
  };
}

// Export types
export type { DialogflowIntentType, DialogflowEntity };
