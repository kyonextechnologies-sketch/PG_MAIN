'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/apiClient';
import { socketService } from '@/services/socket.service';

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

    // ✅ Check session before making request
    try {
      const { getSession } = await import('next-auth/react');
      const session = await getSession();
      if (!session?.user?.id) {
        console.warn('⚠️ [useProperties] No valid session - skipping fetch');
        setError('Please login to view properties');
        setLoading(false);
        return;
      }
    } catch (sessionError) {
      console.warn('⚠️ [useProperties] Error checking session:', sessionError);
      setError('Session error - please login again');
      setLoading(false);
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
      const payload: Record<string, unknown> = { ...data };
      const response = await apiClient.post<Property>('/properties', payload);
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
      const payload: Record<string, unknown> = { ...data };
      const response = await apiClient.put<Property>(`/properties/${id}`, payload);
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
    
    // Optimistic update: store property for rollback
    const propertyToDelete = properties.find(p => p.id === id);
    
    // Remove from state immediately
    setProperties(prev => prev.filter(p => p.id !== id));
    
    try {
      const response = await apiClient.delete(`/properties/${id}`);
      if (response.success) {
        console.log('✅ Property deleted successfully');
        return true;
      } else {
        // Rollback optimistic update
        if (propertyToDelete) {
          setProperties(prev => [...prev, propertyToDelete]);
        }
        throw new Error(response.error || response.message || 'Failed to delete property');
      }
    } catch (err: unknown) {
      // Rollback optimistic update
      if (propertyToDelete) {
        setProperties(prev => [...prev, propertyToDelete]);
      }
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete property';
      setError(errorMsg);
      console.error('Error deleting property:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [properties]);

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

    // Listen for real-time property updates
    socketService.onDataUpdate('property', (event, data) => {
      console.log('🔄 Real-time property update:', event, data);
      
      if (event === 'create') {
        setProperties(prev => [...prev, data]);
      } else if (event === 'update') {
        setProperties(prev => prev.map(p => p.id === data.id ? data : p));
      } else if (event === 'delete') {
        setProperties(prev => prev.filter(p => p.id !== data.id));
      }
    });

    return () => {
      socketService.offDataUpdate('property');
    };
  }, [session]);

  // Memoize active properties
  const activeProperties = useMemo(() => {
    return properties.filter(p => p.active !== false);
  }, [properties]);

  return {
    properties: activeProperties,
    loading,
    error,
    fetchProperties,
    createProperty,
    updateProperty,
    deleteProperty,
    getPropertyById,
  };
};
