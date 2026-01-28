/**
 * Campaign List Hooks - Query hooks for campaign lists and stats
 */

import {
  useQuery,
  useInfiniteQuery,
  keepPreviousData,
} from '@tanstack/react-query'
import { campaignsService } from '../../services/campaigns.service'
import { campaignKeys } from './keys'
import type {
  Campaign,
  CampaignHistory,
  CampaignFilters,
  CampaignStats,
  CampaignFinancials,
  PortfolioFinancials,
  PaginatedResponse,
  EntityAnalyticsDetail,
} from './types'
import { emptyAnalytics } from './types'

/**
 * Hook to get paginated campaigns
 */
export const useCampaigns = (
  params?: CampaignFilters & { page?: number; page_size?: number; ordering?: string }
) => {
  return useQuery<PaginatedResponse<Campaign>>({
    queryKey: campaignKeys.list(params),
    queryFn: () => campaignsService.getCampaigns(params),
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook for infinite scrolling campaigns
 */
export const useInfiniteCampaigns = (
  filters?: CampaignFilters,
  pageSize = 20
) => {
  return useInfiniteQuery<PaginatedResponse<Campaign>>({
    queryKey: campaignKeys.infinite(filters),
    queryFn: ({ pageParam = 1 }) =>
      campaignsService.getCampaigns({ ...filters, page: pageParam as number, page_size: pageSize }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.next) return undefined
      return allPages.length + 1
    },
    initialPageParam: 1,
    staleTime: 30000,
    placeholderData: keepPreviousData,
  })
}

/**
 * Hook to get campaign history
 */
export const useCampaignHistory = (id: number, enabled = true) => {
  return useQuery<CampaignHistory[]>({
    queryKey: campaignKeys.history(id),
    queryFn: () => campaignsService.getHistory(id),
    enabled: enabled && !!id,
  })
}

/**
 * Hook to get campaign financials
 */
export const useCampaignFinancials = (id: number, enabled = true) => {
  return useQuery<CampaignFinancials>({
    queryKey: campaignKeys.financials(id),
    queryFn: () => campaignsService.getFinancials(id),
    enabled: enabled && !!id,
  })
}

/**
 * Hook to get campaign statistics
 */
export const useCampaignStats = (filters?: CampaignFilters) => {
  return useQuery<CampaignStats>({
    queryKey: campaignKeys.stats(filters),
    queryFn: () => campaignsService.getStats(filters),
    staleTime: 30000,
    placeholderData: keepPreviousData,
  })
}

/**
 * Hook to get portfolio financials
 */
export const usePortfolioFinancials = (
  filters?: CampaignFilters & { group_by?: 'platform' | 'month' }
) => {
  return useQuery<PortfolioFinancials>({
    queryKey: campaignKeys.portfolioFinancials(filters),
    queryFn: () => campaignsService.getPortfolioFinancials(filters),
  })
}

// ============================================
// ENTITY ANALYTICS HOOKS (for backwards compatibility)
// ============================================

/**
 * Hook to get artist analytics (campaigns they're featured in)
 * @deprecated This hook is for backwards compatibility
 */
export const useArtistAnalyticsDetail = (entityId: number, enabled = true) => {
  return useQuery<EntityAnalyticsDetail>({
    queryKey: ['entity-analytics', 'artist', entityId],
    queryFn: async () => {
      // TODO: Implement when backend endpoint is available
      return emptyAnalytics
    },
    enabled: enabled && !!entityId,
  })
}

/**
 * Hook to get client analytics (campaigns they've commissioned)
 * @deprecated This hook is for backwards compatibility
 */
export const useClientAnalyticsDetail = (entityId: number, enabled = true) => {
  return useQuery<EntityAnalyticsDetail>({
    queryKey: ['entity-analytics', 'client', entityId],
    queryFn: async () => {
      // TODO: Implement when backend endpoint is available
      return emptyAnalytics
    },
    enabled: enabled && !!entityId,
  })
}

/**
 * Hook to get brand analytics (campaigns for this brand)
 * @deprecated This hook is for backwards compatibility
 */
export const useBrandAnalyticsDetail = (entityId: number, enabled = true) => {
  return useQuery<EntityAnalyticsDetail>({
    queryKey: ['entity-analytics', 'brand', entityId],
    queryFn: async () => {
      // TODO: Implement when backend endpoint is available
      return emptyAnalytics
    },
    enabled: enabled && !!entityId,
  })
}
