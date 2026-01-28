import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Custom hook wrapper for React Query with consistent error handling
 */
export function useApiQuery<TData = unknown, TError = Error>(
  queryKey: (string | number)[],
  queryFn: () => Promise<TData>,
  options?: Omit<Parameters<typeof useQuery<TData, TError>>[0], 'queryKey' | 'queryFn'>
) {
  const query = useQuery<TData, TError>({
    queryKey,
    queryFn,
    ...options,
  });

  // Handle errors using useEffect since onError is removed in React Query v5
  useEffect(() => {
    if (query.error) {
      const errorMessage = query.error instanceof Error ? query.error.message : 'An error occurred';
      // Don't show toast for area_id errors - component will handle with custom UI
      if (!errorMessage.includes('area_id')) {
        toast.error(errorMessage);
      }
      console.error('API Query Error:', query.error);
    }
  }, [query.error]);

  return query;
}

/**
 * Custom hook wrapper for React Query mutations with consistent error handling
 */
export function useApiMutation<TData = unknown, TVariables = void, TError = Error>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<Parameters<typeof useMutation<TData, TError, TVariables>>[0], 'mutationFn'> & {
    successMessage?: string;
    errorMessage?: string;
    invalidateQueries?: (string | number)[][];
  }
) {
  const queryClient = useQueryClient();

  return useMutation<TData, TError, TVariables>({
    mutationFn,
    onSuccess: (data, variables, context, mutation) => {
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
      
      // Invalidate and refetch related queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
          // Explicitly refetch to ensure data is updated
          queryClient.refetchQueries({ queryKey });
        });
      }
      
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context, mutation);
      }
    },
    onError: (error: any, variables, context, mutation) => {
      // Try to extract detailed error message from API response
      // The fetchService throws an Error with the message already formatted
      let errorMessage = options?.errorMessage || 'An error occurred';
      
      // Check if error has a message property (from fetchService)
      // fetchService formats errors with validation details in the message
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Check for foreign key constraint errors and provide user-friendly message
      const lowerMessage = errorMessage.toLowerCase();
      if (
        lowerMessage.includes('foreign key') ||
        lowerMessage.includes('constraint') ||
        lowerMessage.includes('violates foreign key') ||
        lowerMessage.includes('referenced')
      ) {
        // Check if it's related to consumption
        if (lowerMessage.includes('consumption')) {
          errorMessage = 'Cannot delete: This customer has consumption records. Please deactivate the customer instead.';
        } else {
          errorMessage = 'Cannot delete: This record is referenced by other data. Please check related records first.';
        }
      }
      
      // Log full error details for debugging
      console.error('API Mutation Error:', {
        message: errorMessage,
        error: error,
        variables: variables
      });
      
      toast.error(errorMessage);
      
      if (options?.onError) {
        options.onError(error, variables, context, mutation);
      }
    },
  });
}

/**
 * Hook to get current admin from localStorage
 */
export function useCurrentAdmin() {
  if (typeof window === 'undefined') return null;
  
  try {
    const adminStr = localStorage.getItem('admin');
    if (!adminStr) return null;
    return JSON.parse(adminStr);
  } catch {
    return null;
  }
}

/**
 * Hook to get admin ID for createdBy fields
 */
export function useAdminId(): number | null {
  const admin = useCurrentAdmin();
  return admin?.id || null;
}

