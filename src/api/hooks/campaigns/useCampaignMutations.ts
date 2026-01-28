/**
 * Campaign Mutation Hooks - Mutation hooks for campaign CRUD operations
 */

import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { campaignsService } from '../../services/campaigns.service'
import apiClient from '../../client'
import { useUIStore } from '@/stores/uiStore'
import { campaignKeys, campaignContractKeys, campaignAssignmentKeys } from './keys'
import type {
  CampaignCreateData,
  CampaignUpdateData,
  CampaignStatus,
  CampaignAssignment,
  CampaignAssignmentRole,
  GenerateContractData,
  SendForSignatureData,
} from './types'

/**
 * Hook to create a campaign
 */
export const useCreateCampaign = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: (data: CampaignCreateData) => campaignsService.createCampaign(data),
    onSuccess: (campaign) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() })
      queryClient.invalidateQueries({ queryKey: campaignKeys.stats() })
      addNotification({
        type: 'success',
        title: 'Campaign Created',
        description: `Campaign "${campaign.name}" has been created successfully.`,
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        description: error.response?.data?.error || 'Failed to create campaign.',
      })
    },
  })
}

/**
 * Hook to update a campaign
 */
export const useUpdateCampaign = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CampaignUpdateData }) =>
      campaignsService.updateCampaign(id, data),
    onSuccess: (campaign, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() })
      addNotification({
        type: 'success',
        title: 'Campaign Updated',
        description: `Campaign "${campaign.name}" has been updated.`,
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        description: error.response?.data?.error || 'Failed to update campaign.',
      })
    },
  })
}

/**
 * Hook to delete a campaign
 */
export const useDeleteCampaign = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: (id: number) => campaignsService.deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() })
      queryClient.invalidateQueries({ queryKey: campaignKeys.stats() })
      addNotification({
        type: 'success',
        title: 'Campaign Deleted',
        description: 'Campaign has been deleted.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Deletion Failed',
        description: error.response?.data?.error || 'Failed to delete campaign.',
      })
    },
  })
}

/**
 * Hook to update campaign status
 */
export const useUpdateCampaignStatus = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({ id, status, reason }: { id: number; status: CampaignStatus; reason?: string }) =>
      campaignsService.updateStatus(id, status, reason),
    onSuccess: (campaign, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() })
      queryClient.invalidateQueries({ queryKey: campaignKeys.stats() })
      addNotification({
        type: 'success',
        title: 'Status Updated',
        description: `Campaign status changed to "${campaign.status_display}".`,
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
 * Hook to reopen a campaign from terminal state
 */
export const useReopenCampaign = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: (id: number) => campaignsService.reopen(id),
    onSuccess: (campaign, id) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() })
      queryClient.invalidateQueries({ queryKey: campaignKeys.stats() })
      queryClient.invalidateQueries({ queryKey: campaignKeys.history(id) })
      addNotification({
        type: 'success',
        title: 'Campaign Reopened',
        description: `Campaign has been reopened to "${campaign.status_display}".`,
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Reopen Failed',
        description: error.response?.data?.error || 'Failed to reopen campaign.',
      })
    },
  })
}

// ============================================
// CONTRACT MUTATIONS
// ============================================

/**
 * Hook to link an existing contract to a campaign
 */
export const useLinkContract = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({ campaignId, contractId }: { campaignId: number; contractId: number }) =>
      campaignsService.linkContract(campaignId, contractId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignContractKeys.all(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.history(variables.campaignId) })
      addNotification({
        type: 'success',
        title: 'Contract Linked',
        description: 'Contract has been linked to the campaign.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Link Failed',
        description: error.response?.data?.error || 'Failed to link contract.',
      })
    },
  })
}

/**
 * Hook to unlink a contract from a campaign
 */
export const useUnlinkContract = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({ campaignId, linkId }: { campaignId: number; linkId: number }) =>
      campaignsService.unlinkContract(campaignId, linkId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignContractKeys.all(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.history(variables.campaignId) })
      addNotification({
        type: 'success',
        title: 'Contract Unlinked',
        description: 'Contract has been unlinked from the campaign.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Unlink Failed',
        description: error.response?.data?.error || 'Failed to unlink contract.',
      })
    },
  })
}

/**
 * Hook to generate a new contract for a campaign
 */
export const useGenerateCampaignContract = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: number; data: GenerateContractData }) =>
      campaignsService.generateContract(campaignId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignContractKeys.all(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.history(variables.campaignId) })
      addNotification({
        type: 'success',
        title: 'Contract Generating',
        description: 'Contract is being generated. This may take a moment.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Generation Failed',
        description: error.response?.data?.error || 'Failed to generate contract.',
      })
    },
  })
}

/**
 * Hook to send a contract for e-signature
 */
export const useSendContractForSignature = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({
      campaignId,
      linkId,
      data,
    }: {
      campaignId: number
      linkId: number
      data: SendForSignatureData
    }) => campaignsService.sendForSignature(campaignId, linkId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignContractKeys.all(variables.campaignId) })
      addNotification({
        type: 'success',
        title: 'Sent for Signature',
        description: 'Contract has been sent for e-signature.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Send Failed',
        description: error.response?.data?.error || 'Failed to send for signature.',
      })
    },
  })
}

/**
 * Hook to refresh signature status from Dropbox Sign
 */
export const useRefreshSignatureStatus = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({
      campaignId,
      contractId,
    }: {
      campaignId: number
      contractId: number
    }) => campaignsService.refreshSignatureStatus(contractId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignContractKeys.all(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })

      if (data.is_complete) {
        addNotification({
          type: 'success',
          title: 'All Signatures Complete',
          description: 'The contract has been fully signed.',
        })
      } else {
        addNotification({
          type: 'info',
          title: 'Status Updated',
          description: 'Signature status has been refreshed.',
        })
      }
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Refresh Failed',
        description: error.response?.data?.error || 'Failed to refresh signature status.',
      })
    },
  })
}

// ============================================
// REPORT MUTATIONS
// ============================================

/**
 * Hook to generate a PDF report for a completed campaign
 */
export const useGenerateCampaignReport = () => {
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: (campaignId: number) => campaignsService.generateReport(campaignId),
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Report Generated',
        description: 'Your campaign report is ready for download.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Report Generation Failed',
        description: error.response?.data?.error || 'Failed to generate campaign report.',
      })
    },
  })
}

// ============================================
// ASSIGNMENT MUTATIONS
// ============================================

/**
 * Hook to add a user to a campaign
 */
export const useCreateCampaignAssignment = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async ({
      campaignId,
      userId,
      role,
    }: {
      campaignId: number
      userId: number
      role: CampaignAssignmentRole
    }) => {
      const response = await apiClient.post<CampaignAssignment>(
        `/api/v1/campaigns/${campaignId}/assignments/`,
        { user_id: userId, role }
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.history(variables.campaignId) })
      addNotification({
        type: 'success',
        title: 'Team Member Added',
        description: 'User has been assigned to the campaign.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Assignment Failed',
        description: error.response?.data?.error || 'Failed to assign user to campaign.',
      })
    },
  })
}

/**
 * Hook to remove a user from a campaign
 */
export const useDeleteCampaignAssignment = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: async ({
      campaignId,
      assignmentId,
    }: {
      campaignId: number
      assignmentId: number
    }) => {
      await apiClient.delete(`/api/v1/campaigns/${campaignId}/assignments/${assignmentId}/`)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.history(variables.campaignId) })
      addNotification({
        type: 'success',
        title: 'Team Member Removed',
        description: 'User has been removed from the campaign.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Removal Failed',
        description: error.response?.data?.error || 'Failed to remove user from campaign.',
      })
    },
  })
}

// ============================================
// TASK MUTATIONS
// ============================================

/**
 * Hook to create a campaign task
 */
export const useCreateCampaignTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      title: string
      description?: string
      task_type: string
      priority: number
      campaign: number
      subcampaign?: number
      assigned_to?: number | null
      due_date?: string | null
    }) => {
      const response = await apiClient.post('/api/v1/campaigns/campaign-tasks/', data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(variables.campaign) })
    },
    onError: (error: any) => {
      console.error('Failed to create campaign task:', error)
    },
  })
}
