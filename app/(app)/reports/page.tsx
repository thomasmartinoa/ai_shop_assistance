'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  ShoppingCart,
  Calendar,
  Download,
} from 'lucide-react';

// Mock data
const MOCK_STATS = {
  today: { sales: 4520, orders: 23, avgOrder: 196 },
  week: { sales: 28450, orders: 142, avgOrder: 200 },
  month: { sales: 124800, orders: 623, avgOrder: 200 },
};

const MOCK_TOP_PRODUCTS = [
  { name: 'Rice (അരി)', qty: 120, revenue: 6000 },
  { name: 'Sugar (പഞ്ചസാര)', qty: 85, revenue: 3825 },
  { name: 'Coconut Oil (വെളിച്ചെണ്ണ)', qty: 45, revenue: 6750 },
  { name: 'Tea Powder (ചായപ്പൊടി)', qty: 38, revenue: 6840 },
  { name: 'Soap (സോപ്പ്)', qty: 72, revenue: 2520 },
];

type Period = 'today' | 'week' | 'month';

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>('today');
  const stats = MOCK_STATS[period];

  // Calculate growth (mock)
  const growth = period === 'today' ? 12 : period === 'week' ? 8 : 15;

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
                {growth}% vs last {period}
              </span>
            </div>
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
            <p className="text-3xl font-bold">{stats.orders}</p>
            <p className="text-sm text-muted-foreground mt-1">
              transactions completed
            </p>
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
            <p className="text-3xl font-bold">{formatCurrency(stats.avgOrder)}</p>
            <p className="text-sm text-muted-foreground mt-1">per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Top products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {MOCK_TOP_PRODUCTS.map((product, index) => (
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
