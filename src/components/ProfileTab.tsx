import React, { useEffect, useState } from 'react';
import {
  AudioLines,
  Check,
  Globe,
  LogOut,
  Play,
  Store,
  User,
  Volume2,
} from 'lucide-react';
import { OUTPUT_VOICE_LANGUAGES } from '../engine/seedData';
import {
  OutputVoiceLanguage,
  ShopProfile,
  SpeakingSpeed,
  VoiceGender,
  VoiceOutputSettings,
} from '../engine/types';

type ProfileSubTab = 'output-language' | 'voice-type' | 'shop-details';

interface ProfileTabProps {
  shopProfile: ShopProfile;
  voiceOutput: VoiceOutputSettings;
  geminiTtsConfigured: boolean;
  sarvamConfigured: boolean;
  isSpeakingBack: boolean;
  onUpdateVoiceOutput: (updates: Partial<VoiceOutputSettings>) => void;
  onUpdateShopProfile: (updates: ShopProfile) => void;
  onPreviewVoice: (override?: Partial<VoiceOutputSettings>) => void;
  onLogout: () => void;
}

const SPEED_OPTIONS: Array<{ id: SpeakingSpeed; label: string; hint: string }> = [
  { id: 'relaxed', label: 'Relaxed', hint: 'Calm & unhurried' },
  { id: 'normal', label: 'Natural', hint: 'Everyday conversational pace' },
  { id: 'brisk', label: 'Brisk', hint: 'Fast rush-hour billing' },
];

export function ProfileTab({
  shopProfile,
  voiceOutput,
  geminiTtsConfigured,
  sarvamConfigured,
  isSpeakingBack,
  onUpdateVoiceOutput,
  onUpdateShopProfile,
  onPreviewVoice,
  onLogout,
}: ProfileTabProps) {
  const [subTab, setSubTab] = useState<ProfileSubTab>('output-language');
  const [formState, setFormState] = useState<ShopProfile>(shopProfile);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setFormState(shopProfile);
  }, [shopProfile]);

  const selectedLangMeta =
    OUTPUT_VOICE_LANGUAGES.find((l) => l.code === voiceOutput.outputLanguage) ||
    OUTPUT_VOICE_LANGUAGES[0];

  const handleSaveShop = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateShopProfile({
      shopName: formState.shopName.trim() || shopProfile.shopName,
      ownerName: formState.ownerName.trim() || shopProfile.ownerName,
      phone: formState.phone.trim() || shopProfile.phone,
      area: formState.area.trim() || shopProfile.area,
    });
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2200);
  };

  const voiceEngineSummary = geminiTtsConfigured
    ? 'Human Neural Voice Active (Natural Smooth Speech)'
    : sarvamConfigured
    ? 'Sarvam Indian Human Voice Active'
    : 'Offline Device Voice Active · API key not set (optional)';

  return (
    <div className="space-y-5">
      {/* Top Profile Summary + Separate Profile Sub-Tabs */}
      <section className="bg-white rounded-[24px] p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] border border-black/[0.04]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center shrink-0 font-display text-xl font-extrabold">
              {(shopProfile.ownerName || 'M').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F] truncate">
                {shopProfile.shopName}
              </h1>
              <p className="text-sm text-[#6E6E73] truncate">
                {shopProfile.ownerName} · {shopProfile.area}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] text-xs font-medium text-[#1D1D1F]">
              <span className="text-[#6E6E73]">Output Voice: </span>
              <span className="font-bold text-[#0F766E]">
                {voiceOutput.voiceGender === 'male' ? 'Male' : 'Female'} · {selectedLangMeta.label.replace(' (Match Spoken Language)', '')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onPreviewVoice()}
              data-testid="profile-test-voice-btn"
              className="h-9 px-4 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
              <span>{isSpeakingBack ? 'Speaking…' : 'Hear Sample Voice'}</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              data-testid="profile-logout-btn"
              className="h-9 px-3.5 rounded-xl bg-[#F5F5F7] hover:bg-black/[0.08] text-[#1D1D1F] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5 text-[#6E6E73]" aria-hidden="true" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Dedicated Separate Tabs inside Profile */}
        <div
          role="tablist"
          aria-label="Profile settings sections"
          className="mt-5 pt-4 border-t border-black/[0.06] flex flex-wrap gap-2"
        >
          <button
            type="button"
            role="tab"
            data-testid="profile-tab-language"
            aria-selected={subTab === 'output-language'}
            onClick={() => setSubTab('output-language')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
              subTab === 'output-language'
                ? 'bg-[#1D1D1F] text-white'
                : 'bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <Globe className="w-4 h-4" aria-hidden="true" />
            <span>Output Voice Language</span>
          </button>

          <button
            type="button"
            role="tab"
            data-testid="profile-tab-voice"
            aria-selected={subTab === 'voice-type'}
            onClick={() => setSubTab('voice-type')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
              subTab === 'voice-type'
                ? 'bg-[#1D1D1F] text-white'
                : 'bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <AudioLines className="w-4 h-4" aria-hidden="true" />
            <span>Voice Type (Male / Female)</span>
          </button>

          <button
            type="button"
            role="tab"
            data-testid="profile-tab-shop"
            aria-selected={subTab === 'shop-details'}
            onClick={() => setSubTab('shop-details')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
              subTab === 'shop-details'
                ? 'bg-[#1D1D1F] text-white'
                : 'bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <Store className="w-4 h-4" aria-hidden="true" />
            <span>Shop Details</span>
          </button>
        </div>
      </section>

      {/* SUB-TAB 1: Dedicated Output Voice Language Selection */}
      {subTab === 'output-language' && (
        <section
          aria-label="Output Voice Language selection"
          className="bg-white rounded-[24px] p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] border border-black/[0.04]"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="font-display text-lg font-bold text-[#1D1D1F]">
                Output Voice Language
              </h2>
              <p className="text-sm text-[#6E6E73] mt-0.5">
                Choose the language ManaKirana speaks back to you after every bill, drum update, or Udhaar entry. Your voice intake stays automatic.
              </p>
            </div>
            <span className="text-xs font-medium text-[#0F766E] whitespace-nowrap">
              {voiceEngineSummary}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {OUTPUT_VOICE_LANGUAGES.map((lang) => {
              const isSelected = voiceOutput.outputLanguage === lang.code;
              return (
                <div
                  key={lang.code}
                  data-testid={`output-lang-card-${lang.code}`}
                  className={`rounded-2xl p-4 border transition-all flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'border-[#0F766E] bg-[#0F766E]/[0.04] ring-1 ring-[#0F766E]'
                      : 'border-black/[0.07] bg-[#F5F5F7]/60 hover:bg-[#F5F5F7]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateVoiceOutput({ outputLanguage: lang.code as OutputVoiceLanguage })
                    }
                    className="text-left w-full focus-visible:outline-none"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-display text-base font-bold text-[#1D1D1F]">
                          {lang.label}
                        </p>
                        <p className="text-sm font-semibold text-[#0F766E] mt-0.5">
                          {lang.nativeLabel}
                        </p>
                      </div>
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-[#0F766E] text-white'
                            : 'border border-black/15 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                      </span>
                    </div>
                    <p className="text-xs text-[#6E6E73] mt-2 leading-relaxed">
                      {lang.description}
                    </p>
                  </button>

                  <div className="pt-2 border-t border-black/[0.05] flex items-center justify-between">
                    <span className="text-[11px] font-medium text-[#6E6E73]">
                      {voiceOutput.voiceGender === 'male' ? 'Male human voice' : 'Female human voice'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateVoiceOutput({ outputLanguage: lang.code as OutputVoiceLanguage });
                        onPreviewVoice({ outputLanguage: lang.code as OutputVoiceLanguage });
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] hover:text-[#115E59]"
                    >
                      <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SUB-TAB 2: Natural Human Male / Female Voice Persona & Pace */}
      {subTab === 'voice-type' && (
        <section
          aria-label="Voice type and smoothness settings"
          className="bg-white rounded-[24px] p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] border border-black/[0.04] space-y-6"
        >
          <div>
            <h2 className="font-display text-lg font-bold text-[#1D1D1F]">
              Choose Natural Human Voice
            </h2>
            <p className="text-sm text-[#6E6E73] mt-0.5">
              Select a smooth, warm human Male or Female voice for counter readbacks — never robotic.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(
              [
                {
                  id: 'male' as VoiceGender,
                  title: 'Male Voice',
                  subtitle: 'Warm, calm, reassuring human male voice',
                  detail:
                    'Steady natural cadence with clear Indian number pronunciation for busy Kirana counters.',
                  sampleLabel: 'Play Male Sample',
                },
                {
                  id: 'female' as VoiceGender,
                  title: 'Female Voice',
                  subtitle: 'Smooth, friendly, natural human female voice',
                  detail:
                    'Warm conversational tone with natural breath and crisp clarity for billing & Udhaar.',
                  sampleLabel: 'Play Female Sample',
                },
              ] as const
            ).map((persona) => {
              const isSelected = voiceOutput.voiceGender === persona.id;
              return (
                <div
                  key={persona.id}
                  data-testid={`voice-gender-${persona.id}`}
                  className={`rounded-2xl p-5 border transition-all flex flex-col justify-between gap-4 ${
                    isSelected
                      ? 'border-[#0F766E] bg-[#0F766E]/[0.04] ring-1 ring-[#0F766E]'
                      : 'border-black/[0.08] bg-[#F5F5F7]/60 hover:bg-[#F5F5F7]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onUpdateVoiceOutput({ voiceGender: persona.id })}
                    className="text-left w-full focus-visible:outline-none"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-[#0F766E] text-white'
                              : 'bg-white text-[#1D1D1F] border border-black/[0.08]'
                          }`}
                        >
                          <User className="w-5 h-5" aria-hidden="true" />
                        </div>
                        <div>
                          <h3 className="font-display text-base font-bold text-[#1D1D1F]">
                            {persona.title}
                          </h3>
                          <p className="text-xs font-semibold text-[#0F766E]">
                            {persona.subtitle}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-[#0F766E] text-white'
                            : 'border border-black/15 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                      </span>
                    </div>
                    <p className="text-sm text-[#6E6E73] mt-3 leading-relaxed">
                      {persona.detail}
                    </p>
                  </button>

                  <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#6E6E73]">
                      Language: {selectedLangMeta.nativeLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateVoiceOutput({ voiceGender: persona.id });
                        onPreviewVoice({ voiceGender: persona.id });
                      }}
                      className="h-9 px-3.5 rounded-xl bg-white border border-black/[0.08] hover:border-[#0F766E] text-xs font-semibold text-[#1D1D1F] inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 text-[#0F766E] fill-current" aria-hidden="true" />
                      <span>{persona.sampleLabel}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Natural Speaking Pace */}
          <div className="pt-4 border-t border-black/[0.06]">
            <h3 className="text-sm font-bold text-[#1D1D1F] mb-3">Speaking Pace</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SPEED_OPTIONS.map((opt) => {
                const active = voiceOutput.speakingSpeed === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onUpdateVoiceOutput({ speakingSpeed: opt.id })}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      active
                        ? 'border-[#0F766E] bg-[#0F766E]/[0.05] text-[#1D1D1F]'
                        : 'border-black/[0.07] bg-[#F5F5F7]/60 text-[#6E6E73] hover:text-[#1D1D1F]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#1D1D1F]">{opt.label}</span>
                      {active && <Check className="w-4 h-4 text-[#0F766E]" aria-hidden="true" />}
                    </div>
                    <p className="text-xs text-[#6E6E73] mt-0.5">{opt.hint}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* SUB-TAB 3: Shop Details */}
      {subTab === 'shop-details' && (
        <section
          aria-label="Shop Profile Details"
          className="bg-white rounded-[24px] p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] border border-black/[0.04]"
        >
          <h2 className="font-display text-lg font-bold text-[#1D1D1F]">Shop Details</h2>
          <p className="text-sm text-[#6E6E73] mt-0.5 mb-5">
            Stored locally on this device for WhatsApp refill lists and counter receipts.
          </p>

          <form onSubmit={handleSaveShop} className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <div>
              <label htmlFor="shop-name" className="block text-xs font-semibold text-[#6E6E73] mb-1.5">
                Kirana Shop Name
              </label>
              <input
                id="shop-name"
                type="text"
                value={formState.shopName}
                onChange={(e) => setFormState((s) => ({ ...s, shopName: e.target.value }))}
                className="w-full h-11 px-3.5 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-sm font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
            </div>

            <div>
              <label htmlFor="owner-name" className="block text-xs font-semibold text-[#6E6E73] mb-1.5">
                Owner Name
              </label>
              <input
                id="owner-name"
                type="text"
                value={formState.ownerName}
                onChange={(e) => setFormState((s) => ({ ...s, ownerName: e.target.value }))}
                className="w-full h-11 px-3.5 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-sm font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
            </div>

            <div>
              <label htmlFor="shop-phone" className="block text-xs font-semibold text-[#6E6E73] mb-1.5">
                Phone / WhatsApp Number
              </label>
              <input
                id="shop-phone"
                type="tel"
                value={formState.phone}
                onChange={(e) => setFormState((s) => ({ ...s, phone: e.target.value }))}
                className="w-full h-11 px-3.5 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-sm font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
            </div>

            <div>
              <label htmlFor="shop-area" className="block text-xs font-semibold text-[#6E6E73] mb-1.5">
                Locality / Area
              </label>
              <input
                id="shop-area"
                type="text"
                value={formState.area}
                onChange={(e) => setFormState((s) => ({ ...s, area: e.target.value }))}
                className="w-full h-11 px-3.5 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-sm font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-3 pt-1">
              <button
                type="submit"
                className="h-11 px-5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-sm font-semibold transition-colors"
              >
                Save Shop Profile
              </button>
              {savedNotice && (
                <span className="text-sm font-semibold text-[#0F766E]">
                  Saved to phone storage
                </span>
              )}
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
