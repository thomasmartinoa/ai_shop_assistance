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
import { PaymentSuccessOverlay } from '@/components/billing/PaymentSuccessOverlay';
import { BILLING, PAYMENT, STOCK, INVENTORY, REPORTS, SYSTEM, toMalayalamUnit } from '@/lib/voice/responses-ml';

// ─── Types ──────────────────────────────────────────────────────────────────

type BillingPhase =
  | 'idle'              // No billing in progress
  | 'collecting'        // Items added, timer running before "anything else?"
  | 'waiting_for_more'  // Asked "anything else?", waiting for response
  | 'confirming_items'  // Listed all items, waiting for OK
  | 'asking_payment'    // Asked cash/UPI
  | 'awaiting_cash'     // Told total for cash, waiting for "paid"
  | 'showing_qr';       // Showing QR, waiting for "paid"

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert requested unit to product's base unit for correct price calculation */
function normalizeQuantity(qty: number, requestedUnit: string, baseUnit: string) {
  const ru = requestedUnit.toLowerCase();
  const bu = baseUnit.toLowerCase();

  // g → kg: 250g rice (priced per kg) → display 250g, calc 0.25 kg
  if (ru === 'g' && bu === 'kg') {
    return { displayQty: qty, displayUnit: 'g', calcQty: qty / 1000 };
  }
  // ml → litre: 500ml oil (priced per litre) → display 500ml, calc 0.5 litre
  if (ru === 'ml' && bu === 'litre') {
    return { displayQty: qty, displayUnit: 'ml', calcQty: qty / 1000 };
  }
  // kg → g (unlikely but handle): 2kg sugar (priced per g)
  if (ru === 'kg' && bu === 'g') {
    return { displayQty: qty, displayUnit: 'kg', calcQty: qty * 1000 };
  }
  // litre → ml
  if (ru === 'litre' && bu === 'ml') {
    return { displayQty: qty, displayUnit: 'litre', calcQty: qty * 1000 };
  }
  // Same unit or no conversion needed
  return { displayQty: qty, displayUnit: ru, calcQty: qty };
}

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

async function generateUPIQR(upiId: string, amount: number, shopName: string): Promise<string | null> {
  if (!upiId) return null;
  const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(shopName)}&am=${amount.toFixed(2)}&cu=INR`;
  try {
    return await QRCode.toDataURL(upiString, { width: 256, margin: 2 });
  } catch {
    return null;
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function VoiceHubPage() {
  const { shop } = useAuth();
  const { state, transcript, interimTranscript, toggleListening, speak } = useVoice();
  const { processText, isProcessing } = useSmartNLP();
  const { findProduct, updateStock, updateProduct, loadProducts, getLowStockProducts } = useSharedProducts();

  // ─── State ────────────────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [billingPhase, setBillingPhase] = useState<BillingPhase>('idle');
  const [paymentSuccess, setPaymentSuccess] = useState<{ amount: number; method: 'cash' | 'upi' } | null>(null);

  // ─── Refs (for timer callbacks to access latest values) ───────────────────
  const lastProcessedRef = useRef('');
  const msgIdRef = useRef(0);
  const phaseRef = useRef<BillingPhase>('idle');
  const cartRef = useRef<CartItem[]>([]);
  const askTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reminderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speakRef = useRef(speak);
  const addMsgFnRef = useRef<(type: 'user' | 'assistant', text: string) => void>(() => {});

  // Keep refs in sync with state
  useEffect(() => { cartRef.current = cart; }, [cart]);
  useEffect(() => { speakRef.current = speak; }, [speak]);

  const setPhase = useCallback((p: BillingPhase) => {
    phaseRef.current = p;
    setBillingPhase(p);
  }, []);

  const clearAllTimers = useCallback(() => {
    if (askTimerRef.current) { clearTimeout(askTimerRef.current); askTimerRef.current = null; }
    if (reminderTimerRef.current) { clearTimeout(reminderTimerRef.current); reminderTimerRef.current = null; }
  }, []);

  // Cleanup on unmount
  useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  const addMessage = useCallback((type: 'user' | 'assistant', text: string) => {
    msgIdRef.current += 1;
    setMessages((prev) => [
      ...prev,
      { id: String(msgIdRef.current), type, text, timestamp: new Date() },
    ]);
  }, []);

  useEffect(() => { addMsgFnRef.current = addMessage; }, [addMessage]);

  // ─── Timer helpers ────────────────────────────────────────────────────────

  /** After items added, wait `delay` ms then ask "anything else?" */
  const startAskMoreTimer = useCallback((delay = 5000) => {
    if (askTimerRef.current) clearTimeout(askTimerRef.current);
    askTimerRef.current = setTimeout(() => {
      if (phaseRef.current === 'collecting') {
        phaseRef.current = 'waiting_for_more';
        setBillingPhase('waiting_for_more');
        addMsgFnRef.current('assistant', BILLING.ask_more);
        speakRef.current(BILLING.ask_more);
      }
    }, delay);
  }, []);

  /** Remind "have you paid?" after 15s if still awaiting cash */
  const startPaymentReminder = useCallback(() => {
    if (reminderTimerRef.current) clearTimeout(reminderTimerRef.current);
    reminderTimerRef.current = setTimeout(() => {
      if (phaseRef.current === 'awaiting_cash') {
        const msg = 'പൈസ കിട്ടിയോ?';
        addMsgFnRef.current('assistant', msg);
        speakRef.current(msg);
      }
    }, 15000);
  }, []);

  // ─── Cart helpers ─────────────────────────────────────────────────────────

  const getCartTotalFromRef = useCallback(() => {
    const subtotal = cartRef.current.reduce((s, i) => s + i.total, 0);
    return subtotal + subtotal * 0.05;
  }, []);

  const getCartTotal = useCallback(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    return subtotal + subtotal * 0.05;
  }, [cart]);

  /** Build item list summary for confirmation step */
  const buildItemSummary = useCallback(() => {
    const items = cartRef.current;
    if (items.length === 0) return BILLING.empty_bill;
    const lines = items.map(i => `${i.qty} ${toMalayalamUnit(i.unit)} ${i.nameMl}`).join(', ');
    const total = Math.round(getCartTotalFromRef());
    return `${lines}. ആകെ ${total} രൂപ. ഇത് ശരിയാണോ?`;
  }, [getCartTotalFromRef]);

  // ─── Complete sale ──────────────────────────────────────────────────────────

  const completeSale = useCallback(async (paymentMethod: 'cash' | 'upi' = 'cash') => {
    const currentCart = cartRef.current;
    if (currentCart.length === 0) return;
    const supabase = createClient();

    const subtotal = currentCart.reduce((sum, item) => sum + item.total, 0);
    const gstAmount = subtotal * 0.05;
    const total = subtotal + gstAmount;

    if (supabase && shop) {
      await supabase.from('transactions').insert({
        shop_id: shop.id,
        items: currentCart.map((item) => ({
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

      for (const item of currentCart) {
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

    setPaymentSuccess({ amount: totalRounded, method: paymentMethod });
    setCart([]);
    setPhase('idle');
    clearAllTimers();
    setQrDataUrl(null);
    addMessage('assistant', response);
    speak(response);
  }, [shop, findProduct, updateStock, loadProducts, setPhase, clearAllTimers, addMessage, speak]);

  // ─── Shared action helpers ────────────────────────────────────────────────

  /** Add items to cart and transition to collecting phase */
  const addItemsToCart = useCallback((nlpResult: ReturnType<typeof routeIntent> extends infer _ ? Parameters<typeof processText> extends infer __ ? any : any : any, cxResponse: string) => {
    const newItems: CartItem[] = [];
    const notFound: string[] = [];

    for (const p of nlpResult.products) {
      const found = findProduct(p.name) || findProduct(p.nameMl);
      if (found) {
        const requestedUnit = p.unit || found.unit || 'piece';
        const baseUnit = found.unit || 'piece';
        // Convert qty to base unit for price calculation
        const { displayQty, displayUnit, calcQty } = normalizeQuantity(p.qty, requestedUnit, baseUnit);
        newItems.push({
          name: found.name_en,
          nameMl: found.name_ml,
          qty: displayQty,
          unit: displayUnit,
          price: found.price,
          total: found.price * calcQty,
        });
      } else {
        notFound.push(p.name || p.nameMl);
      }
    }

    if (newItems.length > 0) {
      setCart((prev) => [...prev, ...newItems]);
    }
    if (notFound.length > 0) {
      addMessage('assistant', notFound.map(n => BILLING.product_not_found(n)).join('. '));
    }
    if (newItems.length > 0) {
      const response = cxResponse || BILLING.items_added(newItems.map(i => i.nameMl));
      addMessage('assistant', response);
      speak(response);
      setPhase('collecting');
      startAskMoreTimer(5000);
    }
    return newItems.length;
  }, [findProduct, addMessage, speak, setPhase, startAskMoreTimer]);

  /** Remove item from cart by product name */
  const removeFromCart = useCallback((nlpResult: any, cxResponse: string) => {
    const productName = (nlpResult.entities?.product as string) || nlpResult.products?.[0]?.name || '';
    if (productName) {
      setCart((prev) => {
        const idx = prev.findIndex(item =>
          item.name.toLowerCase().includes(productName.toLowerCase()) ||
          item.nameMl.includes(productName)
        );
        return idx >= 0 ? prev.filter((_, i) => i !== idx) : prev;
      });
    }
    const r = cxResponse || BILLING.item_removed(productName);
    addMessage('assistant', r);
    speak(r);
  }, [addMessage, speak]);

  /** Transition to confirming_items: list all items and ask confirmation */
  const goToConfirmItems = useCallback(() => {
    if (cartRef.current.length === 0) {
      addMessage('assistant', BILLING.empty_bill);
      speak(BILLING.empty_bill);
      setPhase('idle');
      return;
    }
    setPhase('confirming_items');
    const summary = buildItemSummary();
    addMessage('assistant', summary);
    speak(summary);
  }, [addMessage, speak, setPhase, buildItemSummary]);

  /** Show QR code for UPI payment */
  const showQRForPayment = useCallback(async () => {
    const total = getCartTotalFromRef();
    if (!shop?.upi_id || total <= 0) {
      const r = shop?.upi_id ? BILLING.empty_bill : 'UPI ID സെറ്റ് ചെയ്തിട്ടില്ല. സെറ്റിംഗ്സിൽ ചേർക്കൂ.';
      addMessage('assistant', r);
      speak(r);
      return;
    }
    const qr = await generateUPIQR(shop.upi_id, total, shop.name || 'Shop');
    if (qr) {
      setQrDataUrl(qr);
      const r = PAYMENT.showing_qr(Math.round(total));
      addMessage('assistant', r);
      speak(r);
    }
  }, [getCartTotalFromRef, shop, addMessage, speak]);

  // ─── Handle transcript (BILLING STATE MACHINE) ────────────────────────────

  const handleTranscript = useCallback(
    async (text: string) => {
      addMessage('user', text);
      clearAllTimers();

      const nlpResult = await processText(text);
      const action = routeIntent(nlpResult);
      const cxResponse = nlpResult.fulfillmentText || '';
      const op = action.operation;
      const phase = phaseRef.current;

      // ─── Non-billing operations (always work regardless of billing state) ──
      const nonBillingOps = ['check_stock', 'find_location', 'add_stock', 'update_price',
        'check_low_stock', 'report_today', 'report_week', 'report_profit', 'help'];

      if (nonBillingOps.includes(op)) {
        // Handle stock/inventory/reports, then resume billing timer if needed
        await handleNonBillingOp(op, nlpResult, cxResponse, action.voiceResponse);
        if (phase === 'collecting') startAskMoreTimer(5000);
        return;
      }

      // ─── add_to_cart works in ANY billing phase ─────────────────────────
      if (op === 'add_to_cart') {
        addItemsToCart(nlpResult, cxResponse);
        return;
      }

      // ─── Billing state machine transitions ─────────────────────────────
      switch (phase) {
        case 'idle': {
          if (op === 'complete_payment' || op === 'show_total') {
            if (cartRef.current.length === 0) {
              addMessage('assistant', BILLING.empty_bill);
              speak(BILLING.empty_bill);
            } else {
              const total = Math.round(getCartTotalFromRef());
              const r = BILLING.total_with_count(cartRef.current.length, total);
              addMessage('assistant', r);
              speak(r);
            }
          } else if (op === 'remove_from_cart') {
            removeFromCart(nlpResult, cxResponse);
          } else if (op === 'clear_cart') {
            setCart([]);
            setQrDataUrl(null);
            const r = cxResponse || BILLING.bill_cleared;
            addMessage('assistant', r);
            speak(r);
          } else {
            const r = cxResponse || action.voiceResponse;
            addMessage('assistant', r);
            speak(r);
          }
          break;
        }

        case 'collecting': {
          // Items just added, timer running → handle "bill it", "yes", remove
          if (op === 'complete_payment' || op === 'cancel') {
            goToConfirmItems();
          } else if (op === 'confirm') {
            // "yes" while collecting → extend wait
            startAskMoreTimer(10000);
          } else if (op === 'remove_from_cart') {
            removeFromCart(nlpResult, cxResponse);
            startAskMoreTimer(5000);
          } else if (op === 'show_total') {
            const total = Math.round(getCartTotalFromRef());
            const r = BILLING.total_with_count(cartRef.current.length, total);
            addMessage('assistant', r);
            speak(r);
            startAskMoreTimer(5000);
          } else if (op === 'clear_cart') {
            setCart([]);
            setPhase('idle');
            setQrDataUrl(null);
            const r = cxResponse || BILLING.bill_cleared;
            addMessage('assistant', r);
            speak(r);
          } else {
            const r = cxResponse || action.voiceResponse;
            addMessage('assistant', r);
            speak(r);
            startAskMoreTimer(5000);
          }
          break;
        }

        case 'waiting_for_more': {
          // Asked "anything else?", waiting for response
          if (op === 'confirm') {
            // "yes, I have more" → wait 10 more seconds
            setPhase('collecting');
            const r = 'ശരി, കാത്തിരിക്കുന്നു';
            addMessage('assistant', r);
            speak(r);
            startAskMoreTimer(10000);
          } else if (op === 'complete_payment' || op === 'cancel') {
            // "that's it" / "nothing else" / "bill it" → list items
            goToConfirmItems();
          } else if (op === 'remove_from_cart') {
            removeFromCart(nlpResult, cxResponse);
            startAskMoreTimer(5000);
          } else if (op === 'clear_cart') {
            setCart([]);
            setPhase('idle');
            setQrDataUrl(null);
            const r = cxResponse || BILLING.bill_cleared;
            addMessage('assistant', r);
            speak(r);
          } else {
            const r = cxResponse || action.voiceResponse;
            addMessage('assistant', r);
            speak(r);
          }
          break;
        }

        case 'confirming_items': {
          // Listed all items, waiting for OK
          if (op === 'confirm') {
            // "yes, items are correct" → ask payment method
            setPhase('asking_payment');
            addMessage('assistant', BILLING.ask_payment);
            speak(BILLING.ask_payment);
          } else if (op === 'cancel') {
            // "no, let me change" → back to collecting
            setPhase('collecting');
            const r = 'ശരി, കൂടി ചേർക്കൂ';
            addMessage('assistant', r);
            speak(r);
            startAskMoreTimer(10000);
          } else if (op === 'remove_from_cart') {
            removeFromCart(nlpResult, cxResponse);
            // Stay in confirming_items, re-show summary
            setTimeout(() => {
              const summary = buildItemSummary();
              addMessage('assistant', summary);
              speak(summary);
            }, 500);
          } else {
            const r = cxResponse || action.voiceResponse;
            addMessage('assistant', r);
            speak(r);
          }
          break;
        }

        case 'asking_payment': {
          // Asked "cash or UPI?"
          if (op === 'complete_payment') {
            // User said "cash" (payment.cash → complete_payment)
            setPhase('awaiting_cash');
            const total = Math.round(getCartTotalFromRef());
            const r = `ആകെ ${total} രൂപ. പൈസ കിട്ടിയോ?`;
            addMessage('assistant', r);
            speak(r);
            startPaymentReminder();
          } else if (op === 'show_qr') {
            // User said "UPI" / "GPay"
            setPhase('showing_qr');
            await showQRForPayment();
          } else if (op === 'cancel') {
            setPhase('confirming_items');
            const summary = buildItemSummary();
            addMessage('assistant', summary);
            speak(summary);
          } else if (op === 'confirm') {
            // "ok" without specifying method → ask again
            addMessage('assistant', BILLING.ask_payment);
            speak(BILLING.ask_payment);
          } else {
            const r = cxResponse || action.voiceResponse;
            addMessage('assistant', r);
            speak(r);
          }
          break;
        }

        case 'awaiting_cash': {
          // Waiting for "I've paid"
          if (op === 'confirm') {
            await completeSale('cash');
          } else if (op === 'cancel') {
            setPhase('asking_payment');
            addMessage('assistant', BILLING.ask_payment);
            speak(BILLING.ask_payment);
          } else {
            const r = cxResponse || action.voiceResponse;
            addMessage('assistant', r);
            speak(r);
            startPaymentReminder();
          }
          break;
        }

        case 'showing_qr': {
          // Showing QR, waiting for "paid"
          if (op === 'confirm') {
            await completeSale('upi');
          } else if (op === 'cancel') {
            setPhase('asking_payment');
            setQrDataUrl(null);
            addMessage('assistant', BILLING.ask_payment);
            speak(BILLING.ask_payment);
          } else {
            const r = cxResponse || action.voiceResponse;
            addMessage('assistant', r);
            speak(r);
          }
          break;
        }
      }
    },
    [processText, findProduct, updateStock, updateProduct, getLowStockProducts, shop,
     addMessage, speak, clearAllTimers, setPhase, startAskMoreTimer, startPaymentReminder,
     completeSale, addItemsToCart, removeFromCart, goToConfirmItems, showQRForPayment,
     getCartTotalFromRef, buildItemSummary]
  );

  /** Handle non-billing voice operations (stock, reports, inventory, help) */
  const handleNonBillingOp = useCallback(
    async (op: string, nlpResult: any, cxResponse: string, fallbackResponse: string) => {
      switch (op) {
        case 'check_stock': {
          const query = (nlpResult.entities.product as string) || nlpResult.products[0]?.name || '';
          const product = findProduct(query);
          const r = product
            ? STOCK.stock_level(product.name_ml || product.name_en, Number(product.stock) || 0, product.unit || 'piece', product.min_stock || 5)
            : STOCK.not_found(query);
          addMessage('assistant', r);
          speak(r);
          return;
        }
        case 'find_location': {
          const query = (nlpResult.entities.product as string) || nlpResult.products[0]?.name || '';
          const product = findProduct(query);
          const r = product?.shelf_location
            ? STOCK.location(product.name_ml || product.name_en, product.shelf_location)
            : product ? `${product.name_ml || product.name_en} ലൊക്കേഷൻ സെറ്റ് ചെയ്തിട്ടില്ല` : STOCK.not_found(query);
          addMessage('assistant', r);
          speak(r);
          return;
        }
        case 'add_stock': {
          const p = nlpResult.products[0];
          const query = p?.name || p?.nameMl || (nlpResult.entities.product as string) || '';
          const qty = p?.qty || Number(nlpResult.entities.quantity) || 0;
          const product = findProduct(query);
          if (!product) { const r = STOCK.not_found(query); addMessage('assistant', r); speak(r); return; }
          if (qty <= 0) { const r = INVENTORY.ask_quantity(product.name_ml || product.name_en); addMessage('assistant', r); speak(r); return; }
          const newStock = (Number(product.stock) || 0) + qty;
          await updateStock(product.id, newStock);
          const r = INVENTORY.stock_added(qty, product.unit || 'piece', product.name_ml || product.name_en, newStock);
          addMessage('assistant', r);
          speak(r);
          return;
        }
        case 'update_price': {
          const p = nlpResult.products[0];
          const query = p?.name || (nlpResult.entities.product as string) || '';
          const newPrice = Number(nlpResult.entities.price) || Number(nlpResult.entities.amount) || p?.qty || 0;
          const product = findProduct(query);
          if (!product) { const r = STOCK.not_found(query); addMessage('assistant', r); speak(r); return; }
          if (newPrice <= 0) { const r = `${product.name_ml || product.name_en} പുതിയ വില എത്ര?`; addMessage('assistant', r); speak(r); return; }
          await updateProduct(product.id, { price: newPrice });
          const r = INVENTORY.price_updated(product.name_ml || product.name_en, newPrice);
          addMessage('assistant', r);
          speak(r);
          return;
        }
        case 'check_low_stock': {
          const lowStock = getLowStockProducts();
          const r = lowStock.length === 0
            ? 'എല്ലാ ഉൽപ്പന്നങ്ങളും സ്റ്റോക്കിൽ ഉണ്ട്. കുറഞ്ഞ സ്റ്റോക്ക് ഇല്ല.'
            : `${STOCK.multiple_low(lowStock.length)} — ${lowStock.slice(0, 5).map(p => p.name_ml || p.name_en).join(', ')}`;
          addMessage('assistant', r);
          speak(r);
          return;
        }
        case 'report_today': {
          if (!shop?.id) { addMessage('assistant', REPORTS.no_data); speak(REPORTS.no_data); return; }
          const stats = await fetchSalesStats(shop.id, 'today');
          const r = stats && stats.orders > 0 ? REPORTS.today(stats.orders, stats.sales) : REPORTS.no_data;
          addMessage('assistant', r);
          speak(r);
          return;
        }
        case 'report_week': {
          if (!shop?.id) { addMessage('assistant', REPORTS.no_data); speak(REPORTS.no_data); return; }
          const stats = await fetchSalesStats(shop.id, 'week');
          const r = stats && stats.orders > 0 ? REPORTS.week(stats.sales) : 'ഈ ആഴ്ച ഒരു ഇടപാടും ഇല്ല';
          addMessage('assistant', r);
          speak(r);
          return;
        }
        case 'report_profit': {
          if (!shop?.id) { addMessage('assistant', REPORTS.no_data); speak(REPORTS.no_data); return; }
          const stats = await fetchSalesStats(shop.id, 'today');
          const profit = stats ? Math.round(stats.sales * 0.15) : 0;
          const r = profit > 0 ? REPORTS.profit_today(profit) : REPORTS.no_data;
          addMessage('assistant', r);
          speak(r);
          return;
        }
        case 'help': {
          const r = cxResponse || SYSTEM.help;
          addMessage('assistant', r);
          speak(r);
          return;
        }
        default: {
          const r = cxResponse || fallbackResponse;
          addMessage('assistant', r);
          speak(r);
        }
      }
    },
    [findProduct, updateStock, updateProduct, getLowStockProducts, shop, addMessage, speak]
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

  const resetBilling = useCallback(() => {
    setCart([]);
    setPhase('idle');
    clearAllTimers();
    setQrDataUrl(null);
  }, [setPhase, clearAllTimers]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-4rem)] p-4 lg:p-6">
      {paymentSuccess && (
        <PaymentSuccessOverlay
          amount={paymentSuccess.amount}
          paymentMethod={paymentSuccess.method}
          onDismiss={() => setPaymentSuccess(null)}
        />
      )}
      {/* ─── Left: Voice Panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Mic */}
        <div className="flex justify-center py-6 lg:py-10 shrink-0">
          <VoiceMicButton state={effectiveState} onToggle={toggleListening} />
        </div>

        {/* Billing phase indicator */}
        {billingPhase !== 'idle' && (
          <div className="text-center text-xs text-orange-500 font-medium pb-1 shrink-0">
            {billingPhase === 'collecting' && '🛒 ഉൽപ്പന്നങ്ങൾ ചേർക്കുന്നു...'}
            {billingPhase === 'waiting_for_more' && '⏳ കൂടി എന്തെങ്കിലും?'}
            {billingPhase === 'confirming_items' && '📋 ലിസ്റ്റ് സ്ഥിരീകരിക്കൂ'}
            {billingPhase === 'asking_payment' && '💳 പേയ്‌മെന്റ് രീതി?'}
            {billingPhase === 'awaiting_cash' && '💰 ക്യാഷ് കാത്തിരിക്കുന്നു'}
            {billingPhase === 'showing_qr' && '📱 QR സ്കാൻ ചെയ്യൂ'}
          </div>
        )}

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
          onClearCart={resetBilling}
          onCompleteSale={() => completeSale('cash')}
          onShowQR={showQRForPayment}
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
              onClearCart={resetBilling}
              onCompleteSale={() => completeSale('cash')}
              onShowQR={showQRForPayment}
            />
          </div>
        )}
      </div>
    </div>
  );
}
