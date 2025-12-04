'use client';

import { cn } from '@/lib/utils';
import { Mic, MicOff, Loader2, Volume2, AlertCircle } from 'lucide-react';
import type { VoiceState } from '@/hooks/useVoice';

interface VoiceButtonProps {
  state: VoiceState;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceButton({
  state,
  onToggle,
  disabled = false,
  className,
}: VoiceButtonProps) {
  const isActive = state === 'listening';
  const isProcessing = state === 'processing';
  const isSpeaking = state === 'speaking';
  const isError = state === 'error';

  const getIcon = () => {
    if (isProcessing) return <Loader2 className="w-10 h-10 animate-spin" />;
    if (isSpeaking) return <Volume2 className="w-10 h-10" />;
    if (isError) return <AlertCircle className="w-10 h-10" />;
    if (disabled) return <MicOff className="w-10 h-10" />;
    return <Mic className="w-10 h-10" />;
  };

  const getLabel = () => {
    if (isProcessing) return 'Processing...';
    if (isSpeaking) return 'Speaking...';
    if (isError) return 'Error';
    if (isActive) return 'Tap to stop';
    if (disabled) return 'Voice not available';
    return 'Tap to speak';
  };

  const getColor = () => {
    if (isError) return 'bg-destructive';
    if (isActive) return 'bg-green-500';
    if (isSpeaking) return 'bg-purple-500';
    return 'bg-primary';
  };

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      {/* Main button */}
      <button
        type="button"
        disabled={disabled || isProcessing || isSpeaking}
        onClick={onToggle}
        className={cn(
          'relative w-24 h-24 rounded-full flex items-center justify-center text-white transition-all duration-200 shadow-lg',
          getColor(),
          isActive && 'scale-110',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && !isProcessing && 'hover:scale-105 active:scale-95'
        )}
      >
        {/* Pulse ring when active */}
        {isActive && (
          <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-25" />
        )}
        
        {getIcon()}
      </button>

      {/* Status label */}
      <span
        className={cn(
          'text-sm font-medium',
          isError ? 'text-destructive' : 'text-muted-foreground'
        )}
      >
        {getLabel()}
      </span>
    </div>
  );
}
