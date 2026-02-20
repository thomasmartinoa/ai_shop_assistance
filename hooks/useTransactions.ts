import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

export type Period = 'today' | 'week' | 'month';

export interface SalesStats {
    sales: number;
    orders: number;
    avgOrder: number;
}

export interface TopProduct {
    name: string;
    qty: number;
    revenue: number;
}

export interface UseTransactionsReturn {
    stats: SalesStats;
    topProducts: TopProduct[];
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

function getPeriodRange(period: Period): { from: string; to: string } {
    const now = new Date();
    const to = now.toISOString();

    let from: Date;
    if (period === 'today') {
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // midnight today
    } else if (period === 'week') {
        from = new Date(now);
        from.setDate(from.getDate() - 7);
    } else {
        from = new Date(now);
        from.setDate(1); // first of the month
    }

    return { from: from.toISOString(), to };
}

const EMPTY_STATS: SalesStats = { sales: 0, orders: 0, avgOrder: 0 };

export function useTransactions(shopId: string | undefined, period: Period): UseTransactionsReturn {
    const [stats, setStats] = useState<SalesStats>(EMPTY_STATS);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tick, setTick] = useState(0);

    const refetch = useCallback(() => setTick((t) => t + 1), []);

    useEffect(() => {
        if (!shopId) {
            setIsLoading(false);
            return;
        }

        const supabase = getSupabaseClient();
        if (!supabase) {
            setIsLoading(false);
            return;
        }

        let cancelled = false;

        async function fetchStats() {
            setIsLoading(true);
            setError(null);

            try {
                const { from, to } = getPeriodRange(period);

                const { data, error: qErr } = await supabase!
                    .from('transactions')
                    .select('total, items')
                    .eq('shop_id', shopId!)
                    .eq('payment_status', 'completed')
                    .gte('created_at', from)
                    .lte('created_at', to);

                if (qErr) throw new Error(qErr.message);
                if (cancelled) return;

                const rows = data ?? [];
                const totalSales = rows.reduce((sum, r) => sum + Number(r.total), 0);
                const orderCount = rows.length;
                const avgOrder = orderCount > 0 ? totalSales / orderCount : 0;

                setStats({ sales: totalSales, orders: orderCount, avgOrder });

                // Aggregate top products from items JSONB array
                const productMap = new Map<string, { qty: number; revenue: number }>();
                for (const row of rows) {
                    const items = (row.items as Array<{
                        product_name?: string;
                        name?: string;
                        quantity: number;
                        total: number;
                    }>) ?? [];
                    for (const item of items) {
                        const name = item.product_name ?? item.name ?? 'Unknown';
                        const existing = productMap.get(name) ?? { qty: 0, revenue: 0 };
                        productMap.set(name, {
                            qty: existing.qty + Number(item.quantity),
                            revenue: existing.revenue + Number(item.total),
                        });
                    }
                }

                const sorted = Array.from(productMap.entries())
                    .map(([name, v]) => ({ name, ...v }))
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 5);

                setTopProducts(sorted);
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Failed to load stats');
                    setStats(EMPTY_STATS);
                    setTopProducts([]);
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        fetchStats();
        return () => { cancelled = true; };
    }, [shopId, period, tick]);

    return { stats, topProducts, isLoading, error, refetch };
}
