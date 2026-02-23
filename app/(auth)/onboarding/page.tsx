'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Package, ArrowRight, Check, Loader2, Plus, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ShopData {
  name: string;
  name_ml: string;
  address: string;
  phone: string;
  upi_id: string;
  gstin: string;
}

interface ProductEntry {
  id: string;
  name_en: string;
  name_ml: string;
  price: string;
  unit: string;
  stock: string;
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [shopData, setShopData] = useState<ShopData>({
    name: '', name_ml: '', address: '', phone: '', upi_id: '', gstin: ''
  });
  const [products, setProducts] = useState<ProductEntry[]>([
    { id: '1', name_en: '', name_ml: '', price: '', unit: 'kg', stock: '' }
  ]);
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  async function handleShopSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!shopData.name.trim()) {
      setError('Shop name is required');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const { error: dbError } = await supabase!.from('shops').insert({
        owner_id: user?.id,
        name: shopData.name.trim(),
        name_ml: shopData.name_ml.trim() || null,
        address: shopData.address.trim() || null,
        phone: shopData.phone.trim() || null,
        upi_id: shopData.upi_id.trim() || null,
        gstin: shopData.gstin.trim() || null,
      });
      if (dbError) throw dbError;
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to save shop details');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleInventorySubmit() {
    setIsLoading(true);
    try {
      const { data: shopRow } = await supabase!
        .from('shops')
        .select('id')
        .eq('owner_id', user?.id)
        .single();

      const validProducts = products.filter(p => p.name_en.trim() && p.price);
      if (shopRow && validProducts.length > 0) {
        const { error: dbError } = await supabase!.from('products').insert(
          validProducts.map(p => ({
            shop_id: shopRow.id,
            name_en: p.name_en.trim(),
            name_ml: p.name_ml.trim() || p.name_en.trim(),
            price: parseFloat(p.price) || 0,
            unit: p.unit,
            stock: parseInt(p.stock) || 0,
            min_stock: 5,
            gst_rate: 0,
            is_active: true,
          }))
        );
        if (dbError) throw dbError;
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to save products');
    } finally {
      setIsLoading(false);
    }
  }

  function addProduct() {
    setProducts(prev => [...prev, {
      id: Date.now().toString(),
      name_en: '', name_ml: '', price: '', unit: 'kg', stock: ''
    }]);
  }

  function removeProduct(id: string) {
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  function updateProduct(id: string, field: keyof ProductEntry, value: string) {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/60 to-white">
      {/* Header */}
      <div className="flex flex-col items-center pt-10 pb-6 px-4">
        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20 mb-3">
          <Store className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-xl font-bold">Set Up Your Shop</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {step === 1 ? 'Tell us about your shop' : 'Add your products'}
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center gap-3 mb-8 px-4">
        <div className={cn('flex items-center gap-1.5', step >= 1 ? 'text-primary' : 'text-muted-foreground')}>
          <div className={cn(
            'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold border-2',
            step >= 1 ? 'bg-primary text-white border-primary' : 'border-muted-foreground/30'
          )}>
            {step > 1 ? <Check className="h-3.5 w-3.5" /> : '1'}
          </div>
          <span className="text-sm font-medium">Shop Details</span>
        </div>
        <div className="w-12 h-0.5 bg-border" />
        <div className={cn('flex items-center gap-1.5', step >= 2 ? 'text-primary' : 'text-muted-foreground')}>
          <div className={cn(
            'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold border-2',
            step >= 2 ? 'bg-primary text-white border-primary' : 'border-muted-foreground/30'
          )}>
            2
          </div>
          <span className="text-sm font-medium">Inventory</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-16">
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleShopSubmit} className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Shop Name (English) *</Label>
              <Input id="name" placeholder="e.g. Rajan Stores" value={shopData.name}
                onChange={e => setShopData(d => ({ ...d, name: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name_ml">Shop Name (Malayalam)</Label>
              <Input id="name_ml" placeholder="e.g. രാജൻ സ്റ്റോഴ്സ്" value={shopData.name_ml}
                onChange={e => setShopData(d => ({ ...d, name_ml: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input id="address" placeholder="Shop address" value={shopData.address}
                onChange={e => setShopData(d => ({ ...d, address: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" placeholder="+91 98765 43210" value={shopData.phone}
                onChange={e => setShopData(d => ({ ...d, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="upi">UPI ID</Label>
              <Input id="upi" placeholder="merchant@upi" value={shopData.upi_id}
                onChange={e => setShopData(d => ({ ...d, upi_id: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Used for QR payment generation</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gstin">GSTIN (Optional)</Label>
              <Input id="gstin" placeholder="22AAAAA0000A1Z5" value={shopData.gstin}
                onChange={e => setShopData(d => ({ ...d, gstin: e.target.value }))} />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Continue to Inventory
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Add Products</h2>
                <button onClick={addProduct} className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium">
                  <Plus className="h-4 w-4" /> Add Row
                </button>
              </div>

              <div className="space-y-3">
                {products.map((product, index) => (
                  <div key={product.id} className="border border-border rounded-xl p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">Product {index + 1}</p>
                      {products.length > 1 && (
                        <button onClick={() => removeProduct(product.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Name (English)" value={product.name_en}
                        onChange={e => updateProduct(product.id, 'name_en', e.target.value)} />
                      <Input placeholder="Name (Malayalam)" value={product.name_ml}
                        onChange={e => updateProduct(product.id, 'name_ml', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input placeholder="Price ₹" type="number" value={product.price}
                        onChange={e => updateProduct(product.id, 'price', e.target.value)} />
                      <select
                        value={product.unit}
                        onChange={e => updateProduct(product.id, 'unit', e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="kg">kg</option>
                        <option value="piece">piece</option>
                        <option value="litre">litre</option>
                        <option value="gram">gram</option>
                        <option value="pack">pack</option>
                      </select>
                      <Input placeholder="Stock" type="number" value={product.stock}
                        onChange={e => updateProduct(product.id, 'stock', e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={handleInventorySubmit} size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Package className="mr-2 h-4 w-4" />}
                Complete Setup
              </Button>
              <Button variant="ghost" onClick={() => router.push('/dashboard')} className="w-full text-muted-foreground">
                Skip for now
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
