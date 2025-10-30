import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../client';
import { Task, TaskCreateInput, TaskUpdateInput, TaskStats } from '../types/tasks';
import { toast } from 'sonner';

// API endpoints
const TASKS_BASE_URL = '/api/v1/crm/tasks';

// Fetch tasks with filters
export const useTasks = (params?: {
  status?: string | string[];
  priority?: number;
  task_type?: string;
  assigned_to?: number;
  department?: number;
  campaign?: number;
  entity?: number;
  is_overdue?: boolean;
  is_blocked?: boolean;
  my_tasks?: boolean;
}) => {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(`${key}__in`, v));
        } else if (typeof value === 'boolean') {
          queryParams.append(key, value.toString());
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });
  }

  return useQuery({
    queryKey: ['tasks', params],
    queryFn: async () => {
      const response = await apiClient.get<Task[]>(
        `${TASKS_BASE_URL}/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      );
      return response.data;
    },
  });
};

// Get single task
export const useTask = (taskId: number | string) => {
  return useQuery({
    queryKey: ['tasks', taskId],
    queryFn: async () => {
      const response = await apiClient.get<Task>(`${TASKS_BASE_URL}/${taskId}/`);
      return response.data;
    },
    enabled: !!taskId,
  });
};

// Get task statistics for dashboard
export const useTaskStats = () => {
  return useQuery({
    queryKey: ['tasks', 'stats'],
    queryFn: async () => {
      const response = await apiClient.get<TaskStats>(`${TASKS_BASE_URL}/dashboard_stats/`);
      return response.data;
    },
  });
};

// Create task
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TaskCreateInput) => {
      const response = await apiClient.post<Task>(`${TASKS_BASE_URL}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create task');
    },
  });
};

// Update task
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TaskUpdateInput }) => {
      const response = await apiClient.patch<Task>(`${TASKS_BASE_URL}/${id}/`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', data.id] });
      toast.success('Task updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update task');
    },
  });
};

// Quick status update
export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiClient.post<Task>(
        `${TASKS_BASE_URL}/${id}/update_status/`,
        { status }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', data.id] });
      toast.success(`Task status updated to ${data.status}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update task status');
    },
  });
};

// Delete task
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`${TASKS_BASE_URL}/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete task');
    },
  });
};

// Create subtask
export const useCreateSubtask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ parentId, data }: { parentId: number; data: TaskCreateInput }) => {
      const response = await apiClient.post<Task>(
        `${TASKS_BASE_URL}/${parentId}/create_subtask/`,
        data
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.parentId] });
      toast.success('Subtask created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create subtask');
    },
  });
};

// My tasks shorthand
export const useMyTasks = (additionalParams?: any) => {
  return useTasks({ my_tasks: true, ...additionalParams });
};

// Overdue tasks shorthand
export const useOverdueTasks = (additionalParams?: any) => {
  return useTasks({ is_overdue: true, ...additionalParams });
};