'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';

interface Invoice {
  id: string;
  ownerId: string;
  tenantId: string;
  month: string;
  amount: number;
  status: 'PAID' | 'DUE' | 'OVERDUE' | 'PARTIAL';
  dueDate: string;
  paidAt?: string;
  receiptNo?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface InvoiceData {
  tenantId?: string;
  month: string;
  amount: number;
  status?: 'PAID' | 'DUE' | 'OVERDUE' | 'PARTIAL';
  dueDate?: string;
  paidAt?: string;
  receiptNo?: string;
  description?: string;
}

interface UseInvoicesReturn {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  fetchInvoices: () => Promise<void>;
  createInvoice: (data: InvoiceData) => Promise<Invoice | null>;
  updateInvoice: (id: string, data: InvoiceData) => Promise<Invoice | null>;
  deleteInvoice: (id: string) => Promise<boolean>;
  getInvoiceById: (id: string) => Promise<Invoice | null>;
}

export const useInvoices = (): UseInvoicesReturn => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Fetching invoices...');
      const response = await apiClient.get<Invoice[]>('/invoices');
      console.log('📨 Invoices API Response:', response);
      if (response.success && response.data) {
        const responseData = response.data;
        const data = Array.isArray(responseData) ? responseData : (typeof responseData === 'object' && responseData !== null && 'data' in responseData && Array.isArray((responseData as any).data) ? (responseData as any).data : []);
        // Ensure amount is a number
        const normalizedData = data.map((invoice: Invoice) => ({
          ...invoice,
          amount: typeof invoice.amount === 'string' ? parseFloat(invoice.amount) : invoice.amount,
        }));
        setInvoices(normalizedData);
        console.log('✅ Invoices fetched:', normalizedData?.length || 0);
      } else {
        console.warn('⚠️ API response not successful:', response);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch invoices';
      setError(errorMsg);
      console.error('❌ Error fetching invoices:', errorMsg, err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createInvoice = useCallback(async (data: InvoiceData): Promise<Invoice | null> => {
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { ...data };
      console.log('📤 Creating invoice with payload:', payload);
      const response = await apiClient.post<Invoice>('/invoices', payload);
      console.log('📥 Invoice creation response:', response);
      
      if (response.success && response.data) {
        // Handle nested data structure
        let invoiceData = response.data;
        if (typeof invoiceData === 'object' && invoiceData !== null && 'data' in invoiceData) {
          invoiceData = (invoiceData as any).data;
        }
        
        const newInvoice: Invoice = {
          id: invoiceData.id || '',
          ownerId: invoiceData.ownerId || '',
          tenantId: invoiceData.tenantId || data.tenantId || '',
          month: invoiceData.month || data.month,
          amount: typeof invoiceData.amount === 'string' 
            ? parseFloat(invoiceData.amount) 
            : (typeof invoiceData.amount === 'number' ? invoiceData.amount : data.amount),
          status: invoiceData.status || 'DUE',
          dueDate: invoiceData.dueDate || data.dueDate || '',
          paidAt: invoiceData.paidAt || undefined,
          receiptNo: invoiceData.receiptNo || undefined,
          createdAt: invoiceData.createdAt || new Date().toISOString(),
          updatedAt: invoiceData.updatedAt || new Date().toISOString(),
        };
        
        console.log('✅ Adding new invoice to state:', newInvoice);
        setInvoices(prev => {
          // Check if invoice already exists to avoid duplicates
          const exists = prev.some(inv => inv.id === newInvoice.id || (inv.tenantId === newInvoice.tenantId && inv.month === newInvoice.month));
          if (exists) {
            console.log('⚠️ Invoice already exists, updating instead');
            return prev.map(inv => 
              (inv.id === newInvoice.id || (inv.tenantId === newInvoice.tenantId && inv.month === newInvoice.month))
                ? newInvoice 
                : inv
            );
          }
          return [...prev, newInvoice];
        });
        
        // Also refresh the list to ensure we have the latest data
        setTimeout(() => {
          fetchInvoices();
        }, 500);
        
        return newInvoice;
      }
      console.warn('⚠️ Invoice creation response not successful:', response);
      return null;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create invoice';
      setError(errorMsg);
      console.error('❌ Error creating invoice:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchInvoices]);

  const updateInvoice = useCallback(async (id: string, data: InvoiceData) => {
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { ...data };
      const response = await apiClient.put<Invoice>(`/invoices/${id}`, payload);
      if (response.success && response.data) {
        const updatedInvoice = {
          ...response.data,
          amount: typeof response.data.amount === 'string' ? parseFloat(response.data.amount) : response.data.amount,
        };
        setInvoices(prev => prev.map(inv => inv.id === id ? updatedInvoice : inv));
        return updatedInvoice;
      }
      return null;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update invoice';
      setError(errorMsg);
      console.error('Error updating invoice:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteInvoice = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.delete(`/invoices/${id}`);
      if (response.success) {
        setInvoices(prev => prev.filter(inv => inv.id !== id));
        return true;
      }
      return false;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete invoice';
      setError(errorMsg);
      console.error('Error deleting invoice:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getInvoiceById = useCallback(async (id: string): Promise<Invoice | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<Invoice>(`/invoices/${id}`);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch invoice';
      setError(errorMsg);
      console.error('Error fetching invoice:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch invoices on mount
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    invoices,
    loading,
    error,
    fetchInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoiceById,
  };
};
