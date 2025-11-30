'use client';

import { useState, useCallback, useEffect } from 'react';
import { useVoice } from '@/hooks/useVoice';
import { useProducts } from '@/hooks/useProducts';
import { VoiceButton } from '@/components/voice/VoiceButton';
import { VoiceVisualizer } from '@/components/voice/VoiceVisualizer';
import { UpiQrCode } from '@/components/billing/UpiQrCode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { classifyIntent, type Intent } from '@/lib/nlp/intent';
import { formatCurrency } from '@/lib/utils';
import { INTENT_TYPES, ML_RESPONSES } from '@/lib/constants';
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

export default function BillingPage() {
  const { shop } = useAuth();
  const { findProduct, loadProducts } = useProducts({ shopId: shop?.id });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastIntent, setLastIntent] = useState<Intent | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

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

  // Handle voice result
  const handleVoiceResult = useCallback(
    (transcript: string, isFinal: boolean) => {
      if (!isFinal) return;

      const intent = classifyIntent(transcript);
      setLastIntent(intent);

      // Process intent
      switch (intent.type) {
        case INTENT_TYPES.BILLING_ADD:
          const productName = intent.entities.productName as string;
          const quantity = (intent.entities.quantity as number) || 1;
          
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
              voice.speak(`${product.name_ml} ചേർത്തു`);
            } else {
              voice.speak(`${productName} കണ്ടെത്തിയില്ല`);
            }
          }
          break;

        case INTENT_TYPES.BILLING_REMOVE:
          const removeProduct = intent.entities.productName as string;
          if (removeProduct) {
            setCart((prev) =>
              prev.filter(
                (item) =>
                  !item.name.toLowerCase().includes(removeProduct.toLowerCase())
              )
            );
            voice.speak(`${removeProduct} മാറ്റി`);
          }
          break;

        case INTENT_TYPES.BILLING_CLEAR:
          setCart([]);
          voice.speak('ബിൽ ക്ലിയർ ചെയ്തു');
          break;

        case INTENT_TYPES.BILL_TOTAL:
          voice.speak(`ആകെ തുക ${Math.round(total)} രൂപ`);
          break;

        case INTENT_TYPES.PAYMENT_UPI:
          setShowQR(true);
          voice.speak('QR കോഡ് കാണിക്കുന്നു');
          break;

        case INTENT_TYPES.CONFIRM:
          voice.speak('ശരി');
          break;

        case INTENT_TYPES.CANCEL:
          voice.speak('റദ്ദാക്കി');
          break;

        default:
          voice.speak(ML_RESPONSES.notUnderstood);
      }
    },
    [total]
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
            onPress={voice.startListening}
            onRelease={voice.stopListening}
            disabled={!voice.isSupported}
          />
          
          <VoiceVisualizer
            state={voice.state}
            transcript={voice.interimTranscript || voice.transcript}
            className="mt-4"
          />

          {/* Last intent debug (dev only) */}
          {lastIntent && process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-xs text-muted-foreground">
              Intent: {lastIntent.type} ({(lastIntent.confidence * 100).toFixed(0)}%)
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
