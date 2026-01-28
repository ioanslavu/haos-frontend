import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import type { ProjectDetail, ProjectTaskDetail, RecurringTaskTemplate } from '@/types/projects';

/**
 * Fetch single project by ID
 */
export const useProject = (projectId: number) => {
  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: async () => {
      const response = await apiClient.get<ProjectDetail>(`/api/v1/projects/${projectId}/`);
      return response.data;
    },
    enabled: !!projectId,
  });
};

/**
 * Fetch single project task by ID
 */
export const useProjectTask = (taskId: number) => {
  return useQuery({
    queryKey: ['project-tasks', taskId],
    queryFn: async () => {
      const response = await apiClient.get<ProjectTaskDetail>(`/api/v1/tasks/${taskId}/`);
      return response.data;
    },
    enabled: !!taskId,
  });
};

/**
 * Fetch single recurring task template by ID
 */
export const useRecurringTaskTemplate = (id: number) => {
  return useQuery({
    queryKey: ['recurring-tasks', id],
    queryFn: async () => {
      const response = await apiClient.get<RecurringTaskTemplate>(`/api/v1/recurring-tasks/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });
};
