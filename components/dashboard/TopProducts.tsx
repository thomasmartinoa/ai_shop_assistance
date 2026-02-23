'use client';

import { TrendingUp, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { TopProduct } from '@/hooks/useTransactions';

interface TopProductsProps {
  topProducts: TopProduct[];
}

export function TopProducts({ topProducts }: TopProductsProps) {
  const maxRevenue = topProducts.length > 0 ? topProducts[0].revenue : 1;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-gray-400" />
        <h3 className="text-base font-semibold text-gray-900">Top Products</h3>
      </div>

      {topProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <ShoppingBag className="h-10 w-10 mb-2" />
          <p className="text-sm">Start selling to see top products</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {topProducts.slice(0, 5).map((p, i) => {
            const pct = maxRevenue > 0 ? (p.revenue / maxRevenue) * 100 : 0;
            return (
              <li key={p.name + i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 truncate mr-2">{p.name}</span>
                  <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
                    <span>{p.qty} sold</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(p.revenue)}</span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100">
                  <div
                    className="h-1.5 rounded-full bg-orange-400 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
