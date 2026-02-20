'use client';

import { callEdgeFunction, isEdgeFunctionsAvailable } from '@/lib/supabase/edge-functions';

// Intent types that Dialogflow will detect
export type DialogflowIntentType =
  | 'billing.add'           // Add item to bill: "അരി രണ്ട് കിലോ"
  | 'billing.remove'        // Remove item: "അരി മാറ്റുക"
  | 'billing.clear'         // Clear bill: "ബിൽ ക്ലിയർ"
  | 'billing.total'         // Get total: "ടോട്ടൽ എത്ര"
  | 'billing.complete'      // Complete transaction: "ബിൽ ചെയ്യൂ", "അത്രതന്നെ"
  | 'inventory.add'         // Add to inventory: "സ്റ്റോക്കിൽ 50 കിലോ അരി ചേർക്കുക"
  | 'inventory.check'       // Check stock: "അരി എത്ര ഉണ്ട്"
  | 'inventory.update'      // Update stock
  | 'payment.upi'           // UPI payment: "QR കാണിക്കുക"
  | 'payment.cash'          // Cash payment: "കാഷ്"
  | 'report.today'          // Today's sales
  | 'report.week'           // Weekly report
  | 'navigation.billing'    // Go to billing
  | 'navigation.inventory'  // Go to inventory
  | 'general.help'          // Help request
  | 'general.greeting'      // Greeting
  | 'general.cancel'        // Cancel action
  | 'general.confirm'       // Confirm action: "ശരി", "yes"
  | 'general.addmore'       // Add more items: "ഇനിയും വേണം", "കൂടി"
  | 'fallback';             // Unknown intent

export interface DialogflowEntity {
  product?: string;         // Product name
  quantity?: number;        // Quantity (e.g., 2)
  unit?: string;            // Unit (kg, litre, piece)
  price?: number;           // Price
  amount?: number;          // Amount for payment
}

export interface DialogflowResponse {
  intent: DialogflowIntentType;
  confidence: number;
  entities: DialogflowEntity;
  fulfillmentText: string;  // Response text from Dialogflow
  rawQuery: string;
}

interface DialogflowConfig {
  projectId: string;
  sessionId: string;
  languageCode: string;
}

// Get config from environment
function getConfig(): DialogflowConfig | null {
  const projectId = process.env.NEXT_PUBLIC_DIALOGFLOW_PROJECT_ID;

  if (!projectId) {
    console.warn('Dialogflow not configured. Set NEXT_PUBLIC_DIALOGFLOW_PROJECT_ID');
    return null;
  }

  return {
    projectId,
    sessionId: `session-${Date.now()}`,
    languageCode: 'ml', // Malayalam
  };
}

/**
 * Detect intent using Dialogflow via Supabase Edge Function
 */
export async function detectIntent(text: string): Promise<DialogflowResponse | null> {
  const config = getConfig();

  if (!config) {
    return null;
  }

  if (!isEdgeFunctionsAvailable()) {
    console.warn('Edge functions not available for Dialogflow');
    return null;
  }

  try {
    const { data, error } = await callEdgeFunction('dialogflow-detect', {
      text,
      sessionId: config.sessionId,
      languageCode: config.languageCode,
    });

    if (error || !data) {
      console.error('Dialogflow Edge Function error:', error);
      return null;
    }

    // Debug logging - see what Dialogflow returns
    console.log('[Dialogflow Response]', {
      queryText: data.queryResult?.queryText,
      intent: data.queryResult?.intent?.displayName,
      confidence: data.queryResult?.intentDetectionConfidence,
      parameters: data.queryResult?.parameters,
      fulfillmentText: data.queryResult?.fulfillmentText,
    });

    return parseDialogflowResponse(data, text);
  } catch (error) {
    console.error('Dialogflow detection failed:', error);
    return null;
  }
}

/**
 * Parse Dialogflow API response into our format
 */
function parseDialogflowResponse(data: any, rawQuery: string): DialogflowResponse {
  const queryResult = data.queryResult || {};
  const intent = queryResult.intent || {};
  const parameters = queryResult.parameters || {};

  // Map Dialogflow intent name to our type
  const intentName = intent.displayName || 'fallback';
  const mappedIntent = mapIntentName(intentName);

  // Extract entities from parameters
  const entities: DialogflowEntity = {
    product: parameters.product || parameters['product-name'] || undefined,
    quantity: parameters.quantity ? parseFloat(parameters.quantity) : undefined,
    unit: parameters.unit || undefined,
    price: parameters.price ? parseFloat(parameters.price) : undefined,
    amount: parameters.amount ? parseFloat(parameters.amount) : undefined,
  };

  return {
    intent: mappedIntent,
    confidence: queryResult.intentDetectionConfidence || 0,
    entities,
    fulfillmentText: queryResult.fulfillmentText || '',
    rawQuery,
  };
}

/**
 * Map Dialogflow intent display name to our intent type
 */
function mapIntentName(displayName: string): DialogflowIntentType {
  const mapping: Record<string, DialogflowIntentType> = {
    // Billing intents
    'billing.add': 'billing.add',
    'billing.add_item': 'billing.add',
    'add_to_bill': 'billing.add',
    'billing.remove': 'billing.remove',
    'remove_from_bill': 'billing.remove',
    'billing.clear': 'billing.clear',
    'clear_bill': 'billing.clear',
    'billing.total': 'billing.total',
    'get_total': 'billing.total',
    'billing.complete': 'billing.complete',

    // Inventory intents
    'inventory.add': 'inventory.add',
    'add_stock': 'inventory.add',
    'inventory.check': 'inventory.check',
    'check_stock': 'inventory.check',
    'inventory.update': 'inventory.update',

    // Payment intents
    'payment.upi': 'payment.upi',
    'show_qr': 'payment.upi',
    'payment.cash': 'payment.cash',

    // Report intents
    'report.today': 'report.today',
    'report.week': 'report.week',

    // Navigation
    'navigation.billing': 'navigation.billing',
    'navigation.inventory': 'navigation.inventory',

    // General
    'general.help': 'general.help',
    'general.greeting': 'general.greeting',
    'general.cancel': 'general.cancel',
    'general.confirm': 'general.confirm',
    'Default Welcome Intent': 'general.greeting',
    'Default Fallback Intent': 'fallback',
  };

  return mapping[displayName] || 'fallback';
}

/**
 * Check if Dialogflow is configured
 */
export function isDialogflowConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_DIALOGFLOW_PROJECT_ID;
}
