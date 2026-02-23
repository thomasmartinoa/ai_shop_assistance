/**
 * Universal Intent Router
 *
 * Routes NLP results to the appropriate handler and determines what to
 * display on the Voice Hub screen. Returns a structured action object
 * that the Voice Hub page can render and speak.
 */

import type { NLPResult, DialogflowIntentType, CXProduct } from '@/lib/nlp/useSmartNLP';
import { BILLING, STOCK, INVENTORY, REPORTS, SYSTEM, PAYMENT } from '@/lib/voice/responses-ml';

// ─── Hub Modes (what is currently displayed) ─────────────────────────────────

export type HubMode =
  | 'idle'
  | 'billing'
  | 'stock'
  | 'inventory'
  | 'reports'
  | 'payment';

// ─── Routed Action ───────────────────────────────────────────────────────────

export interface RouterAction {
  /** The new display mode to switch to */
  mode: HubMode;
  /** Natural Malayalam response to speak aloud */
  voiceResponse: string;
  /** Specific operation to perform */
  operation:
    | 'add_to_cart'
    | 'remove_from_cart'
    | 'clear_cart'
    | 'show_total'
    | 'show_qr'
    | 'complete_payment'
    | 'check_stock'
    | 'find_location'
    | 'add_stock'
    | 'update_price'
    | 'check_low_stock'
    | 'report_today'
    | 'report_week'
    | 'report_product'
    | 'report_profit'
    | 'confirm'
    | 'cancel'
    | 'help'
    | 'none';
  /** Entities extracted from the utterance */
  entities: Record<string, string | number>;
}

// ─── Dialogflow intent → operation mapping ───────────────────────────────────

const INTENT_TO_OPERATION: Record<string, RouterAction['operation']> = {
  // CX Playbook intent names (primary)
  'billing.add': 'add_to_cart',
  'billing.remove': 'remove_from_cart',
  'billing.clear': 'clear_cart',
  'billing.total': 'show_total',
  'billing.complete': 'show_total',
  'stock.check': 'check_stock',
  'stock.location': 'find_location',
  'inventory.add': 'add_stock',
  'inventory.update': 'update_price',
  'inventory.check': 'check_stock',
  'inventory.low_stock': 'check_low_stock',
  'payment.upi': 'show_qr',
  'payment.cash': 'complete_payment',
  'report.today': 'report_today',
  'report.week': 'report_week',
  'confirm': 'confirm',
  'cancel': 'cancel',
  'help': 'help',
  'greeting': 'none',
  'fallback': 'none',
  // Legacy ES intent names (backward compat)
  'general.confirm': 'confirm',
  'general.cancel': 'cancel',
  'general.help': 'help',
  'general.greeting': 'none',
  'general.addmore': 'add_to_cart',
};

// ─── Mode determination ───────────────────────────────────────────────────────

function modeForOperation(operation: RouterAction['operation']): HubMode {
  switch (operation) {
    case 'add_to_cart':
    case 'remove_from_cart':
    case 'clear_cart':
    case 'show_total':
      return 'billing';
    case 'show_qr':
    case 'complete_payment':
      return 'payment';
    case 'check_stock':
    case 'find_location':
      return 'stock';
    case 'add_stock':
    case 'update_price':
    case 'check_low_stock':
      return 'inventory';
    case 'report_today':
    case 'report_week':
    case 'report_product':
    case 'report_profit':
      return 'reports';
    default:
      return 'idle';
  }
}

// ─── Voice response generation ────────────────────────────────────────────────

function buildVoiceResponse(
  operation: RouterAction['operation'],
  entities: Record<string, string | number>
): string {
  const productMl = (entities.productMl as string) || (entities.product as string) || '';
  const quantity = Number(entities.quantity) || 1;
  const unit = (entities.unit as string) || 'piece';

  switch (operation) {
    case 'add_to_cart':
      return productMl
        ? BILLING.item_added(quantity, unit, productMl)
        : 'ഉൽപ്പന്നം ബില്ലിൽ ചേർത്തു';
    case 'remove_from_cart':
      return productMl ? BILLING.item_removed(productMl) : 'ഉൽപ്പന്നം മാറ്റി';
    case 'clear_cart':
      return BILLING.bill_cleared;
    case 'show_total':
      return BILLING.total(Number(entities.total) || 0);
    case 'show_qr':
      return PAYMENT.showing_qr(Number(entities.total) || 0);
    case 'complete_payment':
      return PAYMENT.cash_received(Number(entities.total) || 0);
    case 'check_stock':
      return productMl
        ? `${productMl} സ്റ്റോക്ക് നോക്കുന്നു`
        : 'സ്റ്റോക്ക് നോക്കുന്നു';
    case 'find_location':
      return productMl ? `${productMl} എവിടെ ഉണ്ടെന്ന് നോക്കുന്നു` : '';
    case 'add_stock':
      return productMl
        ? `${productMl} സ്റ്റോക്ക് ചേർക്കുന്നു`
        : 'സ്റ്റോക്ക് ചേർക്കുന്നു';
    case 'update_price':
      return productMl ? `${productMl} വില അപ്ഡേറ്റ് ചെയ്യുന്നു` : '';
    case 'check_low_stock':
      return 'കുറഞ്ഞ സ്റ്റോക്ക് ഉള്ള ഉൽപ്പന്നങ്ങൾ നോക്കുന്നു';
    case 'report_today':
      return 'ഇന്നത്തെ സെയിൽസ് കാണിക്കുന്നു';
    case 'report_week':
      return 'ഈ ആഴ്ചത്തെ സെയിൽസ് കാണിക്കുന്നു';
    case 'report_product':
      return productMl ? `${productMl} വിൽപ്പന നോക്കുന്നു` : 'ഉൽപ്പന്ന വിൽപ്പന നോക്കുന്നു';
    case 'report_profit':
      return 'ലാഭക്കണക്ക് കാണിക്കുന്നു';
    case 'help':
      return SYSTEM.help;
    case 'confirm':
      return SYSTEM.confirmed;
    case 'cancel':
      return SYSTEM.cancelled;
    default:
      return SYSTEM.not_understood;
  }
}

// ─── Main router function ─────────────────────────────────────────────────────

/**
 * Route an NLP result to a structured action for the Voice Hub.
 */
export function routeIntent(nlpResult: NLPResult): RouterAction {
  const intentStr = String(nlpResult.intent);
  const operation = INTENT_TO_OPERATION[intentStr] ?? 'none';
  const mode = modeForOperation(operation);
  const entities = { ...nlpResult.entities };
  const voiceResponse = buildVoiceResponse(operation, entities);

  return { mode, operation, entities, voiceResponse };
}

/**
 * Check if an NLP result is a "billing add" type intent
 */
export function isBillingAdd(nlpResult: NLPResult): boolean {
  return String(nlpResult.intent) === 'billing.add';
}

export function isConfirm(nlpResult: NLPResult): boolean {
  const i = String(nlpResult.intent);
  return i === 'confirm' || i === 'general.confirm';
}

export function isCancel(nlpResult: NLPResult): boolean {
  const i = String(nlpResult.intent);
  return i === 'cancel' || i === 'general.cancel';
}

export function isAddMore(nlpResult: NLPResult): boolean {
  const i = String(nlpResult.intent);
  return i === 'confirm' || i === 'general.confirm' || i === 'general.addmore';
}
