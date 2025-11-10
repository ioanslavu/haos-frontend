/**
 * Alert Configuration Hooks
 *
 * TanStack Query hooks for alert configuration management.
 * Admin-only operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAlertConfigurations,
  fetchAlertConfiguration,
  updateAlertConfiguration,
  toggleAlertConfiguration,
} from '@/api/alertConfigurationApi';
import { AlertConfigurationUpdate } from '@/types/alertConfiguration';
import { toast } from 'sonner';

const ALERT_CONFIG_KEYS = {
  all: ['alertConfigurations'] as const,
  lists: () => [...ALERT_CONFIG_KEYS.all, 'list'] as const,
  list: (filters?: any) => [...ALERT_CONFIG_KEYS.lists(), filters] as const,
  details: () => [...ALERT_CONFIG_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...ALERT_CONFIG_KEYS.details(), id] as const,
};

/**
 * Fetch all alert configurations
 */
export const useAlertConfigurations = () => {
  return useQuery({
    queryKey: ALERT_CONFIG_KEYS.lists(),
    queryFn: async () => {
      const response = await fetchAlertConfigurations();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch a specific alert configuration
 */
export const useAlertConfiguration = (id: number) => {
  return useQuery({
    queryKey: ALERT_CONFIG_KEYS.detail(id),
    queryFn: async () => {
      const response = await fetchAlertConfiguration(id);
      return response.data;
    },
    enabled: !!id,
  });
};

/**
 * Update alert configuration mutation
 */
export const useUpdateAlertConfiguration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AlertConfigurationUpdate }) =>
      updateAlertConfiguration(id, data),
    onSuccess: (response) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ALERT_CONFIG_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ALERT_CONFIG_KEYS.detail(response.data.id) });

      toast.success('Alert configuration updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to update alert configuration';
      toast.error(message);
    },
  });
};

/**
 * Toggle alert enabled/disabled mutation
 */
export const useToggleAlertConfiguration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) =>
      toggleAlertConfiguration(id, enabled),
    onSuccess: (response) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ALERT_CONFIG_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ALERT_CONFIG_KEYS.detail(response.data.id) });

      const status = response.data.enabled ? 'enabled' : 'disabled';
      toast.success(`Alert ${status} successfully`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to toggle alert';
      toast.error(message);
    },
  });
};
