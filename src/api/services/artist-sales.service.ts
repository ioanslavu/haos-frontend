import apiClient from '../client'
import {
  Brief,
  BriefFormData,
  BriefStats,
  Opportunity,
  OpportunityFormData,
  OpportunityPipeline,
  Proposal,
  ProposalFormData,
  ProposalArtist,
  ProposalArtistFormData,
  Deal,
  DealFormData,
  DealStats,
  DealArtist,
  DealArtistFormData,
  DealDeliverable,
  DealDeliverableFormData,
  Approval,
  ApprovalFormData,
  Invoice,
  DeliverablePack,
  DeliverablePackFormData,
  UsageTerms,
  UsageTermsFormData,
} from '@/types/artist-sales'
import { PaginatedResponse } from '@/types'

const BASE_PATH = '/api/v1/artist-sales'

export const artistSalesService = {
  // ============= BRIEFS =============

  getBriefs: async (params?: any) => {
    const response = await apiClient.get<PaginatedResponse<Brief>>(`${BASE_PATH}/briefs/`, { params })
    return response.data
  },

  getBrief: async (id: number) => {
    const response = await apiClient.get<Brief>(`${BASE_PATH}/briefs/${id}/`)
    return response.data
  },

  createBrief: async (data: BriefFormData) => {
    const response = await apiClient.post<Brief>(`${BASE_PATH}/briefs/`, data)
    return response.data
  },

  updateBrief: async (id: number, data: Partial<BriefFormData>) => {
    const response = await apiClient.patch<Brief>(`${BASE_PATH}/briefs/${id}/`, data)
    return response.data
  },

  deleteBrief: async (id: number) => {
    await apiClient.delete(`${BASE_PATH}/briefs/${id}/`)
  },

  getBriefStats: async () => {
    const response = await apiClient.get<BriefStats>(`${BASE_PATH}/briefs/stats/`)
    return response.data
  },

  // ============= OPPORTUNITIES =============

  getOpportunities: async (params?: any) => {
    const response = await apiClient.get<PaginatedResponse<Opportunity>>(`${BASE_PATH}/opportunities/`, { params })
    return response.data
  },

  getOpportunity: async (id: number) => {
    const response = await apiClient.get<Opportunity>(`${BASE_PATH}/opportunities/${id}/`)
    return response.data
  },

  createOpportunity: async (data: OpportunityFormData) => {
    const response = await apiClient.post<Opportunity>(`${BASE_PATH}/opportunities/`, data)
    return response.data
  },

  updateOpportunity: async (id: number, data: Partial<OpportunityFormData>) => {
    const response = await apiClient.patch<Opportunity>(`${BASE_PATH}/opportunities/${id}/`, data)
    return response.data
  },

  deleteOpportunity: async (id: number) => {
    await apiClient.delete(`${BASE_PATH}/opportunities/${id}/`)
  },

  getOpportunityPipeline: async () => {
    const response = await apiClient.get<OpportunityPipeline>(`${BASE_PATH}/opportunities/pipeline/`)
    return response.data
  },

  convertToDeal: async (opportunityId: number) => {
    const response = await apiClient.post<Deal>(`${BASE_PATH}/opportunities/${opportunityId}/convert_to_deal/`)
    return response.data
  },

  // ============= PROPOSALS =============

  getProposals: async (params?: any) => {
    const response = await apiClient.get<PaginatedResponse<Proposal>>(`${BASE_PATH}/proposals/`, { params })
    return response.data
  },

  getProposal: async (id: number) => {
    const response = await apiClient.get<Proposal>(`${BASE_PATH}/proposals/${id}/`)
    return response.data
  },

  createProposal: async (data: ProposalFormData) => {
    const response = await apiClient.post<Proposal>(`${BASE_PATH}/proposals/`, data)
    return response.data
  },

  updateProposal: async (id: number, data: Partial<ProposalFormData>) => {
    const response = await apiClient.patch<Proposal>(`${BASE_PATH}/proposals/${id}/`, data)
    return response.data
  },

  deleteProposal: async (id: number) => {
    await apiClient.delete(`${BASE_PATH}/proposals/${id}/`)
  },

  duplicateProposal: async (proposalId: number) => {
    const response = await apiClient.post<Proposal>(`${BASE_PATH}/proposals/${proposalId}/duplicate/`)
    return response.data
  },

  sendProposalToClient: async (
    proposalId: number,
    data: { recipient_email: string; cc_emails?: string[]; message?: string }
  ) => {
    const response = await apiClient.post<{ message: string; proposal: Proposal }>(
      `${BASE_PATH}/proposals/${proposalId}/send_to_client/`,
      data
    )
    return response.data
  },

  // ============= PROPOSAL ARTISTS =============

  getProposalArtists: async (proposalId: number) => {
    const response = await apiClient.get<PaginatedResponse<ProposalArtist>>(`${BASE_PATH}/proposal-artists/`, {
      params: { proposal_id: proposalId }
    })
    return response.data.results
  },

  createProposalArtist: async (data: ProposalArtistFormData) => {
    const response = await apiClient.post<ProposalArtist>(`${BASE_PATH}/proposal-artists/`, data)
    return response.data
  },

  updateProposalArtist: async (id: number, data: Partial<ProposalArtistFormData>) => {
    const response = await apiClient.patch<ProposalArtist>(`${BASE_PATH}/proposal-artists/${id}/`, data)
    return response.data
  },

  deleteProposalArtist: async (id: number) => {
    await apiClient.delete(`${BASE_PATH}/proposal-artists/${id}/`)
  },

  // ============= DEALS =============

  getDeals: async (params?: any) => {
    const response = await apiClient.get<PaginatedResponse<Deal>>(`${BASE_PATH}/deals/`, { params })
    return response.data
  },

  getDeal: async (id: number) => {
    const response = await apiClient.get<Deal>(`${BASE_PATH}/deals/${id}/`)
    return response.data
  },

  createDeal: async (data: DealFormData) => {
    const response = await apiClient.post<Deal>(`${BASE_PATH}/deals/`, data)
    return response.data
  },

  updateDeal: async (id: number, data: Partial<DealFormData>) => {
    const response = await apiClient.patch<Deal>(`${BASE_PATH}/deals/${id}/`, data)
    return response.data
  },

  deleteDeal: async (id: number) => {
    await apiClient.delete(`${BASE_PATH}/deals/${id}/`)
  },

  getDealStats: async () => {
    const response = await apiClient.get<DealStats>(`${BASE_PATH}/deals/stats/`)
    return response.data
  },

  // ============= DEAL ARTISTS =============

  getDealArtists: async (dealId: number) => {
    const response = await apiClient.get<PaginatedResponse<DealArtist>>(`${BASE_PATH}/deal-artists/`, {
      params: { deal_id: dealId }
    })
    return response.data.results
  },

  createDealArtist: async (data: DealArtistFormData) => {
    const response = await apiClient.post<DealArtist>(`${BASE_PATH}/deal-artists/`, data)
    return response.data
  },

  updateDealArtist: async (id: number, data: Partial<DealArtistFormData>) => {
    const response = await apiClient.patch<DealArtist>(`${BASE_PATH}/deal-artists/${id}/`, data)
    return response.data
  },

  deleteDealArtist: async (id: number) => {
    await apiClient.delete(`${BASE_PATH}/deal-artists/${id}/`)
  },

  // ============= DEAL DELIVERABLES =============

  getDealDeliverables: async (dealId: number) => {
    const response = await apiClient.get<PaginatedResponse<DealDeliverable>>(`${BASE_PATH}/deliverables/`, {
      params: { deal_id: dealId }
    })
    return response.data.results
  },

  createDealDeliverable: async (data: DealDeliverableFormData) => {
    const response = await apiClient.post<DealDeliverable>(`${BASE_PATH}/deliverables/`, data)
    return response.data
  },

  updateDealDeliverable: async (id: number, data: Partial<DealDeliverableFormData>) => {
    const response = await apiClient.patch<DealDeliverable>(`${BASE_PATH}/deliverables/${id}/`, data)
    return response.data
  },

  deleteDealDeliverable: async (id: number) => {
    await apiClient.delete(`${BASE_PATH}/deliverables/${id}/`)
  },

  // ============= APPROVALS =============

  getDealApprovals: async (dealId: number) => {
    const response = await apiClient.get<PaginatedResponse<Approval>>(`${BASE_PATH}/approvals/`, {
      params: { deal_id: dealId }
    })
    return response.data.results
  },

  createApproval: async (data: ApprovalFormData) => {
    const response = await apiClient.post<Approval>(`${BASE_PATH}/approvals/`, data)
    return response.data
  },

  updateApproval: async (id: number, data: Partial<ApprovalFormData>) => {
    const response = await apiClient.patch<Approval>(`${BASE_PATH}/approvals/${id}/`, data)
    return response.data
  },

  deleteApproval: async (id: number) => {
    await apiClient.delete(`${BASE_PATH}/approvals/${id}/`)
  },

  getDealInvoices: async (dealId: number) => {
    const response = await apiClient.get<Invoice[]>(`${BASE_PATH}/deals/${dealId}/invoices/`)
    return response.data
  },

  addDealInvoice: async (dealId: number, data: any) => {
    const response = await apiClient.post<Invoice>(`${BASE_PATH}/deals/${dealId}/invoices/`, data)
    return response.data
  },

  // ============= DELIVERABLE PACKS =============

  getDeliverablePacks: async (params?: any) => {
    const response = await apiClient.get<PaginatedResponse<DeliverablePack>>(`${BASE_PATH}/deliverable-packs/`, { params })
    return response.data
  },

  getDeliverablePack: async (id: number) => {
    const response = await apiClient.get<DeliverablePack>(`${BASE_PATH}/deliverable-packs/${id}/`)
    return response.data
  },

  createDeliverablePack: async (data: DeliverablePackFormData) => {
    const response = await apiClient.post<DeliverablePack>(`${BASE_PATH}/deliverable-packs/`, data)
    return response.data
  },

  updateDeliverablePack: async (id: number, data: Partial<DeliverablePackFormData>) => {
    const response = await apiClient.patch<DeliverablePack>(`${BASE_PATH}/deliverable-packs/${id}/`, data)
    return response.data
  },

  deleteDeliverablePack: async (id: number) => {
    await apiClient.delete(`${BASE_PATH}/deliverable-packs/${id}/`)
  },

  // ============= DELIVERABLE PACK ITEMS =============

  createDeliverablePackItem: async (data: { pack: number; deliverable_type: string; quantity: number; description?: string }) => {
    const response = await apiClient.post(`${BASE_PATH}/deliverable-pack-items/`, data)
    return response.data
  },

  updateDeliverablePackItem: async (id: number, data: Partial<{ deliverable_type: string; quantity: number; description?: string }>) => {
    const response = await apiClient.patch(`${BASE_PATH}/deliverable-pack-items/${id}/`, data)
    return response.data
  },

  deleteDeliverablePackItem: async (id: number) => {
    await apiClient.delete(`${BASE_PATH}/deliverable-pack-items/${id}/`)
  },

  // ============= USAGE TERMS =============

  getUsageTerms: async (params?: any) => {
    const response = await apiClient.get<PaginatedResponse<UsageTerms>>(`${BASE_PATH}/usage-terms/`, { params })
    return response.data
  },

  getUsageTermsDetail: async (id: number) => {
    const response = await apiClient.get<UsageTerms>(`${BASE_PATH}/usage-terms/${id}/`)
    return response.data
  },

  createUsageTerms: async (data: UsageTermsFormData) => {
    const response = await apiClient.post<UsageTerms>(`${BASE_PATH}/usage-terms/`, data)
    return response.data
  },

  updateUsageTerms: async (id: number, data: Partial<UsageTermsFormData>) => {
    const response = await apiClient.patch<UsageTerms>(`${BASE_PATH}/usage-terms/${id}/`, data)
    return response.data
  },

  deleteUsageTerms: async (id: number) => {
    await apiClient.delete(`${BASE_PATH}/usage-terms/${id}/`)
  },
}
