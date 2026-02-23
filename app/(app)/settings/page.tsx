'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/shared/Toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Store, CreditCard, User, Save, LogOut, Loader2 } from 'lucide-react';

interface FormData {
  name: string;
  name_ml: string;
  address: string;
  phone: string;
  upi_id: string;
  gstin: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, shop, signOut, refreshShop, isLoading: authLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormData>({
    name: '',
    name_ml: '',
    address: '',
    phone: '',
    upi_id: '',
    gstin: '',
  });

  useEffect(() => {
    if (shop) {
      setForm({
        name: shop.name || '',
        name_ml: shop.name_ml || '',
        address: shop.address || '',
        phone: shop.phone || '',
        upi_id: shop.upi_id || '',
        gstin: shop.gstin || '',
      });
    }
  }, [shop]);

  function updateField(key: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    const supabase = createClient();
    if (!supabase || !shop) {
      toast.error('Unable to save — not connected');
      return;
    }
    if (!form.name.trim()) {
      toast.error('Shop name is required');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('shops')
        .update({
          name: form.name.trim(),
          name_ml: form.name_ml.trim() || null,
          address: form.address.trim() || null,
          phone: form.phone.trim() || null,
          upi_id: form.upi_id.trim() || null,
          gstin: form.gstin.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', shop.id);

      if (error) {
        toast.error('Failed to save settings');
      } else {
        toast.success('Settings saved successfully');
        await refreshShop();
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.push('/login');
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your shop and account</p>
        </div>

        {/* Shop Details */}
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2 text-gray-900">
              <Store className="h-5 w-5 text-orange-500" />
              <h2 className="text-base font-semibold">Shop Details</h2>
            </div>
            <Separator />

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Shop Name</Label>
                <Input
                  id="name"
                  placeholder="Your store name"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name_ml">Shop Name (Malayalam)</Label>
                <Input
                  id="name_ml"
                  placeholder="കടയുടെ പേര്"
                  value={form.name_ml}
                  onChange={(e) => updateField('name_ml', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <textarea
                  id="address"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Shop address"
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2 text-gray-900">
              <CreditCard className="h-5 w-5 text-orange-500" />
              <h2 className="text-base font-semibold">Payment Settings</h2>
            </div>
            <Separator />

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="upi_id">UPI ID</Label>
                <Input
                  id="upi_id"
                  placeholder="yourstore@upi"
                  value={form.upi_id}
                  onChange={(e) => updateField('upi_id', e.target.value)}
                />
                <p className="text-xs text-gray-400">Used for generating QR code payments</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN</Label>
                <Input
                  id="gstin"
                  placeholder="22AAAAA0000A1Z5 (optional)"
                  value={form.gstin}
                  onChange={(e) => updateField('gstin', e.target.value)}
                />
                <p className="text-xs text-gray-400">Your GST registration number</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2 text-gray-900">
              <User className="h-5 w-5 text-orange-500" />
              <h2 className="text-base font-semibold">Account</h2>
            </div>
            <Separator />

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={user?.email || user?.phone || 'Not available'}
                disabled
                className="bg-gray-50"
              />
            </div>

            <Button
              variant="outline"
              onClick={handleSignOut}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-base font-medium gap-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
