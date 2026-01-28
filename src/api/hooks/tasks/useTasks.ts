import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Task, TaskStats } from '@/api/types/tasks';
import type { TaskFilterParams, TaskListResponse } from './types';

const TASKS_BASE_URL = '/api/v1/tasks';

/**
 * Build query params from filter object
 */
const buildQueryParams = (params?: TaskFilterParams, page?: number): URLSearchParams => {
  const queryParams = new URLSearchParams();
  queryParams.append('page_size', '100');

  if (page) {
    queryParams.append('page', page.toString());
  }

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => queryParams.append(`${key}__in`, v));
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

/**
 * Fetch tasks with filters
 */
export const useTasks = (params?: TaskFilterParams, options?: { enabled?: boolean }) => {
  const queryParams = buildQueryParams(params);

  return useQuery({
    queryKey: ['tasks', params],
    queryFn: async () => {
      const response = await apiClient.get<TaskListResponse | Task[]>(
        `${TASKS_BASE_URL}/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      );
      // Handle both paginated and non-paginated responses
      return Array.isArray(response.data) ? response.data : response.data.results;
    },
    staleTime: 30 * 1000,
    enabled: options?.enabled ?? true,
  });
};

/**
 * Fetch tasks with infinite scrolling
 */
export const useInfiniteTasks = (params?: TaskFilterParams) => {
  return useInfiniteQuery({
    queryKey: ['tasks', 'infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const queryParams = buildQueryParams(params, pageParam);
      const response = await apiClient.get<TaskListResponse>(
        `${TASKS_BASE_URL}/?${queryParams.toString()}`
      );
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.next) {
        const url = new URL(lastPage.next);
        const nextPage = url.searchParams.get('page');
        return nextPage ? parseInt(nextPage) : undefined;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 30 * 1000,
  });
};

/**
 * Get task statistics for dashboard
 */
export const useTaskStats = () => {
  return useQuery({
    queryKey: ['tasks', 'stats'],
    queryFn: async () => {
      const response = await apiClient.get<TaskStats>(`${TASKS_BASE_URL}/dashboard-stats/`);
      return response.data;
    },
  });
};

/**
 * Get tasks pending review (manager/admin only)
 */
export const usePendingReviewTasks = () => {
  return useQuery({
    queryKey: ['tasks', 'pending-review'],
    queryFn: async () => {
      const response = await apiClient.get<Task[]>(`${TASKS_BASE_URL}/pending-review/`);
      return response.data;
    },
  });
};

/**
 * Get task inbox (tasks and notifications)
 */
export const useTaskInbox = () => {
  return useQuery({
    queryKey: ['tasks', 'inbox'],
    queryFn: async () => {
      const [tasksResponse, notificationsResponse] = await Promise.all([
        apiClient.get(`${TASKS_BASE_URL}/my_tasks/`),
        apiClient.get('/api/v1/notifications/'),
      ]);

      const tasks = Array.isArray(tasksResponse.data)
        ? tasksResponse.data
        : tasksResponse.data.results || [];

      const notifications = Array.isArray(notificationsResponse.data)
        ? notificationsResponse.data
        : notificationsResponse.data.results || [];

      const unreadNotifications = notifications.filter((n: any) => !n.is_read);

      const now = new Date();
      const activeTasks = tasks.filter((t: any) =>
        ['todo', 'in_progress', 'blocked', 'review'].includes(t.status)
      );
      const blockedTasks = tasks.filter((t: any) => t.status === 'blocked');
      const overdueTasks = tasks.filter(
        (t: any) =>
          t.due_date &&
          new Date(t.due_date) < now &&
          ['todo', 'in_progress', 'blocked', 'review'].includes(t.status)
      );

      return {
        tasks: activeTasks,
        notifications: unreadNotifications,
        summary: {
          total_tasks: tasks.length,
          active_tasks: activeTasks.length,
          blocked_tasks: blockedTasks.length,
          unread_notifications: unreadNotifications.length,
          overdue_tasks: overdueTasks.length,
        },
      };
    },
    refetchInterval: 60000,
  });
};

// Shorthand hooks
export const useMyTasks = (additionalParams?: TaskFilterParams) => {
  return useTasks({ my_tasks: true, ...additionalParams });
};

export const useOverdueTasks = (additionalParams?: TaskFilterParams) => {
  return useTasks({ is_overdue: true, ...additionalParams });
};

// Entity-specific task shortcuts
export const useSongTasks = (songId: number, additionalParams?: TaskFilterParams) => {
  return useTasks({ song: songId, ...additionalParams });
};

export const useWorkTasks = (workId: number, additionalParams?: TaskFilterParams) => {
  return useTasks({ work: workId, ...additionalParams });
};

export const useRecordingTasks = (recordingId: number, additionalParams?: TaskFilterParams) => {
  return useTasks({ recording: recordingId, ...additionalParams });
};

export const useOpportunityTasks = (opportunityId: number, additionalParams?: TaskFilterParams) => {
  return useTasks({ opportunity: opportunityId, ...additionalParams });
};

export const useDeliverableTasks = (deliverableId: number, additionalParams?: TaskFilterParams) => {
  return useTasks({ deliverable: deliverableId, ...additionalParams });
};

export const useCampaignTasks = (campaignId: number, additionalParams?: TaskFilterParams) => {
  return useTasks({ campaign: campaignId, ...additionalParams });
};

export const useSubCampaignTasks = (subcampaignId: number, additionalParams?: TaskFilterParams) => {
  return useTasks({ subcampaign: subcampaignId, ...additionalParams });
};
