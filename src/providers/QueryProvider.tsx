import React from 'react';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useUIStore } from '@/stores/uiStore';
import { AuthError, NetworkError } from '@/lib/errors';
import { DEV_MODE } from '@/lib/constants';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Always consider data stale - refetch on mount
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: (failureCount, error) => {
        if (error instanceof AuthError) return false;
        if (error instanceof NetworkError) return failureCount < 3;
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false, // Disable to prevent issues with OAuth popups
      refetchOnReconnect: true,
      refetchOnMount: false, // Don't refetch on mount - rely on invalidations
    },
    mutations: {
      retry: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.state.data !== undefined) {
        return;
      }
      
      const { addNotification } = useUIStore.getState();
      
      if (error instanceof AuthError) {
        addNotification({
          type: 'error',
          title: 'Authentication Error',
          description: error.message,
        });
      } else if (error instanceof NetworkError) {
        addNotification({
          type: 'error',
          title: 'Network Error',
          description: error.message,
        });
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      const { addNotification } = useUIStore.getState();
      
      if (error instanceof AuthError) {
        addNotification({
          type: 'error',
          title: 'Authentication Error',
          description: error.message,
        });
      } else if (error instanceof NetworkError) {
        addNotification({
          type: 'error',
          title: 'Network Error',
          description: error.message,
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          description: error instanceof Error ? error.message : 'An unexpected error occurred',
        });
      }
    },
  }),
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Devtools disabled - can cause performance issues */}
      {/* {DEV_MODE && <ReactQueryDevtools initialIsOpen={false} />} */}
    </QueryClientProvider>
  );
};

export { queryClient };