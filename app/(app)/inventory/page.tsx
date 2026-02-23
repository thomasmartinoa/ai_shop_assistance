'use client';

import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import { formatCurrency } from '@/lib/utils';
import { PRODUCT_CATEGORIES, UNIT_TYPES } from '@/lib/constants';
import { toast } from '@/components/shared/Toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  Plus, Search, Pencil, Trash2, Package, AlertTriangle, XCircle,
  LayoutGrid, List, Loader2,
} from 'lucide-react';
import type { Product } from '@/types/database';

interface ProductFormData {
  name_en: string;
  name_ml: string;
  price: string;
  cost_price: string;
  stock: string;
  min_stock: string;
  unit: string;
  category: string;
  gst_rate: string;
}

const emptyForm: ProductFormData = {
  name_en: '', name_ml: '', price: '', cost_price: '',
  stock: '0', min_stock: '5', unit: 'piece', category: 'grocery', gst_rate: '0',
};

export default function InventoryPage() {
  const { shop } = useAuth();
  const {
    products, isLoading, getLowStockProducts,
    addProduct, updateProduct, deleteProduct,
  } = useProducts({ shopId: shop?.id });

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const lowStockCount = getLowStockProducts().length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  const filteredProducts = useMemo(() => {
    let result = products;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.name_en.toLowerCase().includes(q) ||
        (p.name_ml && p.name_ml.toLowerCase().includes(q)) ||
        (p.aliases && p.aliases.some((a) => a.toLowerCase().includes(q)))
      );
    }
    if (category !== 'all') {
      result = result.filter((p) => p.category === category);
    }
    return result;
  }, [products, search, category]);

  const openAdd = useCallback(() => {
    setEditingProduct(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((p: Product) => {
    setEditingProduct(p);
    setForm({
      name_en: p.name_en,
      name_ml: p.name_ml || '',
      price: String(p.price),
      cost_price: p.cost_price != null ? String(p.cost_price) : '',
      stock: String(p.stock),
      min_stock: String(p.min_stock),
      unit: p.unit || 'piece',
      category: p.category || 'other',
      gst_rate: String(p.gst_rate || 0),
    });
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (p: Product) => {
    if (!window.confirm(`Are you sure you want to delete ${p.name_en}?`)) return;
    const { error } = await deleteProduct(p.id);
    if (error) toast.error('Failed to delete product');
    else toast.success(`${p.name_en} deleted`);
  }, [deleteProduct]);

  const handleSave = useCallback(async () => {
    if (!form.name_en.trim() || !form.price) {
      toast.error('Please fill in required fields');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name_en: form.name_en.trim(),
        name_ml: form.name_ml.trim() || form.name_en.trim(),
        price: parseFloat(form.price) || 0,
        cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
        stock: parseInt(form.stock) || 0,
        min_stock: parseInt(form.min_stock) || 5,
        unit: form.unit,
        category: form.category,
        gst_rate: parseFloat(form.gst_rate) || 0,
      };

      if (editingProduct) {
        const { error } = await updateProduct(editingProduct.id, payload);
        if (error) throw error;
        toast.success('Product updated');
      } else {
        const { error } = await addProduct({
          ...payload,
          shop_id: shop?.id || 'demo-shop-id',
          aliases: null, shelf_location: null, barcode: null,
          image_url: null, is_active: true,
        });
        if (error) throw error;
        toast.success('Product added');
      }
      setDialogOpen(false);
    } catch {
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  }, [form, editingProduct, addProduct, updateProduct, shop?.id]);

  const updateField = (field: keyof ProductFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  function StockIndicator({ product }: { product: Product }) {
    if (product.stock === 0) {
      return (
        <span className="flex items-center gap-1.5 text-xs text-red-600">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          Out of Stock
        </span>
      );
    }
    if (product.stock <= (product.min_stock || 0)) {
      return (
        <span className="flex items-center gap-1.5 text-xs text-orange-600">
          <span className="h-2 w-2 rounded-full bg-orange-500" />
          Low Stock ({product.stock} {product.unit})
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-xs text-green-600">
        <span className="h-2 w-2 rounded-full bg-green-500" />
        In Stock ({product.stock} {product.unit})
      </span>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your products</p>
        </div>
        <Button onClick={openAdd} className="gap-2 bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-50 p-2.5">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Products</p>
              <p className="text-lg font-bold text-gray-900">{products.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`rounded-lg p-2.5 ${lowStockCount > 0 ? 'bg-orange-50' : 'bg-gray-50'}`}>
              <AlertTriangle className={`h-5 w-5 ${lowStockCount > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Low Stock</p>
              <p className={`text-lg font-bold ${lowStockCount > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                {lowStockCount}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`rounded-lg p-2.5 ${outOfStockCount > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
              <XCircle className={`h-5 w-5 ${outOfStockCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Out of Stock</p>
              <p className={`text-lg font-bold ${outOfStockCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {outOfStockCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setView('grid')}
              className={`p-2.5 ${view === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2.5 ${view === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            {PRODUCT_CATEGORIES.map((c) => (
              <TabsTrigger key={c.id} value={c.id} className="text-xs">{c.name}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p className="text-sm">Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Package className="h-12 w-12 mb-3" />
          <p className="font-medium text-gray-600">No products found</p>
          <p className="text-sm mt-1">
            {search ? 'Try a different search term' : 'Add your first product to get started'}
          </p>
        </div>
      ) : view === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((p) => (
            <div key={p.id} className="rounded-xl border bg-white p-4 space-y-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <Badge variant="secondary" className="text-[10px] font-normal">
                  {PRODUCT_CATEGORIES.find((c) => c.id === p.category)?.name || p.category || 'Other'}
                </Badge>
              </div>
              <div>
                <p className="font-medium text-base text-gray-900">{p.name_en}</p>
                {p.name_ml && <p className="text-sm text-gray-400">{p.name_ml}</p>}
              </div>
              <p className="text-lg font-bold text-orange-600">{formatCurrency(p.price)}</p>
              <StockIndicator product={p} />
              <div className="flex gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(p)} className="h-8 px-2.5 text-gray-500">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(p)} className="h-8 px-2.5 text-gray-500 hover:text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Malayalam</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name_en}</TableCell>
                    <TableCell className="text-gray-400">{p.name_ml}</TableCell>
                    <TableCell className="text-right font-semibold text-orange-600">
                      {formatCurrency(p.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <StockIndicator product={p} />
                    </TableCell>
                    <TableCell>{p.unit}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {PRODUCT_CATEGORIES.find((c) => c.id === p.category)?.name || p.category || 'Other'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(p)} className="h-8 w-8 p-0">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(p)} className="h-8 w-8 p-0 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Update the product details below.' : 'Fill in the product details to add to inventory.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name_en">Product Name (English) *</Label>
              <Input id="name_en" value={form.name_en} onChange={(e) => updateField('name_en', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_ml">Product Name (Malayalam) *</Label>
              <Input id="name_ml" value={form.name_ml} onChange={(e) => updateField('name_ml', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Selling Price (₹) *</Label>
              <Input id="price" type="number" min="0" step="0.01" value={form.price} onChange={(e) => updateField('price', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost_price">Cost Price (₹)</Label>
              <Input id="cost_price" type="number" min="0" step="0.01" value={form.cost_price} onChange={(e) => updateField('cost_price', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Current Stock *</Label>
              <Input id="stock" type="number" min="0" value={form.stock} onChange={(e) => updateField('stock', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_stock">Minimum Stock Alert</Label>
              <Input id="min_stock" type="number" min="0" value={form.min_stock} onChange={(e) => updateField('min_stock', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={form.unit} onValueChange={(v) => updateField('unit', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNIT_TYPES.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => updateField('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="gst_rate">GST Rate (%)</Label>
              <Input id="gst_rate" type="number" min="0" max="28" step="0.01" value={form.gst_rate} onChange={(e) => updateField('gst_rate', e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-orange-600 hover:bg-orange-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingProduct ? 'Save Changes' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
