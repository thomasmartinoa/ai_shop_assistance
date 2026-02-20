'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions, type Period } from '@/hooks/useTransactions';
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  ShoppingCart,
  Calendar,
  Download,
  Loader2,
  AlertCircle,
  PackageOpen,
} from 'lucide-react';

export default function ReportsPage() {
  const { shop, isDemoMode } = useAuth();
  const [period, setPeriod] = useState<Period>('today');
  const { stats, topProducts, isLoading, error } = useTransactions(shop?.id, period);

  const periodLabel = period === 'today' ? 'today' : period === 'week' ? 'this week' : 'this month';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reports</h2>
          <p className="text-muted-foreground">
            Sales analytics and performance metrics
          </p>
        </div>
        <Button variant="outline" disabled>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Demo mode banner */}
      {isDemoMode && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Demo mode — connect Supabase to see real sales data.
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Period selector */}
      <div className="flex gap-2">
        {(['today', 'week', 'month'] as Period[]).map((p) => (
          <Button
            key={p}
            variant={period === p ? 'default' : 'outline'}
            onClick={() => setPeriod(p)}
            className="capitalize"
          >
            {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
          </Button>
        ))}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <IndianRupee className="w-4 h-4" />
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <p className="text-3xl font-bold">{formatCurrency(stats.sales)}</p>
                <p className="text-sm text-muted-foreground mt-1">{periodLabel}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <p className="text-3xl font-bold">{stats.orders}</p>
                <p className="text-sm text-muted-foreground mt-1">transactions completed</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Avg. Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <p className="text-3xl font-bold">{formatCurrency(stats.avgOrder)}</p>
                <p className="text-sm text-muted-foreground mt-1">per transaction</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <PackageOpen className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm">No sales recorded {periodLabel}.</p>
              <p className="text-xs mt-1">Complete some bills to see data here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="font-medium">{product.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.qty} sold
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales chart placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted/50 rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              Chart visualization coming soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
