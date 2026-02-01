import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { QUERY_KEYS } from '@/lib/constants';

interface TestUser {
  id: number;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  role: {
    code: string;
    name: string;
  } | null;
  department: {
    code: string;
    name: string;
  } | null;
}

interface TestUsersResponse {
  test_users: TestUser[];
}

interface ImpersonatePayload {
  user_id: number;
}

/**
 * Get list of test users available for impersonation (admin only)
 */
export const useTestUsers = () => {
  return useQuery({
    queryKey: ['impersonation', 'test-users'],
    queryFn: async () => {
      const response = await apiClient.get<TestUsersResponse>('/api/v1/impersonate/test-users/');
      return response.data.test_users || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Start impersonating a user
 */
export const useImpersonateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ImpersonatePayload) => {
      const response = await apiClient.post('/api/v1/impersonate/start/', payload);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate auth queries to refresh user state
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH.USER });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH.SESSION });
    },
  });
};

/**
 * Stop impersonating and return to real user
 */
export const useStopImpersonation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/api/v1/impersonate/stop/');
      return response.data;
    },
    onSuccess: () => {
      // Invalidate auth queries to refresh user state
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH.USER });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH.SESSION });
    },
  });
};
