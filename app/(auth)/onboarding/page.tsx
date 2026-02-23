'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/shared/Toast';
import { UNIT_TYPES } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  Store, Package, CheckCircle, ArrowRight, ArrowLeft,
  Plus, X, Loader2, ShoppingBag,
} from 'lucide-react';

interface ShopForm {
  name: string;
  name_ml: string;
  address: string;
  phone: string;
  upi_id: string;
}

interface LocalProduct {
  id: string;
  name_en: string;
  price: number;
  stock: number;
  unit: string;
}

const STEPS = ['Shop Details', 'Add Products', 'Done'] as const;

function StepIndicator({ current, completed }: { current: number; completed: number[] }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((label, idx) => {
        const isCompleted = completed.includes(idx);
        const isActive = idx === current;
        return (
          <div key={label} className="flex items-center">
            {idx > 0 && (
              <div
                className={`w-12 sm:w-20 h-0.5 ${
                  isCompleted || isActive ? 'bg-orange-400' : 'bg-gray-200'
                }`}
              />
            )}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold transition-colors ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? <CheckCircle className="h-5 w-5" /> : idx + 1}
              </div>
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  isActive ? 'text-orange-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, shop, isLoading, isAuthenticated, refreshShop } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [newShopId, setNewShopId] = useState<string | null>(null);

  const [shopForm, setShopForm] = useState<ShopForm>({
    name: '',
    name_ml: '',
    address: '',
    phone: '',
    upi_id: '',
  });

  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [productForm, setProductForm] = useState({
    name_en: '',
    price: '',
    stock: '',
    unit: 'piece',
  });

  // Auth guards
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isLoading && shop) {
      router.replace('/dashboard');
    }
  }, [isLoading, shop, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!isAuthenticated || shop) return null;

  const completedSteps = Array.from({ length: step }, (_, i) => i);

  async function handleShopSubmit() {
    if (!shopForm.name.trim()) {
      toast.error('Shop name is required');
      return;
    }

    const supabase = createClient();
    if (!supabase || !user) {
      toast.error('Not connected to database');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('shops')
        .insert({
          owner_id: user.id,
          name: shopForm.name.trim(),
          name_ml: shopForm.name_ml.trim() || null,
          address: shopForm.address.trim() || null,
          phone: shopForm.phone.trim() || null,
          upi_id: shopForm.upi_id.trim() || null,
        })
        .select()
        .single();

      if (error) {
        toast.error('Failed to create shop');
        return;
      }
      setNewShopId(data.id);
      toast.success('Shop created!');
      setStep(1);
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  function addLocalProduct() {
    if (!productForm.name_en.trim()) {
      toast.error('Product name is required');
      return;
    }
    const price = parseFloat(productForm.price);
    const stock = parseInt(productForm.stock, 10);
    if (isNaN(price) || price <= 0) {
      toast.error('Enter a valid price');
      return;
    }

    setProducts((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        name_en: productForm.name_en.trim(),
        price,
        stock: isNaN(stock) ? 0 : stock,
        unit: productForm.unit,
      },
    ]);
    setProductForm({ name_en: '', price: '', stock: '', unit: 'piece' });
  }

  function removeProduct(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleProductsSubmit() {
    const supabase = createClient();
    if (!supabase || !newShopId) {
      setStep(2);
      return;
    }

    if (products.length > 0) {
      setSubmitting(true);
      try {
        const { error } = await supabase.from('products').insert(
          products.map((p) => ({
            shop_id: newShopId,
            name_en: p.name_en,
            name_ml: p.name_en,
            price: p.price,
            stock: p.stock,
            unit: p.unit,
          })),
        );
        if (error) {
          toast.error('Some products failed to save');
        } else {
          toast.success(`${products.length} product(s) added`);
        }
      } catch {
        toast.error('Failed to save products');
      } finally {
        setSubmitting(false);
      }
    }
    setStep(2);
  }

  async function handleFinish() {
    await refreshShop();
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen bg-page flex items-start justify-center p-4 pt-12 sm:pt-20">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-50 mb-3">
            <ShoppingBag className="w-6 h-6 text-orange-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Set Up Your Shop</h1>
        </div>

        <StepIndicator current={step} completed={completedSteps} />

        {/* Step 1: Shop Details */}
        {step === 0 && (
          <Card className="border-gray-100 shadow-sm animate-fade-in">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2 text-gray-900 mb-1">
                <Store className="h-5 w-5 text-orange-500" />
                <h2 className="text-base font-semibold">Shop Details</h2>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shop-name">Shop Name *</Label>
                <Input
                  id="shop-name"
                  placeholder="Your store name"
                  value={shopForm.name}
                  onChange={(e) =>
                    setShopForm((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shop-name-ml">Shop Name (Malayalam)</Label>
                <Input
                  id="shop-name-ml"
                  placeholder="കടയുടെ പേര്"
                  value={shopForm.name_ml}
                  onChange={(e) =>
                    setShopForm((p) => ({ ...p, name_ml: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shop-address">Address</Label>
                <textarea
                  id="shop-address"
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Shop address"
                  value={shopForm.address}
                  onChange={(e) =>
                    setShopForm((p) => ({ ...p, address: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shop-phone">Phone</Label>
                <Input
                  id="shop-phone"
                  placeholder="+91 98765 43210"
                  value={shopForm.phone}
                  onChange={(e) =>
                    setShopForm((p) => ({ ...p, phone: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shop-upi">UPI ID</Label>
                <Input
                  id="shop-upi"
                  placeholder="yourstore@upi"
                  value={shopForm.upi_id}
                  onChange={(e) =>
                    setShopForm((p) => ({ ...p, upi_id: e.target.value }))
                  }
                />
              </div>

              <Button
                onClick={handleShopSubmit}
                disabled={submitting}
                className="w-full h-11 bg-orange-500 hover:bg-orange-600 font-medium gap-2"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Next <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Add Products */}
        {step === 1 && (
          <Card className="border-gray-100 shadow-sm animate-fade-in">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2 text-gray-900 mb-1">
                <Package className="h-5 w-5 text-orange-500" />
                <h2 className="text-base font-semibold">Add Products</h2>
              </div>
              <p className="text-sm text-gray-500 -mt-3">
                You can skip this and add products later.
              </p>

              {/* Quick-add form */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-12 sm:col-span-4">
                  <Input
                    placeholder="Product name"
                    value={productForm.name_en}
                    onChange={(e) =>
                      setProductForm((p) => ({ ...p, name_en: e.target.value }))
                    }
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Input
                    placeholder="Price"
                    type="number"
                    min="0"
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm((p) => ({ ...p, price: e.target.value }))
                    }
                  />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <Input
                    placeholder="Stock"
                    type="number"
                    min="0"
                    value={productForm.stock}
                    onChange={(e) =>
                      setProductForm((p) => ({ ...p, stock: e.target.value }))
                    }
                  />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <Select
                    value={productForm.unit}
                    onValueChange={(v) =>
                      setProductForm((p) => ({ ...p, unit: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_TYPES.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 sm:col-span-2">
                  <Button
                    onClick={addLocalProduct}
                    className="w-full h-10 bg-orange-500 hover:bg-orange-600"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Product list */}
              {products.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm"
                    >
                      <div className="flex-1">
                        <span className="font-medium">{p.name_en}</span>
                        <span className="text-gray-500 ml-2">
                          ₹{p.price} · {p.stock} {p.unit}
                        </span>
                      </div>
                      <button
                        onClick={() => removeProduct(p.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {products.length > 0 && (
                <p className="text-xs text-gray-400 text-center">
                  {products.length} product{products.length !== 1 ? 's' : ''} ready
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(0)}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleProductsSubmit}
                  disabled={submitting}
                  className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 font-medium gap-2"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {products.length === 0 ? 'Skip' : 'Next'}{' '}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Done */}
        {step === 2 && (
          <Card className="border-gray-100 shadow-sm animate-fade-in">
            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                You&apos;re all set!
              </h2>
              <p className="text-sm text-gray-500 max-w-xs">
                Your shop is ready. Start billing with voice commands.
              </p>
              <Button
                onClick={handleFinish}
                className="w-full max-w-xs h-11 bg-orange-500 hover:bg-orange-600 font-medium gap-2 mt-2"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
