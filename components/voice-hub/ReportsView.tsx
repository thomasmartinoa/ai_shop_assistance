/**
 * ReportsView — shows sales summary in voice hub
 */
import { BarChart2, TrendingUp, IndianRupee, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export interface ReportData {
  period: 'today' | 'week' | 'month';
  totalSales: number;
  transactionCount: number;
  topProduct?: string;
  topProductMl?: string;
  profit?: number;
}

interface ReportsViewProps {
  data?: ReportData | null;
  isLoading?: boolean;
}

export function ReportsView({ data, isLoading }: ReportsViewProps) {
  const periodLabel = {
    today: 'ഇന്ന്',
    week: 'ഈ ആഴ്ച',
    month: 'ഈ മാസം',
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500">ഡേറ്റ ലോഡ് ചെയ്യുന്നു...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
        <BarChart2 size={48} className="text-gray-300" />
        <p className="text-gray-500">റിപ്പോർട്ടുകൾ</p>
        <p className="text-sm text-gray-400">"ഇന്നത്തെ സെയിൽ എത്ര?" എന്ന് ചോദിക്കൂ</p>
      </div>
    );
  }

  if (data.transactionCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
        <ShoppingBag size={48} className="text-gray-300" />
        <p className="text-gray-700 font-medium">
          {periodLabel[data.period] ?? 'ഇന്ന്'} ഇടപാടുകൾ ഇല്ല
        </p>
        <p className="text-sm text-gray-400">ബില്ലിംഗ് ആരംഭിക്കൂ</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart2 size={20} className="text-blue-500" />
        <span className="font-semibold text-gray-700">
          {periodLabel[data.period] ?? 'ഇന്ന്'} റിപ്പോർട്ട്
        </span>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 rounded-2xl p-4 text-center">
          <IndianRupee size={20} className="text-green-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-green-700">
            {formatCurrency(data.totalSales)}
          </p>
          <p className="text-xs text-green-600">ആകെ വിൽപ്പന</p>
        </div>

        <div className="bg-blue-50 rounded-2xl p-4 text-center">
          <ShoppingBag size={20} className="text-blue-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-blue-700">{data.transactionCount}</p>
          <p className="text-xs text-blue-600">ഇടപാടുകൾ</p>
        </div>
      </div>

      {/* Profit */}
      {data.profit !== undefined && data.profit > 0 && (
        <div className="bg-purple-50 rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-purple-600" />
            <span className="text-sm text-purple-700">ലാഭം</span>
          </div>
          <span className="font-bold text-purple-700">{formatCurrency(data.profit)}</span>
        </div>
      )}

      {/* Top product */}
      {data.topProductMl && (
        <div className="bg-orange-50 rounded-xl px-4 py-3">
          <p className="text-xs text-orange-600 mb-1">ഏറ്റവും കൂടുതൽ വിറ്റത്</p>
          <p className="font-bold text-orange-700">{data.topProductMl}</p>
        </div>
      )}
    </div>
  );
}
