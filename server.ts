import { GoogleGenAI } from '@google/genai';
import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isConfiguredApiKey } from './src/engine/apiKeyUtils.ts';
import { type ConcreteOutputLang, localizeVoiceResponse } from './src/engine/voiceLocalizer.ts';

dotenv.config({ quiet: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_LANG_CODES = new Set([
  'en-IN',
  'te-IN',
  'hi-IN',
  'ta-IN',
  'kn-IN',
  'ml-IN',
  'mr-IN',
  'gu-IN',
  'bn-IN',
  'unknown',
]);

const OUTPUT_LANG_NAMES: Record<string, string> = {
  'en-IN': 'natural conversational Indian English',
  'te-IN': 'warm, natural spoken Telugu (using native Telugu script with clear everyday Kirana words)',
  'hi-IN': 'warm, natural spoken Hindi (using native Devanagari script with clear everyday Kirana words)',
  'ta-IN': 'warm, natural spoken Tamil (using native Tamil script with clear everyday Kirana words)',
  'kn-IN': 'warm, natural spoken Kannada (using native Kannada script with clear everyday Kirana words)',
  'mr-IN': 'warm, natural spoken Marathi (using native Devanagari script with clear everyday Kirana words)',
};

const SARVAM_BASE_URL = 'https://api.sarvam.ai';

function getGeminiTtsClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!isConfiguredApiKey(apiKey)) return null;
  return new GoogleGenAI({
    apiKey: apiKey!,
    apiVersion: 'v1beta',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isSarvamConfigured(): boolean {
  return isConfiguredApiKey(process.env.SARVAM_API_KEY);
}

function wrapPcmToWavIfNeeded(
  base64Audio: string,
  mimeType: string
): { audioBase64: string; mimeType: string } {
  const lower = mimeType.toLowerCase();
  if (!lower.includes('l16') && !lower.includes('pcm')) {
    return { audioBase64: base64Audio, mimeType: mimeType || 'audio/wav' };
  }
  const rateMatch = lower.match(/rate=(\d+)/);
  const sampleRate = rateMatch ? Number(rateMatch[1]) : 24000;
  const pcmBuf = Buffer.from(base64Audio, 'base64');
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmBuf.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcmBuf.length, 40);
  return {
    audioBase64: Buffer.concat([header, pcmBuf]).toString('base64'),
    mimeType: 'audio/wav',
  };
}

// Small bounded in-memory caches for instant repeated Kirana responses
const translationCache = new Map<string, string>();
const ttsAudioCache = new Map<string, { audioBase64: string; spokenText: string }>();

function setBoundedCache<K, V>(map: Map<K, V>, key: K, val: V, maxSize: number) {
  if (map.size >= maxSize) {
    const oldestKey = map.keys().next().value;
    if (oldestKey !== undefined) map.delete(oldestKey);
  }
  map.set(key, val);
}

const NATIVE_SCRIPT_REGEX: Record<string, RegExp> = {
  'te-IN': /[\u0C00-\u0C7F]/,
  'hi-IN': /[\u0900-\u097F]/,
  'ta-IN': /[\u0B80-\u0BFF]/,
  'kn-IN': /[\u0C80-\u0CFF]/,
  'mr-IN': /[\u0900-\u097F]/,
};

function hasTargetNativeScript(text: string, targetLang: string): boolean {
  const scriptRegex = NATIVE_SCRIPT_REGEX[targetLang];
  if (!scriptRegex) return true;
  return scriptRegex.test(text);
}

function isSupportedConcreteLang(lang: string): lang is ConcreteOutputLang {
  return (
    lang === 'en-IN' ||
    lang === 'te-IN' ||
    lang === 'hi-IN' ||
    lang === 'ta-IN' ||
    lang === 'kn-IN' ||
    lang === 'mr-IN'
  );
}

async function localizeSpokenTextWithGemini(
  ai: GoogleGenAI,
  text: string,
  targetLang: string
): Promise<string> {
  if (targetLang === 'en-IN') return text;

  const deterministic = isSupportedConcreteLang(targetLang)
    ? localizeVoiceResponse(text, targetLang)
    : text;

  // If deterministic native localizer already converted into clean native script with no English boilerplate, use it instantly!
  const hasEnglishBoilerplate = /\b(Added|Current|Total|Warning|Updated|Ready|Sales|Spends|Confirmed|Cancelled|remaining|wholesale|selling)\b/i.test(
    deterministic
  );
  if (hasTargetNativeScript(deterministic, targetLang) && !hasEnglishBoilerplate) {
    return deterministic;
  }

  const cacheKey = `${targetLang}::${text}`;
  const cached = translationCache.get(cacheKey);
  if (cached) return cached;

  const langDesc = OUTPUT_LANG_NAMES[targetLang] || 'natural conversational Indian English';
  const prompt = `Translate this short Indian Kirana shop billing confirmation completely into ${langDesc} so it sounds warm, smooth, and completely natural when spoken aloud by a helpful human shop assistant. Never leave English sentences untranslated. Keep all numbers, rupee amounts, weights, and customer names exact. Output ONLY the spoken sentence in native script with no quotes, markdown, or extra notes.\n\nText: ${text}`;

  for (const modelName of ['gemini-4-hydrogen', 'gemini-3.1-flash-lite']) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });
      const localized = response.text?.trim();
      if (localized && localized.length > 0 && localized.length < 700 && hasTargetNativeScript(localized, targetLang)) {
        setBoundedCache(translationCache, cacheKey, localized, 120);
        return localized;
      }
    } catch {
      // Try next model or fallback below
    }
  }

  // Secondary fallback: Sarvam Mayura v1 if configured
  const sarvamKey = process.env.SARVAM_API_KEY?.trim();
  if (isConfiguredApiKey(sarvamKey)) {
    try {
      const upstream = await fetch(`${SARVAM_BASE_URL}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': sarvamKey,
        },
        body: JSON.stringify({
          input: text.trim(),
          source_language_code: 'en-IN',
          target_language_code: targetLang,
          model: 'mayura:v1',
          mode: 'code-mixed',
        }),
      });
      if (upstream.ok) {
        const data = (await upstream.json()) as { translated_text?: string };
        if (typeof data.translated_text === 'string' && data.translated_text.trim().length > 0) {
          const localized = data.translated_text.trim();
          setBoundedCache(translationCache, cacheKey, localized, 120);
          return localized;
        }
      }
    } catch {
      // ignore
    }
  }

  return deterministic;
}

async function synthesizeWithSarvam(
  text: string,
  lang: string,
  voiceGender: 'male' | 'female',
  speakingSpeed: 'relaxed' | 'normal' | 'brisk'
): Promise<string> {
  const apiKey = process.env.SARVAM_API_KEY?.trim();
  if (!isConfiguredApiKey(apiKey)) return '';

  const safeLang =
    ALLOWED_LANG_CODES.has(lang) && lang !== 'unknown' ? lang : 'en-IN';
  const pace = speakingSpeed === 'relaxed' ? 0.94 : speakingSpeed === 'brisk' ? 1.12 : 1.02;
  const speaker = voiceGender === 'male' ? 'arvind' : 'meera';

  const upstream = await fetch(`${SARVAM_BASE_URL}/text-to-speech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': apiKey,
    },
    body: JSON.stringify({
      inputs: [text.trim()],
      target_language_code: safeLang,
      model: 'bulbul:v3',
      speaker,
      pace,
    }),
  });

  if (!upstream.ok) return '';
  const data = (await upstream.json()) as { audios?: string[] };
  return Array.isArray(data.audios) && typeof data.audios[0] === 'string' ? data.audios[0] : '';
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '6mb' }));

  app.get('/api/health', (_req, res) => {
    const geminiConfigured = Boolean(getGeminiTtsClient());
    const sarvamConfigured = isSarvamConfigured();
    res.json({
      status: 'ok',
      port: PORT,
      mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      keysConfigured: {
        gemini: geminiConfigured,
        sarvam: sarvamConfigured,
      },
    });
  });

  app.get('/api/voice/status', (_req, res) => {
    const geminiConfigured = Boolean(getGeminiTtsClient());
    const sarvamConfigured = isSarvamConfigured();
    res.json({
      geminiTtsConfigured: geminiConfigured,
      geminiSttConfigured: geminiConfigured,
      sarvamConfigured,
      models: {
        stt: sarvamConfigured ? 'saaras:v4' : geminiConfigured ? 'gemini-4-hydrogen' : 'browser-speech',
        tts: geminiConfigured ? 'gemini-3.8-flash-lite-tts' : sarvamConfigured ? 'bulbul:v3' : 'browser-speech',
        translate: geminiConfigured ? 'gemini-4-hydrogen' : sarvamConfigured ? 'mayura:v1' : 'local',
      },
    });
  });

  app.get('/api/sarvam/status', (_req, res) => {
    res.json({
      configured: isSarvamConfigured(),
      models: {
        stt: 'saaras:v4',
        tts: 'bulbul:v3',
        translate: 'mayura:v1',
      },
    });
  });

  // Natural Human Neural TTS Route (Gemini 3.8 Flash Lite TTS -> Sarvam Bulbul v3 -> Client Fallback)
  app.post('/api/voice/tts', async (req, res) => {
    try {
      const { text, outputLanguage, voiceGender, speakingSpeed } = req.body ?? {};
      if (typeof text !== 'string' || text.trim().length === 0 || text.length > 500) {
        res.status(400).json({ error: 'Invalid TTS text' });
        return;
      }

      const safeLang =
        typeof outputLanguage === 'string' &&
        ALLOWED_LANG_CODES.has(outputLanguage) &&
        outputLanguage !== 'unknown'
          ? outputLanguage
          : 'en-IN';
      const safeGender: 'male' | 'female' = voiceGender === 'male' ? 'male' : 'female';
      const safeSpeed: 'relaxed' | 'normal' | 'brisk' =
        speakingSpeed === 'relaxed' || speakingSpeed === 'brisk' ? speakingSpeed : 'normal';

      const cleanText = text.trim();
      const cacheKey = `${safeLang}|${safeGender}|${safeSpeed}|${cleanText}`;
      const cachedAudio = ttsAudioCache.get(cacheKey);
      if (cachedAudio) {
        res.json({
          fallback: false,
          engine: 'gemini-tts',
          audioBase64: cachedAudio.audioBase64,
          spokenText: cachedAudio.spokenText,
          mimeType: 'audio/wav',
        });
        return;
      }

      let lastErrorReason = '';
      const ttsAi = getGeminiTtsClient();
      if (ttsAi) {
        try {
          const spokenText = await localizeSpokenTextWithGemini(ttsAi, cleanText, safeLang);
          const paceInstruction =
            safeSpeed === 'relaxed'
              ? 'relaxed, unhurried, gentle pace'
              : safeSpeed === 'brisk'
              ? 'crisp, energetic, rush-hour friendly pace'
              : 'smooth, steady, natural conversational pace';
          const nativeLangHint = OUTPUT_LANG_NAMES[safeLang] || 'natural conversational Indian English';
          const personaStyle =
            safeGender === 'male'
              ? `Speak strictly in ${nativeLangHint}. Warm, calm, reassuring human Indian male voice with authentic native pronunciation, smooth natural breath, gentle friendly inflection, and ${paceInstruction}. Never robotic or monotone.`
              : `Speak strictly in ${nativeLangHint}. Warm, smooth, friendly human Indian female voice with authentic native pronunciation, natural melodic flow, gentle warmth, and ${paceInstruction}. Never robotic or monotone.`;

          const voiceName = safeGender === 'male' ? 'Charon' : 'Kore';

          const callTts = async (modelName: string, includeMetadata: boolean) =>
            ttsAi.models.generateContent({
              model: modelName,
              contents: [
                {
                  role: 'user',
                  parts: [
                    includeMetadata
                      ? {
                          text: spokenText,
                          speechMetadata: {
                            style: personaStyle,
                          },
                        }
                      : {
                          text: `Read aloud warmly and naturally in ${nativeLangHint}: ${spokenText}`,
                        },
                  ],
                },
              ],
              config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName },
                  },
                },
              },
            });

          for (const ttsModel of ['gemini-3.8-flash-lite-tts', 'gemini-2.5-flash-preview-tts']) {
            try {
              let ttsResponse;
              if (ttsModel === 'gemini-3.8-flash-lite-tts') {
                try {
                  ttsResponse = await callTts(ttsModel, true);
                } catch {
                  ttsResponse = await callTts(ttsModel, false);
                }
              } else {
                ttsResponse = await callTts(ttsModel, false);
              }

              const rawAudio =
                ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
              const rawMime =
                ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType ||
                'audio/wav';

              if (typeof rawAudio === 'string' && rawAudio.length > 0) {
                const wrapped = wrapPcmToWavIfNeeded(rawAudio, rawMime);
                setBoundedCache(
                  ttsAudioCache,
                  cacheKey,
                  { audioBase64: wrapped.audioBase64, spokenText },
                  60
                );
                res.json({
                  fallback: false,
                  engine: 'gemini-tts',
                  audioBase64: wrapped.audioBase64,
                  spokenText,
                  mimeType: wrapped.mimeType,
                });
                return;
              }
            } catch (modelErr) {
              lastErrorReason =
                modelErr instanceof Error ? modelErr.message.slice(0, 180) : 'gemini_tts_error';
            }
          }
          if (!lastErrorReason) {
            lastErrorReason = 'gemini_tts_empty_audio';
          }
        } catch (err) {
          lastErrorReason = err instanceof Error ? err.message.slice(0, 180) : 'gemini_tts_error';
          console.error('Gemini TTS fallback triggered:', lastErrorReason);
        }
      }

      // Secondary human neural fallback: Sarvam Bulbul v3 if configured
      const fallbackSpokenText = isSupportedConcreteLang(safeLang)
        ? localizeVoiceResponse(cleanText, safeLang)
        : cleanText;
      if (isSarvamConfigured()) {
        try {
          const audioBase64 = await synthesizeWithSarvam(fallbackSpokenText, safeLang, safeGender, safeSpeed);
          if (audioBase64) {
            res.json({
              fallback: false,
              engine: 'sarvam',
              audioBase64,
              spokenText: fallbackSpokenText,
              mimeType: 'audio/wav',
            });
            return;
          }
        } catch {
          // Fall through to client fallback
        }
      }

      res.json({
        fallback: true,
        engine: 'offline',
        spokenText: fallbackSpokenText,
        reason: lastErrorReason || 'no_cloud_tts_key',
      });
    } catch {
      res.status(502).json({ fallback: true, reason: 'voice_tts_error' });
    }
  });

  // Universal Direct-Mic Speech-to-Text Route (Sarvam Saaras v4 -> Gemini Multimodal Audio -> Zero-Key Graceful Fallback)
  app.post('/api/voice/stt', async (req, res) => {
    try {
      const { audioBase64, mimeType, hintLang } = req.body ?? {};
      if (
        typeof audioBase64 !== 'string' ||
        audioBase64.length === 0 ||
        audioBase64.length > 6_000_000
      ) {
        res.status(400).json({ error: 'Invalid audio payload' });
        return;
      }

      const rawMime = typeof mimeType === 'string' ? mimeType.trim() : 'audio/webm';
      const safeMime = /^audio\/(webm|wav|ogg|mpeg|mp4|mp3|aac)(;.*)?$/i.test(rawMime)
        ? rawMime
        : 'audio/webm';
      const baseMime = safeMime.split(';')[0].trim().toLowerCase();
      const safeLang =
        typeof hintLang === 'string' && ALLOWED_LANG_CODES.has(hintLang) ? hintLang : 'unknown';

      // Path 1: Sarvam Saaras v4 codemix STT if configured
      const sarvamKey = process.env.SARVAM_API_KEY?.trim();
      if (isConfiguredApiKey(sarvamKey)) {
        try {
          const audioBuffer = Buffer.from(audioBase64, 'base64');
          const formData = new FormData();
          const ext = baseMime.includes('wav')
            ? 'wav'
            : baseMime.includes('ogg')
            ? 'ogg'
            : baseMime.includes('mp4')
            ? 'mp4'
            : 'webm';
          formData.append('file', new Blob([audioBuffer], { type: safeMime }), `recording.${ext}`);
          formData.append('model', 'saaras:v4');
          formData.append('mode', 'codemix');
          if (safeLang !== 'unknown') {
            formData.append('language_code', safeLang);
          }

          const upstream = await fetch(`${SARVAM_BASE_URL}/speech-to-text`, {
            method: 'POST',
            headers: { 'api-subscription-key': sarvamKey },
            body: formData,
          });
          if (upstream.ok) {
            const data = (await upstream.json()) as {
              transcript?: string;
              language_code?: string;
            };
            const transcript = typeof data.transcript === 'string' ? data.transcript.trim() : '';
            res.json({
              fallback: false,
              engine: 'sarvam',
              transcript,
              languageCode: typeof data.language_code === 'string' ? data.language_code : safeLang,
              confidence: 0.94,
            });
            return;
          }
        } catch {
          // Fall through to Gemini STT
        }
      }

      // Path 2: Gemini Multimodal Audio Transcription if GEMINI_API_KEY is configured
      const sttAi = getGeminiTtsClient();
      if (sttAi) {
        const prompt = `Transcribe this short live microphone clip from an Indian Kirana shopkeeper speaking in English, Telugu, Hindi, or code-mixed Indian speech.
Keep exact item names (sugar, toor dal, kandipappu, sunflower oil, groundnuts, pallilu, wheat flour, atta, jaggery, bellam, rice, cardamom, etc.), quantities (ara kilo, half kilo, paavu, 250g, 500g, 1 kg, rendu, moodu, 20 rupees, 2 packets), customer names (Ramesh, Lakshmi, Suresh), and commands (checkout, bill done, paid, poured, edit rate, today's profit, eeroju labham entha).
Write Telugu/Hindi words in clean romanized Latin or native script faithfully.
If the clip contains only silence, breathing, mic clicks, or unintelligible background noise with no clear speech, reply with literally: EMPTY
Output ONLY the transcribed text (or EMPTY) with no quotes, markdown, or explanation.`;

        for (const modelName of ['gemini-4-hydrogen', 'gemini-2.5-flash']) {
          try {
            const response = await sttAi.models.generateContent({
              model: modelName,
              contents: [
                {
                  role: 'user',
                  parts: [
                    { text: prompt },
                    {
                      inlineData: {
                        mimeType: baseMime,
                        data: audioBase64,
                      },
                    },
                  ],
                },
              ],
            });
            const rawText = (response.text ?? '').trim();
            const cleaned = rawText
              .replace(/^["'`]+|["'`]+$/g, '')
              .replace(/\s+/g, ' ')
              .trim();
            const isEmpty =
              !cleaned ||
              /^empty\.?$/i.test(cleaned) ||
              /^\[?(silence|no speech|inaudible|noise)\]?\.?$/i.test(cleaned);
            res.json({
              fallback: false,
              engine: 'gemini-stt',
              transcript: isEmpty ? '' : cleaned,
              languageCode: safeLang,
              confidence: 0.93,
            });
            return;
          } catch {
            // Try next model
          }
        }
      }

      res.json({
        fallback: true,
        engine: 'offline',
        transcript: '',
        reason: 'no_cloud_stt_key',
      });
    } catch {
      res.status(502).json({ fallback: true, transcript: '', reason: 'voice_stt_error' });
    }
  });

  app.post('/api/sarvam/stt', async (req, res) => {
    const apiKey = process.env.SARVAM_API_KEY?.trim();
    if (!isConfiguredApiKey(apiKey)) {
      res.json({ fallback: true, reason: 'sarvam_not_configured' });
      return;
    }

    try {
      const { audioBase64, mimeType, languageCode } = req.body ?? {};
      if (typeof audioBase64 !== 'string' || audioBase64.length === 0 || audioBase64.length > 5_000_000) {
        res.status(400).json({ error: 'Invalid audio payload' });
        return;
      }
      const safeLang =
        typeof languageCode === 'string' && ALLOWED_LANG_CODES.has(languageCode)
          ? languageCode
          : 'unknown';
      const safeMime =
        typeof mimeType === 'string' && /^audio\/(webm|wav|ogg|mpeg|mp4|mp3)(;.*)?$/i.test(mimeType)
          ? mimeType
          : 'audio/webm';

      const audioBuffer = Buffer.from(audioBase64, 'base64');
      const formData = new FormData();
      const ext = safeMime.includes('wav') ? 'wav' : safeMime.includes('ogg') ? 'ogg' : 'webm';
      formData.append('file', new Blob([audioBuffer], { type: safeMime }), `recording.${ext}`);
      formData.append('model', 'saaras:v4');
      formData.append('mode', 'codemix');
      if (safeLang !== 'unknown') {
        formData.append('language_code', safeLang);
      }

      const upstream = await fetch(`${SARVAM_BASE_URL}/speech-to-text`, {
        method: 'POST',
        headers: {
          'api-subscription-key': apiKey,
        },
        body: formData,
      });

      if (!upstream.ok) {
        res.status(502).json({ fallback: true, reason: 'sarvam_upstream_error', status: upstream.status });
        return;
      }

      const data = (await upstream.json()) as {
        transcript?: string;
        language_code?: string;
      };
      res.json({
        fallback: false,
        transcript: typeof data.transcript === 'string' ? data.transcript : '',
        languageCode: typeof data.language_code === 'string' ? data.language_code : safeLang,
        confidence: 0.94,
      });
    } catch {
      res.status(502).json({ fallback: true, reason: 'sarvam_network_error' });
    }
  });

  app.post('/api/sarvam/tts', async (req, res) => {
    if (!isSarvamConfigured()) {
      res.json({ fallback: true, reason: 'sarvam_not_configured' });
      return;
    }

    try {
      const { text, languageCode, voiceGender, speakingSpeed } = req.body ?? {};
      if (typeof text !== 'string' || text.trim().length === 0 || text.length > 500) {
        res.status(400).json({ error: 'Invalid TTS text' });
        return;
      }

      const safeLang =
        typeof languageCode === 'string' &&
        ALLOWED_LANG_CODES.has(languageCode) &&
        languageCode !== 'unknown'
          ? languageCode
          : 'en-IN';
      const safeGender: 'male' | 'female' = voiceGender === 'male' ? 'male' : 'female';
      const safeSpeed: 'relaxed' | 'normal' | 'brisk' =
        speakingSpeed === 'relaxed' || speakingSpeed === 'brisk' ? speakingSpeed : 'normal';

      const audioBase64 = await synthesizeWithSarvam(text, safeLang, safeGender, safeSpeed);
      res.json({
        fallback: audioBase64.length === 0,
        audioBase64,
      });
    } catch {
      res.status(502).json({ fallback: true, reason: 'sarvam_network_error' });
    }
  });

  app.post('/api/sarvam/translate', async (req, res) => {
    const apiKey = process.env.SARVAM_API_KEY?.trim();
    if (!isConfiguredApiKey(apiKey)) {
      res.json({ fallback: true, reason: 'sarvam_not_configured' });
      return;
    }

    try {
      const { text, sourceLanguage, targetLanguage } = req.body ?? {};
      if (typeof text !== 'string' || text.trim().length === 0 || text.length > 500) {
        res.status(400).json({ error: 'Invalid translation text' });
        return;
      }

      const src =
        typeof sourceLanguage === 'string' && ALLOWED_LANG_CODES.has(sourceLanguage)
          ? sourceLanguage
          : 'en-IN';
      const tgt =
        typeof targetLanguage === 'string' &&
        ALLOWED_LANG_CODES.has(targetLanguage) &&
        targetLanguage !== 'unknown'
          ? targetLanguage
          : 'en-IN';

      const upstream = await fetch(`${SARVAM_BASE_URL}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': apiKey,
        },
        body: JSON.stringify({
          input: text.trim(),
          source_language_code: src,
          target_language_code: tgt,
          model: 'mayura:v1',
          mode: 'code-mixed',
        }),
      });

      if (!upstream.ok) {
        res.status(502).json({ fallback: true, reason: 'sarvam_upstream_error', status: upstream.status });
        return;
      }

      const data = (await upstream.json()) as { translated_text?: string };
      res.json({
        fallback: false,
        translatedText: typeof data.translated_text === 'string' ? data.translated_text : text,
      });
    } catch {
      res.status(502).json({ fallback: true, reason: 'sarvam_network_error' });
    }
  });

  const distDir = path.resolve(__dirname, 'dist');
  const hasBuiltDist = fs.existsSync(path.join(distDir, 'index.html'));

  if (process.env.NODE_ENV !== 'production' || !hasBuiltDist) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ManaKirana server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
