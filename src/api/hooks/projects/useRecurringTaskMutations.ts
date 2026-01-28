import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import type { RecurringTaskTemplate, RecurringTaskTemplateCreatePayload, ProjectTaskDetail } from '@/types/projects';
import { toast } from 'sonner';

export const useCreateRecurringTaskTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RecurringTaskTemplateCreatePayload) => {
      const response = await apiClient.post<RecurringTaskTemplate>('/api/v1/recurring-tasks/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks'] });
      toast.success('Recurring task template created');
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to create recurring task template'),
  });
};

export const useUpdateRecurringTaskTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<RecurringTaskTemplateCreatePayload> }) => {
      const response = await apiClient.patch<RecurringTaskTemplate>(`/api/v1/recurring-tasks/${id}/`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['recurring-tasks', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks'] });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to update recurring task template'),
  });
};

export const useDeleteRecurringTaskTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/v1/recurring-tasks/${id}/`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks'] });
      toast.success('Recurring task template deleted');
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to delete recurring task template'),
  });
};

export const useActivateRecurringTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post(`/api/v1/recurring-tasks/${id}/activate/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks'] });
      toast.success('Recurring task activated');
    },
  });
};

export const useDeactivateRecurringTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post(`/api/v1/recurring-tasks/${id}/deactivate/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks'] });
      toast.success('Recurring task deactivated');
    },
  });
};

export const useGenerateRecurringTaskNow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post<ProjectTaskDetail>(`/api/v1/recurring-tasks/${id}/generate_now/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      toast.success('Task generated successfully');
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to generate task'),
  });
};
