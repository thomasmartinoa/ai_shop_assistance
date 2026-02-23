'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import QRCode from 'qrcode';
import { useVoice } from '@/hooks/useVoice';
import { useSmartNLP } from '@/lib/nlp/useSmartNLP';
import { routeIntent } from '@/lib/nlp/intent-router';
import { useSharedProducts } from '@/contexts/ProductsContext';
import { useAuth } from '@/contexts/AuthContext';
import { createClient, getSupabaseClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { VoiceMicButton } from '@/components/voice/VoiceMicButton';
import { ConversationLog, type ConversationMessage } from '@/components/voice/ConversationLog';
import { LiveCart, type CartItem } from '@/components/voice/LiveCart';
import { BILLING, PAYMENT, STOCK, INVENTORY, REPORTS } from '@/lib/voice/responses-ml';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Fetch sales stats for a period directly from Supabase */
async function fetchSalesStats(shopId: string, period: 'today' | 'week') {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const now = new Date();
  let from: Date;
  if (period === 'today') {
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else {
    from = new Date(now);
    from.setDate(from.getDate() - 7);
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('total, items')
    .eq('shop_id', shopId)
    .eq('payment_status', 'completed')
    .gte('created_at', from.toISOString());

  if (error || !data) return null;

  const sales = data.reduce((sum: number, r: { total: number }) => sum + Number(r.total), 0);
  const orders = data.length;
  return { sales: Math.round(sales), orders };
}

/** Generate UPI payment QR data URL */
async function generateUPIQR(upiId: string, amount: number, shopName: string): Promise<string | null> {
  if (!upiId) return null;
  const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(shopName)}&am=${amount.toFixed(2)}&cu=INR`;
  try {
    return await QRCode.toDataURL(upiString, { width: 256, margin: 2 });
  } catch {
    return null;
  }
}

export default function VoiceHubPage() {
  const { shop, isDemoMode } = useAuth();
  const { state, transcript, interimTranscript, toggleListening, speak } = useVoice();
  const { processText, isProcessing } = useSmartNLP();
  const { findProduct, updateStock, updateProduct, loadProducts, getLowStockProducts } = useSharedProducts();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [awaitingPayment, setAwaitingPayment] = useState(false);
  const lastProcessedRef = useRef('');
  const msgIdRef = useRef(0);

  const addMessage = useCallback((type: 'user' | 'assistant', text: string) => {
    msgIdRef.current += 1;
    setMessages((prev) => [
      ...prev,
      { id: String(msgIdRef.current), type, text, timestamp: new Date() },
    ]);
  }, []);

  const getCartTotal = useCallback(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    return subtotal + subtotal * 0.05;
  }, [cart]);

  // ─── Complete sale ──────────────────────────────────────────────────────────
  const completeSale = useCallback(async (paymentMethod: 'cash' | 'upi' = 'cash') => {
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
        payment_method: paymentMethod,
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

    const totalRounded = Math.round(total);
    const response = paymentMethod === 'upi'
      ? PAYMENT.upi_received(totalRounded)
      : PAYMENT.cash_received(totalRounded);

    setCart([]);
    setAwaitingPayment(false);
    setQrDataUrl(null);
    addMessage('assistant', response);
    speak(response);
  }, [cart, shop, findProduct, updateStock, loadProducts, addMessage, speak]);

  // ─── Show QR code ──────────────────────────────────────────────────────────
  const showQRCode = useCallback(async () => {
    const total = getCartTotal();
    if (total <= 0 || !shop?.upi_id) {
      const noUpi = shop?.upi_id ? BILLING.empty_bill : 'UPI ID സെറ്റ് ചെയ്തിട്ടില്ല. സെറ്റിംഗ്സിൽ ചേർക്കൂ.';
      addMessage('assistant', noUpi);
      speak(noUpi);
      return;
    }
    const qr = await generateUPIQR(shop.upi_id, total, shop.name || 'Shop');
    if (qr) {
      setQrDataUrl(qr);
      const response = PAYMENT.showing_qr(Math.round(total));
      addMessage('assistant', response);
      speak(response);
    }
  }, [getCartTotal, shop, addMessage, speak]);

  // ─── Handle transcript ──────────────────────────────────────────────────────
  const handleTranscript = useCallback(
    async (text: string) => {
      addMessage('user', text);

      const nlpResult = await processText(text);
      const action = routeIntent(nlpResult);
      const cxResponse = nlpResult.fulfillmentText;

      switch (action.operation) {
        // ─── Billing ─────────────────────────────────────────────────────
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
            const notFoundMsg = notFound.map(n => BILLING.product_not_found(n)).join('. ');
            addMessage('assistant', notFoundMsg);
          }
          if (newItems.length > 0) {
            // Use CX response, or build from template + ask "anything else?"
            const response = cxResponse || BILLING.items_added(newItems.map(i => i.nameMl));
            const withPrompt = `${response}. ${BILLING.ask_more}`;
            addMessage('assistant', withPrompt);
            speak(withPrompt);
          }
          return; // Already spoke
        }

        case 'remove_from_cart': {
          const productName =
            (nlpResult.entities.product as string) ||
            (nlpResult.entities.productMl as string) ||
            nlpResult.products[0]?.name ||
            '';
          let removed = false;
          if (productName) {
            setCart((prev) => {
              const idx = prev.findIndex(
                (item) =>
                  item.name.toLowerCase().includes(productName.toLowerCase()) ||
                  item.nameMl.includes(productName)
              );
              if (idx >= 0) {
                removed = true;
                return prev.filter((_, i) => i !== idx);
              }
              return prev;
            });
          }
          const response = cxResponse || (removed ? BILLING.item_removed(productName) : action.voiceResponse);
          addMessage('assistant', response);
          speak(response);
          return;
        }

        case 'clear_cart': {
          setCart([]);
          setAwaitingPayment(false);
          setQrDataUrl(null);
          const response = cxResponse || BILLING.bill_cleared;
          addMessage('assistant', response);
          speak(response);
          return;
        }

        case 'show_total': {
          const total = Math.round(getCartTotal());
          if (cart.length === 0) {
            const response = BILLING.empty_bill;
            addMessage('assistant', response);
            speak(response);
          } else {
            const response = BILLING.total_with_count(cart.length, total);
            addMessage('assistant', response);
            speak(response);
          }
          return;
        }

        // ─── Payment ────────────────────────────────────────────────────
        case 'complete_payment': {
          if (cart.length === 0) {
            const response = BILLING.empty_bill;
            addMessage('assistant', response);
            speak(response);
            return;
          }
          const total = Math.round(getCartTotal());
          setAwaitingPayment(true);
          const response = BILLING.payment_prompt(total);
          addMessage('assistant', response);
          speak(response);
          return;
        }

        case 'show_qr': {
          await showQRCode();
          return;
        }

        // ─── Stock Check ─────────────────────────────────────────────────
        case 'check_stock': {
          const query =
            (nlpResult.entities.product as string) ||
            (nlpResult.entities.productMl as string) ||
            nlpResult.products[0]?.name ||
            '';
          const product = findProduct(query);
          if (product) {
            const response = STOCK.stock_level(
              product.name_ml || product.name_en,
              Number(product.stock) || 0,
              product.unit || 'piece',
              product.min_stock || 5
            );
            addMessage('assistant', response);
            speak(response);
          } else {
            const response = STOCK.not_found(query);
            addMessage('assistant', response);
            speak(response);
          }
          return;
        }

        case 'find_location': {
          const query =
            (nlpResult.entities.product as string) ||
            nlpResult.products[0]?.name || '';
          const product = findProduct(query);
          if (product?.shelf_location) {
            const response = STOCK.location(product.name_ml || product.name_en, product.shelf_location);
            addMessage('assistant', response);
            speak(response);
          } else {
            const response = product
              ? `${product.name_ml || product.name_en} ലൊക്കേഷൻ സെറ്റ് ചെയ്തിട്ടില്ല`
              : STOCK.not_found(query);
            addMessage('assistant', response);
            speak(response);
          }
          return;
        }

        // ─── Inventory Management ───────────────────────────────────────
        case 'add_stock': {
          const p = nlpResult.products[0];
          const query = p?.name || p?.nameMl || (nlpResult.entities.product as string) || '';
          const qty = p?.qty || Number(nlpResult.entities.quantity) || 0;
          const product = findProduct(query);

          if (!product) {
            const response = STOCK.not_found(query);
            addMessage('assistant', response);
            speak(response);
            return;
          }
          if (qty <= 0) {
            const response = INVENTORY.ask_quantity(product.name_ml || product.name_en);
            addMessage('assistant', response);
            speak(response);
            return;
          }

          const newStock = (Number(product.stock) || 0) + qty;
          await updateStock(product.id, newStock);
          const response = INVENTORY.stock_added(
            qty,
            product.unit || 'piece',
            product.name_ml || product.name_en,
            newStock
          );
          addMessage('assistant', response);
          speak(response);
          return;
        }

        case 'update_price': {
          const p = nlpResult.products[0];
          const query = p?.name || (nlpResult.entities.product as string) || '';
          const newPrice = Number(nlpResult.entities.price) || Number(nlpResult.entities.amount) || p?.qty || 0;
          const product = findProduct(query);

          if (!product) {
            const response = STOCK.not_found(query);
            addMessage('assistant', response);
            speak(response);
            return;
          }
          if (newPrice <= 0) {
            const response = `${product.name_ml || product.name_en} പുതിയ വില എത്ര?`;
            addMessage('assistant', response);
            speak(response);
            return;
          }

          await updateProduct(product.id, { price: newPrice });
          const response = INVENTORY.price_updated(product.name_ml || product.name_en, newPrice);
          addMessage('assistant', response);
          speak(response);
          return;
        }

        case 'check_low_stock': {
          const lowStock = getLowStockProducts();
          if (lowStock.length === 0) {
            const response = 'എല്ലാ ഉൽപ്പന്നങ്ങളും സ്റ്റോക്കിൽ ഉണ്ട്. കുറഞ്ഞ സ്റ്റോക്ക് ഇല്ല.';
            addMessage('assistant', response);
            speak(response);
          } else {
            const names = lowStock.slice(0, 5).map(p => p.name_ml || p.name_en).join(', ');
            const response = `${STOCK.multiple_low(lowStock.length)} — ${names}`;
            addMessage('assistant', response);
            speak(response);
          }
          return;
        }

        // ─── Reports ────────────────────────────────────────────────────
        case 'report_today': {
          if (!shop?.id) {
            addMessage('assistant', REPORTS.no_data);
            speak(REPORTS.no_data);
            return;
          }
          const stats = await fetchSalesStats(shop.id, 'today');
          const response = stats && stats.orders > 0
            ? REPORTS.today(stats.orders, stats.sales)
            : REPORTS.no_data;
          addMessage('assistant', response);
          speak(response);
          return;
        }

        case 'report_week': {
          if (!shop?.id) {
            addMessage('assistant', REPORTS.no_data);
            speak(REPORTS.no_data);
            return;
          }
          const stats = await fetchSalesStats(shop.id, 'week');
          const response = stats && stats.orders > 0
            ? REPORTS.week(stats.sales)
            : 'ഈ ആഴ്ച ഒരു ഇടപാടും ഇല്ല';
          addMessage('assistant', response);
          speak(response);
          return;
        }

        case 'report_profit': {
          if (!shop?.id) {
            addMessage('assistant', REPORTS.no_data);
            speak(REPORTS.no_data);
            return;
          }
          const stats = await fetchSalesStats(shop.id, 'today');
          // Approximate profit as 15% of sales (exact would need cost_price tracking)
          const profit = stats ? Math.round(stats.sales * 0.15) : 0;
          const response = profit > 0
            ? REPORTS.profit_today(profit)
            : REPORTS.no_data;
          addMessage('assistant', response);
          speak(response);
          return;
        }

        // ─── Confirm / Cancel (context-aware) ────────────────────────────
        case 'confirm': {
          if (awaitingPayment) {
            // Default to cash when confirming during payment
            await completeSale('cash');
          } else {
            const response = cxResponse || action.voiceResponse;
            addMessage('assistant', response);
            speak(response);
          }
          return;
        }

        case 'cancel': {
          if (awaitingPayment) {
            setAwaitingPayment(false);
            setQrDataUrl(null);
            const response = 'ശരി, പേയ്‌മെന്റ് ക്യാൻസൽ ചെയ്തു';
            addMessage('assistant', response);
            speak(response);
          } else {
            const response = cxResponse || action.voiceResponse;
            addMessage('assistant', response);
            speak(response);
          }
          return;
        }

        // ─── Help / Greeting / Fallback ──────────────────────────────────
        default: {
          const response = cxResponse || action.voiceResponse;
          addMessage('assistant', response);
          speak(response);
          return;
        }
      }
    },
    [processText, findProduct, updateStock, updateProduct, getLowStockProducts, cart, getCartTotal, shop, awaitingPayment, addMessage, speak, completeSale, showQRCode]
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

        {/* QR Code overlay */}
        {qrDataUrl && (
          <div className="shrink-0 flex flex-col items-center bg-white rounded-2xl border border-orange-200 p-4 mt-3 gap-2">
            <img src={qrDataUrl} alt="UPI QR Code" className="w-48 h-48 rounded-lg" />
            <p className="text-sm text-gray-600 font-medium">
              {formatCurrency(getCartTotal())} — Scan to pay
            </p>
            <button
              onClick={async () => { await completeSale('upi'); }}
              className="text-sm bg-orange-500 text-white px-4 py-1.5 rounded-lg hover:bg-orange-600"
            >
              Payment Received
            </button>
          </div>
        )}
      </div>

      {/* ─── Right: Cart (desktop) ─────────────────────────────────────────── */}
      <div className="hidden lg:flex w-[400px] shrink-0">
        <LiveCart
          items={cart}
          onRemoveItem={(i) => setCart((prev) => prev.filter((_, idx) => idx !== i))}
          onClearCart={() => { setCart([]); setAwaitingPayment(false); setQrDataUrl(null); }}
          onCompleteSale={() => completeSale('cash')}
          onShowQR={showQRCode}
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
              onClearCart={() => { setCart([]); setAwaitingPayment(false); setQrDataUrl(null); }}
              onCompleteSale={() => completeSale('cash')}
              onShowQR={showQRCode}
            />
          </div>
        )}
      </div>
    </div>
  );
}
