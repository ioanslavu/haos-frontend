/**
 * Opportunity List Hooks - Query hooks for opportunity lists and stats
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import {
  opportunitiesApi,
  opportunityArtistsApi,
  opportunityTasksApi,
  opportunityDeliverablesApi,
  approvalsApi,
  opportunityStatsApi,
} from '../../services/opportunities.service'
import { opportunityKeys } from './keys'
import type { OpportunityListParams } from './types'

/**
 * Hook to list opportunities with filters
 */
export function useOpportunities(params?: OpportunityListParams) {
  return useQuery({
    queryKey: opportunityKeys.list(params),
    queryFn: () => opportunitiesApi.list(params).then(res => res.data),
  })
}

/**
 * Hook for infinite scroll opportunities list
 */
export function useInfiniteOpportunities(params?: OpportunityListParams, pageSize = 20) {
  return useInfiniteQuery({
    queryKey: [...opportunityKeys.lists(), 'infinite', params],
    queryFn: ({ pageParam = 1 }) =>
      opportunitiesApi.list({ ...params, page: pageParam, page_size: pageSize }).then(res => res.data),
    getNextPageParam: (lastPage, pages) =>
      lastPage.next ? pages.length + 1 : undefined,
    initialPageParam: 1,
  })
}

/**
 * Hook to get opportunity stats
 */
export function useOpportunityStats(params?: OpportunityListParams) {
  return useQuery({
    queryKey: [...opportunityKeys.all, 'stats', params],
    queryFn: () => opportunityStatsApi.get(params).then(res => res.data),
  })
}

/**
 * Hook to get activities for opportunity
 */
export function useOpportunityActivities(id: number) {
  return useQuery({
    queryKey: opportunityKeys.activities(id),
    queryFn: () => opportunitiesApi.getActivities(id).then(res => res.data),
    enabled: !!id,
  })
}

// ============================================
// RELATED ENTITY HOOKS
// ============================================

export function useOpportunityArtists(opportunityId?: number) {
  return useQuery({
    queryKey: opportunityKeys.artists(opportunityId),
    queryFn: () => opportunityArtistsApi.list({ opportunity: opportunityId }).then(res => res.data),
    enabled: !!opportunityId,
  })
}

export function useOpportunityTasks(opportunityId?: number) {
  return useQuery({
    queryKey: opportunityKeys.tasks(opportunityId),
    queryFn: () => opportunityTasksApi.list({ opportunity: opportunityId }).then(res => res.data),
    enabled: !!opportunityId,
  })
}

export function useOpportunityDeliverables(opportunityId?: number) {
  return useQuery({
    queryKey: opportunityKeys.deliverables(opportunityId),
    queryFn: () => opportunityDeliverablesApi.list({ opportunity: opportunityId }).then(res => res.data),
    enabled: !!opportunityId,
  })
}

// ============================================
// APPROVALS HOOKS
// ============================================

export function useApprovals(params?: { opportunity?: number; status?: string }) {
  return useQuery({
    queryKey: ['approvals', params],
    queryFn: () => approvalsApi.list(params).then(res => res.data),
  })
}
