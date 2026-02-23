/**
 * BillingView — shows cart and totals in voice hub billing mode
 */
import { Trash2, IndianRupee } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export interface CartItem {
  id: string;
  name: string;
  nameMl: string;
  quantity: number;
  unit: string;
  price: number;
  gstRate: number;
  total: number;
}

interface BillingViewProps {
  cart: CartItem[];
  subtotal: number;
  gstAmount: number;
  total: number;
  onRemoveItem?: (id: string) => void;
  lastAction?: string;
}

export function BillingView({
  cart,
  subtotal,
  gstAmount,
  total,
  onRemoveItem,
  lastAction,
}: BillingViewProps) {
  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-3">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
          <IndianRupee size={32} className="text-blue-400" />
        </div>
        <p className="text-gray-500">ബില്ലിൽ ഒന്നും ഇല്ല</p>
        <p className="text-sm text-gray-400">ഉൽപ്പന്നം പറഞ്ഞാൽ ബില്ലിൽ ചേർക്കാം</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Last action banner */}
      {lastAction && (
        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2 mb-3 text-sm text-green-700 font-medium">
          ✓ {lastAction}
        </div>
      )}

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-3">
        {cart.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3"
          >
            <div className="flex-1">
              <p className="font-medium text-gray-800">{item.nameMl}</p>
              <p className="text-xs text-gray-500">
                {item.quantity} {item.unit} × ₹{item.price}
                {item.gstRate > 0 && ` (+${item.gstRate}% GST)`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-gray-800">₹{item.total.toFixed(2)}</span>
              {onRemoveItem && (
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-1">
        {gstAmount > 0 && (
          <>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>GST</span>
              <span>{formatCurrency(gstAmount)}</span>
            </div>
            <div className="h-px bg-gray-200 my-1" />
          </>
        )}
        <div className="flex justify-between text-lg font-bold text-gray-800">
          <span>ആകെ</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <p className="text-xs text-gray-400 text-center mt-1">
          "ടോട്ടൽ" അല്ലെങ്കിൽ "QR കാണിക്കൂ" എന്ന് പറയൂ
        </p>
      </div>
    </div>
  );
}
