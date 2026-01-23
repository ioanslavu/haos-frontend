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
import apiClient from '../client'
import { distributionsService } from '../services/distributions.service'
import { useUIStore } from '@/stores/uiStore'
import type {
  Distribution,
  DistributionFormData,
  DistributionFilters,
  DistributionStats,
  DistributionCatalogItem,
  DistributionCatalogItemFormData,
  DistributionSong,
  DistributionSongFormData,
  DistributionRevenueReport,
  DistributionRevenueReportFormData,
  DistributionAssignment,
  DistributionAssignmentRole,
  DealStatus,
} from '@/types/distribution'
import type { PaginatedResponse } from '@/types'

// Base URL for distribution endpoints
const DISTRIBUTIONS_BASE_URL = '/api/v1/distributions'

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

  // Songs (External)
  songs: (distributionId: number) => [...distributionKeys.detail(distributionId), 'songs'] as const,
  songList: (distributionId: number, filters?: { page?: number; page_size?: number }) =>
    filters
      ? [...distributionKeys.songs(distributionId), filters] as const
      : distributionKeys.songs(distributionId),
  songDetail: (distributionId: number, songId: number) =>
    [...distributionKeys.songs(distributionId), songId] as const,

  // Assignments
  assignments: (distributionId: number) => [...distributionKeys.detail(distributionId), 'assignments'] as const,
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
// DISTRIBUTION SONG HOOKS (External Songs)
// ============================================

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
 * Hook to add a song to a distribution
 */
export const useAddSong = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({ distributionId, data }: { distributionId: number; data: DistributionSongFormData }) =>
      distributionsService.addSong(distributionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: distributionKeys.songs(variables.distributionId) })
      queryClient.invalidateQueries({ queryKey: distributionKeys.detail(variables.distributionId) })
      queryClient.invalidateQueries({ queryKey: distributionKeys.lists() })
      addNotification({
        type: 'success',
        title: 'Song Added',
        description: 'Song has been added to the distribution.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Add Failed',
        description: error.response?.data?.error || 'Failed to add song.',
      })
    },
  })
}

/**
 * Hook to update a song
 */
export const useUpdateSong = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({
      distributionId,
      songId,
      data,
    }: {
      distributionId: number
      songId: number
      data: Partial<DistributionSongFormData>
    }) => distributionsService.updateSong(distributionId, songId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: distributionKeys.songs(variables.distributionId) })
      queryClient.invalidateQueries({ queryKey: distributionKeys.detail(variables.distributionId) })
      addNotification({
        type: 'success',
        title: 'Song Updated',
        description: 'Song has been updated.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        description: error.response?.data?.error || 'Failed to update song.',
      })
    },
  })
}

/**
 * Hook to remove a song from a distribution
 */
export const useRemoveSong = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({ distributionId, songId }: { distributionId: number; songId: number }) =>
      distributionsService.removeSong(distributionId, songId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: distributionKeys.songs(variables.distributionId) })
      queryClient.invalidateQueries({ queryKey: distributionKeys.detail(variables.distributionId) })
      queryClient.invalidateQueries({ queryKey: distributionKeys.lists() })
      addNotification({
        type: 'success',
        title: 'Song Removed',
        description: 'Song has been removed from the distribution.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Removal Failed',
        description: error.response?.data?.error || 'Failed to remove song.',
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

// ============================================
// ASSIGNMENT HOOKS
// ============================================

/**
 * Hook to get assignments for a distribution
 */
export const useDistributionAssignments = (distributionId: number, enabled = true) => {
  return useQuery<DistributionAssignment[]>({
    queryKey: distributionKeys.assignments(distributionId),
    queryFn: () => distributionsService.getAssignments(distributionId),
    enabled: enabled && !!distributionId,
  })
}

/**
 * Hook to create a distribution assignment
 */
export const useCreateDistributionAssignment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      distributionId,
      userId,
      role,
    }: {
      distributionId: number
      userId: number
      role: DistributionAssignmentRole
    }) => distributionsService.createAssignment(distributionId, userId, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: distributionKeys.assignments(variables.distributionId) })
      queryClient.invalidateQueries({ queryKey: distributionKeys.detail(variables.distributionId) })
    },
  })
}

/**
 * Hook to delete a distribution assignment
 */
export const useDeleteDistributionAssignment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ distributionId, assignmentId }: { distributionId: number; assignmentId: number }) =>
      distributionsService.deleteAssignment(distributionId, assignmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: distributionKeys.assignments(variables.distributionId) })
      queryClient.invalidateQueries({ queryKey: distributionKeys.detail(variables.distributionId) })
    },
  })
}

// ============================================
// TASK HOOKS
// ============================================

import { useTasks } from './useTasks'

/**
 * Hook to get tasks for a distribution
 */
export const useDistributionTasks = (distributionId: number, additionalParams?: any) => {
  return useTasks({ distribution: distributionId, ...additionalParams })
}

// ============================================
// INVOICE HOOKS
// ============================================

export interface DistributionInvoice {
  id: number
  distribution: number
  invoice_id: number
  invoice_number: string
  invoice_name: string
  invoice_type: 'income' | 'expense'
  invoice_type_display: string
  amount: string | null
  currency: string
  status: string
  status_display: string
  issue_date: string | null
  due_date: string | null
  notes?: string
  file?: string
  extraction_status?: string
  created_at: string
  created_by: number | null
  created_by_name: string | null
}

/**
 * Hook to get invoices for a distribution
 */
export const useDistributionInvoices = (distributionId: number) => {
  return useQuery({
    queryKey: ['distributions', distributionId, 'invoices'],
    queryFn: async () => {
      const response = await apiClient.get<{ count: number; results: DistributionInvoice[] } | DistributionInvoice[]>(
        `${DISTRIBUTIONS_BASE_URL}/${distributionId}/invoices/`
      )
      // Handle both paginated and non-paginated responses
      return Array.isArray(response.data) ? response.data : response.data.results
    },
    enabled: !!distributionId && !isNaN(distributionId) && distributionId > 0,
  })
}

/**
 * Hook to link an existing invoice to a distribution
 */
export const useLinkDistributionInvoice = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      distributionId,
      invoiceId,
    }: {
      distributionId: number
      invoiceId: number
    }) => {
      const response = await apiClient.post<DistributionInvoice>(
        `${DISTRIBUTIONS_BASE_URL}/${distributionId}/invoices/`,
        { invoice_id: invoiceId }
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['distributions', variables.distributionId, 'invoices'],
      })
      toast.success('Invoice linked to distribution')
    },
    onError: (error: any) => {
      handleApiError(error, {
        context: 'linking invoice to distribution',
        showToast: true,
      })
    },
  })
}

/**
 * Hook to unlink an invoice from a distribution
 */
export const useUnlinkDistributionInvoice = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      distributionId,
      invoiceLinkId,
    }: {
      distributionId: number
      invoiceLinkId: number
    }) => {
      await apiClient.delete(
        `${DISTRIBUTIONS_BASE_URL}/${distributionId}/invoices/${invoiceLinkId}/`
      )
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['distributions', variables.distributionId, 'invoices'],
      })
      toast.success('Invoice unlinked from distribution')
    },
    onError: (error: any) => {
      handleApiError(error, {
        context: 'unlinking invoice from distribution',
        showToast: true,
      })
    },
  })
}

/**
 * Hook to upload a new invoice to a distribution
 */
export const useUploadDistributionInvoice = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      distributionId,
      formData,
    }: {
      distributionId: number
      formData: FormData
    }) => {
      const response = await apiClient.post<DistributionInvoice>(
        `${DISTRIBUTIONS_BASE_URL}/${distributionId}/invoices/upload/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['distributions', variables.distributionId, 'invoices'],
      })
      toast.success('Invoice uploaded and linked')
    },
    onError: (error: any) => {
      handleApiError(error, {
        context: 'uploading invoice',
        showToast: true,
      })
    },
  })
}

// ============================================
// CONTRACT HOOKS
// ============================================

/**
 * Hook to generate a contract for a distribution
 * Uses the existing generate_contract action on DistributionViewSet
 */
export const useGenerateDistributionContract = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      distributionId,
      formData,
    }: {
      distributionId: number
      formData?: {
        form_data?: Record<string, any>
        start_date?: string
        end_date?: string
        title?: string
        label_entity_id?: number
      }
    }) => {
      const response = await apiClient.post(
        `${DISTRIBUTIONS_BASE_URL}/${distributionId}/contracts/generate/`,
        formData || {}
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['distribution', variables.distributionId],
      })
      queryClient.invalidateQueries({
        queryKey: ['contracts'],
      })
      toast.success('Contract generation started')
    },
    onError: (error: any) => {
      handleApiError(error, {
        context: 'generating contract',
        showToast: true,
      })
    },
  })
}
