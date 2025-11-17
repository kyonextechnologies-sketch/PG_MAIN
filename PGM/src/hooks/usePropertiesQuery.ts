/**
 * React Query version of useProperties hook
 * Provides better caching, error handling, and loading states
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useSession } from 'next-auth/react';

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  pincode?: string;
  totalBeds?: number;
  totalRooms?: number;
  amenities?: string[];
  ownerId: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PropertyData {
  name: string;
  address: string;
  city: string;
  state?: string;
  pincode?: string;
  totalBeds?: number;
  totalRooms?: number;
  amenities?: string[];
}

export function usePropertiesQuery() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // Query for fetching properties
  const {
    data: properties = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['properties', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) {
        throw new Error('No session found');
      }
      const response = await apiClient.get<Property[]>('/properties');
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch properties');
      }
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!session?.user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Mutation for creating property
  const createMutation = useMutation({
    mutationFn: async (data: PropertyData) => {
      const payload: Record<string, unknown> = { ...data };
      const response = await apiClient.post<Property>('/properties', payload);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create property');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });

  // Mutation for updating property
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PropertyData }) => {
      const payload: Record<string, unknown> = { ...data };
      const response = await apiClient.put<Property>(`/properties/${id}`, payload);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update property');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });

  // Mutation for deleting property
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/properties/${id}`);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete property');
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });

  return {
    properties,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
    createProperty: createMutation.mutateAsync,
    updateProperty: updateMutation.mutateAsync,
    deleteProperty: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

