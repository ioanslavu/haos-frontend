import { QUERY_KEYS } from '@/lib/constants';

/**
 * Query key factory for users domain
 * Centralizes all query keys for better cache management
 */
export const userKeys = {
  // Base keys from constants
  all: QUERY_KEYS.USERS.LIST,
  lists: () => [...QUERY_KEYS.USERS.LIST] as const,
  list: (params?: Record<string, unknown>) => [...QUERY_KEYS.USERS.LIST, params] as const,

  // Detail keys
  details: () => ['users', 'detail'] as const,
  detail: (userId: string) => QUERY_KEYS.USERS.DETAIL(userId),

  // Permissions
  permissions: (userId: string) => QUERY_KEYS.USERS.PERMISSIONS(userId),

  // Audit
  audit: (userId: string, limit?: number) => [...QUERY_KEYS.USERS.AUDIT(userId), limit] as const,

  // Department users
  departmentUsers: (params?: Record<string, unknown>) => ['department-users', params] as const,

  // Department requests
  departmentRequests: {
    all: ['department-requests'] as const,
    list: (status?: string) => ['department-requests', status] as const,
    pendingCount: ['department-requests', 'pending', 'count'] as const,
  },

  // Auth
  currentUser: QUERY_KEYS.AUTH.USER,
};
