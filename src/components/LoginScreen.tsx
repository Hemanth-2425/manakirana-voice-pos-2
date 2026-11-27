import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  Mic,
  Package,
  ShieldCheck,
  User,
  Volume2,
} from 'lucide-react';
import { ManaKiranaLogo } from './ManaKiranaLogo';
import { OUTPUT_VOICE_LANGUAGES } from '../engine/seedData';
import {
  OutputVoiceLanguage,
  ShopProfile,
  VoiceGender,
} from '../engine/types';

interface LoginScreenProps {
  onLogin: (payload: {
    shopProfile: ShopProfile;
    outputLanguage: OutputVoiceLanguage;
    voiceGender: VoiceGender;
  }) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  // Strictly blank initial fields — zero pre-entered data for any new shopkeeper
  const [ownerName, setOwnerName] = useState('');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [outputLanguage, setOutputLanguage] = useState<OutputVoiceLanguage>('te-IN');
  const [voiceGender, setVoiceGender] = useState<VoiceGender>('female');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOwner = ownerName.trim();
    const cleanShop = shopName.trim();
    const cleanPhone = phone.trim();
    const cleanArea = area.trim();

    if (!cleanOwner || !cleanShop || !cleanPhone) {
      setErrorMessage('Please enter your name, shop name, and mobile number to continue.');
      return;
    }

    setErrorMessage('');
    onLogin({
      shopProfile: {
        ownerName: cleanOwner,
        shopName: cleanShop,
        phone: cleanPhone,
        area: cleanArea || 'Local Kirana Counter',
      },
      outputLanguage,
      voiceGender,
    });
  };

  return (
    <div
      data-testid="login-screen"
      className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col justify-center px-4 sm:px-6 py-8 sm:py-12"
    >
      <div className="max-w-[1080px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Brand & Value Column (second on mobile so blank login inputs appear immediately) */}
        <section className="order-2 lg:order-1 lg:col-span-5 bg-[#111113] text-white rounded-[28px] p-7 sm:p-9 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-3">
              <ManaKiranaLogo size={42} className="shrink-0" />
              <p className="font-display text-2xl font-extrabold tracking-tight text-white">
                ManaKirana
              </p>
            </div>
            <h1 className="mt-6 font-display text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.12] text-balance">
              Hands-free voice billing built for busy Indian Kirana counters.
            </h1>
            <p className="mt-4 text-sm sm:text-base text-white/70 leading-relaxed">
              Speak loose weights, packets, and rupee orders in Telugu, Hindi, or English while packing goods. Track 25 kg drums, Udhaar tabs, and daily profit — offline on your phone.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0F766E]/25 text-[#6EE7B7] flex items-center justify-center shrink-0">
                <Mic className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Natural Telugu, Hindi &amp; Indian Voices
                </p>
                <p className="text-xs text-white/60 mt-0.5">
                  Replies aloud in your chosen language with a smooth human Male or Female voice.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0F766E]/25 text-[#6EE7B7] flex items-center justify-center shrink-0">
                <Package className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Live 25 kg Drums &amp; 1.5% Tarugu Math
                </p>
                <p className="text-xs text-white/60 mt-0.5">
                  Auto-deducts sold weight and spillage, then flags low drums on your refill list.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0F766E]/25 text-[#6EE7B7] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  100% Phone-Only Privacy Mode
                </p>
                <p className="text-xs text-white/60 mt-0.5">
                  Your bills, customer Udhaar, and margins stay privately on your own device.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Right Blank Login Form Column (first on mobile) */}
        <section className="order-1 lg:order-2 lg:col-span-7 bg-white rounded-[28px] p-6 sm:p-9 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-black/[0.05] flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-6">
            <ManaKiranaLogo size={44} className="shrink-0" />
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-[#1D1D1F]">
                Shopkeeper Login
              </h2>
              <p className="text-sm text-[#6E6E73]">
                Enter your shop details to open your counter and see a quick slide walkthrough.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="login-owner-name"
                  className="block text-xs font-semibold text-[#1D1D1F] mb-1.5"
                >
                  Your Name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  id="login-owner-name"
                  data-testid="login-owner-input"
                  type="text"
                  autoComplete="off"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Enter owner name"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-sm font-medium text-[#1D1D1F] placeholder:text-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="login-shop-name"
                  className="block text-xs font-semibold text-[#1D1D1F] mb-1.5"
                >
                  Kirana Shop Name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  id="login-shop-name"
                  data-testid="login-shop-input"
                  type="text"
                  autoComplete="off"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Enter your shop name"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-sm font-medium text-[#1D1D1F] placeholder:text-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="login-phone"
                  className="block text-xs font-semibold text-[#1D1D1F] mb-1.5"
                >
                  Mobile Number <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  id="login-phone"
                  data-testid="login-phone-input"
                  type="tel"
                  autoComplete="off"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-sm font-medium text-[#1D1D1F] placeholder:text-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="login-area"
                  className="block text-xs font-semibold text-[#1D1D1F] mb-1.5"
                >
                  Area / Locality (Optional)
                </label>
                <input
                  id="login-area"
                  data-testid="login-area-input"
                  type="text"
                  autoComplete="off"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Colony, town, or market"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-sm font-medium text-[#1D1D1F] placeholder:text-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Output Voice Language Picker */}
            <div className="pt-2 border-t border-black/[0.06]">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <label className="text-xs font-semibold text-[#1D1D1F] inline-flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-[#0F766E]" aria-hidden="true" />
                  <span>Choose Your Output Voice Language</span>
                </label>
                <span className="text-[11px] text-[#6E6E73]">Change anytime in Profile</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {OUTPUT_VOICE_LANGUAGES.filter((l) => l.code !== 'auto').map((lang) => {
                  const selected = outputLanguage === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      data-testid={`login-lang-${lang.code}`}
                      onClick={() => setOutputLanguage(lang.code)}
                      className={`px-3 py-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                        selected
                          ? 'border-[#0F766E] bg-[#0F766E]/[0.06] text-[#1D1D1F] ring-1 ring-[#0F766E]'
                          : 'border-black/[0.07] bg-[#F5F5F7]/70 text-[#6E6E73] hover:text-[#1D1D1F]'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1D1D1F] truncate">
                          {lang.label}
                        </p>
                        <p className="text-[11px] font-semibold text-[#0F766E] truncate">
                          {lang.nativeLabel}
                        </p>
                      </div>
                      {selected && (
                        <Check className="w-4 h-4 text-[#0F766E] shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                data-testid="login-lang-auto"
                onClick={() => setOutputLanguage('auto')}
                className={`mt-2 w-full px-3.5 py-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                  outputLanguage === 'auto'
                    ? 'border-[#0F766E] bg-[#0F766E]/[0.06] text-[#1D1D1F] ring-1 ring-[#0F766E]'
                    : 'border-black/[0.07] bg-[#F5F5F7]/50 text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                <span className="text-xs font-semibold">
                  Auto — Match whichever language I speak (EN / తెలుగు / हिन्दी)
                </span>
                {outputLanguage === 'auto' && (
                  <Check className="w-4 h-4 text-[#0F766E] shrink-0" aria-hidden="true" />
                )}
              </button>
            </div>

            {/* Male / Female Human Voice Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="text-xs font-semibold text-[#1D1D1F] inline-flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#0F766E]" aria-hidden="true" />
                <span>Preferred Human Voice</span>
              </span>
              <div className="inline-flex items-center p-1 bg-[#F5F5F7] rounded-xl border border-black/[0.06]">
                <button
                  type="button"
                  data-testid="login-voice-female"
                  onClick={() => setVoiceGender('female')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    voiceGender === 'female'
                      ? 'bg-white text-[#1D1D1F] shadow-sm'
                      : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                >
                  Female Voice
                </button>
                <button
                  type="button"
                  data-testid="login-voice-male"
                  onClick={() => setVoiceGender('male')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    voiceGender === 'male'
                      ? 'bg-white text-[#1D1D1F] shadow-sm'
                      : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                >
                  Male Voice
                </button>
              </div>
            </div>

            {errorMessage && (
              <p
                role="alert"
                className="text-xs font-semibold text-[#DC2626] bg-[#DC2626]/[0.06] border border-[#DC2626]/20 rounded-xl px-3.5 py-2.5"
              >
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              data-testid="login-submit-btn"
              className="w-full h-12 rounded-2xl bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Login &amp; Start Quick Slide Guide</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
