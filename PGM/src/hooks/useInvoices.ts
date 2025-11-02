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

interface UseInvoicesReturn {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  fetchInvoices: () => Promise<void>;
  createInvoice: (data: any) => Promise<Invoice | null>;
  updateInvoice: (id: string, data: any) => Promise<Invoice | null>;
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
      const response = await apiClient.get('/invoices');
      if (response.success) {
        const responseData = response.data as any;
        const data = Array.isArray(responseData) ? responseData : (responseData?.data || []);
        setInvoices(data as Invoice[]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch invoices');
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createInvoice = useCallback(async (data: any): Promise<Invoice | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/invoices', data);
      if (response.success) {
        const newInvoice = response.data as Invoice;
        setInvoices(prev => [...prev, newInvoice]);
        return newInvoice;
      }
      return null;
    } catch (err: any) {
      setError(err.message || 'Failed to create invoice');
      console.error('Error creating invoice:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateInvoice = useCallback(async (id: string, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.put(`/invoices/${id}`, data);
      if (response.success) {
        const updatedInvoice = response.data as Invoice;
        setInvoices(prev => prev.map(inv => inv.id === id ? updatedInvoice : inv));
        return updatedInvoice;
      }
      return null;
    } catch (err: any) {
      setError(err.message || 'Failed to update invoice');
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
    } catch (err: any) {
      setError(err.message || 'Failed to delete invoice');
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
      const response = await apiClient.get(`/invoices/${id}`);
      if (response.success) {
        return response.data as Invoice;
      }
      return null;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch invoice');
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
