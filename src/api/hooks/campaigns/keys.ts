/**
 * Campaign Query Keys - Factory for all campaign-related query keys
 */

import type { CampaignFilters, SubCampaignFilters } from '@/types/campaign'

export const campaignKeys = {
  all: ['campaigns'] as const,

  // Lists
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: (filters?: CampaignFilters & { page?: number; page_size?: number; ordering?: string }) =>
    [...campaignKeys.lists(), filters] as const,
  infinite: (filters?: CampaignFilters) => [...campaignKeys.lists(), 'infinite', filters] as const,

  // Details
  details: () => [...campaignKeys.all, 'detail'] as const,
  detail: (id: number) => [...campaignKeys.details(), id] as const,

  // History
  history: (id: number) => [...campaignKeys.detail(id), 'history'] as const,

  // Financials
  financials: (id: number) => [...campaignKeys.detail(id), 'financials'] as const,
  financialsByPlatform: (id: number) => [...campaignKeys.detail(id), 'financials-by-platform'] as const,

  // Stats
  stats: (filters?: CampaignFilters) => [...campaignKeys.all, 'stats', filters] as const,
  portfolioFinancials: (filters?: CampaignFilters) =>
    [...campaignKeys.all, 'portfolio-financials', filters] as const,
  topByBudget: (filters?: CampaignFilters & { limit?: number }) =>
    [...campaignKeys.all, 'top-by-budget', filters] as const,
  platformPerformance: (filters?: CampaignFilters) =>
    [...campaignKeys.all, 'platform-performance', filters] as const,

  // SubCampaigns
  subCampaigns: (campaignId: number) => [...campaignKeys.detail(campaignId), 'subcampaigns'] as const,
  subCampaignList: (campaignId: number, filters?: SubCampaignFilters) =>
    filters
      ? [...campaignKeys.subCampaigns(campaignId), filters] as const
      : campaignKeys.subCampaigns(campaignId),
  subCampaignDetail: (campaignId: number, subCampaignId: number) =>
    [...campaignKeys.subCampaigns(campaignId), subCampaignId] as const,
}

export const campaignContractKeys = {
  all: (campaignId: number) => [...campaignKeys.detail(campaignId), 'contracts'] as const,
  list: (campaignId: number) => [...campaignContractKeys.all(campaignId), 'list'] as const,
  validation: (campaignId: number) => [...campaignContractKeys.all(campaignId), 'validation'] as const,
}

export const campaignAssignmentKeys = {
  all: (campaignId: number) => [...campaignKeys.detail(campaignId), 'assignments'] as const,
}

export const campaignInvoiceKeys = {
  all: (campaignId: number) =>
    [...campaignKeys.detail(campaignId), 'invoices'] as const,
  list: (campaignId: number) =>
    [...campaignInvoiceKeys.all(campaignId), 'list'] as const,
  detail: (campaignId: number, invoiceLinkId: number) =>
    [...campaignInvoiceKeys.all(campaignId), invoiceLinkId] as const,
}

export const subCampaignInvoiceKeys = {
  all: (campaignId: number, subcampaignId: number) =>
    [...campaignKeys.subCampaignDetail(campaignId, subcampaignId), 'invoices'] as const,
  list: (campaignId: number, subcampaignId: number) =>
    [...subCampaignInvoiceKeys.all(campaignId, subcampaignId), 'list'] as const,
  detail: (campaignId: number, subcampaignId: number, invoiceLinkId: number) =>
    [...subCampaignInvoiceKeys.all(campaignId, subcampaignId), invoiceLinkId] as const,
}
