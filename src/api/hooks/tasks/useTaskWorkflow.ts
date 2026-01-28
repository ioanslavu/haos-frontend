import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Task } from '@/api/types/tasks';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/error-handler';
import { updateTaskInCaches } from './useTaskMutations';

const TASKS_BASE_URL = '/api/v1/tasks';

/** Submit task for review */
export const useSubmitTaskForReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, inputValues }: { taskId: number; inputValues: any[] }) => {
      const response = await apiClient.post<Task>(`${TASKS_BASE_URL}/${taskId}/submit-for-review/`, { input_values: inputValues });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['song-checklist'] });
      toast.success('Task submitted for review');
    },
    onError: (error: any) => toast.error(error.response?.data?.detail || 'Failed to submit task for review'),
  });
};

/** Review a task (approve/reject) */
export const useReviewTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, action, notes }: { taskId: number; action: 'approved' | 'rejected' | 'changes_requested'; notes?: string }) => {
      const response = await apiClient.post<Task>(`${TASKS_BASE_URL}/${taskId}/review/`, { action, notes });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['song-checklist'] });
      const actionText = variables.action === 'approved' ? 'approved' : variables.action === 'rejected' ? 'rejected' : 'sent back for changes';
      toast.success(`Task ${actionText}`);
    },
    onError: (error: any) => toast.error(error.response?.data?.detail || 'Failed to review task'),
  });
};

/** Link task to a domain entity (campaign, song, etc.) */
export const useLinkTaskToDomain = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, domainType, entityId, extra }: { taskId: number; domainType: string; entityId: number; extra?: Record<string, any> }) => {
      const response = await apiClient.post<Task>(`${TASKS_BASE_URL}/${taskId}/link-domain/`, { domain_type: domainType, entity_id: entityId, ...extra });
      return response.data;
    },
    onSuccess: (data) => {
      updateTaskInCaches(queryClient, data);
      toast.success('Task linked successfully');
    },
    onError: (error) => handleApiError(error, { context: 'linking task to domain', showToast: true }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
};

/** Unlink task from a domain entity */
export const useUnlinkTaskFromDomain = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, domainType }: { taskId: number; domainType: string }) => {
      const response = await apiClient.post<Task>(`${TASKS_BASE_URL}/${taskId}/unlink-domain/`, { domain_type: domainType });
      return response.data;
    },
    onSuccess: (data) => {
      updateTaskInCaches(queryClient, data);
      toast.success('Task unlinked successfully');
    },
    onError: (error) => handleApiError(error, { context: 'unlinking task from domain', showToast: true }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
};
