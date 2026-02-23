'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions, type Period, type Transaction } from '@/hooks/useTransactions';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  Download, Search, Receipt, IndianRupee, ShoppingCart, TrendingUp,
  ChevronDown, ChevronUp, Loader2,
} from 'lucide-react';

function getItemName(item: Transaction['items'][number]): string {
  return item.product_name || item.name || item.name_en || 'Unknown';
}

function getItemSummary(items: Transaction['items']): string {
  if (!items || items.length === 0) return 'No items';
  const names = items.map(getItemName);
  if (names.length <= 2) return names.join(', ');
  return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
}

export default function BillingPage() {
  const { shop } = useAuth();
  const [period, setPeriod] = useState<Period | undefined>('today');
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { transactions, stats, isLoading } = useTransactions(shop?.id, period);

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) =>
        (t.items || []).some((i) => getItemName(i).toLowerCase().includes(q))
      );
    }
    if (paymentFilter !== 'all') {
      result = result.filter((t) => t.payment_method === paymentFilter);
    }
    return result;
  }, [transactions, search, paymentFilter]);

  function exportCSV() {
    const headers = ['Date', 'Items', 'Subtotal', 'GST', 'Total', 'Payment', 'Status'];
    const rows = filteredTransactions.map((t) => [
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
    a.download = `sales-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const periodKey = period ?? 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales History</h1>
          <p className="text-gray-500 text-sm mt-1">Track all your transactions</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Period Tabs */}
      <Tabs value={periodKey} onValueChange={(v) => setPeriod(v === 'all' ? undefined : (v as Period))}>
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Methods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="upi">UPI</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-green-50 p-2.5">
              <IndianRupee className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Sales</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.sales)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-50 p-2.5">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Orders</p>
              <p className="text-lg font-bold text-gray-900">{stats.orders}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-purple-50 p-2.5">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Average</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.avgOrder)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p className="text-sm">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Receipt className="h-12 w-12 mb-3" />
              <p className="font-medium text-gray-600">No sales found</p>
              <p className="text-sm mt-1">
                {search ? 'Try a different search term' : 'Sales will appear here once you complete transactions'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Date &amp; Time</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right w-[120px]">Amount</TableHead>
                  <TableHead className="w-[100px]">Payment</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[40px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((t) => {
                  const isExpanded = expandedId === t.id;
                  const status = t.payment_status || 'completed';
                  return (
                    <TableRow
                      key={t.id}
                      className="cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : t.id)}
                    >
                      <TableCell>
                        <div className="text-sm font-medium">{formatDate(t.created_at)}</div>
                        <div className="text-xs text-gray-400">{formatTime(t.created_at)}</div>
                      </TableCell>
                      <TableCell>
                        {isExpanded ? (
                          <div className="space-y-1">
                            {(t.items || []).map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>
                                  {getItemName(item)} × {item.quantity ?? item.qty ?? 1}
                                </span>
                                <span className="text-gray-500">
                                  {formatCurrency(item.total ?? 0)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm">{getItemSummary(t.items)}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(t.total)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            t.payment_method === 'upi'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-green-50 text-green-700 border-green-200'
                          }
                        >
                          {t.payment_method === 'upi' ? 'UPI' : 'Cash'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            status === 'completed'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }
                        >
                          {status === 'completed' ? 'Completed' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
