'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/shared/Toast';
import { getSupabaseClient } from '@/lib/supabase/client';
import {
  Store,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  Save,
  Loader2,
} from 'lucide-react';

export default function SettingsPage() {
  const { shop, refreshShop, isDemoMode } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: shop?.name || '',
    nameMl: shop?.name_ml || '',
    phone: shop?.phone || '',
    address: shop?.address || '',
    upiId: shop?.upi_id || '',
    gstin: shop?.gstin || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (isDemoMode) {
        await refreshShop();
        showToast('Settings saved (demo mode)', 'success');
        return;
      }

      const supabase = getSupabaseClient();
      if (!supabase) {
        showToast('Supabase not configured', 'error');
        return;
      }

      if (shop) {
        // Existing shop — UPDATE
        const { error } = await supabase
          .from('shops')
          .update({
            name: formData.name,
            name_ml: formData.nameMl || null,
            phone: formData.phone || null,
            address: formData.address || null,
            upi_id: formData.upiId || null,
            gstin: formData.gstin || null,
          })
          .eq('id', shop.id);

        if (error) throw error;
      } else {
        // New user — INSERT a new shop
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          showToast('Please log in first', 'error');
          return;
        }

        if (!formData.name.trim()) {
          showToast('Shop name is required', 'error');
          return;
        }

        const { error } = await supabase
          .from('shops')
          .insert({
            owner_id: user.id,
            name: formData.name,
            name_ml: formData.nameMl || null,
            phone: formData.phone || null,
            address: formData.address || null,
            upi_id: formData.upiId || null,
            gstin: formData.gstin || null,
          });

        if (error) throw error;
      }

      await refreshShop();
      showToast(shop ? 'Settings saved successfully!' : 'Shop created! 🎉', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('Failed to save settings. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">
          Manage your shop information and preferences
        </p>
      </div>

      {/* New user setup prompt */}
      {!shop && !isDemoMode && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="flex items-start gap-3 p-4">
            <Store className="w-6 h-6 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-900">Welcome! Let's set up your shop</p>
              <p className="text-sm text-amber-700 mt-1">
                Fill in your shop name below and hit Save to create your shop. You can add more details later.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shop Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Shop Information
          </CardTitle>
          <CardDescription>
            {shop ? 'Basic details about your shop' : 'Enter your shop details to get started'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Shop Name (English)</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="My Store"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameMl">Shop Name (Malayalam)</Label>
              <Input
                id="nameMl"
                name="nameMl"
                value={formData.nameMl}
                onChange={handleChange}
                placeholder="എന്റെ കട"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 9876543210"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Address
            </Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Shop address..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Settings
          </CardTitle>
          <CardDescription>
            Configure UPI and payment options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="upiId">UPI ID</Label>
            <Input
              id="upiId"
              name="upiId"
              value={formData.upiId}
              onChange={handleChange}
              placeholder="yourshop@upi"
            />
            <p className="text-xs text-muted-foreground">
              This will be used to generate QR codes for customer payments
            </p>
          </div>
        </CardContent>
      </Card>

      {/* GST Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            GST Information
          </CardTitle>
          <CardDescription>
            Optional GST registration details for invoices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gstin">GSTIN</Label>
            <Input
              id="gstin"
              name="gstin"
              value={formData.gstin}
              onChange={handleChange}
              placeholder="22AAAAA0000A1Z5"
            />
            <p className="text-xs text-muted-foreground">
              15-digit GST Identification Number (optional)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleSave}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        Save Settings
      </Button>
    </div>
  );
}
