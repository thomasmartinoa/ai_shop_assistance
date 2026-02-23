'use client';

import { callEdgeFunction, isEdgeFunctionsAvailable } from '@/lib/supabase/edge-functions';

// Intent types that CX Playbook returns
export type DialogflowIntentType =
  | 'billing.add'
  | 'billing.remove'
  | 'billing.clear'
  | 'billing.total'
  | 'billing.complete'
  | 'stock.check'
  | 'stock.location'
  | 'inventory.add'
  | 'inventory.update'
  | 'inventory.low_stock'
  | 'inventory.check'       // alias for stock.check
  | 'payment.upi'
  | 'payment.cash'
  | 'report.today'
  | 'report.week'
  | 'confirm'
  | 'cancel'
  | 'help'
  | 'greeting'
  | 'fallback';

export interface DialogflowEntity {
  product?: string;
  productMl?: string;
  quantity?: number;
  unit?: string;
  price?: number;
  amount?: number;
}

/** A single product extracted by CX Playbook */
export interface CXProduct {
  name: string;
  nameMl: string;
  qty: number;
  unit: string;
}

export interface DialogflowResponse {
  intent: DialogflowIntentType;
  confidence: number;
  entities: DialogflowEntity;
  products: CXProduct[];
  fulfillmentText: string;
  rawQuery: string;
}

// Persistent session ID per browser session (CX tracks conversation context)
let cxSessionId: string | null = null;

function getSessionId(): string {
  if (!cxSessionId) {
    cxSessionId = `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  return cxSessionId;
}

/** Reset CX session (e.g. after completing a transaction) */
export function resetCXSession(): void {
  cxSessionId = null;
}

/**
 * Detect intent using Dialogflow CX Playbook via Supabase Edge Function
 */
export async function detectIntent(text: string): Promise<DialogflowResponse | null> {
  if (!isEdgeFunctionsAvailable()) {
    console.warn('Edge functions not available for Dialogflow CX');
    return null;
  }

  try {
    const { data, error } = await callEdgeFunction('dialogflow-cx-detect', {
      text,
      sessionId: getSessionId(),
      languageCode: 'en',
    });

    if (error || !data) {
      console.error('Dialogflow CX Edge Function error:', error);
      return null;
    }

    console.log('[CX Response]', data);
    return parseCXResponse(data, text);
  } catch (error) {
    console.error('Dialogflow CX detection failed:', error);
    return null;
  }
}

/**
 * Parse structured CX Playbook response into our format
 */
function parseCXResponse(data: any, rawQuery: string): DialogflowResponse {
  const intent = (data.intent || 'fallback') as DialogflowIntentType;
  const products: CXProduct[] = data.products || [];
  const confidence = data.confidence || 0;
  const response = data.response || '';

  // Build entities from first product (for backward compat with single-product code)
  const firstProduct = products[0];
  const entities: DialogflowEntity = firstProduct
    ? {
        product: firstProduct.name,
        productMl: firstProduct.nameMl,
        quantity: firstProduct.qty,
        unit: firstProduct.unit,
      }
    : {};

  return {
    intent,
    confidence,
    entities,
    products,
    fulfillmentText: response,
    rawQuery,
  };
}

/**
 * Check if Dialogflow CX is configured (edge functions available)
 */
export function isDialogflowConfigured(): boolean {
  return isEdgeFunctionsAvailable();
}
