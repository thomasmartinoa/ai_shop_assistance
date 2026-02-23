'use client';

import { ShoppingBag, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export interface CartItem {
  name: string;
  nameMl: string;
  qty: number;
  unit: string;
  price: number;
  total: number;
}

interface LiveCartProps {
  items: CartItem[];
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onCompleteSale: () => void;
  onShowQR: () => void;
}

export function LiveCart({ items, onRemoveItem, onClearCart, onCompleteSale, onShowQR }: LiveCartProps) {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const gst = subtotal * 0.05;
  const total = subtotal + gst;

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-gray-900">Current Bill</h2>
          {items.length > 0 && (
            <span className="bg-orange-100 text-orange-700 text-xs font-semibold rounded-full px-2 py-0.5">
              {items.length}
            </span>
          )}
        </div>
      </div>

      {/* Item list */}
      <div className="flex-1 overflow-y-auto px-5 py-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 py-12">
            <ShoppingBag className="w-10 h-10" />
            <p className="text-sm text-center">Add items using voice commands</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="group flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    {item.qty} {item.unit} × {formatCurrency(item.price)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-900">{formatCurrency(item.total)}</span>
                  <button
                    onClick={() => onRemoveItem(index)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                    aria-label={`Remove ${item.name}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary + Actions */}
      {items.length > 0 && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-3">
          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>GST (5%)</span>
              <span>{formatCurrency(gst)}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-gray-900 pt-1">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Action buttons */}
          <button
            onClick={onCompleteSale}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            Complete Sale — {formatCurrency(total)}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onShowQR}
              className="flex-1 border border-gray-200 hover:border-orange-300 text-gray-700 font-medium py-2 rounded-xl transition-colors text-sm"
            >
              UPI Payment
            </button>
            <button
              onClick={onClearCart}
              className="flex-1 text-red-500 hover:bg-red-50 font-medium py-2 rounded-xl transition-colors text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
