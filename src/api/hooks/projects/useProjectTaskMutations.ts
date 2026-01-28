import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import type { ProjectTaskDetail, ProjectTaskCreatePayload } from '@/types/projects';
import { toast } from 'sonner';

export const useCreateProjectTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProjectTaskCreatePayload) => {
      const response = await apiClient.post<ProjectTaskDetail>('/api/v1/tasks/', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects', data.project] });
      toast.success('Task created successfully');
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to create task'),
  });
};

export const useUpdateProjectTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ProjectTaskCreatePayload> }) => {
      const response = await apiClient.patch<ProjectTaskDetail>(`/api/v1/tasks/${id}/`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['project-tasks', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects', data.project] });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to update task'),
  });
};

export const useStartProjectTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post(`/api/v1/tasks/${id}/start/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task started');
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to start task'),
  });
};

export const useCompleteProjectTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post(`/api/v1/tasks/${id}/complete/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task completed');
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to complete task'),
  });
};

export const useReopenProjectTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post(`/api/v1/tasks/${id}/reopen/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task reopened');
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to reopen task'),
  });
};
