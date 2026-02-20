'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { isSpeechRecognitionSupported, isSpeechSynthesisSupported } from '@/lib/utils';
import { VOICE_SETTINGS } from '@/lib/constants';
import { callEdgeFunction, isEdgeFunctionsAvailable } from '@/lib/supabase/edge-functions';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onaudiostart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

interface UseVoiceOptions {
  lang?: string;
  continuous?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

interface UseVoiceReturn {
  state: VoiceState;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  speak: (text: string, lang?: string) => Promise<void>;
  cancelSpeech: () => void;
}

export function useVoice(options: UseVoiceOptions = {}): UseVoiceReturn {
  const {
    lang = VOICE_SETTINGS.lang,
    continuous = VOICE_SETTINGS.continuous,
    onResult,
    onError,
  } = options;

  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const stateRef = useRef<VoiceState>('idle');
  const isListeningRef = useRef(false);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  const isSupported = isSpeechRecognitionSupported();

  // Keep refs updated
  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
  }, [onResult, onError]);

  // Keep state ref in sync
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Initialize speech synthesis voices on mount
  useEffect(() => {
    if (isSpeechSynthesisSupported()) {
      // Trigger voice loading
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        // Voices not loaded yet, they'll load on first speak
        window.speechSynthesis.onvoiceschanged = () => {
          const loadedVoices = window.speechSynthesis.getVoices();
          console.log('🔊 Voices loaded:', loadedVoices.length);
          // Log available Indian voices
          const indianVoices = loadedVoices.filter(v =>
            v.lang.startsWith('ml') || v.lang.startsWith('hi') || v.lang === 'en-IN'
          );
          console.log('🔊 Indian voices:', indianVoices.map(v => `${v.name} (${v.lang})`));
        };
      } else {
        console.log('🔊 Voices already loaded:', voices.length);
      }
    }
  }, []);

  // Initialize speech recognition ONCE
  useEffect(() => {
    if (!isSupported) {
      console.log('🎤 Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Configure
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      console.log('🎤 Recognition started');
      isListeningRef.current = true;
      setState('listening');
      setInterimTranscript('');
    };

    recognition.onaudiostart = () => {
      console.log('🎤 Audio capture started');
    };

    recognition.onspeechstart = () => {
      console.log('🎤 Speech detected!');
    };

    recognition.onspeechend = () => {
      console.log('🎤 Speech ended');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log('🎤 Got result!', event.results.length, 'results');

      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        console.log(`🎤 Result ${i}: "${text}" (final: ${result.isFinal}, confidence: ${result[0].confidence})`);

        if (result.isFinal) {
          finalTranscript += text;
        } else {
          interim += text;
        }
      }

      if (interim) {
        setInterimTranscript(interim);
        onResultRef.current?.(interim, false);
      }

      if (finalTranscript) {
        console.log('🎤 Final transcript:', finalTranscript);
        setTranscript(finalTranscript);
        setInterimTranscript('');
        onResultRef.current?.(finalTranscript, true);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('🎤 Error:', event.error);

      // For no-speech, just restart if we're supposed to be listening
      if (event.error === 'no-speech') {
        console.log('🎤 No speech detected, restarting...');
        if (stateRef.current === 'listening') {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              console.log('🎤 Could not restart after no-speech');
            }
          }, 100);
        }
        return;
      }

      // For aborted, just ignore
      if (event.error === 'aborted') {
        return;
      }

      // For real errors, show error state
      isListeningRef.current = false;
      setState('error');
      onErrorRef.current?.(event.error);
      setTimeout(() => setState('idle'), 2000);
    };

    recognition.onend = () => {
      console.log('🎤 Recognition ended, state:', stateRef.current);

      // Always restart if we're supposed to be listening
      if (stateRef.current === 'listening') {
        console.log('🎤 Restarting to keep listening...');
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            console.log('🎤 Could not restart:', e);
            isListeningRef.current = false;
            setState('idle');
          }
        }, 100);
      } else {
        isListeningRef.current = false;
      }
    };

    recognitionRef.current = recognition;
    console.log('🎤 Speech recognition initialized with lang:', lang);

    return () => {
      console.log('🎤 Cleaning up recognition');
      recognition.abort();
    };
  }, [isSupported, lang, continuous]);

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      console.log('🎤 No recognition object');
      return;
    }

    if (isListeningRef.current) {
      console.log('🎤 Already listening');
      return;
    }

    try {
      console.log('🎤 Starting recognition...');
      setTranscript('');
      setInterimTranscript('');
      recognition.start();
    } catch (error) {
      console.error('🎤 Failed to start:', error);
      // If already started, stop first then start
      try {
        recognition.stop();
        setTimeout(() => {
          recognition.start();
        }, 100);
      } catch (e) {
        console.error('🎤 Really failed:', e);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    console.log('🎤 Stopping recognition...');
    isListeningRef.current = false;

    try {
      recognition.stop();
    } catch (error) {
      console.error('🎤 Failed to stop:', error);
    }

    setState('idle');
  }, []);

  const toggleListening = useCallback(() => {
    console.log('🎤 Toggle called, current state:', stateRef.current);
    if (stateRef.current === 'listening') {
      stopListening();
    } else if (stateRef.current === 'idle') {
      startListening();
    }
  }, [startListening, stopListening]);

  // Fallback browser TTS (no dependencies - base fallback)
  const speakWithBrowserTTS = useCallback(async (text: string, textLang?: string): Promise<void> => {
    if (!isSpeechSynthesisSupported()) {
      console.warn('🔊 Speech synthesis not supported');
      return;
    }

    console.log('🔊 Speaking with browser TTS:', text);

    return new Promise((resolve) => {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const targetLang = textLang || lang;

      // Try to find best available voice
      let selectedVoice = voices.find(v => v.lang.startsWith('ml')) ||
        voices.find(v => v.lang.startsWith('hi')) ||
        voices.find(v => v.lang === 'en-IN') ||
        voices.find(v => v.lang.startsWith('en'));

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('🔊 Using browser voice:', selectedVoice.name, selectedVoice.lang);
      }

      utterance.lang = targetLang;
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => setState('speaking');
      utterance.onend = () => { setState('idle'); resolve(); };
      utterance.onerror = () => { setState('idle'); resolve(); };

      window.speechSynthesis.speak(utterance);
    });
  }, [lang]);

  // Fallback: Use Supabase Edge Function for Google TTS
  const speakWithGoogleTTS = useCallback(async (text: string, ttsLang: string = 'ml'): Promise<void> => {
    console.log('🔊 Speaking with Google TTS (fallback):', text, 'lang:', ttsLang);

    return new Promise(async (resolve) => {
      try {
        setState('speaking');

        if (!isEdgeFunctionsAvailable()) {
          console.log('🔊 Edge functions not available, using browser TTS...');
          await speakWithBrowserTTS(text, ttsLang);
          resolve();
          return;
        }

        const { data, error } = await callEdgeFunction('google-tts', { text, lang: ttsLang });

        if (error || !data?.audioUrl) {
          console.error('🔊 Google TTS Edge Function error:', error);
          console.log('🔊 Falling back to browser TTS...');
          await speakWithBrowserTTS(text, ttsLang);
          resolve();
          return;
        }

        // Play the audio from data URL
        const audio = new Audio(data.audioUrl);
        audio.volume = 1.0;

        audio.oncanplaythrough = () => {
          console.log('🔊 Audio ready, playing Malayalam...');
          audio.play().catch(err => {
            console.error('🔊 Play error:', err);
            setState('idle');
            resolve();
          });
        };

        audio.onplay = () => {
          console.log('🔊 Google TTS speech started');
        };

        audio.onended = () => {
          console.log('🔊 Google TTS speech ended');
          setState('idle');
          resolve();
        };

        audio.onerror = (e) => {
          console.error('🔊 Audio playback error:', e);
          console.log('🔊 Falling back to browser TTS...');
          speakWithBrowserTTS(text, ttsLang).then(resolve);
        };

      } catch (error) {
        console.error('🔊 Google TTS error:', error);
        await speakWithBrowserTTS(text, ttsLang);
        resolve();
      }
    });
  }, [speakWithBrowserTTS]);

  // Use Sarvam AI TTS for Malayalam (best quality natural voice)
  const speakWithSarvamTTS = useCallback(async (text: string, ttsLang: string = 'ml'): Promise<void> => {
    console.log('🔊 Speaking with Sarvam AI TTS:', text, 'lang:', ttsLang);

    return new Promise(async (resolve) => {
      try {
        setState('speaking');

        if (!isEdgeFunctionsAvailable()) {
          console.log('🔊 Edge functions not available, using Google TTS...');
          await speakWithGoogleTTS(text, ttsLang);
          resolve();
          return;
        }

        const { data, error } = await callEdgeFunction('sarvam-tts', { text, lang: ttsLang });

        if (error || !data?.audioUrl) {
          console.error('🔊 Sarvam TTS Edge Function error:', error);

          // Check if we should fallback
          if (data?.fallback || error) {
            console.log('🔊 Falling back to Google TTS...');
            await speakWithGoogleTTS(text, ttsLang);
            resolve();
            return;
          }
        }

        if (!data?.audioUrl) {
          console.error('🔊 No audio URL in Sarvam response');
          await speakWithGoogleTTS(text, ttsLang);
          resolve();
          return;
        }

        console.log('🔊 Playing Sarvam AI Malayalam audio...');

        // Play the audio from data URL
        const audio = new Audio(data.audioUrl);
        audio.volume = 1.0;

        audio.oncanplaythrough = () => {
          console.log('🔊 Sarvam audio ready, playing...');
          audio.play().catch(err => {
            console.error('🔊 Sarvam play error:', err);
            setState('idle');
            resolve();
          });
        };

        audio.onplay = () => {
          console.log('🔊 Sarvam Malayalam speech started');
        };

        audio.onended = () => {
          console.log('🔊 Sarvam Malayalam speech ended');
          setState('idle');
          resolve();
        };

        audio.onerror = (e) => {
          console.error('🔊 Sarvam audio playback error:', e);
          console.log('🔊 Falling back to Google TTS...');
          speakWithGoogleTTS(text, ttsLang).then(resolve);
        };

      } catch (error) {
        console.error('🔊 Sarvam TTS error:', error);
        await speakWithGoogleTTS(text, ttsLang);
        resolve();
      }
    });
  }, [speakWithGoogleTTS]);

  // Main speak function - uses Sarvam AI for Malayalam (best quality), Google TTS as fallback, browser for other languages
  const speak = useCallback(async (text: string, textLang?: string): Promise<void> => {
    const targetLang = textLang || lang;

    // Use Sarvam AI TTS for Malayalam (natural voice with Bulbul v2 model)
    if (targetLang.startsWith('ml') || targetLang === 'ml-IN') {
      return speakWithSarvamTTS(text, 'ml');
    }

    // Use browser TTS for other languages
    return speakWithBrowserTTS(text, targetLang);
  }, [lang, speakWithSarvamTTS, speakWithBrowserTTS]);

  const cancelSpeech = useCallback(() => {
    if (isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
      setState('idle');
    }
  }, []);

  return {
    state,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    speak,
    cancelSpeech,
  };
}
