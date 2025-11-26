'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Settings,
  CreditCard,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';

interface SubscriptionUpiSettings {
  upiId: string;
  upiName: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SubscriptionUpiSettings>({
    upiId: '',
    upiName: 'PG Management System',
  });
  const [errors, setErrors] = useState<Partial<SubscriptionUpiSettings>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<SubscriptionUpiSettings>('/admin/subscription-upi-settings');
      if (response.success && response.data) {
        setSettings({
          upiId: response.data.upiId || '',
          upiName: response.data.upiName || 'PG Management System',
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load subscription UPI settings');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<SubscriptionUpiSettings> = {};

    if (settings.upiId && settings.upiId.trim()) {
      const upiIdRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
      if (!upiIdRegex.test(settings.upiId)) {
        newErrors.upiId = 'Please enter a valid UPI ID (e.g., admin@paytm)';
      }
    }

    if (!settings.upiName || !settings.upiName.trim()) {
      newErrors.upiName = 'UPI display name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    try {
      setSaving(true);
      const response = await apiClient.put('/admin/subscription-upi-settings', {
        upiId: settings.upiId.trim() || null,
        upiName: settings.upiName.trim() || null,
      });

      if (response.success) {
        toast.success('Subscription UPI settings updated successfully');
        await loadSettings(); // Reload to get updated data
      } else {
        toast.error(response.message || 'Failed to update settings');
      }
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      toast.error(error.message || 'Failed to update subscription UPI settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#f5c518] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Settings className="w-8 h-8 text-[#f5c518]" />
            Admin Settings
          </h1>
          <p className="text-gray-400">Manage subscription payment UPI details</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="bg-[#1a1a1a] border-[#333333]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#f5c518]" />
                Subscription UPI Settings
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure UPI ID and display name for subscription payments. These details will be used when owners make subscription payments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="upiId" className="text-gray-300 mb-2 block">
                    UPI ID <span className="text-gray-500">(e.g., admin@paytm)</span>
                  </Label>
                  <Input
                    id="upiId"
                    type="text"
                    value={settings.upiId}
                    onChange={(e) => {
                      setSettings({ ...settings, upiId: e.target.value });
                      if (errors.upiId) {
                        setErrors({ ...errors, upiId: undefined });
                      }
                    }}
                    placeholder="Enter UPI ID"
                    className={`bg-[#252525] border-[#333333] text-white placeholder-gray-500 focus:border-[#f5c518] focus:ring-[#f5c518] ${
                      errors.upiId ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.upiId && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.upiId}
                    </p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    This is the UPI ID where subscription payments will be received
                  </p>
                </div>

                <div>
                  <Label htmlFor="upiName" className="text-gray-300 mb-2 block">
                    UPI Display Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="upiName"
                    type="text"
                    value={settings.upiName}
                    onChange={(e) => {
                      setSettings({ ...settings, upiName: e.target.value });
                      if (errors.upiName) {
                        setErrors({ ...errors, upiName: undefined });
                      }
                    }}
                    placeholder="Enter UPI display name"
                    className={`bg-[#252525] border-[#333333] text-white placeholder-gray-500 focus:border-[#f5c518] focus:ring-[#f5c518] ${
                      errors.upiName ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.upiName && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.upiName}
                    </p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    This name will be displayed to owners when they make subscription payments
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-[#333333]">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#f5c518] hover:bg-[#ffd000] text-[#0d0d0d] font-semibold px-6"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
                <Button
                  onClick={loadSettings}
                  disabled={saving || loading}
                  variant="outline"
                  className="border-[#333333] text-gray-300 hover:bg-[#252525]"
                >
                  Cancel
                </Button>
              </div>

              {settings.upiId && (
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-400 text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      <strong>Current UPI:</strong> {settings.upiId} ({settings.upiName})
                    </span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}






