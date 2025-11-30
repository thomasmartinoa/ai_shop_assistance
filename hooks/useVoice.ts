'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { isSpeechRecognitionSupported, isSpeechSynthesisSupported } from '@/lib/utils';
import { VOICE_SETTINGS, ML_RESPONSES } from '@/lib/constants';

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
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  onstart: () => void;
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
  const isSupported = isSpeechRecognitionSupported();

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    const recognition = recognitionRef.current;
    recognition.continuous = continuous;
    recognition.interimResults = VOICE_SETTINGS.interimResults;
    recognition.lang = lang;
    recognition.maxAlternatives = VOICE_SETTINGS.maxAlternatives;

    recognition.onstart = () => {
      setState('listening');
      setInterimTranscript('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(finalTranscript);
        onResult?.(finalTranscript, true);
      }
      
      setInterimTranscript(interim);
      if (interim) {
        onResult?.(interim, false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setState('error');
      onError?.(event.error);
      
      // Auto-reset to idle after error
      setTimeout(() => setState('idle'), 2000);
    };

    recognition.onend = () => {
      if (state === 'listening') {
        setState('idle');
      }
    };

    return () => {
      recognition.abort();
    };
  }, [isSupported, lang, continuous, onResult, onError, state]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || state === 'listening') return;
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
    }
  }, [state]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
      setState('idle');
    } catch (error) {
      console.error('Failed to stop recognition:', error);
    }
  }, []);

  const speak = useCallback(async (text: string, textLang?: string): Promise<void> => {
    if (!isSpeechSynthesisSupported()) {
      console.warn('Speech synthesis not supported');
      return;
    }

    return new Promise((resolve) => {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = textLang || lang;
      utterance.rate = 0.9; // Slightly slower for clarity

      utterance.onstart = () => setState('speaking');
      utterance.onend = () => {
        setState('idle');
        resolve();
      };
      utterance.onerror = () => {
        setState('idle');
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }, [lang]);

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
    speak,
    cancelSpeech,
  };
}
