import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { API_ENDPOINTS, QUERY_KEYS } from '@/lib/constants';
import { useAuthStore, User } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

export const useCurrentUser = () => {
  const setUser = useAuthStore((state) => state.setUser);
  
  return useQuery({
    queryKey: QUERY_KEYS.AUTH.USER,
    queryFn: async () => {
      const response = await apiClient.get<User>(API_ENDPOINTS.AUTH.ME);
      const user = response.data;
      setUser(user);
      return user;
    },
    retry: false,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
};

export const useLogin = () => {
  const login = useAuthStore((state) => state.login);
  
  return useMutation({
    mutationFn: async () => {
      login(); // This now just redirects, no async needed
      return null;
    },
  });
};

export const useLogout = () => {
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { addNotification } = useUIStore();
  
  return useMutation({
    mutationFn: async () => {
      await logout();
    },
    onSuccess: () => {
      queryClient.clear();
      navigate('/login');
      addNotification({
        type: 'success',
        title: 'Logged out successfully',
      });
    },
    onError: () => {
      queryClient.clear();
      navigate('/login');
    },
  });
};

export const useCheckAuth = () => {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  
  return useQuery({
    queryKey: QUERY_KEYS.AUTH.SESSION,
    queryFn: checkAuth,
    retry: false,
    staleTime: 0,
  });
};

// Legacy hook for backward compatibility - use useDetailedPermissions from usePermissions.ts instead
export const usePermissions = () => {
  return useQuery({
    queryKey: QUERY_KEYS.AUTH.PERMISSIONS,
    queryFn: async () => {
      const response = await apiClient.get<string[]>(`${API_ENDPOINTS.AUTH.ME}permissions/`);
      return response.data;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};