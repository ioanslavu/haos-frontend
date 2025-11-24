import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { API_ENDPOINTS, QUERY_KEYS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/stores/authStore';
import { handleApiError } from '@/lib/error-handler';

// Types
export interface Role {
  id: number;
  name: string;
  user_count: number;
  permission_count: number;
}

export interface RoleDetail extends Role {
  permissions: Permission[];
  users: User[];
}

export interface Permission {
  id: number;
  name: string;
  codename: string;
  full_codename?: string;
  app_label?: string;
  model?: string;
}

export interface GroupedPermissions {
  [appLabel: string]: {
    [model: string]: {
      model_name: string;
      permissions: Permission[];
    };
  };
}

export interface PermissionsResponse {
  permissions: Permission[];
  grouped: GroupedPermissions;
  count: number;
}

export interface RoleUsersParams {
  is_active?: boolean;
  department?: string;
  search?: string;
}

export interface BulkAssignment {
  user_id: string;
  role_id: number;
}

export interface ManagePermissionsPayload {
  action: 'add' | 'remove' | 'set';
  permissions?: number[];
  permission_codenames?: string[];
}

// Hook for fetching all roles
export const useRolesList = () => {
  return useQuery({
    queryKey: QUERY_KEYS.ROLES.LIST,
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ count: number; results: Role[] } | Role[]>(API_ENDPOINTS.ROLES.LIST);
        
        // Handle paginated response (with results property) or direct array
        if (response.data && typeof response.data === 'object' && 'results' in response.data) {
          return Array.isArray(response.data.results) ? response.data.results : [];
        }
        
        // Handle direct array response
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        handleApiError(error, {
          context: 'fetching roles',
          showToast: false, // Silent failure for graceful degradation
        });
        // Return empty array on error to prevent crashes
        return [];
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Hook for fetching role details
export const useRole = (roleId: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.ROLES.DETAIL(roleId),
    queryFn: async () => {
      const response = await apiClient.get<RoleDetail>(API_ENDPOINTS.ROLES.DETAIL(roleId));
      const data = response.data;
      
      
      // Normalize the response to ensure arrays are properly formatted
      const roleDetail: RoleDetail = {
        id: data.id,
        name: data.name,
        user_count: data.user_count || 0,
        permission_count: data.permission_count || 0,
        permissions: Array.isArray(data.permissions) ? data.permissions : 
                    (data.permissions?.results ? data.permissions.results : []),
        users: Array.isArray(data.users) ? data.users : 
               (data.users?.results ? data.users.results : [])
      };
      
      
      return roleDetail;
    },
    enabled: !!roleId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook for creating a new role
export const useCreateRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { name: string; permissions?: number[] }) => {
      const response = await apiClient.post<Role>(API_ENDPOINTS.ROLES.LIST, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ROLES.LIST });
      toast({
        title: 'Role created',
        description: 'The new role has been created successfully.',
      });
    },
    onError: (error) => {
      handleApiError(error, {
        context: 'creating role',
        showToast: true,
      });
    },
  });
};

// Hook for updating a role
export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ roleId, name }: { roleId: number; name: string }) => {
      const response = await apiClient.patch<Role>(
        API_ENDPOINTS.ROLES.UPDATE(roleId),
        { name }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ROLES.LIST });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ROLES.DETAIL(variables.roleId) });
      toast({
        title: 'Role updated',
        description: 'The role has been updated successfully.',
      });
    },
    onError: (error) => {
      handleApiError(error, {
        context: 'updating role',
        showToast: true,
      });
    },
  });
};

// Hook for deleting a role
export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (roleId: number) => {
      await apiClient.delete(API_ENDPOINTS.ROLES.DELETE(roleId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ROLES.LIST });
      toast({
        title: 'Role deleted',
        description: 'The role has been deleted successfully.',
      });
    },
    onError: (error) => {
      handleApiError(error, {
        context: 'deleting role',
        showToast: true,
        fallbackMessage: 'Failed to delete role. It may have users assigned.',
      });
    },
  });
};

// Hook for fetching users with a specific role
export const useRoleUsers = (roleId: number, params?: RoleUsersParams) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.ROLES.USERS(roleId), params],
    queryFn: async () => {
      const response = await apiClient.get<{ count?: number; results?: User[] } | User[]>(
        API_ENDPOINTS.ROLES.USERS(roleId),
        { params }
      );
      
      // Handle paginated response or direct array
      if (response.data && typeof response.data === 'object' && 'results' in response.data) {
        return Array.isArray(response.data.results) ? response.data.results : [];
      }
      
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!roleId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Hook for fetching role permissions
export const useRolePermissions = (roleId: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.ROLES.PERMISSIONS(roleId),
    queryFn: async () => {
      const response = await apiClient.get<{ count?: number; results?: Permission[] } | Permission[]>(
        API_ENDPOINTS.ROLES.PERMISSIONS(roleId)
      );
      
      // Handle paginated response or direct array
      if (response.data && typeof response.data === 'object' && 'results' in response.data) {
        return Array.isArray(response.data.results) ? response.data.results : [];
      }
      
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!roleId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook for managing role permissions
export const useManageRolePermissions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      roleId,
      payload,
    }: {
      roleId: number;
      payload: ManagePermissionsPayload;
    }) => {
      const response = await apiClient.post(
        API_ENDPOINTS.ROLES.PERMISSIONS(roleId),
        payload
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ROLES.DETAIL(variables.roleId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ROLES.PERMISSIONS(variables.roleId) });
      
      const actionText = variables.payload.action === 'add' ? 'added' :
                        variables.payload.action === 'remove' ? 'removed' : 'updated';
      
      toast({
        title: 'Permissions updated',
        description: `Permissions have been ${actionText} successfully.`,
      });
    },
    onError: (error) => {
      handleApiError(error, {
        context: 'updating permissions',
        showToast: true,
      });
    },
  });
};

// Hook for clearing all role permissions
export const useClearRolePermissions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (roleId: number) => {
      await apiClient.delete(API_ENDPOINTS.ROLES.PERMISSIONS(roleId));
    },
    onSuccess: (_, roleId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ROLES.DETAIL(roleId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ROLES.PERMISSIONS(roleId) });
      toast({
        title: 'Permissions cleared',
        description: 'All permissions have been removed from the role.',
      });
    },
    onError: (error) => {
      handleApiError(error, {
        context: 'clearing permissions',
        showToast: true,
      });
    },
  });
};

// Hook for bulk assigning users to roles
export const useBulkAssignRoles = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (assignments: BulkAssignment[]) => {
      const response = await apiClient.post(
        API_ENDPOINTS.ROLES.BULK_ASSIGN,
        { assignments }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ROLES.LIST });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.LIST });
      toast({
        title: 'Users assigned',
        description: 'Users have been assigned to roles successfully.',
      });
    },
    onError: (error) => {
      handleApiError(error, {
        context: 'assigning users to roles',
        showToast: true,
      });
    },
  });
};

// Hook for fetching all available permissions
export const useAvailablePermissions = (params?: {
  app?: string;
  model?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.PERMISSIONS.LIST, params],
    queryFn: async () => {
      const response = await apiClient.get<PermissionsResponse>(
        API_ENDPOINTS.PERMISSIONS.LIST,
        { params }
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes - permissions don't change often
  });
};