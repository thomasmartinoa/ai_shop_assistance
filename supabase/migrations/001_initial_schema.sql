-- =====================================================
-- Shopkeeper AI Assistant - Database Schema
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SHOPS TABLE
-- Store information for each shopkeeper
-- =====================================================
CREATE TABLE IF NOT EXISTS shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    name_ml TEXT,                    -- Malayalam name
    address TEXT,
    phone TEXT,
    upi_id TEXT,                     -- merchant@upi format
    gstin TEXT,                      -- GST number (optional)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PRODUCTS TABLE
-- Inventory for each shop
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
    name_en TEXT NOT NULL,           -- English name
    name_ml TEXT NOT NULL,           -- Malayalam name (for voice matching)
    aliases TEXT[] DEFAULT '{}',     -- Alternative names/pronunciations
    price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2),        -- For profit calculation
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 5,     -- Low stock alert threshold
    unit TEXT DEFAULT 'piece',       -- piece, kg, liter, etc.
    gst_rate DECIMAL(4,2) DEFAULT 0, -- GST percentage (0, 5, 12, 18, 28)
    category TEXT,
    shelf_location TEXT,             -- "Aisle 2, Shelf 3"
    barcode TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TRANSACTIONS TABLE
-- Sales records
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
    items JSONB NOT NULL,            -- [{product_id, name, qty, price, gst}]
    subtotal DECIMAL(10,2) NOT NULL,
    gst_amount DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    payment_method TEXT DEFAULT 'cash', -- cash, upi, card, credit
    payment_status TEXT DEFAULT 'completed',
    customer_phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Products
CREATE INDEX IF NOT EXISTS idx_products_shop ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_name_ml ON products(name_ml);
CREATE INDEX IF NOT EXISTS idx_products_name_en ON products(name_en);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- Transactions
CREATE INDEX IF NOT EXISTS idx_transactions_shop ON transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_payment ON transactions(payment_method);

-- Shops
CREATE INDEX IF NOT EXISTS idx_shops_owner ON shops(owner_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SHOPS POLICIES
-- Users can only access their own shop
-- =====================================================

CREATE POLICY "Users can view own shop" ON shops
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can update own shop" ON shops
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own shop" ON shops
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own shop" ON shops
    FOR DELETE USING (auth.uid() = owner_id);

-- =====================================================
-- PRODUCTS POLICIES
-- Access based on shop ownership
-- =====================================================

CREATE POLICY "Users can manage own products" ON products
    FOR ALL USING (
        shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    );

-- =====================================================
-- TRANSACTIONS POLICIES
-- Access based on shop ownership
-- =====================================================

CREATE POLICY "Users can manage own transactions" ON transactions
    FOR ALL USING (
        shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    );

-- =====================================================
-- UPDATED_AT TRIGGER
-- Auto-update the updated_at column
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_shops_updated_at
    BEFORE UPDATE ON shops
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- Run this after creating a test user
-- =====================================================

-- To insert sample data, first get your user ID from auth.users
-- Then run:
/*
INSERT INTO shops (owner_id, name, name_ml, upi_id) VALUES 
    ('YOUR-USER-UUID', 'My Store', 'എന്റെ കട', 'mystore@upi');

-- Get the shop_id from above, then:
INSERT INTO products (shop_id, name_en, name_ml, price, stock, unit, category, shelf_location) VALUES
    ('SHOP-UUID', 'Rice', 'അരി', 50.00, 100, 'kg', 'grocery', 'Aisle 1, Shelf 1'),
    ('SHOP-UUID', 'Sugar', 'പഞ്ചസാര', 45.00, 50, 'kg', 'grocery', 'Aisle 1, Shelf 2'),
    ('SHOP-UUID', 'Soap', 'സോപ്പ്', 35.00, 24, 'piece', 'personal-care', 'Aisle 2, Shelf 1'),
    ('SHOP-UUID', 'Milk', 'പാൽ', 28.00, 20, 'l', 'dairy', 'Cooler'),
    ('SHOP-UUID', 'Tea Powder', 'ചായപ്പൊടി', 180.00, 15, 'pack', 'grocery', 'Aisle 1, Shelf 3'),
    ('SHOP-UUID', 'Coconut Oil', 'വെളിച്ചെണ്ണ', 150.00, 30, 'l', 'grocery', 'Aisle 1, Shelf 4'),
    ('SHOP-UUID', 'Biscuits', 'ബിസ്‌ക്കറ്റ്', 20.00, 48, 'pack', 'snacks', 'Aisle 3, Shelf 1');
*/
