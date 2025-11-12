'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  propertyId?: string;
  roomId?: string;
  bedId?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  rentAmount?: number;
  leaseStart?: string;
  leaseEnd?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UseTenantsReturn {
  tenants: Tenant[];
  loading: boolean;
  error: string | null;
  fetchTenants: () => Promise<void>;
  createTenant: (tenantData: Partial<Tenant>) => Promise<boolean>;
  updateTenant: (id: string, tenantData: Partial<Tenant>) => Promise<boolean>;
  deleteTenant: (id: string) => Promise<boolean>;
}

export const useTenants = (): UseTenantsReturn => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasInitialFetch = useRef(false);
  const isFetching = useRef(false);

  const fetchTenants = useCallback(async () => {
    if (isFetching.current) {
      console.log('⏳ Tenants fetch already in progress, skipping...');
      return;
    }

    isFetching.current = true;
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Fetching tenants...');
      const response = await apiClient.get('/tenants');
      if (response.success) {
        const tenantsData = Array.isArray(response.data) ? response.data : [];
        setTenants(tenantsData as Tenant[]);
        console.log('✅ Tenants fetched:', tenantsData.length || 0);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch tenants';
      setError(msg);
      console.error('❌ Error fetching tenants:', msg);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  /**
   * ✅ Create a new tenant
   */
  const createTenant = useCallback(async (tenantData: Partial<Tenant>): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await apiClient.post('/tenants', tenantData);
      if (response.success) {
        await fetchTenants();
        return true;
      } else {
        setError(response.message || 'Failed to create tenant');
        return false;
      }
    } catch (err: unknown) {
      const msg =
        (err instanceof Error ? err.message : 'Failed to create tenant') || 'Failed to create tenant';
      console.error('❌ createTenant:', msg);
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTenants]);

  /**
   * ✅ Update an existing tenant
   */
  const updateTenant = useCallback(async (id: string, tenantData: Partial<Tenant>): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await apiClient.put(`/tenants/${id}`, tenantData);
      if (response.success) {
        await fetchTenants();
        return true;
      } else {
        setError(response.message || 'Failed to update tenant');
        return false;
      }
    } catch (err: unknown) {
      const msg =
        (err instanceof Error ? err.message : 'Failed to update tenant') || 'Failed to update tenant';
      console.error('❌ updateTenant:', msg);
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTenants]);

  /**
   * ✅ Delete a tenant
   */
  const deleteTenant = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await apiClient.delete(`/tenants/${id}`);
      if (response.success) {
        await fetchTenants();
        return true;
      } else {
        setError(response.message || 'Failed to delete tenant');
        return false;
      }
    } catch (err: unknown) {
      const msg =
        (err instanceof Error ? err.message : 'Failed to delete tenant') || 'Failed to delete tenant';
      console.error('❌ deleteTenant:', msg);
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTenants]);

  /**
   * ✅ Initial auto-fetch (only once)
   */
  useEffect(() => {
    if (!hasInitialFetch.current) {
      hasInitialFetch.current = true;
      fetchTenants();
    }
  }, [fetchTenants]);

  return {
    tenants,
    loading,
    error,
    fetchTenants,
    createTenant,
    updateTenant,
    deleteTenant,
  };
};
