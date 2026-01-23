/**
 * React Query hooks for Opportunities
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  opportunitiesApi,
  opportunityArtistsApi,
  opportunityTasksApi,
  opportunityDeliverablesApi,
  opportunityActivitiesApi,
  opportunityCommentsApi,
  usageTermsApi,
  deliverablePacksApi,
  approvalsApi,
  opportunityStatsApi,
  opportunityInvoicesApi,
  opportunityContractsApi,
  opportunityAssignmentsApi,
  type OpportunityInvoiceLink,
  type OpportunityContractLink,
  type LinkInvoiceInput,
  type LinkContractInput,
  type CreateAndLinkContractInput,
  type InvoiceType,
} from '../services/opportunities.service';
import type {
  OpportunityListParams,
  OpportunityCreateInput,
  OpportunityUpdateInput,
  BulkUpdateInput,
  AdvanceStageInput,
  MarkLostInput,
  OpportunityDeliverable,
  OpportunityAssignmentRole,
} from '@/types/opportunities';

// === QUERY KEYS ===

export const opportunityKeys = {
  all: ['opportunities'] as const,
  lists: () => [...opportunityKeys.all, 'list'] as const,
  list: (params?: OpportunityListParams) => [...opportunityKeys.lists(), params] as const,
  details: () => [...opportunityKeys.all, 'detail'] as const,
  detail: (id: number) => [...opportunityKeys.details(), id] as const,
  activities: (id: number) => [...opportunityKeys.detail(id), 'activities'] as const,
  comments: (id: number) => [...opportunityKeys.detail(id), 'comments'] as const,
  artists: (opportunityId?: number) => ['opportunity-artists', opportunityId] as const,
  tasks: (opportunityId?: number) => ['opportunity-tasks', opportunityId] as const,
  deliverables: (opportunityId?: number) => ['opportunity-deliverables', opportunityId] as const,
};

// === OPPORTUNITIES ===

/**
 * Hook to list opportunities with filters
 */
export function useOpportunities(params?: OpportunityListParams) {
  return useQuery({
    queryKey: opportunityKeys.list(params),
    queryFn: () => opportunitiesApi.list(params).then(res => res.data),
  });
}

/**
 * Hook to get opportunity detail
 */
export function useOpportunity(id: number) {
  return useQuery({
    queryKey: opportunityKeys.detail(id),
    queryFn: () => opportunitiesApi.get(id).then(res => res.data),
    enabled: !!id,
  });
}

/**
 * Hook to create opportunity
 */
export function useCreateOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OpportunityCreateInput) => opportunitiesApi.create(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
      toast.success('Opportunity created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create opportunity');
    },
  });
}

/**
 * Hook to update opportunity
 */
export function useUpdateOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: OpportunityUpdateInput }) =>
      opportunitiesApi.update(id, data).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
      toast.success('Opportunity updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update opportunity');
    },
  });
}

/**
 * Hook to delete opportunity
 */
export function useDeleteOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => opportunitiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
      toast.success('Opportunity deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete opportunity');
    },
  });
}

/**
 * Hook to advance opportunity stage
 */
export function useAdvanceStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AdvanceStageInput }) =>
      opportunitiesApi.advanceStage(id, data).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
      toast.success('Opportunity stage updated');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update stage');
    },
  });
}

/**
 * Hook to mark opportunity as won
 */
export function useMarkWon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => opportunitiesApi.markWon(id).then(res => res.data),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
      toast.success('Opportunity marked as Won! 🎉');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to mark as won');
    },
  });
}

/**
 * Hook to mark opportunity as lost
 */
export function useMarkLost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: MarkLostInput }) =>
      opportunitiesApi.markLost(id, data).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
      toast.success('Opportunity marked as Lost');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to mark as lost');
    },
  });
}

/**
 * Hook to bulk update opportunities
 */
export function useBulkUpdateOpportunities() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkUpdateInput) => opportunitiesApi.bulkUpdate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
      toast.success('Opportunities updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update opportunities');
    },
  });
}

/**
 * Hook to get activities for opportunity
 */
export function useOpportunityActivities(id: number) {
  return useQuery({
    queryKey: opportunityKeys.activities(id),
    queryFn: () => opportunitiesApi.getActivities(id).then(res => res.data),
    enabled: !!id,
  });
}

/**
 * Hook to get comments for opportunity
 */
export function useOpportunityComments(id: number) {
  return useQuery({
    queryKey: opportunityKeys.comments(id),
    queryFn: () => opportunitiesApi.getComments(id).then(res => res.data),
    enabled: !!id,
  });
}

/**
 * Hook to add comment
 */
export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { comment: string; is_internal?: boolean } }) =>
      opportunitiesApi.addComment(id, data).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.comments(variables.id) });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.activities(variables.id) });
      toast.success('Comment added');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to add comment');
    },
  });
}

// === OPPORTUNITY ARTISTS ===

export function useOpportunityArtists(opportunityId?: number) {
  return useQuery({
    queryKey: opportunityKeys.artists(opportunityId),
    queryFn: () => opportunityArtistsApi.list({ opportunity: opportunityId }).then(res => res.data),
    enabled: !!opportunityId,
  });
}

export function useCreateOpportunityArtist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => opportunityArtistsApi.create(data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.artists(data.opportunity) });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(data.opportunity) });
      toast.success('Artist added');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to add artist');
    },
  });
}

// === OPPORTUNITY TASKS ===

export function useOpportunityTasks(opportunityId?: number) {
  return useQuery({
    queryKey: opportunityKeys.tasks(opportunityId),
    queryFn: () => opportunityTasksApi.list({ opportunity: opportunityId }).then(res => res.data),
    enabled: !!opportunityId,
  });
}

export function useCreateOpportunityTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => opportunityTasksApi.create(data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.tasks(data.opportunity) });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(data.opportunity) });
      toast.success('Task created');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create task');
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => opportunityTasksApi.complete(id).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.tasks(data.opportunity) });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.activities(data.opportunity) });
      toast.success('Task completed');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to complete task');
    },
  });
}

// === OPPORTUNITY DELIVERABLES ===

export function useOpportunityDeliverables(opportunityId?: number) {
  return useQuery({
    queryKey: opportunityKeys.deliverables(opportunityId),
    queryFn: () => opportunityDeliverablesApi.list({ opportunity: opportunityId }).then(res => res.data),
    enabled: !!opportunityId,
  });
}

export function useCreateOpportunityDeliverable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => opportunityDeliverablesApi.create(data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.deliverables(data.opportunity) });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(data.opportunity) });
      toast.success('Deliverable created');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create deliverable');
    },
  });
}

export function useUpdateOpportunityDeliverable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<OpportunityDeliverable> }) =>
      opportunityDeliverablesApi.update(id, data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.deliverables(data.opportunity) });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(data.opportunity) });
      toast.success('Deliverable updated');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update deliverable');
    },
  });
}

// === USAGE TERMS ===

export function useUsageTerms(params?: { is_template?: boolean; search?: string }) {
  return useQuery({
    queryKey: ['usage-terms', params],
    queryFn: () => usageTermsApi.list(params).then(res => res.data),
  });
}

export function useUsageTerm(id: number) {
  return useQuery({
    queryKey: ['usage-terms', id],
    queryFn: () => usageTermsApi.get(id).then(res => res.data),
    enabled: !!id,
  });
}

export function useCreateUsageTerm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => usageTermsApi.create(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usage-terms'] });
      toast.success('Usage terms created');
    },
  });
}

// === DELIVERABLE PACKS ===

export function useDeliverablePacks(params?: { is_active?: boolean; search?: string }) {
  return useQuery({
    queryKey: ['deliverable-packs', params],
    queryFn: () => deliverablePacksApi.list(params).then(res => res.data),
  });
}

export function useDeliverablePack(id: number) {
  return useQuery({
    queryKey: ['deliverable-packs', id],
    queryFn: () => deliverablePacksApi.get(id).then(res => res.data),
    enabled: !!id,
  });
}

export function useCreateDeliverablePack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => deliverablePacksApi.create(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliverable-packs'] });
      toast.success('Deliverable pack created');
    },
  });
}

// === APPROVALS ===

export function useApprovals(params?: { opportunity?: number; status?: string }) {
  return useQuery({
    queryKey: ['approvals', params],
    queryFn: () => approvalsApi.list(params).then(res => res.data),
  });
}

export function useApproval(id: number) {
  return useQuery({
    queryKey: ['approvals', id],
    queryFn: () => approvalsApi.get(id).then(res => res.data),
    enabled: !!id,
  });
}

export function useCreateApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => approvalsApi.create(data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(data.opportunity) });
      toast.success('Approval created');
    },
  });
}

export function useApproveApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { notes?: string } }) =>
      approvalsApi.approve(id, data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.activities(data.opportunity) });
      toast.success('Approval approved');
    },
  });
}

export function useRejectApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { notes: string } }) =>
      approvalsApi.reject(id, data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.activities(data.opportunity) });
      toast.success('Approval rejected');
    },
  });
}

export function useRequestChangesApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { notes: string } }) =>
      approvalsApi.requestChanges(id, data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.activities(data.opportunity) });
      toast.success('Changes requested');
    },
  });
}

// === INFINITE SCROLL ===

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
  });
}

// === STATS ===

/**
 * Hook to get opportunity stats (counts by stage, total value, etc.)
 */
export function useOpportunityStats(params?: OpportunityListParams) {
  return useQuery({
    queryKey: [...opportunityKeys.all, 'stats', params],
    queryFn: () => opportunityStatsApi.get(params).then(res => res.data),
  });
}

// === OPPORTUNITY INVOICE LINKS ===

export const opportunityInvoiceKeys = {
  all: ['opportunity-invoices'] as const,
  list: (opportunityId: number) => [...opportunityInvoiceKeys.all, opportunityId] as const,
};

/**
 * Hook to list invoices linked to an opportunity
 */
export function useOpportunityInvoices(opportunityId: number, enabled = true) {
  return useQuery({
    queryKey: opportunityInvoiceKeys.list(opportunityId),
    queryFn: () => opportunityInvoicesApi.list(opportunityId).then(res => res.data),
    enabled: !!opportunityId && enabled,
  });
}

/**
 * Hook to link an invoice to an opportunity
 */
export function useLinkInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LinkInvoiceInput) => opportunityInvoicesApi.link(data).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opportunityInvoiceKeys.list(variables.opportunity) });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(variables.opportunity) });
      toast.success('Invoice linked successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to link invoice');
    },
  });
}

/**
 * Hook to unlink an invoice from an opportunity
 */
export function useUnlinkInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ linkId, opportunityId }: { linkId: number; opportunityId: number }) =>
      opportunityInvoicesApi.unlink(linkId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opportunityInvoiceKeys.list(variables.opportunityId) });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(variables.opportunityId) });
      toast.success('Invoice unlinked');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to unlink invoice');
    },
  });
}

/**
 * Hook to update invoice link (type, primary status)
 */
export function useUpdateInvoiceLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ linkId, opportunityId, data }: { linkId: number; opportunityId: number; data: { invoice_type?: InvoiceType; is_primary?: boolean } }) =>
      opportunityInvoicesApi.update(linkId, data).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opportunityInvoiceKeys.list(variables.opportunityId) });
      toast.success('Invoice link updated');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to update invoice link');
    },
  });
}

// === OPPORTUNITY CONTRACT LINKS ===

export const opportunityContractKeys = {
  all: ['opportunity-contracts'] as const,
  list: (opportunityId: number) => [...opportunityContractKeys.all, opportunityId] as const,
};

/**
 * Hook to list contracts linked to an opportunity
 */
export function useOpportunityContracts(opportunityId: number, enabled = true) {
  return useQuery({
    queryKey: opportunityContractKeys.list(opportunityId),
    queryFn: () => opportunityContractsApi.list(opportunityId).then(res => res.data),
    enabled: !!opportunityId && enabled,
  });
}

/**
 * Hook to link an existing contract to an opportunity
 */
export function useLinkContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LinkContractInput) => opportunityContractsApi.link(data).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opportunityContractKeys.list(variables.opportunity) });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(variables.opportunity) });
      toast.success('Contract linked successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to link contract');
    },
  });
}

/**
 * Hook to create a new contract and link it to an opportunity
 */
export function useCreateAndLinkContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAndLinkContractInput) => opportunityContractsApi.createAndLink(data).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opportunityContractKeys.list(variables.opportunity) });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(variables.opportunity) });
      queryClient.invalidateQueries({ queryKey: ['contracts'] }); // Invalidate contracts list too
      toast.success('Contract created and linked');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to create contract');
    },
  });
}

/**
 * Hook to unlink a contract from an opportunity
 */
export function useUnlinkContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ linkId, opportunityId }: { linkId: number; opportunityId: number }) =>
      opportunityContractsApi.unlink(linkId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opportunityContractKeys.list(variables.opportunityId) });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(variables.opportunityId) });
      toast.success('Contract unlinked');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to unlink contract');
    },
  });
}

/**
 * Hook to update contract link (primary status)
 */
export function useUpdateContractLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ linkId, opportunityId, data }: { linkId: number; opportunityId: number; data: { is_primary?: boolean } }) =>
      opportunityContractsApi.update(linkId, data).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opportunityContractKeys.list(variables.opportunityId) });
      toast.success('Contract link updated');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to update contract link');
    },
  });
}

// === OPPORTUNITY ASSIGNMENTS ===

export const assignmentKeys = {
  all: ['opportunity-assignments'] as const,
  list: (opportunityId: number) => [...assignmentKeys.all, opportunityId] as const,
};

export function useOpportunityAssignments(opportunityId: number, enabled = true) {
  return useQuery({
    queryKey: assignmentKeys.list(opportunityId),
    queryFn: () => opportunityAssignmentsApi.list(opportunityId).then(res => res.data),
    enabled: enabled && !!opportunityId,
  });
}

export function useCreateOpportunityAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      opportunityId,
      userId,
      role,
    }: {
      opportunityId: number;
      userId: number;
      role: OpportunityAssignmentRole;
    }) => opportunityAssignmentsApi.create(opportunityId, userId, role).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.list(variables.opportunityId) });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(variables.opportunityId) });
      toast.success('Team member added');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to add team member');
    },
  });
}

export function useDeleteOpportunityAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      opportunityId,
      assignmentId,
    }: {
      opportunityId: number;
      assignmentId: number;
    }) => opportunityAssignmentsApi.delete(opportunityId, assignmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.list(variables.opportunityId) });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(variables.opportunityId) });
      toast.success('Team member removed');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to remove team member');
    },
  });
}
