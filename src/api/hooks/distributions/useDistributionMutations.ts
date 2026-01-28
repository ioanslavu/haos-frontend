/**
 * Distribution Mutation Hooks - Mutation hooks for distribution CRUD operations
 */

import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { distributionsService } from '../../services/distributions.service'
import apiClient from '../../client'
import { useUIStore } from '@/stores/uiStore'
import { toast } from '@/hooks/use-toast'
import { handleApiError } from '@/lib/error-handler'
import { distributionKeys } from './keys'
import { useTasks } from '../useTasks'
import type {
  DistributionFormData,
  DistributionCatalogItemFormData,
  DistributionSongFormData,
  DistributionRevenueReportFormData,
  DistributionAssignmentRole,
  DealStatus,
  DistributionInvoice,
} from './types'

// Base URL for distribution endpoints
const DISTRIBUTIONS_BASE_URL = '/api/v1/distributions'

// ============================================
// DISTRIBUTION CRUD MUTATIONS
// ============================================

/**
 * Hook to create a distribution
 */
export const useCreateDistribution = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: (data: DistributionFormData) => distributionsService.createDistribution(data),
    onSuccess: () => {
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
    onSuccess: (_, variables) => {
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

// ============================================
// CATALOG ITEM MUTATIONS
// ============================================

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
// SONG MUTATIONS
// ============================================

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
// REVENUE REPORT MUTATIONS
// ============================================

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

// ============================================
// ASSIGNMENT MUTATIONS
// ============================================

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
// INVOICE MUTATIONS
// ============================================

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
        queryKey: distributionKeys.invoices(variables.distributionId),
      })
      toast({ title: 'Invoice linked to distribution' })
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
        queryKey: distributionKeys.invoices(variables.distributionId),
      })
      toast({ title: 'Invoice unlinked from distribution' })
    },
    onError: (error: any) => {
      handleApiError(error, {
        context: 'unlinking invoice from distribution',
        showToast: true,
      })
    },
  })
}

// ============================================
// CONTRACT MUTATIONS
// ============================================

/**
 * Hook to generate a contract for a distribution
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
      toast({ title: 'Contract generation started' })
    },
    onError: (error: any) => {
      handleApiError(error, {
        context: 'generating contract',
        showToast: true,
      })
    },
  })
}

// ============================================
// TASK HOOKS
// ============================================

/**
 * Hook to get tasks for a distribution
 */
export const useDistributionTasks = (distributionId: number, additionalParams?: any) => {
  return useTasks({ distribution: distributionId, ...additionalParams })
}
