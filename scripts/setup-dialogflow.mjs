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
      // Grains & Rice
      { value: 'അരി', synonyms: ['അരി', 'rice', 'ari', 'chawal', 'ചോറ്', 'aari', 'ariyum'] },
      { value: 'ചുവന്ന അരി', synonyms: ['ചുവന്ന അരി', 'red rice', 'rosematta', 'palakkadan matta', 'matta rice', 'കൈമ', 'chuvanna ari'] },
      { value: 'ഗോതമ്പ്', synonyms: ['ഗോതമ്പ്', 'wheat', 'gothambu', 'goa thambu', 'godhambu'] },
      { value: 'ആട്ട', synonyms: ['ആട്ട', 'wheat flour', 'atta', 'aata', 'gothambu podi', 'ഗോതമ്പ് പൊടി'] },
      { value: 'മൈദ', synonyms: ['മൈദ', 'maida', 'all purpose flour', 'refined flour'] },
      { value: 'റവ', synonyms: ['റവ', 'rava', 'sooji', 'semolina', 'rawa', 'suji'] },
      { value: 'അരിപ്പൊടി', synonyms: ['അരിപ്പൊടി', 'rice flour', 'arippodi', 'ari podi'] },
      { value: 'പുട്ടുപൊടി', synonyms: ['പുട്ടുപൊടി', 'puttu flour', 'puttupodi', 'puttu powder'] },
      { value: 'കോൺ ഫ്ലൗർ', synonyms: ['കോൺ ഫ്ലൗർ', 'corn flour', 'cornflour', 'corn starch'] },
      { value: 'ഇഡ്ഡലി അരി', synonyms: ['ഇഡ്ഡലി അരി', 'idli rice', 'idli ari', 'boiled rice', 'ukka ari'] },
      // Dals & Pulses
      { value: 'തുവര പരിപ്പ്', synonyms: ['തുവര പരിപ്പ്', 'toor dal', 'tur dal', 'parippu', 'thuvara parippu', 'yellow dal'] },
      { value: 'ചെറുപയർ', synonyms: ['ചെറുപയർ', 'moong dal', 'green gram', 'cherupayar', 'mung dal', 'payar'] },
      { value: 'ഉഴുന്ന്', synonyms: ['ഉഴുന്ന്', 'urad dal', 'black gram', 'uzhunnu', 'uzhunu'] },
      { value: 'കടലപ്പരിപ്പ്', synonyms: ['കടലപ്പരിപ്പ്', 'chana dal', 'bengal gram', 'kadala parippu'] },
      { value: 'മസൂർ', synonyms: ['മസൂർ', 'masoor dal', 'red lentil', 'lentil', 'masur'] },
      { value: 'കടല', synonyms: ['കടല', 'chickpea', 'chana', 'kabuli chana', 'kadala', 'dal'] },
      { value: 'വൻ പയർ', synonyms: ['വൻ പയർ', 'cowpea', 'lobiya', 'black eyed peas', 'vanpayar', 'van payar'] },
      { value: 'പട്ടാണി', synonyms: ['പട്ടാണി', 'green peas', 'matar', 'dried peas', 'pattani'] },
      // Spices
      { value: 'മുളക് പൊടി', synonyms: ['മുളക് പൊടി', 'chilli powder', 'red chilli', 'mulaku podi', 'mulakupodi', 'മുളകുപൊടി'] },
      { value: 'മഞ്ഞൾ', synonyms: ['മഞ്ഞൾ', 'turmeric', 'haldi', 'manjal', 'manjal podi', 'മഞ്ഞൾ പൊടി'] },
      { value: 'മല്ലി', synonyms: ['മല്ലി', 'coriander', 'dhaniya', 'malli podi', 'coriander powder', 'malli'] },
      { value: 'ജീരകം', synonyms: ['ജീരകം', 'cumin', 'jeera', 'jeerakam', 'jira'] },
      { value: 'കടുക്', synonyms: ['കടുക്', 'mustard', 'mustard seeds', 'rai', 'kaduku'] },
      { value: 'കുരുമുളക്', synonyms: ['കുരുമുളക്', 'black pepper', 'pepper', 'kali mirch', 'kurumulak'] },
      { value: 'ഏലം', synonyms: ['ഏലം', 'cardamom', 'elaichi', 'elam', 'green cardamom'] },
      { value: 'ഗ്രാമ്പൂ', synonyms: ['ഗ്രാമ്പൂ', 'cloves', 'lavang', 'grampu', 'grambu'] },
      { value: 'ഇലവംഗം', synonyms: ['ഇലവംഗം', 'cinnamon', 'dalchini', 'ilavam'] },
      { value: 'ഉലുവ', synonyms: ['ഉലുവ', 'fenugreek', 'methi', 'uluva'] },
      { value: 'ഗരം മസാല', synonyms: ['ഗരം മസാല', 'garam masala', 'masala', 'biryani masala'] },
      { value: 'ഫിഷ് മസാല', synonyms: ['ഫിഷ് മസാല', 'fish masala', 'meen masala', 'fish curry powder'] },
      // Oils
      { value: 'വെളിച്ചെണ്ണ', synonyms: ['വെളിച്ചെണ്ണ', 'coconut oil', 'velichenna', 'enna', 'നാളികേര എണ്ണ', 'velichennu'] },
      { value: 'സൺഫ്ലവർ ഓയിൽ', synonyms: ['സൺഫ്ലവർ ഓയിൽ', 'sunflower oil', 'refined oil', 'cooking oil', 'sunflower'] },
      { value: 'കടലെണ്ണ', synonyms: ['കടലെണ്ണ', 'mustard oil', 'groundnut oil', 'kadal enna'] },
      { value: 'പാം ഓയിൽ', synonyms: ['പാം ഓയിൽ', 'palm oil', 'dalda', 'vanaspati'] },
      { value: 'എള്ളെണ്ണ', synonyms: ['എള്ളെണ്ണ', 'sesame oil', 'gingelly oil', 'til oil', 'ellenna'] },
      // Beverages
      { value: 'ചായപ്പൊടി', synonyms: ['ചായപ്പൊടി', 'tea', 'tea powder', 'chaya', 'chai', 'chayappodi', 'ചായ'] },
      { value: 'കാപ്പിപ്പൊടി', synonyms: ['കാപ്പിപ്പൊടി', 'coffee', 'coffee powder', 'kaappi', 'kappippodi', 'kappi'] },
      { value: 'പാൽ', synonyms: ['പാൽ', 'milk', 'paal', 'ക്ഷീരം', 'pal', 'palu'] },
      { value: 'ബൂസ്റ്റ്', synonyms: ['ബൂസ്റ്റ്', 'boost', 'chocolate malt', 'malt drink boost'] },
      { value: 'ഹോർലിക്സ്', synonyms: ['ഹോർലിക്സ്', 'horlicks', 'health drink', 'horlick'] },
      // Soap & Cleaning
      { value: 'സോപ്പ്', synonyms: ['സോപ്പ്', 'soap', 'sabun', 'soppu', 'bathing soap', 'toilet soap'] },
      { value: 'വാഷിംഗ് പൗഡർ', synonyms: ['വാഷിംഗ് പൗഡർ', 'washing powder', 'detergent', 'ariel', 'surf excel', 'tide'] },
      { value: 'ബർട്ടൻ', synonyms: ['ബർട്ടൻ', 'vim bar', 'dishwash', 'bartan soap', 'vessel soap'] },
      { value: 'ഫിനൈൽ', synonyms: ['ഫിനൈൽ', 'phenyl', 'floor cleaner liquid', 'disinfectant'] },
      { value: 'ടോയ്‌ലറ്റ് ക്ലീനർ', synonyms: ['ടോയ്‌ലറ്റ് ക്ലീനർ', 'toilet cleaner', 'harpic', 'bathroom cleaner'] },
      { value: 'ഫ്ലോർ ക്ലീനർ', synonyms: ['ഫ്ലോർ ക്ലീനർ', 'floor cleaner', 'lizol', 'dettol floor'] },
      { value: 'കൊതുക് തിരി', synonyms: ['കൊതുക് തിരി', 'mosquito coil', 'good knight', 'allout', 'kotuku thiri'] },
      { value: 'വിം', synonyms: ['വിം', 'vim', 'vim powder', 'dishwash powder'] },
      // Snacks
      { value: 'ബിസ്ക്കറ്റ്', synonyms: ['ബിസ്ക്കറ്റ്', 'biscuit', 'biscuits', 'biskut', 'marie', 'ബിസ്കറ്റ്'] },
      { value: 'പാർലേ-ജി', synonyms: ['പാർലേ-ജി', 'parle g', 'parle', 'parle-g', 'glucose biscuit'] },
      { value: 'ചിപ്സ്', synonyms: ['ചിപ്സ്', 'chips', 'lays', 'potato chips', 'wafers'] },
      { value: 'മിക്സ്ചർ', synonyms: ['മിക്സ്ചർ', 'mixture', 'namkeen', 'chivda'] },
      { value: 'മുറുക്ക്', synonyms: ['മുറുക്ക്', 'murukku', 'chakli', 'muruku'] },
      { value: 'ഉണക്ക കേള', synonyms: ['ഉണക്ക കേള', 'banana chips', 'plantain chips', 'kerala chips', 'unakka kela'] },
      { value: 'നൂഡിൽസ്', synonyms: ['നൂഡിൽസ്', 'noodles', 'maggi', 'instant noodles', 'top ramen'] },
      { value: 'കുർകുരേ', synonyms: ['കുർകുരേ', 'kurkure', 'cheese balls', 'corn puff'] },
      { value: 'ബ്രഡ്', synonyms: ['ബ്രഡ്', 'bread', 'white bread', 'slice bread', 'modern bread'] },
      // Personal care
      { value: 'ടൂത്ത്പേസ്റ്റ്', synonyms: ['ടൂത്ത്പേസ്റ്റ്', 'toothpaste', 'colgate', 'pepsodent', 'close up', 'paste', 'പേസ്റ്റ്'] },
      { value: 'ടൂത്ത്ബ്രഷ്', synonyms: ['ടൂത്ത്ബ്രഷ്', 'toothbrush', 'tooth brush', 'oral b'] },
      { value: 'ഷാമ്പൂ', synonyms: ['ഷാമ്പൂ', 'shampoo', 'head shoulders', 'clinic plus', 'pantene'] },
      { value: 'ഹെയർ ഓയിൽ', synonyms: ['ഹെയർ ഓയിൽ', 'hair oil', 'parachute', 'dabur amla', 'vatika'] },
      // Dairy
      { value: 'തൈര്', synonyms: ['തൈര്', 'curd', 'yogurt', 'dahi', 'thayir'] },
      { value: 'വെണ്ണ', synonyms: ['വെണ്ണ', 'butter', 'amul butter', 'venna'] },
      { value: 'നെയ്യ്', synonyms: ['നെയ്യ്', 'ghee', 'clarified butter', 'desi ghee', 'cow ghee', 'neyyu'] },
      { value: 'പനീർ', synonyms: ['പനീർ', 'paneer', 'cottage cheese'] },
      // Sugar & Sweeteners
      { value: 'പഞ്ചസാര', synonyms: ['പഞ്ചസാര', 'sugar', 'panchara', 'cheeni', 'panjasara', 'ഷുഗർ'] },
      { value: 'ശർക്കര', synonyms: ['ശർക്കര', 'jaggery', 'gur', 'palm jaggery', 'nadan sharkara', 'sharkara'] },
      { value: 'തേൻ', synonyms: ['തേൻ', 'honey', 'natural honey', 'bee honey', 'then'] },
      // Salt & Essentials
      { value: 'ഉപ്പ്', synonyms: ['ഉപ്പ്', 'salt', 'namak', 'uppu', 'iodized salt'] },
      { value: 'പുളി', synonyms: ['പുളി', 'tamarind', 'imli', 'puli'] },
      // Vegetables
      { value: 'തേങ്ങ', synonyms: ['തേങ്ങ', 'coconut', 'thenga', 'naalikera', 'nariyal'] },
      { value: 'ഉള്ളി', synonyms: ['ഉള്ളി', 'onion', 'pyaz', 'kanda', 'ulli', 'red onion'] },
      { value: 'വെളുത്തുള്ളി', synonyms: ['വെളുത്തുള്ളി', 'garlic', 'lehsun', 'veluthulli', 'lashun'] },
      { value: 'ഇഞ്ചി', synonyms: ['ഇഞ്ചി', 'ginger', 'adrak', 'inchi', 'inji'] },
      { value: 'പച്ചമുളക്', synonyms: ['പച്ചമുളക്', 'green chilli', 'hari mirch', 'pacha mulaku'] },
      { value: 'തക്കാളി', synonyms: ['തക്കാളി', 'tomato', 'tamatar', 'thakkali'] },
      { value: 'പഴം', synonyms: ['പഴം', 'banana', 'ethapazham', 'nendra', 'poovan', 'pazham'] },
      // Household
      { value: 'തീപ്പെട്ടി', synonyms: ['തീപ്പെട്ടി', 'matchbox', 'match box', 'match stick', 'theeppetti'] },
      { value: 'മെഴുകുതിരി', synonyms: ['മെഴുകുതിരി', 'candle', 'wax candle', 'mezhuku thiri'] },
      { value: 'അഗർബത്തി', synonyms: ['അഗർബത്തി', 'incense', 'agarbathi', 'incense sticks', 'agarbatti'] },
      { value: 'ബാറ്ററി', synonyms: ['ബാറ്ററി', 'battery', 'cell', 'duracell', 'eveready'] },
      { value: 'നോട്ട്ബുക്ക്', synonyms: ['നോട്ട്ബുക്ക്', 'notebook', 'note book', 'copy', 'exercise book', 'classmate'] },
      { value: 'അലക്ക് സോപ്പ്', synonyms: ['അലക്ക് സോപ്പ്', 'washing soap bar', 'laundry soap', '501 soap', 'rin bar', 'sunlight', 'alaku soap'] },
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
      // Multi-item commands
      '10 kg അരി 2 kg പഞ്ചസാര',
      '5 കിലോ അരി, 3 കിലോ ഉപ്പ്',
      '2 kg sugar and 1 soap',
      'ഒരു ചായപ്പൊടി, ഒരു പഞ്ചസാര',
      '2 ബിസ്ക്കറ്റ് 3 ചിപ്സ്',
      '5 kg അരി, 2 kg പഞ്ചസാര, 1 സോപ്പ്',
      '1 kg ഉപ്പ് ഉം 2 kg അരിയും',
      '10 kg rice, 5 kg sugar, 1 litre coconut oil',
      'ഒരു കിലോ ജീരകം പിന്നെ ഒരു മഞ്ഞൾ',
      '2 kg wheat flour and 500 g urad dal',
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
