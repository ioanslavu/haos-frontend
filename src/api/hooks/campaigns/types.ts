/**
 * Campaign Types - Re-exports and local types for campaign hooks
 */

// Re-export from main types
export type {
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
  SubCampaignStatus,
  CampaignAssignment,
  CampaignAssignmentRole,
  CampaignInvoiceLink,
  SubCampaignInvoiceLink,
  SubCampaignInvoiceUploadPayload,
  InvoiceAmountUpdatePayload,
} from '@/types/campaign'

export type { PaginatedResponse } from '@/types'

// Re-export from service
export type {
  CampaignContract,
  ContractValidation,
  GenerateContractData,
  SendForSignatureData,
} from '../../services/campaigns.service'

// Local types
export interface EntityAnalyticsDetail {
  total_campaigns: number
  total_value: string
  active_campaigns: number
  unique_brands: number
  unique_clients: number
  unique_artists: number
  campaigns_by_status: Record<string, number>
  brands: Array<{ id: number; name: string; campaign_count: number }>
  clients: Array<{ id: number; name: string; campaign_count: number }>
  artists: Array<{ id: number; name: string; campaign_count: number }>
}

export const emptyAnalytics: EntityAnalyticsDetail = {
  total_campaigns: 0,
  total_value: '0',
  active_campaigns: 0,
  unique_brands: 0,
  unique_clients: 0,
  unique_artists: 0,
  campaigns_by_status: {},
  brands: [],
  clients: [],
  artists: [],
}
