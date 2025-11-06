import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { artistSalesService } from '../services/artist-sales.service'
import {
  Brief,
  BriefFormData,
  Opportunity,
  OpportunityFormData,
  Proposal,
  ProposalFormData,
  ProposalArtist,
  ProposalArtistFormData,
  Deal,
  DealFormData,
  DealArtist,
  DealArtistFormData,
  DealDeliverable,
  DealDeliverableFormData,
  Approval,
  ApprovalFormData,
  DeliverablePack,
  DeliverablePackFormData,
  UsageTerms,
  UsageTermsFormData,
  Invoice,
  BriefStats,
  OpportunityPipeline,
  DealStats,
} from '@/types/artist-sales'
import { PaginatedResponse } from '@/types'

/**
 * Query keys factory for artist sales
 */
export const artistSalesKeys = {
  // Briefs
  briefs: {
    all: ['artist-sales', 'briefs'] as const,
    lists: () => [...artistSalesKeys.briefs.all, 'list'] as const,
    list: (filters?: any) => [...artistSalesKeys.briefs.lists(), filters] as const,
    details: () => [...artistSalesKeys.briefs.all, 'detail'] as const,
    detail: (id: number) => [...artistSalesKeys.briefs.details(), id] as const,
    stats: () => [...artistSalesKeys.briefs.all, 'stats'] as const,
  },
  // Opportunities
  opportunities: {
    all: ['artist-sales', 'opportunities'] as const,
    lists: () => [...artistSalesKeys.opportunities.all, 'list'] as const,
    list: (filters?: any) => [...artistSalesKeys.opportunities.lists(), filters] as const,
    details: () => [...artistSalesKeys.opportunities.all, 'detail'] as const,
    detail: (id: number) => [...artistSalesKeys.opportunities.details(), id] as const,
    pipeline: () => [...artistSalesKeys.opportunities.all, 'pipeline'] as const,
  },
  // Proposals
  proposals: {
    all: ['artist-sales', 'proposals'] as const,
    lists: () => [...artistSalesKeys.proposals.all, 'list'] as const,
    list: (filters?: any) => [...artistSalesKeys.proposals.lists(), filters] as const,
    details: () => [...artistSalesKeys.proposals.all, 'detail'] as const,
    detail: (id: number) => [...artistSalesKeys.proposals.details(), id] as const,
    artists: (id: number) => [...artistSalesKeys.proposals.detail(id), 'artists'] as const,
  },
  // Deals
  deals: {
    all: ['artist-sales', 'deals'] as const,
    lists: () => [...artistSalesKeys.deals.all, 'list'] as const,
    list: (filters?: any) => [...artistSalesKeys.deals.lists(), filters] as const,
    details: () => [...artistSalesKeys.deals.all, 'detail'] as const,
    detail: (id: number) => [...artistSalesKeys.deals.details(), id] as const,
    stats: () => [...artistSalesKeys.deals.all, 'stats'] as const,
    artists: (id: number) => [...artistSalesKeys.deals.detail(id), 'artists'] as const,
    deliverables: (id: number) => [...artistSalesKeys.deals.detail(id), 'deliverables'] as const,
    approvals: (id: number) => [...artistSalesKeys.deals.detail(id), 'approvals'] as const,
    invoices: (id: number) => [...artistSalesKeys.deals.detail(id), 'invoices'] as const,
  },
  // Deliverable Packs
  deliverablePacks: {
    all: ['artist-sales', 'deliverable-packs'] as const,
    lists: () => [...artistSalesKeys.deliverablePacks.all, 'list'] as const,
    list: (filters?: any) => [...artistSalesKeys.deliverablePacks.lists(), filters] as const,
    details: () => [...artistSalesKeys.deliverablePacks.all, 'detail'] as const,
    detail: (id: number) => [...artistSalesKeys.deliverablePacks.details(), id] as const,
  },
  // Usage Terms
  usageTerms: {
    all: ['artist-sales', 'usage-terms'] as const,
    lists: () => [...artistSalesKeys.usageTerms.all, 'list'] as const,
    list: (filters?: any) => [...artistSalesKeys.usageTerms.lists(), filters] as const,
    details: () => [...artistSalesKeys.usageTerms.all, 'detail'] as const,
    detail: (id: number) => [...artistSalesKeys.usageTerms.details(), id] as const,
  },
}

// ============= BRIEF HOOKS =============

export const useBriefs = (params?: any) => {
  return useQuery<PaginatedResponse<Brief>>({
    queryKey: artistSalesKeys.briefs.list(params),
    queryFn: () => artistSalesService.getBriefs(params),
    refetchOnMount: 'always',
  })
}

export const useBrief = (id: number, enabled = true) => {
  return useQuery<Brief>({
    queryKey: artistSalesKeys.briefs.detail(id),
    queryFn: () => artistSalesService.getBrief(id),
    enabled: enabled && !!id,
  })
}

export const useCreateBrief = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BriefFormData) => artistSalesService.createBrief(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.briefs.lists() })
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.briefs.stats() })
    },
  })
}

export const useUpdateBrief = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<BriefFormData> }) =>
      artistSalesService.updateBrief(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.briefs.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.briefs.lists() })
    },
  })
}

export const useDeleteBrief = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => artistSalesService.deleteBrief(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.briefs.lists() })
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.briefs.stats() })
    },
  })
}

export const useBriefStats = () => {
  return useQuery<BriefStats>({
    queryKey: artistSalesKeys.briefs.stats(),
    queryFn: () => artistSalesService.getBriefStats(),
  })
}

// ============= OPPORTUNITY HOOKS =============

export const useOpportunities = (params?: any) => {
  return useQuery<PaginatedResponse<Opportunity>>({
    queryKey: artistSalesKeys.opportunities.list(params),
    queryFn: () => artistSalesService.getOpportunities(params),
    refetchOnMount: 'always',
  })
}

export const useOpportunity = (id: number, enabled = true) => {
  return useQuery<Opportunity>({
    queryKey: artistSalesKeys.opportunities.detail(id),
    queryFn: () => artistSalesService.getOpportunity(id),
    enabled: enabled && !!id,
  })
}

export const useCreateOpportunity = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: OpportunityFormData) => artistSalesService.createOpportunity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.opportunities.lists() })
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.opportunities.pipeline() })
    },
  })
}

export const useUpdateOpportunity = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<OpportunityFormData> }) =>
      artistSalesService.updateOpportunity(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.opportunities.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.opportunities.lists() })
    },
  })
}

export const useDeleteOpportunity = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => artistSalesService.deleteOpportunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.opportunities.lists() })
    },
  })
}

export const useOpportunityPipeline = () => {
  return useQuery<OpportunityPipeline>({
    queryKey: artistSalesKeys.opportunities.pipeline(),
    queryFn: () => artistSalesService.getOpportunityPipeline(),
  })
}

export const useConvertToDeal = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (opportunityId: number) => artistSalesService.convertToDeal(opportunityId),
    onSuccess: (_, opportunityId) => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.opportunities.detail(opportunityId) })
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.deals.lists() })
    },
  })
}

// ============= PROPOSAL HOOKS =============

export const useProposals = (params?: any) => {
  return useQuery<PaginatedResponse<Proposal>>({
    queryKey: artistSalesKeys.proposals.list(params),
    queryFn: () => artistSalesService.getProposals(params),
    refetchOnMount: 'always',
  })
}

export const useProposal = (id: number, enabled = true) => {
  return useQuery<Proposal>({
    queryKey: artistSalesKeys.proposals.detail(id),
    queryFn: () => artistSalesService.getProposal(id),
    enabled: enabled && !!id,
  })
}

export const useCreateProposal = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ProposalFormData) => artistSalesService.createProposal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.proposals.lists() })
    },
  })
}

export const useUpdateProposal = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProposalFormData> }) =>
      artistSalesService.updateProposal(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.proposals.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.proposals.lists() })
    },
  })
}

export const useDeleteProposal = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => artistSalesService.deleteProposal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.proposals.lists() })
    },
  })
}

export const useDuplicateProposal = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (proposalId: number) => artistSalesService.duplicateProposal(proposalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.proposals.lists() })
    },
  })
}

export const useSendProposalToClient = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { recipient_email: string; cc_emails?: string[]; message?: string } }) =>
      artistSalesService.sendProposalToClient(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.proposals.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.proposals.lists() })
    },
  })
}

// ============= PROPOSAL ARTIST HOOKS =============

export const useProposalArtists = (proposalId: number, enabled = true) => {
  return useQuery<ProposalArtist[]>({
    queryKey: artistSalesKeys.proposals.artists(proposalId),
    queryFn: () => artistSalesService.getProposalArtists(proposalId),
    enabled: enabled && !!proposalId,
  })
}

export const useCreateProposalArtist = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ProposalArtistFormData) => artistSalesService.createProposalArtist(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.proposals.artists(variables.proposal) })
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.proposals.detail(variables.proposal) })
    },
  })
}

export const useUpdateProposalArtist = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProposalArtistFormData> }) =>
      artistSalesService.updateProposalArtist(id, data),
    onSuccess: (result) => {
      // Invalidate both the list and the detail view
      if (result.artist) {
        queryClient.invalidateQueries({ queryKey: artistSalesKeys.proposals.artists(result.artist.id) })
      }
    },
  })
}

export const useDeleteProposalArtist = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => artistSalesService.deleteProposalArtist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.proposals.all })
    },
  })
}

// ============= DEAL HOOKS =============

export const useDeals = (params?: any) => {
  return useQuery<PaginatedResponse<Deal>>({
    queryKey: artistSalesKeys.deals.list(params),
    queryFn: () => artistSalesService.getDeals(params),
    refetchOnMount: 'always',
  })
}

export const useDeal = (id: number, enabled = true) => {
  return useQuery<Deal>({
    queryKey: artistSalesKeys.deals.detail(id),
    queryFn: () => artistSalesService.getDeal(id),
    enabled: enabled && !!id,
  })
}

export const useCreateDeal = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: DealFormData) => artistSalesService.createDeal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.deals.lists() })
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.deals.stats() })
    },
  })
}

export const useUpdateDeal = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DealFormData> }) =>
      artistSalesService.updateDeal(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.deals.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.deals.lists() })
    },
  })
}

export const useDeleteDeal = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => artistSalesService.deleteDeal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.deals.lists() })
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.deals.stats() })
    },
  })
}

export const useDealStats = () => {
  return useQuery<DealStats>({
    queryKey: artistSalesKeys.deals.stats(),
    queryFn: () => artistSalesService.getDealStats(),
  })
}

// ============= DEAL ARTIST HOOKS =============

export const useDealArtists = (dealId: number, enabled = true) => {
  return useQuery<DealArtist[]>({
    queryKey: artistSalesKeys.deals.artists(dealId),
    queryFn: () => artistSalesService.getDealArtists(dealId),
    enabled: enabled && !!dealId,
  })
}

export const useCreateDealArtist = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: DealArtistFormData) => artistSalesService.createDealArtist(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.deals.artists(variables.deal) })
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.deals.detail(variables.deal) })
    },
  })
}

export const useUpdateDealArtist = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DealArtistFormData> }) =>
      artistSalesService.updateDealArtist(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.deals.all })
    },
  })
}

export const useDeleteDealArtist = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => artistSalesService.deleteDealArtist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.deals.all })
    },
  })
}

// ============= DEAL DELIVERABLE HOOKS =============

export const useDealDeliverables = (dealId: number, enabled = true) => {
  return useQuery<DealDeliverable[]>({
    queryKey: artistSalesKeys.deals.deliverables(dealId),
    queryFn: () => artistSalesService.getDealDeliverables(dealId),
    enabled: enabled && !!dealId,
  })
}

export const useCreateDealDeliverable = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: DealDeliverableFormData) => artistSalesService.createDealDeliverable(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.deals.deliverables(variables.deal) })
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.deals.detail(variables.deal) })
    },
  })
}

export const useUpdateDealDeliverable = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DealDeliverableFormData> }) =>
      artistSalesService.updateDealDeliverable(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.deals.all })
    },
  })
}

export const useDeleteDealDeliverable = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => artistSalesService.deleteDealDeliverable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.deals.all })
    },
  })
}

// ============= APPROVAL HOOKS =============

export const useDealApprovals = (dealId: number, enabled = true) => {
  return useQuery<Approval[]>({
    queryKey: artistSalesKeys.deals.approvals(dealId),
    queryFn: () => artistSalesService.getDealApprovals(dealId),
    enabled: enabled && !!dealId,
  })
}

export const useCreateApproval = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ApprovalFormData) => artistSalesService.createApproval(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.deals.approvals(variables.deal) })
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.deals.detail(variables.deal) })
    },
  })
}

export const useUpdateApproval = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ApprovalFormData> }) =>
      artistSalesService.updateApproval(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.deals.all })
    },
  })
}

export const useDeleteApproval = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => artistSalesService.deleteApproval(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.deals.all })
    },
  })
}

// ============= INVOICE HOOKS =============

export const useDealInvoices = (dealId: number, enabled = true) => {
  return useQuery<Invoice[]>({
    queryKey: artistSalesKeys.deals.invoices(dealId),
    queryFn: () => artistSalesService.getDealInvoices(dealId),
    enabled: enabled && !!dealId,
  })
}

// ============= DELIVERABLE PACK HOOKS =============

export const useDeliverablePacks = (params?: any) => {
  return useQuery<PaginatedResponse<DeliverablePack>>({
    queryKey: artistSalesKeys.deliverablePacks.list(params),
    queryFn: () => artistSalesService.getDeliverablePacks(params),
  })
}

export const useDeliverablePack = (id: number, enabled = true) => {
  return useQuery<DeliverablePack>({
    queryKey: artistSalesKeys.deliverablePacks.detail(id),
    queryFn: () => artistSalesService.getDeliverablePack(id),
    enabled: enabled && !!id,
  })
}

export const useCreateDeliverablePack = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: DeliverablePackFormData) => artistSalesService.createDeliverablePack(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.deliverablePacks.lists() })
    },
  })
}

export const useUpdateDeliverablePack = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DeliverablePackFormData> }) =>
      artistSalesService.updateDeliverablePack(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.deliverablePacks.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.deliverablePacks.lists() })
    },
  })
}

// ============= DELIVERABLE PACK ITEM HOOKS =============

export const useCreateDeliverablePackItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { pack: number; deliverable_type: string; quantity: number; description?: string }) =>
      artistSalesService.createDeliverablePackItem(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.deliverablePacks.detail(variables.pack) })
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.deliverablePacks.lists() })
    },
  })
}

export const useUpdateDeliverablePackItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ deliverable_type: string; quantity: number; description?: string }> }) =>
      artistSalesService.updateDeliverablePackItem(id, data),
    onSuccess: (result) => {
      if (result.pack) {
        queryClient.invalidateQueries({ queryKey: artistSalesKeys.deliverablePacks.detail(result.pack) })
        queryClient.invalidateQueries({ queryKey: artistSalesKeys.deliverablePacks.lists() })
      }
    },
  })
}

export const useDeleteDeliverablePackItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => artistSalesService.deleteDeliverablePackItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.deliverablePacks.lists() })
    },
  })
}

// ============= USAGE TERMS HOOKS =============

export const useUsageTerms = (params?: any) => {
  return useQuery<PaginatedResponse<UsageTerms>>({
    queryKey: artistSalesKeys.usageTerms.list(params),
    queryFn: () => artistSalesService.getUsageTerms(params),
  })
}

export const useUsageTermsDetail = (id: number, enabled = true) => {
  return useQuery<UsageTerms>({
    queryKey: artistSalesKeys.usageTerms.detail(id),
    queryFn: () => artistSalesService.getUsageTermsDetail(id),
    enabled: enabled && !!id,
  })
}

export const useCreateUsageTerms = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UsageTermsFormData) => artistSalesService.createUsageTerms(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.usageTerms.lists() })
    },
  })
}

export const useUpdateUsageTerms = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UsageTermsFormData> }) =>
      artistSalesService.updateUsageTerms(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.usageTerms.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: artistSalesKeys.usageTerms.lists() })
    },
  })
}
