import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { QUERY_KEYS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/stores/authStore';

// Types
export interface Session {
  id: string;
  session_key: string;
  created_at: string;
  last_activity: string;
  expires_at: string;
  expire_date?: string; // for backwards compatibility
  ip_address: string;
  location?: string;
  device_name: string;
  is_current: boolean;
}

export interface SessionsResponse {
  sessions: Session[];
  count: number;
  max_allowed: number;
  max_sessions?: number; // for backwards compatibility
}

export interface UserSessionsResponse {
  user: User;
  sessions: Session[];
  count: number;
  max_allowed: number;
  max_sessions?: number; // for backwards compatibility
}

export interface SessionStatusResponse {
  authenticated: boolean;
  user: User | null;
  session_created?: string;
  session_expires?: string;
  last_activity?: string;
  csrf_token: string;
}

// Hook for checking session status
export const useSessionStatus = () => {
  return useQuery({
    queryKey: QUERY_KEYS.AUTH.SESSION,
    queryFn: async () => {
      const response = await apiClient.get<SessionStatusResponse>('/api/v1/auth/session/');
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook for fetching current user's sessions
export const useCurrentUserSessions = () => {
  return useQuery({
    queryKey: ['sessions', 'current-user'],
    queryFn: async () => {
      const response = await apiClient.get<SessionsResponse>('/api/v1/auth/sessions/');
      return response.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Hook for revoking a specific session
export const useRevokeSession = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (sessionKey: string) => {
      const response = await apiClient.delete(
        `/api/v1/auth/sessions/${sessionKey}/`
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast({
        title: 'Session revoked',
        description: data.device_name ? 
          `Session for ${data.device_name} has been revoked.` : 
          'Session has been revoked successfully.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.detail || 
        (error as any)?.response?.data?.message || 
        'Failed to revoke session';
      
      if (errorMessage.includes('current session')) {
        toast({
          title: 'Cannot revoke current session',
          description: 'You cannot revoke the session you are currently using.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to revoke session',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
  });
};

// Hook for revoking all other sessions
export const useRevokeAllSessions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete('/api/v1/auth/sessions/');
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      const count = data.revoked_count || 0;
      toast({
        title: 'Sessions revoked',
        description: count > 0 
          ? `${count} session${count > 1 ? 's' : ''} have been revoked.`
          : 'No other sessions to revoke.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.detail || 
        (error as any)?.response?.data?.message || 
        'Failed to revoke sessions';
      toast({
        title: 'Failed to revoke sessions',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

// Admin hooks

// Hook for fetching a specific user's sessions (admin only)
export const useUserSessions = (userId: string) => {
  return useQuery({
    queryKey: ['sessions', 'user', userId],
    queryFn: async () => {
      const response = await apiClient.get<UserSessionsResponse>(
        `/api/v1/users/${userId}/sessions/`
      );
      return response.data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Hook for revoking all sessions of a specific user (admin only)
export const useAdminRevokeUserSessions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.delete(
        `/api/v1/users/${userId}/sessions/`
      );
      return response.data;
    },
    onSuccess: (data, userId) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', 'user', userId] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.DETAIL(userId) });
      const count = data.revoked_count || 0;
      toast({
        title: 'User sessions revoked',
        description: count > 0 
          ? `All ${count} session${count > 1 ? 's' : ''} have been revoked.`
          : 'No sessions to revoke.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.detail || 
        (error as any)?.response?.data?.message || 
        'Failed to revoke user sessions';
      
      if (errorMessage.includes('own sessions')) {
        toast({
          title: 'Cannot revoke own sessions',
          description: 'Admins cannot revoke their own sessions using this action.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to revoke sessions',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
  });
};

// Hook for revoking a specific session of a user (admin only)
export const useAdminRevokeUserSession = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, sessionKey }: { userId: string; sessionKey: string }) => {
      const response = await apiClient.delete(
        `/api/v1/users/${userId}/sessions/${sessionKey}/`
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', 'user', variables.userId] });
      toast({
        title: 'Session revoked',
        description: data.device_name ? 
          `Session for ${data.device_name} has been revoked.` : 
          'User session has been revoked successfully.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.detail || 
        (error as any)?.response?.data?.message || 
        'Failed to revoke session';
      
      if (errorMessage.includes('current session')) {
        toast({
          title: 'Cannot revoke current session',
          description: 'Admins cannot revoke their own current session.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to revoke session',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
  });
};