import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Task, TaskCreateInput, TaskUpdateInput } from '@/api/types/tasks';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/error-handler';

const TASKS_BASE_URL = '/api/v1/tasks';

/** Helper to update task in list caches */
export const updateTaskInCaches = (queryClient: ReturnType<typeof useQueryClient>, data: Task) => {
  queryClient.setQueryData<Task>(['tasks', data.id], data);
  queryClient.setQueriesData<Task[]>({ queryKey: ['tasks'], exact: false }, (oldData) => {
    if (!oldData || !Array.isArray(oldData)) return oldData;
    return oldData.map((task) => (task.id === data.id ? data : task));
  });
  queryClient.setQueriesData<{ pages: Array<{ results: Task[] }> }>(
    { queryKey: ['tasks', 'infinite'], exact: false },
    (oldData) => {
      if (!oldData?.pages) return oldData;
      return { ...oldData, pages: oldData.pages.map((page) => ({ ...page, results: page.results.map((task) => (task.id === data.id ? data : task)) })) };
    }
  );
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TaskCreateInput) => {
      const response = await apiClient.post<Task>(`${TASKS_BASE_URL}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Task created successfully');
    },
    onError: (error: any) => toast.error(error.response?.data?.detail || 'Failed to create task'),
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TaskUpdateInput }) => {
      const response = await apiClient.patch<Task>(`${TASKS_BASE_URL}/${id}/`, data);
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', id] });
      const previousTask = queryClient.getQueryData<Task>(['tasks', id]);
      if (previousTask) queryClient.setQueryData<Task>(['tasks', id], { ...previousTask, ...data, updated_at: new Date().toISOString() });
      return { previousTask };
    },
    onError: (error, { id }, context) => {
      if (context?.previousTask) queryClient.setQueryData(['tasks', id], context.previousTask);
      handleApiError(error, { context: 'updating task', showToast: true });
    },
    onSuccess: (data) => updateTaskInCaches(queryClient, data),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiClient.patch<Task>(`${TASKS_BASE_URL}/${id}/`, { status });
      return response.data;
    },
    onError: (error: any) => toast.error(error.response?.data?.detail || 'Failed to update task status'),
    onSuccess: (data) => {
      updateTaskInCaches(queryClient, data);
      toast.success(`Task status updated to ${data.status}`);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks', 'stats'] }),
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => { await apiClient.delete(`${TASKS_BASE_URL}/${id}/`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'stats'] });
      toast.success('Task deleted successfully');
    },
    onError: (error: any) => toast.error(error.response?.data?.detail || 'Failed to delete task'),
  });
};

export const useCreateSubtask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ parentId, data }: { parentId: number; data: TaskCreateInput }) => {
      const response = await apiClient.post<Task>(`${TASKS_BASE_URL}/${parentId}/create-subtask/`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.parentId] });
      toast.success('Subtask created successfully');
    },
    onError: (error: any) => toast.error(error.response?.data?.detail || 'Failed to create subtask'),
  });
};
