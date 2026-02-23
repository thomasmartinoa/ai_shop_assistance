'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useVoice } from '@/hooks/useVoice';
import { useSmartNLP } from '@/lib/nlp/useSmartNLP';
import { routeIntent } from '@/lib/nlp/intent-router';
import { useProducts } from '@/hooks/useProducts';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { VoiceMicButton } from '@/components/voice/VoiceMicButton';
import { ConversationLog, type ConversationMessage } from '@/components/voice/ConversationLog';
import { LiveCart, type CartItem } from '@/components/voice/LiveCart';

export default function VoiceHubPage() {
  const { shop, isDemoMode } = useAuth();
  const { state, transcript, interimTranscript, toggleListening, speak } = useVoice();
  const { processText, isProcessing } = useSmartNLP();
  const { findProduct, updateStock, loadProducts } = useProducts({ shopId: shop?.id });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [showCart, setShowCart] = useState(false);
  const lastProcessedRef = useRef('');
  const msgIdRef = useRef(0);

  const addMessage = useCallback((type: 'user' | 'assistant', text: string) => {
    msgIdRef.current += 1;
    setMessages((prev) => [
      ...prev,
      { id: String(msgIdRef.current), type, text, timestamp: new Date() },
    ]);
  }, []);

  // ─── Complete sale ──────────────────────────────────────────────────────────
  const completeSale = useCallback(async () => {
    if (cart.length === 0) return;
    const supabase = createClient();

    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const gstAmount = subtotal * 0.05;
    const total = subtotal + gstAmount;

    if (supabase && shop) {
      await supabase.from('transactions').insert({
        shop_id: shop.id,
        items: cart.map((item) => ({
          product_name: item.name,
          quantity: item.qty,
          unit_price: item.price,
          total: item.total,
        })),
        subtotal,
        gst_amount: gstAmount,
        total,
        payment_method: 'cash',
        payment_status: 'completed',
      });

      for (const item of cart) {
        const product = findProduct(item.name) || findProduct(item.nameMl);
        if (product?.id) {
          await updateStock(product.id, Math.max(0, (product.stock || 0) - item.qty));
        }
      }
      await loadProducts();
    }

    setCart([]);
    addMessage('assistant', `Sale completed — ${formatCurrency(total)}. Thank you!`);
    speak('ബിൽ പൂർത്തിയായി. നന്ദി!');
  }, [cart, shop, findProduct, updateStock, loadProducts, addMessage, speak]);

  // ─── Handle transcript ──────────────────────────────────────────────────────
  const handleTranscript = useCallback(
    async (text: string) => {
      addMessage('user', text);

      const nlpResult = await processText(text);
      const action = routeIntent(nlpResult);
      const voiceResponse = nlpResult.fulfillmentText || action.voiceResponse;

      switch (action.operation) {
        case 'add_to_cart': {
          const newItems: CartItem[] = [];
          const notFound: string[] = [];

          for (const p of nlpResult.products) {
            const found = findProduct(p.name) || findProduct(p.nameMl);
            if (found) {
              newItems.push({
                name: found.name_en,
                nameMl: found.name_ml,
                qty: p.qty,
                unit: p.unit || found.unit || 'piece',
                price: found.price,
                total: found.price * p.qty,
              });
            } else {
              notFound.push(p.name || p.nameMl);
            }
          }

          if (newItems.length > 0) {
            setCart((prev) => [...prev, ...newItems]);
          }
          if (notFound.length > 0) {
            addMessage('assistant', `Product not found: ${notFound.join(', ')}`);
          }
          if (newItems.length > 0) {
            addMessage('assistant', voiceResponse);
          }
          break;
        }

        case 'remove_from_cart': {
          const productName =
            (nlpResult.entities.product as string) ||
            (nlpResult.entities.productMl as string) ||
            nlpResult.products[0]?.name ||
            '';
          if (productName) {
            setCart((prev) => {
              const idx = prev.findIndex(
                (item) =>
                  item.name.toLowerCase().includes(productName.toLowerCase()) ||
                  item.nameMl.includes(productName)
              );
              if (idx >= 0) return prev.filter((_, i) => i !== idx);
              return prev;
            });
          }
          addMessage('assistant', voiceResponse);
          break;
        }

        case 'clear_cart':
          setCart([]);
          addMessage('assistant', voiceResponse);
          break;

        case 'show_total': {
          const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
          const total = subtotal + subtotal * 0.05;
          addMessage('assistant', `Total: ${formatCurrency(total)}`);
          break;
        }

        case 'check_stock': {
          const query =
            (nlpResult.entities.product as string) ||
            (nlpResult.entities.productMl as string) ||
            nlpResult.products[0]?.name ||
            '';
          const product = findProduct(query);
          if (product) {
            const msg = `${product.name_en}: ${product.stock} ${product.unit || 'units'} in stock`;
            addMessage('assistant', msg);
          } else {
            addMessage('assistant', `Product "${query}" not found in inventory`);
          }
          break;
        }

        case 'show_qr':
          addMessage('assistant', voiceResponse);
          break;

        case 'complete_payment':
          await completeSale();
          break;

        default:
          addMessage('assistant', voiceResponse);
          break;
      }

      if (action.operation !== 'complete_payment' && voiceResponse) {
        speak(voiceResponse);
      }
    },
    [processText, findProduct, cart, addMessage, speak, completeSale]
  );

  // ─── Watch transcript changes ───────────────────────────────────────────────
  useEffect(() => {
    if (transcript && transcript !== lastProcessedRef.current) {
      lastProcessedRef.current = transcript;
      handleTranscript(transcript);
    }
  }, [transcript, handleTranscript]);

  // Derive effective state (show processing when NLP is working)
  const effectiveState = isProcessing ? 'processing' : state;

  const cartTotal = cart.reduce((s, i) => s + i.total, 0);
  const cartTotalWithGst = cartTotal + cartTotal * 0.05;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-4rem)] p-4 lg:p-6">
      {/* ─── Left: Voice Panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Mic */}
        <div className="flex justify-center py-6 lg:py-10 shrink-0">
          <VoiceMicButton state={effectiveState} onToggle={toggleListening} />
        </div>

        {/* Interim transcript */}
        {interimTranscript && (
          <div className="text-center text-sm text-gray-400 italic pb-2 shrink-0">
            {interimTranscript}
          </div>
        )}

        {/* Conversation log */}
        <div className="flex-1 min-h-0 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col overflow-hidden">
          <ConversationLog messages={messages} />
        </div>
      </div>

      {/* ─── Right: Cart (desktop) ─────────────────────────────────────────── */}
      <div className="hidden lg:flex w-[400px] shrink-0">
        <LiveCart
          items={cart}
          onRemoveItem={(i) => setCart((prev) => prev.filter((_, idx) => idx !== i))}
          onClearCart={() => setCart([])}
          onCompleteSale={completeSale}
          onShowQR={() => {
            addMessage('assistant', 'Showing UPI QR code');
            speak('QR കോഡ് കാണിക്കുന്നു');
          }}
        />
      </div>

      {/* ─── Bottom: Cart (mobile) ──────────────────────────────────────────── */}
      <div className="lg:hidden shrink-0">
        <button
          onClick={() => setShowCart((v) => !v)}
          className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 mb-2"
        >
          <span className="font-semibold text-gray-900">
            Cart {cart.length > 0 && `(${cart.length})`}
          </span>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <span className="text-sm font-bold text-orange-600">
                {formatCurrency(cartTotalWithGst)}
              </span>
            )}
            {showCart ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </div>
        </button>
        {showCart && (
          <div className="max-h-[50vh]">
            <LiveCart
              items={cart}
              onRemoveItem={(i) => setCart((prev) => prev.filter((_, idx) => idx !== i))}
              onClearCart={() => setCart([])}
              onCompleteSale={completeSale}
              onShowQR={() => {
                addMessage('assistant', 'Showing UPI QR code');
                speak('QR കോഡ് കാണിക്കുന്നു');
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
