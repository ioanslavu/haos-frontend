/**
 * Distribution List Hooks - Query hooks for distribution lists and stats
 */

import {
  useQuery,
  useInfiniteQuery,
  keepPreviousData,
} from '@tanstack/react-query'
import { distributionsService } from '../../services/distributions.service'
import { distributionKeys } from './keys'
import type {
  Distribution,
  DistributionFilters,
  DistributionStats,
  DistributionCatalogItem,
  DistributionSong,
  DistributionRevenueReport,
  PaginatedResponse,
} from './types'

/**
 * Hook to get paginated distributions
 */
export const useDistributions = (
  params?: DistributionFilters & { page?: number; page_size?: number; ordering?: string }
) => {
  return useQuery<PaginatedResponse<Distribution>>({
    queryKey: distributionKeys.list(params),
    queryFn: () => distributionsService.getDistributions(params),
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook for infinite scrolling distributions
 */
export const useInfiniteDistributions = (
  filters?: DistributionFilters,
  pageSize = 20
) => {
  return useInfiniteQuery<PaginatedResponse<Distribution>>({
    queryKey: distributionKeys.infinite(filters),
    queryFn: ({ pageParam = 1 }) =>
      distributionsService.getDistributions({ ...filters, page: pageParam as number, page_size: pageSize }),
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
 * Hook to get distribution statistics
 */
export const useDistributionStats = (filters?: DistributionFilters) => {
  return useQuery<DistributionStats>({
    queryKey: distributionKeys.stats(filters),
    queryFn: () => distributionsService.getDistributionStats(filters),
    staleTime: 30000,
    placeholderData: keepPreviousData,
  })
}

/**
 * Hook to get catalog items for a distribution
 */
export const useCatalogItems = (
  distributionId: number,
  params?: { page?: number; page_size?: number },
  enabled = true
) => {
  return useQuery<PaginatedResponse<DistributionCatalogItem>>({
    queryKey: distributionKeys.catalogItemList(distributionId, params),
    queryFn: () => distributionsService.getCatalogItems(distributionId, params),
    enabled: enabled && !!distributionId,
  })
}

/**
 * Hook to get songs for a distribution
 */
export const useSongs = (
  distributionId: number,
  params?: { page?: number; page_size?: number },
  enabled = true
) => {
  return useQuery<PaginatedResponse<DistributionSong>>({
    queryKey: distributionKeys.songList(distributionId, params),
    queryFn: () => distributionsService.getSongs(distributionId, params),
    enabled: enabled && !!distributionId,
  })
}

/**
 * Hook to get revenue reports for a catalog item
 */
export const useRevenueReports = (
  distributionId: number,
  catalogItemId: number,
  params?: { page?: number; page_size?: number },
  enabled = true
) => {
  return useQuery<PaginatedResponse<DistributionRevenueReport>>({
    queryKey: distributionKeys.revenueReports(distributionId, catalogItemId),
    queryFn: () => distributionsService.getRevenueReports(distributionId, catalogItemId, params),
    enabled: enabled && !!distributionId && !!catalogItemId,
  })
}
