'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Product } from '@/types/database';

// Demo products for testing without Supabase
const DEMO_PRODUCTS: Product[] = [
  {
    id: 'demo-1',
    shop_id: 'demo-shop-id',
    name_en: 'Rice',
    name_ml: 'അരി',
    category: 'groceries',
    price: 55,
    cost_price: 50,
    unit: 'kg',
    stock: 100,
    min_stock: 10,
    gst_rate: 0,
    aliases: ['ari', 'chawal', 'rice'],
    shelf_location: 'A1',
    barcode: null,
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    shop_id: 'demo-shop-id',
    name_en: 'Sugar',
    name_ml: 'പഞ്ചസാര',
    category: 'groceries',
    price: 45,
    cost_price: 40,
    unit: 'kg',
    stock: 50,
    min_stock: 5,
    gst_rate: 5,
    aliases: ['panchara', 'cheeni', 'sugar'],
    shelf_location: 'A2',
    barcode: null,
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    shop_id: 'demo-shop-id',
    name_en: 'Coconut Oil',
    name_ml: 'വെളിച്ചെണ്ണ',
    category: 'oils',
    price: 180,
    cost_price: 160,
    unit: 'litre',
    stock: 30,
    min_stock: 5,
    gst_rate: 5,
    aliases: ['velichenna', 'coconut oil', 'naalikera enna'],
    shelf_location: 'B1',
    barcode: null,
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-4',
    shop_id: 'demo-shop-id',
    name_en: 'Tea Powder',
    name_ml: 'ചായപ്പൊടി',
    category: 'beverages',
    price: 280,
    cost_price: 250,
    unit: 'kg',
    stock: 20,
    min_stock: 3,
    gst_rate: 5,
    aliases: ['chaya', 'tea', 'chai'],
    shelf_location: 'C1',
    barcode: null,
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-5',
    shop_id: 'demo-shop-id',
    name_en: 'Milk',
    name_ml: 'പാൽ',
    category: 'dairy',
    price: 55,
    cost_price: 50,
    unit: 'litre',
    stock: 25,
    min_stock: 10,
    gst_rate: 0,
    aliases: ['paal', 'milk', 'ksheeram'],
    shelf_location: 'D1',
    barcode: null,
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-6',
    shop_id: 'demo-shop-id',
    name_en: 'Wheat Flour',
    name_ml: 'ഗോതമ്പ് പൊടി',
    category: 'groceries',
    price: 42,
    cost_price: 38,
    unit: 'kg',
    stock: 40,
    min_stock: 10,
    gst_rate: 0,
    aliases: ['gothambu', 'atta', 'wheat', 'maida'],
    shelf_location: 'A3',
    barcode: null,
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-7',
    shop_id: 'demo-shop-id',
    name_en: 'Salt',
    name_ml: 'ഉപ്പ്',
    category: 'groceries',
    price: 20,
    cost_price: 15,
    unit: 'kg',
    stock: 60,
    min_stock: 10,
    gst_rate: 0,
    aliases: ['uppu', 'salt', 'namak'],
    shelf_location: 'A4',
    barcode: null,
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-8',
    shop_id: 'demo-shop-id',
    name_en: 'Soap',
    name_ml: 'സോപ്പ്',
    category: 'personal-care',
    price: 35,
    cost_price: 28,
    unit: 'piece',
    stock: 100,
    min_stock: 20,
    gst_rate: 18,
    aliases: ['soap', 'sabun', 'soppu'],
    shelf_location: 'E1',
    barcode: null,
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

interface UseProductsOptions {
  shopId?: string;
}

/**
 * Calculate fuzzy match score between two strings
 * Higher score = better match (0-1)
 */
function fuzzyMatch(needle: string, haystack: string): number {
  needle = needle.toLowerCase().trim();
  haystack = haystack.toLowerCase().trim();

  // Exact match
  if (haystack === needle) return 1;
  
  // Contains match
  if (haystack.includes(needle)) return 0.9;
  if (needle.includes(haystack)) return 0.8;

  // Start match
  if (haystack.startsWith(needle)) return 0.85;

  // Character-by-character match
  let score = 0;
  let needleIdx = 0;
  
  for (let i = 0; i < haystack.length && needleIdx < needle.length; i++) {
    if (haystack[i] === needle[needleIdx]) {
      score++;
      needleIdx++;
    }
  }
  
  return needleIdx === needle.length ? score / needle.length * 0.7 : 0;
}

/**
 * Search for product by name, Malayalam name, or alias
 */
function searchProduct(products: Product[], query: string): Product | null {
  if (!query || query.length < 2) return null;

  let bestMatch: Product | null = null;
  let bestScore = 0;

  for (const product of products) {
    // Check English name
    let score = fuzzyMatch(query, product.name_en);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = product;
    }

    // Check Malayalam name
    if (product.name_ml) {
      score = fuzzyMatch(query, product.name_ml);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = product;
      }
    }

    // Check aliases
    if (product.aliases) {
      for (const alias of product.aliases) {
        score = fuzzyMatch(query, alias);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = product;
        }
      }
    }
  }

  // Only return if score is above threshold
  return bestScore > 0.5 ? bestMatch : null;
}

export function useProducts({ shopId }: UseProductsOptions = {}) {
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createClient();
  const isDemoMode = supabase === null;

  /**
   * Load products from Supabase or use demo products
   */
  const loadProducts = useCallback(async () => {
    if (isDemoMode || !shopId) {
      setProducts(DEMO_PRODUCTS);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopId)
        .order('name');

      if (supabaseError) throw supabaseError;
      setProducts(data || []);
    } catch (err) {
      console.error('Error loading products:', err);
      setError(err as Error);
      setProducts(DEMO_PRODUCTS); // Fallback to demo
    } finally {
      setIsLoading(false);
    }
  }, [isDemoMode, shopId, supabase]);

  /**
   * Search for a product by name/alias
   */
  const findProduct = useCallback(
    (query: string): Product | null => {
      return searchProduct(products, query);
    },
    [products]
  );

  /**
   * Get all products
   */
  const getAllProducts = useCallback(() => products, [products]);

  /**
   * Get products with low stock
   */
  const getLowStockProducts = useCallback(
    () => products.filter((p) => p.stock <= (p.min_stock || 0)),
    [products]
  );

  /**
   * Add a new product (demo mode just updates local state)
   */
  const addProduct = useCallback(
    async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
      if (isDemoMode) {
        const newProduct: Product = {
          ...product,
          id: `demo-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProducts((prev) => [...prev, newProduct]);
        return { data: newProduct, error: null };
      }

      try {
        const { data, error: supabaseError } = await supabase!
          .from('products')
          .insert(product)
          .select()
          .single();

        if (supabaseError) throw supabaseError;
        if (data) {
          setProducts((prev) => [...prev, data]);
        }
        return { data, error: null };
      } catch (err) {
        console.error('Error adding product:', err);
        return { data: null, error: err as Error };
      }
    },
    [isDemoMode, supabase]
  );

  /**
   * Update product stock
   */
  const updateStock = useCallback(
    async (productId: string, newStock: number) => {
      if (isDemoMode) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? { ...p, stock: newStock, updated_at: new Date().toISOString() }
              : p
          )
        );
        return { error: null };
      }

      try {
        const { error: supabaseError } = await supabase!
          .from('products')
          .update({ stock: newStock, updated_at: new Date().toISOString() })
          .eq('id', productId);

        if (supabaseError) throw supabaseError;
        
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? { ...p, stock: newStock, updated_at: new Date().toISOString() }
              : p
          )
        );
        return { error: null };
      } catch (err) {
        console.error('Error updating stock:', err);
        return { error: err as Error };
      }
    },
    [isDemoMode, supabase]
  );

  return {
    products,
    isLoading,
    error,
    isDemoMode,
    loadProducts,
    findProduct,
    getAllProducts,
    getLowStockProducts,
    addProduct,
    updateStock,
  };
}
