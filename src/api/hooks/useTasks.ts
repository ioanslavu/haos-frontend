import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../client';
import { Task, TaskCreateInput, TaskUpdateInput, TaskStats } from '../types/tasks';
import { toast } from 'sonner';

// API endpoints
const TASKS_BASE_URL = '/api/v1/tasks';

// Fetch tasks with filters
export const useTasks = (params?: {
  status?: string | string[];
  priority?: number;
  task_type?: string;
  assigned_to__in?: string;  // Filter by multiple user IDs (comma-separated)
  department?: number;
  campaign?: number;
  entity?: number;
  // Universal task system entity filters
  entity_type?: 'song' | 'work' | 'recording' | 'opportunity' | 'deliverable' | 'checklist_item';
  song?: number;
  work?: number;
  recording?: number;
  opportunity?: number;
  deliverable?: number;
  checklist_item?: number;
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
      const response = await apiClient.get<{ count: number; results: Task[] } | Task[]>(
        `${TASKS_BASE_URL}/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      );
      // Handle both paginated and non-paginated responses
      return Array.isArray(response.data) ? response.data : response.data.results;
    },
    staleTime: 30 * 1000, // Data considered fresh for 30 seconds
  });
};

// Fetch tasks with infinite scrolling
export const useInfiniteTasks = (params?: {
  status?: string | string[];
  priority?: number;
  task_type?: string;
  assigned_to__in?: string;  // Filter by multiple user IDs (comma-separated)
  department?: number;
  campaign?: number;
  entity?: number;
  entity_type?: 'song' | 'work' | 'recording' | 'opportunity' | 'deliverable' | 'checklist_item';
  song?: number;
  work?: number;
  recording?: number;
  opportunity?: number;
  deliverable?: number;
  checklist_item?: number;
  is_overdue?: boolean;
  is_blocked?: boolean;
  my_tasks?: boolean;
}) => {
  const buildQueryParams = (pageParam: number) => {
    const queryParams = new URLSearchParams();
    queryParams.append('page', pageParam.toString());

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

    return queryParams;
  };

  return useInfiniteQuery({
    queryKey: ['tasks', 'infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const queryParams = buildQueryParams(pageParam);
      const response = await apiClient.get<{ count: number; next: string | null; previous: string | null; results: Task[] }>(
        `${TASKS_BASE_URL}/?${queryParams.toString()}`
      );
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      // Extract page number from next URL
      if (lastPage.next) {
        const url = new URL(lastPage.next);
        const nextPage = url.searchParams.get('page');
        return nextPage ? parseInt(nextPage) : undefined;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 30 * 1000, // Data considered fresh for 30 seconds
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
    staleTime: 30 * 1000, // Data considered fresh for 30 seconds
  });
};

// Get task statistics for dashboard
export const useTaskStats = () => {
  return useQuery({
    queryKey: ['tasks', 'stats'],
    queryFn: async () => {
      const response = await apiClient.get<TaskStats>(`${TASKS_BASE_URL}/dashboard-stats/`);
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
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks', id] });

      // Snapshot the previous value
      const previousTask = queryClient.getQueryData<Task>(['tasks', id]);

      // Optimistically update the single task cache
      if (previousTask) {
        queryClient.setQueryData<Task>(['tasks', id], {
          ...previousTask,
          ...data,
          updated_at: new Date().toISOString(),
        });
      }

      // Return context for rollback
      return { previousTask };
    },
    onError: (error: any, { id }, context) => {
      // Rollback on error
      if (context?.previousTask) {
        queryClient.setQueryData(['tasks', id], context.previousTask);
      }
      console.error('Task update error:', error.response?.data || error.message);
      toast.error(error.response?.data?.detail || 'Failed to update task');
    },
    onSuccess: (data) => {
      // Update cache with server response
      queryClient.setQueryData<Task>(['tasks', data.id], data);

      // Update the task in any list queries that contain it
      queryClient.setQueriesData<Task[]>(
        { queryKey: ['tasks'], exact: false },
        (oldData) => {
          if (!oldData || !Array.isArray(oldData)) return oldData;
          return oldData.map(task => task.id === data.id ? data : task);
        }
      );

      // Update infinite query pages
      queryClient.setQueriesData<{ pages: Array<{ results: Task[] }> }>(
        { queryKey: ['tasks', 'infinite'], exact: false },
        (oldData) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map(page => ({
              ...page,
              results: page.results.map(task => task.id === data.id ? data : task),
            })),
          };
        }
      );
    },
    onSettled: () => {
      // Only invalidate stats since counts may have changed
      queryClient.invalidateQueries({ queryKey: ['tasks', 'stats'] });
    },
  });
};

// Quick status update
export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiClient.post<Task>(
        `${TASKS_BASE_URL}/${id}/update-status/`,
        { status }
      );
      return response.data;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', id] });
      const previousTask = queryClient.getQueryData<Task>(['tasks', id]);

      if (previousTask) {
        queryClient.setQueryData<Task>(['tasks', id], {
          ...previousTask,
          status: status as Task['status'],
          updated_at: new Date().toISOString(),
        });
      }

      return { previousTask };
    },
    onError: (error: any, { id }, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(['tasks', id], context.previousTask);
      }
      toast.error(error.response?.data?.detail || 'Failed to update task status');
    },
    onSuccess: (data) => {
      // Update cache with server response
      queryClient.setQueryData<Task>(['tasks', data.id], data);

      // Update in list queries
      queryClient.setQueriesData<Task[]>(
        { queryKey: ['tasks'], exact: false },
        (oldData) => {
          if (!oldData || !Array.isArray(oldData)) return oldData;
          return oldData.map(task => task.id === data.id ? data : task);
        }
      );

      // Update infinite query pages
      queryClient.setQueriesData<{ pages: Array<{ results: Task[] }> }>(
        { queryKey: ['tasks', 'infinite'], exact: false },
        (oldData) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map(page => ({
              ...page,
              results: page.results.map(task => task.id === data.id ? data : task),
            })),
          };
        }
      );

      toast.success(`Task status updated to ${data.status}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', 'stats'] });
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
        `${TASKS_BASE_URL}/${parentId}/create-subtask/`,
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

// Entity-specific task shortcuts
export const useSongTasks = (songId: number, additionalParams?: any) => {
  return useTasks({ song: songId, ...additionalParams });
};

export const useWorkTasks = (workId: number, additionalParams?: any) => {
  return useTasks({ work: workId, ...additionalParams });
};

export const useRecordingTasks = (recordingId: number, additionalParams?: any) => {
  return useTasks({ recording: recordingId, ...additionalParams });
};

export const useOpportunityTasks = (opportunityId: number, additionalParams?: any) => {
  return useTasks({ opportunity: opportunityId, ...additionalParams });
};

export const useDeliverableTasks = (deliverableId: number, additionalParams?: any) => {
  return useTasks({ deliverable: deliverableId, ...additionalParams });
};

// Get input field templates for a task
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

// Submit task for review
export const useSubmitTaskForReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, inputValues }: { taskId: number; inputValues: any[] }) => {
      const response = await apiClient.post<Task>(
        `${TASKS_BASE_URL}/${taskId}/submit-for-review/`,
        { input_values: inputValues }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['song-checklist'] });
      toast.success('Task submitted for review');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to submit task for review');
    },
  });
};

// Get tasks pending review (manager/admin only)
export const usePendingReviewTasks = () => {
  return useQuery({
    queryKey: ['tasks', 'pending-review'],
    queryFn: async () => {
      const response = await apiClient.get<Task[]>(`${TASKS_BASE_URL}/pending-review/`);
      return response.data;
    },
  });
};

// Review a task (approve/reject)
export const useReviewTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      action,
      notes
    }: {
      taskId: number;
      action: 'approved' | 'rejected' | 'changes_requested';
      notes?: string
    }) => {
      const response = await apiClient.post<Task>(
        `${TASKS_BASE_URL}/${taskId}/review/`,
        { action, notes }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['song-checklist'] });
      const actionText = variables.action === 'approved' ? 'approved' :
                        variables.action === 'rejected' ? 'rejected' : 'sent back for changes';
      toast.success(`Task ${actionText}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to review task');
    },
  });
};

// Get task inbox (tasks and notifications)
export const useTaskInbox = () => {
  return useQuery({
    queryKey: ['tasks', 'inbox'],
    queryFn: async () => {
      const response = await apiClient.get(`${TASKS_BASE_URL}/inbox/`);
      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });
};