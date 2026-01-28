/**
 * Opportunity Mutation Hooks - Mutation hooks for opportunity CRUD operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  opportunitiesApi,
  opportunityArtistsApi,
  opportunityTasksApi,
  opportunityDeliverablesApi,
  usageTermsApi,
  deliverablePacksApi,
  approvalsApi,
  opportunityInvoicesApi,
  opportunityContractsApi,
  opportunityAssignmentsApi,
} from '../../services/opportunities.service'
import { opportunityKeys, opportunityInvoiceKeys, opportunityContractKeys, assignmentKeys } from './keys'
import type {
  OpportunityCreateInput,
  OpportunityUpdateInput,
  AdvanceStageInput,
  MarkLostInput,
  OpportunityDeliverable,
  OpportunityAssignmentRole,
  LinkInvoiceInput,
  LinkContractInput,
  CreateAndLinkContractInput,
  InvoiceType,
} from './types'

// ============================================
// OPPORTUNITY CRUD MUTATIONS
// ============================================

/**
 * Hook to create opportunity
 */
export function useCreateOpportunity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: OpportunityCreateInput) => opportunitiesApi.create(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() })
      toast.success('Opportunity created successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create opportunity')
    },
  })
}

/**
 * Hook to update opportunity
 */
export function useUpdateOpportunity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: OpportunityUpdateInput }) =>
      opportunitiesApi.update(id, data).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() })
      toast.success('Opportunity updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update opportunity')
    },
  })
}

/**
 * Hook to delete opportunity
 */
export function useDeleteOpportunity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => opportunitiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() })
      toast.success('Opportunity deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete opportunity')
    },
  })
}

/**
 * Hook to advance opportunity stage
 */
export function useAdvanceStage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AdvanceStageInput }) =>
      opportunitiesApi.advanceStage(id, data).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() })
      toast.success('Opportunity stage updated')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update stage')
    },
  })
}

/**
 * Hook to mark opportunity as won
 */
export function useMarkWon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => opportunitiesApi.markWon(id).then(res => res.data),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() })
      toast.success('Opportunity marked as Won! 🎉')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to mark as won')
    },
  })
}

/**
 * Hook to mark opportunity as lost
 */
export function useMarkLost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: MarkLostInput }) =>
      opportunitiesApi.markLost(id, data).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() })
      toast.success('Opportunity marked as Lost')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to mark as lost')
    },
  })
}

// ============================================
// ARTIST MUTATIONS
// ============================================

export function useCreateOpportunityArtist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => opportunityArtistsApi.create(data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.artists(data.opportunity) })
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(data.opportunity) })
      toast.success('Artist added')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to add artist')
    },
  })
}

// ============================================
// TASK MUTATIONS
// ============================================

export function useCreateOpportunityTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => opportunityTasksApi.create(data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.tasks(data.opportunity) })
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(data.opportunity) })
      toast.success('Task created')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create task')
    },
  })
}

// ============================================
// DELIVERABLE MUTATIONS
// ============================================

export function useCreateOpportunityDeliverable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => opportunityDeliverablesApi.create(data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.deliverables(data.opportunity) })
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(data.opportunity) })
      toast.success('Deliverable created')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create deliverable')
    },
  })
}

export function useUpdateOpportunityDeliverable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<OpportunityDeliverable> }) =>
      opportunityDeliverablesApi.update(id, data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.deliverables(data.opportunity) })
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(data.opportunity) })
      toast.success('Deliverable updated')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update deliverable')
    },
  })
}

// ============================================
// USAGE TERMS MUTATIONS
// ============================================

export function useCreateUsageTerm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => usageTermsApi.create(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usage-terms'] })
      toast.success('Usage terms created')
    },
  })
}

// ============================================
// DELIVERABLE PACK MUTATIONS
// ============================================

export function useCreateDeliverablePack() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => deliverablePacksApi.create(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliverable-packs'] })
      toast.success('Deliverable pack created')
    },
  })
}

// ============================================
// APPROVAL MUTATIONS
// ============================================

export function useCreateApproval() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => approvalsApi.create(data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(data.opportunity) })
      toast.success('Approval created')
    },
  })
}

export function useApproveApproval() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { notes?: string } }) =>
      approvalsApi.approve(id, data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
      queryClient.invalidateQueries({ queryKey: opportunityKeys.activities(data.opportunity) })
      toast.success('Approval approved')
    },
  })
}

export function useRejectApproval() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { notes: string } }) =>
      approvalsApi.reject(id, data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
      queryClient.invalidateQueries({ queryKey: opportunityKeys.activities(data.opportunity) })
      toast.success('Approval rejected')
    },
  })
}

export function useRequestChangesApproval() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { notes: string } }) =>
      approvalsApi.requestChanges(id, data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
      queryClient.invalidateQueries({ queryKey: opportunityKeys.activities(data.opportunity) })
      toast.success('Changes requested')
    },
  })
}

// ============================================
// INVOICE LINK MUTATIONS
// ============================================

/**
 * Hook to link an invoice to an opportunity
 */
export function useLinkInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LinkInvoiceInput) => opportunityInvoicesApi.link(data).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opportunityInvoiceKeys.list(variables.opportunity) })
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(variables.opportunity) })
      toast.success('Invoice linked successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to link invoice')
    },
  })
}

/**
 * Hook to unlink an invoice from an opportunity
 */
export function useUnlinkInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ linkId, opportunityId }: { linkId: number; opportunityId: number }) =>
      opportunityInvoicesApi.unlink(linkId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opportunityInvoiceKeys.list(variables.opportunityId) })
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(variables.opportunityId) })
      toast.success('Invoice unlinked')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to unlink invoice')
    },
  })
}

/**
 * Hook to update invoice link
 */
export function useUpdateInvoiceLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ linkId, opportunityId, data }: { linkId: number; opportunityId: number; data: { invoice_type?: InvoiceType; is_primary?: boolean } }) =>
      opportunityInvoicesApi.update(linkId, data).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opportunityInvoiceKeys.list(variables.opportunityId) })
      toast.success('Invoice link updated')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to update invoice link')
    },
  })
}

// ============================================
// CONTRACT LINK MUTATIONS
// ============================================

/**
 * Hook to link an existing contract to an opportunity
 */
export function useLinkContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LinkContractInput) => opportunityContractsApi.link(data).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opportunityContractKeys.list(variables.opportunity) })
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(variables.opportunity) })
      toast.success('Contract linked successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to link contract')
    },
  })
}

/**
 * Hook to create a new contract and link it to an opportunity
 */
export function useCreateAndLinkContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAndLinkContractInput) => opportunityContractsApi.createAndLink(data).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opportunityContractKeys.list(variables.opportunity) })
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(variables.opportunity) })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      toast.success('Contract created and linked')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to create contract')
    },
  })
}

/**
 * Hook to unlink a contract from an opportunity
 */
export function useUnlinkContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ linkId, opportunityId }: { linkId: number; opportunityId: number }) =>
      opportunityContractsApi.unlink(linkId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opportunityContractKeys.list(variables.opportunityId) })
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(variables.opportunityId) })
      toast.success('Contract unlinked')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to unlink contract')
    },
  })
}

/**
 * Hook to update contract link
 */
export function useUpdateContractLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ linkId, opportunityId, data }: { linkId: number; opportunityId: number; data: { is_primary?: boolean } }) =>
      opportunityContractsApi.update(linkId, data).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opportunityContractKeys.list(variables.opportunityId) })
      toast.success('Contract link updated')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to update contract link')
    },
  })
}

// ============================================
// ASSIGNMENT MUTATIONS
// ============================================

export function useCreateOpportunityAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      opportunityId,
      userId,
      role,
    }: {
      opportunityId: number
      userId: number
      role: OpportunityAssignmentRole
    }) => opportunityAssignmentsApi.create(opportunityId, userId, role).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.list(variables.opportunityId) })
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(variables.opportunityId) })
      toast.success('Team member added')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to add team member')
    },
  })
}

export function useDeleteOpportunityAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      opportunityId,
      assignmentId,
    }: {
      opportunityId: number
      assignmentId: number
    }) => opportunityAssignmentsApi.delete(opportunityId, assignmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.list(variables.opportunityId) })
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(variables.opportunityId) })
      toast.success('Team member removed')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to remove team member')
    },
  })
}
