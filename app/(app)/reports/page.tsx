'use client';

import { useState, useMemo } from 'react';
import { Download, TrendingUp, ShoppingCart } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/hooks/useTransactions';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';

type Period = 'week' | 'month' | 'year';

const COLORS = ['#F97316', '#64748b'];

export default function ReportsPage() {
  const { shop } = useAuth();
  const { transactions, isLoading } = useTransactions(shop?.id);
  const [period, setPeriod] = useState<Period>('week');

  const filteredTx = useMemo(() => {
    const now = new Date();
    return transactions.filter(tx => {
      const d = new Date(tx.created_at);
      if (period === 'week') { const w = new Date(now); w.setDate(now.getDate() - 7); return d >= w; }
      if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      return d.getFullYear() === now.getFullYear();
    });
  }, [transactions, period]);

  const totalRevenue = filteredTx.reduce((s, t) => s + Number(t.total), 0);
  const avgOrder = filteredTx.length > 0 ? totalRevenue / filteredTx.length : 0;
  const daysActive = new Set(filteredTx.map(t => new Date(t.created_at).toDateString())).size;

  // Group by day for line chart
  const chartData = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredTx.forEach(tx => {
      const key = new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      groups[key] = (groups[key] || 0) + Number(tx.total);
    });
    return Object.entries(groups).map(([date, revenue]) => ({ date, revenue: parseFloat(revenue.toFixed(2)) }));
  }, [filteredTx]);

  // Payment method breakdown for pie
  const pieData = useMemo(() => {
    const cash = filteredTx.filter(t => t.payment_method === 'cash').reduce((s, t) => s + Number(t.total), 0);
    const upi = filteredTx.filter(t => t.payment_method === 'upi').reduce((s, t) => s + Number(t.total), 0);
    return [
      { name: 'Cash', value: parseFloat(cash.toFixed(2)) },
      { name: 'UPI', value: parseFloat(upi.toFixed(2)) },
    ].filter(d => d.value > 0);
  }, [filteredTx]);

  // Top products by revenue
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    filteredTx.forEach(tx => {
      const items = Array.isArray(tx.items) ? tx.items : [];
      items.forEach(item => {
        const name = item.product_name || item.name_en || item.name || 'Unknown';
        const qty = item.quantity ?? item.qty ?? 0;
        const revenue = item.total ?? ((item.unit_price ?? item.price ?? 0) * qty);
        if (!map[name]) map[name] = { name, qty: 0, revenue: 0 };
        map[name].qty += Number(qty);
        map[name].revenue += Number(revenue);
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filteredTx]);

  function exportCSV() {
    const rows = [
      ['Date', 'Time', 'Items', 'Total', 'Payment'],
      ...filteredTx.map(tx => {
        const items = Array.isArray(tx.items) ? tx.items : [];
        return [
          new Date(tx.created_at).toLocaleDateString('en-IN'),
          new Date(tx.created_at).toLocaleTimeString('en-IN'),
          items.map(i => `${i.product_name || i.name || i.name_en || 'Item'} x${i.quantity ?? i.qty ?? 0}`).join('; '),
          Number(tx.total).toFixed(2),
          tx.payment_method || 'cash',
        ];
      }),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `sales-report-${period}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Reports &amp; Analytics</h1>
          <p className="text-sm text-muted-foreground">{filteredTx.length} transactions</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
            {(['week', 'month', 'year'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${period === p ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'}`}>
                {p === 'week' ? 'Week' : p === 'month' ? 'Month' : 'Year'}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Revenue"
          value={isLoading ? '…' : `₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard title="Orders" value={isLoading ? '…' : filteredTx.length.toString()} icon={ShoppingCart} />
        <StatCard title="Avg Order" value={isLoading ? '…' : `₹${avgOrder.toFixed(0)}`} icon={TrendingUp} />
        <StatCard title="Days Active" value={isLoading ? '…' : daysActive.toString()} icon={TrendingUp} />
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
        <h2 className="font-semibold mb-4">Revenue Trend</h2>
        {typeof window !== 'undefined' && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
              <Tooltip formatter={(v) => [`₹${Number(v).toFixed(2)}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={2.5} dot={{ fill: '#F97316', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No data for this period</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie chart */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <h2 className="font-semibold mb-4">Payment Methods</h2>
          {typeof window !== 'undefined' && pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `₹${Number(v).toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No payment data</div>
          )}
        </div>

        {/* Top products */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <h2 className="font-semibold mb-4">Top Products</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No sales data</p>
          ) : (
            <div className="space-y-2">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.qty} units sold</p>
                  </div>
                  <span className="text-sm font-bold">₹{p.revenue.toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
