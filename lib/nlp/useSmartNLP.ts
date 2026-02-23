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
 * Ultra-light local fallback — only 3 intents (no product matching)
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

    console.log('🧠 CX NLP: Processing:', text);
    setIsProcessing(true);
    setError(null);

    try {
      // Try CX Playbook
      if (isDialogflowConfigured()) {
        const cxResult = await detectIntent(text);

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

      // Ultra-light local fallback
      const localResult = detectLocalFallback(text);
      setLastResult(localResult);
      setIsProcessing(false);
      return localResult;
    } catch (err) {
      console.error('🧠 CX NLP error:', err);
      setError(err instanceof Error ? err.message : 'NLP processing failed');

      const localResult = detectLocalFallback(text);
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
