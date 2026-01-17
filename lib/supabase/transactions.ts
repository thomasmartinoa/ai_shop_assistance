import { supabase } from './client';

export interface TransactionItem {
  product_id?: string;
  name: string;
  name_ml: string;
  quantity: number;
  unit: string;
  price: number;
  gst_rate: number;
  gst_amount: number;
  total: number;
}

export interface Transaction {
  id?: string;
  shop_id: string;
  items: TransactionItem[];
  subtotal: number;
  gst_amount: number;
  discount: number;
  total: number;
  payment_method: 'cash' | 'upi' | 'card' | 'credit';
  payment_status: 'completed' | 'pending' | 'failed';
  customer_phone?: string;
  notes?: string;
  created_at?: string;
}

export interface SalesStats {
  today: number;
  yesterday: number;
  thisWeek: number;
  lastWeek: number;
  thisMonth: number;
  lastMonth: number;
}

export interface TopProduct {
  product_id: string;
  name: string;
  name_ml: string;
  name_en: string;
  total_quantity: number;
  total_revenue: number;
}

/**
 * Create a new transaction and update inventory
 */
export async function createTransaction(transaction: Transaction): Promise<{ success: boolean; error?: string; transaction_id?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    // Start a transaction (conceptually - Supabase doesn't have explicit transactions in JS client)
    // 1. Insert transaction
    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        shop_id: transaction.shop_id,
        items: transaction.items,
        subtotal: transaction.subtotal,
        gst_amount: transaction.gst_amount,
        discount: transaction.discount,
        total: transaction.total,
        payment_method: transaction.payment_method,
        payment_status: transaction.payment_status,
        customer_phone: transaction.customer_phone,
        notes: transaction.notes,
      })
      .select('id')
      .single();

    if (transactionError) {
      console.error('Transaction insert error:', transactionError);
      return { success: false, error: transactionError.message };
    }

    // 2. Update inventory for each item
    for (const item of transaction.items) {
      if (item.product_id) {
        // Decrement stock
        const { error: updateError } = await supabase.rpc('decrement_product_stock', {
          p_product_id: item.product_id,
          p_quantity: item.quantity,
        });

        // If RPC doesn't exist, fallback to manual update
        if (updateError?.code === '42883') {
          // Get current stock
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single();

          if (product) {
            const newStock = Math.max(0, product.stock - item.quantity);
            await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('id', item.product_id);
          }
        }
      }
    }

    return { 
      success: true, 
      transaction_id: transactionData.id 
    };
  } catch (error) {
    console.error('Transaction creation error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get sales statistics for a shop
 */
export async function getSalesStats(shopId: string): Promise<SalesStats> {
  try {
    if (!supabase) {
      return {
        today: 0,
        yesterday: 0,
        thisWeek: 0,
        lastWeek: 0,
        thisMonth: 0,
        lastMonth: 0,
      };
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - now.getDay()); // Start of current week
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Get today's sales
    const { data: todayData } = await supabase
      .from('transactions')
      .select('total')
      .eq('shop_id', shopId)
      .gte('created_at', todayStart.toISOString())
      .eq('payment_status', 'completed');

    // Get yesterday's sales
    const { data: yesterdayData } = await supabase
      .from('transactions')
      .select('total')
      .eq('shop_id', shopId)
      .gte('created_at', yesterdayStart.toISOString())
      .lt('created_at', todayStart.toISOString())
      .eq('payment_status', 'completed');

    // Get this week's sales
    const { data: thisWeekData } = await supabase
      .from('transactions')
      .select('total')
      .eq('shop_id', shopId)
      .gte('created_at', weekStart.toISOString())
      .eq('payment_status', 'completed');

    // Get last week's sales
    const { data: lastWeekData } = await supabase
      .from('transactions')
      .select('total')
      .eq('shop_id', shopId)
      .gte('created_at', lastWeekStart.toISOString())
      .lt('created_at', weekStart.toISOString())
      .eq('payment_status', 'completed');

    // Get this month's sales
    const { data: thisMonthData } = await supabase
      .from('transactions')
      .select('total')
      .eq('shop_id', shopId)
      .gte('created_at', monthStart.toISOString())
      .eq('payment_status', 'completed');

    // Get last month's sales
    const { data: lastMonthData } = await supabase
      .from('transactions')
      .select('total')
      .eq('shop_id', shopId)
      .gte('created_at', lastMonthStart.toISOString())
      .lte('created_at', lastMonthEnd.toISOString())
      .eq('payment_status', 'completed');

    return {
      today: todayData?.reduce((sum: number, t: any) => sum + Number(t.total), 0) || 0,
      yesterday: yesterdayData?.reduce((sum: number, t: any) => sum + Number(t.total), 0) || 0,
      thisWeek: thisWeekData?.reduce((sum: number, t: any) => sum + Number(t.total), 0) || 0,
      lastWeek: lastWeekData?.reduce((sum: number, t: any) => sum + Number(t.total), 0) || 0,
      thisMonth: thisMonthData?.reduce((sum: number, t: any) => sum + Number(t.total), 0) || 0,
      lastMonth: lastMonthData?.reduce((sum: number, t: any) => sum + Number(t.total), 0) || 0,
    };
  } catch (error) {
    console.error('Error getting sales stats:', error);
    return {
      today: 0,
      yesterday: 0,
      thisWeek: 0,
      lastWeek: 0,
      thisMonth: 0,
      lastMonth: 0,
    };
  }
}

/**
 * Get top selling products
 */
export async function getTopProducts(shopId: string, period: 'today' | 'week' | 'month' = 'today', limit = 10): Promise<TopProduct[]> {
  try {
    if (!supabase) return [];

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const { data: transactions } = await supabase
      .from('transactions')
      .select('items')
      .eq('shop_id', shopId)
      .gte('created_at', startDate.toISOString())
      .eq('payment_status', 'completed');

    if (!transactions) return [];

    // Aggregate products
    const productMap = new Map<string, TopProduct>();

    transactions.forEach((transaction: any) => {
      const items = transaction.items as TransactionItem[];
      items.forEach(item => {
        const key = item.product_id || item.name;
        if (productMap.has(key)) {
          const existing = productMap.get(key)!;
          existing.total_quantity += item.quantity;
          existing.total_revenue += item.total;
        } else {
          productMap.set(key, {
            product_id: item.product_id || '',
            name: item.name,
            name_ml: item.name_ml,
            name_en: item.name, // Fallback to name if name_en not available
            total_quantity: item.quantity,
            total_revenue: item.total,
          });
        }
      });
    });

    // Sort by revenue and return top N
    return Array.from(productMap.values())
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting top products:', error);
    return [];
  }
}

/**
 * Get recent transactions
 */
export async function getRecentTransactions(shopId: string, limit = 50): Promise<Transaction[]> {
  try {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting recent transactions:', error);
    return [];
  }
}
