import type { OutputVoiceLanguage } from './types.ts';

export type ConcreteOutputLang = Exclude<OutputVoiceLanguage, 'auto'>;

const NATIVE_SCRIPT_CHECK: Record<string, RegExp> = {
  'te-IN': /[\u0C00-\u0C7F]/,
  'hi-IN': /[\u0900-\u097F]/,
  'ta-IN': /[\u0B80-\u0BFF]/,
  'kn-IN': /[\u0C80-\u0CFF]/,
  'mr-IN': /[\u0900-\u097F]/,
};

interface LangPack {
  items: Array<[RegExp, string]>;
  units: {
    grams: string;
    kilos: string;
    kilo: string;
    packets: string;
    packet: string;
    rupees: string;
  };
  payment: {
    cash: string;
    upi: string;
  };
}

const LANG_PACKS: Record<Exclude<ConcreteOutputLang, 'en-IN'>, LangPack> = {
  'te-IN': {
    items: [
      [/\bwheat flour\s*\(atta\)/gi, 'గోధుమ పిండి'],
      [/\bwheat flour\b/gi, 'గోధుమ పిండి'],
      [/\batta\b/gi, 'గోధుమ పిండి'],
      [/\bsunflower oil\b/gi, 'సన్‌ఫ్లవర్ నూనె'],
      [/\bcooking oil\b/gi, 'వంట నూనె'],
      [/\boil\b/gi, 'నూనె'],
      [/\btoor dal\b/gi, 'కందిపప్పు'],
      [/\bsugar\b/gi, 'చక్కెర'],
      [/\bgroundnuts?\b/gi, 'పల్లీలు'],
      [/\bjaggery\b/gi, 'బెల్లం'],
      [/\bsalt\b/gi, 'ఉప్పు'],
      [/\bbrown rice\b/gi, 'బ్రౌన్ రైస్'],
      [/\brice\b/gi, 'బియ్యం'],
      [/\bragi flour\b/gi, 'రాగి పిండి'],
      [/\bcardamom\b/gi, 'ఏలకులు'],
      [/\bmilk van\b/gi, 'పాల వ్యాన్'],
      [/\bmandi auto\b/gi, 'మండి ఆటో'],
    ],
    units: {
      grams: 'గ్రాములు',
      kilos: 'కిలోలు',
      kilo: 'కిలో',
      packets: 'ప్యాకెట్లు',
      packet: 'ప్యాకెట్',
      rupees: 'రూపాయలు',
    },
    payment: {
      cash: 'నగదు',
      upi: 'యూపీఐ',
    },
  },
  'hi-IN': {
    items: [
      [/\bwheat flour\s*\(atta\)/gi, 'आटा'],
      [/\bwheat flour\b/gi, 'आटा'],
      [/\batta\b/gi, 'आटा'],
      [/\bsunflower oil\b/gi, 'सनफ्लावर तेल'],
      [/\bcooking oil\b/gi, 'खाना पकाने का तेल'],
      [/\boil\b/gi, 'तेल'],
      [/\btoor dal\b/gi, 'तूर दाल'],
      [/\bsugar\b/gi, 'चीनी'],
      [/\bgroundnuts?\b/gi, 'मूंगफली'],
      [/\bjaggery\b/gi, 'गुड़'],
      [/\bsalt\b/gi, 'नमक'],
      [/\bbrown rice\b/gi, 'ब्राउन राइस'],
      [/\brice\b/gi, 'चावल'],
      [/\bragi flour\b/gi, 'रागी आटा'],
      [/\bcardamom\b/gi, 'इलायची'],
      [/\bmilk van\b/gi, 'दूध वैन'],
      [/\bmandi auto\b/gi, 'मंडी ऑटो'],
    ],
    units: {
      grams: 'ग्राम',
      kilos: 'किलो',
      kilo: 'किलो',
      packets: 'पैकेट',
      packet: 'पैकेट',
      rupees: 'रुपये',
    },
    payment: {
      cash: 'नकद',
      upi: 'यूपीआई',
    },
  },
  'ta-IN': {
    items: [
      [/\bwheat flour\s*\(atta\)/gi, 'கோதுமை மாவு'],
      [/\bwheat flour\b/gi, 'கோதுமை மாவு'],
      [/\batta\b/gi, 'கோதுமை மாவு'],
      [/\bsunflower oil\b/gi, 'சூரியகாந்தி எண்ணெய்'],
      [/\bcooking oil\b/gi, 'சமையல் எண்ணெய்'],
      [/\boil\b/gi, 'எண்ணெய்'],
      [/\btoor dal\b/gi, 'துவரம் பருப்பு'],
      [/\bsugar\b/gi, 'சர்க்கரை'],
      [/\bgroundnuts?\b/gi, 'வேர்க்கடலை'],
      [/\bjaggery\b/gi, 'வெல்லம்'],
      [/\bsalt\b/gi, 'உப்பு'],
      [/\bbrown rice\b/gi, 'பழுப்பு அரிசி'],
      [/\brice\b/gi, 'அரிசி'],
      [/\bragi flour\b/gi, 'ராகி மாவு'],
      [/\bcardamom\b/gi, 'ஏலக்காய்'],
    ],
    units: {
      grams: 'கிராம்',
      kilos: 'கிலோ',
      kilo: 'கிலோ',
      packets: 'பாக்கெட்டுகள்',
      packet: 'பாக்கெட்',
      rupees: 'ரூபாய்',
    },
    payment: {
      cash: 'பணம்',
      upi: 'யூபிஐ',
    },
  },
  'kn-IN': {
    items: [
      [/\bwheat flour\s*\(atta\)/gi, 'ಗೋಧಿ ಹಿಟ್ಟು'],
      [/\bwheat flour\b/gi, 'ಗೋಧಿ ಹಿಟ್ಟು'],
      [/\batta\b/gi, 'ಗೋಧಿ ಹಿಟ್ಟು'],
      [/\bsunflower oil\b/gi, 'ಸೂರ್ಯಕಾಂತಿ ಎಣ್ಣೆ'],
      [/\bcooking oil\b/gi, 'ಅಡುಗೆ ಎಣ್ಣೆ'],
      [/\boil\b/gi, 'ಎಣ್ಣೆ'],
      [/\btoor dal\b/gi, 'ತೊಗರಿ ಬೇಳೆ'],
      [/\bsugar\b/gi, 'ಸಕ್ಕರೆ'],
      [/\bgroundnuts?\b/gi, 'ಶೇಂಗಾ'],
      [/\bjaggery\b/gi, 'ಬೆಲ್ಲ'],
      [/\bsalt\b/gi, 'ಉಪ್ಪು'],
      [/\bbrown rice\b/gi, 'ಬ್ರೌನ್ ರೈಸ್'],
      [/\brice\b/gi, 'ಅಕ್ಕಿ'],
      [/\bragi flour\b/gi, 'ರಾಗಿ ಹಿಟ್ಟು'],
      [/\bcardamom\b/gi, 'ಏಲಕ್ಕಿ'],
    ],
    units: {
      grams: 'ಗ್ರಾಂ',
      kilos: 'ಕಿಲೋ',
      kilo: 'ಕಿಲೋ',
      packets: 'ಪ್ಯಾಕೆಟ್‌ಗಳು',
      packet: 'ಪ್ಯಾಕೆಟ್',
      rupees: 'ರೂಪಾಯಿ',
    },
    payment: {
      cash: 'ನಗದು',
      upi: 'ಯುಪಿಐ',
    },
  },
  'mr-IN': {
    items: [
      [/\bwheat flour\s*\(atta\)/gi, 'गव्हाचे पीठ'],
      [/\bwheat flour\b/gi, 'गव्हाचे पीठ'],
      [/\batta\b/gi, 'गव्हाचे पीठ'],
      [/\bsunflower oil\b/gi, 'सूर्यफूल तेल'],
      [/\bcooking oil\b/gi, 'स्वयंपाकाचे तेल'],
      [/\boil\b/gi, 'तेल'],
      [/\btoor dal\b/gi, 'तूर डाळ'],
      [/\bsugar\b/gi, 'साखर'],
      [/\bgroundnuts?\b/gi, 'शेंगदाणे'],
      [/\bjaggery\b/gi, 'गूळ'],
      [/\bsalt\b/gi, 'मीठ'],
      [/\bbrown rice\b/gi, 'ब्राऊन राईस'],
      [/\brice\b/gi, 'तांदूळ'],
      [/\bragi flour\b/gi, 'नाचणी पीठ'],
      [/\bcardamom\b/gi, 'वेलदोडे'],
    ],
    units: {
      grams: 'ग्रॅम',
      kilos: 'किलो',
      kilo: 'किलो',
      packets: 'पॅकेट',
      packet: 'पॅकेट',
      rupees: 'रुपये',
    },
    payment: {
      cash: 'रोख',
      upi: 'यूपीआय',
    },
  },
};

export function localizeItemPhrase(
  phrase: string,
  targetLang: ConcreteOutputLang
): string {
  if (targetLang === 'en-IN') return phrase;
  const pack = LANG_PACKS[targetLang];
  let out = phrase;

  for (const [pattern, replacement] of pack.items) {
    out = out.replace(pattern, replacement);
  }

  out = out
    .replace(/(\d+(?:\.\d+)?)\s*g\b/gi, `$1 ${pack.units.grams}`)
    .replace(/(\d+(?:\.\d+)?)\s*grams?\b/gi, `$1 ${pack.units.grams}`)
    .replace(/(\d+(?:\.\d+)?)\s*(?:kg|kilos)\b/gi, `$1 ${pack.units.kilos}`)
    .replace(/(\d+(?:\.\d+)?)\s*kilo\b/gi, `$1 ${pack.units.kilo}`)
    .replace(/(\d+(?:\.\d+)?)\s*packets\b/gi, `$1 ${pack.units.packets}`)
    .replace(/(\d+(?:\.\d+)?)\s*packet\b/gi, `$1 ${pack.units.packet}`)
    .replace(/\bpackets\b/gi, pack.units.packets)
    .replace(/\bpacket\b/gi, pack.units.packet)
    .replace(/\bkilos\b/gi, pack.units.kilos)
    .replace(/\bkilo\b/gi, pack.units.kilo)
    .replace(/\bgrams?\b/gi, pack.units.grams)
    .replace(/\brupees\b/gi, pack.units.rupees);

  return out;
}

function translateSingleSentence(
  sentence: string,
  lang: Exclude<ConcreteOutputLang, 'en-IN'>
): string {
  const s = sentence.trim();
  if (!s) return '';

  const scriptRegex = NATIVE_SCRIPT_CHECK[lang];
  // If already mostly in the target native script and contains no common English boilerplate, preserve it
  if (scriptRegex.test(s) && !/\b(Added|Total|Warning|Updated|Ready|Sales|Current|Confirmed)\b/.test(s)) {
    return s;
  }

  const pack = LANG_PACKS[lang];

  // 1. Welcome / ready banner
  if (/^ManaKirana ready\b/i.test(s)) {
    const map: Record<typeof lang, string> = {
      'te-IN': 'మనకిరాణా సిద్ధంగా ఉంది. మైక్ నొక్కి వస్తువులు చెప్పండి, బిల్లు పూర్తి అయ్యాక "చెక్అవుట్" అనండి.',
      'hi-IN': 'मनाकिराना तैयार है। माइक दबाकर सामान बोलें और पूरा होने पर "चेकआउट" कहें।',
      'ta-IN': 'மனகிரானா தயாராக உள்ளது. மைக் அழுத்தி பொருட்களைச் சொல்லுங்கள், முடிந்ததும் "செக்அவுட்" சொல்லுங்கள்.',
      'kn-IN': 'ಮನಕಿರಾಣಾ ಸಿದ್ಧವಾಗಿದೆ. ಮೈಕ್ ಒತ್ತಿ ವಸ್ತುಗಳನ್ನು ಹೇಳಿ, ಮುಗಿದ ಮೇಲೆ "ಚೆಕ್‌ಔಟ್" ಎಂದು ಹೇಳಿ.',
      'mr-IN': 'मनाकिराणा तयार आहे. माईक दाबून वस्तू सांगा आणि झाल्यावर "चेकआउट" म्हणा.',
    };
    return map[lang];
  }

  // 2. Ready for next customer
  if (/^Ready for next customer\.?$/i.test(s)) {
    const map: Record<typeof lang, string> = {
      'te-IN': 'తదుపరి కస్టమర్ కోసం సిద్ధంగా ఉన్నాము.',
      'hi-IN': 'अगले ग्राहक के लिए तैयार हैं।',
      'ta-IN': 'அடுத்த வாடிக்கையாளருக்கு தயாராக உள்ளது.',
      'kn-IN': 'ಮುಂದಿನ ಗ್ರಾಹಕರಿಗೆ ಸಿದ್ಧವಾಗಿದೆ.',
      'mr-IN': 'पुढील ग्राहकासाठी तयार आहोत.',
    };
    return map[lang];
  }

  // 3. Added <items> (without "to bill") -> "Added Sugar 500g, Sunflower Oil 2 packets"
  let m = s.match(/^Added (.+?) to bill\.?$/i);
  if (m) {
    const items = localizeItemPhrase(m[1], lang);
    const map: Record<typeof lang, string> = {
      'te-IN': `${items} బిల్లులో చేర్చాము.`,
      'hi-IN': `${items} बिल में जोड़ दिया है।`,
      'ta-IN': `${items} பில்லில் சேர்க்கப்பட்டது.`,
      'kn-IN': `${items} ಬಿಲ್‌ಗೆ ಸೇರಿಸಲಾಗಿದೆ.`,
      'mr-IN': `${items} बिलात जोडले आहे.`,
    };
    return map[lang];
  }

  // 4. Added <items> (first sentence of bill_items reply)
  m = s.match(/^Added (.+?)\.?$/i);
  if (m && !/at\s+\d+\s+rupees/i.test(m[1])) {
    const items = localizeItemPhrase(m[1], lang);
    const map: Record<typeof lang, string> = {
      'te-IN': `${items} బిల్లులో చేర్చాము.`,
      'hi-IN': `${items} बिल में जोड़ दिए हैं।`,
      'ta-IN': `${items} பில்லில் சேர்க்கப்பட்டது.`,
      'kn-IN': `${items} ಬಿಲ್‌ಗೆ ಸೇರಿಸಲಾಗಿದೆ.`,
      'mr-IN': `${items} बिलात जोडले आहेत.`,
    };
    return map[lang];
  }

  // 5. Current bill total is <N> rupees
  m = s.match(/^Current bill total is ([\d,]+) rupees\.?$/i);
  if (m) {
    const amt = m[1];
    const map: Record<typeof lang, string> = {
      'te-IN': `ప్రస్తుత బిల్లు మొత్తం ${amt} రూపాయలు.`,
      'hi-IN': `अभी का कुल बिल ${amt} रुपये है।`,
      'ta-IN': `தற்போதைய பில் மொத்தம் ${amt} ரூபாய்.`,
      'kn-IN': `ಪ್ರಸ್ತುತ ಬಿಲ್ ಒಟ್ಟು ${amt} ರೂಪಾಯಿ.`,
      'mr-IN': `सध्याचे एकूण बिल ${amt} रुपये आहे.`,
    };
    return map[lang];
  }

  // 6. Total <N> rupees added to <Name> account
  m = s.match(/^Total ([\d,]+) rupees added to (.+?) account\.?$/i);
  if (m) {
    const [, amt, cust] = m;
    const map: Record<typeof lang, string> = {
      'te-IN': `మొత్తం ${amt} రూపాయలు ${cust} ఖాతాలో జమ అయ్యాయి.`,
      'hi-IN': `कुल ${amt} रुपये ${cust} के खाते में जोड़ दिए गए हैं।`,
      'ta-IN': `மொத்தம் ${amt} ரூபாய் ${cust} கணக்கில் சேர்க்கப்பட்டது.`,
      'kn-IN': `ಒಟ್ಟು ${amt} ರೂಪಾಯಿ ${cust} ಖಾತೆಗೆ ಸೇರಿಸಲಾಗಿದೆ.`,
      'mr-IN': `एकूण ${amt} रुपये ${cust} यांच्या खात्यात जमा झाले आहेत.`,
    };
    return map[lang];
  }

  // 7. Total <N> rupees received via CASH/UPI
  m = s.match(/^Total ([\d,]+) rupees received via (CASH|UPI|UDHAAR)\.?$/i);
  if (m) {
    const amt = m[1];
    const methodKey = m[2].toLowerCase() === 'upi' ? 'upi' : 'cash';
    const methodWord = pack.payment[methodKey];
    const map: Record<typeof lang, string> = {
      'te-IN': `మొత్తం ${amt} రూపాయలు ${methodWord} ద్వారా అందింది.`,
      'hi-IN': `कुल ${amt} रुपये ${methodWord} से प्राप्त हुए।`,
      'ta-IN': `மொத்தம் ${amt} ரூபாய் ${methodWord} மூலம் பெறப்பட்டது.`,
      'kn-IN': `ಒಟ್ಟು ${amt} ರೂಪಾಯಿ ${methodWord} ಮೂಲಕ ಪಡೆಯಲಾಗಿದೆ.`,
      'mr-IN': `एकूण ${amt} रुपये ${methodWord} द्वारे प्राप्त झाले.`,
    };
    return map[lang];
  }

  // 8. Low-stock warning
  m = s.match(/^Warning:\s*(.+?)\s+only\s+([\d.]+)\s+(\w+)\s+left[—\-–]+added to wholesale refill list\.?$/i);
  if (m) {
    const item = localizeItemPhrase(m[1], lang);
    const qty = localizeItemPhrase(`${m[2]} ${m[3]}`, lang);
    const map: Record<typeof lang, string> = {
      'te-IN': `గమనిక: ${item} ఇంకా ${qty} మాత్రమే ఉంది, హోల్‌సేల్ రీఫిల్ లిస్ట్‌లో చేర్చాము.`,
      'hi-IN': `ध्यान दें: ${item} सिर्फ ${qty} बचा है, होलसेल रीफिल लिस्ट में जोड़ दिया है।`,
      'ta-IN': `கவனம்: ${item} இன்னும் ${qty} மட்டுமே உள்ளது, மொத்த கொள்முதல் பட்டியலில் சேர்க்கப்பட்டது.`,
      'kn-IN': `ಗಮನಿಸಿ: ${item} ಇನ್ನೂ ${qty} ಮಾತ್ರ ಉಳಿದಿದೆ, ಹೋಲ್‌ಸೇಲ್ ರೀಫಿಲ್ ಪಟ್ಟಿಗೆ ಸೇರಿಸಲಾಗಿದೆ.`,
      'mr-IN': `सूचना: ${item} फक्त ${qty} शिल्लक आहे, होलसेल रीफिल यादीत जोडले आहे.`,
    };
    return map[lang];
  }

  // 9. Drum stock-in update
  m = s.match(
    /^(.+?)\s+drum updated to\s+([\d.]+)\s+(\w+),\s*wholesale\s*([\d.]*),\s*selling\s*([\d.]*)\s*rupees per\s+(\w+)\.?$/i
  );
  if (m) {
    const item = localizeItemPhrase(m[1], lang);
    const qty = localizeItemPhrase(`${m[2]} ${m[3]}`, lang);
    const wholesale = m[4];
    const selling = m[5];
    const unit = localizeItemPhrase(m[6], lang);
    const map: Record<typeof lang, string> = {
      'te-IN': `${item} డ్రమ్ ${qty}కి అప్‌డేట్ అయ్యింది. హోల్‌సేల్ ${wholesale} రూపాయలు, అమ్మకం ధర ${unit}కి ${selling} రూపాయలు.`,
      'hi-IN': `${item} ड्रम ${qty} पर अपडेट हो गया है। होलसेल ${wholesale} रुपये और बिक्री भाव ${selling} रुपये प्रति ${unit} है।`,
      'ta-IN': `${item} டிரம் ${qty} ஆக புதுப்பிக்கப்பட்டது. மொத்த விலை ${wholesale} ரூபாய், விற்பனை விலை ${unit}க்கு ${selling} ரூபாய்.`,
      'kn-IN': `${item} ಡ್ರಮ್ ${qty} ಗೆ ಅಪ್‌ಡೇಟ್ ಆಗಿದೆ. ಹೋಲ್‌ಸೇಲ್ ${wholesale} ರೂಪಾಯಿ, ಮಾರಾಟ ಬೆಲೆ ಪ್ರತಿ ${unit}ಗೆ ${selling} ರೂಪಾಯಿ.`,
      'mr-IN': `${item} ड्रम ${qty} वर अपडेट झाला आहे. होलसेल ${wholesale} रुपये आणि विक्री दर ${selling} रुपये प्रति ${unit} आहे.`,
    };
    return map[lang];
  }

  // 10. Drum quick refill
  m = s.match(/^(.+?)\s+drum refilled to\s+([\d.]+)\s+(\w+)\.?$/i);
  if (m) {
    const item = localizeItemPhrase(m[1], lang);
    const qty = localizeItemPhrase(`${m[2]} ${m[3]}`, lang);
    const map: Record<typeof lang, string> = {
      'te-IN': `${item} డ్రమ్ ${qty}కి నింపాము.`,
      'hi-IN': `${item} ड्रम ${qty} तक भर दिया गया है।`,
      'ta-IN': `${item} டிரம் ${qty} ஆக நிரப்பப்பட்டது.`,
      'kn-IN': `${item} ಡ್ರಮ್ ${qty} ಗೆ ತುಂಬಿಸಲಾಗಿದೆ.`,
      'mr-IN': `${item} ड्रम ${qty} पर्यंत भरला आहे.`,
    };
    return map[lang];
  }

  // 11. Edit selling rate
  m = s.match(/^Updated\s+(.+?)\s+selling rate to\s+([\d.]+)\s+rupees\.?$/i);
  if (m) {
    const item = localizeItemPhrase(m[1], lang);
    const price = m[2];
    const map: Record<typeof lang, string> = {
      'te-IN': `${item} అమ్మకం ధర ${price} రూపాయలకు మార్చాము.`,
      'hi-IN': `${item} का बिक्री भाव ${price} रुपये कर दिया गया है।`,
      'ta-IN': `${item} விற்பனை விலை ${price} ரூபாயாக மாற்றப்பட்டது.`,
      'kn-IN': `${item} ಮಾರಾಟ ಬೆಲೆ ${price} ರೂಪಾಯಿಗೆ ಬದಲಾಯಿಸಲಾಗಿದೆ.`,
      'mr-IN': `${item} चा विक्री दर ${price} रुपये केला आहे.`,
    };
    return map[lang];
  }

  // 12. Add new catalog item
  m = s.match(/^Added\s+(.+?),\s+([\d.]+)\s+(\w+)\s+at\s+([\d.]+)\s+rupees per\s+(\w+)\.?$/i);
  if (m) {
    const item = localizeItemPhrase(m[1], lang);
    const qty = localizeItemPhrase(`${m[2]} ${m[3]}`, lang);
    const price = m[4];
    const unit = localizeItemPhrase(m[5], lang);
    const map: Record<typeof lang, string> = {
      'te-IN': `${item} కొత్తగా ${qty}, ${unit}కి ${price} రూపాయలకు చేర్చాము.`,
      'hi-IN': `नया सामान ${item}, ${qty}, ${price} रुपये प्रति ${unit} के भाव से जोड़ दिया है।`,
      'ta-IN': `புதிய பொருள் ${item}, ${qty}, ${unit}க்கு ${price} ரூபாயில் சேர்க்கப்பட்டது.`,
      'kn-IN': `ಹೊಸ ವಸ್ತು ${item}, ${qty}, ಪ್ರತಿ ${unit}ಗೆ ${price} ರೂಪಾಯಿಗೆ ಸೇರಿಸಲಾಗಿದೆ.`,
      'mr-IN': `नवीन वस्तू ${item}, ${qty}, ${price} रुपये प्रति ${unit} दराने जोडली आहे.`,
    };
    return map[lang];
  }

  // 13. Mid-sentence correction ("Updated sugar to 3 kilos.")
  m = s.match(/^Updated\s+(.+?)\s+to\s+(.+?)\.?$/i);
  if (m) {
    const item = localizeItemPhrase(m[1], lang);
    const qty = localizeItemPhrase(m[2], lang);
    const map: Record<typeof lang, string> = {
      'te-IN': `${item}ను ${qty}కి మార్చాము.`,
      'hi-IN': `${item} को ${qty} कर दिया गया है।`,
      'ta-IN': `${item} ${qty} ஆக மாற்றப்பட்டது.`,
      'kn-IN': `${item} ಅನ್ನು ${qty} ಗೆ ಬದಲಾಯಿಸಲಾಗಿದೆ.`,
      'mr-IN': `${item} बदलून ${qty} केले आहे.`,
    };
    return map[lang];
  }

  // 14. Missing customer demand
  m = s.match(/^(.+?)\s+added to supply list\.?$/i);
  if (m) {
    const item = localizeItemPhrase(m[1], lang);
    const map: Record<typeof lang, string> = {
      'te-IN': `${item} సప్లై లిస్ట్‌లో చేర్చాము.`,
      'hi-IN': `${item} सप्लाई लिस्ट में जोड़ दिया गया है।`,
      'ta-IN': `${item} சப்ளை பட்டியலில் சேர்க்கப்பட்டது.`,
      'kn-IN': `${item} ಸಪ್ಲೈ ಪಟ್ಟಿಗೆ ಸೇರಿಸಲಾಗಿದೆ.`,
      'mr-IN': `${item} सप्लाय यादीत जोडले आहे.`,
    };
    return map[lang];
  }

  // 15. Udhaar repayment
  m = s.match(/^(.+?)\s+remaining Udhaar is\s+([\d,]+)\s+rupees\.?$/i);
  if (m) {
    const [, cust, amt] = m;
    const map: Record<typeof lang, string> = {
      'te-IN': `${cust} మిగిలిన బాకీ ${amt} రూపాయలు.`,
      'hi-IN': `${cust} का बाकी उधार ${amt} रुपये है।`,
      'ta-IN': `${cust} மீதமுள்ள கடன் ${amt} ரூபாய்.`,
      'kn-IN': `${cust} ಬಾಕಿ ಉಧಾರ್ ${amt} ರೂಪಾಯಿ.`,
      'mr-IN': `${cust} यांची शिल्लक उधारी ${amt} रुपये आहे.`,
    };
    return map[lang];
  }

  // 16. Profit summary
  m = s.match(
    /^Sales\s+([\d,]+)\s+rupees,\s*spends\s+([\d,]+)\s+rupees,\s*net profit\s+(-?[\d,]+)\s+rupees\.?$/i
  );
  if (m) {
    const [, sales, spends, profit] = m;
    const map: Record<typeof lang, string> = {
      'te-IN': `ఈరోజు అమ్మకాలు ${sales} రూపాయలు, ఖర్చులు ${spends} రూపాయలు, నికర లాభం ${profit} రూపాయలు.`,
      'hi-IN': `आज की बिक्री ${sales} रुपये, खर्च ${spends} रुपये, और शुद्ध लाभ ${profit} रुपये है।`,
      'ta-IN': `இன்றைய விற்பனை ${sales} ரூபாய், செலவுகள் ${spends} ரூபாய், நிகர லாபம் ${profit} ரூபாய்.`,
      'kn-IN': `ಇಂದಿನ ಮಾರಾಟ ${sales} ರೂಪಾಯಿ, ಖರ್ಚು ${spends} ರೂಪಾಯಿ, ನಿವ್ವಳ ಲಾಭ ${profit} ರೂಪಾಯಿ.`,
      'mr-IN': `आजची विक्री ${sales} रुपये, खर्च ${spends} रुपये, निव्वळ नफा ${profit} रुपये आहे.`,
    };
    return map[lang];
  }

  // 17. Top profit item
  m = s.match(/^Top profit item:\s*(.+?)\s+at\s+([\d,]+)\s+rupees\.?$/i);
  if (m) {
    const item = localizeItemPhrase(m[1], lang);
    const amt = m[2];
    const map: Record<typeof lang, string> = {
      'te-IN': `అత్యధిక లాభం తెచ్చిన వస్తువు: ${item}, ${amt} రూపాయలు.`,
      'hi-IN': `सबसे ज्यादा लाभ देने वाला सामान: ${item}, ${amt} रुपये।`,
      'ta-IN': `அதிக லாபம் தந்த பொருள்: ${item}, ${amt} ரூபாய்.`,
      'kn-IN': `ಅತಿ ಹೆಚ್ಚು ಲಾಭ ತಂದ ವಸ್ತು: ${item}, ${amt} ರೂಪಾಯಿ.`,
      'mr-IN': `सर्वाधिक नफा देणारी वस्तू: ${item}, ${amt} रुपये.`,
    };
    return map[lang];
  }

  // 18. Logged spends
  m = s.match(/^Logged\s+([\d,]+)\s+rupees spend\.?$/i);
  if (m) {
    const amt = m[1];
    const map: Record<typeof lang, string> = {
      'te-IN': `${amt} రూపాయల ఖర్చు నమోదు చేశాము.`,
      'hi-IN': `${amt} रुपये का खर्च दर्ज कर दिया है।`,
      'ta-IN': `${amt} ரூபாய் செலவு பதிவு செய்யப்பட்டது.`,
      'kn-IN': `${amt} ರೂಪಾಯಿ ಖರ್ಚು ದಾಖಲಿಸಲಾಗಿದೆ.`,
      'mr-IN': `${amt} रुपये खर्च नोंदवला आहे.`,
    };
    return map[lang];
  }

  m = s.match(/^Today's net profit is\s+(-?[\d,]+)\s+rupees\.?$/i);
  if (m) {
    const amt = m[1];
    const map: Record<typeof lang, string> = {
      'te-IN': `ఈరోజు నికర లాభం ${amt} రూపాయలు.`,
      'hi-IN': `आज का शुद्ध लाभ ${amt} रुपये है।`,
      'ta-IN': `இன்றைய நிகர லாபம் ${amt} ரூபாய்.`,
      'kn-IN': `ಇಂದಿನ ನಿವ್ವಳ ಲಾಭ ${amt} ರೂಪಾಯಿ.`,
      'mr-IN': `आजचा निव्वळ नफा ${amt} रुपये आहे.`,
    };
    return map[lang];
  }

  // 19. Disambiguation prompt
  m = s.match(/^Did you mean (.+?) or (.+?)\?\s*Say yes for (.+?)\.?$/i);
  if (m) {
    const optA = localizeItemPhrase(m[1], lang);
    const optB = localizeItemPhrase(m[2], lang);
    const primary = localizeItemPhrase(m[3], lang);
    const map: Record<typeof lang, string> = {
      'te-IN': `మీరు ${optA} అడిగారా లేక ${optB} అడిగారా? ${primary} కోసం అవును అనండి.`,
      'hi-IN': `क्या आपका मतलब ${optA} था या ${optB}? ${primary} के लिए हाँ बोलें।`,
      'ta-IN': `நீங்கள் ${optA} கேட்டீர்களா அல்லது ${optB} கேட்டீர்களா? ${primary} என்றால் ஆம் சொல்லுங்கள்.`,
      'kn-IN': `ನೀವು ${optA} ಕೇಳಿದಿರಾ ಅಥವಾ ${optB} ಕೇಳಿದಿರಾ? ${primary} ಗಾಗಿ ಹೌದು ಎಂದು ಹೇಳಿ.`,
      'mr-IN': `तुम्हाला ${optA} हवे आहे की ${optB}? ${primary} साठी हो म्हणा.`,
    };
    return map[lang];
  }

  // 20. Confirmed / Cancelled / Cleared / No items / Noise / Undo
  if (/^Confirmed\.?$/i.test(s)) {
    const map: Record<typeof lang, string> = {
      'te-IN': 'నిర్ధారించబడింది.',
      'hi-IN': 'पुष्टि हो गई।',
      'ta-IN': 'உறுதி செய்யப்பட்டது.',
      'kn-IN': 'ದೃಢೀಕರಿಸಲಾಗಿದೆ.',
      'mr-IN': 'निश्चित झाले.',
    };
    return map[lang];
  }

  if (/^Cancelled\.?$/i.test(s)) {
    const map: Record<typeof lang, string> = {
      'te-IN': 'రద్దు చేశాము.',
      'hi-IN': 'रद्द कर दिया गया।',
      'ta-IN': 'ரத்து செய்யப்பட்டது.',
      'kn-IN': 'ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ.',
      'mr-IN': 'रद्द केले.',
    };
    return map[lang];
  }

  if (/^Bill cleared\.?$/i.test(s)) {
    const map: Record<typeof lang, string> = {
      'te-IN': 'బిల్లు క్లియర్ చేశాము.',
      'hi-IN': 'बिल साफ़ कर दिया गया।',
      'ta-IN': 'பில் நீக்கப்பட்டது.',
      'kn-IN': 'ಬಿಲ್ ತೆರವುಗೊಳಿಸಲಾಗಿದೆ.',
      'mr-IN': 'बिल साफ केले आहे.',
    };
    return map[lang];
  }

  if (/^No items in the bill yet\b/i.test(s)) {
    const map: Record<typeof lang, string> = {
      'te-IN': 'బిల్లులో ఇంకా ఏ వస్తువు లేదు. బిల్లు మొదలుపెట్టడానికి వస్తువు పేరు చెప్పండి.',
      'hi-IN': 'बिल में अभी कोई सामान नहीं है। बिल शुरू करने के लिए सामान का नाम बोलें।',
      'ta-IN': 'பில்லில் இன்னும் பொருட்கள் இல்லை. பில் தொடங்க பொருளின் பெயரைச் சொல்லுங்கள்.',
      'kn-IN': 'ಬಿಲ್‌ನಲ್ಲಿ ಇನ್ನೂ ಯಾವುದೇ ವಸ್ತು ಇಲ್ಲ. ಬಿಲ್ ಪ್ರಾರಂಭಿಸಲು ವಸ್ತುವಿನ ಹೆಸರು ಹೇಳಿ.',
      'mr-IN': 'बिलात अजून कोणतीही वस्तू नाही. बिल सुरू करण्यासाठी वस्तूचे नाव सांगा.',
    };
    return map[lang];
  }

  if (/^Ignored background chatter\b/i.test(s)) {
    const map: Record<typeof lang, string> = {
      'te-IN': 'బయటి శబ్దాన్ని పక్కన పెట్టాము — కిరాణా వస్తువు వినిపించలేదు.',
      'hi-IN': 'बाहरी शोर को छोड़ दिया — कोई किराना सामान नहीं सुनाई दिया।',
      'ta-IN': 'பின்னணி சத்தம் தவிர்க்கப்பட்டது — மளிகைப் பொருள் கேட்கவில்லை.',
      'kn-IN': 'ಹೊರಗಿನ ಶಬ್ದವನ್ನು ಬಿಡಲಾಗಿದೆ — ಯಾವುದೇ ಕಿರಾಣಿ ವಸ್ತು ಕೇಳಿಸಲಿಲ್ಲ.',
      'mr-IN': 'बाहेरील आवाज दुर्लक्षित केला — कोणतीही किराणा वस्तू ऐकू आली नाही.',
    };
    return map[lang];
  }

  if (/^Undid last voice action\b/i.test(s)) {
    const map: Record<typeof lang, string> = {
      'te-IN': 'చివరి వాయిస్ ఆదేశాన్ని వెనక్కి తీసుకున్నాము. తదుపరి ఆదేశానికి సిద్ధం.',
      'hi-IN': 'पिछला वॉइस आदेश वापस ले लिया गया है। अगले आदेश के लिए तैयार हैं।',
      'ta-IN': 'கடைசி குரல் கட்டளை ரத்து செய்யப்பட்டது. அடுத்த கட்டளைக்கு தயார்.',
      'kn-IN': 'ಕೊನೆಯ ಧ್ವನಿ ಆದೇಶವನ್ನು ಹಿಂಪಡೆಯಲಾಗಿದೆ. ಮುಂದಿನ ಆದೇಶಕ್ಕೆ ಸಿದ್ಧ.',
      'mr-IN': 'शेवटची व्हॉइस क्रिया मागे घेतली आहे. पुढील आदेशासाठी तयार.',
    };
    return map[lang];
  }

  // Fallback for item lists (e.g. "Sugar 500g, 2 sunflower oil packets, Groundnuts 167g.")
  return localizeItemPhrase(s, lang);
}

/**
 * Deterministically localizes any ManaKirana counter/billing/stock/profit spoken confirmation
 * into natural, grammatically clean Telugu, Hindi, Tamil, Kannada, Marathi, or Indian English.
 * Runs synchronously offline and online so users ALWAYS hear & see their chosen language.
 */
export function localizeVoiceResponse(
  text: string,
  targetLang: ConcreteOutputLang
): string {
  const trimmed = text.trim();
  if (!trimmed || targetLang === 'en-IN') return trimmed;

  // Split on sentence boundaries (preserving questions like "Did you mean ...? Say yes for ...")
  const disambigMatch = trimmed.match(/^(Did you mean .+? Say yes for .+?\.?)$/i);
  if (disambigMatch) {
    return translateSingleSentence(disambigMatch[1], targetLang);
  }

  const sentences = trimmed
    .split(/(?<=[.!?।])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (sentences.length <= 1) {
    return translateSingleSentence(trimmed, targetLang);
  }

  return sentences
    .map((part) => translateSingleSentence(part, targetLang))
    .filter(Boolean)
    .join(' ');
}
