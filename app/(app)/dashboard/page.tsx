'use client';

import { DollarSign, ShoppingBag, Package, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSharedProducts } from '@/contexts/ProductsContext';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/utils';
import { StatCard } from '@/components/dashboard/StatCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { TopProducts } from '@/components/dashboard/TopProducts';

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 animate-pulse">
      <div className="h-10 w-10 rounded-xl bg-gray-200" />
      <div className="mt-3 h-7 w-24 rounded bg-gray-200" />
      <div className="mt-2 h-4 w-16 rounded bg-gray-100" />
    </div>
  );
}

export default function DashboardPage() {
  const { shop } = useAuth();
  const { products, getLowStockProducts, isLoading: productsLoading } = useSharedProducts();
  const { stats, topProducts, transactions, isLoading: statsLoading } = useTransactions(shop?.id, 'today');

  const lowStock = getLowStockProducts();
  const isLoading = productsLoading || statsLoading;

  return (
    <div className="min-h-screen bg-page p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {shop?.name || 'Your Shop'} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s what&apos;s happening in your store today
        </p>
      </div>

      {/* Stat Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Revenue"
            value={formatCurrency(stats.sales)}
            icon={DollarSign}
            bgColor="#FFF3E0"
            iconColor="#F97316"
          />
          <StatCard
            title="Orders"
            value={String(stats.orders)}
            icon={ShoppingBag}
            bgColor="#E8F5E9"
            iconColor="#22C55E"
          />
          <StatCard
            title="Products"
            value={String(products.length)}
            icon={Package}
            bgColor="#F3E5F5"
            iconColor="#A855F7"
          />
          <StatCard
            title="Avg Order"
            value={formatCurrency(stats.avgOrder)}
            icon={TrendingUp}
            bgColor="#E3F2FD"
            iconColor="#3B82F6"
          />
        </div>
      )}

      {/* Chart + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueChart shopId={shop?.id ?? ''} />
        </div>
        <LowStockAlert products={lowStock} />
      </div>

      {/* Recent Transactions + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentTransactions transactions={transactions} isLoading={statsLoading} />
        <TopProducts topProducts={topProducts} />
      </div>
    </div>
  );
}
