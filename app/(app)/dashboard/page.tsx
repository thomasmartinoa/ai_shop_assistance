'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, Package, AlertTriangle, ShoppingCart } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/hooks/useTransactions';
import { useProducts } from '@/hooks/useProducts';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { getSupabaseClient } from '@/lib/supabase/client';

interface RecentTx {
  id: string;
  total: number;
  payment_method: string;
  created_at: string;
  items: Array<{ name?: string; product_name?: string; quantity: number; total: number }>;
}

interface ChartPoint {
  date: string;
  revenue: number;
}

export default function DashboardPage() {
  const { shop } = useAuth();
  const { stats, isLoading: txLoading } = useTransactions(shop?.id, 'today');
  const { products, isLoading: prodLoading } = useProducts({ shopId: shop?.id });

  const [recentTx, setRecentTx] = useState<RecentTx[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [txFetching, setTxFetching] = useState(false);

  useEffect(() => {
    if (!shop?.id) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let cancelled = false;
    setTxFetching(true);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    (async () => {
      try {
        const { data } = await supabase
          .from('transactions')
          .select('id, total, payment_method, created_at, items')
          .eq('shop_id', shop.id)
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(100);

        if (cancelled) return;
        const rows = (data ?? []) as RecentTx[];
        setRecentTx(rows.slice(0, 5));

        const days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d;
        });
        const points: ChartPoint[] = days.map((day) => {
          const dayStr = day.toDateString();
          const revenue = rows
            .filter((t) => new Date(t.created_at).toDateString() === dayStr)
            .reduce((sum, t) => sum + Number(t.total), 0);
          return {
            date: day.toLocaleDateString('en-IN', { weekday: 'short' }),
            revenue,
          };
        });
        setChartData(points);
      } finally {
        if (!cancelled) setTxFetching(false);
      }
    })();

    return () => { cancelled = true; };
  }, [shop?.id]);

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.is_active && p.stock <= (p.min_stock ?? 0)),
    [products]
  );
  const activeProducts = useMemo(() => products.filter((p) => p.is_active), [products]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-bold text-foreground">
          {greeting}, <span className="text-primary">{shop?.name || 'Shopkeeper'}</span> 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Here&apos;s what&apos;s happening today</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Revenue"
          value={txLoading ? '…' : `₹${stats.sales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Transactions"
          value={txLoading ? '…' : stats.orders.toString()}
          icon={ShoppingCart}
        />
        <StatCard
          title="Low Stock"
          value={prodLoading ? '…' : lowStockProducts.length.toString()}
          icon={AlertTriangle}
          variant={lowStockProducts.length > 0 ? 'warning' : 'default'}
        />
        <StatCard
          title="Active Products"
          value={prodLoading ? '…' : activeProducts.length.toString()}
          icon={Package}
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
        <h2 className="font-semibold mb-4">Revenue — Last 7 Days</h2>
        {txFetching ? (
          <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
            Loading chart…
          </div>
        ) : typeof window !== 'undefined' ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip formatter={(v) => [`₹${Number(v).toFixed(2)}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={2} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Low Stock Panel */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Low Stock Alerts</h2>
            <Link href="/inventory" className="text-xs text-primary hover:underline">View All</Link>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">✓ All products adequately stocked</p>
          ) : (
            <div className="space-y-2">
              {lowStockProducts.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{p.name_en}</p>
                    <p className="text-xs text-muted-foreground">{p.name_ml}</p>
                  </div>
                  <Badge variant="warning">{p.stock} {p.unit}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Recent Transactions</h2>
            <Link href="/billing" className="text-xs text-primary hover:underline">New Bill</Link>
          </div>
          {recentTx.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No transactions in the last 7 days</p>
          ) : (
            <div className="space-y-2">
              {recentTx.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">₹{Number(tx.total).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      {' · '}
                      {new Date(tx.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      {Array.isArray(tx.items) ? ` · ${tx.items.length} item${tx.items.length !== 1 ? 's' : ''}` : ''}
                    </p>
                  </div>
                  <Badge variant={tx.payment_method === 'upi' ? 'default' : 'secondary'}>
                    {tx.payment_method === 'upi' ? 'UPI' : 'Cash'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
