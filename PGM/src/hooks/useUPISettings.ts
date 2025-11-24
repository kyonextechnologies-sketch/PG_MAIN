import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useSession } from 'next-auth/react';

interface UPISettings {
  upiId: string;
  upiName: string;
  ownerName?: string;
}

export function useUPISettings() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<UPISettings>({
    upiId: '',
    upiName: '',
    ownerName: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch owner payment settings from backend
  const fetchOwnerPaymentSettings = useCallback(async () => {
    if (!session?.user || session.user.role !== 'TENANT') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get<{
        upiId: string | null;
        upiName: string | null;
        ownerName: string;
      }>('/tenants/owner/payment-settings');

      if (response.success && response.data) {
        const data = response.data as any;
        setSettings({
          upiId: data.upiId || '',
          upiName: data.upiName || '',
          ownerName: data.ownerName || '',
        });

        // Also update localStorage for backward compatibility
        if (data.upiId || data.upiName) {
          localStorage.setItem('upiSettings', JSON.stringify({
            upiId: data.upiId || '',
            upiName: data.upiName || '',
          }));
        }
      } else {
        throw new Error(response.message || 'Failed to fetch payment settings');
      }
    } catch (err: any) {
      console.error('Failed to fetch owner payment settings:', err);
      setError(err.message || 'Failed to load payment settings');
      
      // Fallback to localStorage if API fails
      const savedSettings = localStorage.getItem('upiSettings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings({
            upiId: parsed.upiId || '',
            upiName: parsed.upiName || '',
          });
        } catch (parseError) {
          console.error('Failed to parse localStorage UPI settings:', parseError);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Fetch on mount and when session changes
  useEffect(() => {
    fetchOwnerPaymentSettings();
  }, [fetchOwnerPaymentSettings]);

  // Poll for updates every 30 seconds to get real-time changes
  useEffect(() => {
    if (!session?.user || session.user.role !== 'TENANT') return;

    const interval = setInterval(() => {
      fetchOwnerPaymentSettings();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [session, fetchOwnerPaymentSettings]);

  // Listen for payment settings update notifications
  useEffect(() => {
    if (!session?.user || session.user.role !== 'TENANT') return;

    const handlePaymentSettingsUpdate = () => {
      console.log('🔄 Payment settings update detected, refreshing...');
      fetchOwnerPaymentSettings();
    };

    // Listen for custom event when payment settings are updated
    window.addEventListener('paymentSettingsUpdated', handlePaymentSettingsUpdate);
    
    // Also listen for WebSocket notifications about payment settings
    const handleNotification = (event: CustomEvent) => {
      const notification = event.detail;
      if (notification?.type === 'SYSTEM' && notification?.title === 'Payment Details Updated') {
        console.log('🔄 Payment settings updated via notification, refreshing...');
        fetchOwnerPaymentSettings();
      }
    };

    window.addEventListener('paymentSettingsNotification', handleNotification as EventListener);

    return () => {
      window.removeEventListener('paymentSettingsUpdated', handlePaymentSettingsUpdate);
      window.removeEventListener('paymentSettingsNotification', handleNotification as EventListener);
    };
  }, [session, fetchOwnerPaymentSettings]);

  const updateSettings = (newSettings: UPISettings) => {
    setSettings(newSettings);
    localStorage.setItem('upiSettings', JSON.stringify({
      upiId: newSettings.upiId,
      upiName: newSettings.upiName,
    }));
  };

  const refresh = useCallback(() => {
    fetchOwnerPaymentSettings();
  }, [fetchOwnerPaymentSettings]);

  return { 
    settings, 
    updateSettings, 
    loading, 
    error, 
    refresh 
  };
}

