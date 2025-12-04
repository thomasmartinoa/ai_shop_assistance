'use client';

import { cn } from '@/lib/utils';
import type { VoiceState } from '@/hooks/useVoice';

interface VoiceVisualizerProps {
  state: VoiceState;
  transcript?: string;
  className?: string;
}

export function VoiceVisualizer({
  state,
  transcript = '',
  className,
}: VoiceVisualizerProps) {
  const isActive = state === 'listening' || state === 'speaking';
  const barCount = 5;

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Waveform bars */}
      <div className="flex items-center justify-center gap-1 h-12">
        {Array.from({ length: barCount }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-1.5 bg-primary rounded-full transition-all duration-200',
              isActive ? 'h-full animate-voice-wave' : 'h-2'
            )}
            style={{
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>

      {/* Transcript display */}
      <div className="bg-muted rounded-lg p-3 max-w-md w-full min-h-[60px]">
        {transcript ? (
          <p className="text-sm text-center italic text-foreground">
            "{transcript}"
          </p>
        ) : (
          <p className="text-sm text-center text-muted-foreground">
            {state === 'listening' ? 'Listening... speak now' : 'Tap mic and speak'}
          </p>
        )}
      </div>

      {/* State indicator */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            state === 'idle' && 'bg-gray-400',
            state === 'listening' && 'bg-green-500 animate-pulse',
            state === 'processing' && 'bg-yellow-500 animate-pulse',
            state === 'speaking' && 'bg-purple-500 animate-pulse',
            state === 'error' && 'bg-red-500'
          )}
        />
        <span className="text-xs text-muted-foreground capitalize">
          {state === 'idle' ? 'Ready' : state}
        </span>
      </div>
    </div>
  );
}
