'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Product } from '@/types/database';

interface CartItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface ProductContext {
  name_en: string;
  name_ml: string;
  stock: number;
  min_stock: number;
  price: number;
  category?: string;
  unit: string;
}

interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  salesData?: SalesData;
}

interface SalesData {
  today?: number;
  yesterday?: number;
  thisWeek?: number;
  lastWeek?: number;
  topProducts?: { name: string; quantity: number; revenue: number }[];
}

interface UseCopilotOptions {
  products?: Product[];
  cart?: CartItem[];
  onSpeakResponse?: (text: string) => void;
}

interface UseCopilotReturn {
  messages: CopilotMessage[];
  isLoading: boolean;
  error: string | null;
  isConfigured: boolean;
  sendQuery: (query: string) => Promise<string | null>;
  clearMessages: () => void;
  latestSalesData: SalesData | null;
}

// Quick insight queries for the UI
export const QUICK_QUERIES = [
  { label: 'ഇന്നത്തെ വിൽപ്പന', query: 'ഇന്നത്തെ വിൽപ്പന എങ്ങനെ?', icon: '📊' },
  { label: 'Stock അലർട്ട്', query: 'ഏതൊക്കെ items stock കുറവാണ്?', icon: '📦' },
  { label: 'Top Products', query: 'ഏറ്റവും കൂടുതൽ വിറ്റ products ഏതൊക്കെ?', icon: '🏆' },
  { label: 'Business Tips', query: 'ഇന്ന് business improve ചെയ്യാൻ എന്ത് ചെയ്യാം?', icon: '💡' },
  { label: 'Weekend Prep', query: 'Weekend-ന് വേണ്ടി എന്തൊക്കെ prepare ചെയ്യണം?', icon: '📅' },
  { label: 'Profit Analysis', query: 'ഈ ആഴ്ചത്തെ profit margin എത്ര?', icon: '💰' },
];

export function useCopilot(options: UseCopilotOptions = {}): UseCopilotReturn {
  const { products, cart, onSpeakResponse } = options;
  
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);
  const [latestSalesData, setLatestSalesData] = useState<SalesData | null>(null);
  
  const messageIdRef = useRef(0);

  // Check if Gemini is configured on mount
  useEffect(() => {
    async function checkConfig() {
      try {
        const response = await fetch('/api/copilot');
        const data = await response.json();
        setIsConfigured(data.configured !== false);
      } catch {
        setIsConfigured(false);
      }
    }
    checkConfig();
  }, []);

  // Convert products to context format
  const getProductContext = useCallback((): ProductContext[] => {
    if (!products) return [];
    return products.map(p => ({
      name_en: p.name_en,
      name_ml: p.name_ml,
      stock: p.stock,
      min_stock: p.min_stock,
      price: p.price,
      category: p.category || undefined,
      unit: p.unit,
    }));
  }, [products]);

  // Send query to copilot
  const sendQuery = useCallback(async (query: string): Promise<string | null> => {
    if (!query.trim()) return null;

    const userMessageId = `msg-${++messageIdRef.current}`;
    const userMessage: CopilotMessage = {
      id: userMessageId,
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          context: {
            inventory: getProductContext(),
            cart: cart || [],
          },
          language: 'mixed',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: CopilotMessage = {
        id: `msg-${++messageIdRef.current}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        salesData: data.salesData,
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Store latest sales data
      if (data.salesData) {
        setLatestSalesData(data.salesData);
      }

      // Speak the response if callback provided
      if (onSpeakResponse) {
        // Extract first sentence for voice (to keep it short)
        const firstSentence = data.response.split(/[.!?။]/)[0] + '.';
        onSpeakResponse(firstSentence);
      }

      return data.response;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      // Add error message to chat
      const errorMsg: CopilotMessage = {
        id: `msg-${++messageIdRef.current}`,
        role: 'assistant',
        content: `❌ Error: ${errorMessage}. ക്ഷമിക്കണം, വീണ്ടും ശ്രമിക്കുക.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getProductContext, cart, onSpeakResponse]);

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    isConfigured,
    sendQuery,
    clearMessages,
    latestSalesData,
  };
}
