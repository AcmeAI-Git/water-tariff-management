import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Custom hook wrapper for React Query with consistent error handling
 */
export function useApiQuery<TData = unknown, TError = Error>(
  queryKey: (string | number)[],
  queryFn: () => Promise<TData>,
  options?: Omit<Parameters<typeof useQuery<TData, TError>>[0], 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, TError>({
    queryKey,
    queryFn,
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast.error(errorMessage);
      console.error('API Query Error:', error);
    },
    ...options,
  });
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
    onSuccess: (data, variables, context) => {
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
      
      // Invalidate related queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      const errorMessage = 
        options?.errorMessage || 
        (error instanceof Error ? error.message : 'An error occurred');
      toast.error(errorMessage);
      console.error('API Mutation Error:', error);
      
      if (options?.onError) {
        options.onError(error, variables, context);
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

