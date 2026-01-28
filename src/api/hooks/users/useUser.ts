import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { API_ENDPOINTS, QUERY_KEYS } from '@/lib/constants';
import { User } from '@/stores/authStore';

/**
 * Hook for fetching user detail
 */
export const useUserDetail = (userId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.USERS.DETAIL(userId),
    queryFn: async () => {
      const response = await apiClient.get<User>(API_ENDPOINTS.USERS.DETAIL(userId));
      return response.data;
    },
    enabled: !!userId,
  });
};

/**
 * Hook for fetching a specific user
 */
export const useUser = (userId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.USERS.DETAIL(userId),
    queryFn: async () => {
      const response = await apiClient.get<User>(API_ENDPOINTS.USERS.DETAIL(userId));
      return response.data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
