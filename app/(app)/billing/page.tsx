'use client';

import { useState, useCallback, useEffect } from 'react';
import { useVoice } from '@/hooks/useVoice';
import { useProducts } from '@/hooks/useProducts';
import { useSmartNLP, type NLPResult } from '@/lib/nlp/useSmartNLP';
import { VoiceButton } from '@/components/voice/VoiceButton';
import { VoiceVisualizer } from '@/components/voice/VoiceVisualizer';
import { UpiQrCode } from '@/components/billing/UpiQrCode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { ML_RESPONSES } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import {
  Trash2,
  QrCode,
  Printer,
  IndianRupee,
  ShoppingCart,
  Plus,
  Minus,
  Check,
} from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  nameMl: string;
  quantity: number;
  unit: string;
  price: number;
  gstRate: number;
  total: number;
}

// Conversation states for billing flow
type ConversationState = 
  | 'idle'           // Waiting for commands
  | 'awaiting_confirmation'  // Asked "anything else?" waiting for response
  | 'processing_payment';    // Showing QR/completing payment

export default function BillingPage() {
  const { shop } = useAuth();
  const { findProduct, loadProducts } = useProducts({ shopId: shop?.id });
  const { processText, isProcessing, lastResult } = useSmartNLP();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showQR, setShowQR] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState>('idle');
  const [lastAddedItem, setLastAddedItem] = useState<string | null>(null);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const gstAmount = cart.reduce(
    (sum, item) => sum + (item.total * item.gstRate) / 100,
    0
  );
  const total = subtotal + gstAmount;

  // Handle voice result with Smart NLP - Conversational Flow
  const handleVoiceResult = useCallback(
    async (transcript: string, isFinal: boolean) => {
      if (!isFinal) return;

      // Process through Smart NLP (Dialogflow + local fallback)
      const result = await processText(transcript);

      // Check if user is responding to "anything else?" confirmation
      if (conversationState === 'awaiting_confirmation') {
        // User wants to add more items
        if (result.intent === 'billing.add' || 
            result.intent === 'general.addmore' ||
            /കൂടി|more|വേറെ|add|ചേർക്കുക|ഇനി|വേണം|ഉണ്ട്/i.test(transcript)) {
          setConversationState('idle');
          // If they said something like "വേറെ ഉണ്ട്" or "ഇനിയും വേണം" without product, just wait
          if (result.intent !== 'billing.add') {
            voice.speak('ശരി, എന്താണ് വേണ്ടത്?');
            return;
          }
          // Fall through to handle billing.add below
        }
        // User confirms billing (yes/done/bill it/no more)
        else if (result.intent === 'general.confirm' || 
                 result.intent === 'billing.complete' ||
                 result.intent === 'billing.total' ||
                 /ശരി|ഇല്ല|മതി|അത്രതന്നെ|bill|ബിൽ|done|കഴിഞ്ഞു|no more|അത്ര|that's all|proceed/i.test(transcript)) {
          setConversationState('processing_payment');
          const totalAmount = Math.round(total);
          voice.speak(`ശരി, ആകെ തുക ${totalAmount} രൂപ. പേയ്‌മെൻ്റ് എങ്ങനെ? UPI അല്ലെങ്കിൽ കാഷ്?`);
          return;
        }
        // User wants to cancel
        else if (result.intent === 'general.cancel' || /cancel|റദ്ദാക്കുക|വേണ്ട/i.test(transcript)) {
          setConversationState('idle');
          voice.speak('ശരി, ഇനിയും ഉൽപ്പന്നങ്ങൾ ചേർക്കാം');
          return;
        }
      }

      // Check if user is responding to payment method question
      if (conversationState === 'processing_payment') {
        if (result.intent === 'payment.upi' || /upi|qr|gpay|phonepay|google pay|paytm/i.test(transcript)) {
          setShowQR(true);
          voice.speak('QR കോഡ് കാണിക്കുന്നു. സ്കാൻ ചെയ്തു പേയ്മെൻ്റ് ചെയ്യൂ');
          return;
        }
        if (result.intent === 'payment.cash' || /cash|കാഷ്|പണം|നോട്ട്/i.test(transcript)) {
          setPaymentComplete(true);
          voice.speak('കാഷ് പേയ്മെൻ്റ്. നന്ദി!');
          setConversationState('idle');
          return;
        }
      }

      // Process based on intent
      switch (result.intent) {
        case 'billing.add':
          const productName = result.entities.product;
          const quantity = result.entities.quantity || 1;
          
          if (productName) {
            // Search for product in database
            const product = findProduct(productName);
            
            if (product) {
              const newItem: CartItem = {
                id: Date.now().toString(),
                name: product.name_en,
                nameMl: product.name_ml,
                quantity,
                unit: product.unit,
                price: product.price,
                gstRate: product.gst_rate,
                total: quantity * product.price,
              };
              
              setCart((prev) => [...prev, newItem]);
              setLastAddedItem(product.name_ml);
              setConversationState('awaiting_confirmation');
              
              // Ask if they want to add more - in Malayalam
              const unitText = product.unit === 'kg' ? 'കിലോ' : product.unit === 'litre' ? 'ലിറ്റർ' : 'എണ്ണം';
              voice.speak(`${quantity} ${unitText} ${product.name_ml} ചേർത്തു. ഇനിയും വേണോ, അതോ ബിൽ ചെയ്യട്ടെ?`);
            } else {
              voice.speak(`${productName} കണ്ടെത്തിയില്ല. വേറെ പേര് പറയൂ`);
            }
          } else {
            voice.speak('ഉൽപ്പന്നത്തിൻ്റെ പേര് പറയൂ');
          }
          break;

        case 'billing.remove':
          const removeProduct = result.entities.product;
          if (removeProduct) {
            const itemToRemove = cart.find(item => 
              item.name.toLowerCase().includes(removeProduct.toLowerCase()) ||
              item.nameMl.includes(removeProduct)
            );
            if (itemToRemove) {
              setCart((prev) =>
                prev.filter((item) => item.id !== itemToRemove.id)
              );
              voice.speak(`${itemToRemove.nameMl} ബില്ലിൽ നിന്ന് മാറ്റി. ഇനിയും വേണോ?`);
              setConversationState('awaiting_confirmation');
            } else {
              voice.speak(`${removeProduct} ബില്ലിൽ ഇല്ല`);
            }
          } else {
            voice.speak('ഏത് ഉൽപ്പന്നം മാറ്റണം?');
          }
          break;

        case 'billing.clear':
          setCart([]);
          setConversationState('idle');
          voice.speak('ബിൽ ക്ലിയർ ചെയ്തു. പുതിയ ബിൽ തുടങ്ങാം');
          break;

        case 'billing.total':
          if (cart.length > 0) {
            const totalAmount = Math.round(total);
            voice.speak(`ആകെ ${cart.length} ഉൽപ്പന്നങ്ങൾ, തുക ${totalAmount} രൂപ. ബിൽ ചെയ്യട്ടെ?`);
            setConversationState('awaiting_confirmation');
          } else {
            voice.speak('ബില്ലിൽ ഒന്നും ഇല്ല. എന്താണ് വേണ്ടത്?');
          }
          break;

        case 'billing.complete':
          if (cart.length > 0) {
            setConversationState('processing_payment');
            const totalAmount = Math.round(total);
            voice.speak(`ശരി, ആകെ തുക ${totalAmount} രൂപ. UPI അല്ലെങ്കിൽ കാഷ്?`);
          } else {
            voice.speak('ബില്ലിൽ ഒന്നും ഇല്ല');
          }
          break;

        case 'payment.upi':
          if (cart.length > 0) {
            setShowQR(true);
            setConversationState('processing_payment');
            voice.speak(`ആകെ ${Math.round(total)} രൂപ. QR കോഡ് കാണിക്കുന്നു`);
          } else {
            voice.speak('ആദ്യം ബില്ലിൽ ഉൽപ്പന്നങ്ങൾ ചേർക്കൂ');
          }
          break;

        case 'general.confirm':
          if (conversationState === 'idle' && cart.length > 0) {
            setConversationState('processing_payment');
            voice.speak(`ആകെ ${Math.round(total)} രൂപ. UPI അല്ലെങ്കിൽ കാഷ്?`);
          } else {
            voice.speak('ശരി');
          }
          break;

        case 'general.cancel':
          setConversationState('idle');
          voice.speak('റദ്ദാക്കി');
          break;

        case 'general.greeting':
          voice.speak('നമസ്കാരം! എന്ത് സഹായം വേണം?');
          break;

        case 'general.help':
          voice.speak('നിങ്ങൾക്ക് ഉൽപ്പന്നങ്ങൾ ബില്ലിൽ ചേർക്കാം. ഉദാഹരണം: രണ്ട് കിലോ അരി');
          break;

        default:
          voice.speak(ML_RESPONSES.notUnderstood);
      }
    },
    [total, processText, findProduct, conversationState, cart]
  );

  const voice = useVoice({
    onResult: handleVoiceResult,
    onError: (error) => console.error('Voice error:', error),
  });

  // Update quantity
  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.max(0, item.quantity + delta),
              total: Math.max(0, item.quantity + delta) * item.price,
            }
          : item
      ).filter((item) => item.quantity > 0)
    );
  };

  // Remove item
  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Voice Section */}
      <Card>
        <CardContent className="p-6 flex flex-col items-center">
          <VoiceButton
            state={voice.state}
            onToggle={voice.toggleListening}
            disabled={!voice.isSupported}
          />
          
          <VoiceVisualizer
            state={voice.state}
            transcript={voice.interimTranscript || voice.transcript}
            className="mt-4"
          />

          {/* Conversation State Indicator */}
          {conversationState !== 'idle' && (
            <div className={`mt-4 px-4 py-2 rounded-lg text-center animate-pulse ${
              conversationState === 'awaiting_confirmation' 
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' 
                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
            }`}>
              {conversationState === 'awaiting_confirmation' && (
                <div>
                  <p className="font-medium">ഇനിയും വേണോ?</p>
                  <p className="text-sm opacity-75">
                    "ഇനിയും വേണം" / "അത്രതന്നെ, ബിൽ ചെയ്യൂ"
                  </p>
                </div>
              )}
              {conversationState === 'processing_payment' && (
                <div>
                  <p className="font-medium">പേയ്‌മെൻ്റ് രീതി?</p>
                  <p className="text-sm opacity-75">
                    "UPI" / "കാഷ്"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Last intent debug (dev only) */}
          {lastResult && process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-xs text-muted-foreground">
              Intent: {lastResult.intent} ({(lastResult.confidence * 100).toFixed(0)}%) 
              <span className="ml-2 text-blue-500">[{lastResult.source}]</span>
              <span className="ml-2 text-purple-500">[{conversationState}]</span>
            </div>
          )}

          {/* Test TTS button (dev only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 flex gap-2 flex-wrap">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => voice.speak('നമസ്കാരം, എന്ത് സഹായം വേണം?')}
              >
                🔊 Test Malayalam TTS
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => voice.speak('Hello, how can I help you?', 'en-IN')}
              >
                🔊 Test English TTS
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Current Bill
            {cart.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-auto">
                {cart.length} items
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cart.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No items in bill</p>
              <p className="text-sm">Press the microphone and say an item</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.price)} / {item.unit}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <span className="w-20 text-right font-semibold">
                      {formatCurrency(item.total)}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Totals */}
              <div className="pt-4 space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {gstAmount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>GST</span>
                    <span>{formatCurrency(gstAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action buttons */}
      {cart.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            size="lg"
            className="flex-col gap-1 h-auto py-4"
            onClick={() => setShowQR(true)}
          >
            <QrCode className="w-6 h-6" />
            <span>UPI Payment</span>
          </Button>
          <Button
            size="lg"
            className="flex-col gap-1 h-auto py-4"
            onClick={() => {
              // TODO: Complete transaction and print
              alert('Bill completed!');
              setCart([]);
            }}
          >
            <IndianRupee className="w-6 h-6" />
            <span>Cash Payment</span>
          </Button>
        </div>
      )}

      {/* QR Modal */}
      {showQR && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowQR(false)}
        >
          <Card className="max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-center">
                {paymentComplete ? 'Payment Received!' : 'Scan to Pay'}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {paymentComplete ? (
                <div className="w-48 h-48 bg-green-100 rounded-lg flex items-center justify-center">
                  <Check className="w-24 h-24 text-green-600" />
                </div>
              ) : (
                <UpiQrCode
                  upiId={shop?.upi_id || ''}
                  payeeName={shop?.name || 'Shop'}
                  amount={total}
                  transactionNote={`Bill #${Date.now().toString().slice(-6)}`}
                  size={192}
                />
              )}
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(total)}
              </p>
              <p className="text-sm text-muted-foreground">GPay / PhonePe / UPI</p>
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowQR(false);
                    setPaymentComplete(false);
                  }}
                >
                  Close
                </Button>
                {!paymentComplete && (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setPaymentComplete(true);
                      setTimeout(() => {
                        setShowQR(false);
                        setPaymentComplete(false);
                        setCart([]);
                      }, 2000);
                    }}
                  >
                    Mark as Paid
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
