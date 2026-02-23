'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useProducts } from '@/hooks/useProducts';
import type { Product } from '@/types/database';

type ProductsContextType = ReturnType<typeof useProducts>;

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const { shop } = useAuth();
  const products = useProducts({ shopId: shop?.id });

  return (
    <ProductsContext.Provider value={products}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useSharedProducts(): ProductsContextType {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error('useSharedProducts must be used within a ProductsProvider');
  }
  return context;
}
