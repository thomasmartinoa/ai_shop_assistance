/**
 * Database types generated from Supabase schema
 * Update this file when schema changes
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      shops: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          name_ml: string | null;
          address: string | null;
          phone: string | null;
          upi_id: string | null;
          gstin: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          name_ml?: string | null;
          address?: string | null;
          phone?: string | null;
          upi_id?: string | null;
          gstin?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          name_ml?: string | null;
          address?: string | null;
          phone?: string | null;
          upi_id?: string | null;
          gstin?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          shop_id: string;
          name_en: string;
          name_ml: string;
          aliases: string[] | null;
          price: number;
          cost_price: number | null;
          stock: number;
          min_stock: number;
          unit: string;
          gst_rate: number;
          category: string | null;
          shelf_location: string | null;
          barcode: string | null;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          name_en: string;
          name_ml: string;
          aliases?: string[] | null;
          price: number;
          cost_price?: number | null;
          stock?: number;
          min_stock?: number;
          unit?: string;
          gst_rate?: number;
          category?: string | null;
          shelf_location?: string | null;
          barcode?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          name_en?: string;
          name_ml?: string;
          aliases?: string[] | null;
          price?: number;
          cost_price?: number | null;
          stock?: number;
          min_stock?: number;
          unit?: string;
          gst_rate?: number;
          category?: string | null;
          shelf_location?: string | null;
          barcode?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          shop_id: string;
          items: TransactionItem[];
          subtotal: number;
          gst_amount: number;
          discount: number;
          total: number;
          payment_method: string;
          payment_status: string;
          customer_phone: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          items: TransactionItem[];
          subtotal: number;
          gst_amount?: number;
          discount?: number;
          total: number;
          payment_method?: string;
          payment_status?: string;
          customer_phone?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          items?: TransactionItem[];
          subtotal?: number;
          gst_amount?: number;
          discount?: number;
          total?: number;
          payment_method?: string;
          payment_status?: string;
          customer_phone?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Helper types
export interface TransactionItem {
  product_id: string;
  name: string;
  name_ml: string;
  quantity: number;
  unit: string;
  price: number;
  gst_rate: number;
  gst_amount: number;
  total: number;
}

export type Shop = Database['public']['Tables']['shops']['Row'];
export type ShopInsert = Database['public']['Tables']['shops']['Insert'];
export type ShopUpdate = Database['public']['Tables']['shops']['Update'];

export type Product = Database['public']['Tables']['products']['Row'];
export type ProductInsert = Database['public']['Tables']['products']['Insert'];
export type ProductUpdate = Database['public']['Tables']['products']['Update'];

export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];
