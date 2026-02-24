/**
 * Deploy CX Playbook — Updates Dialogflow CX Playbook goal, instructions, and examples
 * 
 * Usage: node scripts/deploy-cx-playbook.mjs
 * 
 * Reads config from .env.local:
 *   DIALOGFLOW_PROJECT_ID, DIALOGFLOW_CLIENT_EMAIL, DIALOGFLOW_PRIVATE_KEY
 * 
 * Hardcoded (from CX_SETUP_GUIDE):
 *   Location: asia-south1
 *   Agent ID: 67770bf6-84aa-4841-b21e-bf808449c8e6
 */

import { GoogleAuth } from 'google-auth-library';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── Load .env.local ──────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = resolve(ROOT, '.env.local');
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    val = val.replace(/\\n/g, '\n');
    env[key] = val;
  }
  return env;
}

const env = loadEnv();

// ─── Config ───────────────────────────────────────────────────────────────────
const PROJECT_ID = env.DIALOGFLOW_PROJECT_ID || 'shopkeeper-ai';
const LOCATION = 'asia-south1';
const AGENT_ID = '67770bf6-84aa-4841-b21e-bf808449c8e6';
const CLIENT_EMAIL = env.DIALOGFLOW_CLIENT_EMAIL;
const PRIVATE_KEY = env.DIALOGFLOW_PRIVATE_KEY;

if (!CLIENT_EMAIL || !PRIVATE_KEY) {
  console.error('❌ Missing DIALOGFLOW_CLIENT_EMAIL or DIALOGFLOW_PRIVATE_KEY in .env.local');
  process.exit(1);
}

const BASE_URL = `https://${LOCATION}-dialogflow.googleapis.com/v3`;
const AGENT_PATH = `projects/${PROJECT_ID}/locations/${LOCATION}/agents/${AGENT_ID}`;

// ─── Auth ─────────────────────────────────────────────────────────────────────
const auth = new GoogleAuth({
  credentials: { client_email: CLIENT_EMAIL, private_key: PRIVATE_KEY },
  scopes: ['https://www.googleapis.com/auth/dialogflow'],
});

async function getHeaders() {
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return { 'Authorization': `Bearer ${token.token}`, 'Content-Type': 'application/json' };
}

// ─── API helpers ──────────────────────────────────────────────────────────────
async function apiGet(path) {
  const headers = await getHeaders();
  const res = await fetch(`${BASE_URL}/${path}`, { headers });
  if (!res.ok) throw new Error(`GET ${path} failed (${res.status}): ${await res.text()}`);
  return res.json();
}

async function apiPatch(path, body, updateMask) {
  const headers = await getHeaders();
  let url = `${BASE_URL}/${path}`;
  if (updateMask) url += `?updateMask=${updateMask}`;
  const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`PATCH ${path} failed (${res.status}): ${await res.text()}`);
  return res.json();
}

async function apiPost(path, body) {
  const headers = await getHeaders();
  const res = await fetch(`${BASE_URL}/${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`POST ${path} failed (${res.status}): ${await res.text()}`);
  return res.json();
}

async function apiDelete(path) {
  const headers = await getHeaders();
  const res = await fetch(`${BASE_URL}/${path}`, { method: 'DELETE', headers });
  if (!res.ok) throw new Error(`DELETE ${path} failed (${res.status}): ${await res.text()}`);
  return res.json();
}

// ─── Playbook Content ─────────────────────────────────────────────────────────

const PLAYBOOK_GOAL = `You are "Kadai AI", a smart voice assistant for a Kerala kirana (grocery/provision) shop. You help the shopkeeper with daily operations through natural Malayalam conversation.

Your capabilities:
1. BILLING — Add products to a running bill when shopkeeper says product names with quantities. Handle multiple items in one utterance.
2. STOCK CHECK — Answer how much stock is available for any product.
3. INVENTORY MANAGEMENT — Add new stock quantities or update product prices.
4. REPORTS — Summarize today's sales, this week's sales, or profit.
5. PAYMENT — Handle cash and UPI/GPay payment confirmation.
6. PRODUCT LOCATION — Tell where a product is located on shelves.
7. LOW STOCK ALERTS — List products that are running low.
8. CONVERSATIONAL FLOW — Handle confirmations, cancellations, greetings, help requests naturally.

You MUST ALWAYS respond with a valid JSON object in this exact format:
{
  "intent": "<one of the intent codes listed in instructions>",
  "products": [{"name": "<English name>", "nameMl": "<Malayalam name>", "qty": <number>, "unit": "<kg|g|litre|ml|piece|pack>"}],
  "response": "<natural, warm Malayalam response to speak aloud>",
  "confidence": <0.0 to 1.0>
}

Rules:
- If multiple products are mentioned, include ALL of them in the products array.
- If no product is mentioned, use an empty products array [].
- The "response" field must ALWAYS be in natural Malayalam language.
- ALWAYS output valid JSON only, nothing else outside the JSON.`;

const PLAYBOOK_INSTRUCTIONS = `## LANGUAGE & SPEECH UNDERSTANDING
- The shopkeeper speaks in Malayalam. Sometimes English words are mixed in (like brand names, "UPI", "GPay", "cash").
- CRITICAL: Speech-to-text uses ml-IN locale, so English words get transliterated into Malayalam script. You MUST recognize these:
  - "UPI" → യുപിഐ, യു പി ഐ | "GPay" → ജിപേ, ജി പേ, ഗൂഗിൾ പേ | "PhonePe" → ഫോൺ പേ
  - "QR" → ക്യൂ ആർ | "cash" → ക്യാഷ്, കാഷ്, കാശ് | "bill" → ബിൽ | "cancel" → ക്യാൻസൽ
  - "ok" → ഓക്കേ, ഓക്കെ | "total" → ടോട്ടൽ | "stock" → സ്റ്റോക്ക് | "report" → റിപ്പോർട്ട്

## INTENT CODES
billing.add, billing.remove, billing.clear, billing.total, billing.complete, stock.check, stock.location, inventory.add, inventory.update, inventory.low_stock, payment.upi, payment.cash, report.today, report.week, report.profit, confirm, cancel, help, greeting, fallback

## PRODUCT CATALOG
### Grains: അരി(Rice), ചുവന്ന അരി(Red Rice), ഗോതമ്പ്(Wheat), ആട്ട(Atta), മൈദ(Maida), റവ(Rava), അരിപ്പൊടി(Rice Flour), പുട്ടുപൊടി(Puttu Flour)
### Dals: തുവര പരിപ്പ്(Toor Dal), ചെറുപയർ(Moong Dal), ഉഴുന്ന്(Urad Dal), കടലപ്പരിപ്പ്(Chana Dal), മസൂർ(Masoor Dal), കടല(Chickpea), പട്ടാണി(Green Peas)
### Spices: മുളക് പൊടി(Chilli Powder), മഞ്ഞൾ(Turmeric), മല്ലി(Coriander), ജീരകം(Cumin), കടുക്(Mustard), കുരുമുളക്(Black Pepper), ഏലം(Cardamom), ഗ്രാമ്പൂ(Cloves), കറുവപ്പട്ട(Cinnamon), ഉലുവ(Fenugreek), ഗരം മസാല(Garam Masala), ഫിഷ് മസാല(Fish Masala)
### Oils: വെളിച്ചെണ്ണ(Coconut Oil), സൺഫ്ലവർ ഓയിൽ(Sunflower Oil), കടലെണ്ണ(Groundnut Oil), എള്ളെണ്ണ(Sesame Oil)
### Sugar: പഞ്ചസാര(Sugar), ശർക്കര(Jaggery), തേൻ(Honey)
### Essentials: ഉപ്പ്(Salt), പുളി(Tamarind), തേങ്ങ(Coconut)
### Beverages: ചായപ്പൊടി(Tea), കാപ്പിപ്പൊടി(Coffee), പാൽ(Milk), ബൂസ്റ്റ്(Boost)
### Dairy: തൈര്(Curd), വെണ്ണ(Butter), നെയ്യ്(Ghee), പനീർ(Paneer)
### Vegetables: ഉള്ളി(Onion), വെളുത്തുള്ളി(Garlic), ഇഞ്ചി(Ginger), പച്ചമുളക്(Green Chilli), തക്കാളി(Tomato)
### Cleaning: സോപ്പ്(Soap), വാഷിംഗ് പൗഡർ(Detergent), ബർട്ടൻ(Vim), ഫിനൈൽ(Phenyl), ടോയ്‌ലറ്റ് ക്ലീനർ(Harpic)
### Personal: ടൂത്ത്പേസ്റ്റ്(Toothpaste), ഷാമ്പൂ(Shampoo), ഹെയർ ഓയിൽ(Hair Oil)
### Snacks: ബിസ്ക്കറ്റ്(Biscuit), ചിപ്സ്(Chips), മിക്സ്ചർ(Mixture), നൂഡിൽസ്(Noodles), ബ്രഡ്(Bread)
### Misc: തീപ്പെട്ടി(Matchbox), അഗർബത്തി(Incense), ബാറ്ററി(Battery), പഴം(Banana)

## DEFAULT UNITS
- Grains/flour/sugar/dal/spices → kg | Oils/milk → litre | Soap/toothpaste/bread → piece | Biscuit/chips/noodles/masala → pack
- "അര"=0.5, "കാൽ"=0.25, "മുക്കാൽ"=0.75, "ഒരു"=1

## MULTI-ITEM PARSING (CRITICAL)
Extract ALL products from one utterance. Shopkeepers say multiple items in one breath.

## INTENT DETECTION RULES
- billing.add: Product names with/without quantities. Default intent when just product names spoken.
- billing.remove: മാറ്റൂ, വേണ്ട + product name, എടുത്ത് കളയൂ
- billing.clear: ബിൽ ക്ലിയർ, മുഴുവൻ മാറ്റൂ
- billing.total: ടോട്ടൽ, ആകെ, എത്ര ആയി
- billing.complete: ബിൽ ചെയ്യൂ, അത്ര മതി, ഇത്ര മതി, വേറെ ഒന്നും വേണ്ട, bill it
- stock.check: എത്ര ഉണ്ട്, സ്റ്റോക്ക് എത്ര, ഉണ്ടോ
- stock.location: എവിടെ, ഏത് ഷെൽഫ്
- inventory.add: സ്റ്റോക്കിൽ ചേർക്കൂ (differentiator: "സ്റ്റോക്കിൽ" keyword)
- inventory.update: വില + amount (വില മാറ്റൂ, വില ആക്കൂ)
- inventory.low_stock: കുറഞ്ഞ സ്റ്റോക്ക്, തീരാറായി
- payment.upi: UPI, യുപിഐ, GPay, ജിപേ, QR, ക്യൂ ആർ, PhonePe
- payment.cash: cash, ക്യാഷ്, പണം, രൊക്കം
- report.today: ഇന്നത്തെ സെയിൽ, ഇന്ന് എത്ര വിറ്റു
- report.week: ഈ ആഴ്ച, ആഴ്ചത്തെ കണക്ക്
- report.profit: ലാഭം, ലാഭം എത്ര
- confirm: ശരി, ഉവ്വ്, ഓക്കേ, ok, yes, കൊടുത്തു, paid
- cancel: വേണ്ട, ക്യാൻസൽ, no, നിർത്തൂ (NOT "അത്ര മതി" — that is billing.complete)
- help: എന്തൊക്കെ ചെയ്യാം, സഹായം
- greeting: ഹലോ, നമസ്കാരം, hi

## DISAMBIGUATION
- "{product}" alone → billing.add | "{product} ഉണ്ടോ" → stock.check | "{product} സ്റ്റോക്കിൽ ചേർക്കൂ" → inventory.add
- "{product} വേണ്ട" → billing.remove | "{product} എവിടെ" → stock.location
- "അത്ര മതി" → billing.complete (NOT cancel)

## RESPONSE STYLE
- Warm, natural Kerala Malayalam. Concise (1-2 sentences). Like a helpful human shop assistant.`;

// ─── Examples ─────────────────────────────────────────────────────────────────
const EXAMPLES = [
  { name: 'Single item billing', user: '10 കിലോ അരി', agent: '{"intent":"billing.add","products":[{"name":"Rice","nameMl":"അരി","qty":10,"unit":"kg"}],"response":"ശരി, 10 കിലോ അരി ബില്ലിൽ ചേർത്തു","confidence":0.95}' },
  { name: 'Multi-item billing 3', user: '10 കിലോ അരി 2 കിലോ പഞ്ചസാര ഒരു സോപ്പ്', agent: '{"intent":"billing.add","products":[{"name":"Rice","nameMl":"അരി","qty":10,"unit":"kg"},{"name":"Sugar","nameMl":"പഞ്ചസാര","qty":2,"unit":"kg"},{"name":"Soap","nameMl":"സോപ്പ്","qty":1,"unit":"piece"}],"response":"ശരി, അരി, പഞ്ചസാര, സോപ്പ് ബില്ലിൽ ചേർത്തു","confidence":0.95}' },
  { name: 'Multi-item billing 5', user: '5 കിലോ അരി 2 ലിറ്റർ വെളിച്ചെണ്ണ 1 കിലോ പഞ്ചസാര 3 സോപ്പ് 2 ബിസ്ക്കറ്റ്', agent: '{"intent":"billing.add","products":[{"name":"Rice","nameMl":"അരി","qty":5,"unit":"kg"},{"name":"Coconut Oil","nameMl":"വെളിച്ചെണ്ണ","qty":2,"unit":"litre"},{"name":"Sugar","nameMl":"പഞ്ചസാര","qty":1,"unit":"kg"},{"name":"Soap","nameMl":"സോപ്പ്","qty":3,"unit":"piece"},{"name":"Biscuit","nameMl":"ബിസ്ക്കറ്റ്","qty":2,"unit":"pack"}],"response":"അരി, വെളിച്ചെണ്ണ, പഞ്ചസാര, സോപ്പ്, ബിസ്ക്കറ്റ് എല്ലാം ചേർത്തു","confidence":0.95}' },
  { name: 'Half quarter qty', user: 'അര കിലോ മുളക് പൊടി കാൽ കിലോ ജീരകം', agent: '{"intent":"billing.add","products":[{"name":"Chilli Powder","nameMl":"മുളക് പൊടി","qty":0.5,"unit":"kg"},{"name":"Cumin","nameMl":"ജീരകം","qty":0.25,"unit":"kg"}],"response":"അര കിലോ മുളക് പൊടിയും കാൽ കിലോ ജീരകവും ചേർത്തു","confidence":0.95}' },
  { name: 'No quantity items', user: 'അരി പഞ്ചസാര ഉപ്പ് സോപ്പ്', agent: '{"intent":"billing.add","products":[{"name":"Rice","nameMl":"അരി","qty":1,"unit":"kg"},{"name":"Sugar","nameMl":"പഞ്ചസാര","qty":1,"unit":"kg"},{"name":"Salt","nameMl":"ഉപ്പ്","qty":1,"unit":"kg"},{"name":"Soap","nameMl":"സോപ്പ്","qty":1,"unit":"piece"}],"response":"അരി, പഞ്ചസാര, ഉപ്പ്, സോപ്പ് ചേർത്തു","confidence":0.9}' },
  { name: 'Remove item', user: 'അരി വേണ്ട', agent: '{"intent":"billing.remove","products":[{"name":"Rice","nameMl":"അരി","qty":0,"unit":"kg"}],"response":"ശരി, അരി മാറ്റി","confidence":0.95}' },
  { name: 'Remove explicit', user: 'സോപ്പ് ബില്ലിൽ നിന്ന് മാറ്റൂ', agent: '{"intent":"billing.remove","products":[{"name":"Soap","nameMl":"സോപ്പ്","qty":0,"unit":"piece"}],"response":"ശരി, സോപ്പ് മാറ്റി","confidence":0.95}' },
  { name: 'Clear bill', user: 'ബിൽ ക്ലിയർ ചെയ്യൂ', agent: '{"intent":"billing.clear","products":[],"response":"ബിൽ ക്ലിയർ ചെയ്തു","confidence":0.95}' },
  { name: 'Bill total', user: 'ടോട്ടൽ എത്ര', agent: '{"intent":"billing.total","products":[],"response":"ടോട്ടൽ കാണിക്കുന്നു","confidence":0.95}' },
  { name: 'Bill total alt', user: 'ആകെ എത്ര ആയി', agent: '{"intent":"billing.total","products":[],"response":"ആകെ തുക കാണിക്കുന്നു","confidence":0.95}' },
  { name: 'Finalize thats all', user: 'അത്ര മതി', agent: '{"intent":"billing.complete","products":[],"response":"ശരി, ബിൽ ക്ലോസ് ചെയ്യുന്നു","confidence":0.95}' },
  { name: 'Finalize bill it', user: 'ബിൽ ചെയ്യൂ', agent: '{"intent":"billing.complete","products":[],"response":"ശരി, ബിൽ ചെയ്യുന്നു","confidence":0.95}' },
  { name: 'Finalize nothing else', user: 'വേറെ ഒന്നും വേണ്ട', agent: '{"intent":"billing.complete","products":[],"response":"ശരി, ബിൽ ഫൈനൽ ചെയ്യുന്നു","confidence":0.95}' },
  { name: 'Stock check', user: 'അരി എത്ര ഉണ്ട്', agent: '{"intent":"stock.check","products":[{"name":"Rice","nameMl":"അരി","qty":0,"unit":"kg"}],"response":"അരി സ്റ്റോക്ക് നോക്കുന്നു","confidence":0.95}' },
  { name: 'Stock availability', user: 'സോപ്പ് ഉണ്ടോ', agent: '{"intent":"stock.check","products":[{"name":"Soap","nameMl":"സോപ്പ്","qty":0,"unit":"piece"}],"response":"സോപ്പ് നോക്കുന്നു","confidence":0.95}' },
  { name: 'Product location', user: 'മഞ്ഞൾ എവിടെ ഉണ്ട്', agent: '{"intent":"stock.location","products":[{"name":"Turmeric","nameMl":"മഞ്ഞൾ","qty":0,"unit":"kg"}],"response":"മഞ്ഞൾ നോക്കുന്നു","confidence":0.95}' },
  { name: 'Add stock', user: '50 കിലോ അരി സ്റ്റോക്കിൽ ചേർക്കൂ', agent: '{"intent":"inventory.add","products":[{"name":"Rice","nameMl":"അരി","qty":50,"unit":"kg"}],"response":"50 കിലോ അരി സ്റ്റോക്കിൽ ചേർക്കുന്നു","confidence":0.95}' },
  { name: 'Update price', user: 'അരി വില 65 രൂപ ആക്കൂ', agent: '{"intent":"inventory.update","products":[{"name":"Rice","nameMl":"അരി","qty":0,"unit":"kg"}],"response":"അരി വില 65 രൂപ ആക്കുന്നു","confidence":0.95}' },
  { name: 'Low stock check', user: 'ഏത് സാധനങ്ങൾ തീരാറായി', agent: '{"intent":"inventory.low_stock","products":[],"response":"കുറഞ്ഞ സ്റ്റോക്ക് നോക്കുന്നു","confidence":0.95}' },
  { name: 'UPI transliterated', user: 'യുപിഐ', agent: '{"intent":"payment.upi","products":[],"response":"QR കോഡ് കാണിക്കുന്നു","confidence":0.95}' },
  { name: 'GPay payment', user: 'ജിപേ ആക്കൂ', agent: '{"intent":"payment.upi","products":[],"response":"GPay QR കാണിക്കുന്നു","confidence":0.95}' },
  { name: 'Show QR', user: 'QR കാണിക്കൂ', agent: '{"intent":"payment.upi","products":[],"response":"QR കോഡ് കാണിക്കുന്നു","confidence":0.95}' },
  { name: 'Cash payment', user: 'ക്യാഷ് ആണ്', agent: '{"intent":"payment.cash","products":[],"response":"ശരി, ക്യാഷ് പേയ്‌മെന്റ്","confidence":0.95}' },
  { name: 'Cash Malayalam', user: 'പണം ആണ്', agent: '{"intent":"payment.cash","products":[],"response":"ശരി, ക്യാഷ്","confidence":0.95}' },
  { name: 'Today report', user: 'ഇന്ന് എത്ര വിറ്റു', agent: '{"intent":"report.today","products":[],"response":"ഇന്നത്തെ സെയിൽസ് നോക്കുന്നു","confidence":0.95}' },
  { name: 'Week report', user: 'ഈ ആഴ്ചത്തെ കണക്ക് പറയൂ', agent: '{"intent":"report.week","products":[],"response":"ഈ ആഴ്ചത്തെ സെയിൽസ് നോക്കുന്നു","confidence":0.95}' },
  { name: 'Profit report', user: 'ഇന്ന് എത്ര ലാഭം കിട്ടി', agent: '{"intent":"report.profit","products":[],"response":"ഇന്നത്തെ ലാഭം നോക്കുന്നു","confidence":0.95}' },
  { name: 'Confirm yes', user: 'ശരി', agent: '{"intent":"confirm","products":[],"response":"ശരി","confidence":0.95}' },
  { name: 'Confirm paid', user: 'പൈസ കൊടുത്തു', agent: '{"intent":"confirm","products":[],"response":"ശരി, പേയ്‌മെന്റ് ലഭിച്ചു","confidence":0.95}' },
  { name: 'Cancel no', user: 'വേണ്ട', agent: '{"intent":"cancel","products":[],"response":"ശരി, ഒഴിവാക്കി","confidence":0.95}' },
  { name: 'Greeting', user: 'നമസ്കാരം', agent: '{"intent":"greeting","products":[],"response":"നമസ്കാരം! എന്ത് സഹായം വേണം?","confidence":0.95}' },
  { name: 'Help request', user: 'എന്തൊക്കെ ചെയ്യാൻ പറ്റും', agent: '{"intent":"help","products":[],"response":"ബില്ലിംഗ്, സ്റ്റോക്ക്, ഇൻവെൻ്ററി, റിപ്പോർട്ട് — എല്ലാം ചെയ്യാം","confidence":0.95}' },
  { name: 'Spice order', user: 'അര കിലോ മുളക് പൊടി ഒരു കിലോ മഞ്ഞൾ 250 ഗ്രാം കുരുമുളക്', agent: '{"intent":"billing.add","products":[{"name":"Chilli Powder","nameMl":"മുളക് പൊടി","qty":0.5,"unit":"kg"},{"name":"Turmeric","nameMl":"മഞ്ഞൾ","qty":1,"unit":"kg"},{"name":"Black Pepper","nameMl":"കുരുമുളക്","qty":250,"unit":"g"}],"response":"മുളക് പൊടി, മഞ്ഞൾ, കുരുമുളക് ചേർത്തു","confidence":0.95}' },
  { name: 'Household items', user: 'ഒരു ടൂത്ത്പേസ്റ്റ് 2 സോപ്പ് ഒരു വാഷിംഗ് പൗഡർ', agent: '{"intent":"billing.add","products":[{"name":"Toothpaste","nameMl":"ടൂത്ത്പേസ്റ്റ്","qty":1,"unit":"piece"},{"name":"Soap","nameMl":"സോപ്പ്","qty":2,"unit":"piece"},{"name":"Washing Powder","nameMl":"വാഷിംഗ് പൗഡർ","qty":1,"unit":"kg"}],"response":"ടൂത്ത്പേസ്റ്റ്, സോപ്പ്, വാഷിംഗ് പൗഡർ ചേർത്തു","confidence":0.95}' },
  { name: 'Tea shop order', user: 'ഒരു കിലോ ചായപ്പൊടി അര ലിറ്റർ പാൽ 2 കിലോ പഞ്ചസാര', agent: '{"intent":"billing.add","products":[{"name":"Tea Powder","nameMl":"ചായപ്പൊടി","qty":1,"unit":"kg"},{"name":"Milk","nameMl":"പാൽ","qty":0.5,"unit":"litre"},{"name":"Sugar","nameMl":"പഞ്ചസാര","qty":2,"unit":"kg"}],"response":"ചായപ്പൊടി, പാൽ, പഞ്ചസാര ചേർത്തു","confidence":0.95}' },
  { name: 'UPI spaced', user: 'യു പി ഐ ആക്കൂ', agent: '{"intent":"payment.upi","products":[],"response":"UPI QR കാണിക്കുന്നു","confidence":0.95}' },
  { name: 'Paid confirm', user: 'pay ചെയ്തു', agent: '{"intent":"confirm","products":[],"response":"ശരി, പേയ്‌മെന്റ് കൺഫേം","confidence":0.95}' },
  { name: 'Yes more items', user: 'ഉവ്വ്', agent: '{"intent":"confirm","products":[],"response":"ശരി, പറയൂ","confidence":0.95}' },
  { name: 'Wait thinking', user: 'കാത്തിരിക്കൂ', agent: '{"intent":"confirm","products":[],"response":"ശരി","confidence":0.9}' },
  { name: 'Today alt', user: 'ഇന്നത്തെ കണക്ക് എന്താ', agent: '{"intent":"report.today","products":[],"response":"ഇന്നത്തെ കണക്ക് നോക്കുന്നു","confidence":0.95}' },
  { name: 'Fallback unknown', user: 'അത് ശരിയല്ല കേട്ടോ', agent: '{"intent":"fallback","products":[],"response":"ക്ഷമിക്കണം, മനസ്സിലായില്ല. വീണ്ടും പറയൂ","confidence":0.3}' },
  { name: 'Dairy oil purchase', user: 'ഒരു ലിറ്റർ വെളിച്ചെണ്ണ അര കിലോ നെയ്യ്', agent: '{"intent":"billing.add","products":[{"name":"Coconut Oil","nameMl":"വെളിച്ചെണ്ണ","qty":1,"unit":"litre"},{"name":"Ghee","nameMl":"നെയ്യ്","qty":0.5,"unit":"kg"}],"response":"വെളിച്ചെണ്ണയും നെയ്യും ചേർത്തു","confidence":0.95}' },
  { name: 'Vegetables billing', user: '2 കിലോ ഉള്ളി ഒരു കിലോ തക്കാളി', agent: '{"intent":"billing.add","products":[{"name":"Onion","nameMl":"ഉള്ളി","qty":2,"unit":"kg"},{"name":"Tomato","nameMl":"തക്കാളി","qty":1,"unit":"kg"}],"response":"ഉള്ളിയും തക്കാളിയും ചേർത്തു","confidence":0.95}' },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Deploying CX Playbook...');
  console.log(`   Project: ${PROJECT_ID}`);
  console.log(`   Location: ${LOCATION}`);
  console.log(`   Agent: ${AGENT_ID}\n`);

  // Step 1: List playbooks
  console.log('📋 Step 1: Finding playbook...');
  const playbooks = await apiGet(`${AGENT_PATH}/playbooks`);
  let playbookName;

  if (!playbooks.playbooks || playbooks.playbooks.length === 0) {
    console.log('   No playbooks found. Creating new one...');
    const newPb = await apiPost(`${AGENT_PATH}/playbooks`, {
      displayName: 'Kadai AI Shopkeeper',
      goal: PLAYBOOK_GOAL,
      instruction: { guidelines: PLAYBOOK_INSTRUCTIONS },
    });
    playbookName = newPb.name;
    console.log(`   ✅ Created: ${playbookName}`);
  } else {
    const pb = playbooks.playbooks[0];
    playbookName = pb.name;
    console.log(`   Found: "${pb.displayName}"`);

    console.log('\n📝 Step 2: Updating goal + instructions...');
    await apiPatch(pb.name, {
      name: pb.name,
      displayName: pb.displayName,
      goal: PLAYBOOK_GOAL,
      instruction: { guidelines: PLAYBOOK_INSTRUCTIONS },
    }, 'goal,instruction');
    console.log(`   ✅ Goal: ${PLAYBOOK_GOAL.length} chars`);
    console.log(`   ✅ Instructions: ${PLAYBOOK_INSTRUCTIONS.length} chars`);
  }

  // Step 3: Delete old examples
  console.log('\n🗑️  Step 3: Clearing old examples...');
  const existing = await apiGet(`${playbookName}/examples`);
  if (existing.examples) {
    for (const ex of existing.examples) {
      await apiDelete(ex.name);
    }
    console.log(`   Deleted ${existing.examples.length} old examples`);
  } else {
    console.log('   No existing examples');
  }

  // Step 4: Create new examples
  console.log(`\n📚 Step 4: Creating ${EXAMPLES.length} examples...`);
  let ok = 0;
  for (const ex of EXAMPLES) {
    try {
      await apiPost(`${playbookName}/examples`, {
        displayName: ex.name,
        actions: [
          { userUtterance: { text: ex.user } },
          { agentUtterance: { text: ex.agent } },
        ],
        conversationState: 'OUTPUT_STATE_OK',
        languageCode: 'ml',
      });
      ok++;
      process.stdout.write(`\r   ${ok}/${EXAMPLES.length} ✅`);
    } catch (err) {
      console.log(`\n   ❌ ${ex.name}: ${err.message.slice(0, 120)}`);
    }
  }

  console.log(`\n\n🎉 Done! Playbook deployed.`);
  console.log(`   Goal: ${PLAYBOOK_GOAL.length} chars | Instructions: ${PLAYBOOK_INSTRUCTIONS.length} chars | Examples: ${ok}/${EXAMPLES.length}`);
}

main().catch(err => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
