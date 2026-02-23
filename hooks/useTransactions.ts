import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

export interface Transaction {
    id: string;
    created_at: string;
    total: number;
    payment_method: string;
    items: Array<{
        product_name?: string;
        name?: string;
        name_en?: string;
        quantity?: number;
        qty?: number;
        unit?: string;
        unit_price?: number;
        price?: number;
        total?: number;
    }>;
}

export interface UseTransactionsReturn {
    transactions: Transaction[];
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
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'week') {
        from = new Date(now);
        from.setDate(from.getDate() - 7);
    } else {
        from = new Date(now);
        from.setDate(1);
    }

    return { from: from.toISOString(), to };
}

const EMPTY_STATS: SalesStats = { sales: 0, orders: 0, avgOrder: 0 };

export function useTransactions(shopId?: string, period?: Period): UseTransactionsReturn {
    const { shop } = useAuth();
    const resolvedShopId = shopId ?? shop?.id;

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<SalesStats>(EMPTY_STATS);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tick, setTick] = useState(0);

    const refetch = useCallback(() => setTick((t) => t + 1), []);

    useEffect(() => {
        if (!resolvedShopId) {
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
                let query = supabase!
                    .from('transactions')
                    .select('id, created_at, total, items, payment_method')
                    .eq('shop_id', resolvedShopId!)
                    .eq('payment_status', 'completed')
                    .order('created_at', { ascending: false });

                if (period) {
                    const { from, to } = getPeriodRange(period);
                    query = query.gte('created_at', from).lte('created_at', to);
                } else {
                    // Fetch last 365 days when no period specified
                    const yearAgo = new Date();
                    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                    query = query.gte('created_at', yearAgo.toISOString());
                }

                const { data, error: qErr } = await query;

                if (qErr) throw new Error(qErr.message);
                if (cancelled) return;

                const rows = (data ?? []) as Transaction[];
                setTransactions(rows);

                const totalSales = rows.reduce((sum, r) => sum + Number(r.total), 0);
                const orderCount = rows.length;
                const avgOrder = orderCount > 0 ? totalSales / orderCount : 0;
                setStats({ sales: totalSales, orders: orderCount, avgOrder });

                // Aggregate top products from items JSONB array
                const productMap = new Map<string, { qty: number; revenue: number }>();
                for (const row of rows) {
                    const items = row.items ?? [];
                    for (const item of items) {
                        const name = item.product_name ?? item.name ?? 'Unknown';
                        const qty = item.quantity ?? item.qty ?? 0;
                        const revenue = item.total ?? ((item.unit_price ?? item.price ?? 0) * qty);
                        const existing = productMap.get(name) ?? { qty: 0, revenue: 0 };
                        productMap.set(name, {
                            qty: existing.qty + Number(qty),
                            revenue: existing.revenue + Number(revenue),
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
                    setTransactions([]);
                    setStats(EMPTY_STATS);
                    setTopProducts([]);
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        fetchStats();
        return () => { cancelled = true; };
    }, [resolvedShopId, period, tick]);

    return { transactions, stats, topProducts, isLoading, error, refetch };
}
