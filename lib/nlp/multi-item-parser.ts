/**
 * Multi-Item Voice Command Parser
 *
 * Parses a single voice utterance that may contain multiple product items.
 * Example: "10 kg അരി, 2 kg പഞ്ചസാര, ഒരു സോപ്പ്"
 * Returns: [{ quantity: 10, unit: 'kg', productName: 'Rice' }, ...]
 */

import { PRODUCT_ALIAS_MAP } from '@/lib/data/products';

export interface ParsedItem {
  rawText: string;       // original segment text
  productName: string;   // matched canonical name (English)
  productMl: string;     // matched Malayalam name (for display)
  quantity: number;
  unit: string;
  confidence: number;    // 0–1
}

// ─── Malayalam number words ───────────────────────────────────────────────────

const NUMBER_WORDS: Record<string, number> = {
  'ഒന്ന്': 1, 'ഒരു': 1, 'ഒരെണ്ണം': 1, 'oru': 1, 'one': 1,
  'രണ്ട്': 2, 'രണ്ടെണ്ണം': 2, 'randu': 2, 'two': 2, 'രണ്ടു': 2,
  'മൂന്ന്': 3, 'മൂന്നെണ്ണം': 3, 'moonnu': 3, 'three': 3, 'മൂന്നു': 3,
  'നാല്': 4, 'നാലെണ്ണം': 4, 'nalu': 4, 'four': 4, 'നാലു': 4,
  'അഞ്ച്': 5, 'അഞ്ചെണ്ണം': 5, 'anchu': 5, 'five': 5, 'അഞ്ചു': 5,
  'ആറ്': 6, 'ആറെണ്ണം': 6, 'aaru': 6, 'six': 6, 'ആറു': 6,
  'ഏഴ്': 7, 'ഏഴെണ്ണം': 7, 'ezhu': 7, 'seven': 7, 'ഏഴു': 7,
  'എട്ട്': 8, 'എട്ടെണ്ണം': 8, 'ettu': 8, 'eight': 8, 'എട്ടു': 8,
  'ഒൻപത്': 9, 'ഒമ്പതെണ്ണം': 9, 'onpathu': 9, 'nine': 9, 'ഒമ്പത്': 9,
  'പത്ത്': 10, 'പത്തെണ്ണം': 10, 'pathu': 10, 'ten': 10, 'പത്തു': 10,
  'പതിനഞ്ച്': 15, 'fifteen': 15,
  'ഇരുപത്': 20, 'twenty': 20,
  'അഞ്ചിരുപത്': 25, 'twenty five': 25,
  'മുപ്പത്': 30, 'thirty': 30,
  'അൻപത്': 50, 'fifty': 50,
  'നൂറ്': 100, 'hundred': 100,
  'അര': 0.5, 'half': 0.5, 'ara': 0.5,
  'കാൽ': 0.25, 'quarter': 0.25, 'kaal': 0.25,
  'മുക്കാൽ': 0.75, 'mukaal': 0.75,
};

// ─── Unit normalization ───────────────────────────────────────────────────────

const UNIT_WORDS: Record<string, string> = {
  'കിലോ': 'kg', 'കിലോഗ്രാം': 'kg', 'kg': 'kg', 'kilo': 'kg', 'kilograms': 'kg',
  'കിലൊ': 'kg', 'kgs': 'kg',
  'ഗ്രാം': 'g', 'gm': 'g', 'gram': 'g', 'grams': 'g', 'grm': 'g',
  'ലിറ്റർ': 'litre', 'liter': 'litre', 'litre': 'litre', 'l': 'litre', 'litres': 'litre',
  'ലിറ്റര്': 'litre', 'ലിത്തർ': 'litre',
  'മില്ലി': 'ml', 'ml': 'ml', 'milliliter': 'ml', 'millilitre': 'ml',
  'എണ്ണം': 'piece', 'piece': 'piece', 'pieces': 'piece', 'nos': 'piece',
  'പായ്ക്ക്': 'pack', 'pack': 'pack', 'packet': 'pack', 'packets': 'pack',
  'പായ്ക്കറ്റ്': 'pack', 'sachet': 'pack',
};

// ─── Splitter patterns ────────────────────────────────────────────────────────

// Patterns that separate multiple items in one utterance
const ITEM_SEPARATORS = [
  /,\s*/,           // comma
  /\s+ഉം\s+/,      // "ഉം" (and in Malayalam, joining items)
  /\s+പിന്നെ\s+/,  // "then"
  /\s+and\s+/i,     // English "and"
  /\s+also\s+/i,    // English "also"
  /\s+കൂടി\s+/,    // "also/more"
];

// Combined separator regex
const SEPARATOR_REGEX = new RegExp(
  ITEM_SEPARATORS.map(r => r.source).join('|'),
  'i'
);

// ─── Malayalam → English product lookup ──────────────────────────────────────

// Build Malayalam name → English name lookup from products catalog
import { KERALA_PRODUCTS } from '@/lib/data/products';

const ML_TO_EN_MAP = new Map<string, string>();
const ML_NAMES_MAP = new Map<string, string>(); // English name → Malayalam name
for (const product of KERALA_PRODUCTS) {
  ML_TO_EN_MAP.set(product.name_ml.toLowerCase(), product.name_en);
  ML_NAMES_MAP.set(product.name_en, product.name_ml);
}

/**
 * Get Malayalam name for an English product name
 */
export function getMalayalamName(nameEn: string): string {
  return ML_NAMES_MAP.get(nameEn) ?? nameEn;
}

// ─── Core parsing functions ───────────────────────────────────────────────────

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractNumber(text: string): number {
  // Check digits FIRST — explicit numerals always win
  const digitMatch = text.match(/(\d+(?:\.\d+)?)/);
  if (digitMatch) return parseFloat(digitMatch[1]);

  // Then check number words — use word-boundary check to avoid false substrings
  // (e.g. "അര" must not match inside "അരി")
  const normalized = normalizeText(text);
  const sortedKeys = Object.keys(NUMBER_WORDS).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wordBoundary = new RegExp(`(^|\\s)${escaped}(\\s|$)`);
    if (wordBoundary.test(normalized)) {
      return NUMBER_WORDS[key];
    }
  }

  return 1; // default: 1 unit
}

function extractUnit(text: string): string {
  const normalized = normalizeText(text);

  // Sort by length descending to match longer units first (e.g. "കിലോഗ്രാം" before "കിലോ")
  const sortedUnits = Object.keys(UNIT_WORDS).sort((a, b) => b.length - a.length);
  for (const unit of sortedUnits) {
    if (normalized.includes(unit.toLowerCase())) {
      return UNIT_WORDS[unit];
    }
  }

  return 'piece'; // default
}

/**
 * Dice coefficient fuzzy match (0–1)
 */
function diceCoeff(a: string, b: string): number {
  if (a.length < 2 || b.length < 2) return a === b ? 1 : 0;
  const bigrams = new Set<string>();
  for (let i = 0; i < a.length - 1; i++) bigrams.add(a.substring(i, i + 2));
  let hits = 0;
  for (let i = 0; i < b.length - 1; i++) {
    if (bigrams.has(b.substring(i, i + 2))) hits++;
  }
  return (2 * hits) / (a.length - 1 + b.length - 1);
}

/**
 * Find best matching product name from text segment.
 * Returns { nameEn, nameMl, confidence }
 */
function findProductInText(text: string): { nameEn: string; nameMl: string; confidence: number } | null {
  const normalized = normalizeText(text);

  // 1. Exact alias lookup (fast path)
  for (const [alias, nameEn] of PRODUCT_ALIAS_MAP.entries()) {
    if (normalized.includes(alias)) {
      const product = KERALA_PRODUCTS.find(p => p.name_en === nameEn);
      return { nameEn, nameMl: product?.name_ml ?? nameEn, confidence: 0.95 };
    }
  }

  // 2. Fuzzy match each word against all aliases
  const words = normalized.split(/\s+/).filter(w => w.length >= 3);
  let best: { nameEn: string; nameMl: string; confidence: number } | null = null;

  for (const word of words) {
    for (const [alias, nameEn] of PRODUCT_ALIAS_MAP.entries()) {
      if (alias.length < 3) continue;
      const score = diceCoeff(word, alias);
      if (score > 0.6 && (!best || score > best.confidence)) {
        const product = KERALA_PRODUCTS.find(p => p.name_en === nameEn);
        best = { nameEn, nameMl: product?.name_ml ?? nameEn, confidence: score };
      }
    }
  }

  return best;
}

/**
 * Parse a single item segment like "10 kg അരി" or "ഒരു സോപ്പ്"
 */
function parseSegment(rawText: string): ParsedItem | null {
  const trimmed = rawText.trim();
  if (!trimmed || trimmed.length < 2) return null;

  const product = findProductInText(trimmed);
  if (!product) return null;

  const quantity = extractNumber(trimmed);
  const unit = extractUnit(trimmed);

  return {
    rawText: trimmed,
    productName: product.nameEn,
    productMl: product.nameMl,
    quantity,
    unit,
    confidence: product.confidence,
  };
}

// ─── Main exported function ───────────────────────────────────────────────────

/**
 * Parse a voice utterance that may contain multiple items.
 *
 * @example
 * parseMultipleItems("10 kg അരി, 2 kg പഞ്ചസാര, ഒരു സോപ്പ്")
 * // → [
 * //   { productName: 'Rice', productMl: 'അരി', quantity: 10, unit: 'kg', ... },
 * //   { productName: 'Sugar', productMl: 'പഞ്ചസാര', quantity: 2, unit: 'kg', ... },
 * //   { productName: 'Soap', productMl: 'സോപ്പ്', quantity: 1, unit: 'piece', ... },
 * // ]
 */
export function parseMultipleItems(text: string): ParsedItem[] {
  if (!text || text.trim().length === 0) return [];

  // ── Pre-process: inject commas before implicit item boundaries ────────────
  // "10 കിലോ അരി 10 കിലോ ഗോതമ്പ്" → "10 കിലോ അരി,10 കിലോ ഗോതമ്പ്"
  // Matches: <space> + digit (start of next item's quantity)
  const unitPattern = Object.keys(UNIT_WORDS)
    .sort((a, b) => b.length - a.length)
    .map(u => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  const implicitSplit = new RegExp(
    `(\\S)\\s+(?=(\\d+(?:\\.\\d+)?)\\s*(?:${unitPattern}))`,
    'g'
  );
  const preprocessed = text.replace(implicitSplit, '$1,');

  // Also inject commas before Malayalam number words followed by a unit/product
  const mlNumberPattern = Object.keys(NUMBER_WORDS)
    .filter(k => /[\u0D00-\u0D7F]/.test(k)) // only Malayalam-script words
    .sort((a, b) => b.length - a.length)
    .map(u => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  const implicitSplitMl = new RegExp(
    `(\\S)\\s+(?=(${mlNumberPattern})\\s)`,
    'g'
  );
  const preprocessed2 = preprocessed.replace(implicitSplitMl, '$1,');

  // Split by explicit separators
  const segments = preprocessed2.split(SEPARATOR_REGEX).filter(s => s.trim().length > 0);

  const items: ParsedItem[] = [];
  for (const segment of segments) {
    const parsed = parseSegment(segment);
    if (parsed) {
      items.push(parsed);
    }
  }

  // If no items found from splitting, try the whole text as one item
  if (items.length === 0) {
    const single = parseSegment(text);
    if (single) items.push(single);
  }

  return items;
}

/**
 * Check if text likely contains multiple items (for routing decisions)
 */
export function looksLikeMultipleItems(text: string): boolean {
  if (SEPARATOR_REGEX.test(text)) return true;
  // Implicit split: "10 kg rice 10 kg wheat" — digit after a non-digit word
  const unitKeys = Object.keys(UNIT_WORDS).map(u => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  return new RegExp(`\\S\\s+\\d+(?:\\.\\d+)?\\s*(?:${unitKeys})`).test(text);
}
