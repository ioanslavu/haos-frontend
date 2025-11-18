import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../client';
import { ManualTrigger, FlowTrigger, ExecuteTriggerInput } from '../types/triggers';
import { Task } from '../types/tasks';
import { toast } from 'sonner';

// API endpoints
const MANUAL_TRIGGERS_URL = '/api/v1/manual-triggers';
const FLOW_TRIGGERS_URL = '/api/v1/flow-triggers';

// Fetch manual triggers (filtered by department permission on backend)
export const useManualTriggers = (params?: {
  entity_type?: string;
  context?: string;
  is_active?: boolean;
}) => {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }

  return useQuery({
    queryKey: ['manual-triggers', params],
    queryFn: async () => {
      const response = await apiClient.get<{ count: number; results: ManualTrigger[] } | ManualTrigger[]>(
        `${MANUAL_TRIGGERS_URL}/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      );
      // Handle both paginated and non-paginated responses
      return Array.isArray(response.data) ? response.data : response.data.results;
    },
  });
};

// Get single manual trigger
export const useManualTrigger = (triggerId: number | string) => {
  return useQuery({
    queryKey: ['manual-triggers', triggerId],
    queryFn: async () => {
      const response = await apiClient.get<ManualTrigger>(`${MANUAL_TRIGGERS_URL}/${triggerId}/`);
      return response.data;
    },
    enabled: !!triggerId,
  });
};

// Execute manual trigger
export const useExecuteTrigger = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      triggerId,
      data
    }: {
      triggerId: number;
      data: ExecuteTriggerInput
    }) => {
      const response = await apiClient.post<Task>(
        `${MANUAL_TRIGGERS_URL}/${triggerId}/execute/`,
        data
      );
      return response.data;
    },
    onSuccess: (task) => {
      // Invalidate tasks to show the newly created task
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`Task created: ${task.title}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to execute trigger');
    },
  });
};

// Fetch flow triggers (read-only)
export const useFlowTriggers = (params?: {
  entity_type?: string;
  trigger_type?: string;
  is_active?: boolean;
}) => {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }

  return useQuery({
    queryKey: ['flow-triggers', params],
    queryFn: async () => {
      const response = await apiClient.get<{ count: number; results: FlowTrigger[] } | FlowTrigger[]>(
        `${FLOW_TRIGGERS_URL}/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      );
      // Handle both paginated and non-paginated responses
      return Array.isArray(response.data) ? response.data : response.data.results;
    },
  });
};

// Get single flow trigger
export const useFlowTrigger = (triggerId: number | string) => {
  return useQuery({
    queryKey: ['flow-triggers', triggerId],
    queryFn: async () => {
      const response = await apiClient.get<FlowTrigger>(`${FLOW_TRIGGERS_URL}/${triggerId}/`);
      return response.data;
    },
    enabled: !!triggerId,
  });
};

// Shorthand hooks for common trigger contexts
export const useSongTriggers = () => {
  return useManualTriggers({ entity_type: 'song', is_active: true });
};

export const useDeliverableTriggers = () => {
  return useManualTriggers({ entity_type: 'deliverable', is_active: true });
};
