import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { API_ENDPOINTS, QUERY_KEYS } from '@/lib/constants';
import type { UserListParams, UserListResponse, UserPermissionsResponse, AuditLogResponse } from './types';

/**
 * Hook for fetching current user with full details
 */
export const useCurrentUserProfile = () => {
  return useQuery({
    queryKey: QUERY_KEYS.AUTH.USER,
    queryFn: async () => {
      const response = await apiClient.get<{ authenticated: boolean; user: any; csrf_token: string }>(
        API_ENDPOINTS.AUTH.SESSION
      );
      return response.data.user;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook for fetching all users (admin)
 */
export const useUsersList = (params?: UserListParams) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.USERS.LIST, params],
    queryFn: async () => {
      const response = await apiClient.get<UserListResponse>(API_ENDPOINTS.USERS.LIST, {
        params,
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Hook for fetching department users (for campaign handlers, etc.)
 */
export const useDepartmentUsers = (params?: UserListParams) => {
  return useQuery({
    queryKey: ['department-users', params],
    queryFn: async () => {
      const response = await apiClient.get<UserListResponse>(API_ENDPOINTS.USERS.DEPARTMENT, {
        params,
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Hook for fetching user permissions
 */
export const useUserPermissions = (userId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.USERS.PERMISSIONS(userId),
    queryFn: async () => {
      const response = await apiClient.get<UserPermissionsResponse>(
        API_ENDPOINTS.USERS.PERMISSIONS(userId)
      );
      return response.data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook for fetching user audit log
 */
export const useUserAuditLog = (userId: string, limit: number = 100) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.USERS.AUDIT(userId), limit],
    queryFn: async () => {
      const response = await apiClient.get<AuditLogResponse>(API_ENDPOINTS.USERS.AUDIT(userId), {
        params: { limit },
      });
      return response.data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Hook to list department requests
 */
export const useDepartmentRequests = (status?: 'pending' | 'approved' | 'rejected') => {
  return useQuery({
    queryKey: ['department-requests', status],
    queryFn: async () => {
      const params = status ? { status } : {};
      const response = await apiClient.get<{ count: number; results: any[] } | any[]>(
        '/api/v1/department-requests/',
        { params }
      );
      // Handle both paginated and non-paginated responses
      return Array.isArray(response.data) ? response.data : response.data.results;
    },
  });
};

/**
 * Hook to get count of pending department requests
 */
export const usePendingRequestsCount = () => {
  return useQuery({
    queryKey: ['department-requests', 'pending', 'count'],
    queryFn: async () => {
      const response = await apiClient.get<{ count: number }>(
        '/api/v1/department-requests/pending/count/'
      );
      return response.data.count;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
