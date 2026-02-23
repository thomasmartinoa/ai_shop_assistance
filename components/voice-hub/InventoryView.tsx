/**
 * InventoryView — shows stock update confirmations
 */
import { Package, Plus, TrendingUp } from 'lucide-react';

interface InventoryViewProps {
  lastAction?: string;
  productName?: string;
  productMl?: string;
  newStock?: number;
  unit?: string;
}

export function InventoryView({
  lastAction,
  productName,
  productMl,
  newStock,
  unit,
}: InventoryViewProps) {
  if (!productMl && !lastAction) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
        <Package size={48} className="text-gray-300" />
        <p className="text-gray-500">ഇൻവെൻ്ററി മാനേജ്മെൻ്റ്</p>
        <p className="text-sm text-gray-400">"50 kg അരി സ്റ്റോക്കിൽ ചേർക്കൂ" എന്ന് പറയൂ</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
      {/* Success icon */}
      <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
        <Plus size={40} className="text-blue-500" />
      </div>

      {/* Product */}
      {productMl && (
        <div>
          <p className="text-3xl font-bold text-gray-800">{productMl}</p>
          <p className="text-gray-500">{productName}</p>
        </div>
      )}

      {/* Last action */}
      {lastAction && (
        <div className="bg-blue-50 rounded-2xl px-6 py-4 max-w-sm">
          <p className="text-blue-700 font-medium">{lastAction}</p>
        </div>
      )}

      {/* New total stock */}
      {newStock !== undefined && (
        <div className="flex items-center gap-2 text-gray-600">
          <TrendingUp size={20} className="text-green-500" />
          <span>ഇപ്പോൾ: <strong>{newStock} {unit}</strong></span>
        </div>
      )}

      <p className="text-sm text-gray-400">
        "50 kg അരി സ്റ്റോക്കിൽ ചേർക്കൂ" — ഇൻവെൻ്ററി അപ്ഡേറ്റ് ചെയ്യാൻ
      </p>
    </div>
  );
}
