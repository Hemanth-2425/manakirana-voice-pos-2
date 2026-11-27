import { useCallback, useEffect, useRef, useState } from 'react';
import { CounterTab } from './components/CounterTab';
import { DrumStockTab } from './components/DrumStockTab';
import { DynamicIsland } from './components/DynamicIsland';
import { LoginScreen } from './components/LoginScreen';
import { ProfileTab } from './components/ProfileTab';
import { ProfitDashTab } from './components/ProfitDashTab';
import { QuickStartTour } from './components/QuickStartTour';
import { RefillListTab } from './components/RefillListTab';
import { TopBar } from './components/TopBar';
import { UdhaarTab } from './components/UdhaarTab';
import {
  addOrUpdateBillLine,
  createBillLine,
  finalizeActiveBill,
  getLowStockItems,
  processVoiceTranscript,
} from './engine/kiranaReducer';
import { OUTPUT_VOICE_LANGUAGES, TARUGU_RATE } from './engine/seedData';
import {
  fetchSarvamStatus,
  fetchVoiceEngineStatus,
  getBrowserSpeechRecognition,
  MicLevelMonitor,
  pickSupportedAudioMimeType,
  resolveEffectiveOutputLang,
  speakBack,
  SpeechRecognitionLike,
  startMicLevelMonitor,
  stopActiveSpeechPlayback,
  transcribeWithVoiceApi,
  VOICE_AUDIO_CONSTRAINTS,
} from './engine/speechService';
import {
  clearSession,
  loadSessionSync,
  loadStateFromIndexedDB,
  loadStateSync,
  persistSession,
  persistState,
} from './engine/storage';
import {
  AppState,
  DailySpend,
  KiranaItem,
  OutputVoiceLanguage,
  PaymentMethod,
  PricingUnit,
  PrivacyMode,
  ShopProfile,
  ShopSession,
  TabId,
  VoiceGender,
  VoiceLangCode,
  VoiceOutputSettings,
} from './engine/types';
import { localizeVoiceResponse } from './engine/voiceLocalizer';
import {
  formatWeightDisplay,
  pickBestTranscriptAlternative,
} from './engine/voiceParser';

export default function App() {
  const [session, setSession] = useState<ShopSession>(() => {
    if (
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('autostart') === '1'
    ) {
      return { isLoggedIn: true, hasCompletedSlides: true };
    }
    return loadSessionSync();
  });
  const [state, setState] = useState<AppState>(() => loadStateSync());
  const [undoSnapshot, setUndoSnapshot] = useState<AppState | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('counter');
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingBack, setIsSpeakingBack] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [micBars, setMicBars] = useState<number[]>([]);
  const [micRms, setMicRms] = useState(0);
  const [micSourceDetected, setMicSourceDetected] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [preferredMicMode, setPreferredMicMode] = useState<'browser' | 'direct-ai'>('browser');
  const [activeMicMode, setActiveMicMode] = useState<'browser' | 'direct-ai'>('browser');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [muted, setMuted] = useState(false);
  const [sarvamConfigured, setSarvamConfigured] = useState(false);
  const [geminiTtsConfigured, setGeminiTtsConfigured] = useState(false);
  const [geminiSttConfigured, setGeminiSttConfigured] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const levelMonitorRef = useRef<MicLevelMonitor | null>(null);
  const directLoopTimerRef = useRef<number | null>(null);
  const vadIntervalRef = useRef<number | null>(null);
  const browserPulseIntervalRef = useRef<number | null>(null);
  const restartTimerRef = useRef<number | null>(null);
  const echoGuardTimerRef = useRef<number | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const peakRmsInSegmentRef = useRef<number>(0);
  const speechDetectedInSegmentRef = useRef<boolean>(false);
  const lastSpeechAtRef = useRef<number>(0);
  const consecutiveEmptyBrowserEndsRef = useRef<number>(0);
  const sawSpeechInBrowserSessionRef = useRef<boolean>(false);
  const wantContinuousRef = useRef<boolean>(false);
  const stateRef = useRef<AppState>(state);
  stateRef.current = state;

  // Hydrate from IndexedDB if newer / available and check server voice engine status
  useEffect(() => {
    void loadStateFromIndexedDB().then((idbState) => {
      if (idbState && !localStorage.getItem('manakirana_state_v1')) {
        setState(idbState);
      }
    });
    void fetchSarvamStatus().then((status) => {
      setSarvamConfigured(status.configured);
    });
    void fetchVoiceEngineStatus().then((status) => {
      setGeminiTtsConfigured(status.geminiTtsConfigured);
      setGeminiSttConfigured(status.geminiSttConfigured);
      if (status.sarvamConfigured) {
        setSarvamConfigured(true);
      }
    });
  }, []);

  // Cleanup continuous streams on unmount
  useEffect(() => {
    return () => {
      wantContinuousRef.current = false;
      if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
      if (directLoopTimerRef.current) window.clearTimeout(directLoopTimerRef.current);
      if (vadIntervalRef.current) window.clearInterval(vadIntervalRef.current);
      if (browserPulseIntervalRef.current) window.clearInterval(browserPulseIntervalRef.current);
      if (echoGuardTimerRef.current) window.clearTimeout(echoGuardTimerRef.current);
      levelMonitorRef.current?.stop();
      try {
        recognitionRef.current?.abort?.();
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Persist every state change locally (localStorage + IndexedDB)
  useEffect(() => {
    persistState(state);
  }, [state]);

  // Persist login + onboarding slides session locally
  useEffect(() => {
    persistSession(session);
  }, [session]);

  const useSarvamVoice = state.privacyMode === 'cloud-sync' && sarvamConfigured;

  const localizeForCurrentVoice = useCallback(
    (
      text: string,
      detectedLangOverride?: VoiceLangCode,
      voiceOutputOverride?: VoiceOutputSettings
    ) => {
      const vo = voiceOutputOverride ?? stateRef.current.voiceOutput;
      const targetLang = resolveEffectiveOutputLang(
        vo.outputLanguage,
        detectedLangOverride ?? stateRef.current.voiceLang
      );
      return localizeVoiceResponse(text, targetLang);
    },
    []
  );

  const speak = useCallback(
    (
      text: string,
      langOverride?: VoiceLangCode,
      voiceOutputOverride?: VoiceOutputSettings
    ) => {
      const effectiveVoiceOutput = voiceOutputOverride ?? stateRef.current.voiceOutput;
      void speakBack(text, langOverride ?? stateRef.current.voiceLang, {
        voiceOutput: effectiveVoiceOutput,
        muted,
        onLocalizedText: (localizedText) => {
          setState((prev) => ({
            ...prev,
            lastSpokenResponse: localizedText,
          }));
        },
        onStart: () => {
          if (echoGuardTimerRef.current) window.clearTimeout(echoGuardTimerRef.current);
          isSpeakingRef.current = true;
          setIsSpeakingBack(true);
        },
        onEnd: () => {
          // Keep echo guard active for 320ms after playback finishes so speaker tail isn't re-captured
          echoGuardTimerRef.current = window.setTimeout(() => {
            isSpeakingRef.current = false;
            setIsSpeakingBack(false);
          }, 320);
        },
      });
    },
    [muted]
  );

  const handleVoiceTranscript = useCallback(
    (transcript: string, confidence = 0.95, detectedLang?: VoiceLangCode) => {
      const prevSnapshot = stateRef.current;
      const result = processVoiceTranscript(prevSnapshot, transcript, {
        confidence,
        engine: useSarvamVoice ? 'sarvam' : 'offline',
        detectedLang,
      });
      if (result.command.type !== 'noise') {
        setUndoSnapshot(prevSnapshot);
      }
      const localizedResponse = localizeForCurrentVoice(
        result.spokenResponse,
        result.state.voiceLang,
        result.state.voiceOutput
      );
      const localizedLogs = result.state.voiceLogs.map((entry, idx) =>
        idx === 0 ? { ...entry, response: localizedResponse } : entry
      );
      setState({
        ...result.state,
        lastSpokenResponse: localizedResponse,
        voiceLogs: localizedLogs,
      });
      if (result.state.pendingDisambiguation) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (result.spokenResponse) {
        speak(result.spokenResponse, result.state.voiceLang, result.state.voiceOutput);
      }
    },
    [localizeForCurrentVoice, speak, useSarvamVoice]
  );

  const handleUndoLastVoice = useCallback(() => {
    if (!undoSnapshot) return;
    const msg = localizeForCurrentVoice('Undid last voice action. Ready for next command.');
    setState({
      ...undoSnapshot,
      lastSpokenResponse: msg,
      lastVoiceStatus: 'idle',
    });
    setUndoSnapshot(null);
  }, [localizeForCurrentVoice, undoSnapshot]);

  const handleSelectTab = useCallback((tab: TabId) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const hasCloudStt = geminiSttConfigured || sarvamConfigured;

  const stopListening = useCallback((keepError = false) => {
    wantContinuousRef.current = false;
    if (restartTimerRef.current) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (directLoopTimerRef.current) {
      window.clearTimeout(directLoopTimerRef.current);
      directLoopTimerRef.current = null;
    }
    if (vadIntervalRef.current) {
      window.clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }
    if (browserPulseIntervalRef.current) {
      window.clearInterval(browserPulseIntervalRef.current);
      browserPulseIntervalRef.current = null;
    }
    if (levelMonitorRef.current) {
      levelMonitorRef.current.stop();
      levelMonitorRef.current = null;
    }
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      rec.onend = null;
      rec.onerror = null;
      rec.onresult = null;
      try {
        rec.abort?.();
        rec.stop();
      } catch {
        // ignore
      }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    mediaRecorderRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setIsListening(false);
    setIsTranscribing(false);
    setMicSourceDetected(false);
    setMicBars([]);
    setMicRms(0);
    setInterimTranscript('');
    if (!keepError) {
      setMicError(null);
    }
  }, []);

  const startDirectAiMicCapture = useCallback(
    async (switchNotice?: string) => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setMicError(
          'Microphone hardware API is unavailable in this browser. Type items above or use Quick Counter Tap.'
        );
        stopListening(true);
        return;
      }

      if (!hasCloudStt) {
        setMicError(
          'API key not set (GEMINI_API_KEY or SARVAM_API_KEY). Direct AI Mic requires an API key — using offline Browser Mic instead, or type commands above.'
        );
        stopListening(true);
        return;
      }

      // Cleanly close any lingering SpeechRecognition before opening getUserMedia so hardware never contends
      if (recognitionRef.current) {
        const prevRec = recognitionRef.current;
        recognitionRef.current = null;
        prevRec.onend = null;
        prevRec.onerror = null;
        try {
          prevRec.abort?.();
          prevRec.stop();
        } catch {
          // ignore
        }
      }
      if (browserPulseIntervalRef.current) {
        window.clearInterval(browserPulseIntervalRef.current);
        browserPulseIntervalRef.current = null;
      }

      setActiveMicMode('direct-ai');
      setMicError(switchNotice ?? null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: VOICE_AUDIO_CONSTRAINTS,
        });
        if (!wantContinuousRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        mediaStreamRef.current = stream;
        setIsListening(true);
        setMicSourceDetected(true);

        levelMonitorRef.current?.stop();
        levelMonitorRef.current = startMicLevelMonitor(stream, (bars, rms) => {
          setMicBars(bars);
          setMicRms(rms);
          if (!isSpeakingRef.current) {
            if (rms > peakRmsInSegmentRef.current) {
              peakRmsInSegmentRef.current = rms;
            }
            if (rms > 0.018) {
              speechDetectedInSegmentRef.current = true;
              lastSpeechAtRef.current = Date.now();
            }
          }
        });

        const mimeType = pickSupportedAudioMimeType();

        const recordSegment = () => {
          if (!wantContinuousRef.current || !mediaStreamRef.current) return;
          peakRmsInSegmentRef.current = 0;
          speechDetectedInSegmentRef.current = false;
          lastSpeechAtRef.current = 0;

          const chunks: BlobPart[] = [];
          let recorder: MediaRecorder;
          try {
            recorder = mimeType
              ? new MediaRecorder(mediaStreamRef.current, { mimeType })
              : new MediaRecorder(mediaStreamRef.current);
          } catch {
            recorder = new MediaRecorder(mediaStreamRef.current);
          }
          mediaRecorderRef.current = recorder;

          recorder.ondataavailable = (ev) => {
            if (ev.data.size > 0) chunks.push(ev.data);
          };

          const flushSegment = () => {
            if (directLoopTimerRef.current) {
              window.clearTimeout(directLoopTimerRef.current);
              directLoopTimerRef.current = null;
            }
            if (vadIntervalRef.current) {
              window.clearInterval(vadIntervalRef.current);
              vadIntervalRef.current = null;
            }
            if (recorder.state !== 'inactive') {
              try {
                recorder.stop();
              } catch {
                // ignore
              }
            }
          };

          recorder.onstop = async () => {
            if (directLoopTimerRef.current) {
              window.clearTimeout(directLoopTimerRef.current);
              directLoopTimerRef.current = null;
            }
            if (vadIntervalRef.current) {
              window.clearInterval(vadIntervalRef.current);
              vadIntervalRef.current = null;
            }

            const hadSpeech =
              (speechDetectedInSegmentRef.current || peakRmsInSegmentRef.current > 0.018) &&
              !isSpeakingRef.current;

            if (chunks.length > 0 && hadSpeech) {
              const blob = new Blob(chunks, {
                type: recorder.mimeType || mimeType || 'audio/webm',
              });
              setIsTranscribing(true);
              const outLang = stateRef.current.voiceOutput.outputLanguage;
              const hintLang = outLang === 'auto' ? stateRef.current.voiceLang : outLang;
              const result = await transcribeWithVoiceApi(blob, hintLang);
              setIsTranscribing(false);

              if (result?.fallback) {
                setMicError(
                  'API key not set on server (GEMINI_API_KEY / SARVAM_API_KEY). Falling back to offline Browser Mic — or type commands above.'
                );
                stopListening(true);
                return;
              }
              if (result?.transcript) {
                setMicError(null);
                handleVoiceTranscript(
                  result.transcript,
                  result.confidence,
                  result.languageCode
                );
              }
            }

            if (wantContinuousRef.current && mediaStreamRef.current) {
              recordSegment();
            }
          };

          recorder.start();

          // Voice Activity Detection: auto-submit ~1.15s after the shopkeeper pauses speaking
          vadIntervalRef.current = window.setInterval(() => {
            if (!wantContinuousRef.current || recorder.state !== 'recording') return;
            if (
              speechDetectedInSegmentRef.current &&
              lastSpeechAtRef.current > 0 &&
              Date.now() - lastSpeechAtRef.current >= 1150
            ) {
              flushSegment();
            }
          }, 140);

          // Hard cap per segment so continuous speech flushes cleanly every ~5.2s
          directLoopTimerRef.current = window.setTimeout(() => {
            flushSegment();
          }, 5200);
        };

        recordSegment();
      } catch (err) {
        const errName = err instanceof Error ? err.name : '';
        if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
          setMicError(
            'Microphone permission was blocked. Allow Microphone in your browser address bar and tap Mic again.'
          );
        } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
          setMicError(
            'No microphone device found. Connect a mic or Bluetooth neckband and tap Mic again.'
          );
        } else {
          setMicError(
            'Could not open microphone audio stream. Check OS mic permissions or type items above.'
          );
        }
        stopListening(true);
      }
    },
    [handleVoiceTranscript, hasCloudStt, stopListening]
  );

  const startBrowserContinuousRecognition = useCallback(() => {
    const SpeechRec = getBrowserSpeechRecognition();
    if (!SpeechRec) {
      if (hasCloudStt) {
        void startDirectAiMicCapture('Browser speech engine unavailable — using Direct AI Mic.');
        return;
      }
      setMicError(
        'Browser speech mic is not supported in this browser — type a command above or use Quick Counter Tap.'
      );
      stopListening(true);
      return;
    }

    // Ensure no getUserMedia stream is holding the microphone hardware when Web Speech starts
    if (levelMonitorRef.current) {
      levelMonitorRef.current.stop();
      levelMonitorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    try {
      const recognition = new SpeechRec();
      const chosenOut = stateRef.current.voiceOutput.outputLanguage;
      // Use te-IN / hi-IN if shopkeeper explicitly selected Telugu/Hindi, else en-IN for code-mixed Indian speech
      recognition.lang =
        chosenOut === 'te-IN' || chosenOut === 'hi-IN' ? chosenOut : 'en-IN';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      sawSpeechInBrowserSessionRef.current = false;
      setActiveMicMode('browser');

      const animateBrowserBars = (speaking: boolean) => {
        if (browserPulseIntervalRef.current) {
          window.clearInterval(browserPulseIntervalRef.current);
          browserPulseIntervalRef.current = null;
        }
        if (!speaking) {
          setMicRms(0.01);
          setMicBars([0.26, 0.34, 0.28, 0.38, 0.3, 0.34, 0.26, 0.3]);
          return;
        }
        setMicRms(0.14);
        browserPulseIntervalRef.current = window.setInterval(() => {
          setMicBars(
            Array.from({ length: 8 }, () => 0.35 + Math.random() * 0.62)
          );
        }, 120);
      };

      recognition.onstart = () => {
        setIsListening(true);
        setMicError(null);
        animateBrowserBars(false);
      };

      recognition.onaudiostart = () => {
        setMicSourceDetected(true);
      };

      recognition.onsoundstart = () => {
        setMicSourceDetected(true);
        sawSpeechInBrowserSessionRef.current = true;
        animateBrowserBars(true);
      };

      recognition.onspeechstart = () => {
        setMicSourceDetected(true);
        sawSpeechInBrowserSessionRef.current = true;
        animateBrowserBars(true);
      };

      recognition.onspeechend = () => {
        animateBrowserBars(false);
      };

      recognition.onresult = (event) => {
        // Echo Guard: ignore self-spoken TTS audio while ManaKirana is talking back
        if (isSpeakingRef.current) return;

        setMicSourceDetected(true);
        sawSpeechInBrowserSessionRef.current = true;
        consecutiveEmptyBrowserEndsRef.current = 0;

        let interim = '';
        const startIdx = typeof event.resultIndex === 'number' ? event.resultIndex : 0;
        for (let i = startIdx; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            const alternatives: Array<{ transcript: string; confidence: number }> = [];
            const altCount = Math.max(1, res.length || 1);
            for (let a = 0; a < altCount; a++) {
              const candidate = res[a];
              if (candidate?.transcript) {
                alternatives.push({
                  transcript: candidate.transcript.trim(),
                  confidence: candidate.confidence || 0.88,
                });
              }
            }
            const best = pickBestTranscriptAlternative(
              alternatives,
              stateRef.current.items,
              stateRef.current.udhaarAccounts,
              stateRef.current.pendingDisambiguation
            );
            setInterimTranscript('');
            animateBrowserBars(false);
            if (best.transcript) {
              handleVoiceTranscript(best.transcript, best.confidence);
            }
          } else {
            interim += res[0]?.transcript ?? '';
          }
        }
        if (interim) {
          animateBrowserBars(true);
          setInterimTranscript(interim.trim());
        }
      };

      recognition.onerror = (ev) => {
        const code = ev.error;
        if (code === 'not-allowed' || code === 'service-not-allowed') {
          setMicError(
            'Microphone permission was blocked. Allow Microphone in your browser address bar and tap Mic again.'
          );
          stopListening(true);
          return;
        }
        if (code === 'audio-capture') {
          if (hasCloudStt) {
            void startDirectAiMicCapture(
              'Browser speech could not lock onto mic — switched to Direct AI Mic.'
            );
          } else {
            setMicError(
              'No microphone audio source detected. Check your active mic input and tap Mic again.'
            );
            stopListening(true);
          }
          return;
        }
        if (code === 'network') {
          if (hasCloudStt) {
            void startDirectAiMicCapture(
              'Browser speech network blocked — switched to Direct AI Mic.'
            );
          } else {
            setMicError(
              'Browser speech recognition could not connect to speech servers. Type items above or use Quick Counter Tap.'
            );
            stopListening(true);
          }
          return;
        }
        if (code === 'no-speech') {
          consecutiveEmptyBrowserEndsRef.current += 1;
          if (consecutiveEmptyBrowserEndsRef.current >= 2 && hasCloudStt) {
            void startDirectAiMicCapture(
              'Browser mic received no speech — switched to Direct AI Mic with live sound meter.'
            );
          }
          return;
        }
        if (code === 'language-not-supported') {
          // Retry once with en-IN
          consecutiveEmptyBrowserEndsRef.current += 1;
        }
      };

      recognition.onend = () => {
        if (browserPulseIntervalRef.current) {
          window.clearInterval(browserPulseIntervalRef.current);
          browserPulseIntervalRef.current = null;
        }
        if (!wantContinuousRef.current) {
          setIsListening(false);
          setInterimTranscript('');
          return;
        }
        if (!sawSpeechInBrowserSessionRef.current) {
          consecutiveEmptyBrowserEndsRef.current += 1;
          if (consecutiveEmptyBrowserEndsRef.current >= 3 && hasCloudStt) {
            void startDirectAiMicCapture(
              'Switched to Direct AI Mic so your microphone audio is captured directly.'
            );
            return;
          }
        }
        restartTimerRef.current = window.setTimeout(() => {
          if (wantContinuousRef.current) {
            startBrowserContinuousRecognition();
          }
        }, 300);
      };

      recognitionRef.current = recognition;
      setIsListening(true);
      setInterimTranscript('');
      // Start synchronously inside user click gesture (zero prior await!)
      recognition.start();
    } catch {
      if (hasCloudStt) {
        void startDirectAiMicCapture('Switched to Direct AI Mic for live audio capture.');
      } else {
        setMicError(
          'Could not start voice recognition in this browser. Type items above or use Quick Counter Tap.'
        );
        stopListening(true);
      }
    }
  }, [handleVoiceTranscript, hasCloudStt, startDirectAiMicCapture, stopListening]);

  const handleToggleMic = useCallback(() => {
    if (isListening || wantContinuousRef.current) {
      stopListening();
      return;
    }

    // Immediate barge-in: stop any speaking playback & clear echo guard so fresh mic intake is never blocked
    stopActiveSpeechPlayback();
    if (echoGuardTimerRef.current) {
      window.clearTimeout(echoGuardTimerRef.current);
      echoGuardTimerRef.current = null;
    }
    isSpeakingRef.current = false;
    setIsSpeakingBack(false);

    setMicError(null);
    consecutiveEmptyBrowserEndsRef.current = 0;
    wantContinuousRef.current = true;

    // If user explicitly chose Direct AI Mic OR Cloud Sync with Sarvam is active -> use Direct Audio Capture + VAD
    const preferDirect =
      preferredMicMode === 'direct-ai' ||
      (useSarvamVoice && typeof navigator !== 'undefined' && navigator.onLine);

    if (preferDirect && hasCloudStt) {
      void startDirectAiMicCapture();
      return;
    }

    // Primary zero-contention path: synchronous Browser Web Speech API (with auto-fallback to Direct AI Mic on error/no-audio)
    startBrowserContinuousRecognition();
  }, [
    hasCloudStt,
    isListening,
    preferredMicMode,
    startBrowserContinuousRecognition,
    startDirectAiMicCapture,
    stopListening,
    useSarvamVoice,
  ]);

  const handleSwitchMicMode = useCallback(
    (mode: 'browser' | 'direct-ai') => {
      if (mode === 'direct-ai' && !hasCloudStt) {
        setMicError(
          'API key not set (GEMINI_API_KEY or SARVAM_API_KEY). Direct AI Mic requires an API key — staying on offline Browser Mic.'
        );
        setPreferredMicMode('browser');
        return;
      }
      setPreferredMicMode(mode);
      setMicError(null);
      if (isListening || wantContinuousRef.current) {
        stopListening();
        window.setTimeout(() => {
          wantContinuousRef.current = true;
          consecutiveEmptyBrowserEndsRef.current = 0;
          if (mode === 'direct-ai') {
            void startDirectAiMicCapture();
          } else {
            startBrowserContinuousRecognition();
          }
        }, 120);
      }
    },
    [
      hasCloudStt,
      isListening,
      startBrowserContinuousRecognition,
      startDirectAiMicCapture,
      stopListening,
    ]
  );

  // Counter Tab Handlers
  const handleQuickAddItem = (item: KiranaItem, qty: number, orderedByRupees?: number) => {
    const displayQty = orderedByRupees
      ? `${Math.round(qty * 1000)}g`
      : formatWeightDisplay(qty, item.unit);
    const line = createBillLine(item, {
      itemId: item.id,
      itemName: item.name,
      quantity: qty,
      unit: item.unit,
      displayQty,
      orderedByRupees,
    });
    const rawMsg = `Added ${displayQty} ${item.name} to bill.`;
    const localizedMsg = localizeForCurrentVoice(rawMsg);
    setState((prev) => ({
      ...prev,
      activeBill: addOrUpdateBillLine(prev.activeBill, line, false),
      lastSpokenResponse: localizedMsg,
    }));
  };

  const handleAdjustLineQty = (lineId: string, delta: number) => {
    setState((prev) => {
      const nextBill = prev.activeBill
        .map((line) => {
          if (line.id !== lineId) return line;
          const nextQty = Math.round((line.quantity + delta) * 1000) / 1000;
          if (nextQty <= 0) return null;
          const nextTotal = Math.round(nextQty * line.unitPrice);
          const nextTarugu = line.isLoose
            ? Math.round(nextQty * TARUGU_RATE * 10000) / 10000
            : 0;
          return {
            ...line,
            quantity: nextQty,
            displayQty: formatWeightDisplay(nextQty, line.unit),
            taruguQty: nextTarugu,
            lineTotal: nextTotal,
            orderedByRupees: undefined,
          };
        })
        .filter((l): l is NonNullable<typeof l> => l !== null);

      return { ...prev, activeBill: nextBill };
    });
  };

  const handleRemoveLine = (lineId: string) => {
    setState((prev) => ({
      ...prev,
      activeBill: prev.activeBill.filter((l) => l.id !== lineId),
    }));
  };

  const handleCheckout = (method: PaymentMethod, customerId?: string) => {
    const res = finalizeActiveBill(
      stateRef.current,
      method,
      customerId ?? stateRef.current.activeCustomerId
    );
    const localized = localizeForCurrentVoice(res.spokenResponse);
    setState({
      ...res.state,
      lastSpokenResponse: localized,
    });
    speak(res.spokenResponse);
  };

  const handleCreateCustomerAndCheckout = (name: string, phone: string) => {
    const newId = `cust-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
    const nextStateWithCustomer: AppState = {
      ...stateRef.current,
      udhaarAccounts: [
        ...stateRef.current.udhaarAccounts,
        {
          id: newId,
          name,
          phone,
          balance: 0,
          lastUpdated: 'Just now',
          transactions: [],
        },
      ],
    };
    const res = finalizeActiveBill(nextStateWithCustomer, 'udhaar', newId);
    const localized = localizeForCurrentVoice(res.spokenResponse);
    setState({
      ...res.state,
      lastSpokenResponse: localized,
    });
    speak(res.spokenResponse);
  };

  // Drum Stock Tab Handlers
  const handleAddCatalogItem = (payload: {
    name: string;
    localLabel: string;
    stockQty: number;
    drumCapacity: number;
    wholesalePrice: number;
    sellingPrice: number;
    unit: PricingUnit;
  }) => {
    const newItem: KiranaItem = {
      id: `item-${payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`,
      name: payload.name,
      localLabel: payload.localLabel,
      synonyms: [
        payload.name.toLowerCase(),
        ...payload.localLabel
          .toLowerCase()
          .split(/[·,]/)
          .map((s) => s.trim())
          .filter(Boolean),
      ],
      unit: payload.unit,
      stockQty: payload.stockQty,
      drumCapacity: payload.drumCapacity,
      wholesalePrice: payload.wholesalePrice,
      sellingPrice: payload.sellingPrice,
      isLoose: payload.unit !== 'packet',
      todaySoldQty: 0,
      todayRevenue: 0,
      todayWholesaleCost: 0,
      todayTaruguCost: 0,
    };
    const spoken = `Added ${payload.name}, ${payload.stockQty} ${payload.unit} at ${payload.sellingPrice} rupees per ${payload.unit}.`;
    setState((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
      lastSpokenResponse: localizeForCurrentVoice(spoken),
    }));
    speak(spoken);
  };

  const handleEditCatalogItem = (
    itemId: string,
    updates: {
      name: string;
      stockQty: number;
      drumCapacity: number;
      wholesalePrice: number;
      sellingPrice: number;
      unit: PricingUnit;
    }
  ) => {
    const spoken = `Updated ${updates.name} to ${updates.stockQty} ${updates.unit}.`;
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              name: updates.name,
              stockQty: updates.stockQty,
              drumCapacity: updates.drumCapacity,
              wholesalePrice: updates.wholesalePrice,
              sellingPrice: updates.sellingPrice,
              unit: updates.unit,
              isLoose: updates.unit !== 'packet',
            }
          : item
      ),
      lastSpokenResponse: localizeForCurrentVoice(spoken),
    }));
    speak(spoken);
  };

  const handleQuickRestock = (itemId: string) => {
    const target = stateRef.current.items.find((i) => i.id === itemId);
    if (!target) return;
    const spoken = `${target.name} drum refilled to ${target.drumCapacity} ${target.unit}.`;
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, stockQty: item.drumCapacity } : item
      ),
      lastSpokenResponse: localizeForCurrentVoice(spoken),
    }));
    speak(spoken);
  };

  // Refill List Handlers
  const handleAddMissingDemand = (name: string) => {
    const res = processVoiceTranscript(
      stateRef.current,
      `Customer asked for ${name}, add to supply list`
    );
    setState({
      ...res.state,
      lastSpokenResponse: localizeForCurrentVoice(res.spokenResponse),
    });
    speak(res.spokenResponse);
  };

  const handleRemoveMissingDemand = (id: string) => {
    setState((prev) => ({
      ...prev,
      missingDemand: prev.missingDemand.filter((m) => m.id !== id),
    }));
  };

  // Udhaar Handlers
  const handleLogRepayment = (customerId: string, amount: number, method: 'cash' | 'upi') => {
    const customer = stateRef.current.udhaarAccounts.find((a) => a.id === customerId);
    if (!customer) return;
    const res = processVoiceTranscript(
      stateRef.current,
      `${customer.name} paid ${amount} rupees ${method}`
    );
    setState({
      ...res.state,
      lastSpokenResponse: localizeForCurrentVoice(res.spokenResponse),
    });
    speak(res.spokenResponse);
  };

  const handleAddCustomer = (name: string, phone: string) => {
    setState((prev) => ({
      ...prev,
      udhaarAccounts: [
        ...prev.udhaarAccounts,
        {
          id: `cust-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`,
          name,
          phone,
          balance: 0,
          lastUpdated: 'Just now',
          transactions: [],
        },
      ],
    }));
  };

  // Profit Dash Handlers
  const handleAddSpend = (
    label: string,
    amount: number,
    category: DailySpend['category']
  ) => {
    const newSpend: DailySpend = {
      id: `spend-${Date.now()}`,
      label,
      category,
      amount,
      timestamp: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    };
    setState((prev) => ({
      ...prev,
      dailySpends: [newSpend, ...prev.dailySpends],
      lastSpokenResponse: localizeForCurrentVoice(
        `Logged ${amount.toLocaleString('en-IN')} rupees spend.`
      ),
    }));
  };

  const handleRemoveSpend = (spendId: string) => {
    setState((prev) => ({
      ...prev,
      dailySpends: prev.dailySpends.filter((s) => s.id !== spendId),
    }));
  };

  const handleSpeakProfitBriefing = () => {
    const res = processVoiceTranscript(stateRef.current, "What is today's profit?");
    setState({
      ...res.state,
      lastSpokenResponse: localizeForCurrentVoice(res.spokenResponse),
    });
    speak(res.spokenResponse);
  };

  const handleResolveDisambiguation = (choice: 'primary' | 'secondary' | 'cancel') => {
    const phrase =
      choice === 'cancel'
        ? 'cancel'
        : choice === 'primary'
        ? 'yes'
        : stateRef.current.pendingDisambiguation?.secondaryOption.itemName ?? 'no';
    handleVoiceTranscript(phrase, 0.99);
  };

  const handleOpenQuickTour = useCallback(() => {
    setTourStep(0);
    setTourOpen(true);
  }, []);

  const handleCloseSlides = useCallback(() => {
    setTourOpen(false);
    setSession((prev) =>
      prev.hasCompletedSlides ? prev : { ...prev, hasCompletedSlides: true }
    );
  }, []);

  const handleLogin = useCallback(
    (payload: {
      shopProfile: ShopProfile;
      outputLanguage: OutputVoiceLanguage;
      voiceGender: VoiceGender;
    }) => {
      const nextVoiceOutput: VoiceOutputSettings = {
        ...stateRef.current.voiceOutput,
        outputLanguage: payload.outputLanguage,
        voiceGender: payload.voiceGender,
      };
      const welcomeLocalized = localizeForCurrentVoice(
        'ManaKirana ready. Tap Continuous Mic, speak items, and say "Checkout" when done.',
        stateRef.current.voiceLang,
        nextVoiceOutput
      );
      setState((prev) => ({
        ...prev,
        shopProfile: payload.shopProfile,
        voiceOutput: nextVoiceOutput,
        lastSpokenResponse: welcomeLocalized,
      }));
      setActiveTab('counter');
      setTourStep(0);
      setSession({ isLoggedIn: true, hasCompletedSlides: false });
    },
    [localizeForCurrentVoice]
  );

  const handleLogout = useCallback(() => {
    stopListening();
    stopActiveSpeechPlayback();
    setTourOpen(false);
    setTourStep(0);
    clearSession();
    setSession({ isLoggedIn: false, hasCompletedSlides: false });
  }, [stopListening]);

  const handleUpdateVoiceOutput = (updates: Partial<VoiceOutputSettings>) => {
    setState((prev) => {
      const nextVoiceOutput: VoiceOutputSettings = {
        ...prev.voiceOutput,
        ...updates,
      };
      const nextReady = updates.outputLanguage
        ? localizeForCurrentVoice(
            'ManaKirana ready. Tap Continuous Mic, speak items, and say "Checkout" when done.',
            prev.voiceLang,
            nextVoiceOutput
          )
        : prev.lastSpokenResponse;
      return {
        ...prev,
        voiceOutput: nextVoiceOutput,
        lastSpokenResponse: nextReady,
      };
    });
  };

  const handleUpdateShopProfile = (updates: ShopProfile) => {
    setState((prev) => ({
      ...prev,
      shopProfile: updates,
    }));
  };

  const handlePreviewVoice = (override?: Partial<VoiceOutputSettings>) => {
    const nextVoice: VoiceOutputSettings = {
      ...stateRef.current.voiceOutput,
      ...(override ?? {}),
    };
    const langMeta =
      OUTPUT_VOICE_LANGUAGES.find((l) => l.code === nextVoice.outputLanguage) ||
      OUTPUT_VOICE_LANGUAGES[0];
    setState((prev) => ({
      ...prev,
      lastSpokenResponse: langMeta.sampleText,
    }));
    speak(langMeta.sampleText, stateRef.current.voiceLang, nextVoice);
  };

  // Gate new / logged-out shopkeepers with a strictly blank Login screen
  if (!session.isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const showOnboardingSlides = !session.hasCompletedSlides || tourOpen;
  const refillCount = getLowStockItems(state.items).length + state.missingDemand.length;

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] pb-24 md:pb-12">
      <TopBar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenQuickTour={handleOpenQuickTour}
        privacyMode={state.privacyMode}
        onTogglePrivacyMode={(mode: PrivacyMode) =>
          setState((prev) => ({ ...prev, privacyMode: mode }))
        }
        refillCount={refillCount}
        activeBillCount={state.activeBill.length}
        isListening={isListening}
      />

      <DynamicIsland
        isListening={isListening}
        isSpeakingBack={isSpeakingBack}
        isTranscribing={isTranscribing}
        micBars={micBars}
        micRms={micRms}
        micSourceDetected={micSourceDetected}
        micError={micError}
        activeMicMode={isListening ? activeMicMode : preferredMicMode}
        hasCloudStt={hasCloudStt}
        interimTranscript={interimTranscript}
        lastTranscript={state.lastTranscript}
        lastSpokenResponse={state.lastSpokenResponse}
        lastVoiceClarity={state.lastVoiceClarity}
        voiceStatus={isListening ? 'listening' : state.lastVoiceStatus}
        pendingDisambiguation={state.pendingDisambiguation}
        voiceLang={state.voiceLang}
        voiceOutput={state.voiceOutput}
        geminiTtsConfigured={geminiTtsConfigured}
        muted={muted}
        canUndoVoice={Boolean(undoSnapshot)}
        sarvamConfigured={sarvamConfigured}
        privacyMode={state.privacyMode}
        onToggleMic={handleToggleMic}
        onSwitchMicMode={handleSwitchMicMode}
        onSubmitVoiceText={handleVoiceTranscript}
        onResolveDisambiguation={handleResolveDisambiguation}
        onUndoLastVoice={handleUndoLastVoice}
        onToggleMute={() => setMuted((m) => !m)}
        onOpenVoiceSettings={() => handleSelectTab('profile')}
      />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-4">
        {activeTab === 'counter' && (
          <CounterTab
            state={state}
            onQuickAddItem={handleQuickAddItem}
            onAdjustLineQty={handleAdjustLineQty}
            onRemoveLine={handleRemoveLine}
            onClearBill={() =>
              setState((prev) => ({
                ...prev,
                activeBill: [],
                activeCustomerId: null,
                lastSpokenResponse: 'Bill cleared. Ready for next customer.',
              }))
            }
            onCheckout={handleCheckout}
            onCreateCustomerAndCheckout={handleCreateCustomerAndCheckout}
            onNavigateTab={handleSelectTab}
            onOpenQuickTour={handleOpenQuickTour}
          />
        )}

        {activeTab === 'stock' && (
          <DrumStockTab
            items={state.items}
            onAddItem={handleAddCatalogItem}
            onEditItem={handleEditCatalogItem}
            onQuickRestock={handleQuickRestock}
          />
        )}

        {activeTab === 'refill' && (
          <RefillListTab
            items={state.items}
            missingDemand={state.missingDemand}
            onRestockItem={handleQuickRestock}
            onAddMissingDemand={handleAddMissingDemand}
            onRemoveMissingDemand={handleRemoveMissingDemand}
          />
        )}

        {activeTab === 'udhaar' && (
          <UdhaarTab
            accounts={state.udhaarAccounts}
            onLogRepayment={handleLogRepayment}
            onAddCustomer={handleAddCustomer}
          />
        )}

        {activeTab === 'profit' && (
          <ProfitDashTab
            state={state}
            onAddSpend={handleAddSpend}
            onRemoveSpend={handleRemoveSpend}
            onSpeakBriefing={handleSpeakProfitBriefing}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileTab
            shopProfile={state.shopProfile}
            voiceOutput={state.voiceOutput}
            geminiTtsConfigured={geminiTtsConfigured}
            sarvamConfigured={sarvamConfigured}
            isSpeakingBack={isSpeakingBack}
            onUpdateVoiceOutput={handleUpdateVoiceOutput}
            onUpdateShopProfile={handleUpdateShopProfile}
            onPreviewVoice={handlePreviewVoice}
            onLogout={handleLogout}
          />
        )}
      </main>

      <QuickStartTour
        isOpen={showOnboardingSlides}
        isFirstTimePostLogin={!session.hasCompletedSlides}
        stepIndex={tourStep}
        shopProfile={state.shopProfile}
        items={state.items}
        outputLanguage={state.voiceOutput.outputLanguage}
        voiceGender={state.voiceOutput.voiceGender}
        onStepChange={setTourStep}
        onJumpToTab={handleSelectTab}
        onClose={handleCloseSlides}
      />
    </div>
  );
}
