import type { TaskFilterParams } from './types';

/**
 * Query key factory for tasks domain
 * Centralizes all query keys for better cache management
 */
export const taskKeys = {
  // Base keys
  all: ['tasks'] as const,
  lists: () => ['tasks'] as const,
  list: (params?: TaskFilterParams) => ['tasks', params] as const,

  // Infinite query keys
  infinite: (params?: TaskFilterParams) => ['tasks', 'infinite', params] as const,

  // Detail keys
  details: () => ['tasks', 'detail'] as const,
  detail: (taskId: number | string) => ['tasks', taskId] as const,

  // Stats
  stats: () => ['tasks', 'stats'] as const,

  // Input fields
  inputFields: (taskId: number) => ['tasks', taskId, 'input-fields'] as const,

  // Review
  pendingReview: () => ['tasks', 'pending-review'] as const,

  // Inbox
  inbox: () => ['tasks', 'inbox'] as const,
};
