/**
 * StockView — shows stock query results
 */
import { Package, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { Product } from '@/types/database';

interface StockViewProps {
  product?: Product | null;
  queryName?: string;
  lowStockProducts?: Product[];
}

export function StockView({ product, queryName, lowStockProducts }: StockViewProps) {
  if (!product && !lowStockProducts) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
        <Package size={48} className="text-gray-300" />
        <p className="text-gray-500">ഏത് ഉൽപ്പന്നം?</p>
        <p className="text-sm text-gray-400">"അരി സ്റ്റോക്ക് എത്ര?" എന്ന് ചോദിക്കൂ</p>
      </div>
    );
  }

  if (lowStockProducts && lowStockProducts.length > 0) {
    return (
      <div className="flex flex-col h-full gap-3">
        <div className="flex items-center gap-2 text-orange-600">
          <AlertTriangle size={20} />
          <span className="font-semibold">കുറഞ്ഞ സ്റ്റോക്ക്</span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {lowStockProducts.map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-orange-50 rounded-xl px-4 py-3">
              <div>
                <p className="font-medium text-gray-800">{p.name_ml}</p>
                <p className="text-xs text-gray-500">{p.name_en}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-orange-600">{p.stock} {p.unit}</p>
                <p className="text-xs text-gray-400">min: {p.min_stock}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
        <XCircle size={48} className="text-red-300" />
        <p className="text-gray-700 font-medium">"{queryName}" കണ്ടെത്തിയില്ല</p>
        <p className="text-sm text-gray-400">ഉൽപ്പന്നം ഇൻവെൻ്ററിയിൽ ഇല്ല</p>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= (product.min_stock || 0);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 text-center">
      {/* Status icon */}
      <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
        isOutOfStock ? 'bg-red-50' : isLowStock ? 'bg-orange-50' : 'bg-green-50'
      }`}>
        {isOutOfStock ? (
          <XCircle size={40} className="text-red-400" />
        ) : isLowStock ? (
          <AlertTriangle size={40} className="text-orange-400" />
        ) : (
          <CheckCircle size={40} className="text-green-500" />
        )}
      </div>

      {/* Product info */}
      <div>
        <p className="text-3xl font-bold text-gray-800">{product.name_ml}</p>
        <p className="text-gray-500">{product.name_en}</p>
      </div>

      {/* Stock */}
      <div className={`px-8 py-4 rounded-2xl ${
        isOutOfStock ? 'bg-red-50' : isLowStock ? 'bg-orange-50' : 'bg-green-50'
      }`}>
        <p className={`text-4xl font-bold ${
          isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-green-600'
        }`}>
          {product.stock}
        </p>
        <p className="text-gray-500 text-sm">{product.unit}</p>
      </div>

      {/* Status label */}
      <p className={`text-sm font-medium ${
        isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-green-600'
      }`}>
        {isOutOfStock ? 'സ്റ്റോക്ക് ഇല്ല' : isLowStock ? 'സ്റ്റോക്ക് കുറഞ്ഞു' : 'സ്റ്റോക്ക് ഉണ്ട്'}
      </p>

      {/* Location */}
      {product.shelf_location && (
        <p className="text-sm text-gray-400">
          📍 {product.shelf_location} ഷെൽഫ്
        </p>
      )}

      {/* Price */}
      <p className="text-gray-600">
        വില: <span className="font-bold">₹{product.price}</span> / {product.unit}
      </p>
    </div>
  );
}
