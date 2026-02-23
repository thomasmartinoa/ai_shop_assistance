'use client';

import Link from 'next/link';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/types/database';

interface LowStockAlertProps {
  products: Product[];
}

function stockColor(product: Product) {
  if (product.stock <= 0) return 'text-red-600 bg-red-50';
  if (product.stock <= (product.min_stock ?? 5)) return 'text-orange-600 bg-orange-50';
  return 'text-green-600 bg-green-50';
}

export function LowStockAlert({ products }: LowStockAlertProps) {
  const display = products.slice(0, 5);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <h3 className="text-base font-semibold text-gray-900">Low Stock Alerts</h3>
        </div>
        {products.length > 0 && (
          <Badge variant="warning">{products.length}</Badge>
        )}
      </div>

      {products.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-gray-400 py-8">
          <CheckCircle2 className="h-10 w-10 mb-2 text-green-400" />
          <p className="text-sm text-green-600 font-medium">All products well-stocked ✓</p>
        </div>
      ) : (
        <div className="flex flex-col flex-1">
          <ul className="space-y-3 flex-1">
            {display.map((p) => (
              <li key={p.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 truncate mr-2">{p.name_en}</span>
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${stockColor(p)}`}
                >
                  {p.stock} {p.unit ?? 'pcs'}
                </span>
              </li>
            ))}
          </ul>
          {products.length > 5 && (
            <Link
              href="/inventory"
              className="mt-4 text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              View All →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
