import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { API_ENDPOINTS, QUERY_KEYS } from '@/lib/constants';
import { User } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';

// Types
export interface UserListParams {
  page?: number;
  page_size?: number;
  department?: string;
  role?: string;
  is_active?: boolean;
  is_locked?: boolean;
}

export interface UserListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}

export interface UserPermission {
  id: number;
  codename: string;
  name: string;
  source: 'group' | 'direct';
  group?: string;
}

export interface UserPermissionsResponse {
  user: User;
  permissions: {
    from_groups: UserPermission[];
    direct: UserPermission[];
    is_superuser: boolean;
  };
}

export interface AuditLogEntry {
  id: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  timestamp: string;
  actor: string | null;
  changes: Record<string, { old: any; new: any }>;
  remote_addr: string;
}

export interface AuditLogResponse {
  user: User;
  audit_log: AuditLogEntry[];
  count: number;
}

// Hook for fetching current user with full details
export const useCurrentUserProfile = () => {
  return useQuery({
    queryKey: QUERY_KEYS.AUTH.USER,
    queryFn: async () => {
      const response = await apiClient.get<{ authenticated: boolean; user: User; csrf_token: string }>(API_ENDPOINTS.AUTH.SESSION);
      return response.data.user;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook for updating current user profile
export const useUpdateCurrentUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Partial<User>) => {
      const response = await apiClient.patch<User>(API_ENDPOINTS.USERS.UPDATE_ME, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.AUTH.USER, data);
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 
        (error as any)?.response?.data?.message || 'Failed to update profile';
      toast({
        title: 'Update failed',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

// Hook for fetching user detail
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

// Hook for fetching all users (admin)
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

// Hook for fetching department users (for campaign handlers, etc.)
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

// Hook for fetching a specific user
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

// Hook for updating a user
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<User> }) => {
      const response = await apiClient.patch<User>(API_ENDPOINTS.USERS.UPDATE(userId), data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.LIST });
      queryClient.setQueryData(QUERY_KEYS.USERS.DETAIL(variables.userId), data);
      toast({
        title: 'User updated',
        description: 'User has been updated successfully.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 
        (error as any)?.response?.data?.message || 'Failed to update user';
      toast({
        title: 'Update failed',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

// Hook for assigning a role to a user
export const useAssignRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await apiClient.post(API_ENDPOINTS.USERS.ROLE(userId), { role });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.LIST });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.DETAIL(variables.userId) });
      toast({
        title: 'Role assigned',
        description: 'User role has been updated successfully.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 
        (error as any)?.response?.data?.message || 'Failed to assign role';
      toast({
        title: 'Role assignment failed',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

// Hook for removing all roles from a user
export const useRemoveRoles = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.delete(API_ENDPOINTS.USERS.ROLE(userId));
      return response.data;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.LIST });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.DETAIL(userId) });
      toast({
        title: 'Roles removed',
        description: 'All roles have been removed from the user.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 
        (error as any)?.response?.data?.message || 'Failed to remove roles';
      toast({
        title: 'Failed to remove roles',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

// Hook for fetching user permissions
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

// Hook for assigning a permission to a user
export const useAssignPermission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      app_label,
      model,
      permission,
    }: {
      userId: string;
      app_label: string;
      model: string;
      permission: string;
    }) => {
      const response = await apiClient.post(API_ENDPOINTS.USERS.PERMISSIONS(userId), {
        app_label,
        model,
        permission,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.PERMISSIONS(variables.userId) });
      toast({
        title: 'Permission assigned',
        description: 'Permission has been granted successfully.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 
        (error as any)?.response?.data?.message || 'Failed to assign permission';
      toast({
        title: 'Permission assignment failed',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

// Hook for removing a permission from a user
export const useRemovePermission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      app_label,
      model,
      permission,
    }: {
      userId: string;
      app_label?: string;
      model?: string;
      permission?: string;
    }) => {
      const data = app_label ? { app_label, model, permission } : {};
      const response = await apiClient.delete(API_ENDPOINTS.USERS.PERMISSIONS(userId), {
        data,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.PERMISSIONS(variables.userId) });
      toast({
        title: 'Permission removed',
        description: variables.app_label
          ? 'Permission has been revoked successfully.'
          : 'All permissions have been removed.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 
        (error as any)?.response?.data?.message || 'Failed to remove permission';
      toast({
        title: 'Permission removal failed',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

// Hook for locking a user account
export const useLockUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      reason,
      duration_hours = 24,
    }: {
      userId: string;
      reason: string;
      duration_hours?: number;
    }) => {
      const response = await apiClient.post(API_ENDPOINTS.USERS.LOCK(userId), {
        action: 'lock',
        reason,
        duration_hours,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.LIST });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.DETAIL(variables.userId) });
      toast({
        title: 'Account locked',
        description: 'User account has been locked successfully.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 
        (error as any)?.response?.data?.message || 'Failed to lock account';
      toast({
        title: 'Lock failed',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

// Hook for unlocking a user account
export const useUnlockUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.post(API_ENDPOINTS.USERS.LOCK(userId), {
        action: 'unlock',
      });
      return response.data;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.LIST });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.DETAIL(userId) });
      toast({
        title: 'Account unlocked',
        description: 'User account has been unlocked successfully.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 
        (error as any)?.response?.data?.message || 'Failed to unlock account';
      toast({
        title: 'Unlock failed',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

// Hook for fetching user audit log
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

// ==============================================
// NEW: User Profile & Department Request Hooks
// ==============================================

import type {
  UpdateProfileRequest,
  UpdateRoleRequest,
  DepartmentRequest,
  CreateDepartmentRequestRequest,
  ReviewDepartmentRequestRequest,
} from '@/types/user';

/**
 * Hook to update current user profile with image upload support
 */
export const useUpdateProfileWithImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      const formData = new FormData();
      if (data.first_name) formData.append('first_name', data.first_name);
      if (data.last_name) formData.append('last_name', data.last_name);
      if (data.profile_picture) formData.append('profile_picture', data.profile_picture);
      if (data.setup_completed !== undefined)
        formData.append('setup_completed', String(data.setup_completed));

      const response = await apiClient.patch('/api/v1/users/me/profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.AUTH.USER, data);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH.USER });
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message :
        (error as any)?.response?.data?.message || 'Failed to update profile';
      toast({
        title: 'Update failed',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to update user role and department (admin only)
 */
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: UpdateRoleRequest }) => {
      const response = await apiClient.patch(`/api/v1/users/${userId}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.LIST });
      toast({
        title: 'Role updated',
        description: 'User role has been updated successfully.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message :
        (error as any)?.response?.data?.message || 'Failed to update role';
      toast({
        title: 'Update failed',
        description: errorMessage,
        variant: 'destructive',
      });
    },
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
      const response = await apiClient.get<{ count: number; results: DepartmentRequest[] } | DepartmentRequest[]>('/api/v1/department-requests/', {
        params,
      });
      // Handle both paginated and non-paginated responses
      return Array.isArray(response.data) ? response.data : response.data.results;
    },
  });
};

/**
 * Hook to create a department request
 */
export const useCreateDepartmentRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateDepartmentRequestRequest) => {
      const response = await apiClient.post<DepartmentRequest>(
        '/api/v1/department-requests/create/',
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-requests'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH.USER });
      toast({
        title: 'Request submitted',
        description: 'Your department access request has been submitted for review.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message :
        (error as any)?.response?.data?.message || 'Failed to submit request';
      toast({
        title: 'Submission failed',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to review (approve/reject) a department request
 */
export const useReviewDepartmentRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      requestId,
      data,
    }: {
      requestId: number;
      data: ReviewDepartmentRequestRequest;
    }) => {
      const response = await apiClient.patch(
        `/api/v1/department-requests/${requestId}/`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['department-requests'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.LIST });
      toast({
        title: variables.data.status === 'approved' ? 'Request approved' : 'Request rejected',
        description: `Department access request has been ${variables.data.status}.`,
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message :
        (error as any)?.response?.data?.message || 'Failed to review request';
      toast({
        title: 'Review failed',
        description: errorMessage,
        variant: 'destructive',
      });
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

/**
 * Hook to cancel/withdraw a pending department request
 */
export const useCancelDepartmentRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiClient.delete(`/api/v1/department-requests/${requestId}/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-requests'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH.USER });
      toast({
        title: 'Request canceled',
        description: 'Your department request has been canceled. You can now select a different department.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message :
        (error as any)?.response?.data?.message || 'Failed to cancel request';
      toast({
        title: 'Cancellation failed',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};