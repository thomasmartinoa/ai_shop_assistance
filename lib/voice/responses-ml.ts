/**
 * Comprehensive Malayalam Voice Response Library
 * All responses are in natural Malayalam with template support.
 * Use {variable} for dynamic substitution.
 */

// ─── Template helper ──────────────────────────────────────────────────────────

export function fillTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

// ─── Malayalam number words (for quantities) ──────────────────────────────────

const ML_NUMBERS: Record<number, string> = {
  0.25: 'കാൽ',
  0.5: 'അര',
  0.75: 'മുക്കാൽ',
  1: 'ഒന്ന്',
  2: 'രണ്ട്',
  3: 'മൂന്ന്',
  4: 'നാല്',
  5: 'അഞ്ച്',
  6: 'ആറ്',
  7: 'ഏഴ്',
  8: 'എട്ട്',
  9: 'ഒൻപത്',
  10: 'പത്ത്',
};

export function toMalayalamNumber(n: number): string {
  return ML_NUMBERS[n] ?? String(n);
}

// ─── Unit words in Malayalam ──────────────────────────────────────────────────

export const ML_UNITS: Record<string, string> = {
  kg: 'കിലോ',
  g: 'ഗ്രാം',
  litre: 'ലിറ്റർ',
  ml: 'മില്ലി',
  piece: 'എണ്ണം',
  pack: 'പായ്ക്ക്',
};

export function toMalayalamUnit(unit: string): string {
  return ML_UNITS[unit] ?? unit;
}

// ─── Billing Responses ────────────────────────────────────────────────────────

export const BILLING = {
  /** Item added to bill: "2 കിലോ അരി ബില്ലിൽ ചേർത്തു" */
  item_added: (quantity: number, unit: string, productMl: string) =>
    `${toMalayalamNumber(quantity)} ${toMalayalamUnit(unit)} ${productMl} ബില്ലിൽ ചേർത്തു`,

  /** Multiple items added: "അരി, പഞ്ചസാര, സോപ്പ് ബില്ലിൽ ചേർത്തു" */
  items_added: (productsMl: string[]) =>
    `${productsMl.join(', ')} ബില്ലിൽ ചേർത്തു`,

  /** Item removed: "അരി ബില്ലിൽ നിന്ന് മാറ്റി" */
  item_removed: (productMl: string) =>
    `${productMl} ബില്ലിൽ നിന്ന് മാറ്റി`,

  /** Bill cleared: "ബിൽ ക്ലിയർ ചെയ്തു" */
  bill_cleared: 'ബിൽ ക്ലിയർ ചെയ്തു',

  /** Product not found: "ക്ഷമിക്കണം, Rice കണ്ടെത്താനായില്ല" */
  product_not_found: (name: string) =>
    `ക്ഷമിക്കണം, ${name} കണ്ടെത്താനായില്ല`,

  /** Total: "ആകെ ₹480 ആണ്" */
  total: (amount: number) =>
    `ആകെ ${amount} രൂപ ആണ്`,

  /** Total with items count: "3 ഉൽപ്പന്നങ്ങൾ, ആകെ ₹480 ആണ്" */
  total_with_count: (count: number, amount: number) =>
    `${count} ഉൽപ്പന്നങ്ങൾ, ആകെ ${amount} രൂപ ആണ്`,

  /** After adding, prompt for more: "കൂടി എന്തെങ്കിലും വേണോ?" */
  ask_more: 'കൂടി എന്തെങ്കിലും വേണോ?',

  /** Bill complete prompt: "ആകെ ₹480. പേയ്‌മെന്റ് UPI ആണോ ക്യാഷ് ആണോ?" */
  payment_prompt: (amount: number) =>
    `ആകെ ${amount} രൂപ. GPay QR കാണിക്കട്ടെ, അതോ ക്യാഷ് ആണോ?`,

  /** Ask for payment method (static prompt) */
  ask_payment: 'GPay QR കാണിക്കട്ടെ? അതോ ക്യാഷ് ആണോ?',

  /** Empty bill: "ബില്ലിൽ ഒന്നും ഇല്ല" */
  empty_bill: 'ബില്ലിൽ ഒന്നും ഇല്ല',

  /** Quantity updated: "അരി 3 കിലോ ആക്കി" */
  quantity_updated: (productMl: string, quantity: number, unit: string) =>
    `${productMl} ${toMalayalamNumber(quantity)} ${toMalayalamUnit(unit)} ആക്കി`,
};

// ─── Payment Responses ────────────────────────────────────────────────────────

export const PAYMENT = {
  /** Showing QR: "QR കോഡ് കാണിക്കുന്നു, ₹480 GPay ചെയ്യൂ" */
  showing_qr: (amount: number) =>
    `QR കോഡ് കാണിക്കുന്നു. ${amount} രൂപ GPay ചെയ്യൂ`,

  /** Payment done (UPI): "₹480 UPI പേയ്‌മെന്റ് ലഭിച്ചു. നന്ദി!" */
  upi_received: (amount: number) =>
    `${amount} രൂപ UPI പേയ്‌മെന്റ് ലഭിച്ചു. നന്ദി!`,

  /** Payment done (cash): "₹480 ക്യാഷ് ലഭിച്ചു. നന്ദി!" */
  cash_received: (amount: number) =>
    `${amount} രൂപ ക്യാഷ് ലഭിച്ചു. നന്ദി!`,

  /** Transaction saved: "ബിൽ സേവ് ചെയ്തു" */
  saved: 'ഇടപാട് രേഖപ്പെടുത്തി',
};

// ─── Stock / Inventory Query Responses ───────────────────────────────────────

export const STOCK = {
  /** Stock available: "അരി 50 കിലോ ഉണ്ട്" */
  available: (productMl: string, count: number, unit: string) =>
    `${productMl} ${count} ${toMalayalamUnit(unit)} ഉണ്ട്`,

  /** Low stock: "സൂക്ഷിക്കുക! അരി കുറഞ്ഞു, വെറും 5 കിലോ മാത്രം" */
  low: (productMl: string, count: number, unit: string) =>
    `സൂക്ഷിക്കുക! ${productMl} കുറഞ്ഞു, വെറും ${count} ${toMalayalamUnit(unit)} മാത്രം`,

  /** Out of stock: "ക്ഷമിക്കണം, അരി സ്റ്റോക്കിൽ ഇല്ല" */
  out: (productMl: string) =>
    `ക്ഷമിക്കണം, ${productMl} സ്റ്റോക്കിൽ ഇല്ല`,

  /** Location: "അരി A1 ഷെൽഫിൽ ഉണ്ട്" */
  location: (productMl: string, location: string) =>
    `${productMl} ${location} ഷെൽഫിൽ ഉണ്ട്`,

  /** Multiple low stock: "5 ഉൽപ്പന്നങ്ങൾ കുറഞ്ഞ സ്റ്റോക്കിൽ ഉണ്ട്" */
  multiple_low: (count: number) =>
    `${count} ഉൽപ്പന്നങ്ങൾ കുറഞ്ഞ സ്റ്റോക്കിൽ ഉണ്ട്`,

  /** Smart stock level (picks out/low/available): */
  stock_level: (productMl: string, count: number, unit: string, minStock: number) => {
    if (count <= 0) return `ക്ഷമിക്കണം, ${productMl} സ്റ്റോക്കിൽ ഇല്ല`;
    if (count <= minStock) return `സൂക്ഷിക്കുക! ${productMl} കുറഞ്ഞു, വെറും ${count} ${toMalayalamUnit(unit)} മാത്രം`;
    return `${productMl} ${count} ${toMalayalamUnit(unit)} ഉണ്ട്`;
  },

  /** Product not found in catalog: */
  not_found: (name: string) =>
    `ക്ഷമിക്കണം, ${name} ഇൻവെൻ്ററിയിൽ ഇല്ല`,
};

// ─── Inventory Management Responses ──────────────────────────────────────────

export const INVENTORY = {
  /** Stock added: "50 കിലോ അരി സ്റ്റോക്കിൽ ചേർത്തു. ഇപ്പോൾ 150 കിലോ ഉണ്ട്" */
  stock_added: (quantity: number, unit: string, productMl: string, newTotal?: number) =>
    newTotal !== undefined
      ? `${toMalayalamNumber(quantity)} ${toMalayalamUnit(unit)} ${productMl} സ്റ്റോക്കിൽ ചേർത്തു. ഇപ്പോൾ ${newTotal} ${toMalayalamUnit(unit)} ഉണ്ട്`
      : `${toMalayalamNumber(quantity)} ${toMalayalamUnit(unit)} ${productMl} സ്റ്റോക്കിൽ ചേർത്തു`,

  /** Price updated: "അരി വില 60 രൂപ ആക്കി" */
  price_updated: (productMl: string, newPrice: number) =>
    `${productMl} വില ${newPrice} രൂപ ആക്കി`,

  /** Product added: "പുതിയ ഉൽപ്പന്നം ചേർത്തു: Rice" */
  product_added: (name: string) =>
    `പുതിയ ഉൽപ്പന്നം ചേർത്തു: ${name}`,

  /** Ask for quantity to add: "എത്ര ചേർക്കണം?" */
  ask_quantity: (productMl: string) =>
    `${productMl} എത്ര സ്റ്റോക്കിൽ ചേർക്കണം?`,
};

// ─── Reports Responses ────────────────────────────────────────────────────────

export const REPORTS = {
  /** Today's sales: "ഇന്ന് 25 ഇടപാടുകൾ, ₹4500 വിറ്റു" */
  today: (count: number, amount: number) =>
    `ഇന്ന് ${count} ഇടപാടുകൾ, ${amount} രൂപ വിറ്റു`,

  /** This week: "ഈ ആഴ്ച ₹32000 വിറ്റു" */
  week: (amount: number) =>
    `ഈ ആഴ്ച ${amount} രൂപ വിറ്റു`,

  /** This month: "ഈ മാസം ₹1,20,000 വിറ്റു" */
  month: (amount: number) =>
    `ഈ മാസം ${amount} രൂപ വിറ്റു`,

  /** Product sales: "ഈ ആഴ്ച അരി 150 കിലോ വിറ്റു" */
  product_sales: (productMl: string, quantity: number, unit: string) =>
    `ഈ ആഴ്ച ${productMl} ${quantity} ${toMalayalamUnit(unit)} വിറ്റു`,

  /** Top product: "ഏറ്റവും കൂടുതൽ വിറ്റ ഉൽപ്പന്നം: അരി" */
  top_product: (productMl: string) =>
    `ഏറ്റവും കൂടുതൽ വിറ്റ ഉൽപ്പന്നം: ${productMl}`,

  /** No data: "ഇന്ന് ഇതുവരെ ഒരു ഇടപാടും ഇല്ല" */
  no_data: 'ഇന്ന് ഇതുവരെ ഒരു ഇടപാടും ഇല്ല',

  /** Profit today: "ഇന്നത്തെ ലാഭം ₹800" */
  profit_today: (amount: number) =>
    `ഇന്നത്തെ ലാഭം ${amount} രൂപ`,
};

// ─── System / Conversational Responses ───────────────────────────────────────

export const SYSTEM = {
  /** Listening: "ഞാൻ കേൾക്കുന്നു..." */
  listening: 'ഞാൻ കേൾക്കുന്നു...',

  /** Processing: "കാത്തിരിക്കൂ..." */
  processing: 'കാത്തിരിക്കൂ...',

  /** Did not understand: "ക്ഷമിക്കണം, മനസ്സിലായില്ല. വീണ്ടും പറയൂ." */
  not_understood: 'ക്ഷമിക്കണം, മനസ്സിലായില്ല. വീണ്ടും പറയൂ.',

  /** Confirmed: "ശരി" */
  confirmed: 'ശരി',

  /** Cancelled: "ശരി, ഒഴിവാക്കി" */
  cancelled: 'ശരി, ഒഴിവാക്കി',

  /** Welcome: "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ ഷോപ്പ് അസിസ്റ്റന്റ് ആണ്. ബില്ലിംഗ്, സ്റ്റോക്ക്, റിപ്പോർട്ട് - എല്ലാം ചോദിക്കൂ." */
  welcome:
    'നമസ്കാരം! ഞാൻ നിങ്ങളുടെ ഷോപ്പ് അസിസ്റ്റന്റ് ആണ്. ബില്ലിംഗ്, സ്റ്റോക്ക്, റിപ്പോർട്ട് - എല്ലാം ചോദിക്കൂ.',

  /** Ready: "ഞാൻ തയ്യാർ. സംസാരിക്കൂ." */
  ready: 'ഞാൻ തയ്യാർ. സംസാരിക്കൂ.',

  /** Error: "ക്ഷമിക്കണം, ഒരു പ്രശ്നം ഉണ്ടായി. വീണ്ടും ശ്രമിക്കൂ." */
  error: 'ക്ഷമിക്കണം, ഒരു പ്രശ്നം ഉണ്ടായി. വീണ്ടും ശ്രമിക്കൂ.',

  /** Help - what can I do */
  help: `ഞാൻ ഈ കാര്യങ്ങൾ ചെയ്യാം:
ബില്ലിംഗ്: "10 കിലോ അരി, 2 കിലോ പഞ്ചസാര"
സ്റ്റോക്ക് ചെക്ക്: "അരി എത്ര ഉണ്ട്?"
ഇൻവെന്ററി: "50 കിലോ അരി സ്റ്റോക്കിൽ ചേർക്കൂ"
റിപ്പോർട്ട്: "ഇന്നത്തെ സെയിൽ എത്ര?"
ടോട്ടൽ: "ടോട്ടൽ" അല്ലെങ്കിൽ "ആകെ എത്ര?"`,

  /** Settings updated */
  settings_updated: (field: string) =>
    `${field} അപ്ഡേറ്റ് ചെയ്തു`,
};

// ─── Confirmation / Question Responses ───────────────────────────────────────

export const CONFIRM = {
  /** Confirm remove: "അരി ബില്ലിൽ നിന്ന് മാറ്റണോ?" */
  remove_item: (productMl: string) =>
    `${productMl} ബില്ലിൽ നിന്ন് മാറ്റണോ?`,

  /** Confirm clear bill: "ബിൽ മുഴുവൻ ക്ലിയർ ചെയ്യണോ?" */
  clear_bill: 'ബിൽ മുഴുവൻ ക്ലിയർ ചെയ്യണോ?',

  /** Done, new bill: "ഇടപാട് കഴിഞ്ഞു. പുതിയ ബിൽ തുടങ്ങട്ടെ?" */
  new_bill: 'ഇടപാട് കഴിഞ്ഞു. പുതിയ ബിൽ തുടങ്ങട്ടെ?',
};
