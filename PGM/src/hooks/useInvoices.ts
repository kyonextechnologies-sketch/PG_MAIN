'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/apiClient';
import { socketService } from '@/services/socket.service';

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
  sendReminder: (id: string) => Promise<boolean>;
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
      const isConnectionError = errorMsg.includes('Failed to fetch') ||
                                errorMsg.includes('ERR_CONNECTION_REFUSED') ||
                                errorMsg.includes('NetworkError');
      
      // Only set error for non-connection errors
      // Connection errors are expected if backend is not running
      if (!isConnectionError) {
        setError(errorMsg);
        console.error('❌ Error fetching invoices:', errorMsg);
      } else if (process.env.NODE_ENV === 'development') {
        // Only log connection errors in development
        console.warn('⚠️ Backend not reachable - invoices not loaded');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const createInvoice = useCallback(async (data: InvoiceData): Promise<Invoice | null> => {
    setLoading(true);
    setError(null);
    
    // Optimistic update: create temporary invoice
    const tempId = `temp-${Date.now()}`;
    const optimisticInvoice: Invoice = {
      id: tempId,
      ownerId: '',
      tenantId: data.tenantId || '',
      month: data.month,
      amount: data.amount,
      status: 'DUE',
      dueDate: data.dueDate || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setInvoices(prev => [...prev, optimisticInvoice]);
    
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
        
        // Replace optimistic invoice with real one
        setInvoices(prev => prev.map(inv => inv.id === tempId ? newInvoice : inv));
        
        return newInvoice;
      } else {
        // Rollback optimistic update
        setInvoices(prev => prev.filter(inv => inv.id !== tempId));
        throw new Error(response.error || response.message || 'Failed to create invoice');
      }
    } catch (err: unknown) {
      // Rollback optimistic update
      setInvoices(prev => prev.filter(inv => inv.id !== tempId));
      const errorMsg = err instanceof Error ? err.message : 'Failed to create invoice';
      setError(errorMsg);
      console.error('❌ Error creating invoice:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

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
    
    // Optimistic update: store invoice for rollback
    const invoiceToDelete = invoices.find(inv => inv.id === id);
    
    // Remove from state immediately
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    
    try {
      const response = await apiClient.delete(`/invoices/${id}`);
      if (response.success) {
        console.log('✅ Invoice deleted successfully');
        return true;
      } else {
        // Rollback optimistic update
        if (invoiceToDelete) {
          setInvoices(prev => [...prev, invoiceToDelete]);
        }
        throw new Error(response.error || response.message || 'Failed to delete invoice');
      }
    } catch (err: unknown) {
      // Rollback optimistic update
      if (invoiceToDelete) {
        setInvoices(prev => [...prev, invoiceToDelete]);
      }
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete invoice';
      setError(errorMsg);
      console.error('Error deleting invoice:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [invoices]);

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

  const sendReminder = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post(`/invoices/${id}/send-reminder`, {});
      if (response.success) {
        console.log('✅ Payment reminder sent successfully');
        return true;
      }
      return false;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send reminder';
      setError(errorMsg);
      console.error('Error sending reminder:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch invoices on mount
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Real-time updates via WebSocket
  const { data: session } = useSession();
  useEffect(() => {
    if (!session?.user) return;

    const token = (session as any)?.accessToken;
    if (!token) return;

    // Ensure socket is connected
    if (!socketService.isSocketConnected()) {
      socketService.connect(token);
    }

    // Listen for real-time invoice updates
    socketService.onDataUpdate('invoice', (event, data) => {
      console.log('🔄 Real-time invoice update:', event, data);
      
      if (event === 'create') {
        setInvoices(prev => [...prev, data]);
      } else if (event === 'update') {
        setInvoices(prev => prev.map(inv => inv.id === data.id ? data : inv));
      } else if (event === 'delete') {
        setInvoices(prev => prev.filter(inv => inv.id !== data.id));
      }
    });

    return () => {
      socketService.offDataUpdate('invoice');
    };
  }, [session]);

  // Memoize filtered/sorted invoices
  const sortedInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => {
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      return dateB - dateA; // Newest first
    });
  }, [invoices]);

  return {
    invoices: sortedInvoices,
    loading,
    error,
    fetchInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoiceById,
    sendReminder,
  };
};
