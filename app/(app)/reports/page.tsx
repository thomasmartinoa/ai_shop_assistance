'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { getSalesStats, getTopProducts, type TopProduct } from '@/lib/supabase/transactions';
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  ShoppingCart,
  Calendar,
  Download,
  Loader2,
} from 'lucide-react';

type Period = 'today' | 'week' | 'month';

export default function ReportsPage() {
  const { shop } = useAuth();
  const [period, setPeriod] = useState<Period>('today');
  const [loading, setLoading] = useState(true);
  const [salesStats, setSalesStats] = useState({
    today: 0,
    yesterday: 0,
    thisWeek: 0,
    lastWeek: 0,
    thisMonth: 0,
    lastMonth: 0,
  });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  // Load sales data
  useEffect(() => {
    if (!shop?.id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [stats, products] = await Promise.all([
          getSalesStats(shop.id),
          getTopProducts(shop.id, period, 5),
        ]);
        setSalesStats(stats);
        setTopProducts(products);
      } catch (error) {
        console.error('Error loading reports:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [shop?.id, period]);

  // Get stats for selected period
  const stats = {
    sales: period === 'today' ? salesStats.today : period === 'week' ? salesStats.thisWeek : salesStats.thisMonth,
    orders: 0, // TODO: Track order counts in transactions
    avgOrder: 0, // TODO: Calculate from transactions
  };

  // Calculate growth
  const getGrowth = () => {
    switch (period) {
      case 'today':
        return salesStats.yesterday > 0 
          ? ((salesStats.today - salesStats.yesterday) / salesStats.yesterday * 100)
          : 0;
      case 'week':
        return salesStats.lastWeek > 0 
          ? ((salesStats.thisWeek - salesStats.lastWeek) / salesStats.lastWeek * 100)
          : 0;
      case 'month':
        return salesStats.lastMonth > 0 
          ? ((salesStats.thisMonth - salesStats.lastMonth) / salesStats.lastMonth * 100)
          : 0;
    }
  };

  const growth = getGrowth();

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
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

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
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold">{formatCurrency(stats.sales)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {growth >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={`text-sm ${
                      growth >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {Math.abs(growth).toFixed(1)}% vs {period === 'today' ? 'yesterday' : period === 'week' ? 'last week' : 'last month'}
                  </span>
                </div>
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
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <p className="text-3xl font-bold">{stats.orders}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  transactions completed
                </p>
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
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
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
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : topProducts.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No sales data available for this period
            </p>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div
                  key={`${product.product_id}-${index}`}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{product.name_ml}</p>
                      <p className="text-xs text-muted-foreground">{product.name_en}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(product.total_revenue)}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.total_quantity} sold
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
          <div className="h-64 bg-muted/50 rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">
              Chart visualization coming soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
