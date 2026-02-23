'use client';

import { useEffect, useRef } from 'react';
import { Mic } from 'lucide-react';

export interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface ConversationLogProps {
  messages: ConversationMessage[];
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function ConversationLog({ messages }: ConversationLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3 py-12">
        <Mic className="w-10 h-10" />
        <p className="text-sm">Say something to get started</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-3 px-2 py-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}
        >
          <div
            className={
              msg.type === 'user'
                ? 'bg-orange-50 rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[80%]'
                : 'bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[80%]'
            }
          >
            <p className="text-sm text-gray-800">{msg.text}</p>
          </div>
          <span className="text-xs text-gray-400 mt-1 px-1">{formatTime(msg.timestamp)}</span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
