import {
  OutputVoiceLanguage,
  VoiceGender,
  VoiceLangCode,
  VoiceOutputSettings,
} from './types';
import { localizeVoiceResponse } from './voiceLocalizer';

export interface SarvamStatus {
  configured: boolean;
  models: {
    stt: string;
    tts: string;
    translate: string;
  };
}

export interface VoiceEngineStatus {
  geminiTtsConfigured: boolean;
  geminiSttConfigured: boolean;
  sarvamConfigured: boolean;
  models: {
    stt?: string;
    tts: string;
    translate: string;
  };
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [altIndex: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex?: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart?: (() => void) | null;
  onaudiostart?: (() => void) | null;
  onsoundstart?: (() => void) | null;
  onspeechstart?: (() => void) | null;
  onspeechend?: (() => void) | null;
  onsoundend?: (() => void) | null;
  onaudioend?: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string; message?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
}

export const VOICE_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: 1,
};

export interface MicLevelMonitor {
  stop: () => void;
}

let activeAudioElement: HTMLAudioElement | null = null;
let activeSpeakRequestId = 0;

export function stopActiveSpeechPlayback(): void {
  activeSpeakRequestId += 1;
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch {
      // ignore
    }
    activeAudioElement = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

export function resolveEffectiveOutputLang(
  outputLanguage: OutputVoiceLanguage,
  detectedInputLang: VoiceLangCode
): Exclude<OutputVoiceLanguage, 'auto'> {
  if (outputLanguage === 'auto') {
    return detectedInputLang;
  }
  return outputLanguage;
}

const FEMALE_VOICE_HINTS = [
  'female',
  'neerja',
  'swara',
  'shruti',
  'pallavi',
  'sapna',
  'aarohi',
  'heera',
  'veena',
  'meera',
  'aditi',
  'raveena',
  'kajal',
  'samantha',
  'ava',
  'aria',
  'jenny',
  'sara',
  'zoe',
  'moira',
  'tessa',
  'karen',
  'serena',
  'kate',
];

const MALE_VOICE_HINTS = [
  'male',
  'prabhat',
  'madhur',
  'mohan',
  'valluvar',
  'gagan',
  'manohar',
  'rishi',
  'ravi',
  'hemant',
  'arvind',
  'daniel',
  'alex',
  'guy',
  'ryan',
  'andrew',
  'brian',
  'christopher',
  'oliver',
];

const NATURAL_VOICE_BONUS = ['natural', 'neural', 'online', 'google', 'premium', 'enhanced', 'wavenet'];

export function selectOfflineHumanVoice<T extends { name: string; lang: string }>(
  voices: T[],
  targetLang: string,
  gender: VoiceGender
): T | undefined {
  if (voices.length === 0) return undefined;
  const normalizedTarget = targetLang.toLowerCase();
  const baseLang = normalizedTarget.split('-')[0];

  // For non-English Indian languages (Telugu, Hindi, Tamil, Kannada, Marathi), NEVER pick an English voice!
  // Returning undefined lets the OS/browser honor utterance.lang natively instead of forcing an English voice.
  const candidates =
    baseLang !== 'en'
      ? voices.filter((v) => {
          const vl = v.lang.toLowerCase();
          return vl === normalizedTarget || vl === baseLang || vl.startsWith(`${baseLang}-`);
        })
      : voices;

  if (candidates.length === 0) return undefined;

  const desiredHints = gender === 'male' ? MALE_VOICE_HINTS : FEMALE_VOICE_HINTS;
  const oppositeHints = gender === 'male' ? FEMALE_VOICE_HINTS : MALE_VOICE_HINTS;

  let bestVoice: T | undefined;
  let bestScore = -1000;

  for (const voice of candidates) {
    const vLang = voice.lang.toLowerCase();
    const vName = voice.name.toLowerCase();
    let score = 0;

    if (vLang === normalizedTarget) score += 120;
    else if (vLang.startsWith(`${baseLang}-`) || vLang === baseLang) score += 90;
    else if (vLang.includes('-in')) score += 25;
    else if (vLang.startsWith('en')) score += 10;

    if (NATURAL_VOICE_BONUS.some((hint) => vName.includes(hint))) {
      score += 22;
    }

    if (desiredHints.some((hint) => vName.includes(hint))) {
      score += 30;
    } else if (oppositeHints.some((hint) => vName.includes(hint))) {
      score -= 24;
    }

    // Penalize noticeably robotic compact/espeak voices
    if (/espeak|compact|festival|robot/i.test(vName)) {
      score -= 40;
    }

    if (score > bestScore) {
      bestScore = score;
      bestVoice = voice;
    }
  }

  return bestVoice;
}

export function startMicLevelMonitor(
  stream: MediaStream,
  onLevels: (bars: number[], rms: number) => void
): MicLevelMonitor {
  if (typeof window === 'undefined') {
    return { stop: () => {} };
  }
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) {
    return { stop: () => {} };
  }

  let rafId = 0;
  let closed = false;
  const ctx = new AudioCtx();
  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => {
      // ignore autoplay restriction if resume fails
    });
  }
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 128;
  analyser.smoothingTimeConstant = 0.68;
  source.connect(analyser);

  const freqData = new Uint8Array(analyser.frequencyBinCount);
  const timeData = new Uint8Array(analyser.fftSize);

  const tick = () => {
    if (closed) return;
    analyser.getByteFrequencyData(freqData);
    analyser.getByteTimeDomainData(timeData);

    let sumSq = 0;
    for (let i = 0; i < timeData.length; i++) {
      const centered = (timeData[i] - 128) / 128;
      sumSq += centered * centered;
    }
    const rms = Math.sqrt(sumSq / timeData.length);

    // Map 8 voice-frequency bins (~150Hz–3500Hz) into 0.2..1.0 bar heights
    const bars: number[] = [];
    for (let b = 0; b < 8; b++) {
      const binIdx = Math.min(freqData.length - 1, 2 + b * 2);
      const norm = freqData[binIdx] / 255;
      bars.push(Math.max(0.22, Math.min(1, norm * 1.35 + rms * 0.5)));
    }

    onLevels(bars, rms);
    rafId = window.requestAnimationFrame(tick);
  };

  rafId = window.requestAnimationFrame(tick);

  return {
    stop: () => {
      closed = true;
      if (rafId) window.cancelAnimationFrame(rafId);
      try {
        source.disconnect();
        void ctx.close();
      } catch {
        // ignore
      }
    },
  };
}

export async function fetchSarvamStatus(): Promise<SarvamStatus> {
  try {
    const res = await fetch('/api/sarvam/status', { method: 'GET' });
    if (!res.ok) {
      return { configured: false, models: { stt: 'saaras:v4', tts: 'bulbul:v3', translate: 'mayura:v1' } };
    }
    return (await res.json()) as SarvamStatus;
  } catch {
    return { configured: false, models: { stt: 'saaras:v4', tts: 'bulbul:v3', translate: 'mayura:v1' } };
  }
}

export async function fetchVoiceEngineStatus(): Promise<VoiceEngineStatus> {
  try {
    const res = await fetch('/api/voice/status', { method: 'GET' });
    if (!res.ok) {
      return {
        geminiTtsConfigured: false,
        geminiSttConfigured: false,
        sarvamConfigured: false,
        models: { stt: 'browser-speech', tts: 'browser-speech', translate: 'local' },
      };
    }
    return (await res.json()) as VoiceEngineStatus;
  } catch {
    return {
      geminiTtsConfigured: false,
      geminiSttConfigured: false,
      sarvamConfigured: false,
      models: { stt: 'browser-speech', tts: 'browser-speech', translate: 'local' },
    };
  }
}

export function getBrowserSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export interface SpeakBackResult {
  engine: 'gemini-tts' | 'sarvam' | 'offline' | 'muted';
  spokenText: string;
}

export async function speakBack(
  text: string,
  detectedLang: VoiceLangCode,
  options: {
    voiceOutput: VoiceOutputSettings;
    muted: boolean;
    onStart?: () => void;
    onEnd?: () => void;
    onLocalizedText?: (spokenText: string) => void;
  }
): Promise<SpeakBackResult> {
  if (options.muted || !text.trim()) {
    return { engine: 'muted', spokenText: text };
  }

  stopActiveSpeechPlayback();
  const requestId = activeSpeakRequestId;
  const targetLang = resolveEffectiveOutputLang(options.voiceOutput.outputLanguage, detectedLang);
  const localizedImmediate = localizeVoiceResponse(text, targetLang);

  // Immediately update displayed spoken text to native Telugu / Hindi / Tamil / Kannada / Marathi
  if (localizedImmediate !== text) {
    options.onLocalizedText?.(localizedImmediate);
  }

  // Path 1: Natural Human Neural TTS via server (/api/voice/tts -> Gemini 3.8 Flash Lite TTS / Sarvam Bulbul v3)
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: localizedImmediate.slice(0, 480),
          outputLanguage: targetLang,
          voiceGender: options.voiceOutput.voiceGender,
          speakingSpeed: options.voiceOutput.speakingSpeed,
        }),
      });

      if (requestId !== activeSpeakRequestId) {
        return { engine: 'muted', spokenText: localizedImmediate };
      }

      if (res.ok) {
        const data = (await res.json()) as {
          fallback?: boolean;
          engine?: 'gemini-tts' | 'sarvam' | 'offline';
          audioBase64?: string;
          spokenText?: string;
          mimeType?: string;
        };
        const spokenText = data.spokenText?.trim() || localizedImmediate;
        if (spokenText !== localizedImmediate) {
          options.onLocalizedText?.(spokenText);
        }
        if (!data.fallback && data.audioBase64) {
          const mime = data.mimeType || 'audio/wav';
          const audio = new Audio(`data:${mime};base64,${data.audioBase64}`);
          activeAudioElement = audio;
          options.onStart?.();
          audio.onended = () => {
            if (activeAudioElement === audio) activeAudioElement = null;
            options.onEnd?.();
          };
          audio.onerror = () => {
            if (activeAudioElement === audio) activeAudioElement = null;
            options.onEnd?.();
          };
          await audio.play().catch(() => {
            if (activeAudioElement === audio) activeAudioElement = null;
            options.onEnd?.();
          });
          return {
            engine: data.engine === 'sarvam' ? 'sarvam' : 'gemini-tts',
            spokenText,
          };
        }
      }
    } catch {
      // Automatic offline human-matched browser fallback below
    }
  }

  if (requestId !== activeSpeakRequestId) {
    return { engine: 'muted', spokenText: localizedImmediate };
  }

  // Path 2: Offline natural-tuned browser SpeechSynthesis matched to Output Language + Male/Female preference
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(localizedImmediate);
      utterance.lang = targetLang;
      utterance.rate =
        options.voiceOutput.speakingSpeed === 'relaxed'
          ? 0.92
          : options.voiceOutput.speakingSpeed === 'brisk'
          ? 1.08
          : 0.99;
      // Subtle pitch shaping only when OS lacks distinct gendered voices
      const voices = window.speechSynthesis.getVoices();
      const preferred = selectOfflineHumanVoice(
        voices,
        targetLang,
        options.voiceOutput.voiceGender
      );
      if (preferred) {
        utterance.voice = preferred;
        utterance.pitch = 1.0;
      } else {
        utterance.pitch = options.voiceOutput.voiceGender === 'male' ? 0.88 : 1.06;
      }

      let ended = false;
      const safetyTimer = window.setTimeout(() => {
        if (!ended) {
          ended = true;
          options.onEnd?.();
        }
      }, 15000);
      const finishOnce = () => {
        if (ended) return;
        ended = true;
        window.clearTimeout(safetyTimer);
        options.onEnd?.();
      };

      utterance.onstart = () => options.onStart?.();
      utterance.onend = finishOnce;
      utterance.onerror = finishOnce;
      window.speechSynthesis.speak(utterance);
      return { engine: 'offline', spokenText: localizedImmediate };
    } catch {
      options.onEnd?.();
      return { engine: 'offline', spokenText: localizedImmediate };
    }
  }

  return { engine: 'offline', spokenText: localizedImmediate };
}

export function pickSupportedAudioMimeType(): string {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return '';
  }
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return '';
}

export async function transcribeWithVoiceApi(
  audioBlob: Blob,
  hintLang?: string
): Promise<{
  transcript: string;
  confidence: number;
  languageCode?: VoiceLangCode;
  fallback?: boolean;
  reason?: string;
} | null> {
  try {
    const buffer = await audioBlob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (bytes.byteLength < 600) {
      return { transcript: '', confidence: 0 };
    }
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.byteLength; i += chunkSize) {
      const sub = bytes.subarray(i, Math.min(i + chunkSize, bytes.byteLength));
      binary += String.fromCharCode(...sub);
    }
    const audioBase64 = btoa(binary);

    const res = await fetch('/api/voice/stt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioBase64,
        mimeType: audioBlob.type || 'audio/webm',
        hintLang: hintLang || 'unknown',
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      fallback?: boolean;
      transcript?: string;
      confidence?: number;
      languageCode?: string;
      reason?: string;
    };
    if (data.fallback) {
      return {
        transcript: '',
        confidence: 0,
        fallback: true,
        reason: data.reason,
      };
    }
    const normalizedLang: VoiceLangCode | undefined =
      data.languageCode === 'te-IN' || data.languageCode === 'hi-IN' || data.languageCode === 'en-IN'
        ? data.languageCode
        : undefined;
    return {
      transcript: typeof data.transcript === 'string' ? data.transcript.trim() : '',
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.93,
      languageCode: normalizedLang,
      fallback: false,
    };
  } catch {
    return null;
  }
}

export async function transcribeWithSarvam(
  audioBlob: Blob
): Promise<{ transcript: string; confidence: number; languageCode?: VoiceLangCode } | null> {
  try {
    const buffer = await audioBlob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const audioBase64 = btoa(binary);

    const res = await fetch('/api/sarvam/stt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioBase64,
        mimeType: audioBlob.type || 'audio/webm',
        languageCode: 'unknown',
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      fallback?: boolean;
      transcript?: string;
      confidence?: number;
      languageCode?: string;
    };
    if (data.fallback || !data.transcript) return null;
    const normalizedLang: VoiceLangCode | undefined =
      data.languageCode === 'te-IN' || data.languageCode === 'hi-IN' || data.languageCode === 'en-IN'
        ? data.languageCode
        : undefined;
    return {
      transcript: data.transcript,
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.94,
      languageCode: normalizedLang,
    };
  } catch {
    return null;
  }
}
