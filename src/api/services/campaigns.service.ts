/**
 * Campaigns Service - API calls for campaigns and subcampaigns
 *
 * Architecture:
 * - Campaign = "who" (client) - /api/v1/campaigns/
 * - SubCampaign = "where" (platform) - /api/v1/campaigns/{id}/subcampaigns/
 */

import apiClient from '../client'
import type {
  Campaign,
  SubCampaign,
  CampaignHistory,
  CampaignCreateData,
  CampaignUpdateData,
  SubCampaignCreateData,
  SubCampaignUpdateData,
  CampaignFilters,
  SubCampaignFilters,
  CampaignStats,
  CampaignFinancials,
  PortfolioFinancials,
  PlatformPerformance,
  CampaignStatus,
} from '@/types/campaign'
import type { PaginatedResponse } from '@/types'

const BASE_PATH = '/api/v1/campaigns'

/**
 * API Response types from list endpoint
 * Note: client is flat (id + name), subcampaigns are nested
 */
interface CampaignListAPIResponse {
  id: number
  name: string
  campaign_type: string
  campaign_type_display?: string
  client: number  // Just the ID in list response
  client_id: number
  client_name: string
  status: string
  status_display?: string
  start_date?: string
  end_date?: string
  department?: number
  department_name?: string
  subcampaign_count?: number
  total_budget?: string
  total_spent?: string
  subcampaigns?: SubCampaign[]  // Now included from backend
  confirmed_at?: string
  created_at: string
}

/**
 * Transform list API response to Campaign format
 * - Converts flat client fields to nested client object
 * - Passes through subcampaigns from backend
 */
function transformCampaignFromList(data: CampaignListAPIResponse): Campaign {
  return {
    ...data,
    // Transform flat client fields to nested client object
    client: {
      id: data.client_id || data.client,
      display_name: data.client_name,
    },
    // Subcampaigns now come from backend
    subcampaigns: data.subcampaigns || [],
  } as Campaign
}

/**
 * Transform paginated response
 */
function transformPaginatedCampaigns(
  response: PaginatedResponse<CampaignListAPIResponse>
): PaginatedResponse<Campaign> {
  return {
    ...response,
    results: response.results.map(transformCampaignFromList),
  }
}

// ============================================
// CAMPAIGNS
// ============================================

export const campaignsService = {
  /**
   * Get paginated list of campaigns
   * Transforms flat API response to nested Campaign format
   */
  getCampaigns: async (
    params?: CampaignFilters & { page?: number; page_size?: number; ordering?: string }
  ): Promise<PaginatedResponse<Campaign>> => {
    const response = await apiClient.get<PaginatedResponse<CampaignListAPIResponse>>(BASE_PATH + '/', { params })
    return transformPaginatedCampaigns(response.data)
  },

  /**
   * Get a single campaign by ID
   */
  getCampaign: async (id: number): Promise<Campaign> => {
    const response = await apiClient.get<Campaign>(`${BASE_PATH}/${id}/`)
    return response.data
  },

  /**
   * Create a new campaign
   */
  createCampaign: async (data: CampaignCreateData): Promise<Campaign> => {
    const response = await apiClient.post<Campaign>(BASE_PATH + '/', data)
    return response.data
  },

  /**
   * Update an existing campaign
   */
  updateCampaign: async (id: number, data: CampaignUpdateData): Promise<Campaign> => {
    const response = await apiClient.patch<Campaign>(`${BASE_PATH}/${id}/`, data)
    return response.data
  },

  /**
   * Delete a campaign (soft delete)
   */
  deleteCampaign: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_PATH}/${id}/`)
  },

  /**
   * Update campaign status with validation
   */
  updateStatus: async (
    id: number,
    status: CampaignStatus,
    reason?: string
  ): Promise<Campaign> => {
    const response = await apiClient.post<Campaign>(`${BASE_PATH}/${id}/update_status/`, {
      status,
      reason,
    })
    return response.data
  },

  /**
   * Reopen a campaign from terminal state (completed, lost, cancelled)
   * - COMPLETED → ACTIVE
   * - CANCELLED → CONFIRMED
   * - LOST → NEGOTIATION
   */
  reopen: async (id: number): Promise<Campaign> => {
    const response = await apiClient.post<Campaign>(`${BASE_PATH}/${id}/reopen/`)
    return response.data
  },

  /**
   * Get campaign history/audit trail
   */
  getHistory: async (id: number): Promise<CampaignHistory[]> => {
    const response = await apiClient.get<CampaignHistory[]>(`${BASE_PATH}/${id}/history/`)
    return response.data
  },

  /**
   * Get campaign financial summary
   */
  getFinancials: async (id: number): Promise<CampaignFinancials> => {
    const response = await apiClient.get<CampaignFinancials>(`${BASE_PATH}/${id}/financials/`)
    return response.data
  },

  /**
   * Get campaign financials by platform
   */
  getFinancialsByPlatform: async (id: number): Promise<PlatformPerformance[]> => {
    const response = await apiClient.get<PlatformPerformance[]>(
      `${BASE_PATH}/${id}/financials_by_platform/`
    )
    return response.data
  },

  /**
   * Get campaign statistics
   */
  getStats: async (filters?: CampaignFilters): Promise<CampaignStats> => {
    const response = await apiClient.get<CampaignStats>(`${BASE_PATH}/stats/`, { params: filters })
    return response.data
  },

  /**
   * Get portfolio financials (filtered campaigns)
   */
  getPortfolioFinancials: async (
    filters?: CampaignFilters & { group_by?: 'platform' | 'month' }
  ): Promise<PortfolioFinancials> => {
    const response = await apiClient.get<PortfolioFinancials>(`${BASE_PATH}/portfolio_financials/`, {
      params: filters,
    })
    return response.data
  },

  /**
   * Get top campaigns by budget
   */
  getTopByBudget: async (
    filters?: CampaignFilters & { limit?: number }
  ): Promise<Campaign[]> => {
    const response = await apiClient.get<Campaign[]>(`${BASE_PATH}/top_by_budget/`, {
      params: filters,
    })
    return response.data
  },

  /**
   * Get platform performance across campaigns
   */
  getPlatformPerformance: async (filters?: CampaignFilters): Promise<PlatformPerformance[]> => {
    const response = await apiClient.get<PlatformPerformance[]>(
      `${BASE_PATH}/platform_performance/`,
      { params: filters }
    )
    return response.data
  },

  // ============================================
  // SUBCAMPAIGNS
  // ============================================

  /**
   * Get subcampaigns for a campaign
   */
  getSubCampaigns: async (
    campaignId: number,
    params?: SubCampaignFilters & { page?: number; page_size?: number }
  ): Promise<PaginatedResponse<SubCampaign>> => {
    const response = await apiClient.get<PaginatedResponse<SubCampaign>>(
      `${BASE_PATH}/${campaignId}/subcampaigns/`,
      { params }
    )
    return response.data
  },

  /**
   * Get a single subcampaign
   */
  getSubCampaign: async (campaignId: number, subCampaignId: number): Promise<SubCampaign> => {
    const response = await apiClient.get<SubCampaign>(
      `${BASE_PATH}/${campaignId}/subcampaigns/${subCampaignId}/`
    )
    return response.data
  },

  /**
   * Create a subcampaign
   */
  createSubCampaign: async (
    campaignId: number,
    data: SubCampaignCreateData
  ): Promise<SubCampaign> => {
    const response = await apiClient.post<SubCampaign>(
      `${BASE_PATH}/${campaignId}/subcampaigns/`,
      data
    )
    return response.data
  },

  /**
   * Update a subcampaign
   */
  updateSubCampaign: async (
    campaignId: number,
    subCampaignId: number,
    data: SubCampaignUpdateData
  ): Promise<SubCampaign> => {
    const response = await apiClient.patch<SubCampaign>(
      `${BASE_PATH}/${campaignId}/subcampaigns/${subCampaignId}/`,
      data
    )
    return response.data
  },

  /**
   * Delete a subcampaign
   */
  deleteSubCampaign: async (campaignId: number, subCampaignId: number): Promise<void> => {
    await apiClient.delete(`${BASE_PATH}/${campaignId}/subcampaigns/${subCampaignId}/`)
  },

  /**
   * Update subcampaign budget
   */
  updateSubCampaignBudget: async (
    campaignId: number,
    subCampaignId: number,
    budget: string,
    reason?: string
  ): Promise<SubCampaign> => {
    const response = await apiClient.post<SubCampaign>(
      `${BASE_PATH}/${campaignId}/subcampaigns/${subCampaignId}/update_budget/`,
      { budget, reason }
    )
    return response.data
  },

  /**
   * Update subcampaign spent amount
   */
  updateSubCampaignSpent: async (
    campaignId: number,
    subCampaignId: number,
    spent: string,
    reason?: string
  ): Promise<SubCampaign> => {
    const response = await apiClient.post<SubCampaign>(
      `${BASE_PATH}/${campaignId}/subcampaigns/${subCampaignId}/update_spent/`,
      { spent, reason }
    )
    return response.data
  },

  /**
   * Update subcampaign status
   */
  updateSubCampaignStatus: async (
    campaignId: number,
    subCampaignId: number,
    status: string,
    reason?: string
  ): Promise<SubCampaign> => {
    const response = await apiClient.post<SubCampaign>(
      `${BASE_PATH}/${campaignId}/subcampaigns/${subCampaignId}/update_status/`,
      { status, reason }
    )
    return response.data
  },

  /**
   * Add songs to subcampaign
   */
  addSongsToSubCampaign: async (
    campaignId: number,
    subCampaignId: number,
    songIds: number[]
  ): Promise<SubCampaign> => {
    const response = await apiClient.post<SubCampaign>(
      `${BASE_PATH}/${campaignId}/subcampaigns/${subCampaignId}/add_songs/`,
      { song_ids: songIds }
    )
    return response.data
  },

  /**
   * Remove songs from subcampaign
   */
  removeSongsFromSubCampaign: async (
    campaignId: number,
    subCampaignId: number,
    songIds: number[]
  ): Promise<SubCampaign> => {
    const response = await apiClient.post<SubCampaign>(
      `${BASE_PATH}/${campaignId}/subcampaigns/${subCampaignId}/remove_songs/`,
      { song_ids: songIds }
    )
    return response.data
  },

  /**
   * Add artists to subcampaign
   */
  addArtistsToSubCampaign: async (
    campaignId: number,
    subCampaignId: number,
    artistIds: number[]
  ): Promise<SubCampaign> => {
    const response = await apiClient.post<SubCampaign>(
      `${BASE_PATH}/${campaignId}/subcampaigns/${subCampaignId}/add_artists/`,
      { artist_ids: artistIds }
    )
    return response.data
  },

  /**
   * Remove artists from subcampaign
   */
  removeArtistsFromSubCampaign: async (
    campaignId: number,
    subCampaignId: number,
    artistIds: number[]
  ): Promise<SubCampaign> => {
    const response = await apiClient.post<SubCampaign>(
      `${BASE_PATH}/${campaignId}/subcampaigns/${subCampaignId}/remove_artists/`,
      { artist_ids: artistIds }
    )
    return response.data
  },

  // ============================================
  // CAMPAIGN CONTRACTS
  // ============================================

  /**
   * Get contracts linked to a campaign
   */
  getContracts: async (campaignId: number): Promise<CampaignContract[]> => {
    const response = await apiClient.get<CampaignContract[]>(
      `${BASE_PATH}/${campaignId}/contracts/`
    )
    return response.data
  },

  /**
   * Validate campaign readiness for contract generation
   */
  validateForContract: async (campaignId: number): Promise<ContractValidation> => {
    const response = await apiClient.get<ContractValidation>(
      `${BASE_PATH}/${campaignId}/contracts/validate/`
    )
    return response.data
  },

  /**
   * Link an existing contract to a campaign
   */
  linkContract: async (campaignId: number, contractId: number): Promise<CampaignContract> => {
    const response = await apiClient.post<CampaignContract>(
      `${BASE_PATH}/${campaignId}/contracts/`,
      { contract_id: contractId }
    )
    return response.data
  },

  /**
   * Unlink a contract from a campaign
   */
  unlinkContract: async (campaignId: number, linkId: number): Promise<void> => {
    await apiClient.delete(`${BASE_PATH}/${campaignId}/contracts/${linkId}/`)
  },

  /**
   * Generate a new contract for a campaign
   */
  generateContract: async (
    campaignId: number,
    data: GenerateContractData
  ): Promise<CampaignContract> => {
    const response = await apiClient.post<CampaignContract>(
      `${BASE_PATH}/${campaignId}/contracts/generate/`,
      data
    )
    return response.data
  },

  /**
   * Send a contract for e-signature
   */
  sendForSignature: async (
    campaignId: number,
    linkId: number,
    data: SendForSignatureData
  ): Promise<CampaignContract> => {
    const response = await apiClient.post<CampaignContract>(
      `${BASE_PATH}/${campaignId}/contracts/${linkId}/send_for_signature/`,
      data
    )
    return response.data
  },

  /**
   * Refresh signature status from Dropbox Sign
   * Calls the contracts endpoint directly since it's on the Contract model
   */
  refreshSignatureStatus: async (contractId: number): Promise<SignatureStatusResponse> => {
    const response = await apiClient.get<SignatureStatusResponse>(
      `/api/v1/contracts/${contractId}/signature_status/`
    )
    return response.data
  },

  // ============================================
  // CAMPAIGN REPORTS
  // ============================================

  /**
   * Generate a PDF report for a completed campaign
   */
  generateReport: async (campaignId: number): Promise<GenerateReportResponse> => {
    const response = await apiClient.post<GenerateReportResponse>(
      `${BASE_PATH}/${campaignId}/generate_report/`
    )
    return response.data
  },
}

// ============================================
// CAMPAIGN CONTRACT TYPES
// ============================================

export interface CampaignContract {
  id: number
  campaign: number
  campaign_name?: string
  contract: number
  contract_number?: string
  contract_title?: string
  contract_status?: string
  contract_gdrive_url?: string
  is_annex?: boolean
  parent_contract_id?: number
  parent_contract_number?: string
  created_at: string
  created_by?: number
  created_by_name?: string
}

export interface SignerInfo {
  email: string | null
  name: string | null
  role: string
  is_valid?: boolean
  missing_fields?: Array<{ field: string; label: string }>
}

export interface ContractValidation {
  can_generate: boolean
  can_send_for_signature: boolean
  dates: {
    is_valid: boolean
    has_start_date: boolean
    has_end_date: boolean
  }
  entity: {
    is_valid: boolean
    entity_type: string | null
    missing_fields: Array<{ field: string; label: string }>
    warnings: string[]
  }
  signers: {
    hahaha_rep: SignerInfo
    client: SignerInfo
  }
}

export interface GenerateContractData {
  start_date?: string
  end_date?: string
  title?: string
  form_data?: Record<string, unknown>
}

export interface SendForSignatureData {
  signers: Array<{
    email: string
    name: string
    role: string
  }>
  test_mode?: boolean
}

export interface SignatureStatusResponse {
  signature_request_id: string
  is_complete: boolean
  has_error: boolean
  signatures: unknown[]
  contract: {
    id: number
    status: string
    [key: string]: unknown
  }
}

// ============================================
// CAMPAIGN REPORT TYPES
// ============================================

export interface GenerateReportResponse {
  success: boolean
  report_url: string
  filename: string
  file_size: number
  generated_at: string
}

export default campaignsService
