import {
  DisambiguationOption,
  KiranaItem,
  PendingDisambiguation,
  PricingUnit,
  UdhaarAccount,
  VoiceLangCode,
} from './types';

const TELUGU_SCRIPT_RE = /[\u0C00-\u0C7F]/;
const HINDI_SCRIPT_RE = /[\u0900-\u097F]/;
const TELUGU_WORDS_RE =
  /\b(ara|paavu|pavu|muppaavu|okati|oka|rendu|moodu|mudu|nalugu|aidu|aaru|padi|katta|kandipappu|kandi|pappu|pallilu|palli|verusenaga|bellam|yelakulu|panchadara|nune|godhuma|pindi|vaddu|kaadu|kadu|eeroju|labham|entha|cheppu|icchadu|rupayalu|biyyam|avunu)\b/i;
const HINDI_WORDS_RE =
  /\b(adha|aadha|paav|ek|teen|char|paanch|panch|chhe|das|cheeni|chini|shakkar|arhar|mungfali|shengdana|gud|gur|aata|elaichi|chawal|nahi|kamai|munafa|khata|udhaar|udhar|rupaye|diya|haan|tel)\b/i;

export function detectSpokenLanguage(transcript: string): {
  langCode: VoiceLangCode;
  label: string;
} {
  const text = normalizeIndianPhonetics(transcript).trim();
  if (!text) {
    return { langCode: 'en-IN', label: 'Auto: EN-IN' };
  }
  if (TELUGU_SCRIPT_RE.test(text) || TELUGU_WORDS_RE.test(text)) {
    return { langCode: 'te-IN', label: 'Auto: Telugu · EN-IN' };
  }
  if (HINDI_SCRIPT_RE.test(text) || HINDI_WORDS_RE.test(text)) {
    return { langCode: 'hi-IN', label: 'Auto: Hindi · EN-IN' };
  }
  return { langCode: 'en-IN', label: 'Auto: Indian English' };
}

/**
 * Normalizes common English-ASR phonetic mishearings of Indian-accented Telugu & Hindi Kirana terms
 * so voice intake stays accurate even in noisy neighborhood shops.
 */
const PHONETIC_REPAIRS: Array<[RegExp, string]> = [
  [/\b(?:are a|aura|arra|arha)\s+(?=kg|kilo|kilos|sugar|toor|dal|rice|atta|jaggery|bellam|groundnut|pallilu|oil)/gi, 'ara '],
  [/\b(?:pow|power|pau|paau|pavo)\s+(?=kg|kilo|kilos|sugar|toor|dal|kandi|pallilu|groundnut|jaggery|bellam|atta)/gi, 'paavu '],
  [/\b(?:render|rend|rain\s+do|ran\s+do|rendo)\b/gi, 'rendu'],
  [/\b(?:modu|mudo|mood)\s+(?=kg|kilo|kilos|packet|packets|sugar|oil|dal|atta|bellam|jaggery)/gi, 'moodu '],
  [/\b(?:palli\s+loo|palli\s+lu|palilu|palelu|pallu)\b/gi, 'pallilu'],
  [/\b(?:kandi\s+papu|candy\s+pappu|candy\s+pop|kandipapu|kandi\s+pappu)\b/gi, 'kandipappu'],
  [/\b(?:toor\s+dhal|tur\s+dhal|thor\s+dal|tour\s+dal)\b/gi, 'toor dal'],
  [/\b(?:bellum|belam|bailam)\b/gi, 'bellam'],
  [/\b(?:panchadhara|pancha\s+dara)\b/gi, 'panchadara'],
  [/\b(?:cheeny|cheene)\b/gi, 'cheeni'],
  [/\b(?:vadu|waddu|wadoo)\b/gi, 'vaddu'],
  [/\b(?:eroju|hero\s+ju|e\s+roju)\b/gi, 'eeroju'],
  [/\b(?:labam|labhamu)\b/gi, 'labham'],
  [/\b(?:yalakulu|elakulu|yela\s+kulu)\b/gi, 'yelakulu'],
  [/\b(?:godhuma\s+pindhi|goduma\s+pindi)\b/gi, 'godhuma pindi'],
  // Natural spoken fractions & numbers from live Web Speech API
  [/\bhalf\s+a\s+(?=kg|kilo|kilos|kilogram)/gi, 'half '],
  [/\bquarter\s+a\s+(?=kg|kilo|kilos)/gi, 'quarter '],
  [/\b1\/2\b/g, '0.5'],
  [/\b1\/4\b/g, '0.25'],
  [/\b3\/4\b/g, '0.75'],
  [/\bone\s+and\s+a?\s*half\b/gi, '1.5'],
  [/\btwo\s+and\s+a?\s*half\b/gi, '2.5'],
  // Native Telugu Unicode script -> parseable Kirana tokens
  [/చక్కెర|పంచదార|షుగర్/g, ' sugar '],
  [/కందిపప్పు|కంది\s*పప్పు|తూర్\s*దాల్/g, ' toor dal '],
  [/సన్‌?ఫ్లవర్\s*(?:నూనె|ఆయిల్)|వంట\s*నూనె|నూనె|ఆయిల్/g, ' sunflower oil '],
  [/వేరుశెనగ|పల్లీలు|పల్లి/g, ' groundnuts '],
  [/గోధుమ\s*పిండి|ఆటా|ఆట్టా/g, ' wheat flour '],
  [/బెల్లం|జాగరీ/g, ' jaggery '],
  [/రాగి\s*పిండి/g, ' ragi flour '],
  [/బ్రౌన్\s*రైస్/g, ' brown rice '],
  [/ముప్పావు/g, ' muppaavu '],
  [/పావు/g, ' paavu '],
  [/అర/g, ' ara '],
  [/ఒకటి|ఒక/g, ' 1 '],
  [/రెండు/g, ' 2 '],
  [/మూడు/g, ' 3 '],
  [/నాలుగు/g, ' 4 '],
  [/ఐదు/g, ' 5 '],
  [/కిలోలు|కిలో|కేజీ/g, ' kg '],
  [/గ్రాములు|గ్రామ్/g, ' g '],
  [/ప్యాకెట్లు|ప్యాకెట్స్|ప్యాకెట్/g, ' packets '],
  [/రూపాయల|రూపాయలు/g, ' rupees '],
  [/చెక్\s*అవుట్|బిల్\s*అయిపోయింది|బిల్\s*చెయ్యి/g, ' checkout '],
  [/ఖాతాలో|ఖాతా|అకౌంట్/g, ' account '],
  [/రమేష్/g, ' ramesh '],
  [/లక్ష్మి/g, ' lakshmi '],
  [/సురేష్/g, ' suresh '],
  [/వద్దు|కాదు/g, ' vaddu '],
  [/అవును/g, ' yes '],
  [/ఈరోజు/g, ' eeroju '],
  [/లాభం/g, ' labham '],
  // Native Hindi Devanagari script -> parseable Kirana tokens
  [/चीनी|शक्कर|शुगर/g, ' sugar '],
  [/तूर\s*दाल|अरहर\s*दाल|दाल/g, ' toor dal '],
  [/सनफ्लावर\s*(?:तेल|ऑयल)|तेल|ऑयल/g, ' sunflower oil '],
  [/मूंगफली|मूँगफली|शेंगदाना/g, ' groundnuts '],
  [/गेहूं\s*का\s*आटा|आटा/g, ' wheat flour '],
  [/गुड़|गुड/g, ' jaggery '],
  [/रागी\s*आटा/g, ' ragi flour '],
  [/ब्राउन\s*राइस/g, ' brown rice '],
  [/आधा/g, ' half '],
  [/पाव/g, ' paavu '],
  [/एक/g, ' 1 '],
  [/दो/g, ' 2 '],
  [/तीन/g, ' 3 '],
  [/चार/g, ' 4 '],
  [/पांच|पाँच/g, ' 5 '],
  [/किलो/g, ' kg '],
  [/ग्राम/g, ' g '],
  [/पैकेट/g, ' packets '],
  [/रुपये|रुपए|रुपया/g, ' rupees '],
  [/चेक\s*आउट|बिल\s*हो\s*गया|बिल\s*बनाओ/g, ' checkout '],
  [/खाते\s*में|खाता|उधार/g, ' account '],
  [/रमेश/g, ' ramesh '],
  [/लक्ष्मी/g, ' lakshmi '],
  [/सुरेश/g, ' suresh '],
  [/नहीं/g, ' nahi '],
  [/हाँ|हां/g, ' yes '],
  [/मुनाफा|कमाई/g, ' profit '],
];

export function normalizeIndianPhonetics(transcript: string): string {
  let out = transcript.trim();
  for (const [pattern, replacement] of PHONETIC_REPAIRS) {
    out = out.replace(pattern, replacement);
  }
  return out.replace(/\s+/g, ' ').trim();
}

export function summarizeParsedCommand(command: VoiceCommand): string[] {
  switch (command.type) {
    case 'stock_in': {
      const tokens = [`Stock-In: ${command.itemName} → ${command.stockQty}`];
      if (command.wholesalePrice !== undefined) tokens.push(`Wholesale ₹${command.wholesalePrice}`);
      if (command.sellingPrice !== undefined) tokens.push(`Selling ₹${command.sellingPrice}`);
      return tokens;
    }
    case 'edit_rate':
      return [`Rate Edit: ${command.itemName} → ₹${command.sellingPrice}`];
    case 'add_item':
      return [
        `New Item: ${command.name}`,
        `${command.stockQty} ${command.unit}`,
        `₹${command.sellingPrice}/${command.unit}`,
      ];
    case 'bill_items': {
      const tokens = command.items.map((i) =>
        i.orderedByRupees
          ? `${i.itemName} · ${i.displayQty} (₹${i.orderedByRupees})`
          : `${i.itemName} · ${i.displayQty}`
      );
      if (command.isCorrection) tokens.unshift('Corrected');
      if (command.customerName) tokens.push(`Tab → ${command.customerName}`);
      if (command.finalizeBill) tokens.push('Checkout Complete');
      return tokens;
    }
    case 'missing_demand':
      return [`Missing Demand: ${command.itemName}`];
    case 'udhaar_repayment':
      return [
        `Repayment: ${command.customerName}`,
        `-₹${command.amount} (${command.method.toUpperCase()})`,
      ];
    case 'log_spends': {
      const tokens = command.spends.map((s) => `Spend: ${s.label} ₹${s.amount}`);
      if (command.askProfit) tokens.push('Profit Briefing');
      return tokens;
    }
    case 'ask_profit':
      return ['Daily Profit Briefing'];
    case 'disambiguate':
      return ['Paused · Confirm Item', command.pending.primaryOption.label, command.pending.secondaryOption.label];
    case 'resolve_disambiguation':
      return [command.choice === 'cancel' ? 'Cancelled' : 'Confirmed Item'];
    case 'compound':
      return command.commands.flatMap((c) => summarizeParsedCommand(c));
    case 'noise':
    default:
      return ['Background Chatter Ignored'];
  }
}

export function pickBestTranscriptAlternative(
  alternatives: Array<{ transcript: string; confidence: number }>,
  catalog: KiranaItem[],
  accounts: UdhaarAccount[],
  pendingDisambiguation?: PendingDisambiguation | null
): { transcript: string; confidence: number } {
  const valid = alternatives.filter((a) => a.transcript && a.transcript.trim().length > 0);
  if (valid.length === 0) return { transcript: '', confidence: 0 };
  if (valid.length === 1) return valid[0];

  let best = valid[0];
  let bestScore = -1;

  for (const alt of valid) {
    const parsed = parseVoiceUtterance(alt.transcript, catalog, accounts, {
      confidence: Math.max(0.85, alt.confidence || 0.85),
      pendingDisambiguation,
    });
    const isActionable = parsed.type !== 'noise';
    const itemBonus = parsed.type === 'bill_items' ? parsed.items.length * 0.2 : 0;
    const score = (isActionable ? 1 : 0) + itemBonus + (alt.confidence || 0.5);
    if (score > bestScore) {
      bestScore = score;
      best = alt;
    }
  }

  return best;
}

export interface ParsedBillItem {
  itemId: string;
  itemName: string;
  quantity: number; // in item's native unit (kg, g, or packet)
  unit: PricingUnit;
  displayQty: string;
  orderedByRupees?: number;
}

export type VoiceCommand =
  | {
      type: 'stock_in';
      itemId: string;
      itemName: string;
      stockQty: number;
      wholesalePrice?: number;
      sellingPrice?: number;
    }
  | {
      type: 'edit_rate';
      itemId: string;
      itemName: string;
      sellingPrice: number;
      wholesalePrice?: number;
    }
  | {
      type: 'add_item';
      name: string;
      stockQty: number;
      sellingPrice: number;
      wholesalePrice: number;
      unit: PricingUnit;
    }
  | {
      type: 'bill_items';
      items: ParsedBillItem[];
      customerId?: string;
      customerName?: string;
      paymentMethod?: 'cash' | 'upi' | 'udhaar';
      finalizeBill: boolean;
      isCorrection?: boolean;
    }
  | {
      type: 'missing_demand';
      itemName: string;
    }
  | {
      type: 'udhaar_repayment';
      customerId: string;
      customerName: string;
      amount: number;
      method: 'cash' | 'upi';
    }
  | {
      type: 'log_spends';
      spends: Array<{
        label: string;
        amount: number;
        category: 'vendor' | 'transport' | 'utility' | 'other';
      }>;
      askProfit: boolean;
    }
  | {
      type: 'ask_profit';
    }
  | {
      type: 'compound';
      commands: VoiceCommand[];
    }
  | {
      type: 'disambiguate';
      pending: PendingDisambiguation;
    }
  | {
      type: 'resolve_disambiguation';
      choice: 'primary' | 'secondary' | 'cancel';
    }
  | {
      type: 'noise';
      reason: string;
    };

/** Local Telugu + Hindi + English quantity words */
const QUANTITY_WORDS: Record<string, number> = {
  paavu: 0.25,
  paav: 0.25,
  pavu: 0.25,
  quarter: 0.25,
  ara: 0.5,
  adha: 0.5,
  aadha: 0.5,
  half: 0.5,
  muppaavu: 0.75,
  okati: 1,
  oka: 1,
  ek: 1,
  one: 1,
  rendu: 2,
  do: 2,
  two: 2,
  moodu: 3,
  mudu: 3,
  teen: 3,
  three: 3,
  nalugu: 4,
  char: 4,
  four: 4,
  aidu: 5,
  paanch: 5,
  panch: 5,
  five: 5,
  aaru: 6,
  chhe: 6,
  six: 6,
  ten: 10,
  padi: 10,
  das: 10,
};

/** Extra synonym expansions for items that might be mentioned even before being added */
const EXTRA_SYNONYM_HINTS: Record<string, string> = {
  yelakulu: 'Cardamom',
  elaichi: 'Cardamom',
  cardamom: 'Cardamom',
  'ragi pindi': 'Ragi Flour',
  'ragi flour': 'Ragi Flour',
  'brown rice': 'Brown Rice',
  biyyam: 'Rice',
  chawal: 'Rice',
};

/** Rhyming / acoustically confusable Kirana pairs */
const RHYMING_PAIRS: Array<{ heard: string; alternate: string; alternateName: string }> = [
  { heard: 'salt', alternate: 'sugar', alternateName: 'Sugar' },
  { heard: 'malt', alternate: 'salt', alternateName: 'Salt' },
  { heard: 'foil', alternate: 'oil', alternateName: 'Sunflower Oil' },
  { heard: 'doll', alternate: 'toor dal', alternateName: 'Toor Dal' },
];

export function formatWeightDisplay(qty: number, unit: PricingUnit): string {
  if (unit === 'packet') {
    const rounded = Math.round(qty * 10) / 10;
    return `${rounded} ${rounded === 1 ? 'packet' : 'packets'}`;
  }
  if (unit === 'g') {
    return `${Math.round(qty)}g`;
  }
  if (qty < 1) {
    return `${Math.round(qty * 1000)}g`;
  }
  const clean = Math.round(qty * 100) / 100;
  return `${clean} kg`;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findAllMatchingItems(
  phrase: string,
  catalog: KiranaItem[]
): Array<{ item: KiranaItem; start: number; end: number }> {
  const lower = phrase.toLowerCase();
  const rawMatches: Array<{ item: KiranaItem; start: number; end: number; len: number }> = [];

  for (const item of catalog) {
    const tokens = [item.name.toLowerCase(), ...item.synonyms.map((s) => s.toLowerCase())].filter(
      Boolean
    );
    for (const token of tokens) {
      const re = new RegExp(`\\b${escapeRegex(token)}\\b`, 'gi');
      let m: RegExpExecArray | null;
      while ((m = re.exec(lower)) !== null) {
        rawMatches.push({
          item,
          start: m.index,
          end: m.index + m[0].length,
          len: m[0].length,
        });
      }
    }
  }

  // Prefer longest match first to eliminate overlapping sub-tokens (e.g. "sunflower oil" over "oil")
  rawMatches.sort((a, b) => b.len - a.len || a.start - b.start);
  const selected: Array<{ item: KiranaItem; start: number; end: number }> = [];

  for (const cand of rawMatches) {
    const overlaps = selected.some((s) => !(cand.end <= s.start || cand.start >= s.end));
    if (!overlaps) {
      selected.push({ item: cand.item, start: cand.start, end: cand.end });
    }
  }

  selected.sort((a, b) => a.start - b.start);
  return selected;
}

function findMatchingItem(phrase: string, catalog: KiranaItem[]): KiranaItem | null {
  const matches = findAllMatchingItems(phrase, catalog);
  if (matches.length === 0) return null;
  // Prefer longest matched token when picking a single item (e.g. stock-in / edit-rate)
  const best = [...matches].sort((a, b) => b.end - b.start - (a.end - a.start))[0];
  return best.item;
}

function parseNumberToken(raw: string): number | null {
  const cleaned = raw.replace(/,/g, '').trim().toLowerCase();
  if (cleaned in QUANTITY_WORDS) {
    return QUANTITY_WORDS[cleaned];
  }
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function parseQuantityForItem(segment: string, item: KiranaItem): {
  quantity: number;
  displayQty: string;
  orderedByRupees?: number;
} {
  const lower = segment.toLowerCase();

  // 1. Rupee-based order: "20 rupees pallilu", "₹20 groundnuts", "rs 50 sugar", "20 rupayalu pallilu"
  const rupeeMatch =
    lower.match(/(?:₹|rs\.?\s*)(\d+(?:\.\d+)?)/i) ||
    lower.match(/(\d+(?:\.\d+)?)\s*(?:rupees|rupee|rs|rupayalu|rupayal|rupai)\b/i);

  if (rupeeMatch && item.unit === 'kg') {
    const rupees = Number(rupeeMatch[1]);
    if (rupees > 0 && item.sellingPrice > 0) {
      const grams = Math.round((rupees / item.sellingPrice) * 1000);
      const kgQty = grams / 1000;
      return {
        quantity: kgQty,
        displayQty: `${grams}g`,
        orderedByRupees: rupees,
      };
    }
  }

  // 2. "katta" = 25kg sack
  const kattaMatch = lower.match(/\b(\d+|oka|okati|ek|one|rendu|do|two)?\s*katta\b/i);
  if (kattaMatch && item.unit === 'kg') {
    const multiplier = kattaMatch[1] ? parseNumberToken(kattaMatch[1]) ?? 1 : 1;
    const kgQty = multiplier * 25;
    return {
      quantity: kgQty,
      displayQty: `${kgQty} kg`,
    };
  }

  // 3. Explicit grams: "250 g", "500 grams", "250gm"
  const gramMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:g|gm|gms|gram|grams)\b/i);
  if (gramMatch) {
    const grams = Number(gramMatch[1]);
    if (item.unit === 'kg') {
      return {
        quantity: grams / 1000,
        displayQty: `${Math.round(grams)}g`,
      };
    }
    return {
      quantity: grams,
      displayQty: `${Math.round(grams)}g`,
    };
  }

  // 4. Local fraction or count word + optional unit ("ara kilo", "paavu kilo", "rendu oil packets", "moodu kg")
  const wordKeys = Object.keys(QUANTITY_WORDS).join('|');
  const qtyPattern = new RegExp(
    `\\b(\\d+(?:\\.\\d+)?|${wordKeys})\\b(?:\\s*(?:kg|kilo|kilos|kilogram|packet|packets|pack|packs|pkt|liter|litre))?`,
    'i'
  );
  const qtyMatch = lower.match(qtyPattern);

  if (qtyMatch) {
    const parsed = parseNumberToken(qtyMatch[1]);
    if (parsed !== null && parsed > 0) {
      return {
        quantity: parsed,
        displayQty: formatWeightDisplay(parsed, item.unit),
      };
    }
  }

  return {
    quantity: 1,
    displayQty: formatWeightDisplay(1, item.unit),
  };
}

function detectCustomer(text: string, accounts: UdhaarAccount[]): UdhaarAccount | null {
  const lower = text.toLowerCase();
  for (const acc of accounts) {
    const firstWord = acc.name.toLowerCase().split(/\s+/)[0];
    if (
      new RegExp(`\\b${escapeRegex(acc.name.toLowerCase())}\\b`, 'i').test(lower) ||
      new RegExp(`\\b${escapeRegex(firstWord)}\\b`, 'i').test(lower)
    ) {
      return acc;
    }
  }
  return null;
}

function titleCase(str: string): string {
  return str
    .trim()
    .split(/\s+/)
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join(' ');
}

function parseSingleIntent(
  rawText: string,
  catalog: KiranaItem[],
  accounts: UdhaarAccount[],
  confidence: number
): VoiceCommand {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  // 0. Mid-sentence self-correction check: "Rendu kg sugar—vaddu, make it moodu kg sugar"
  const correctionTriggers =
    /(?:\bvaddu\b|\bnahi\b|\bno,?\s*make it\b|\bcancel that\b|\bkaadu\b|\bkadu\b|\bchange to\b|\bactually make it\b)/i;
  if (correctionTriggers.test(lower)) {
    const parts = text.split(correctionTriggers);
    const correctedTail = parts[parts.length - 1]?.trim() ?? '';
    if (correctedTail.length > 0) {
      const correctedItem = findMatchingItem(correctedTail, catalog) || findMatchingItem(parts[0] ?? '', catalog);
      if (correctedItem) {
        const parsedQty = parseQuantityForItem(correctedTail, correctedItem);
        return {
          type: 'bill_items',
          items: [
            {
              itemId: correctedItem.id,
              itemName: correctedItem.name,
              quantity: parsedQty.quantity,
              unit: correctedItem.unit,
              displayQty: parsedQty.displayQty,
              orderedByRupees: parsedQty.orderedByRupees,
            },
          ],
          finalizeBill: /\b(checkout|check\s*out|bill done|finish bill|done)\b/i.test(correctedTail),
          isCorrection: true,
        };
      }
    }
  }

  // 1. Misheard / Rhyming / Low-confidence (<0.75) check
  for (const pair of RHYMING_PAIRS) {
    const heardRegex = new RegExp(`\\b${escapeRegex(pair.heard)}\\b`, 'i');
    if (heardRegex.test(lower)) {
      const altItem = findMatchingItem(pair.alternate, catalog);
      const qtyNumMatch = lower.match(/\b(\d+(?:\.\d+)?|ara|paavu|rendu|moodu|one|two|three)\b/i);
      const qtyVal = qtyNumMatch ? parseNumberToken(qtyNumMatch[1]) ?? 1 : 1;
      const unit: PricingUnit = altItem?.unit ?? 'kg';
      const displayQty = formatWeightDisplay(qtyVal, unit);
      const primaryOption: DisambiguationOption = {
        label: `${displayQty} ${altItem?.name ?? pair.alternateName}`,
        itemId: altItem?.id,
        itemName: altItem?.name ?? pair.alternateName,
        quantity: qtyVal,
        unit,
        displayQty,
      };
      const secondaryOption: DisambiguationOption = {
        label: `${displayQty} ${titleCase(pair.heard)}`,
        itemName: titleCase(pair.heard),
        quantity: qtyVal,
        unit,
        displayQty,
      };

      const qtySpoken = unit === 'kg' && qtyVal >= 1 ? `${qtyVal} kilos` : displayQty;
      return {
        type: 'disambiguate',
        pending: {
          id: `disambig-${Date.now()}`,
          originalTranscript: text,
          confidence,
          reason: confidence < 0.75 ? 'low_confidence' : 'rhyming_conflict',
          promptText: `Did you mean ${qtySpoken} ${primaryOption.itemName.toLowerCase()} or ${qtySpoken} ${secondaryOption.itemName.toLowerCase()}? Say yes for ${primaryOption.itemName.toLowerCase()}.`,
          primaryOption,
          secondaryOption,
        },
      };
    }
  }

  // Generic low confidence check (< 0.75) when an item is mentioned
  if (confidence < 0.75) {
    const matched = findMatchingItem(lower, catalog);
    if (matched) {
      const parsedQty = parseQuantityForItem(lower, matched);
      const altItem = catalog.find((i) => i.id !== matched.id) ?? matched;
      return {
        type: 'disambiguate',
        pending: {
          id: `disambig-${Date.now()}`,
          originalTranscript: text,
          confidence,
          reason: 'low_confidence',
          promptText: `Low voice clarity (${Math.round(confidence * 100)}%). Did you mean ${parsedQty.displayQty} ${matched.name.toLowerCase()} or ${parsedQty.displayQty} ${altItem.name.toLowerCase()}? Say yes for ${matched.name.toLowerCase()}.`,
          primaryOption: {
            label: `${parsedQty.displayQty} ${matched.name}`,
            itemId: matched.id,
            itemName: matched.name,
            quantity: parsedQty.quantity,
            unit: matched.unit,
            displayQty: parsedQty.displayQty,
            orderedByRupees: parsedQty.orderedByRupees,
          },
          secondaryOption: {
            label: `${parsedQty.displayQty} ${altItem.name}`,
            itemId: altItem.id,
            itemName: altItem.name,
            quantity: parsedQty.quantity,
            unit: altItem.unit,
            displayQty: parsedQty.displayQty,
          },
        },
      };
    }
  }

  // 2. Step 1A: Add new item ("Add new item Ragi flour, 20 kilos at 55 rupees per kilo")
  const addItemMatch = text.match(
    /(?:add\s+new\s+item|new\s+item|create\s+item)\s+([a-zA-Z\s]+?)(?:,|\s+\d|\s+at\b)/i
  );
  if (addItemMatch) {
    const rawName = addItemMatch[1].trim();
    const qtyMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilos|packets?|packs?|g|grams?)/i);
    const priceMatch = text.match(/(?:at|for|selling|price|rate)\s*(?:₹|rs\.?\s*)?(\d+(?:\.\d+)?)/i);
    const wholesaleMatch = text.match(/wholesale\s*(?:₹|rs\.?\s*)?(\d+(?:\.\d+)?)/i);
    const unit: PricingUnit = /\b(packet|packets|pack|packs)\b/i.test(lower)
      ? 'packet'
      : /\b(gram|grams|gm)\b/i.test(lower) && !/\b(kg|kilo|kilos)\b/i.test(lower)
      ? 'g'
      : 'kg';
    const sellingPrice = priceMatch ? Number(priceMatch[1]) : 50;
    const wholesalePrice = wholesaleMatch
      ? Number(wholesaleMatch[1])
      : Math.max(1, Math.round(sellingPrice * 0.85));
    const stockQty = qtyMatch ? Number(qtyMatch[1]) : 10;

    return {
      type: 'add_item',
      name: titleCase(EXTRA_SYNONYM_HINTS[rawName.toLowerCase()] ?? rawName),
      stockQty,
      sellingPrice,
      wholesalePrice,
      unit,
    };
  }

  // 3. Step 1B: Stock-In ("Poured 25 kg sugar in drum, wholesale 41, selling 46")
  if (/\b(poured|pour|filled|refilled|restocked|stock\s*in|drum|katta)\b/i.test(lower)) {
    const item = findMatchingItem(lower, catalog);
    if (item) {
      const qtyMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilos|packets?|packs?)?/i);
      const wholesaleMatch = lower.match(/wholesale\s*(?:is|at|₹|rs\.?)?\s*(\d+(?:\.\d+)?)/i);
      const sellingMatch = lower.match(/selling\s*(?:is|at|price|rate|₹|rs\.?)?\s*(\d+(?:\.\d+)?)/i);
      const stockQty = /\bkatta\b/i.test(lower)
        ? 25
        : qtyMatch
        ? Number(qtyMatch[1])
        : item.drumCapacity;

      return {
        type: 'stock_in',
        itemId: item.id,
        itemName: item.name,
        stockQty,
        wholesalePrice: wholesaleMatch ? Number(wholesaleMatch[1]) : undefined,
        sellingPrice: sellingMatch ? Number(sellingMatch[1]) : undefined,
      };
    }
  }

  // 4. Step 1C: Edit Rate ("Edit toor dal rate to 135")
  if (/\b(edit|update|change|set)\b.*\b(rate|price|cost|selling)\b/i.test(lower)) {
    const item = findMatchingItem(lower, catalog);
    const rateMatch = lower.match(/(?:to|at|is|=)\s*(?:₹|rs\.?\s*)?(\d+(?:\.\d+)?)/i);
    if (item && rateMatch) {
      const wholesaleMatch = lower.match(/wholesale\s*(?:to|at|is)?\s*(\d+(?:\.\d+)?)/i);
      return {
        type: 'edit_rate',
        itemId: item.id,
        itemName: item.name,
        sellingPrice: Number(rateMatch[1]),
        wholesalePrice: wholesaleMatch ? Number(wholesaleMatch[1]) : undefined,
      };
    }
  }

  // 5. Step 3A: Missing Customer Demand ("Customer asked for Brown Rice, add to supply list")
  if (/\b(asked for|asking for|missing|out of stock|supply list|refill list|customer wants)\b/i.test(lower)) {
    const askedMatch =
      text.match(/(?:asked for|asking for|customer wants|add)\s+([a-zA-Z\s]+?)(?:,|\s+add\b|\s+to\s+supply|\s+to\s+refill|$)/i);
    const rawItem = askedMatch?.[1]?.trim() ?? '';
    if (rawItem.length > 1) {
      const mapped = EXTRA_SYNONYM_HINTS[rawItem.toLowerCase()] ?? titleCase(rawItem);
      return {
        type: 'missing_demand',
        itemName: mapped,
      };
    }
  }

  // 6. Step 3B: Debt Repayment ("Ramesh paid 200 rupees cash")
  const matchedCustomerForPay = detectCustomer(lower, accounts);
  if (matchedCustomerForPay && /\b(paid|gave|settled|repaid|returned|received|icchadu|diya)\b/i.test(lower)) {
    const amountMatch = lower.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
    if (amountMatch) {
      const amount = Number(amountMatch[1].replace(/,/g, ''));
      const method: 'cash' | 'upi' = /\b(upi|phonepe|gpay|paytm|online)\b/i.test(lower) ? 'upi' : 'cash';
      return {
        type: 'udhaar_repayment',
        customerId: matchedCustomerForPay.id,
        customerName: matchedCustomerForPay.name,
        amount,
        method,
      };
    }
  }

  // 7. Step 4: Daily Spends & Profit Inquiry
  const asksProfit = /\b(labham|profit|eeroju|today'?s profit|earning|earnings|kamai|munafa)\b/i.test(lower);
  const mentionsSpend = /\b(paid|spent|spend|expense|milk van|mandi|auto|electricity|rent|helper|transport)\b/i.test(
    lower
  );

  if (mentionsSpend && !matchedCustomerForPay) {
    const spends: Array<{
      label: string;
      amount: number;
      category: 'vendor' | 'transport' | 'utility' | 'other';
    }> = [];

    // Split spend clauses by comma / "and" / period before profit question (preserving thousand commas like 1,450)
    const spendClause = (text.split(/(?:eeroju|what is today|today's profit)/i)[0] ?? text).replace(
      /(\d),(\d{3})\b/g,
      '$1$2'
    );
    const subSegments = spendClause.split(/,|\band\b|\./i).map((s) => s.trim()).filter(Boolean);

    for (const seg of subSegments) {
      const amtMatch = seg.match(/(?:₹|rs\.?\s*)?(\d+(?:,\d+)*(?:\.\d+)?)/i);
      if (!amtMatch) continue;
      const amount = Number(amtMatch[1].replace(/,/g, ''));
      if (amount <= 0) continue;

      const cleanedLabel = seg
        .replace(/\b(paid|spent|spend|gave|to|for|rupees|rs|₹)\b/gi, ' ')
        .replace(/\d+(?:,\d+)*(?:\.\d+)?/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const label = cleanedLabel.length > 1 ? titleCase(cleanedLabel) : 'Shop Expense';
      const category: 'vendor' | 'transport' | 'utility' | 'other' = /\b(auto|van|tempo|transport|mandi)\b/i.test(
        label
      )
        ? /\bmilk\b/i.test(label)
          ? 'vendor'
          : 'transport'
        : /\b(milk|supplier|wholesale|vendor)\b/i.test(label)
        ? 'vendor'
        : /\b(power|electricity|current|rent|water)\b/i.test(label)
        ? 'utility'
        : 'other';

      spends.push({ label, amount, category });
    }

    if (spends.length > 0) {
      return {
        type: 'log_spends',
        spends,
        askProfit: asksProfit,
      };
    }
  }

  if (asksProfit) {
    return { type: 'ask_profit' };
  }

  // 8. Step 2: Rush-Hour Billing (multi-item + optional Udhaar + Checkout)
  const segments = text
    .split(/,|\band\b|\+/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const parsedItems: ParsedBillItem[] = [];
  let customer = detectCustomer(lower, accounts);
  const checkoutRe = /\b(checkout|check\s*out|bill done|bill complete|finish bill|close bill|bill chey)\b/i;
  let finalizeBill = checkoutRe.test(lower);
  const voicePaymentMethod: 'cash' | 'upi' | 'udhaar' | undefined = customer
    ? 'udhaar'
    : /\b(upi|phonepe|gpay|paytm|online)\b/i.test(lower)
    ? 'upi'
    : /\bcash\b/i.test(lower)
    ? 'cash'
    : undefined;

  for (const seg of segments) {
    const segLower = seg.toLowerCase();
    const matches = findAllMatchingItems(seg, catalog);
    if (matches.length === 0) {
      if (checkoutRe.test(segLower) || /\b(cash|upi)\s*(checkout|check\s*out)\b/i.test(segLower)) {
        finalizeBill = true;
      } else if (/\b(account|udhaar|udhar|khata|credit|tab)\b/i.test(segLower)) {
        const c = detectCustomer(segLower, accounts);
        if (c) customer = c;
      }
      continue;
    }

    if (matches.length === 1) {
      const item = matches[0].item;
      const { quantity, displayQty, orderedByRupees } = parseQuantityForItem(seg, item);
      parsedItems.push({
        itemId: item.id,
        itemName: item.name,
        quantity,
        unit: item.unit,
        displayQty,
        orderedByRupees,
      });
      continue;
    }

    // Multiple items spoken continuously without commas (e.g. "ara kilo sugar rendu oil packets 20 rupees pallilu")
    let lastConsumedEnd = 0;
    for (let idx = 0; idx < matches.length; idx++) {
      const current = matches[idx];
      const prevEnd = idx === 0 ? 0 : Math.max(matches[idx - 1].end, lastConsumedEnd);
      const nextStart = idx === matches.length - 1 ? seg.length : matches[idx + 1].start;
      const prefixSlice = seg.slice(prevEnd, current.start).trim();
      const suffixSlice = seg.slice(current.end, nextStart).trim();

      const hasExplicitQty = (slice: string) =>
        /(?:₹|rs\.?\s*\d|\d|\b(?:ara|paavu|pavu|paav|quarter|adha|aadha|half|muppaavu|okati|oka|ek|one|rendu|do|two|moodu|mudu|teen|three|nalugu|char|four|aidu|paanch|panch|five|aaru|chhe|six|ten|padi|das|katta)\b)/i.test(
          slice
        );

      let qtySource: string;
      if (hasExplicitQty(prefixSlice)) {
        qtySource = `${prefixSlice} ${seg.slice(current.start, current.end)}`;
        lastConsumedEnd = current.end;
      } else if (hasExplicitQty(suffixSlice)) {
        qtySource = `${seg.slice(current.start, current.end)} ${suffixSlice}`;
        lastConsumedEnd = nextStart;
      } else {
        qtySource = seg.slice(current.start, current.end);
        lastConsumedEnd = current.end;
      }

      const { quantity, displayQty, orderedByRupees } = parseQuantityForItem(
        qtySource,
        current.item
      );
      parsedItems.push({
        itemId: current.item.id,
        itemName: current.item.name,
        quantity,
        unit: current.item.unit,
        displayQty,
        orderedByRupees,
      });
    }
  }

  if (parsedItems.length > 0 || finalizeBill) {
    return {
      type: 'bill_items',
      items: parsedItems,
      customerId: customer?.id,
      customerName: customer?.name,
      paymentMethod: customer ? 'udhaar' : voicePaymentMethod,
      finalizeBill,
    };
  }

  // 9. Street / Crowd Noise Filter
  return {
    type: 'noise',
    reason: 'No Kirana item, quantity, or shop command detected — ignored background chatter.',
  };
}

export function parseVoiceUtterance(
  transcript: string,
  catalog: KiranaItem[],
  accounts: UdhaarAccount[],
  options?: {
    confidence?: number;
    pendingDisambiguation?: PendingDisambiguation | null;
  }
): VoiceCommand {
  const confidence = options?.confidence ?? 0.95;
  const trimmed = normalizeIndianPhonetics(transcript);
  const lower = trimmed.toLowerCase();

  if (!trimmed) {
    return { type: 'noise', reason: 'Empty speech input ignored.' };
  }

  // Handle pending disambiguation reply ("yes", "avunu", "haan", "sugar", "salt", "cancel")
  if (options?.pendingDisambiguation) {
    const pending = options.pendingDisambiguation;
    if (/\b(cancel|stop|vaddu|nahi|ignore)\b/i.test(lower)) {
      return { type: 'resolve_disambiguation', choice: 'cancel' };
    }
    if (
      /\b(yes|yeah|yep|correct|avunu|haan|ha|ok|confirm)\b/i.test(lower) ||
      lower.includes(pending.primaryOption.itemName.toLowerCase())
    ) {
      return { type: 'resolve_disambiguation', choice: 'primary' };
    }
    if (lower.includes(pending.secondaryOption.itemName.toLowerCase()) || /\b(second|no)\b/i.test(lower)) {
      return { type: 'resolve_disambiguation', choice: 'secondary' };
    }
  }

  // Support compound multi-sentence voice commands (e.g. Step 3: "Customer asked for Brown Rice, add to supply list. Ramesh paid 200 rupees cash")
  const sentences = trimmed
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length > 1) {
    // Check if it's Step 4 spend + profit (handled together in one command)
    const combinedCheck = parseSingleIntent(trimmed, catalog, accounts, confidence);
    if (combinedCheck.type === 'log_spends') {
      return combinedCheck;
    }

    const subCommands = sentences
      .map((s) => parseSingleIntent(s, catalog, accounts, confidence))
      .filter((cmd) => cmd.type !== 'noise');

    if (subCommands.length > 1) {
      return { type: 'compound', commands: subCommands };
    }
    if (subCommands.length === 1) {
      return subCommands[0];
    }
  }

  return parseSingleIntent(trimmed, catalog, accounts, confidence);
}
