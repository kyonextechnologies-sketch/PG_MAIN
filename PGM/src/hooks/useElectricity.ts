import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/apiClient';

export interface ElectricityBill {
  id: string;
  month: string;
  previousReading: number;
  currentReading: number;
  units: number;
  ratePerUnit: number;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ElectricitySettings {
  ratePerUnit: number;
  lastReading: number | null;
  dueDate: number | null; // Day of month
  minimumUnits?: number;
  maximumUnits?: number;
}

interface ElectricityBillsResponse {
  data: ElectricityBill[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useElectricity() {
  const { data: session } = useSession();
  const [bills, setBills] = useState<ElectricityBill[]>([]);
  const [settings, setSettings] = useState<ElectricitySettings>({
    ratePerUnit: 8,
    lastReading: null,
    dueDate: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBills = useCallback(async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<ElectricityBillsResponse>('/electricity/bills?limit=100');

      if (response.success && response.data) {
        const billsData = Array.isArray(response.data.data) 
          ? response.data.data 
          : Array.isArray(response.data) 
            ? response.data 
            : [];
        
        setBills(billsData);

        // Extract settings from latest approved bill
        const latestApprovedBill = billsData
          .filter(bill => bill.status === 'APPROVED')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        if (latestApprovedBill) {
          setSettings(prev => ({
            ...prev,
            ratePerUnit: typeof latestApprovedBill.ratePerUnit === 'string' 
              ? parseFloat(latestApprovedBill.ratePerUnit) 
              : latestApprovedBill.ratePerUnit,
            lastReading: latestApprovedBill.currentReading,
          }));
        } else {
          // Try to get from latest bill (even if pending)
          const latestBill = billsData
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
          
          if (latestBill) {
            setSettings(prev => ({
              ...prev,
              ratePerUnit: typeof latestBill.ratePerUnit === 'string' 
                ? parseFloat(latestBill.ratePerUnit) 
                : latestBill.ratePerUnit,
              lastReading: latestBill.currentReading,
            }));
          }
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch electricity bills';
      setError(errorMsg);
      console.error('Error fetching electricity bills:', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  const submitBill = useCallback(async (data: {
    month: string;
    previousReading: number;
    currentReading: number;
    imageUrl?: string;
  }): Promise<ElectricityBill | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post<ElectricityBill>('/electricity/bills', data);

      if (response.success && response.data) {
        const newBill = response.data;
        setBills(prev => [newBill, ...prev]);
        return newBill;
      }
      return null;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to submit bill';
      setError(errorMsg);
      console.error('Error submitting bill:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate due date for current month
  const getDueDate = useCallback((): Date | null => {
    if (!settings.dueDate) return null;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Due date is the Xth day of the current month
    const dueDate = new Date(currentYear, currentMonth, settings.dueDate);
    
    // If due date has passed, show next month's due date
    if (dueDate < now) {
      return new Date(currentYear, currentMonth + 1, settings.dueDate);
    }
    
    return dueDate;
  }, [settings.dueDate]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  return {
    bills,
    settings,
    loading,
    error,
    fetchBills,
    submitBill,
    getDueDate,
  };
}

