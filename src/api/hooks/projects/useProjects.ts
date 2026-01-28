import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import type {
  Project,
  ProjectDetail,
  ProjectFilterParams,
  ProjectTask,
  ProjectTaskFilterParams,
  RecurringTaskTemplate,
  ProjectTemplate,
} from '@/types/projects';

/**
 * Fetch projects list
 */
export const useProjects = (params?: ProjectFilterParams) => {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: async () => {
      const response = await apiClient.get<{ results: Project[]; count: number }>(
        '/api/v1/projects/',
        { params }
      );
      return Array.isArray(response.data) ? response.data : response.data.results;
    },
    staleTime: 30 * 1000,
  });
};

/**
 * Fetch projects with infinite scrolling
 */
export const useInfiniteProjects = (params?: ProjectFilterParams) => {
  return useInfiniteQuery({
    queryKey: ['projects', 'infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<{
        results: Project[];
        count: number;
        next: string | null;
      }>('/api/v1/projects/', {
        params: { ...params, page: pageParam, page_size: 50 },
      });
      return response.data;
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.next) {
        return pages.length + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 30 * 1000,
  });
};

/**
 * Fetch project tasks
 */
export const useProjectTasks = (params?: ProjectTaskFilterParams) => {
  return useQuery({
    queryKey: ['project-tasks', params],
    queryFn: async () => {
      const response = await apiClient.get<{ results: ProjectTask[]; count: number }>(
        '/api/v1/tasks/',
        { params }
      );
      return Array.isArray(response.data) ? response.data : response.data.results;
    },
    staleTime: 30 * 1000,
  });
};

/**
 * Fetch my project tasks
 */
export const useMyProjectTasks = () => {
  return useQuery({
    queryKey: ['project-tasks', 'my-tasks'],
    queryFn: async () => {
      const response = await apiClient.get<ProjectTask[] | { results: ProjectTask[] }>(
        '/api/v1/tasks/my_tasks/'
      );
      return Array.isArray(response.data) ? response.data : response.data.results;
    },
  });
};

/**
 * Fetch overdue project tasks
 */
export const useOverdueProjectTasks = () => {
  return useQuery({
    queryKey: ['project-tasks', 'overdue'],
    queryFn: async () => {
      const response = await apiClient.get<ProjectTask[] | { results: ProjectTask[] }>(
        '/api/v1/tasks/overdue/'
      );
      return Array.isArray(response.data) ? response.data : response.data.results;
    },
  });
};

/**
 * Fetch recurring task templates
 */
export const useRecurringTaskTemplates = (params?: {
  project?: number;
  is_active?: boolean;
  department?: number;
}) => {
  return useQuery({
    queryKey: ['recurring-tasks', params],
    queryFn: async () => {
      const response = await apiClient.get<{ results: RecurringTaskTemplate[]; count: number }>(
        '/api/v1/recurring-tasks/',
        { params }
      );
      return Array.isArray(response.data) ? response.data : response.data.results;
    },
    staleTime: 60 * 1000,
  });
};

/**
 * Fetch project templates
 */
export const useProjectTemplates = (params?: {
  project_type?: string;
  department?: number;
  is_active?: boolean;
}) => {
  return useQuery({
    queryKey: ['project-templates', params],
    queryFn: async () => {
      const response = await apiClient.get<{ results: ProjectTemplate[]; count: number }>(
        '/api/v1/templates/',
        { params }
      );
      return Array.isArray(response.data) ? response.data : response.data.results;
    },
    staleTime: 60 * 1000,
  });
};

/**
 * Computed stats hook based on projects data
 */
export const useProjectStats = () => {
  const { data: projects } = useProjects();

  if (!projects) {
    return {
      total: 0,
      active: 0,
      on_hold: 0,
      completed: 0,
      archived: 0,
      overdue_tasks: 0,
    };
  }

  return {
    total: projects.length,
    active: projects.filter((p) => p.status === 'active').length,
    on_hold: projects.filter((p) => p.status === 'on_hold').length,
    completed: projects.filter((p) => p.status === 'completed').length,
    archived: projects.filter((p) => p.status === 'archived').length,
    overdue_tasks: 0,
  };
};
