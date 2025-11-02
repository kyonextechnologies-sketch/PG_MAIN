import { useState, useEffect } from 'react';

interface UPISettings {
  upiId: string;
  upiName: string;
}

export function useUPISettings() {
  const [settings, setSettings] = useState<UPISettings>({
    upiId: 'owner@paytm',
    upiName: 'Smart PG Manager'
  });

  useEffect(() => {
    // In a real app, this would fetch from the API
    // For now, we'll use localStorage or default values
    const savedSettings = localStorage.getItem('upiSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        // Use setTimeout to avoid synchronous setState in effect
        const timer = setTimeout(() => {
          setSettings(parsed);
        }, 0);
        
        return () => clearTimeout(timer);
      } catch (error) {
        console.error('Failed to parse UPI settings:', error);
      }
    }
  }, []);

  const updateSettings = (newSettings: UPISettings) => {
    setSettings(newSettings);
    localStorage.setItem('upiSettings', JSON.stringify(newSettings));
  };

  return { settings, updateSettings };
}

