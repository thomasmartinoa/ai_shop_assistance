'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions, type Period, type Transaction } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/utils';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
  DollarSign, ShoppingBag, TrendingUp, Download, FileText, Loader2,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

function getItemName(item: Transaction['items'][number]): string {
  return item.product_name || item.name || item.name_en || 'Unknown';
}

const PIE_COLORS: Record<string, string> = {
  cash: '#22C55E',
  upi: '#3B82F6',
  card: '#A855F7',
  credit: '#F97316',
};

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`rounded-xl bg-gray-200 animate-pulse ${className ?? ''}`} />;
}

export default function ReportsPage() {
  const { shop } = useAuth();
  const [tab, setTab] = useState('today');

  const period: Period | undefined = tab === 'year' ? undefined : (tab as Period);
  const { transactions, stats, topProducts, isLoading } = useTransactions(shop?.id, period);

  // Revenue trend chart data
  const chartData = useMemo(() => {
    const grouped = new Map<string, number>();
    transactions.forEach((t) => {
      const date = new Date(t.created_at).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      });
      grouped.set(date, (grouped.get(date) || 0) + Number(t.total));
    });
    return Array.from(grouped, ([date, revenue]) => ({ date, revenue }));
  }, [transactions]);

  // Payment method distribution
  const paymentData = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    transactions.forEach((t) => {
      const method = t.payment_method || 'cash';
      const existing = map.get(method) || { count: 0, total: 0 };
      map.set(method, { count: existing.count + 1, total: existing.total + Number(t.total) });
    });
    return Array.from(map, ([name, v]) => ({
      name: name.toUpperCase(),
      value: v.total,
      count: v.count,
      key: name,
    }));
  }, [transactions]);

  const maxRevenue = useMemo(
    () => Math.max(...topProducts.map((p) => p.revenue), 1),
    [topProducts],
  );

  function exportCSV() {
    const headers = ['Date', 'Items', 'Subtotal', 'GST', 'Total', 'Payment', 'Status'];
    const rows = transactions.map((t) => [
      new Date(t.created_at).toLocaleString(),
      (t.items || []).map((i) => getItemName(i)).join('; '),
      t.subtotal ?? t.total,
      t.gst_amount ?? 0,
      t.total,
      t.payment_method,
      t.payment_status ?? 'completed',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-page p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports &amp; Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Insights into your business</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF} className="gap-2">
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Period Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="year">This Year</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Stats Row */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SkeletonBlock className="h-28" />
          <SkeletonBlock className="h-28" />
          <SkeletonBlock className="h-28" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.sales)}
            icon={DollarSign}
            bgColor="#FFF3E0"
            iconColor="#F97316"
          />
          <StatCard
            title="Total Orders"
            value={String(stats.orders)}
            icon={ShoppingBag}
            bgColor="#E8F5E9"
            iconColor="#22C55E"
          />
          <StatCard
            title="Avg Order Value"
            value={formatCurrency(stats.avgOrder)}
            icon={TrendingUp}
            bgColor="#E3F2FD"
            iconColor="#3B82F6"
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Trend */}
        <Card className="lg:col-span-2 border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Revenue Trend</h3>
            {isLoading ? (
              <SkeletonBlock className="h-[300px]" />
            ) : chartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
                No transactions in this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#F97316"
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Payment Methods</h3>
            {isLoading ? (
              <SkeletonBlock className="h-[300px]" />
            ) : paymentData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
                No data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {paymentData.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={PIE_COLORS[entry.key] || '#94A3B8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card className="border-gray-100 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Top Selling Products</h3>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <SkeletonBlock key={i} className="h-10" />
              ))}
            </div>
          ) : topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No product data available</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="w-32 hidden sm:table-cell" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.slice(0, 10).map((product, idx) => (
                  <TableRow key={product.name}>
                    <TableCell className="font-medium text-gray-500">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right">{product.qty}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product.revenue)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Progress
                        value={(product.revenue / maxRevenue) * 100}
                        className="h-2"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
