import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Task } from '@/api/types/tasks';

const TASKS_BASE_URL = '/api/v1/tasks';

/**
 * Get single task by ID
 */
export const useTask = (taskId: number | string) => {
  return useQuery({
    queryKey: ['tasks', taskId],
    queryFn: async () => {
      const response = await apiClient.get<Task>(`${TASKS_BASE_URL}/${taskId}/`);
      return response.data;
    },
    enabled: !!taskId,
    staleTime: 30 * 1000,
  });
};

/**
 * Get input field templates for a task
 */
export const useTaskInputFields = (taskId: number | undefined) => {
  return useQuery({
    queryKey: ['tasks', taskId, 'input-fields'],
    queryFn: async () => {
      if (!taskId) return [];
      const response = await apiClient.get(`${TASKS_BASE_URL}/${taskId}/input-fields/`);
      return Array.isArray(response.data) ? response.data : response.data?.results || [];
    },
    enabled: !!taskId,
  });
};
