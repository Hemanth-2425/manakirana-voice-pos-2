export type PricingUnit = 'kg' | 'g' | 'packet';

export type PaymentMethod = 'cash' | 'upi' | 'udhaar';

export type PrivacyMode = 'phone-only' | 'cloud-sync';

export type VoiceLangCode = 'en-IN' | 'te-IN' | 'hi-IN';

export type OutputVoiceLanguage =
  | 'auto'
  | 'en-IN'
  | 'te-IN'
  | 'hi-IN'
  | 'ta-IN'
  | 'kn-IN'
  | 'mr-IN';

export type VoiceGender = 'male' | 'female';

export type SpeakingSpeed = 'relaxed' | 'normal' | 'brisk';

export interface ShopProfile {
  shopName: string;
  ownerName: string;
  phone: string;
  area: string;
}

export interface ShopSession {
  isLoggedIn: boolean;
  hasCompletedSlides: boolean;
}

export interface VoiceOutputSettings {
  outputLanguage: OutputVoiceLanguage;
  voiceGender: VoiceGender;
  speakingSpeed: SpeakingSpeed;
}

export type TabId = 'counter' | 'stock' | 'refill' | 'udhaar' | 'profit' | 'profile';

export interface KiranaItem {
  id: string;
  name: string;
  localLabel: string;
  synonyms: string[];
  unit: PricingUnit;
  /** Current live stock in item's native unit (kg for kg, grams for g, packets for packet) */
  stockQty: number;
  /** Full drum or shelf capacity in native unit (default 25 for kg drums) */
  drumCapacity: number;
  wholesalePrice: number;
  sellingPrice: number;
  /** Loose drum items incur 1.5% tarugu (spillage/weighing loss) */
  isLoose: boolean;
  /** Units sold earlier today (used for AI Most Sold vs Most Profited rankings) */
  todaySoldQty: number;
  todayRevenue: number;
  todayWholesaleCost: number;
  todayTaruguCost: number;
}

export interface BillLine {
  id: string;
  itemId: string;
  itemName: string;
  unit: PricingUnit;
  /** Quantity billed in item's native unit (e.g., 0.5 kg, 2 packets, 0.167 kg) */
  quantity: number;
  /** Human-readable weight/qty label (e.g., "500g", "2 packets", "167g") */
  displayQty: string;
  /** Extra 1.5% tarugu deducted from loose drum stock */
  taruguQty: number;
  unitPrice: number;
  wholesalePrice: number;
  lineTotal: number;
  isLoose: boolean;
  orderedByRupees?: number;
}

export interface CompletedSale {
  id: string;
  timestamp: string;
  items: BillLine[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  customerId?: string;
  customerName?: string;
  taruguLossRupees: number;
  netProfitRupees: number;
}

export interface UdhaarTransaction {
  id: string;
  timestamp: string;
  type: 'credit' | 'repayment';
  amount: number;
  method?: 'cash' | 'upi';
  note: string;
}

export interface UdhaarAccount {
  id: string;
  name: string;
  phone: string;
  balance: number;
  lastUpdated: string;
  transactions: UdhaarTransaction[];
}

export interface MissingDemandItem {
  id: string;
  name: string;
  requestedCount: number;
  requestedAt: string;
  note: string;
}

export interface DailySpend {
  id: string;
  label: string;
  category: 'vendor' | 'transport' | 'utility' | 'other';
  amount: number;
  timestamp: string;
}

export interface DisambiguationOption {
  label: string;
  itemId?: string;
  itemName: string;
  quantity: number;
  unit: PricingUnit;
  displayQty: string;
  orderedByRupees?: number;
}

export interface PendingDisambiguation {
  id: string;
  originalTranscript: string;
  confidence: number;
  reason: 'low_confidence' | 'rhyming_conflict';
  promptText: string;
  primaryOption: DisambiguationOption;
  secondaryOption: DisambiguationOption;
}

export interface VoiceLogEntry {
  id: string;
  timestamp: string;
  transcript: string;
  response: string;
  status: 'success' | 'warning' | 'disambiguate' | 'noise';
  engine: 'offline' | 'sarvam';
}

export interface VoiceClaritySummary {
  confidence: number;
  normalizedTranscript: string;
  wasPhoneticRepaired: boolean;
  understoodTokens: string[];
}

export interface AppState {
  items: KiranaItem[];
  activeBill: BillLine[];
  activeCustomerId: string | null;
  salesHistory: CompletedSale[];
  udhaarAccounts: UdhaarAccount[];
  missingDemand: MissingDemandItem[];
  dailySpends: DailySpend[];
  privacyMode: PrivacyMode;
  voiceLang: VoiceLangCode;
  shopProfile: ShopProfile;
  voiceOutput: VoiceOutputSettings;
  pendingDisambiguation: PendingDisambiguation | null;
  lastTranscript: string;
  lastSpokenResponse: string;
  lastVoiceStatus: 'idle' | 'listening' | 'speaking' | 'disambiguate' | 'noise';
  lastVoiceClarity: VoiceClaritySummary | null;
  lastBillSummary: {
    total: number;
    method: PaymentMethod;
    customerName?: string;
    itemCount: number;
    warning?: string;
  } | null;
  voiceLogs: VoiceLogEntry[];
}
