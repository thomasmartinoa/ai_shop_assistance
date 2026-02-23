'use client';

import { useState } from 'react';
import { Save, LogOut, Store, CreditCard, User, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/shared/Toast';

export default function SettingsPage() {
  const { shop, refreshShop, isDemoMode, user, signOut } = useAuth();
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
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
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
            owner_id: authUser.id,
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
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your shop configuration</p>
      </div>

      {/* New user setup prompt */}
      {!shop && !isDemoMode && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3">
          <Store className="w-6 h-6 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-900">Welcome! Let's set up your shop</p>
            <p className="text-sm text-amber-700 mt-1">
              Fill in your shop name below and hit Save to create your shop. You can add more details later.
            </p>
          </div>
        </div>
      )}

      {/* Shop Details Card */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Store className="h-4 w-4 text-primary" />
          </div>
          <h2 className="font-semibold">Shop Details</h2>
        </div>
        <div className="space-y-4">
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
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Shop address..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 9876543210"
            />
          </div>
          <Button onClick={handleSave} disabled={isLoading} className="w-full mt-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>
      </div>

      {/* Payment Settings Card */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-green-600" />
          </div>
          <h2 className="font-semibold">Payment Settings</h2>
        </div>
        <div className="space-y-4">
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
              Used to generate QR codes for customer payments
            </p>
          </div>
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
        </div>
      </div>

      {/* Account Card */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <h2 className="font-semibold">Account</h2>
        </div>
        <div className="space-y-3">
          {user?.phone && (
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Phone</span>
              <span className="text-sm font-medium">{user.phone}</span>
            </div>
          )}
          <Button variant="destructive" onClick={signOut} className="w-full mt-2">
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
