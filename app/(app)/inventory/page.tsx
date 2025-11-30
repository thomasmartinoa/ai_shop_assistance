'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { useProducts } from '@/hooks/useProducts';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  Edit,
  Trash2,
  Grid,
  List,
} from 'lucide-react';

export default function InventoryPage() {
  const { shop } = useAuth();
  const { products, loadProducts, getLowStockProducts, addProduct } = useProducts({ shopId: shop?.id });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name_en: '',
    name_ml: '',
    price: '',
    unit: 'kg',
    stock: '',
    min_stock: '10',
    gst_rate: '0',
  });

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Filter products
  const filteredProducts = products.filter(
    (p) =>
      p.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name_ml.includes(searchQuery) ||
      (p.aliases && p.aliases.some(a => a.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  // Low stock products
  const lowStockProducts = getLowStockProducts();

  // Handle add product
  const handleAddProduct = async () => {
    if (!newProduct.name_en || !newProduct.price) return;

    await addProduct({
      shop_id: shop?.id || 'demo-shop-id',
      name_en: newProduct.name_en,
      name_ml: newProduct.name_ml || newProduct.name_en,
      price: parseFloat(newProduct.price),
      cost_price: null,
      stock: parseInt(newProduct.stock) || 0,
      min_stock: parseInt(newProduct.min_stock) || 10,
      unit: newProduct.unit,
      gst_rate: parseFloat(newProduct.gst_rate) || 0,
      category: null,
      shelf_location: null,
      barcode: null,
      image_url: null,
      is_active: true,
      aliases: [newProduct.name_en.toLowerCase()],
    });

    setNewProduct({
      name_en: '',
      name_ml: '',
      price: '',
      unit: 'kg',
      stock: '',
      min_stock: '10',
      gst_rate: '0',
    });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventory</h2>
          <p className="text-muted-foreground">
            {products.length} products • {lowStockProducts.length} low stock
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Low stock alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="flex items-center gap-4 p-4">
            <AlertTriangle className="w-6 h-6 text-orange-500 shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Low Stock Alert</p>
              <p className="text-sm text-muted-foreground">
                {lowStockProducts.map((p) => p.name_en).join(', ')} running low
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Products grid/list */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className={
                product.stock <= product.min_stock ? 'border-orange-300' : ''
              }
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  {product.stock <= product.min_stock && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                      Low
                    </span>
                  )}
                </div>
                <h3 className="font-semibold">{product.name_en}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {product.name_ml}
                </p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(product.price)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      per {product.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {product.stock} {product.unit}
                    </p>
                    <p className="text-xs text-muted-foreground">in stock</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-medium">Product</th>
                  <th className="text-right p-4 font-medium">Price</th>
                  <th className="text-right p-4 font-medium">Stock</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-t">
                    <td className="p-4">
                      <p className="font-medium">{product.name_en}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.name_ml}
                      </p>
                    </td>
                    <td className="p-4 text-right">
                      {formatCurrency(product.price)}/{product.unit}
                    </td>
                    <td className="p-4 text-right">
                      <span
                        className={
                          product.stock <= product.min_stock
                            ? 'text-orange-600 font-medium'
                            : ''
                        }
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Add product modal placeholder */}
      {showAddForm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddForm(false)}
        >
          <Card
            className="max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle>Add New Product</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Product Name (English)</label>
                <Input placeholder="Rice" />
              </div>
              <div>
                <label className="text-sm font-medium">Product Name (Malayalam)</label>
                <Input placeholder="അരി" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Price (₹)</label>
                  <Input type="number" placeholder="50" />
                </div>
                <div>
                  <label className="text-sm font-medium">Unit</label>
                  <Input placeholder="kg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Current Stock</label>
                  <Input type="number" placeholder="100" />
                </div>
                <div>
                  <label className="text-sm font-medium">Min Stock Alert</label>
                  <Input type="number" placeholder="10" />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button className="flex-1">Save Product</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
