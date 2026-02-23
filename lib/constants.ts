// App constants and configuration

export const APP_NAME = 'Shopkeeper AI';
export const APP_VERSION = '0.1.0';

// Voice settings
export const VOICE_SETTINGS = {
  lang: 'ml-IN', // Malayalam - primary language
  fallbackLang: 'en-IN', // English India fallback
  continuous: true, // Keep listening until manually stopped
  interimResults: true,
  maxAlternatives: 3,
} as const;

// GST rates in India
export const GST_RATES = {
  EXEMPT: 0,
  LOW: 5,
  STANDARD: 12,
  HIGHER: 18,
  LUXURY: 28,
} as const;

// Common product categories
export const PRODUCT_CATEGORIES = [
  { id: 'grocery', name: 'Grocery', nameML: 'പലചരക്ക്' },
  { id: 'dairy', name: 'Dairy', nameML: 'പാൽ ഉൽപ്പന്നങ്ങൾ' },
  { id: 'vegetables', name: 'Vegetables', nameML: 'പച്ചക്കറികൾ' },
  { id: 'fruits', name: 'Fruits', nameML: 'പഴങ്ങൾ' },
  { id: 'snacks', name: 'Snacks', nameML: 'ലഘുഭക്ഷണം' },
  { id: 'beverages', name: 'Beverages', nameML: 'പാനീയങ്ങൾ' },
  { id: 'personal-care', name: 'Personal Care', nameML: 'വ്യക്തിഗത പരിചരണം' },
  { id: 'household', name: 'Household', nameML: 'ഗൃഹോപകരണങ്ങൾ' },
  { id: 'stationery', name: 'Stationery', nameML: 'സ്റ്റേഷനറി' },
  { id: 'other', name: 'Other', nameML: 'മറ്റുള്ളവ' },
] as const;

// Unit types
export const UNIT_TYPES = [
  { id: 'piece', name: 'Piece', nameML: 'എണ്ണം' },
  { id: 'kg', name: 'Kilogram', nameML: 'കിലോ' },
  { id: 'g', name: 'Gram', nameML: 'ഗ്രാം' },
  { id: 'l', name: 'Liter', nameML: 'ലിറ്റർ' },
  { id: 'ml', name: 'Milliliter', nameML: 'മില്ലി' },
  { id: 'pack', name: 'Pack', nameML: 'പായ്ക്ക്' },
  { id: 'dozen', name: 'Dozen', nameML: 'ഡസൻ' },
] as const;

// Payment methods
export const PAYMENT_METHODS = [
  { id: 'cash', name: 'Cash', nameML: 'ക്യാഷ്' },
  { id: 'upi', name: 'UPI/GPay', nameML: 'UPI' },
  { id: 'card', name: 'Card', nameML: 'കാർഡ്' },
  { id: 'credit', name: 'Credit', nameML: 'കടം' },
] as const;

// Intent types for NLP
export const INTENT_TYPES = {
  BILLING_ADD: 'BILLING_ADD',
  BILLING_REMOVE: 'BILLING_REMOVE',
  BILLING_CLEAR: 'BILLING_CLEAR',
  STOCK_CHECK: 'STOCK_CHECK',
  LOCATION_FIND: 'LOCATION_FIND',
  BILL_TOTAL: 'BILL_TOTAL',
  PAYMENT_UPI: 'PAYMENT_UPI',
  PAYMENT_CASH: 'PAYMENT_CASH',
  CONFIRM: 'CONFIRM',
  CANCEL: 'CANCEL',
  HELP: 'HELP',
  // Inventory management
  INVENTORY_ADD: 'INVENTORY_ADD',       // "50 kg അരി സ്റ്റോക്കിൽ ചേർക്കൂ"
  INVENTORY_UPDATE: 'INVENTORY_UPDATE', // "അരി വില 60 ആക്കൂ"
  INVENTORY_CHECK: 'INVENTORY_CHECK',   // "ലോ സ്റ്റോക്ക് ഉൽപ്പന്നങ്ങൾ"
  // Reports
  REPORTS_TODAY: 'REPORTS_TODAY',       // "ഇന്നത്തെ സെയിൽ എത്ര?"
  REPORTS_WEEK: 'REPORTS_WEEK',         // "ഈ ആഴ്ചത്തെ സെയിൽ?"
  REPORTS_PRODUCT: 'REPORTS_PRODUCT',   // "അരി എത്ര വിറ്റു?"
  REPORTS_PROFIT: 'REPORTS_PROFIT',     // "ഇന്നത്തെ ലാഭം?"
  UNKNOWN: 'UNKNOWN',
} as const;

// Malayalam responses
export const ML_RESPONSES = {
  listening: 'ഞാൻ കേൾക്കുന്നു...',
  processing: 'കാത്തിരിക്കൂ...',
  added: '{item} ബില്ലിൽ ചേർത്തു',
  removed: '{item} മാറ്റി',
  total: 'ആകെ തുക {amount} രൂപ',
  stockInfo: '{item} സ്റ്റോക്ക് {count} ഉണ്ട്',
  noStock: '{item} സ്റ്റോക്കിൽ ഇല്ല',
  location: '{item} {location} ൽ ഉണ്ട്',
  showQR: 'QR കോഡ് കാണിക്കുന്നു',
  confirmed: 'ശരി, ചെയ്തു',
  cancelled: 'റദ്ദാക്കി',
  notUnderstood: 'ക്ഷമിക്കണം, മനസ്സിലായില്ല. വീണ്ടും പറയൂ.',
  help: 'നിങ്ങൾക്ക് ബില്ലിംഗ്, സ്റ്റോക്ക് ചെക്ക്, QR കോഡ് എന്നിവ ചോദിക്കാം',
} as const;

// Default low stock threshold
export const DEFAULT_MIN_STOCK = 5;

// Report periods
export const REPORT_PERIODS = [
  { id: 'today', name: 'Today', nameML: 'ഇന്ന്' },
  { id: 'week', name: 'This Week', nameML: 'ഈ ആഴ്ച' },
  { id: 'month', name: 'This Month', nameML: 'ഈ മാസം' },
  { id: 'year', name: 'This Year', nameML: 'ഈ വർഷം' },
] as const;
