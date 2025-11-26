/**
 * Distribution Hooks - TanStack Query hooks for distributions
 *
 * Provides hooks for:
 * - Distributions CRUD
 * - Catalog Items CRUD
 * - Revenue Reports CRUD
 * - Stats & Analytics
 * - Infinite scrolling support
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  keepPreviousData,
} from '@tanstack/react-query'
import { distributionsService } from '../services/distributions.service'
import { useUIStore } from '@/stores/uiStore'
import type {
  Distribution,
  DistributionFormData,
  DistributionFilters,
  DistributionStats,
  DistributionCatalogItem,
  DistributionCatalogItemFormData,
  DistributionRevenueReport,
  DistributionRevenueReportFormData,
  DealStatus,
} from '@/types/distribution'
import type { PaginatedResponse } from '@/types'

// ============================================
// QUERY KEYS
// ============================================

export const distributionKeys = {
  all: ['distributions'] as const,

  // Lists
  lists: () => [...distributionKeys.all, 'list'] as const,
  list: (filters?: DistributionFilters & { page?: number; page_size?: number; ordering?: string }) =>
    [...distributionKeys.lists(), filters] as const,
  infinite: (filters?: DistributionFilters) => [...distributionKeys.lists(), 'infinite', filters] as const,

  // Details
  details: () => [...distributionKeys.all, 'detail'] as const,
  detail: (id: number) => [...distributionKeys.details(), id] as const,

  // Stats
  stats: (filters?: DistributionFilters) => [...distributionKeys.all, 'stats', filters] as const,

  // Catalog Items
  catalogItems: (distributionId: number) => [...distributionKeys.detail(distributionId), 'catalog-items'] as const,
  catalogItemList: (distributionId: number, filters?: { page?: number; page_size?: number }) =>
    filters
      ? [...distributionKeys.catalogItems(distributionId), filters] as const
      : distributionKeys.catalogItems(distributionId),
  catalogItemDetail: (distributionId: number, catalogItemId: number) =>
    [...distributionKeys.catalogItems(distributionId), catalogItemId] as const,

  // Revenue Reports
  revenueReports: (distributionId: number, catalogItemId: number) =>
    [...distributionKeys.catalogItemDetail(distributionId, catalogItemId), 'revenue-reports'] as const,
}

// ============================================
// DISTRIBUTION HOOKS
// ============================================

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
 * Hook to get a single distribution
 */
export const useDistribution = (id: number, enabled = true) => {
  return useQuery<Distribution>({
    queryKey: distributionKeys.detail(id),
    queryFn: () => distributionsService.getDistribution(id),
    enabled: enabled && !!id,
    staleTime: 0,
  })
}

/**
 * Hook to create a distribution
 */
export const useCreateDistribution = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: (data: DistributionFormData) => distributionsService.createDistribution(data),
    onSuccess: (distribution) => {
      queryClient.invalidateQueries({ queryKey: distributionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: distributionKeys.stats() })
      addNotification({
        type: 'success',
        title: 'Distribution Created',
        description: `Distribution deal has been created successfully.`,
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        description: error.response?.data?.error || 'Failed to create distribution.',
      })
    },
  })
}

/**
 * Hook to update a distribution
 */
export const useUpdateDistribution = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DistributionFormData> }) =>
      distributionsService.updateDistribution(id, data),
    onSuccess: (distribution, variables) => {
      queryClient.invalidateQueries({ queryKey: distributionKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: distributionKeys.lists() })
      addNotification({
        type: 'success',
        title: 'Distribution Updated',
        description: `Distribution deal has been updated.`,
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        description: error.response?.data?.error || 'Failed to update distribution.',
      })
    },
  })
}

/**
 * Hook to delete a distribution
 */
export const useDeleteDistribution = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: (id: number) => distributionsService.deleteDistribution(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: distributionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: distributionKeys.stats() })
      addNotification({
        type: 'success',
        title: 'Distribution Deleted',
        description: 'Distribution has been deleted.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Deletion Failed',
        description: error.response?.data?.error || 'Failed to delete distribution.',
      })
    },
  })
}

/**
 * Hook to update distribution status
 */
export const useUpdateDistributionStatus = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: DealStatus }) =>
      distributionsService.updateDistribution(id, { deal_status: status }),
    onSuccess: (distribution, variables) => {
      queryClient.invalidateQueries({ queryKey: distributionKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: distributionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: distributionKeys.stats() })
      addNotification({
        type: 'success',
        title: 'Status Updated',
        description: `Distribution status changed to "${distribution.deal_status_display}".`,
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Status Update Failed',
        description: error.response?.data?.error || 'Failed to update status.',
      })
    },
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

// ============================================
// CATALOG ITEM HOOKS
// ============================================

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
 * Hook to get a single catalog item
 */
export const useCatalogItem = (
  distributionId: number,
  catalogItemId: number,
  enabled = true
) => {
  return useQuery<DistributionCatalogItem>({
    queryKey: distributionKeys.catalogItemDetail(distributionId, catalogItemId),
    queryFn: () => distributionsService.getCatalogItem(distributionId, catalogItemId),
    enabled: enabled && !!distributionId && !!catalogItemId,
  })
}

/**
 * Hook to add a catalog item to a distribution
 */
export const useAddCatalogItem = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({ distributionId, data }: { distributionId: number; data: DistributionCatalogItemFormData }) =>
      distributionsService.addCatalogItem(distributionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: distributionKeys.catalogItems(variables.distributionId) })
      queryClient.invalidateQueries({ queryKey: distributionKeys.detail(variables.distributionId) })
      queryClient.invalidateQueries({ queryKey: distributionKeys.lists() })
      addNotification({
        type: 'success',
        title: 'Catalog Item Added',
        description: 'Catalog item has been added to the distribution.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Add Failed',
        description: error.response?.data?.error || 'Failed to add catalog item.',
      })
    },
  })
}

/**
 * Hook to update a catalog item
 */
export const useUpdateCatalogItem = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({
      distributionId,
      catalogItemId,
      data,
    }: {
      distributionId: number
      catalogItemId: number
      data: Partial<DistributionCatalogItemFormData>
    }) => distributionsService.updateCatalogItem(distributionId, catalogItemId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: distributionKeys.catalogItems(variables.distributionId) })
      queryClient.invalidateQueries({ queryKey: distributionKeys.detail(variables.distributionId) })
      addNotification({
        type: 'success',
        title: 'Catalog Item Updated',
        description: 'Catalog item has been updated.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        description: error.response?.data?.error || 'Failed to update catalog item.',
      })
    },
  })
}

/**
 * Hook to remove a catalog item from a distribution
 */
export const useRemoveCatalogItem = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({ distributionId, catalogItemId }: { distributionId: number; catalogItemId: number }) =>
      distributionsService.removeCatalogItem(distributionId, catalogItemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: distributionKeys.catalogItems(variables.distributionId) })
      queryClient.invalidateQueries({ queryKey: distributionKeys.detail(variables.distributionId) })
      queryClient.invalidateQueries({ queryKey: distributionKeys.lists() })
      addNotification({
        type: 'success',
        title: 'Catalog Item Removed',
        description: 'Catalog item has been removed from the distribution.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Removal Failed',
        description: error.response?.data?.error || 'Failed to remove catalog item.',
      })
    },
  })
}

// ============================================
// REVENUE REPORT HOOKS
// ============================================

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

/**
 * Hook to add a revenue report
 */
export const useAddRevenueReport = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({
      distributionId,
      catalogItemId,
      data,
    }: {
      distributionId: number
      catalogItemId: number
      data: DistributionRevenueReportFormData
    }) => distributionsService.addRevenueReport(distributionId, catalogItemId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: distributionKeys.revenueReports(variables.distributionId, variables.catalogItemId),
      })
      queryClient.invalidateQueries({ queryKey: distributionKeys.catalogItems(variables.distributionId) })
      queryClient.invalidateQueries({ queryKey: distributionKeys.detail(variables.distributionId) })
      addNotification({
        type: 'success',
        title: 'Revenue Report Added',
        description: 'Revenue report has been added.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Add Failed',
        description: error.response?.data?.error || 'Failed to add revenue report.',
      })
    },
  })
}

/**
 * Hook to update a revenue report
 */
export const useUpdateRevenueReport = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({
      distributionId,
      catalogItemId,
      reportId,
      data,
    }: {
      distributionId: number
      catalogItemId: number
      reportId: number
      data: Partial<DistributionRevenueReportFormData>
    }) => distributionsService.updateRevenueReport(distributionId, catalogItemId, reportId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: distributionKeys.revenueReports(variables.distributionId, variables.catalogItemId),
      })
      queryClient.invalidateQueries({ queryKey: distributionKeys.catalogItems(variables.distributionId) })
      queryClient.invalidateQueries({ queryKey: distributionKeys.detail(variables.distributionId) })
      addNotification({
        type: 'success',
        title: 'Revenue Report Updated',
        description: 'Revenue report has been updated.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        description: error.response?.data?.error || 'Failed to update revenue report.',
      })
    },
  })
}

/**
 * Hook to delete a revenue report
 */
export const useDeleteRevenueReport = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({
      distributionId,
      catalogItemId,
      reportId,
    }: {
      distributionId: number
      catalogItemId: number
      reportId: number
    }) => distributionsService.deleteRevenueReport(distributionId, catalogItemId, reportId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: distributionKeys.revenueReports(variables.distributionId, variables.catalogItemId),
      })
      queryClient.invalidateQueries({ queryKey: distributionKeys.catalogItems(variables.distributionId) })
      queryClient.invalidateQueries({ queryKey: distributionKeys.detail(variables.distributionId) })
      addNotification({
        type: 'success',
        title: 'Revenue Report Deleted',
        description: 'Revenue report has been deleted.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Deletion Failed',
        description: error.response?.data?.error || 'Failed to delete revenue report.',
      })
    },
  })
}
