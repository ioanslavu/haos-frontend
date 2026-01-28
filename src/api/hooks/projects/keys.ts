import type { ProjectFilterParams, ProjectTaskFilterParams } from '@/types/projects';

/**
 * Query key factory for projects domain
 * Centralizes all query keys for better cache management
 */
export const projectKeys = {
  // Project keys
  all: ['projects'] as const,
  lists: () => ['projects'] as const,
  list: (params?: ProjectFilterParams) => ['projects', params] as const,
  infinite: (params?: ProjectFilterParams) => ['projects', 'infinite', params] as const,
  detail: (projectId: number) => ['projects', projectId] as const,

  // Project task keys
  tasks: {
    all: ['project-tasks'] as const,
    list: (params?: ProjectTaskFilterParams) => ['project-tasks', params] as const,
    detail: (taskId: number) => ['project-tasks', taskId] as const,
    myTasks: ['project-tasks', 'my-tasks'] as const,
    overdue: ['project-tasks', 'overdue'] as const,
  },

  // Recurring task keys
  recurring: {
    all: ['recurring-tasks'] as const,
    list: (params?: { project?: number; is_active?: boolean; department?: number }) =>
      ['recurring-tasks', params] as const,
    detail: (id: number) => ['recurring-tasks', id] as const,
  },

  // Template keys
  templates: {
    all: ['project-templates'] as const,
    list: (params?: { project_type?: string; department?: number; is_active?: boolean }) =>
      ['project-templates', params] as const,
  },
};
