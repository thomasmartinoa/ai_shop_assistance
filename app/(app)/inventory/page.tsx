'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useProducts } from '@/hooks/useProducts';
import { useAuth } from '@/contexts/AuthContext';
import { useVoice } from '@/hooks/useVoice';
import { useSmartNLP } from '@/lib/nlp/useSmartNLP';
import { VoiceButton } from '@/components/voice/VoiceButton';
import { VoiceVisualizer } from '@/components/voice/VoiceVisualizer';
import { cn } from '@/lib/utils';
import { Search, Plus, Pencil, Trash2, Package } from 'lucide-react';
import type { Product } from '@/types/database';

const UNITS = ['piece', 'kg', 'g', 'liter', 'ml', 'dozen', 'box', 'packet'];

const EMPTY_FORM = {
  name_en: '',
  name_ml: '',
  price: '',
  unit: 'piece',
  stock: '',
  min_stock: '10',
  gst_rate: '0',
  category: '',
};

export default function InventoryPage() {
  const { shop } = useAuth();
  const {
    products,
    isLoading,
    loadProducts,
    getLowStockProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    findProduct,
  } = useProducts({ shopId: shop?.id });
  const { processText, lastResult } = useSmartNLP();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [voiceStatus, setVoiceStatus] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Voice command handler
  const handleVoiceResult = useCallback(
    async (transcript: string, isFinal: boolean) => {
      if (!isFinal) return;
      const result = await processText(transcript);
      switch (result.intent) {
        case 'inventory.add': {
          const productName = result.entities.product;
          const quantity = result.entities.quantity || 10;
          if (productName) {
            const existing = findProduct(productName);
            if (existing) {
              await updateStock(existing.id, existing.stock + quantity);
              voice.speak(`${existing.name_ml} സ്റ്റോക്കിൽ ${quantity} ${existing.unit} ചേർത്തു`);
              setVoiceStatus(`Added ${quantity} ${existing.unit} to ${existing.name_en}`);
            } else {
              voice.speak(`${productName} ലിസ്റ്റിൽ ഇല്ല. പുതിയ ഉൽപ്പന്നമായി ചേർക്കണോ?`);
              setVoiceStatus(`Product "${productName}" not found.`);
            }
          } else {
            voice.speak('ഉൽപ്പന്നത്തിൻ്റെ പേര് പറയൂ');
          }
          break;
        }
        case 'inventory.check': {
          const checkProduct = result.entities.product;
          if (checkProduct) {
            const product = findProduct(checkProduct);
            if (product) {
              voice.speak(`${product.name_ml} ${product.stock} ${product.unit} ഉണ്ട്`);
              setVoiceStatus(`${product.name_en}: ${product.stock} ${product.unit} in stock`);
            } else {
              voice.speak(`${checkProduct} കണ്ടെത്തിയില്ല`);
            }
          } else {
            const lowStock = getLowStockProducts();
            if (lowStock.length > 0) {
              const names = lowStock.map((p) => p.name_ml).join(', ');
              voice.speak(`${lowStock.length} ഉൽപ്പന്നങ്ങൾ സ്റ്റോക്ക് കുറവാണ്: ${names}`);
              setVoiceStatus(`Low stock: ${lowStock.map((p) => p.name_en).join(', ')}`);
            } else {
              voice.speak('എല്ലാ ഉൽപ്പന്നങ്ങളും സ്റ്റോക്കിൽ ഉണ്ട്');
              setVoiceStatus('All products in stock');
            }
          }
          break;
        }
        case 'help':
          voice.speak('സ്റ്റോക്ക് ചേർക്കാൻ: "50 കിലോ അരി സ്റ്റോക്കിൽ ചേർക്കുക". സ്റ്റോക്ക് നോക്കാൻ: "അരി എത്ര ഉണ്ട്"');
          break;
        default:
          voice.speak('മനസ്സിലായില്ല. വീണ്ടും പറയൂ.');
      }
    },
    [processText, findProduct, updateStock, getLowStockProducts]
  );

  const voice = useVoice({
    onResult: handleVoiceResult,
    onError: (error) => console.error('Voice error:', error),
  });

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Unique categories derived from products
  const categories = [
    'All',
    ...Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[])),
  ];

  // Filtered products (search + category)
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name_ml.includes(searchQuery) ||
      (p.aliases && p.aliases.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openAdd = () => {
    setEditProduct(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setForm({
      name_en: product.name_en,
      name_ml: product.name_ml,
      price: String(product.price),
      unit: product.unit,
      stock: String(product.stock),
      min_stock: String(product.min_stock),
      gst_rate: String(product.gst_rate),
      category: product.category || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name_en || !form.price) return;
    setSaving(true);
    if (editProduct) {
      await updateProduct(editProduct.id, {
        name_en: form.name_en,
        name_ml: form.name_ml || form.name_en,
        price: parseFloat(form.price),
        unit: form.unit,
        stock: parseInt(form.stock) || 0,
        min_stock: parseInt(form.min_stock) || 10,
        gst_rate: parseFloat(form.gst_rate) || 0,
        category: form.category || null,
      });
    } else {
      await addProduct({
        shop_id: shop?.id || 'demo-shop-id',
        name_en: form.name_en,
        name_ml: form.name_ml || form.name_en,
        price: parseFloat(form.price),
        cost_price: null,
        stock: parseInt(form.stock) || 0,
        min_stock: parseInt(form.min_stock) || 10,
        unit: form.unit,
        gst_rate: parseFloat(form.gst_rate) || 0,
        category: form.category || null,
        shelf_location: null,
        barcode: null,
        image_url: null,
        is_active: true,
        aliases: [form.name_en.toLowerCase()],
      });
    }
    setSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await deleteProduct(id);
  };

  return (
    <div className="space-y-5">
      {/* Voice Control */}
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <VoiceButton
            state={voice.state}
            onToggle={voice.toggleListening}
            disabled={!voice.isSupported}
          />
          <div className="flex-1">
            <VoiceVisualizer
              state={voice.state}
              transcript={voice.interimTranscript || voice.transcript}
              className="text-sm"
            />
            {voiceStatus && (
              <p className="text-xs text-muted-foreground mt-1">{voiceStatus}</p>
            )}
          </div>
          {lastResult && process.env.NODE_ENV === 'development' && (
            <span className="text-xs text-blue-500">[{lastResult.source}]</span>
          )}
        </CardContent>
      </Card>

      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <h1 className="text-2xl font-bold">Inventory</h1>
          <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {products.length}
          </span>
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              'shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors',
              selectedCategory === cat
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:bg-muted'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-muted rounded-2xl h-36 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-lg font-semibold text-muted-foreground">No products found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery || selectedCategory !== 'All'
              ? 'Try adjusting your search or filter'
              : 'Add your first product to get started'}
          </p>
          {!searchQuery && selectedCategory === 'All' && (
            <Button className="mt-4" onClick={openAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          )}
        </div>
      )}

      {/* Product grid */}
      {!isLoading && filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-border shadow-sm p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm">{product.name_ml}</p>
                  <p className="text-xs text-muted-foreground">{product.name_en}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(product)}
                    className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary">₹{product.price}</span>
                <span
                  className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    product.stock <= product.min_stock
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  )}
                >
                  {product.stock} {product.unit}
                </span>
              </div>
              {product.category && (
                <span className="text-xs text-muted-foreground">{product.category}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Name (English) *</label>
                <Input
                  placeholder="Rice"
                  value={form.name_en}
                  onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Name (Malayalam)</label>
                <Input
                  placeholder="അരി"
                  value={form.name_ml}
                  onChange={(e) => setForm((f) => ({ ...f, name_ml: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Price (₹) *</label>
                <Input
                  type="number"
                  placeholder="50"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Unit</label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Stock</label>
                <Input
                  type="number"
                  placeholder="100"
                  value={form.stock}
                  onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Min Stock Alert</label>
                <Input
                  type="number"
                  placeholder="10"
                  value={form.min_stock}
                  onChange={(e) => setForm((f) => ({ ...f, min_stock: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">GST Rate (%)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.gst_rate}
                  onChange={(e) => setForm((f) => ({ ...f, gst_rate: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Category</label>
                <Input
                  placeholder="Groceries"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name_en || !form.price}
            >
              {saving ? 'Saving…' : editProduct ? 'Update Product' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
