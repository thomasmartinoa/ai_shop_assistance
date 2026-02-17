/**
 * Dialogflow ES Setup Script
 * Creates entities, intents, and training phrases for the Shopkeeper AI Assistant
 *
 * Usage: node scripts/setup-dialogflow.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleAuth } from 'google-auth-library';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load service account credentials
const credentialsPath = path.join(__dirname, '..', 'lock', 'shopkeeper-ai-2f59b5ac8bf4.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

const PROJECT_ID = credentials.project_id;
const BASE_URL = `https://dialogflow.googleapis.com/v2/projects/${PROJECT_ID}/agent`;

// ============================================================
// AUTH
// ============================================================

const auth = new GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/dialogflow'],
});

async function getAccessToken() {
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  return tokenResponse.token;
}

// ============================================================
// API HELPERS
// ============================================================

let ACCESS_TOKEN = null;

async function apiCall(method, endpoint, body = null) {
  if (!ACCESS_TOKEN) ACCESS_TOKEN = await getAccessToken();

  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);
  const data = await res.json();

  if (!res.ok) {
    console.error(`  API Error [${method} ${endpoint}]:`, JSON.stringify(data.error || data, null, 2));
    return null;
  }
  return data;
}

// ============================================================
// ENTITY TYPES
// ============================================================

const ENTITY_TYPES = [
  {
    displayName: 'product',
    kind: 'KIND_MAP',
    entities: [
      { value: 'അരി', synonyms: ['അരി', 'rice', 'ari', 'chawal', 'ചോറ്'] },
      { value: 'പഞ്ചസാര', synonyms: ['പഞ്ചസാര', 'sugar', 'panchara', 'cheeni', 'പഞ്ചാര'] },
      { value: 'വെളിച്ചെണ്ണ', synonyms: ['വെളിച്ചെണ്ണ', 'coconut oil', 'velichenna', 'നാളികേര എണ്ണ', 'എണ്ണ'] },
      { value: 'ചായപ്പൊടി', synonyms: ['ചായപ്പൊടി', 'tea', 'tea powder', 'chaya', 'chai', 'ചായ'] },
      { value: 'പാൽ', synonyms: ['പാൽ', 'milk', 'paal', 'ക്ഷീരം'] },
      { value: 'ഗോതമ്പ് പൊടി', synonyms: ['ഗോതമ്പ് പൊടി', 'wheat flour', 'gothambu', 'atta', 'wheat', 'maida', 'മൈദ', 'ആട്ട'] },
      { value: 'ഉപ്പ്', synonyms: ['ഉപ്പ്', 'salt', 'uppu', 'namak'] },
      { value: 'സോപ്പ്', synonyms: ['സോപ്പ്', 'soap', 'sabun', 'soppu'] },
      { value: 'മുളക് പൊടി', synonyms: ['മുളക് പൊടി', 'chilli powder', 'mulaku podi', 'മുളകുപൊടി'] },
      { value: 'മഞ്ഞൾ പൊടി', synonyms: ['മഞ്ഞൾ പൊടി', 'turmeric', 'manjal', 'മഞ്ഞൾ', 'haldi'] },
      { value: 'കടല', synonyms: ['കടല', 'dal', 'kadala', 'parippu', 'പരിപ്പ്'] },
      { value: 'തേങ്ങ', synonyms: ['തേങ്ങ', 'coconut', 'thenga', 'നാളികേരം'] },
      { value: 'ടൂത്ത്പേസ്റ്റ്', synonyms: ['ടൂത്ത്പേസ്റ്റ്', 'toothpaste', 'paste', 'പേസ്റ്റ്'] },
      { value: 'ബിസ്കറ്റ്', synonyms: ['ബിസ്കറ്റ്', 'biscuit', 'biscuits', 'biskut'] },
      { value: 'കാപ്പിപ്പൊടി', synonyms: ['കാപ്പിപ്പൊടി', 'coffee', 'coffee powder', 'kaappi'] },
    ],
  },
  {
    displayName: 'unit',
    kind: 'KIND_MAP',
    entities: [
      { value: 'kg', synonyms: ['kg', 'കിലോ', 'kilo', 'kilogram', 'കിലോഗ്രാം', 'കെ ജി'] },
      { value: 'g', synonyms: ['g', 'ഗ്രാം', 'gram', 'grams', 'ഗ്രാം'] },
      { value: 'litre', synonyms: ['litre', 'liter', 'ലിറ്റർ', 'l', 'എൽ'] },
      { value: 'ml', synonyms: ['ml', 'മില്ലി', 'milli', 'millilitre', 'മില്ലിലിറ്റർ'] },
      { value: 'piece', synonyms: ['piece', 'എണ്ണം', 'ennam', 'count', 'nos', 'packets', 'pack', 'പായ്ക്കറ്റ്', 'പാക്കറ്റ്'] },
      { value: 'dozen', synonyms: ['dozen', 'ഡസൻ', 'dasan'] },
    ],
  },
  {
    displayName: 'payment-method',
    kind: 'KIND_MAP',
    entities: [
      { value: 'upi', synonyms: ['upi', 'UPI', 'gpay', 'GPay', 'ജിപേ', 'യുപിഐ', 'google pay', 'phonepe', 'ഫോൺപേ', 'paytm'] },
      { value: 'cash', synonyms: ['cash', 'കാഷ്', 'കാശ്', 'പണം', 'panam', 'രൂപ'] },
      { value: 'credit', synonyms: ['credit', 'കടം', 'kadam', 'ക്രെഡിറ്റ്', 'പിന്നീട്'] },
    ],
  },
  {
    displayName: 'time-period',
    kind: 'KIND_MAP',
    entities: [
      { value: 'today', synonyms: ['today', 'ഇന്ന്', 'innu', 'ഇന്നത്തെ'] },
      { value: 'yesterday', synonyms: ['yesterday', 'ഇന്നലെ', 'innale'] },
      { value: 'week', synonyms: ['week', 'ആഴ്ച', 'aazhcha', 'ഈ ആഴ്ച', 'this week'] },
      { value: 'month', synonyms: ['month', 'മാസം', 'maasam', 'ഈ മാസം', 'this month'] },
    ],
  },
];

// ============================================================
// INTENTS
// ============================================================

const INTENTS = [
  // ---- BILLING ----
  {
    displayName: 'billing.add',
    trainingPhrases: [
      // Malayalam
      'അരി 2 കിലോ',
      'രണ്ട് കിലോ അരി',
      '2 kg അരി',
      'ഒരു സോപ്പ്',
      'മൂന്ന് പാൽ',
      '5 കിലോ പഞ്ചസാര',
      'അര കിലോ ചായപ്പൊടി',
      'ഒരു കിലോ ഉപ്പ്',
      'രണ്ട് ലിറ്റർ വെളിച്ചെണ്ണ',
      '3 ബിസ്കറ്റ്',
      'ഒരു ടൂത്ത്പേസ്റ്റ്',
      '2 കിലോ ഗോതമ്പ് പൊടി',
      'അരി ഒരു കിലോ ബില്ലിൽ ചേർക്കൂ',
      'പഞ്ചസാര 1 kg ആഡ് ചെയ്യൂ',
      'സോപ്പ് ബില്ലിൽ ഇടൂ',
      '10 എണ്ണം ബിസ്കറ്റ്',
      'അര ലിറ്റർ പാൽ',
      'ഒരു പായ്ക്കറ്റ് ചായപ്പൊടി',
      'മൂന്ന് കിലോ അരി കൂടി',
      // English
      'add rice 2 kg',
      'add 1 soap',
      '2 kg sugar',
      'add milk 1 litre',
      'one tea powder',
      'add 3 biscuits',
    ],
    parameters: [
      { displayName: 'product', entityTypeDisplayName: '@product', mandatory: true, prompts: ['ഏത് സാധനം?', 'Which product?'] },
      { displayName: 'number', entityTypeDisplayName: '@sys.number', mandatory: false },
      { displayName: 'unit', entityTypeDisplayName: '@unit', mandatory: false },
    ],
    messages: [{ text: { text: ['ശരി, $product $number $unit ബില്ലിൽ ചേർത്തു'] } }],
  },
  {
    displayName: 'billing.remove',
    trainingPhrases: [
      'അരി മാറ്റൂ',
      'അരി ബില്ലിൽ നിന്ന് നീക്കൂ',
      'സോപ്പ് വേണ്ട',
      'പഞ്ചസാര കാൻസൽ',
      'ഒരെണ്ണം കുറയ്ക്കൂ',
      'അവസാനത്തെ ഐറ്റം മാറ്റൂ',
      'പാൽ ഒഴിവാക്കൂ',
      'ബില്ലിൽ നിന്ന് ചായപ്പൊടി നീക്കൂ',
      'remove rice',
      'remove soap from bill',
      'cancel sugar',
      'delete last item',
    ],
    parameters: [
      { displayName: 'product', entityTypeDisplayName: '@product', mandatory: false },
    ],
    messages: [{ text: { text: ['ശരി, $product ബില്ലിൽ നിന്ന് മാറ്റി'] } }],
  },
  {
    displayName: 'billing.clear',
    trainingPhrases: [
      'ബിൽ ക്ലിയർ ചെയ്യൂ',
      'എല്ലാം മാറ്റൂ',
      'ബിൽ റീസെറ്റ്',
      'പുതിയ ബിൽ',
      'ആദ്യം മുതൽ',
      'കാൻസൽ ചെയ്യൂ ബിൽ',
      'clear bill',
      'clear all',
      'new bill',
      'start over',
    ],
    parameters: [],
    messages: [{ text: { text: ['ശരി, ബിൽ ക്ലിയർ ചെയ്തു'] } }],
  },
  {
    displayName: 'billing.total',
    trainingPhrases: [
      'ടോട്ടൽ എത്ര',
      'ബിൽ എത്ര ആയി',
      'എത്ര രൂപ',
      'ആകെ എത്ര',
      'ടോട്ടൽ',
      'ബിൽ തുക',
      'എത്ര ആയി',
      'what is the total',
      'total amount',
      'how much',
      'bill amount',
    ],
    parameters: [],
    messages: [{ text: { text: ['ആകെ തുക കാണിക്കുന്നു'] } }],
  },
  {
    displayName: 'billing.complete',
    trainingPhrases: [
      'ബിൽ ചെയ്യൂ',
      'അത്രതന്നെ',
      'ബില്ലിംഗ് പൂർത്തിയാക്കൂ',
      'ഇത്രയേ ഉള്ളൂ',
      'മതി',
      'ബിൽ അടയ്ക്കൂ',
      'ബിൽ സേവ് ചെയ്യൂ',
      'ഓർഡർ കംപ്ലീറ്റ്',
      'complete bill',
      'finish billing',
      'done',
      'that is all',
      'save bill',
    ],
    parameters: [],
    messages: [{ text: { text: ['ശരി, ബിൽ പൂർത്തിയാക്കുന്നു'] } }],
  },

  // ---- INVENTORY ----
  {
    displayName: 'inventory.check',
    trainingPhrases: [
      'അരി സ്റ്റോക്ക് എത്ര',
      'അരി ഉണ്ടോ',
      'പഞ്ചസാര എത്ര ഉണ്ട്',
      'സോപ്പ് സ്റ്റോക്ക്',
      'പാൽ ബാക്കി എത്ര',
      'വെളിച്ചെണ്ണ സ്റ്റോക്ക് ചെക്ക്',
      'ചായപ്പൊടി ഉണ്ടോ',
      'ഉപ്പ് എത്ര കിലോ ഉണ്ട്',
      'ഗോതമ്പ് പൊടി സ്റ്റോക്ക്',
      'check rice stock',
      'how much sugar left',
      'is soap available',
      'stock check milk',
      'tea powder stock',
    ],
    parameters: [
      { displayName: 'product', entityTypeDisplayName: '@product', mandatory: true, prompts: ['ഏത് സാധനത്തിന്റെ സ്റ്റോക്ക്?'] },
    ],
    messages: [{ text: { text: ['$product സ്റ്റോക്ക് ചെക്ക് ചെയ്യുന്നു'] } }],
  },
  {
    displayName: 'inventory.add',
    trainingPhrases: [
      '50 കിലോ അരി സ്റ്റോക്കിൽ ചേർക്കുക',
      'അരി 100 kg സ്റ്റോക്ക് ആഡ്',
      '20 സോപ്പ് സ്റ്റോക്ക് ചേർക്കൂ',
      'പഞ്ചസാര 30 കിലോ ചേർക്കൂ സ്റ്റോക്കിൽ',
      '10 ലിറ്റർ വെളിച്ചെണ്ണ സ്റ്റോക്ക്',
      'സ്റ്റോക്ക് അപ്ഡേറ്റ് അരി 200',
      '5 kg ചായപ്പൊടി സ്റ്റോക്കിൽ',
      'add 50 kg rice to stock',
      'add stock sugar 30 kg',
      'update stock soap 20',
      'restock milk 25 litre',
    ],
    parameters: [
      { displayName: 'product', entityTypeDisplayName: '@product', mandatory: true, prompts: ['ഏത് സാധനം സ്റ്റോക്കിൽ ചേർക്കണം?'] },
      { displayName: 'number', entityTypeDisplayName: '@sys.number', mandatory: true, prompts: ['എത്ര ചേർക്കണം?'] },
      { displayName: 'unit', entityTypeDisplayName: '@unit', mandatory: false },
    ],
    messages: [{ text: { text: ['ശരി, $number $unit $product സ്റ്റോക്കിൽ ചേർത്തു'] } }],
  },

  // ---- PAYMENT ----
  {
    displayName: 'payment.upi',
    trainingPhrases: [
      'QR കാണിക്കൂ',
      'GPay',
      'UPI പേമെന്റ്',
      'ജിപേ ആയിട്ട്',
      'ഗൂഗിൾ പേ',
      'ഫോൺ പേ',
      'QR കോഡ്',
      'യുപിഐ',
      'ഓൺലൈൻ പേമെന്റ്',
      'show QR',
      'pay by UPI',
      'google pay',
      'phone pe',
      'show QR code',
      'UPI payment',
    ],
    parameters: [],
    messages: [{ text: { text: ['QR കോഡ് കാണിക്കുന്നു'] } }],
  },
  {
    displayName: 'payment.cash',
    trainingPhrases: [
      'കാഷ്',
      'കാശ് ആയിട്ട്',
      'പണം',
      'കൈയിൽ തരുന്നു',
      'ക്യാഷ് പേമെന്റ്',
      'cash payment',
      'pay cash',
      'cash',
      'by hand',
    ],
    parameters: [],
    messages: [{ text: { text: ['ശരി, കാഷ് പേമെന്റ്'] } }],
  },

  // ---- REPORTS ----
  {
    displayName: 'report.today',
    trainingPhrases: [
      'ഇന്നത്തെ സെയിൽസ്',
      'ഇന്ന് എത്ര വിറ്റു',
      'ഇന്നത്തെ റിപ്പോർട്ട്',
      'ടുഡേ സെയിൽസ്',
      'ഇന്നത്തെ കച്ചവടം',
      'ഇന്ന് എത്ര ആയി',
      'today sales',
      'today report',
      'sales today',
      'how much sold today',
    ],
    parameters: [],
    messages: [{ text: { text: ['ഇന്നത്തെ സെയിൽസ് റിപ്പോർട്ട് കാണിക്കുന്നു'] } }],
  },
  {
    displayName: 'report.week',
    trainingPhrases: [
      'ഈ ആഴ്ചയിലെ സെയിൽസ്',
      'വീക്ക്‌ലി റിപ്പോർട്ട്',
      'ഈ ആഴ്ച എത്ര വിറ്റു',
      'ആഴ്ചയിലെ കണക്ക്',
      'weekly sales',
      'this week report',
      'week sales',
      'weekly report',
    ],
    parameters: [],
    messages: [{ text: { text: ['ഈ ആഴ്ചയിലെ റിപ്പോർട്ട് കാണിക്കുന്നു'] } }],
  },

  // ---- NAVIGATION ----
  {
    displayName: 'navigation.billing',
    trainingPhrases: [
      'ബില്ലിംഗ് പേജ്',
      'ബിൽ ചെയ്യാൻ',
      'ബില്ലിംഗിലേക്ക്',
      'go to billing',
      'open billing',
      'billing page',
    ],
    parameters: [],
    messages: [{ text: { text: ['ബില്ലിംഗ് പേജ് തുറക്കുന്നു'] } }],
  },
  {
    displayName: 'navigation.inventory',
    trainingPhrases: [
      'ഇൻവെന്ററി പേജ്',
      'സ്റ്റോക്ക് പേജ്',
      'സാധനങ്ങൾ കാണാൻ',
      'go to inventory',
      'open inventory',
      'stock page',
    ],
    parameters: [],
    messages: [{ text: { text: ['ഇൻവെന്ററി പേജ് തുറക്കുന്നു'] } }],
  },

  // ---- GENERAL ----
  {
    displayName: 'general.greeting',
    trainingPhrases: [
      'ഹലോ',
      'ഹായ്',
      'നമസ്കാരം',
      'സുപ്രഭാതം',
      'ശുഭദിനം',
      'hello',
      'hi',
      'good morning',
      'hey',
    ],
    parameters: [],
    messages: [{ text: { text: ['നമസ്കാരം! ഞാൻ നിങ്ങളുടെ ഷോപ്പ് അസിസ്റ്റന്റ് ആണ്. എന്ത് സഹായം വേണം?'] } }],
  },
  {
    displayName: 'general.help',
    trainingPhrases: [
      'സഹായം',
      'ഹെൽപ്',
      'എന്ത് ചെയ്യാൻ പറ്റും',
      'എങ്ങനെ ഉപയോഗിക്കും',
      'help',
      'what can you do',
      'how to use',
      'help me',
    ],
    parameters: [],
    messages: [{ text: { text: ['നിങ്ങൾക്ക് ബില്ലിംഗ്, സ്റ്റോക്ക് ചെക്ക്, പേമെന്റ്, റിപ്പോർട്ട് എന്നിവ ചെയ്യാം. ഉദാഹരണം: "2 കിലോ അരി" എന്ന് പറയൂ.'] } }],
  },
  {
    displayName: 'general.confirm',
    trainingPhrases: [
      'ശരി',
      'ഉവ്വ്',
      'ഓക്കേ',
      'ആയിക്കോട്ടെ',
      'അതെ',
      'yes',
      'ok',
      'okay',
      'sure',
      'confirm',
      'ഓകെ',
    ],
    parameters: [],
    messages: [{ text: { text: ['ശരി!'] } }],
  },
  {
    displayName: 'general.cancel',
    trainingPhrases: [
      'വേണ്ട',
      'ക്യാൻസൽ',
      'നിർത്ത്',
      'പോരെ',
      'അല്ല',
      'no',
      'cancel',
      'stop',
      'never mind',
      'നിർത്തൂ',
    ],
    parameters: [],
    messages: [{ text: { text: ['ശരി, റദ്ദാക്കി'] } }],
  },
  {
    displayName: 'general.addmore',
    trainingPhrases: [
      'ഇനിയും വേണം',
      'കൂടി',
      'കൂടി ആഡ് ചെയ്യൂ',
      'ഇനിയും ഉണ്ട്',
      'വേറെയും',
      'more items',
      'add more',
      'anything else',
      'continue',
    ],
    parameters: [],
    messages: [{ text: { text: ['ശരി, ഇനിയും പറയൂ'] } }],
  },
];

// ============================================================
// MAIN SETUP FLOW
// ============================================================

async function listExistingIntents() {
  console.log('\n📋 Listing existing intents...');
  const data = await apiCall('GET', '/intents');
  if (data && data.intents) {
    return data.intents;
  }
  return [];
}

async function listExistingEntityTypes() {
  console.log('\n📋 Listing existing entity types...');
  const data = await apiCall('GET', '/entityTypes');
  if (data && data.entityTypes) {
    return data.entityTypes;
  }
  return [];
}

async function deleteIntent(intentName) {
  // intentName is the full resource name like projects/xxx/agent/intents/yyy
  const id = intentName.split('/').pop();
  await apiCall('DELETE', `/intents/${id}`);
}

async function deleteEntityType(entityTypeName) {
  const id = entityTypeName.split('/').pop();
  await apiCall('DELETE', `/entityTypes/${id}`);
}

async function createEntityType(entityType) {
  console.log(`  Creating entity: ${entityType.displayName}`);
  const result = await apiCall('POST', '/entityTypes', entityType);
  if (result) {
    console.log(`    ✅ Created: ${entityType.displayName} (${entityType.entities.length} entries)`);
  }
  return result;
}

async function createIntent(intent) {
  console.log(`  Creating intent: ${intent.displayName}`);

  // Build training phrases in Dialogflow format
  const trainingPhrases = intent.trainingPhrases.map(phrase => ({
    type: 'EXAMPLE',
    parts: [{ text: phrase }],
  }));

  // Build parameters
  const parameters = intent.parameters.map(param => ({
    displayName: param.displayName,
    entityTypeDisplayName: param.entityTypeDisplayName,
    mandatory: param.mandatory || false,
    prompts: param.prompts || [],
    value: `$${param.displayName}`,
  }));

  const body = {
    displayName: intent.displayName,
    trainingPhrases,
    parameters,
    messages: intent.messages,
  };

  const result = await apiCall('POST', '/intents', body);
  if (result) {
    console.log(`    ✅ Created: ${intent.displayName} (${intent.trainingPhrases.length} phrases)`);
  }
  return result;
}

async function testDetectIntent(text, lang = 'ml') {
  const sessionId = 'test-session-' + Date.now();
  const url = `/sessions/${sessionId}:detectIntent`;
  const body = {
    queryInput: {
      text: { text, languageCode: lang },
    },
  };
  const result = await apiCall('POST', url, body);
  if (result && result.queryResult) {
    const qr = result.queryResult;
    return {
      query: text,
      intent: qr.intent?.displayName || 'unknown',
      confidence: qr.intentDetectionConfidence || 0,
      parameters: qr.parameters || {},
      fulfillment: qr.fulfillmentText || '',
    };
  }
  return null;
}

async function main() {
  console.log('🚀 Dialogflow ES Setup for Shopkeeper AI Assistant');
  console.log(`   Project: ${PROJECT_ID}`);
  console.log('');

  // Step 1: Test auth
  console.log('🔑 Authenticating...');
  try {
    ACCESS_TOKEN = await getAccessToken();
    console.log('   ✅ Authenticated successfully\n');
  } catch (err) {
    console.error('   ❌ Authentication failed:', err.message);
    process.exit(1);
  }

  // Step 2: Clean up existing custom intents and entities
  console.log('🧹 Cleaning up existing custom intents...');
  const existingIntents = await listExistingIntents();
  const customIntents = existingIntents.filter(i => {
    const name = i.displayName;
    return !name.startsWith('Default ') && INTENTS.some(ni => ni.displayName === name);
  });
  for (const intent of customIntents) {
    console.log(`   Deleting: ${intent.displayName}`);
    await deleteIntent(intent.name);
  }

  console.log('\n🧹 Cleaning up existing custom entity types...');
  const existingEntities = await listExistingEntityTypes();
  const customEntities = existingEntities.filter(e => {
    return ENTITY_TYPES.some(ne => ne.displayName === e.displayName);
  });
  for (const entity of customEntities) {
    console.log(`   Deleting: ${entity.displayName}`);
    await deleteEntityType(entity.name);
  }

  // Step 3: Create entity types
  console.log('\n📦 Creating entity types...');
  for (const entityType of ENTITY_TYPES) {
    await createEntityType(entityType);
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  // Step 4: Create intents
  console.log('\n🎯 Creating intents...');
  for (const intent of INTENTS) {
    await createIntent(intent);
    await new Promise(r => setTimeout(r, 500));
  }

  // Step 5: Train the agent
  console.log('\n🏋️ Training agent...');
  try {
    const trainRes = await fetch(`${BASE_URL}/train`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    });
    console.log(`   Training response: ${trainRes.status} ${trainRes.statusText}`);
    if (trainRes.ok || trainRes.status === 200) {
      console.log('   ✅ Training initiated');
    }
  } catch (e) {
    console.log('   ⚠️ Train API call failed (agent auto-trains on changes, this is OK)');
  }

  // Wait for training
  console.log('   ⏳ Waiting 15 seconds for training to complete...');
  await new Promise(r => setTimeout(r, 15000));

  // Step 6: Test with sample queries
  console.log('\n🧪 Testing intent detection...\n');
  const testCases = [
    { text: 'രണ്ട് കിലോ അരി', lang: 'ml', expected: 'billing.add' },
    { text: 'അരി സ്റ്റോക്ക് എത്ര', lang: 'ml', expected: 'inventory.check' },
    { text: 'ടോട്ടൽ എത്ര', lang: 'ml', expected: 'billing.total' },
    { text: 'QR കാണിക്കൂ', lang: 'ml', expected: 'payment.upi' },
    { text: 'ശരി', lang: 'ml', expected: 'general.confirm' },
    { text: 'ഇന്നത്തെ സെയിൽസ്', lang: 'ml', expected: 'report.today' },
    { text: 'ബിൽ ക്ലിയർ ചെയ്യൂ', lang: 'ml', expected: 'billing.clear' },
    { text: 'add rice 2 kg', lang: 'en', expected: 'billing.add' },
  ];

  let passed = 0;
  for (const tc of testCases) {
    const result = await testDetectIntent(tc.text, tc.lang);
    if (result) {
      const match = result.intent === tc.expected;
      const icon = match ? '✅' : '❌';
      console.log(`   ${icon} "${tc.text}" → ${result.intent} (${(result.confidence * 100).toFixed(0)}%) ${match ? '' : `[expected: ${tc.expected}]`}`);
      if (match) passed++;
    } else {
      console.log(`   ❌ "${tc.text}" → FAILED`);
    }
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n📊 Test Results: ${passed}/${testCases.length} passed`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ SETUP COMPLETE');
  console.log('='.repeat(60));
  console.log(`   Entity Types: ${ENTITY_TYPES.length} created`);
  console.log(`   Intents: ${INTENTS.length} created`);
  console.log(`   Total Training Phrases: ${INTENTS.reduce((sum, i) => sum + i.trainingPhrases.length, 0)}`);
  console.log(`   Tests: ${passed}/${testCases.length} passed`);
  console.log('');
}

main().catch(console.error);
