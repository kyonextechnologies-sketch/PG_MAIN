/**
 * React Query utilities and custom hooks
 * Provides optimized data fetching with caching, error handling, and loading states
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { apiClient, ApiResponse } from './apiClient';

/**
 * Generic query hook factory
 */
export function createQueryHook<TData, TError = Error>(
  queryKey: string[],
  endpoint: string,
  options?: Omit<UseQueryOptions<ApiResponse<TData>, TError>, 'queryKey' | 'queryFn'>
) {
  return () => {
    return useQuery<ApiResponse<TData>, TError>({
      queryKey,
      queryFn: async () => {
        const response = await apiClient.get<TData>(endpoint);
        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch data');
        }
        return response;
      },
      ...options,
    });
  };
}

/**
 * Generic mutation hook factory
 */
export function createMutationHook<TData, TVariables = unknown, TError = Error>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
  options?: Omit<UseMutationOptions<ApiResponse<TData>, TError, TVariables>, 'mutationFn'>
) {
  return () => {
    const queryClient = useQueryClient();

    return useMutation<ApiResponse<TData>, TError, TVariables>({
      mutationFn: async (variables: TVariables) => {
        let response: ApiResponse<TData>;
        
        switch (method) {
          case 'POST':
            response = await apiClient.post<TData>(endpoint, variables as Record<string, unknown>);
            break;
          case 'PUT':
            response = await apiClient.put<TData>(endpoint, variables as Record<string, unknown>);
            break;
          case 'PATCH':
            response = await apiClient.patch<TData>(endpoint, variables as Record<string, unknown>);
            break;
          case 'DELETE':
            response = await apiClient.delete<TData>(endpoint);
            break;
          default:
            throw new Error(`Unsupported method: ${method}`);
        }

        if (!response.success) {
          throw new Error(response.error || 'Operation failed');
        }
        return response;
      },
      onSuccess: () => {
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: [endpoint.split('/')[1]] });
      },
      ...options,
    });
  };
}

/**
 * Helper to invalidate queries
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient();
  
  return {
    invalidate: (queryKey: string[]) => {
      queryClient.invalidateQueries({ queryKey });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries();
    },
  };
}

