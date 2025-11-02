'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';

export interface MaintenanceTicket {
  id: string;
  ownerId: string;
  tenantId: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  resolvedAt?: string;
}

interface UseMaintenanceTicketsReturn {
  tickets: MaintenanceTicket[];
  loading: boolean;
  error: string | null;
  fetchTickets: () => Promise<void>;
  createTicket: (data: any) => Promise<MaintenanceTicket | null>;
  updateTicket: (id: string, data: any) => Promise<MaintenanceTicket | null>;
  deleteTicket: (id: string) => Promise<boolean>;
  getTicketById: (id: string) => Promise<MaintenanceTicket | null>;
}

export const useMaintenanceTickets = (): UseMaintenanceTicketsReturn => {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/maintenance');
      if (response.success) {
        const responseData = response.data as any;
        const tickets = Array.isArray(responseData) ? responseData : (responseData?.data || []);
        setTickets(tickets as MaintenanceTicket[]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch maintenance tickets');
      console.error('Error fetching maintenance tickets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTicket = useCallback(async (data: any): Promise<MaintenanceTicket | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/maintenance', data);
      if (response.success) {
        const newTicket = response.data as MaintenanceTicket;
        setTickets(prev => [...prev, newTicket]);
        return newTicket;
      }
      return null;
    } catch (err: any) {
      setError(err.message || 'Failed to create maintenance ticket');
      console.error('Error creating maintenance ticket:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTicket = useCallback(async (id: string, data: any): Promise<MaintenanceTicket | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.put(`/maintenance/${id}`, data);
      if (response.success) {
        const updatedTicket = response.data as MaintenanceTicket;
        setTickets(prev => prev.map(t => t.id === id ? updatedTicket : t));
        return updatedTicket;
      }
      return null;
    } catch (err: any) {
      setError(err.message || 'Failed to update maintenance ticket');
      console.error('Error updating maintenance ticket:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTicket = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.delete(`/maintenance/${id}`);
      if (response.success) {
        setTickets(prev => prev.filter(t => t.id !== id));
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.message || 'Failed to delete maintenance ticket');
      console.error('Error deleting maintenance ticket:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTicketById = useCallback(async (id: string): Promise<MaintenanceTicket | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/maintenance/${id}`);
      if (response.success) {
        return response.data as MaintenanceTicket;
      }
      return null;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch maintenance ticket');
      console.error('Error fetching maintenance ticket:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch tickets on mount
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return {
    tickets,
    loading,
    error,
    fetchTickets,
    createTicket,
    updateTicket,
    deleteTicket,
    getTicketById,
  };
};
