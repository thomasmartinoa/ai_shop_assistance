'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Mic,
  Package,
  TrendingUp,
  AlertCircle,
  IndianRupee,
  ShoppingCart,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { SalesCopilot } from '@/components/copilot/SalesCopilot';
import { useProducts } from '@/hooks/useProducts';

export default function DashboardPage() {
  const { shop } = useAuth();
  const { products } = useProducts();

  // TODO: Fetch actual data from Supabase
  const stats = {
    todaySales: 4520,
    totalOrders: 23,
    lowStockItems: products.filter(p => p.stock <= p.min_stock).length || 5,
    topProduct: 'Rice (അരി)',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back{shop?.name ? `, ${shop.name}` : ''}! Here's what's happening with your shop today.
        </p>
      </div>

      {/* Quick action - Voice Billing */}
      <Link href="/billing">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-colors">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <Mic className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Start Voice Billing</h3>
                <p className="text-blue-100">Tap to start billing with voice</p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6" />
          </CardContent>
        </Card>
      </Link>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <IndianRupee className="w-4 h-4" />
              Today's Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.todaySales)}
            </p>
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
            <p className="text-2xl font-bold">{stats.totalOrders}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-500">
              {stats.lowStockItems}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Top Seller
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold truncate">{stats.topProduct}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/inventory">
          <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
            <Package className="w-6 h-6" />
            <span>Manage Inventory</span>
          </Button>
        </Link>
        <Link href="/reports">
          <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
            <TrendingUp className="w-6 h-6" />
            <span>View Reports</span>
          </Button>
        </Link>
      </div>

      {/* Shop setup prompt if no shop */}
      {!shop && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="flex items-center gap-4 p-4">
            <AlertCircle className="w-6 h-6 text-orange-500 shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Complete Your Shop Setup</p>
              <p className="text-sm text-muted-foreground">
                Add your shop details to start using all features.
              </p>
            </div>
            <Link href="/settings">
              <Button size="sm">Setup</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* AI Sales Copilot */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Sales Copilot</h3>
        <SalesCopilot products={products} />
      </div>
    </div>
  );
}
