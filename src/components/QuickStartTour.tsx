import { useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Globe,
  Mic,
  MinusCircle,
  Package,
  PlusCircle,
  ReceiptIndianRupee,
  ShoppingBag,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { OUTPUT_VOICE_LANGUAGES } from '../engine/seedData';
import {
  KiranaItem,
  OutputVoiceLanguage,
  ShopProfile,
  TabId,
  VoiceGender,
} from '../engine/types';
import { ManaKiranaLogo } from './ManaKiranaLogo';

interface OnboardingSlidesProps {
  isOpen: boolean;
  isFirstTimePostLogin?: boolean;
  stepIndex: number;
  shopProfile: ShopProfile;
  items: KiranaItem[];
  outputLanguage: OutputVoiceLanguage;
  voiceGender: VoiceGender;
  onStepChange: (index: number) => void;
  onJumpToTab: (tab: TabId) => void;
  onClose: () => void;
}

const TOTAL_SLIDES = 6;

export function QuickStartTour({
  isOpen,
  isFirstTimePostLogin = false,
  stepIndex,
  shopProfile,
  items,
  outputLanguage,
  voiceGender,
  onStepChange,
  onJumpToTab,
  onClose,
}: OnboardingSlidesProps) {
  const safeIndex = Math.max(0, Math.min(TOTAL_SLIDES - 1, stepIndex));
  const isFirst = safeIndex === 0;
  const isLast = safeIndex === TOTAL_SLIDES - 1;

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && safeIndex < TOTAL_SLIDES - 1) {
        onStepChange(safeIndex + 1);
      } else if (e.key === 'ArrowLeft' && safeIndex > 0) {
        onStepChange(safeIndex - 1);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, onStepChange, safeIndex]);

  if (!isOpen) return null;

  const selectedLang =
    OUTPUT_VOICE_LANGUAGES.find((l) => l.code === outputLanguage) ?? OUTPUT_VOICE_LANGUAGES[0];

  const handleFinish = () => {
    onJumpToTab('counter');
    onClose();
  };

  const progressPct = Math.round(((safeIndex + 1) / TOTAL_SLIDES) * 100);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ManaKirana App Walkthrough Slides"
      data-testid="quick-start-tour-modal"
      className="fixed inset-0 z-50 bg-[#F5F5F7] flex flex-col overflow-hidden"
    >
      {/* Clean Top Bar (No Tabs — Pure Slide Presentation Header) */}
      <header className="bg-white border-b border-black/[0.06] shrink-0">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <ManaKiranaLogo size={34} className="shrink-0" />
            <span className="font-display text-lg font-extrabold tracking-tight text-[#1D1D1F] whitespace-nowrap">
              ManaKirana
            </span>
            <span aria-hidden="true" className="text-black/20">
              ·
            </span>
            <span
              data-testid="slide-counter-label"
              className="text-xs font-semibold text-[#0F766E] tabular-nums whitespace-nowrap"
            >
              Slide {safeIndex + 1} of {TOTAL_SLIDES}
            </span>
          </div>

          <button
            type="button"
            data-testid="slides-skip-btn"
            onClick={handleFinish}
            aria-label="Skip walkthrough and open counter"
            className="h-9 px-3.5 rounded-xl bg-[#F5F5F7] hover:bg-black/[0.08] text-xs font-semibold text-[#1D1D1F] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <span>{isFirstTimePostLogin ? 'Skip to Counter' : 'Close Guide'}</span>
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* Smooth Slide Progress Bar */}
        <div className="h-1 bg-black/[0.06] w-full">
          <div
            className="h-full bg-[#0F766E] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      {/* Main Slide Canvas */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-10 flex items-center justify-center">
        <div className="max-w-[1080px] w-full">
          {/* SLIDE 1: Welcome, What You Can Do & Starter Items */}
          {safeIndex === 0 && (
            <section
              data-testid="slide-1"
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
            >
              <div className="lg:col-span-6 bg-white rounded-[28px] p-6 sm:p-8 border border-black/[0.05] shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#0F766E]">
                    Welcome{shopProfile.ownerName ? `, ${shopProfile.ownerName}` : ''}
                  </p>
                  <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D1D1F] text-balance">
                    Welcome to {shopProfile.shopName || 'your ManaKirana Shop'}
                  </h1>
                  <p className="mt-3 text-sm sm:text-base text-[#6E6E73] leading-relaxed">
                    In 6 quick slides, see where everything lives — how to bill by voice at the Counter, how to fill and remove Drum Stock, track Customer Udhaar, and hear replies in{' '}
                    <strong className="text-[#1D1D1F]">{selectedLang.label.replace(' (Match Spoken Language)', '')}</strong>.
                  </p>

                  <div className="mt-6 space-y-3">
                    <p className="text-xs font-bold text-[#6E6E73]">
                      What you can do inside ManaKirana
                    </p>
                    <ul className="space-y-2.5 text-sm text-[#1D1D1F]">
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" aria-hidden="true" />
                        <span>Bill loose weights, packets, and rupee orders by voice or quick tap</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" aria-hidden="true" />
                        <span>Fill 25 kg grain drums, edit rates, and auto-deduct 1.5% tarugu spillage</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" aria-hidden="true" />
                        <span>Save customer Udhaar tabs, send WhatsApp refill orders, and track real daily profit</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-black/[0.06] flex items-center justify-between text-xs text-[#6E6E73]">
                  <span>
                    Output Voice: <strong className="text-[#1D1D1F]">{selectedLang.nativeLabel}</strong> ({voiceGender === 'male' ? 'Male' : 'Female'})
                  </span>
                  <span className="font-mono tabular-nums text-[#0F766E] font-semibold">
                    {items.length} starter items loaded
                  </span>
                </div>
              </div>

              {/* Right Visual Card: What Items Are Already Ready */}
              <div className="lg:col-span-6 bg-[#111113] text-white rounded-[28px] p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#6EE7B7]">
                      <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                      <span>Starter Kirana Items Ready in Your Shop</span>
                    </div>
                    <span className="text-[11px] text-white/60">Editable anytime</span>
                  </div>
                  <p className="mt-2 text-sm text-white/75">
                    These everyday loose and packed items are pre-loaded so you can start billing right away — or edit prices and add your own items in Drum Stock.
                  </p>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {items.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl bg-white/[0.07] border border-white/10 p-3.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-white truncate">{item.name}</p>
                          <span className="font-mono text-xs font-bold text-[#6EE7B7] tabular-nums shrink-0">
                            ₹{item.sellingPrice}/{item.unit}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/60 mt-1 truncate">
                          {item.localLabel} · {item.stockQty} {item.unit} left
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="mt-5 text-xs text-white/60">
                  Tip: Swipe through the next slides to see how Counter, Drum Stock, Refill List, Udhaar, and Profit Dash work.
                </p>
              </div>
            </section>
          )}

          {/* SLIDE 2: This is the Counter */}
          {safeIndex === 1 && (
            <section
              data-testid="slide-2"
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
            >
              {/* Left Visual Mockup of Counter */}
              <div className="lg:col-span-6 bg-[#111113] text-white rounded-[28px] p-6 sm:p-8 flex flex-col justify-between gap-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#0F766E] flex items-center justify-center shrink-0">
                    <Mic className="w-5 h-5 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#6EE7B7]">Top Voice Bar (Always Visible)</p>
                    <p className="text-sm font-medium text-white">
                      “Ara kilo sugar, rendu oil packets, 20 rupees pallilu, checkout”
                    </p>
                  </div>
                </div>

                {/* Miniature Live Bill Preview */}
                <div className="rounded-2xl bg-white text-[#1D1D1F] p-5 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-semibold text-[#6E6E73]">Live Rush-Hour Bill</span>
                    <span className="font-mono text-2xl font-extrabold tabular-nums">₹319</span>
                  </div>
                  <div className="divide-y divide-black/[0.06] text-xs">
                    <div className="py-2 flex justify-between">
                      <span className="font-semibold">Sugar · 500g</span>
                      <span className="font-mono tabular-nums font-bold">₹23</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="font-semibold">Sunflower Oil · 2 packets</span>
                      <span className="font-mono tabular-nums font-bold">₹276</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="font-semibold">Groundnuts · 167g (₹20 order)</span>
                      <span className="font-mono tabular-nums font-bold">₹20</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="h-9 rounded-xl bg-[#F5F5F7] text-[11px] font-bold flex items-center justify-center">
                      Cash Checkout
                    </div>
                    <div className="h-9 rounded-xl bg-[#F5F5F7] text-[11px] font-bold flex items-center justify-center">
                      UPI Checkout
                    </div>
                    <div className="h-9 rounded-xl bg-[#0F766E] text-white text-[11px] font-bold flex items-center justify-center">
                      Add to Tab
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Plain Explanation */}
              <div className="lg:col-span-6 bg-white rounded-[28px] p-6 sm:p-8 border border-black/[0.05] shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center">
                    <ReceiptIndianRupee className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
                    This is the Counter
                  </h2>
                  <p className="mt-2 text-sm sm:text-base text-[#6E6E73] leading-relaxed">
                    Use the Counter tab during morning and evening rush hours so your hands stay free for weighing and packing.
                  </p>

                  <ol className="mt-6 space-y-3.5 text-sm text-[#1D1D1F]">
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#F5F5F7] text-[#0F766E] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        1
                      </span>
                      <span>
                        <strong>Speak or Tap Items:</strong> Tap <strong>Continuous Mic</strong> once and speak in Telugu, Hindi, or English — or tap items inside <strong>Quick Counter Tap</strong>.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#F5F5F7] text-[#0F766E] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        2
                      </span>
                      <span>
                        <strong>Self-Correct Anytime:</strong> Made a mistake? Say <em>“vaddu, make it 3 kg sugar”</em> or press the <strong>+ / −</strong> buttons on any bill row.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#F5F5F7] text-[#0F766E] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        3
                      </span>
                      <span>
                        <strong>Say “Checkout”:</strong> Say <em>“Checkout”</em>, <em>“UPI checkout”</em>, or tap <strong>Cash / UPI / Add to Tab</strong>. The bill finishes, speaks back in {selectedLang.label.replace(' (Match Spoken Language)', '')}, and resets for the next buyer.
                      </span>
                    </li>
                  </ol>
                </div>
              </div>
            </section>
          )}

          {/* SLIDE 3: This is Drum Stock (How to Fill It & How to Remove Stock) */}
          {safeIndex === 2 && (
            <section
              data-testid="slide-3"
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
            >
              {/* Left Visual Mockup of 25 kg Drums (Fill vs Remove) */}
              <div className="lg:col-span-6 bg-[#111113] text-white rounded-[28px] p-6 sm:p-8 flex flex-col justify-between gap-4">
                <p className="text-xs font-semibold text-[#6EE7B7]">
                  Live 25 kg Drum Stock View
                </p>

                {/* Filled Drum Card */}
                <div className="rounded-2xl bg-white text-[#1D1D1F] p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display font-bold text-base">Sugar · Panchadara</p>
                      <p className="text-xs text-[#6E6E73]">Wholesale ₹41 · Selling ₹46/kg</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0F766E]">
                      <PlusCircle className="w-4 h-4" aria-hidden="true" />
                      Filled 25 / 25 kg
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#F5F5F7] overflow-hidden">
                    <div className="h-full w-full bg-[#0F766E] rounded-full" />
                  </div>
                </div>

                {/* Low / Deducted Drum Card */}
                <div className="rounded-2xl bg-white text-[#1D1D1F] p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display font-bold text-base">Toor Dal · Kandipappu</p>
                      <p className="text-xs text-[#DC2626] font-semibold">
                        Low Stock Alert (12%) — Auto-sent to Refill List
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#DC2626]">
                      <MinusCircle className="w-4 h-4" aria-hidden="true" />
                      3 / 25 kg left
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#F5F5F7] overflow-hidden">
                    <div className="h-full w-[12%] bg-[#DC2626] rounded-full" />
                  </div>
                </div>

                <div className="rounded-2xl bg-white/[0.08] border border-white/10 p-3.5 text-xs text-white/85">
                  Voice Example: <strong>“Poured 25 kg sugar in drum, wholesale 41, selling 46”</strong>
                </div>
              </div>

              {/* Right Plain Explanation: Fill & Remove Instructions */}
              <div className="lg:col-span-6 bg-white rounded-[28px] p-6 sm:p-8 border border-black/[0.05] shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center">
                    <Package className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
                    This is Drum Stock
                  </h2>
                  <p className="mt-2 text-sm sm:text-base text-[#6E6E73] leading-relaxed">
                    Open the <strong>Drum Stock</strong> tab to see how much grain or oil is left in every 25 kg drum, fill new sacks, and remove or adjust stock.
                  </p>

                  <div className="mt-5 space-y-4">
                    <div className="rounded-2xl bg-[#F5F5F7] p-4">
                      <p className="text-sm font-bold text-[#0F766E] flex items-center gap-2">
                        <PlusCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>How to Fill a Drum &amp; Add Items</span>
                      </p>
                      <p className="mt-1.5 text-sm text-[#1D1D1F] leading-relaxed">
                        Poured a fresh 25 kg sack? Just say <em>“Poured 25 kg sugar in drum, wholesale 41, selling 46”</em> — or tap <strong>+ Refill Drum</strong> on that item. Tap <strong>+ Add Item</strong> at the top right to add new products priced per kg, gram, or packet.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#F5F5F7] p-4">
                      <p className="text-sm font-bold text-[#1D1D1F] flex items-center gap-2">
                        <MinusCircle className="w-4 h-4 text-[#DC2626] shrink-0" aria-hidden="true" />
                        <span>How Stock is Removed &amp; Edited</span>
                      </p>
                      <p className="mt-1.5 text-sm text-[#1D1D1F] leading-relaxed">
                        Every time you <strong>Checkout</strong> a bill, sold weight plus a <strong>1.5% tarugu</strong> spillage buffer is automatically removed from the drum. To manually reduce stock or change rates, tap <strong>Edit</strong> on any item row.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SLIDE 4: This is the Wholesale Refill List */}
          {safeIndex === 3 && (
            <section
              data-testid="slide-4"
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
            >
              <div className="lg:col-span-6 bg-[#111113] text-white rounded-[28px] p-6 sm:p-8 flex flex-col justify-between gap-4">
                <p className="text-xs font-semibold text-[#6EE7B7]">
                  Wholesale Refill &amp; Missing Demand Preview
                </p>

                <div className="space-y-3">
                  <div className="rounded-2xl bg-white text-[#1D1D1F] p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-[#DC2626]">Low Drum Alert</p>
                      <p className="font-display font-bold text-base">Toor Dal · 3 kg left</p>
                      <p className="text-xs text-[#6E6E73]">Order 22 kg sack to refill drum</p>
                    </div>
                    <span className="font-mono text-sm font-bold text-[#1D1D1F] tabular-nums">
                      22 kg
                    </span>
                  </div>

                  <div className="rounded-2xl bg-white text-[#1D1D1F] p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-[#0F766E]">Missing Customer Demand</p>
                      <p className="font-display font-bold text-base">Brown Rice · Cardamom</p>
                      <p className="text-xs text-[#6E6E73]">Customers asked at the counter today</p>
                    </div>
                    <span className="text-xs font-bold text-[#0F766E]">Logged</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#0F766E] text-white p-4 text-center text-sm font-bold">
                  1-Tap Copy / Share Full Order on WhatsApp to Wholesaler
                </div>
              </div>

              <div className="lg:col-span-6 bg-white rounded-[28px] p-6 sm:p-8 border border-black/[0.05] shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col justify-center">
                <div className="w-12 h-12 rounded-2xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center">
                  <ClipboardList className="w-6 h-6" aria-hidden="true" />
                </div>
                <h2 className="mt-4 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
                  This is the Refill List
                </h2>
                <p className="mt-2 text-sm sm:text-base text-[#6E6E73] leading-relaxed">
                  Never run out of fast-moving items or lose regular buyers to instant delivery apps.
                </p>

                <ul className="mt-6 space-y-3 text-sm text-[#1D1D1F]">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      <strong>Automatic Low-Drum Tracking:</strong> Any drum below 15% appears here automatically with exact refill kilos needed.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      <strong>Log Missing Customer Requests:</strong> Say <em>“Customer asked for Brown Rice, add to supply list”</em> so you remember to buy it at the mandi.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      <strong>Send to Distributor:</strong> Tap <strong>Share on WhatsApp</strong> to send the clean combined purchase list in one click.
                    </span>
                  </li>
                </ul>
              </div>
            </section>
          )}

          {/* SLIDE 5: This is Customer Udhaar (Add to Tab & Repayments) */}
          {safeIndex === 4 && (
            <section
              data-testid="slide-5"
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
            >
              <div className="lg:col-span-6 bg-[#111113] text-white rounded-[28px] p-6 sm:p-8 flex flex-col justify-between gap-4">
                <p className="text-xs font-semibold text-[#6EE7B7]">
                  Add to Tab &amp; Udhaar Ledger Preview
                </p>

                <div className="rounded-2xl bg-white text-[#1D1D1F] p-5 space-y-3">
                  <p className="text-xs font-semibold text-[#6E6E73]">
                    Press “Add to Tab” → Select Customer Name
                  </p>
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-[#0F766E]/[0.07] border border-[#0F766E] flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">Ramesh</p>
                        <p className="text-xs text-[#6E6E73]">Tap to add ₹319 bill to tab</p>
                      </div>
                      <span className="font-mono text-sm font-bold text-[#0F766E] tabular-nums">
                        ₹850
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#F5F5F7] flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">Lakshmi Devi</p>
                        <p className="text-xs text-[#6E6E73]">Regular neighborhood account</p>
                      </div>
                      <span className="font-mono text-sm font-bold tabular-nums">₹420</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/[0.08] border border-white/10 p-3.5 text-xs text-white/85">
                  Repayment by Voice: <strong>“Ramesh paid 200 rupees cash”</strong> → Balance updates to ₹650 automatically.
                </div>
              </div>

              <div className="lg:col-span-6 bg-white rounded-[28px] p-6 sm:p-8 border border-black/[0.05] shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col justify-center">
                <div className="w-12 h-12 rounded-2xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center">
                  <Users className="w-6 h-6" aria-hidden="true" />
                </div>
                <h2 className="mt-4 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
                  This is Customer Udhaar
                </h2>
                <p className="mt-2 text-sm sm:text-base text-[#6E6E73] leading-relaxed">
                  Replace messy paper notebooks with an instant, searchable customer credit tab.
                </p>

                <ul className="mt-6 space-y-3 text-sm text-[#1D1D1F]">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      <strong>Select Any Person:</strong> Tap <strong>Add to Tab</strong> on the Counter to pick a customer by name or create a new customer on the spot.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      <strong>Record Repayments Fast:</strong> Open the <strong>Udhaar</strong> tab to view every balance and tap <strong>Log Payment</strong>, or simply say <em>“Ramesh paid 200 rupees cash”</em>.
                    </span>
                  </li>
                </ul>
              </div>
            </section>
          )}

          {/* SLIDE 6: Profit Dash & Your Human Output Voice Language */}
          {safeIndex === 5 && (
            <section
              data-testid="slide-6"
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
            >
              <div className="lg:col-span-6 bg-[#111113] text-white rounded-[28px] p-6 sm:p-8 flex flex-col justify-between gap-4">
                <p className="text-xs font-semibold text-[#6EE7B7]">
                  Daily Profit &amp; Natural Human Voice Output
                </p>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="rounded-2xl bg-white/[0.08] border border-white/10 p-3.5">
                    <p className="text-[11px] text-white/60">Today Sales</p>
                    <p className="mt-1 font-mono text-lg font-extrabold tabular-nums">₹7,420</p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.08] border border-white/10 p-3.5">
                    <p className="text-[11px] text-white/60">Spends</p>
                    <p className="mt-1 font-mono text-lg font-extrabold tabular-nums">₹1,670</p>
                  </div>
                  <div className="rounded-2xl bg-[#0F766E] p-3.5">
                    <p className="text-[11px] text-white/80">Net Profit</p>
                    <p className="mt-1 font-mono text-lg font-extrabold tabular-nums">₹1,940</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white text-[#1D1D1F] p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0F766E]">
                    <Globe className="w-4 h-4" aria-hidden="true" />
                    <span>Your Active Output Voice</span>
                  </div>
                  <p className="text-sm font-bold text-[#1D1D1F]">
                    {selectedLang.label.replace(' (Match Spoken Language)', '')} ({selectedLang.nativeLabel}) · {voiceGender === 'male' ? 'Male' : 'Female'} Human Voice
                  </p>
                  <p className="text-xs text-[#6E6E73]">
                    Change language (Telugu, Hindi, Tamil, Kannada, Marathi, English) or switch Male / Female voice anytime inside <strong>Profile</strong>.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-6 bg-white rounded-[28px] p-6 sm:p-8 border border-black/[0.05] shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col justify-center">
                <div className="w-12 h-12 rounded-2xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" aria-hidden="true" />
                </div>
                <h2 className="mt-4 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
                  Profit Dash &amp; Voice Profile
                </h2>
                <p className="mt-2 text-sm sm:text-base text-[#6E6E73] leading-relaxed">
                  Know your true daily earnings after milk van, mandi auto, and loose-grain spillage — and customize how ManaKirana speaks back to you.
                </p>

                <ul className="mt-6 space-y-3 text-sm text-[#1D1D1F]">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      <strong>Log Spends &amp; Ask Profit:</strong> Say <em>“Paid 1,450 to milk van, 220 Mandi auto. Eeroju labham entha?”</em> to hear your exact profit and top-earning item.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      <strong>Profile Voice Settings:</strong> Tap <strong>Profile</strong> at the top right anytime to switch between Telugu, Hindi, Tamil, Kannada, Marathi, or English and Male / Female voices.
                    </span>
                  </li>
                </ul>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Bottom Slide Navigation Bar (Previous / Progress Dots / Next) */}
      <footer className="bg-white border-t border-black/[0.06] shrink-0">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <button
            type="button"
            data-testid="slides-prev-btn"
            disabled={isFirst}
            onClick={() => onStepChange(safeIndex - 1)}
            className="h-11 px-4 rounded-xl bg-[#F5F5F7] hover:bg-black/[0.08] disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold text-[#1D1D1F] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Previous</span>
          </button>

          {/* Subtle Slide Progress Dots (NOT tabs) */}
          <div className="flex items-center gap-2" aria-label="Slide progress">
            {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Go to slide ${idx + 1}`}
                aria-current={idx === safeIndex ? 'step' : undefined}
                onClick={() => onStepChange(idx)}
                className={`h-2.5 rounded-full transition-all ${
                  idx === safeIndex
                    ? 'w-7 bg-[#0F766E]'
                    : 'w-2.5 bg-black/15 hover:bg-black/30'
                }`}
              />
            ))}
          </div>

          {isLast ? (
            <button
              type="button"
              data-testid="slides-finish-btn"
              onClick={handleFinish}
              className="h-11 px-5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-sm font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <span>Start Billing</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              data-testid="slides-next-btn"
              onClick={() => onStepChange(safeIndex + 1)}
              className="h-11 px-5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-sm font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <span>Next Slide</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
