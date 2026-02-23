'use client';

/**
 * Voice Hub — Unified voice interface for all shopkeeper operations.
 *
 * One page. One mic. Everything: billing, stock, inventory, reports.
 * Built like an Alexa for shopkeepers — speak, it responds.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useVoice } from '@/hooks/useVoice';
import { useProducts } from '@/hooks/useProducts';
import { useSmartNLP, type CXProduct } from '@/lib/nlp/useSmartNLP';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/shared/Toast';
import { routeIntent, isConfirm, isCancel, type RouterAction, type HubMode } from '@/lib/nlp/intent-router';
import { BILLING, SYSTEM, STOCK, INVENTORY, REPORTS } from '@/lib/voice/responses-ml';
import { getSupabaseClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

import { IdleView } from '@/components/voice-hub/IdleView';
import { BillingView, type CartItem } from '@/components/voice-hub/BillingView';
import { StockView } from '@/components/voice-hub/StockView';
import { InventoryView } from '@/components/voice-hub/InventoryView';
import { ReportsView, type ReportData } from '@/components/voice-hub/ReportsView';
import { PaymentView } from '@/components/voice-hub/PaymentView';
import { VoiceButton } from '@/components/voice/VoiceButton';
import { VoiceVisualizer } from '@/components/voice/VoiceVisualizer';

import { Mic, X, ChevronRight } from 'lucide-react';
import type { Product } from '@/types/database';

// ─── Conversation state machine ───────────────────────────────────────────────

type ConvState =
  | 'idle'             // Ready for any command
  | 'billing_active'   // Bill has items; user can add more
  | 'asked_more'       // System asked "anything else?"
  | 'payment_pending'; // Waiting for payment confirmation

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VoiceHubPage() {
  const { shop, isDemoMode } = useAuth();
  const { findProduct, products, loadProducts } = useProducts({ shopId: shop?.id });
  const { processText } = useSmartNLP();
  const { showToast } = useToast();

  // ── Display state ──────────────────────────────────────────────────────────
  const [hubMode, setHubMode] = useState<HubMode>('idle');
  const [convState, setConvState] = useState<ConvState>('idle');
  const [lastTranscript, setLastTranscript] = useState('');
  const [statusLine, setStatusLine] = useState('ഞാൻ തയ്യാർ. സംസാരിക്കൂ.');

  // ── Billing state ─────────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastAddedLabel, setLastAddedLabel] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  // ── Stock state ───────────────────────────────────────────────────────────
  const [stockProduct, setStockProduct] = useState<Product | null | undefined>(undefined);
  const [stockQuery, setStockQuery] = useState('');
  const [lowStockProducts, setLowStockProducts] = useState<Product[] | undefined>(undefined);

  // ── Inventory state ───────────────────────────────────────────────────────
  const [invAction, setInvAction] = useState('');
  const [invProduct, setInvProduct] = useState('');
  const [invProductMl, setInvProductMl] = useState('');
  const [invNewStock, setInvNewStock] = useState<number | undefined>(undefined);
  const [invUnit, setInvUnit] = useState<string | undefined>(undefined);

  // ── Reports state ─────────────────────────────────────────────────────────
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // ── Voice API ref to break circular dependency ────────────────────────────
  const voiceRef = useRef<{
    speak: (text: string, lang?: string) => Promise<void>;
    cancelSpeech: () => void;
  } | null>(null);

  const speak = useCallback((text: string) => {
    voiceRef.current?.speak(text);
  }, []);

  // ── Cart totals ────────────────────────────────────────────────────────────
  const { subtotal, gstAmount, total } = useMemo(() => {
    const sub = cart.reduce((s, i) => s + i.total, 0);
    const gst = cart.reduce((s, i) => s + (i.total * i.gstRate) / 100, 0);
    return { subtotal: sub, gstAmount: gst, total: sub + gst };
  }, [cart]);

  // ── Load products on mount ─────────────────────────────────────────────────
  useEffect(() => { loadProducts(); }, [loadProducts]);

  // ─── Low stock products (derived) ─────────────────────────────────────────
  const lowStock = useMemo(
    () => products.filter((p) => p.stock > 0 && p.stock <= (p.min_stock ?? 5)),
    [products]
  );

  // ─── Today's sales (for idle view) ────────────────────────────────────────
  const [todaySales, setTodaySales] = useState(0);
  useEffect(() => {
    const fetchToday = async () => {
      const supabase = getSupabaseClient();
      if (!supabase || !shop?.id) return;
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('transactions')
        .select('total')
        .eq('shop_id', shop.id)
        .gte('created_at', `${today}T00:00:00`);
      if (data) setTodaySales(data.reduce((s, r) => s + Number(r.total), 0));
    };
    fetchToday();
  }, [shop?.id]);

  // ─── Add CX products to cart ──────────────────────────────────────────────
  const addItemsToCart = useCallback((items: CXProduct[]) => {
    const added: CartItem[] = [];

    for (const item of items) {
      const product = findProduct(item.name) || findProduct(item.nameMl);
      const price = product?.price ?? 0;
      const gstRate = product?.gst_rate ?? 0;
      const unit = item.unit !== 'piece' ? item.unit : (product?.unit ?? 'piece');

      if (!product && price === 0) {
        added.push({
          id: `${item.name}-${Date.now()}`,
          name: item.name,
          nameMl: item.nameMl || item.name,
          quantity: item.qty,
          unit,
          price: 0,
          gstRate: 0,
          total: 0,
        });
        continue;
      }

      const existingIdx = cart.findIndex(
        (c) => c.name.toLowerCase() === item.name.toLowerCase()
      );

      if (existingIdx !== -1) {
        const existing = cart[existingIdx];
        const newQty = existing.quantity + item.qty;
        added.push({
          ...existing,
          quantity: newQty,
          total: newQty * existing.price,
        });
      } else {
        added.push({
          id: `${item.name}-${Date.now()}`,
          name: item.name,
          nameMl: item.nameMl || (product?.name_ml ?? item.name),
          quantity: item.qty,
          unit,
          price,
          gstRate,
          total: item.qty * price,
        });
      }
    }

    if (added.length === 0) return;

    setCart((prev) => {
      const next = [...prev];
      for (const newItem of added) {
        const existIdx = next.findIndex((c) => c.name === newItem.name);
        if (existIdx !== -1) {
          next[existIdx] = newItem;
        } else {
          next.push(newItem);
        }
      }
      return next;
    });

    return added;
  }, [cart, findProduct]);

  // ─── Fetch report data ─────────────────────────────────────────────────────
  const fetchReportData = useCallback(async (period: 'today' | 'week') => {
    setReportLoading(true);
    setHubMode('reports');
    setReportData(null);

    const supabase = getSupabaseClient();
    if (!supabase || !shop?.id) {
      // Demo fallback
      setReportData({
        period,
        totalSales: period === 'today' ? 2450 : 17800,
        transactionCount: period === 'today' ? 8 : 52,
        topProductMl: 'അരി',
        topProduct: 'Rice',
      });
      setReportLoading(false);
      return;
    }

    const now = new Date();
    const start = new Date(
      period === 'today'
        ? `${now.toISOString().split('T')[0]}T00:00:00`
        : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    );

    const { data } = await supabase
      .from('transactions')
      .select('total, items')
      .eq('shop_id', shop.id)
      .gte('created_at', start.toISOString());

    if (!data) {
      setReportLoading(false);
      return;
    }

    const totalSales = data.reduce((s, r) => s + Number(r.total), 0);

    // Find top product from items JSONB
    const productCounts: Record<string, { name: string; nameMl: string; qty: number }> = {};
    for (const tx of data) {
      const items = Array.isArray(tx.items) ? tx.items : [];
      for (const item of items) {
        const key = item.product_name ?? item.name ?? '';
        if (!productCounts[key]) {
          productCounts[key] = { name: key, nameMl: item.product_name_ml ?? key, qty: 0 };
        }
        productCounts[key].qty += Number(item.quantity ?? 1);
      }
    }

    const topEntry = Object.values(productCounts).sort((a, b) => b.qty - a.qty)[0];

    setReportData({
      period,
      totalSales,
      transactionCount: data.length,
      topProduct: topEntry?.name,
      topProductMl: topEntry?.nameMl,
    });
    setReportLoading(false);
  }, [shop?.id]);

  // ─── Complete transaction (save to DB) ────────────────────────────────────
  const completeSale = useCallback(async (method: 'cash' | 'upi') => {
    if (cart.length === 0) return;
    setIsSaving(true);

    try {
      const supabase = getSupabaseClient();
      if (supabase && !isDemoMode && shop?.id) {
        const items = cart.map((i) => ({
          product_name: i.name,
          product_name_ml: i.nameMl,
          quantity: i.quantity,
          unit: i.unit,
          unit_price: i.price,
          gst_rate: i.gstRate,
          total: i.total,
        }));

        await supabase.from('transactions').insert({
          shop_id: shop.id,
          items,
          subtotal,
          gst_amount: gstAmount,
          total,
          payment_method: method,
          payment_status: 'completed',
        });

        // Decrement stock
        for (const item of cart) {
          const product = findProduct(item.name);
          if (product?.id) {
            await supabase
              .from('products')
              .update({ stock: Math.max(0, product.stock - item.quantity) })
              .eq('id', product.id);
          }
        }
      }

      showToast(`Sale of ${formatCurrency(total)} recorded!`, 'success');
      setTodaySales((prev) => prev + total);
      setCart([]);
      setConvState('idle');
      setHubMode('idle');
      setStatusLine('ഞാൻ തയ്യാർ. സംസാരിക്കൂ.');
      speak(SYSTEM.confirmed + ` ₹${total.toFixed(0)} ബിൽ ചെയ്തു.`);
    } catch (err) {
      showToast('Failed to save sale', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [cart, subtotal, gstAmount, total, shop?.id, isDemoMode, findProduct, showToast, speak]);

  // ─── Master voice result handler ───────────────────────────────────────────
  const handleVoiceResult = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return;
    setLastTranscript(transcript);
    setStatusLine('മനസ്സിലാക്കുന്നു...');

    // ── 1. Send to CX Playbook for understanding ────────────────────────────
    const nlpResult = await processText(transcript);
    const action = routeIntent(nlpResult);

    // Use CX Malayalam response if available, otherwise our generated one
    const cxResponse = nlpResult.fulfillmentText || action.voiceResponse;

    // ── 2. Handle based on operation ───────────────────────────────────────
    switch (action.operation) {
      // ── Billing ──
      case 'add_to_cart': {
        // CX returns products[] array — use it directly
        const products = nlpResult.products || [];
        if (products.length > 0) {
          const added = addItemsToCart(products);
          if (added && added.length > 0) {
            setHubMode('billing');
            setConvState('billing_active');
            setLastAddedLabel(cxResponse);
            setStatusLine(cxResponse);
            speak(cxResponse);
            return;
          }
        }
        // CX said billing.add but no products extracted — try entity fallback
        if (nlpResult.entities.product) {
          const fallbackProduct: CXProduct = {
            name: nlpResult.entities.product,
            nameMl: nlpResult.entities.productMl || nlpResult.entities.product,
            qty: nlpResult.entities.quantity || 1,
            unit: nlpResult.entities.unit || 'kg',
          };
          const added = addItemsToCart([fallbackProduct]);
          if (added && added.length > 0) {
            setHubMode('billing');
            setConvState('billing_active');
            setLastAddedLabel(cxResponse);
            setStatusLine(cxResponse);
            speak(cxResponse);
            return;
          }
        }
        setStatusLine(SYSTEM.not_understood);
        speak(SYSTEM.not_understood);
        break;
      }

      case 'remove_from_cart': {
        const productName = String(action.entities.product ?? '');
        if (productName) {
          setCart((prev) =>
            prev.filter((c) => !c.name.toLowerCase().includes(productName.toLowerCase()))
          );
          const res = BILLING.item_removed(productName);
          setStatusLine(res);
          speak(res);
        }
        break;
      }

      case 'clear_cart': {
        setCart([]);
        setConvState('idle');
        setHubMode('idle');
        setStatusLine(BILLING.bill_cleared);
        speak(BILLING.bill_cleared);
        break;
      }

      case 'show_total': {
        const res = BILLING.total(total);
        setHubMode('billing');
        setStatusLine(res);
        speak(res);
        break;
      }

      case 'show_qr': {
        setHubMode('payment');
        setConvState('payment_pending');
        const res = BILLING.ask_payment;
        setStatusLine(res);
        speak(res);
        break;
      }

      case 'complete_payment': {
        if (convState === 'payment_pending') {
          await completeSale('upi');
        } else {
          setHubMode('payment');
          setConvState('payment_pending');
          speak(BILLING.ask_payment);
        }
        break;
      }

      // ── Confirm / Cancel ──
      case 'confirm': {
        if (convState === 'asked_more') {
          // "yes, I need more" → keep billing
          setConvState('billing_active');
          setStatusLine('ഓക്കേ, ബില്ലിൽ ഇനിയും ചേർക്കൂ');
          speak('ഓക്കേ, ഇനിയും ഉൽപ്പന്നം പറയൂ');
        } else if (convState === 'payment_pending') {
          await completeSale('upi');
        }
        break;
      }

      case 'cancel': {
        if (convState === 'asked_more') {
          // "no" → go to total/payment
          setHubMode('billing');
          setConvState('payment_pending');
          const res = BILLING.total(total) + '. ' + BILLING.ask_payment;
          setStatusLine(res);
          speak(res);
        } else if (convState === 'payment_pending') {
          // Cancel payment
          setConvState('billing_active');
          setHubMode('billing');
          setStatusLine('ശരി, ഇനിയും ചേർക്കൂ');
          speak('ശരി, ഇനിയും ഉൽപ്പന്നം ചേർക്കൂ');
        } else {
          setStatusLine(SYSTEM.cancelled);
          speak(SYSTEM.cancelled);
        }
        break;
      }

      // ── Stock check ──
      case 'check_stock': {
        const productName = String(action.entities.product ?? nlpResult.entities.product ?? '');
        setStockQuery(productName);
        const found = productName ? findProduct(productName) : null;
        setStockProduct(found ?? null);
        setHubMode('stock');

        if (found) {
          const res = STOCK.stock_level(found.name_ml, found.stock, found.unit, found.min_stock ?? 5);
          setStatusLine(res);
          speak(res);
        } else if (productName) {
          const res = STOCK.not_found(productName);
          setStatusLine(res);
          speak(res);
        }
        break;
      }

      case 'find_location': {
        const productName = String(action.entities.product ?? '');
        const found = productName ? findProduct(productName) : null;
        setStockProduct(found ?? null);
        setHubMode('stock');
        if (found?.shelf_location) {
          const res = `${found.name_ml} ${found.shelf_location} ഷെൽഫിൽ ഉണ്ട്`;
          setStatusLine(res);
          speak(res);
        } else if (found) {
          speak(`${found.name_ml} ഷെൽഫ് ലൊക്കേഷൻ സ്ഥിരീകരിച്ചിട്ടില്ല`);
        }
        break;
      }

      case 'check_low_stock': {
        setLowStockProducts(lowStock);
        setStockProduct(undefined);
        setHubMode('stock');
        if (lowStock.length > 0) {
          speak(`${lowStock.length} ഉൽപ്പന്നങ്ങൾക്ക് സ്റ്റോക്ക് കുറഞ്ഞിട്ടുണ്ട്`);
        } else {
          speak('എല്ലാ ഉൽപ്പന്നങ്ങളും സ്റ്റോക്കിൽ ഉണ്ട്');
        }
        break;
      }

      // ── Inventory ──
      case 'add_stock': {
        const productName = String(action.entities.product ?? '');
        const quantity = Number(action.entities.quantity ?? 0);
        const unit = String(action.entities.unit ?? 'kg');
        const found = productName ? findProduct(productName) : null;

        setHubMode('inventory');
        setInvProduct(productName);
        setInvProductMl(found?.name_ml ?? productName);
        setInvUnit(unit);

        if (found && quantity > 0) {
          const newStock = (found.stock ?? 0) + quantity;
          setInvNewStock(newStock);
          setInvAction(INVENTORY.stock_added(quantity, unit, found.name_ml));

          // Update in DB
          const supabase = getSupabaseClient();
          if (supabase && !isDemoMode && found.id) {
            await supabase.from('products').update({ stock: newStock }).eq('id', found.id);
          }

          const res = INVENTORY.stock_added(quantity, unit, found.name_ml);
          setStatusLine(res);
          speak(res);
        } else {
          const res = productName
            ? STOCK.not_found(productName)
            : SYSTEM.not_understood;
          setStatusLine(res);
          speak(res);
        }
        break;
      }

      case 'update_price': {
        const productName = String(action.entities.product ?? '');
        const newPrice = Number(action.entities.price ?? action.entities.quantity ?? 0);
        const found = productName ? findProduct(productName) : null;

        setHubMode('inventory');
        setInvProduct(productName);
        setInvProductMl(found?.name_ml ?? productName);

        if (found && newPrice > 0) {
          const supabase = getSupabaseClient();
          if (supabase && !isDemoMode && found.id) {
            await supabase.from('products').update({ price: newPrice }).eq('id', found.id);
          }
          const res = INVENTORY.price_updated(found.name_ml, newPrice);
          setInvAction(res);
          setStatusLine(res);
          speak(res);
        } else {
          speak(SYSTEM.not_understood);
        }
        break;
      }

      // ── Reports ──
      case 'report_today': {
        await fetchReportData('today');
        const res = 'ഇന്നത്തെ സെയിൽസ് കാണിക്കുന്നു';
        setStatusLine(res);
        speak(res);
        break;
      }

      case 'report_week': {
        await fetchReportData('week');
        const res = 'ഈ ആഴ്ചത്തെ സെയിൽസ് കാണിക്കുന്നു';
        setStatusLine(res);
        speak(res);
        break;
      }

      // ── Help ──
      case 'help': {
        setStatusLine(SYSTEM.help);
        speak(SYSTEM.help);
        break;
      }

      // ── Fallback ──
      default: {
        // CX returned fallback — speak the CX response or our default
        setStatusLine(cxResponse || SYSTEM.not_understood);
        speak(cxResponse || SYSTEM.not_understood);
        break;
      }
    }
  }, [
    convState, addItemsToCart, processText, findProduct, completeSale,
    fetchReportData, total, lowStock, isDemoMode, speak
  ]);

  // ─── Silence handler: "anything else?" ───────────────────────────────────
  const handleSilence = useCallback(() => {
    if (convState === 'billing_active' && cart.length > 0) {
      setConvState('asked_more');
      const question = BILLING.ask_more;
      setStatusLine(question);
      speak(question);
    }
  }, [convState, cart.length, speak]);

  // ─── useVoice hook ────────────────────────────────────────────────────────
  const voice = useVoice({
    lang: 'ml-IN',
    continuous: true,
    onResult: (transcript, isFinal) => {
      if (isFinal) {
        handleVoiceResult(transcript);
      }
    },
    onSilence: handleSilence,
    silenceThresholdMs: 1800,
  });

  // Store voice API in ref to avoid circular deps
  useEffect(() => {
    voiceRef.current = { speak: voice.speak, cancelSpeech: voice.cancelSpeech };
  }, [voice.speak, voice.cancelSpeech]);

  // ─── Mode label ───────────────────────────────────────────────────────────
  const modeLabels: Record<HubMode, string> = {
    idle: 'Voice Hub',
    billing: 'ബില്ലിംഗ്',
    stock: 'സ്റ്റോക്ക്',
    inventory: 'ഇൻവെൻ്ററി',
    reports: 'റിപ്പോർട്ട്',
    payment: 'പേയ്‌മെൻ്റ്',
  };

  // ─── Payment confirmed ────────────────────────────────────────────────────
  const handlePaymentConfirmed = useCallback(() => {
    completeSale('upi');
  }, [completeSale]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[900px] gap-3">
      {/* ── Header bar ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{modeLabels[hubMode]}</h1>
          <p className="text-xs text-gray-400">
            {voice.state === 'listening'
              ? '🔴 കേൾക്കുന്നു...'
              : voice.state === 'processing'
              ? '⏳ മനസ്സിലാക്കുന്നു...'
              : voice.state === 'speaking'
              ? '🔊 സംസാരിക്കുന്നു...'
              : '🎤 സംസാരിക്കൂ'}
          </p>
        </div>

        {/* Mode breadcrumb pill */}
        {hubMode !== 'idle' && (
          <button
            onClick={() => {
              setHubMode('idle');
              setConvState('idle');
              setStatusLine('ഞാൻ തയ്യാർ. സംസാരിക്കൂ.');
            }}
            className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1.5 hover:bg-gray-200 transition-colors"
          >
            <X size={12} />
            ക്ലിയർ
          </button>
        )}
      </div>

      {/* ── Status / transcript bar ── */}
      {lastTranscript && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 text-sm text-blue-700">
          <span className="text-blue-400 mr-2">🎤</span>
          "{lastTranscript}"
        </div>
      )}

      {/* ── Dynamic display area ── */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-4">
        {hubMode === 'idle' && (
          <IdleView
            todaySales={todaySales}
            lowStockCount={lowStock.length}
            shopName={shop?.name_ml ?? shop?.name}
          />
        )}
        {hubMode === 'billing' && (
          <BillingView
            cart={cart}
            subtotal={subtotal}
            gstAmount={gstAmount}
            total={total}
            onRemoveItem={(id) => setCart((prev) => prev.filter((i) => i.id !== id))}
            lastAction={lastAddedLabel}
          />
        )}
        {hubMode === 'stock' && (
          <StockView
            product={stockProduct}
            queryName={stockQuery}
            lowStockProducts={lowStockProducts}
          />
        )}
        {hubMode === 'inventory' && (
          <InventoryView
            lastAction={invAction}
            productName={invProduct}
            productMl={invProductMl}
            newStock={invNewStock}
            unit={invUnit}
          />
        )}
        {hubMode === 'reports' && (
          <ReportsView data={reportData} isLoading={reportLoading} />
        )}
        {hubMode === 'payment' && (
          <PaymentView
            total={total}
            upiId={shop?.upi_id ?? undefined}
            shopName={shop?.name}
            onPaymentConfirmed={handlePaymentConfirmed}
          />
        )}
      </div>

      {/* ── Status line ── */}
      <div className="px-1">
        <p className="text-sm text-gray-500 text-center min-h-[20px]">{statusLine}</p>
      </div>

      {/* ── Voice control bar ── */}
      <div className="flex items-center justify-center gap-4 pb-2">
        {/* Visualizer */}
        <div className="flex-1">
          <VoiceVisualizer state={voice.state} />
        </div>

        {/* Main mic button */}
        <VoiceButton
          state={voice.state}
          onToggle={voice.toggleListening}
          disabled={!voice.isSupported}
        />

        {/* Billing quick actions */}
        <div className="flex-1 flex justify-end gap-2">
          {hubMode === 'billing' && cart.length > 0 && (
            <button
              onClick={() => {
                setHubMode('payment');
                setConvState('payment_pending');
                speak(BILLING.ask_payment);
              }}
              className="text-xs bg-green-500 text-white px-3 py-2 rounded-xl font-medium"
            >
              Pay ₹{total.toFixed(0)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
