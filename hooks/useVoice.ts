'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { isSpeechRecognitionSupported, isSpeechSynthesisSupported } from '@/lib/utils';
import { VOICE_SETTINGS } from '@/lib/constants';

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
      isListeningRef.current = false;
      
      // Only show error for actual errors, not "no-speech" or "aborted"
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setState('error');
        onErrorRef.current?.(event.error);
        setTimeout(() => setState('idle'), 2000);
      } else {
        setState('idle');
      }
    };

    recognition.onend = () => {
      console.log('🎤 Recognition ended');
      isListeningRef.current = false;
      
      // If we were still supposed to be listening (continuous mode), restart
      if (stateRef.current === 'listening' && continuous) {
        console.log('🎤 Restarting for continuous mode...');
        try {
          recognition.start();
        } catch (e) {
          console.log('🎤 Could not restart:', e);
          setState('idle');
        }
      } else {
        setState('idle');
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

  const speak = useCallback(async (text: string, textLang?: string): Promise<void> => {
    if (!isSpeechSynthesisSupported()) {
      console.warn('🔊 Speech synthesis not supported');
      return;
    }

    return new Promise((resolve) => {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = textLang || lang;
      utterance.rate = 0.9;

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
    toggleListening,
    speak,
    cancelSpeech,
  };
}
