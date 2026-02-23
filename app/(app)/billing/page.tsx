'use client';

import { useState, useMemo } from 'react';
import { ShoppingCart, TrendingUp, Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/hooks/useTransactions';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type DateFilter = 'today' | 'week' | 'month';

export default function BillingPage() {
  const { shop } = useAuth();
  const { transactions, isLoading } = useTransactions(shop?.id);
  const [filter, setFilter] = useState<DateFilter>('today');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredTx = useMemo(() => {
    const now = new Date();
    return transactions.filter(tx => {
      const txDate = new Date(tx.created_at);
      if (filter === 'today') return txDate.toDateString() === now.toDateString();
      if (filter === 'week') {
        const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
        return txDate >= weekAgo;
      }
      if (filter === 'month') {
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [transactions, filter]);

  const totalRevenue = filteredTx.reduce((s, t) => s + Number(t.total), 0);
  const avgOrder = filteredTx.length > 0 ? totalRevenue / filteredTx.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground">{filteredTx.length} records</p>
        </div>
        {/* Filter chips */}
        <div className="flex gap-1.5 bg-muted/50 rounded-xl p-1">
          {(['today', 'week', 'month'] as DateFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize',
                filter === f ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          title="Revenue"
          value={isLoading ? '…' : `₹${totalRevenue.toFixed(0)}`}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Orders"
          value={isLoading ? '…' : filteredTx.length.toString()}
          icon={ShoppingCart}
        />
        <StatCard
          title="Avg Order"
          value={isLoading ? '…' : `₹${avgOrder.toFixed(0)}`}
          icon={Calculator}
        />
      </div>

      {/* Transactions list */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-muted-foreground text-sm">Loading...</div>
        ) : filteredTx.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingCart className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No transactions</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Go to Voice Hub to start billing</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredTx.map(tx => {
              const items = Array.isArray(tx.items) ? tx.items : [];
              const isExpanded = expandedId === tx.id;
              const itemSummary = items.slice(0, 2).map(item =>
                `${item.product_name || item.name || item.name_en || ''} ${item.quantity ?? item.qty ?? ''}${item.unit || ''}`
              ).join(', ');
              return (
                <div key={tx.id}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : tx.id)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {itemSummary}{items.length > 2 ? ` +${items.length - 2} more` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(tx.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        {' · '}
                        {new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm">₹{Number(tx.total).toFixed(2)}</span>
                      <Badge variant={tx.payment_method === 'upi' ? 'default' : 'secondary'} className="text-[10px]">
                        {tx.payment_method?.toUpperCase() || 'CASH'}
                      </Badge>
                      {isExpanded
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 bg-muted/20">
                      <div className="space-y-1.5 pt-2">
                        {items.map((item, i) => {
                          const name = item.product_name || item.name || item.name_en || 'Item';
                          const qty = item.quantity ?? item.qty ?? 0;
                          const price = item.unit_price ?? item.price ?? 0;
                          const lineTotal = item.total ?? (price * qty);
                          return (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{name} × {qty} {item.unit || ''}</span>
                              <span className="font-medium">₹{Number(lineTotal).toFixed(2)}</span>
                            </div>
                          );
                        })}
                        <div className="flex justify-between text-sm font-bold pt-1 border-t border-border">
                          <span>Total</span>
                          <span>₹{Number(tx.total).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
