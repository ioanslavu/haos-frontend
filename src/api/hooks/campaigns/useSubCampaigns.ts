/**
 * SubCampaign Hooks - Query and mutation hooks for subcampaigns
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { campaignsService } from '../../services/campaigns.service'
import apiClient from '../../client'
import { useUIStore } from '@/stores/uiStore'
import { campaignKeys, subCampaignInvoiceKeys } from './keys'
import type {
  SubCampaign,
  SubCampaignCreateData,
  SubCampaignUpdateData,
  SubCampaignFilters,
  SubCampaignStatus,
  SubCampaignInvoiceLink,
  SubCampaignInvoiceUploadPayload,
  InvoiceAmountUpdatePayload,
  PaginatedResponse,
} from './types'

// ============================================
// SUBCAMPAIGN QUERY HOOKS
// ============================================

/**
 * Hook to get subcampaigns for a campaign
 */
export const useSubCampaigns = (
  campaignId: number,
  params?: SubCampaignFilters & { page?: number; page_size?: number },
  enabled = true
) => {
  return useQuery<PaginatedResponse<SubCampaign>>({
    queryKey: campaignKeys.subCampaignList(campaignId, params),
    queryFn: () => campaignsService.getSubCampaigns(campaignId, params),
    enabled: enabled && !!campaignId,
  })
}

/**
 * Hook to get a single subcampaign
 */
export const useSubCampaign = (
  campaignId: number,
  subCampaignId: number,
  enabled = true
) => {
  return useQuery<SubCampaign>({
    queryKey: campaignKeys.subCampaignDetail(campaignId, subCampaignId),
    queryFn: () => campaignsService.getSubCampaign(campaignId, subCampaignId),
    enabled: enabled && !!campaignId && !!subCampaignId,
  })
}

/**
 * Hook to get invoices linked to a subcampaign
 */
export const useSubCampaignInvoices = (
  campaignId: number,
  subcampaignId: number,
  enabled = true
) => {
  return useQuery<SubCampaignInvoiceLink[]>({
    queryKey: subCampaignInvoiceKeys.list(campaignId, subcampaignId),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<SubCampaignInvoiceLink> | SubCampaignInvoiceLink[]>(
        `/api/v1/campaigns/${campaignId}/subcampaigns/${subcampaignId}/invoices/`
      )
      if (Array.isArray(response.data)) {
        return response.data
      }
      return response.data.results || []
    },
    enabled: enabled && !!campaignId && !!subcampaignId,
  })
}

// ============================================
// SUBCAMPAIGN MUTATION HOOKS
// ============================================

/**
 * Hook to create a subcampaign
 */
export const useCreateSubCampaign = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: number; data: SubCampaignCreateData }) =>
      campaignsService.createSubCampaign(campaignId, data),
    onSuccess: (subCampaign, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.subCampaigns(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.history(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() })
      queryClient.invalidateQueries({ queryKey: campaignKeys.stats() })
      addNotification({
        type: 'success',
        title: 'Platform Added',
        description: `${subCampaign.platform_display} campaign has been added.`,
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        description: error.response?.data?.error || 'Failed to add platform.',
      })
    },
  })
}

/**
 * Hook to update a subcampaign
 */
export const useUpdateSubCampaign = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({
      campaignId,
      subCampaignId,
      data,
    }: {
      campaignId: number
      subCampaignId: number
      data: SubCampaignUpdateData
    }) => campaignsService.updateSubCampaign(campaignId, subCampaignId, data),
    onSuccess: (updatedSubCampaign, variables) => {
      queryClient.setQueryData<PaginatedResponse<SubCampaign>>(
        campaignKeys.subCampaignList(variables.campaignId),
        (oldData) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            results: oldData.results.map((sc) =>
              sc.id === variables.subCampaignId ? updatedSubCampaign : sc
            ),
          }
        }
      )
      queryClient.setQueryData<SubCampaign>(
        campaignKeys.subCampaignDetail(variables.campaignId, variables.subCampaignId),
        updatedSubCampaign
      )
      queryClient.invalidateQueries({
        queryKey: campaignKeys.detail(variables.campaignId),
        exact: true,
      })
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() })
      addNotification({
        type: 'success',
        title: 'Platform Updated',
        description: 'Platform campaign has been updated.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        description: error.response?.data?.error || 'Failed to update platform.',
      })
    },
  })
}

/**
 * Hook to delete a subcampaign
 */
export const useDeleteSubCampaign = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({ campaignId, subCampaignId }: { campaignId: number; subCampaignId: number }) =>
      campaignsService.deleteSubCampaign(campaignId, subCampaignId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.subCampaigns(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.history(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() })
      queryClient.invalidateQueries({ queryKey: campaignKeys.stats() })
      addNotification({
        type: 'success',
        title: 'Platform Removed',
        description: 'Platform campaign has been removed.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Deletion Failed',
        description: error.response?.data?.error || 'Failed to remove platform.',
      })
    },
  })
}

/**
 * Hook to update subcampaign budget
 */
export const useUpdateSubCampaignBudget = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({
      campaignId,
      subCampaignId,
      budget,
      reason,
    }: {
      campaignId: number
      subCampaignId: number
      budget: string
      reason?: string
    }) => campaignsService.updateSubCampaignBudget(campaignId, subCampaignId, budget, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.subCampaigns(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.financials(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.history(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() })
      queryClient.invalidateQueries({ queryKey: campaignKeys.stats() })
      addNotification({
        type: 'success',
        title: 'Budget Updated',
        description: 'Platform budget has been updated.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        description: error.response?.data?.error || 'Failed to update budget.',
      })
    },
  })
}

/**
 * Hook to update subcampaign spent amount
 */
export const useUpdateSubCampaignSpent = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({
      campaignId,
      subCampaignId,
      spent,
      reason,
    }: {
      campaignId: number
      subCampaignId: number
      spent: string
      reason?: string
    }) => campaignsService.updateSubCampaignSpent(campaignId, subCampaignId, spent, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.subCampaigns(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.financials(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.history(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() })
      queryClient.invalidateQueries({ queryKey: campaignKeys.stats() })
      addNotification({
        type: 'success',
        title: 'Spending Updated',
        description: 'Platform spending has been updated.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        description: error.response?.data?.error || 'Failed to update spending.',
      })
    },
  })
}

/**
 * Hook to update subcampaign status
 */
export const useUpdateSubCampaignStatus = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({
      campaignId,
      subCampaignId,
      status,
      reason,
    }: {
      campaignId: number
      subCampaignId: number
      status: SubCampaignStatus
      reason?: string
    }) => campaignsService.updateSubCampaignStatus(campaignId, subCampaignId, status, reason),
    onSuccess: (subCampaign, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.subCampaigns(variables.campaignId) })
      queryClient.invalidateQueries({
        queryKey: campaignKeys.subCampaignDetail(variables.campaignId, variables.subCampaignId),
      })
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.history(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() })
      queryClient.invalidateQueries({ queryKey: campaignKeys.stats() })
      addNotification({
        type: 'success',
        title: 'Status Updated',
        description: `Platform status changed to "${subCampaign.status_display}".`,
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
 * Hook to add songs to subcampaign
 */
export const useAddSongsToSubCampaign = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({
      campaignId,
      subCampaignId,
      songIds,
    }: {
      campaignId: number
      subCampaignId: number
      songIds: number[]
    }) => campaignsService.addSongsToSubCampaign(campaignId, subCampaignId, songIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.subCampaigns(variables.campaignId) })
      queryClient.invalidateQueries({
        queryKey: campaignKeys.subCampaignDetail(variables.campaignId, variables.subCampaignId),
      })
      addNotification({
        type: 'success',
        title: 'Songs Added',
        description: 'Songs have been added to the platform.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Add Failed',
        description: error.response?.data?.error || 'Failed to add songs.',
      })
    },
  })
}

// ============================================
// SUBCAMPAIGN INVOICE MUTATIONS
// ============================================

/**
 * Hook to upload a new invoice for a subcampaign with AI extraction
 */
export const useUploadSubCampaignInvoice = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async ({
      campaignId,
      subcampaignId,
      data,
    }: {
      campaignId: number
      subcampaignId: number
      data: SubCampaignInvoiceUploadPayload
    }) => {
      const formData = new FormData()
      formData.append('file', data.file)
      formData.append('name', data.name)
      formData.append('invoice_type', data.invoice_type || 'expense')
      if (data.currency) formData.append('currency', data.currency)
      if (data.amount) formData.append('amount', data.amount)
      if (data.notes) formData.append('notes', data.notes)

      const response = await apiClient.post<SubCampaignInvoiceLink & { extraction_task_id?: string }>(
        `/api/v1/campaigns/${campaignId}/subcampaigns/${subcampaignId}/invoices/upload/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return response.data
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({
        queryKey: subCampaignInvoiceKeys.all(variables.campaignId, variables.subcampaignId),
      })
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.subCampaigns(variables.campaignId) })

      if (result.extraction_task_id) {
        addNotification({
          type: 'info',
          title: 'Invoice Uploaded',
          description: 'AI is extracting invoice details. This may take a moment.',
        })
      } else {
        addNotification({
          type: 'success',
          title: 'Invoice Added',
          description: 'Invoice has been added to the platform.',
        })
      }
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        description: error.response?.data?.error || 'Failed to upload invoice.',
      })
    },
  })
}

/**
 * Hook to manually set invoice amount
 */
export const useSetSubCampaignInvoiceAmount = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async ({
      campaignId,
      subcampaignId,
      invoiceLinkId,
      data,
    }: {
      campaignId: number
      subcampaignId: number
      invoiceLinkId: number
      data: InvoiceAmountUpdatePayload
    }) => {
      const response = await apiClient.post<SubCampaignInvoiceLink>(
        `/api/v1/campaigns/${campaignId}/subcampaigns/${subcampaignId}/invoices/${invoiceLinkId}/set_amount/`,
        data
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: subCampaignInvoiceKeys.all(variables.campaignId, variables.subcampaignId),
      })
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.subCampaigns(variables.campaignId) })
      addNotification({
        type: 'success',
        title: 'Amount Set',
        description: 'Invoice amount has been updated.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        description: error.response?.data?.error || 'Failed to set invoice amount.',
      })
    },
  })
}

/**
 * Hook to accept AI-extracted amount
 */
export const useAcceptSubCampaignInvoiceExtraction = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async ({
      campaignId,
      subcampaignId,
      invoiceLinkId,
    }: {
      campaignId: number
      subcampaignId: number
      invoiceLinkId: number
    }) => {
      const response = await apiClient.post<SubCampaignInvoiceLink>(
        `/api/v1/campaigns/${campaignId}/subcampaigns/${subcampaignId}/invoices/${invoiceLinkId}/accept_extraction/`
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: subCampaignInvoiceKeys.all(variables.campaignId, variables.subcampaignId),
      })
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.subCampaigns(variables.campaignId) })
      addNotification({
        type: 'success',
        title: 'Extraction Accepted',
        description: 'AI-extracted amount has been applied.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Accept Failed',
        description: error.response?.data?.error || 'Failed to accept extraction.',
      })
    },
  })
}

/**
 * Hook to retry AI extraction
 */
export const useRetrySubCampaignInvoiceExtraction = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async ({
      campaignId,
      subcampaignId,
      invoiceLinkId,
    }: {
      campaignId: number
      subcampaignId: number
      invoiceLinkId: number
    }) => {
      const response = await apiClient.post<{ message: string; task_id: string }>(
        `/api/v1/campaigns/${campaignId}/subcampaigns/${subcampaignId}/invoices/${invoiceLinkId}/retry_extraction/`
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: subCampaignInvoiceKeys.all(variables.campaignId, variables.subcampaignId),
      })
      addNotification({
        type: 'info',
        title: 'Extraction Retrying',
        description: 'AI is re-extracting invoice details.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Retry Failed',
        description: error.response?.data?.error || 'Failed to retry extraction.',
      })
    },
  })
}

/**
 * Hook to unlink an invoice from a subcampaign
 */
export const useUnlinkSubCampaignInvoice = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async ({
      campaignId,
      subcampaignId,
      invoiceLinkId,
    }: {
      campaignId: number
      subcampaignId: number
      invoiceLinkId: number
    }) => {
      await apiClient.delete(
        `/api/v1/campaigns/${campaignId}/subcampaigns/${subcampaignId}/invoices/${invoiceLinkId}/`
      )
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: subCampaignInvoiceKeys.all(variables.campaignId, variables.subcampaignId),
      })
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.subCampaigns(variables.campaignId) })
      addNotification({
        type: 'success',
        title: 'Invoice Unlinked',
        description: 'Invoice has been removed from the platform.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Unlink Failed',
        description: error.response?.data?.error || 'Failed to unlink invoice.',
      })
    },
  })
}
