'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/apiClient';

interface Room {
  id: string;
  propertyId: string;
  roomNumber: string;
  capacity: number;
  amenities?: string[];
  sharingType?: string;
  status?: string;
}

interface PropertyData {
  id?: string;
  name: string;
  address: string;
  city: string;
  totalRooms?: number;
  totalBeds?: number;
  amenities?: string[];
  active?: boolean;
}

interface Property extends PropertyData {
  id: string;
  ownerId: string;
  createdAt?: string;
  updatedAt?: string;
  rooms?: Room[];
}

interface UsePropertiesReturn {
  properties: Property[];
  loading: boolean;
  error: string | null;
  fetchProperties: () => Promise<void>;
  createProperty: (data: PropertyData) => Promise<Property | null>;
  updateProperty: (id: string, data: PropertyData) => Promise<Property | null>;
  deleteProperty: (id: string) => Promise<boolean>;
  getPropertyById: (id: string) => Promise<Property | null>;
}

export const useProperties = (): UsePropertiesReturn => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasInitialFetch = useRef(false);  // ✅ Track if initial fetch was done
  const isFetching = useRef(false);  // ✅ Track if fetch is currently in progress

  const fetchProperties = useCallback(async () => {
    // ✅ Prevent simultaneous requests
    if (isFetching.current) {
      console.log('⏳ Properties fetch already in progress, skipping...');
      return;
    }

    isFetching.current = true;
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Fetching properties...');
      const response = await apiClient.get<Property[]>('/properties');
      if (response.success && response.data) {
        const responseData = response.data;
        const properties = Array.isArray(responseData) ? responseData : (typeof responseData === 'object' && responseData !== null && 'data' in responseData && Array.isArray((responseData as any).data) ? (responseData as any).data : []);
        setProperties(properties);
        console.log('✅ Properties fetched:', properties?.length || 0);
      }
    } catch (err: unknown) {
      const errorMsg = (err instanceof Error ? err.message : 'Failed to fetch properties') || 'Failed to fetch properties';
      setError(errorMsg);
      console.error('❌ Error fetching properties:', errorMsg);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);  // ✅ Empty dependency array - no recreations!

  const createProperty = useCallback(async (data: PropertyData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<Property>('/properties', data);
      if (response.success && response.data) {
        const newProperty = response.data;
        setProperties(prev => [...prev, newProperty]);
        return newProperty;
      }
      return null;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create property';
      setError(errorMsg);
      console.error('Error creating property:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProperty = useCallback(async (id: string, data: PropertyData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.put<Property>(`/properties/${id}`, data);
      if (response.success && response.data) {
        const updatedProperty = response.data;
        setProperties(prev => prev.map(p => p.id === id ? updatedProperty : p));
        return updatedProperty;
      }
      return null;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update property';
      setError(errorMsg);
      console.error('Error updating property:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProperty = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.delete(`/properties/${id}`);
      if (response.success) {
        setProperties(prev => prev.filter(p => p.id !== id));
        return true;
      }
      return false;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete property';
      setError(errorMsg);
      console.error('Error deleting property:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPropertyById = useCallback(async (id: string): Promise<Property | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<Property>(`/properties/${id}`);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch property';
      setError(errorMsg);
      console.error('Error fetching property:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch properties on mount
  useEffect(() => {
    if (!hasInitialFetch.current) {
      console.log('📦 Initial properties fetch...');
      hasInitialFetch.current = true;
      fetchProperties();
    }
  }, []);  // ✅ Empty - only run once on mount

  return {
    properties,
    loading,
    error,
    fetchProperties,
    createProperty,
    updateProperty,
    deleteProperty,
    getPropertyById,
  };
};
