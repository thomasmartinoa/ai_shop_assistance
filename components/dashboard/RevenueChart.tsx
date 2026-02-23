'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getSupabaseClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';

interface RevenueChartProps {
  shopId: string;
}

interface DayRevenue {
  date: string;
  revenue: number;
}

export function RevenueChart({ shopId }: RevenueChartProps) {
  const [days, setDays] = useState<7 | 30>(7);
  const [data, setData] = useState<DayRevenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!shopId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchRevenue() {
      setIsLoading(true);
      const supabase = getSupabaseClient();
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const { data: rows, error } = await supabase
        .from('transactions')
        .select('created_at, total')
        .eq('shop_id', shopId)
        .eq('payment_status', 'completed')
        .gte('created_at', fromDate.toISOString())
        .order('created_at', { ascending: true });

      if (cancelled) return;

      if (error || !rows) {
        setData([]);
        setIsLoading(false);
        return;
      }

      // Group by date
      const map = new Map<string, number>();
      for (const row of rows) {
        const date = new Date(row.created_at).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
        });
        map.set(date, (map.get(date) ?? 0) + Number(row.total));
      }

      setData(Array.from(map.entries()).map(([date, revenue]) => ({ date, revenue })));
      setIsLoading(false);
    }

    fetchRevenue();
    return () => { cancelled = true; };
  }, [shopId, days]);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-gray-400" />
          <h3 className="text-base font-semibold text-gray-900">Revenue Overview</h3>
        </div>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5">
          {([7, 30] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                days === d
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-[300px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-[300px] flex-col items-center justify-center text-gray-400">
          <BarChart3 className="h-12 w-12 mb-2" />
          <p className="text-sm">No data yet</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F97316" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#F97316" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '0.75rem',
                border: '1px solid #E5E7EB',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)',
              }}
              formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#F97316"
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
