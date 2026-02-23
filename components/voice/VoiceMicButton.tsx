'use client';

import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react';
import type { VoiceState } from '@/hooks/useVoice';

interface VoiceMicButtonProps {
  state: VoiceState;
  onToggle: () => void;
}

const stateConfig: Record<VoiceState, { icon: typeof Mic; label: string; classes: string }> = {
  idle: { icon: Mic, label: 'Tap to speak', classes: 'bg-gray-100 text-gray-400 hover:bg-gray-200' },
  listening: { icon: Mic, label: 'Listening...', classes: 'bg-orange-500 text-white' },
  processing: { icon: Loader2, label: 'Processing...', classes: 'bg-orange-400 text-white' },
  speaking: { icon: Volume2, label: 'Speaking...', classes: 'bg-green-500 text-white' },
  error: { icon: MicOff, label: 'Error — tap to retry', classes: 'bg-red-100 text-red-500' },
};

export function VoiceMicButton({ state, onToggle }: VoiceMicButtonProps) {
  const { icon: Icon, label, classes } = stateConfig[state];

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={onToggle}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-300 ${classes}`}
        aria-label={label}
      >
        {/* Pulse ring when listening */}
        {state === 'listening' && (
          <>
            <span className="absolute inset-0 rounded-full bg-orange-400 animate-ping opacity-30" />
            <span className="absolute inset-[-6px] rounded-full border-2 border-orange-300 animate-pulse opacity-50" />
          </>
        )}
        <Icon
          className={`w-8 h-8 relative z-10 ${state === 'processing' ? 'animate-spin' : ''}`}
        />
      </button>
      <span className="text-sm text-gray-500 font-medium">{label}</span>
    </div>
  );
}
