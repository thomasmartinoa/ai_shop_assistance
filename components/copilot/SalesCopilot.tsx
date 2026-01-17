'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Sparkles, X, ChevronDown, ChevronUp, Volume2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCopilot, QUICK_QUERIES } from '@/hooks/useCopilot';
import { useVoice } from '@/hooks/useVoice';
import type { Product } from '@/types/database';

interface SalesCopilotProps {
  products?: Product[];
  cart?: { name: string; quantity: number; price: number; total: number }[];
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function SalesCopilot({ products, cart, isExpanded = true, onToggleExpand }: SalesCopilotProps) {
  const [inputValue, setInputValue] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const voice = useVoice({
    onResult: (transcript, isFinal) => {
      if (isFinal && transcript.trim()) {
        setInputValue(transcript);
        // Auto-send voice queries
        setTimeout(() => handleSend(transcript), 500);
      }
    },
  });

  const copilot = useCopilot({
    products,
    cart,
    onSpeakResponse: (text) => {
      // Speak the response using Sarvam AI
      voice.speak(text);
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [copilot.messages]);

  const handleSend = async (query?: string) => {
    const text = query || inputValue;
    if (!text.trim() || copilot.isLoading) return;
    
    setInputValue('');
    await copilot.sendQuery(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoiceMode = () => {
    if (isVoiceMode) {
      voice.stopListening();
      setIsVoiceMode(false);
    } else {
      voice.startListening();
      setIsVoiceMode(true);
    }
  };

  const speakMessage = (text: string) => {
    // Extract first 2 sentences to keep voice response concise
    const sentences = text.split(/[.!?။]/);
    const shortText = sentences.slice(0, 2).join('. ') + '.';
    voice.speak(shortText);
  };

  return (
    <Card className="flex flex-col h-full">
      {/* Header */}
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">കടസഹായി</CardTitle>
            <p className="text-xs text-muted-foreground">AI Sales Copilot</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {copilot.messages.length > 0 && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={copilot.clearMessages}
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {onToggleExpand && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleExpand}>
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="flex flex-col flex-1 overflow-hidden p-3 pt-0">
          {/* Quick Query Buttons */}
          {copilot.messages.length === 0 && (
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-2">Quick Insights:</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_QUERIES.slice(0, 4).map((q) => (
                  <button
                    key={q.label}
                    onClick={() => copilot.sendQuery(q.query)}
                    disabled={copilot.isLoading}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-muted hover:bg-muted/80 text-foreground rounded-md transition-colors disabled:opacity-50 border"
                  >
                    <span>{q.icon}</span>
                    <span>{q.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-3 min-h-[200px] max-h-[400px]">
            {copilot.messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-sm">നമസ്കാരം! 🙏</p>
                <p className="text-xs mt-1">Business insights-ന് വേണ്ടി ചോദിക്കൂ</p>
              </div>
            ) : (
              copilot.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted border shadow-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    
                    {/* Sales data summary card */}
                    {msg.role === 'assistant' && msg.salesData && (
                      <div className="mt-2 pt-2 border-t">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {msg.salesData.today !== undefined && (
                            <div className="bg-green-50 dark:bg-green-950 p-1.5 rounded border border-green-200 dark:border-green-800">
                              <span className="text-green-600 dark:text-green-400">Today:</span>
                              <span className="font-semibold ml-1">₹{msg.salesData.today.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          {msg.salesData.yesterday !== undefined && (
                            <div className="bg-blue-50 dark:bg-blue-950 p-1.5 rounded border border-blue-200 dark:border-blue-800">
                              <span className="text-blue-600 dark:text-blue-400">Yesterday:</span>
                              <span className="font-semibold ml-1">₹{msg.salesData.yesterday.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Speak button for assistant messages */}
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => speakMessage(msg.content)}
                        className="mt-1 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Speak</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {/* Loading indicator */}
            {copilot.isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted border rounded-lg px-3 py-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="mt-3 flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isVoiceMode ? 'Listening...' : 'Ask about sales, stock...'}
                disabled={copilot.isLoading}
                className="pr-10"
              />
              {voice.state === 'listening' && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </span>
              )}
            </div>
            
            {/* Voice button */}
            <Button
              variant={isVoiceMode ? 'destructive' : 'outline'}
              size="icon"
              onClick={toggleVoiceMode}
              disabled={copilot.isLoading || !voice.isSupported}
              title={isVoiceMode ? 'Stop listening' : 'Voice input'}
            >
              {isVoiceMode ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            
            {/* Send button */}
            <Button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || copilot.isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Configuration warning */}
          {!copilot.isConfigured && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
              ⚠️ Add GEMINI_API_KEY to .env.local for AI responses
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
