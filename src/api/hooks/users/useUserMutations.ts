import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { API_ENDPOINTS, QUERY_KEYS } from '@/lib/constants';
import { User } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/error-handler';
import type { UpdateProfileRequest, UpdateRoleRequest } from '@/types/user';

export const useUpdateCurrentUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: Partial<User>) => (await apiClient.patch<User>(API_ENDPOINTS.USERS.UPDATE_ME, data)).data,
    onSuccess: (data) => { queryClient.setQueryData(QUERY_KEYS.AUTH.USER, data); toast({ title: 'Profile updated', description: 'Your profile has been updated successfully.' }); },
    onError: (error) => handleApiError(error, { context: 'updating profile', showToast: true }),
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<User> }) => (await apiClient.patch<User>(API_ENDPOINTS.USERS.UPDATE(userId), data)).data,
    onSuccess: (data, variables) => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.LIST }); queryClient.setQueryData(QUERY_KEYS.USERS.DETAIL(variables.userId), data); toast({ title: 'User updated', description: 'User has been updated successfully.' }); },
    onError: (error) => handleApiError(error, { context: 'updating user', showToast: true }),
  });
};

export const useAssignRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => (await apiClient.post(API_ENDPOINTS.USERS.ROLE(userId), { role })).data,
    onSuccess: (_, variables) => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.LIST }); queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.DETAIL(variables.userId) }); toast({ title: 'Role assigned', description: 'User role has been updated successfully.' }); },
    onError: (error) => handleApiError(error, { context: 'assigning role', showToast: true }),
  });
};

export const useRemoveRoles = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (userId: string) => (await apiClient.delete(API_ENDPOINTS.USERS.ROLE(userId))).data,
    onSuccess: (_, userId) => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.LIST }); queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.DETAIL(userId) }); toast({ title: 'Roles removed', description: 'All roles have been removed from the user.' }); },
    onError: (error) => handleApiError(error, { context: 'removing roles', showToast: true }),
  });
};

export const useAssignPermission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ userId, app_label, model, permission }: { userId: string; app_label: string; model: string; permission: string }) => (await apiClient.post(API_ENDPOINTS.USERS.PERMISSIONS(userId), { app_label, model, permission })).data,
    onSuccess: (_, variables) => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.PERMISSIONS(variables.userId) }); toast({ title: 'Permission assigned', description: 'Permission has been granted successfully.' }); },
    onError: (error) => handleApiError(error, { context: 'assigning permission', showToast: true }),
  });
};

export const useRemovePermission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ userId, app_label, model, permission }: { userId: string; app_label?: string; model?: string; permission?: string }) => (await apiClient.delete(API_ENDPOINTS.USERS.PERMISSIONS(userId), { data: app_label ? { app_label, model, permission } : {} })).data,
    onSuccess: (_, variables) => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.PERMISSIONS(variables.userId) }); toast({ title: 'Permission removed', description: variables.app_label ? 'Permission has been revoked successfully.' : 'All permissions have been removed.' }); },
    onError: (error) => handleApiError(error, { context: 'removing permission', showToast: true }),
  });
};

export const useLockUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ userId, reason, duration_hours = 24 }: { userId: string; reason: string; duration_hours?: number }) => (await apiClient.post(API_ENDPOINTS.USERS.LOCK(userId), { action: 'lock', reason, duration_hours })).data,
    onSuccess: (_, variables) => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.LIST }); queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.DETAIL(variables.userId) }); toast({ title: 'Account locked', description: 'User account has been locked successfully.' }); },
    onError: (error) => handleApiError(error, { context: 'locking account', showToast: true }),
  });
};

export const useUnlockUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (userId: string) => (await apiClient.post(API_ENDPOINTS.USERS.LOCK(userId), { action: 'unlock' })).data,
    onSuccess: (_, userId) => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.LIST }); queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.DETAIL(userId) }); toast({ title: 'Account unlocked', description: 'User account has been unlocked successfully.' }); },
    onError: (error) => handleApiError(error, { context: 'unlocking account', showToast: true }),
  });
};

export const useUpdateProfileWithImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      const formData = new FormData();
      if (data.first_name) formData.append('first_name', data.first_name);
      if (data.last_name) formData.append('last_name', data.last_name);
      if (data.profile_picture) formData.append('profile_picture', data.profile_picture);
      if (data.setup_completed !== undefined) formData.append('setup_completed', String(data.setup_completed));
      return (await apiClient.patch('/api/v1/users/me/profile/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
    },
    onSuccess: (data) => { queryClient.setQueryData(QUERY_KEYS.AUTH.USER, data); queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH.USER }); toast({ title: 'Profile updated', description: 'Your profile has been updated successfully.' }); },
    onError: (error) => handleApiError(error, { context: 'updating profile with image', showToast: true }),
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: UpdateRoleRequest }) => (await apiClient.patch(`/api/v1/users/${userId}/`, data)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.LIST }); toast({ title: 'Role updated', description: 'User role has been updated successfully.' }); },
    onError: (error) => handleApiError(error, { context: 'updating user role', showToast: true }),
  });
};
