import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CornerDownLeft,
  Mic,
  MicOff,
  Undo2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  PendingDisambiguation,
  PrivacyMode,
  VoiceClaritySummary,
  VoiceLangCode,
  VoiceOutputSettings,
} from '../engine/types';

interface DynamicIslandProps {
  isListening: boolean;
  isSpeakingBack: boolean;
  isTranscribing: boolean;
  micBars: number[];
  micRms: number;
  micSourceDetected: boolean;
  micError: string | null;
  activeMicMode: 'browser' | 'direct-ai';
  hasCloudStt: boolean;
  interimTranscript: string;
  lastTranscript: string;
  lastSpokenResponse: string;
  lastVoiceClarity: VoiceClaritySummary | null;
  voiceStatus: 'idle' | 'listening' | 'speaking' | 'disambiguate' | 'noise';
  pendingDisambiguation: PendingDisambiguation | null;
  voiceLang: VoiceLangCode;
  voiceOutput: VoiceOutputSettings;
  geminiTtsConfigured: boolean;
  muted: boolean;
  canUndoVoice: boolean;
  sarvamConfigured: boolean;
  privacyMode: PrivacyMode;
  onToggleMic: () => void;
  onSwitchMicMode: (mode: 'browser' | 'direct-ai') => void;
  onSubmitVoiceText: (text: string, confidence?: number) => void;
  onResolveDisambiguation: (choice: 'primary' | 'secondary' | 'cancel') => void;
  onUndoLastVoice: () => void;
  onToggleMute: () => void;
  onOpenVoiceSettings: () => void;
}

const DEFAULT_IDLE_BARS = [0.3, 0.55, 0.72, 0.45, 0.68, 0.38, 0.58, 0.34];

function formatDetectedLangLabel(lang: VoiceLangCode): string {
  if (lang === 'te-IN') return 'In: Telugu / EN';
  if (lang === 'hi-IN') return 'In: Hindi / EN';
  return 'In: Auto EN / TE / HI';
}

function formatOutputVoiceLabel(settings: VoiceOutputSettings): string {
  const genderLabel = settings.voiceGender === 'male' ? 'Male' : 'Female';
  const langMap: Record<VoiceOutputSettings['outputLanguage'], string> = {
    auto: 'Auto',
    'en-IN': 'English',
    'te-IN': 'Telugu',
    'hi-IN': 'Hindi',
    'ta-IN': 'Tamil',
    'kn-IN': 'Kannada',
    'mr-IN': 'Marathi',
  };
  return `Out: ${genderLabel} · ${langMap[settings.outputLanguage]}`;
}

export function DynamicIsland({
  isListening,
  isSpeakingBack,
  isTranscribing,
  micBars,
  micRms,
  micSourceDetected,
  micError,
  activeMicMode,
  hasCloudStt,
  interimTranscript,
  lastTranscript,
  lastSpokenResponse,
  lastVoiceClarity,
  voiceStatus,
  pendingDisambiguation,
  voiceLang,
  voiceOutput,
  geminiTtsConfigured,
  muted,
  canUndoVoice,
  sarvamConfigured,
  privacyMode,
  onToggleMic,
  onSwitchMicMode,
  onSubmitVoiceText,
  onResolveDisambiguation,
  onUndoLastVoice,
  onToggleMute,
  onOpenVoiceSettings,
}: DynamicIslandProps) {
  const [commandInput, setCommandInput] = useState('');

  const isAmber = voiceStatus === 'disambiguate' || Boolean(pendingDisambiguation);
  const bars = micBars.length === 8 ? micBars : DEFAULT_IDLE_BARS;
  const hasLiveSignal = isListening && micRms > 0.018;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commandInput.trim();
    if (!trimmed) return;
    onSubmitVoiceText(trimmed, 0.95);
    setCommandInput('');
  };

  const activeEngineLabel = geminiTtsConfigured
    ? 'Human Neural Voice'
    : privacyMode === 'cloud-sync' && sarvamConfigured
    ? 'Sarvam Human Voice'
    : 'Offline Voice';

  const signalQualityLabel = isSpeakingBack
    ? 'Echo Guard · Mic Paused During Playback'
    : isTranscribing
    ? 'Transcribing Voice Clip...'
    : isListening
    ? hasLiveSignal
      ? activeMicMode === 'direct-ai'
        ? 'Direct AI Mic · Hearing Your Voice'
        : 'Voice Clear · Hearing You'
      : micSourceDetected
      ? activeMicMode === 'direct-ai'
        ? 'Direct AI Mic Live · Speak Now'
        : 'Mic Connected · Speak Items Now'
      : 'Connecting Microphone...'
    : micError
    ? 'Microphone Attention Needed'
    : voiceStatus === 'noise'
    ? 'Background Noise Filtered'
    : 'Continuous Voice Ready';

  return (
    <section
      aria-label="Voice Command Dynamic Island"
      className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-5 pb-2"
    >
      <div
        className={`rounded-[28px] transition-colors duration-200 px-5 py-4 sm:px-6 sm:py-5 ${
          isAmber
            ? 'bg-[#451A03] text-[#FEF3C7] ring-2 ring-[#F59E0B]'
            : 'bg-[#111113] text-white'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-start gap-4 justify-between">
          {/* Left: Mic Trigger + Real-Time Acoustic Bars + Clear Heard/Understood Readout */}
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <button
              type="button"
              onClick={onToggleMic}
              aria-pressed={isListening}
              aria-label={
                isListening ? 'Stop continuous voice intake' : 'Start continuous voice intake'
              }
              className={`shrink-0 w-13 h-13 rounded-full flex items-center justify-center transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111113] ${
                isAmber
                  ? 'bg-[#F59E0B] text-[#1D1D1F] hover:bg-[#FBBF24] focus-visible:ring-[#F59E0B]'
                  : isListening
                  ? 'bg-[#DC2626] text-white hover:bg-[#B91C1C] focus-visible:ring-[#DC2626]'
                  : 'bg-[#0F766E] text-white hover:bg-[#115E59] focus-visible:ring-[#0F766E]'
              }`}
            >
              {isListening ? (
                <MicOff className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Mic className="w-5 h-5" aria-hidden="true" />
              )}
            </button>

            {/* Real-time 8-band acoustic level meter */}
            <div
              aria-hidden="true"
              className="hidden sm:flex items-center gap-[3px] h-11 shrink-0 pt-1"
            >
              {bars.map((level, i) => (
                <span
                  key={i}
                  style={{
                    height: `${Math.round(Math.max(0.18, Math.min(1, level)) * 32)}px`,
                    transition: 'height 90ms ease-out',
                  }}
                  className={`w-[3px] rounded-full ${
                    isAmber
                      ? 'bg-[#FBBF24]'
                      : isSpeakingBack
                      ? 'bg-[#60A5FA]'
                      : isListening
                      ? hasLiveSignal
                        ? 'bg-[#34D399]'
                        : 'bg-[#34D399]/55'
                      : 'bg-white/30'
                  }`}
                />
              ))}
            </div>

            {/* Clear 2-step Heard -> Understood Display */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-medium">
                {isAmber ? (
                  <span className="inline-flex items-center gap-1.5 text-[#FDE68A] font-semibold whitespace-nowrap">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Low Clarity · Stock Deduction Paused</span>
                  </span>
                ) : (
                  <span
                    data-testid="continuous-voice-status"
                    className={`font-semibold whitespace-nowrap ${
                      isSpeakingBack
                        ? 'text-[#93C5FD]'
                        : isListening
                        ? 'text-[#6EE7B7]'
                        : voiceStatus === 'noise'
                        ? 'text-[#D4D4D8]'
                        : 'text-[#A1A1AA]'
                    }`}
                  >
                    {signalQualityLabel}
                  </span>
                )}
                <span aria-hidden="true" className="hidden sm:inline opacity-50">·</span>
                <span
                  data-testid="auto-detected-lang"
                  className="text-white/80 whitespace-nowrap"
                >
                  {formatDetectedLangLabel(voiceLang)}
                </span>
                <span aria-hidden="true" className="hidden sm:inline opacity-50">·</span>
                <button
                  type="button"
                  data-testid="dynamic-island-voice-out"
                  onClick={onOpenVoiceSettings}
                  className="text-[#6EE7B7] hover:text-white underline-offset-2 hover:underline whitespace-nowrap transition-colors"
                >
                  {formatOutputVoiceLabel(voiceOutput)}
                </button>
                <span aria-hidden="true" className="hidden md:inline opacity-50">·</span>
                <span className="truncate hidden md:inline text-white/60">
                  {activeEngineLabel}
                </span>
              </div>

              {/* Live Hearing Stream OR Final Heard Transcript */}
              {isListening && interimTranscript ? (
                <p
                  data-testid="dynamic-island-transcript"
                  className="mt-1.5 text-base sm:text-lg font-display font-semibold leading-snug text-[#6EE7B7]"
                >
                  Hearing live: “{interimTranscript}”
                </p>
              ) : (
                <p
                  data-testid="dynamic-island-transcript"
                  className="mt-1.5 text-base sm:text-lg font-display font-semibold leading-snug text-white"
                >
                  {lastTranscript
                    ? `Heard: “${lastTranscript}”`
                    : 'Tap Mic once for continuous hands-free billing in Telugu, Hindi, or English'}
                </p>
              )}

              {/* Structured Understood Breakdown Row (Clarity Confirmation) */}
              {lastVoiceClarity && lastVoiceClarity.understoodTokens.length > 0 && (
                <div
                  data-testid="voice-clarity-breakdown"
                  className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"
                >
                  <span className="inline-flex items-center gap-1 font-semibold text-[#6EE7B7]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Understood:</span>
                  </span>
                  <span className="font-mono text-white/95">
                    {lastVoiceClarity.understoodTokens
                      .map((token) => token.replace(' · ', ' '))
                      .join('  •  ')}
                  </span>
                  <span aria-hidden="true" className="text-white/35">|</span>
                  <span className="font-mono text-white/75 tabular-nums">
                    {Math.round(lastVoiceClarity.confidence * 100)}% clarity
                  </span>
                  {lastVoiceClarity.wasPhoneticRepaired && (
                    <span className="text-[#93C5FD] font-medium">
                      · Accent normalized (“{lastVoiceClarity.normalizedTranscript}”)
                    </span>
                  )}
                </div>
              )}

              {micError && (
                <p
                  data-testid="dynamic-island-mic-error"
                  className="mt-1.5 text-xs sm:text-sm font-medium text-[#FDE68A] leading-snug"
                >
                  {micError}
                </p>
              )}

              {!micError &&
                privacyMode === 'cloud-sync' &&
                !geminiTtsConfigured &&
                !sarvamConfigured && (
                  <p
                    data-testid="cloud-api-key-notice"
                    className="mt-1.5 text-xs font-medium text-[#FDE68A] leading-snug"
                  >
                    API key not set (GEMINI_API_KEY / SARVAM_API_KEY) — cloud voice unavailable, running in local offline mode.
                  </p>
                )}

              <p
                data-testid="dynamic-island-response"
                className={`mt-1.5 text-sm leading-snug ${
                  isAmber ? 'text-[#FDE68A] font-medium' : 'text-[#D4D4D8]'
                }`}
              >
                {lastSpokenResponse}
              </p>
            </div>
          </div>

          {/* Right: Voice Simulator Input + Continuous Mic / Undo / Mute / Reset */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 shrink-0 lg:w-[400px]">
            <form onSubmit={handleFormSubmit} className="flex items-center gap-2 w-full">
              <label htmlFor="voice-sim-input" className="sr-only">
                Type a Telugu, Hindi, or English voice command
              </label>
              <input
                id="voice-sim-input"
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="Speak or type items, then 'Checkout'..."
                className="flex-1 min-w-0 h-10 px-3.5 rounded-xl bg-white/10 text-sm text-white placeholder:text-white/50 border border-white/15 focus:outline-none focus:ring-2 focus:ring-[#34D399]"
              />
              <button
                type="submit"
                aria-label="Run voice command"
                className="h-10 px-3.5 rounded-xl bg-white text-[#1D1D1F] text-xs font-bold inline-flex items-center gap-1.5 hover:bg-white/90 transition-colors whitespace-nowrap shrink-0"
              >
                <span>Speak</span>
                <CornerDownLeft className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-start lg:justify-end gap-1.5 w-full">
              <button
                type="button"
                onClick={onToggleMic}
                className={`h-8 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  isListening
                    ? 'bg-[#DC2626]/25 text-[#FCA5A5] hover:bg-[#DC2626]/35'
                    : 'bg-white/10 text-white/85 hover:bg-white/15'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Stop Mic</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-[#34D399]" aria-hidden="true" />
                    <span>Continuous Mic</span>
                  </>
                )}
              </button>

              <button
                type="button"
                data-testid="mic-mode-toggle-btn"
                onClick={() =>
                  onSwitchMicMode(activeMicMode === 'browser' ? 'direct-ai' : 'browser')
                }
                title={
                  activeMicMode === 'direct-ai'
                    ? 'Direct AI Mic captures live audio directly from your microphone'
                    : hasCloudStt
                    ? 'Switch to Direct AI Mic if browser speech does not pick up your microphone'
                    : 'Browser Mic works offline without API keys'
                }
                className={`h-8 px-2.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 whitespace-nowrap transition-colors ${
                  activeMicMode === 'direct-ai'
                    ? 'bg-[#0F766E]/35 text-[#6EE7B7] hover:bg-[#0F766E]/45'
                    : 'bg-white/10 text-white/80 hover:bg-white/15'
                }`}
              >
                <span>
                  {activeMicMode === 'direct-ai' ? 'Mic: Direct AI' : 'Mic: Browser'}
                </span>
              </button>

              {canUndoVoice && (
                <button
                  type="button"
                  onClick={onUndoLastVoice}
                  aria-label="Undo last voice action"
                  className="h-8 px-2.5 rounded-lg bg-[#F59E0B]/20 hover:bg-[#F59E0B]/30 text-xs font-semibold text-[#FDE68A] inline-flex items-center gap-1 whitespace-nowrap transition-colors"
                >
                  <Undo2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Undo Last</span>
                </button>
              )}

              <button
                type="button"
                onClick={onToggleMute}
                aria-label={muted ? 'Unmute voice responses' : 'Mute voice responses'}
                className="h-8 px-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-white/85 inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                {muted ? (
                  <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>{muted ? 'Muted' : 'Voice On'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Amber Disambiguation Action Bar */}
        {pendingDisambiguation && (
          <div
            data-testid="disambiguation-bar"
            className="mt-4 pt-3.5 border-t border-[#F59E0B]/30 flex flex-wrap items-center justify-between gap-3"
          >
            <p className="text-sm font-medium text-[#FEF3C7]">
              Heard “{pendingDisambiguation.originalTranscript}” (
              {Math.round(pendingDisambiguation.confidence * 100)}% clarity) — choose item to
              resume billing:
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onResolveDisambiguation('primary')}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#F59E0B] text-[#1D1D1F] text-sm font-bold hover:bg-[#FBBF24] transition-colors whitespace-nowrap"
              >
                Yes, {pendingDisambiguation.primaryOption.label}
              </button>
              <button
                type="button"
                onClick={() => onResolveDisambiguation('secondary')}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-white/15 text-[#FEF3C7] text-sm font-semibold hover:bg-white/25 transition-colors whitespace-nowrap"
              >
                Use {pendingDisambiguation.secondaryOption.label}
              </button>
              <button
                type="button"
                onClick={() => onResolveDisambiguation('cancel')}
                className="min-h-[40px] px-3.5 py-2 rounded-xl text-sm font-medium text-[#FDE68A]/80 hover:text-white transition-colors whitespace-nowrap"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
