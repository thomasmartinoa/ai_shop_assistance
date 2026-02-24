'use client';

import { useState, useCallback } from 'react';
import {
  detectIntent,
  isDialogflowConfigured,
  type DialogflowResponse,
  type DialogflowIntentType,
  type DialogflowEntity,
  type CXProduct,
} from './dialogflow';

/**
 * Smart NLP Hook — Dialogflow CX Playbook powered
 *
 * All intent detection is handled by CX (Gemini LLM).
 * Only ultra-light local regex for confirm/cancel/greeting when CX is unreachable.
 */

export interface NLPResult {
  intent: DialogflowIntentType;
  confidence: number;
  entities: DialogflowEntity;
  products: CXProduct[];
  source: 'cx' | 'local';
  rawQuery: string;
  fulfillmentText?: string;
}

/**
 * Normalize Malayalam STT output — maps Malayalam transliterations of
 * common English words back to recognizable forms so NLP can detect them.
 * ml-IN STT outputs "യുപിഐ" when user says "UPI", "ക്യാഷ്" for "cash", etc.
 */
const ML_TO_ENGLISH: [RegExp, string][] = [
  [/യു\s*പി\s*ഐ|യുപിഐ|യു\.പി\.ഐ/gi, 'UPI'],
  [/ജി\s*പേ|ഗൂഗിൾ\s*പേ/gi, 'GPay'],
  [/ക്യാഷ്|ക്യാഷ|കാഷ്|കാശ്/gi, 'cash'],
  [/ഫോൺ\s*പേ|ഫോണ്‍പേ/gi, 'PhonePe'],
  [/ബിൽ\s*ഇറ്റ്|ബില്ലിറ്റ്/gi, 'bill it'],
  [/ക്യു\s*ആർ/gi, 'QR'],
];

function normalizeTranscript(text: string): string {
  let normalized = text;
  for (const [pattern, replacement] of ML_TO_ENGLISH) {
    normalized = normalized.replace(pattern, replacement);
  }
  return normalized;
}

/**
 * Ultra-light local fallback — only basic intents (no product matching)
 */
function detectLocalFallback(text: string): NLPResult {
  const t = text.trim().toLowerCase();

  if (/^(ശരി|ഉവ്വ്|ഓക്കേ|ok|yes|ഓക്കെ)$/i.test(t)) {
    return { intent: 'confirm', confidence: 0.9, entities: {}, products: [], source: 'local', rawQuery: text, fulfillmentText: 'ശരി' };
  }
  if (/^(വേണ്ട|ക്യാൻസൽ|no|cancel)$/i.test(t)) {
    return { intent: 'cancel', confidence: 0.9, entities: {}, products: [], source: 'local', rawQuery: text, fulfillmentText: 'ക്യാൻസൽ ചെയ്തു' };
  }
  if (/^(ഹലോ|നമസ്കാരം|hi|hello)$/i.test(t)) {
    return { intent: 'greeting', confidence: 0.9, entities: {}, products: [], source: 'local', rawQuery: text, fulfillmentText: 'നമസ്കാരം! എന്ത് സഹായം വേണം?' };
  }
  if (/upi|gpay|phonep|ക്യു\s*ആർ/i.test(t)) {
    return { intent: 'payment.upi', confidence: 0.9, entities: {}, products: [], source: 'local', rawQuery: text, fulfillmentText: 'UPI പേയ്മെന്റ്' };
  }
  if (/\bcash\b|രൊക്കം|പണം/i.test(t) && !/stock|report/i.test(t)) {
    return { intent: 'payment.cash', confidence: 0.9, entities: {}, products: [], source: 'local', rawQuery: text, fulfillmentText: 'ക്യാഷ് പേയ്മെന്റ്' };
  }
  if (/\bbill\s*it\b|ബിൽ\s*ചെയ്യൂ|ബിൽ\s*അടിക്കൂ|അത്ര\s*മതി|ഇത്ര\s*മതി|വേറെ\s*ഒന്നും\s*വേണ്ട/i.test(t)) {
    return { intent: 'billing.complete', confidence: 0.9, entities: {}, products: [], source: 'local', rawQuery: text, fulfillmentText: 'ബിൽ ചെയ്യുന്നു' };
  }

  return { intent: 'fallback', confidence: 0, entities: {}, products: [], source: 'local', rawQuery: text, fulfillmentText: 'മനസ്സിലായില്ല. വീണ്ടും പറയൂ.' };
}

/**
 * Smart NLP Hook — CX Playbook primary, ultra-light local fallback
 */
export function useSmartNLP() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<NLPResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processText = useCallback(async (text: string): Promise<NLPResult> => {
    if (!text.trim()) {
      return { intent: 'fallback', confidence: 0, entities: {}, products: [], source: 'local', rawQuery: text };
    }

    // Normalize Malayalam transliterations of English words before NLP
    const normalized = normalizeTranscript(text);
    console.log('🧠 CX NLP: Processing:', text, normalized !== text ? `→ normalized: ${normalized}` : '');
    setIsProcessing(true);
    setError(null);

    try {
      // Try CX Playbook with normalized text
      if (isDialogflowConfigured()) {
        const cxResult = await detectIntent(normalized);

        if (cxResult) {
          const result: NLPResult = {
            intent: cxResult.intent,
            confidence: cxResult.confidence,
            entities: cxResult.entities,
            products: cxResult.products,
            source: 'cx',
            rawQuery: text,
            fulfillmentText: cxResult.fulfillmentText,
          };
          setLastResult(result);
          setIsProcessing(false);
          return result;
        } else {
          console.warn('🧠 CX NLP: CX call failed, using local fallback for this request');
        }
      }

      // Ultra-light local fallback (uses normalized text)
      const localResult = detectLocalFallback(normalized);
      setLastResult(localResult);
      setIsProcessing(false);
      return localResult;
    } catch (err) {
      console.error('🧠 CX NLP error:', err);
      setError(err instanceof Error ? err.message : 'NLP processing failed');

      const localResult = detectLocalFallback(normalized);
      setLastResult(localResult);
      setIsProcessing(false);
      return localResult;
    }
  }, []);

  /**
   * Quick local-only detection (confirm/cancel/greeting only)
   */
  const processTextLocal = useCallback((text: string): NLPResult => {
    const result = detectLocalFallback(text);
    setLastResult(result);
    return result;
  }, []);

  const checkDialogflowStatus = useCallback(async (): Promise<boolean> => {
    if (!isDialogflowConfigured()) return false;
    try {
      const result = await detectIntent('ഹലോ');
      return !!result;
    } catch {
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
export type { DialogflowIntentType, DialogflowEntity, CXProduct };
