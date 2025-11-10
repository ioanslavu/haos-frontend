/**
 * React Query hooks for Opportunities
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
} from '../services/opportunities.service';
import type {
  OpportunityListParams,
  OpportunityCreateInput,
  OpportunityUpdateInput,
  BulkUpdateInput,
  AdvanceStageInput,
  MarkLostInput,
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
