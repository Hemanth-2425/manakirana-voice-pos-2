import { AppState, KiranaItem } from './types';

export const TARUGU_RATE = 0.015; // 1.5% spillage/weighing buffer for loose drum stock
export const LOW_STOCK_THRESHOLD = 0.15; // 15% of drum capacity triggers refill alert

export const SEED_ITEMS: KiranaItem[] = [
  {
    id: 'sugar',
    name: 'Sugar',
    localLabel: 'Panchadara · Cheeni',
    synonyms: ['sugar', 'cheeni', 'chini', 'shakkar', 'panchadara', 'sakkara'],
    unit: 'kg',
    stockQty: 18.5,
    drumCapacity: 25,
    wholesalePrice: 41,
    sellingPrice: 46,
    isLoose: true,
    todaySoldQty: 42,
    todayRevenue: 1932,
    todayWholesaleCost: 1722,
    todayTaruguCost: 26,
  },
  {
    id: 'toor-dal',
    name: 'Toor Dal',
    localLabel: 'Kandipappu · Arhar',
    synonyms: ['toor dal', 'toor', 'tur dal', 'kandipappu', 'kandi pappu', 'arhar', 'arhar dal', 'pappu', 'dal'],
    unit: 'kg',
    stockQty: 3.0, // 12% of 25kg drum -> Low-stock alert active!
    drumCapacity: 25,
    wholesalePrice: 112,
    sellingPrice: 132,
    isLoose: true,
    todaySoldQty: 22.3,
    todayRevenue: 2944,
    todayWholesaleCost: 2498,
    todayTaruguCost: 37, // Net profit = 2944 - 2498 - 37 = ₹409!
  },
  {
    id: 'sunflower-oil',
    name: 'Sunflower Oil',
    localLabel: 'Nune Packet · Tel',
    synonyms: ['oil', 'sunflower oil', 'oil packet', 'oil packets', 'cooking oil', 'nune', 'tel', 'refined oil'],
    unit: 'packet',
    stockQty: 14,
    drumCapacity: 25,
    wholesalePrice: 124,
    sellingPrice: 138,
    isLoose: false,
    todaySoldQty: 11,
    todayRevenue: 1518,
    todayWholesaleCost: 1364,
    todayTaruguCost: 0,
  },
  {
    id: 'groundnuts',
    name: 'Groundnuts',
    localLabel: 'Pallilu · Mungfali',
    synonyms: ['groundnuts', 'groundnut', 'pallilu', 'palli', 'verusenaga', 'mungfali', 'peanuts', 'peanut', 'shengdana'],
    unit: 'kg',
    stockQty: 11.4,
    drumCapacity: 25,
    wholesalePrice: 98,
    sellingPrice: 120,
    isLoose: true,
    todaySoldQty: 5.0,
    todayRevenue: 600,
    todayWholesaleCost: 490,
    todayTaruguCost: 7,
  },
  {
    id: 'wheat-flour',
    name: 'Wheat Flour (Atta)',
    localLabel: 'Godhuma Pindi · Atta',
    synonyms: ['atta', 'aata', 'wheat flour', 'godhuma pindi', 'wheat', 'chakki atta', 'flour'],
    unit: 'kg',
    stockQty: 19.0,
    drumCapacity: 25,
    wholesalePrice: 34,
    sellingPrice: 40,
    isLoose: true,
    todaySoldQty: 7.0,
    todayRevenue: 280,
    todayWholesaleCost: 238,
    todayTaruguCost: 4,
  },
  {
    id: 'jaggery',
    name: 'Jaggery',
    localLabel: 'Bellam · Gud',
    synonyms: ['jaggery', 'bellam', 'gud', 'gur', 'vellam'],
    unit: 'kg',
    stockQty: 14.2,
    drumCapacity: 25,
    wholesalePrice: 58,
    sellingPrice: 72,
    isLoose: true,
    todaySoldQty: 2.0,
    todayRevenue: 146,
    todayWholesaleCost: 116,
    todayTaruguCost: 2,
  },
];

// Baseline morning sales sum: 1932 + 2944 + 1518 + 600 + 280 + 146 = ₹7,420
// Baseline wholesale cost sum: 1722 + 2498 + 1364 + 490 + 238 + 116 = ₹6,428
// Wait: let's ensure Step 4 math matches realistic shop economics!
// Let's also check: gross margin across morning sales + Toor Dal ₹409 profit:
// Let's inspect: if morning sales = ₹7,420 and spends = ₹1,670, net profit = ₹1,940 would mean gross profit after tarugu is ₹3,610 (on higher margin items or broader shop revenue).
// Better yet, let's adjust baseline wholesale/selling or keep morning opening summary transparent so:
// Revenue = ₹7,420, Item Profit after Tarugu = ₹3,610 (including small-pack masala/spices margin ₹2,690 + 6 core items ₹920, OR calibrated wholesale/sales history) — wait: let's keep the 6 items' exact wholesale/selling prices realistic (Sugar 41/46, Toor Dal 112/132, Oil 124/138, Groundnuts 98/120, Atta 34/40, Jaggery 58/72) and have a realistic morning sales ledger!

export const INITIAL_STATE: AppState = {
  items: SEED_ITEMS,
  activeBill: [],
  activeCustomerId: null,
  salesHistory: [
    {
      id: 'sale-morning-1',
      timestamp: '07:45 AM',
      items: [],
      totalAmount: 4280,
      paymentMethod: 'cash',
      taruguLossRupees: 44,
      netProfitRupees: 2110,
    },
    {
      id: 'sale-morning-2',
      timestamp: '09:15 AM',
      items: [],
      totalAmount: 3140,
      paymentMethod: 'upi',
      taruguLossRupees: 32,
      netProfitRupees: 1500,
    },
  ],
  udhaarAccounts: [
    {
      id: 'ramesh',
      name: 'Ramesh',
      phone: '+91 98480 41290',
      balance: 531, // + ₹319 Step 2 bill = ₹850; - ₹200 Step 3 repayment = ₹650!
      lastUpdated: 'Yesterday, 7:40 PM',
      transactions: [
        {
          id: 'tx-r1',
          timestamp: 'Yesterday, 7:40 PM',
          type: 'credit',
          amount: 531,
          note: '2 kg Toor Dal, 5 kg Atta, 1 kg Bellam',
        },
      ],
    },
    {
      id: 'lakshmi',
      name: 'Lakshmi Devi',
      phone: '+91 94401 88312',
      balance: 420,
      lastUpdated: 'Yesterday, 6:15 PM',
      transactions: [
        {
          id: 'tx-l1',
          timestamp: 'Yesterday, 6:15 PM',
          type: 'credit',
          amount: 620,
          note: 'Monthly grains & oil pack',
        },
        {
          id: 'tx-l2',
          timestamp: 'Today, 8:10 AM',
          type: 'repayment',
          amount: 200,
          method: 'upi',
          note: 'UPI repayment',
        },
      ],
    },
    {
      id: 'suresh',
      name: 'Suresh Rao',
      phone: '+91 98661 23014',
      balance: 285,
      lastUpdated: '2 days ago, 8:20 PM',
      transactions: [
        {
          id: 'tx-s1',
          timestamp: '2 days ago, 8:20 PM',
          type: 'credit',
          amount: 285,
          note: '2 packets Sunflower Oil, 250g Groundnuts',
        },
      ],
    },
    {
      id: 'anitha',
      name: 'Anitha Reddy',
      phone: '+91 90004 51782',
      balance: 160,
      lastUpdated: 'Yesterday, 9:05 AM',
      transactions: [
        {
          id: 'tx-a1',
          timestamp: 'Yesterday, 9:05 AM',
          type: 'credit',
          amount: 160,
          note: '4 kg Wheat Flour (Atta)',
        },
      ],
    },
    {
      id: 'venkat',
      name: 'Venkat Reddy',
      phone: '+91 97015 64209',
      balance: 0,
      lastUpdated: '3 days ago, 6:45 PM',
      transactions: [
        {
          id: 'tx-v1',
          timestamp: '3 days ago, 6:45 PM',
          type: 'repayment',
          amount: 340,
          method: 'cash',
          note: 'Settled previous week tab',
        },
      ],
    },
    {
      id: 'padma',
      name: 'Padma Kumari',
      phone: '+91 99492 77831',
      balance: 194,
      lastUpdated: 'Yesterday, 7:10 PM',
      transactions: [
        {
          id: 'tx-p1',
          timestamp: 'Yesterday, 7:10 PM',
          type: 'credit',
          amount: 194,
          note: '1 kg Toor Dal, 1 kg Jaggery',
        },
      ],
    },
  ],
  missingDemand: [
    {
      id: 'demand-cardamom',
      name: 'Cardamom (Yelakulu)',
      requestedCount: 2,
      requestedAt: '08:20 AM',
      note: '2 customers asked for 50g packs',
    },
  ],
  dailySpends: [],
  privacyMode: 'phone-only',
  voiceLang: 'en-IN',
  shopProfile: {
    shopName: 'Sri Lakshmi Kirana & General Store',
    ownerName: 'Venkatesh Rao',
    phone: '+91 98480 11223',
    area: 'Kukatpally, Hyderabad',
  },
  voiceOutput: {
    outputLanguage: 'auto',
    voiceGender: 'female',
    speakingSpeed: 'normal',
  },
  pendingDisambiguation: null,
  lastTranscript: '',
  lastSpokenResponse: 'ManaKirana ready. Tap Continuous Mic, speak items, and say "Checkout" when done.',
  lastVoiceStatus: 'idle',
  lastVoiceClarity: null,
  lastBillSummary: null,
  voiceLogs: [],
};

export interface OutputLanguageOption {
  code: import('./types').OutputVoiceLanguage;
  label: string;
  nativeLabel: string;
  description: string;
  sampleText: string;
}

export const OUTPUT_VOICE_LANGUAGES: OutputLanguageOption[] = [
  {
    code: 'auto',
    label: 'Auto (Match Spoken Language)',
    nativeLabel: 'EN / తెలుగు / हिन्दी',
    description: 'Automatically replies in whichever language you just spoke at the counter.',
    sampleText: 'Sugar 500 grams, 2 oil packets, groundnuts 167 grams. Total 319 rupees added to Ramesh account.',
  },
  {
    code: 'en-IN',
    label: 'Indian English',
    nativeLabel: 'English (India)',
    description: 'Warm, natural Indian English counter confirmations.',
    sampleText: 'Sugar 500 grams, 2 oil packets, groundnuts 167 grams. Total 319 rupees added to Ramesh account.',
  },
  {
    code: 'te-IN',
    label: 'Telugu',
    nativeLabel: 'తెలుగు',
    description: 'Natural conversational Telugu replies for billing, drum stock, and Udhaar.',
    sampleText: 'చక్కెర 500 గ్రాములు, 2 నూనె ప్యాకెట్లు, పల్లీలు 167 గ్రాములు. మొత్తం 319 రూపాయలు రమేష్ ఖాతాలో జమ అయ్యాయి.',
  },
  {
    code: 'hi-IN',
    label: 'Hindi',
    nativeLabel: 'हिन्दी',
    description: 'Natural conversational Hindi replies for billing, drum stock, and Udhaar.',
    sampleText: 'चीनी 500 ग्राम, 2 तेल के पैकेट, मूंगफली 167 ग्राम। कुल 319 रुपये रमेश के खाते में जुड़ गए हैं।',
  },
  {
    code: 'ta-IN',
    label: 'Tamil',
    nativeLabel: 'தமிழ்',
    description: 'Smooth spoken Tamil counter confirmations and Udhaar updates.',
    sampleText: 'சர்க்கரை 500 கிராம், 2 எண்ணெய் பாக்கெட்டுகள், வேர்க்கடலை 167 கிராம். மொத்தம் 319 ரூபாய் ரமேஷ் கணக்கில் சேர்க்கப்பட்டது.',
  },
  {
    code: 'kn-IN',
    label: 'Kannada',
    nativeLabel: 'ಕನ್ನಡ',
    description: 'Smooth spoken Kannada counter confirmations and Udhaar updates.',
    sampleText: 'ಸಕ್ಕರೆ 500 ಗ್ರಾಂ, 2 ಎಣ್ಣೆ ಪ್ಯಾಕೆಟ್‌ಗಳು, ಶೇಂಗಾ 167 ಗ್ರಾಂ. ಒಟ್ಟು 319 ರೂಪಾಯಿ ರಮೇಶ್ ಖಾತೆಗೆ ಸೇರಿಸಲಾಗಿದೆ.',
  },
  {
    code: 'mr-IN',
    label: 'Marathi',
    nativeLabel: 'मराठी',
    description: 'Smooth spoken Marathi counter confirmations and Udhaar updates.',
    sampleText: 'साखर 500 ग्रॅम, 2 तेलाचे पॅकेट, शेंगदाणे 167 ग्रॅम. एकूण 319 रुपये रमेश यांच्या खात्यात जमा झाले आहेत.',
  },
];
