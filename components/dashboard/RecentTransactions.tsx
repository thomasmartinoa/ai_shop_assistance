'use client';

import Link from 'next/link';
import { Receipt } from 'lucide-react';
import { formatCurrency, formatTime } from '@/lib/utils';
import type { Transaction } from '@/hooks/useTransactions';

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading: boolean;
}

function itemsSummary(items: Transaction['items']): string {
  if (!items || items.length === 0) return 'No items';
  const names = items
    .slice(0, 2)
    .map((i) => i.product_name ?? i.name ?? i.name_en ?? 'Item');
  return items.length > 2 ? `${names.join(', ')} +${items.length - 2}` : names.join(', ');
}

function PaymentBadge({ method }: { method: string }) {
  const isUPI = method?.toLowerCase() === 'upi';
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        isUPI ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
      }`}
    >
      {isUPI ? 'UPI' : 'Cash'}
    </span>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between py-3 animate-pulse">
      <div className="space-y-2 flex-1">
        <div className="h-3 w-24 rounded bg-gray-200" />
        <div className="h-3 w-36 rounded bg-gray-100" />
      </div>
      <div className="h-4 w-16 rounded bg-gray-200" />
    </div>
  );
}

export function RecentTransactions({ transactions, isLoading }: RecentTransactionsProps) {
  const recent = transactions.slice(0, 5);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-gray-400" />
          <h3 className="text-base font-semibold text-gray-900">Recent Sales</h3>
        </div>
        <Link
          href="/billing"
          className="text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          View All →
        </Link>
      </div>

      {isLoading ? (
        <div className="divide-y divide-gray-100">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : recent.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <Receipt className="h-10 w-10 mb-2" />
          <p className="text-sm">No sales recorded yet</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {recent.map((t) => (
            <li key={t.id} className="flex items-center justify-between py-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400">{formatTime(t.created_at)}</p>
                <p className="text-sm text-gray-700 truncate">{itemsSummary(t.items)}</p>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(t.total)}</span>
                <PaymentBadge method={t.payment_method} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
