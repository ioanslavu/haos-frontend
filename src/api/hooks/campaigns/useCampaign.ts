/**
 * Campaign Detail Hooks - Query hooks for single campaign details
 */

import {
  useQuery,
  useQueries,
} from '@tanstack/react-query'
import { campaignsService } from '../../services/campaigns.service'
import apiClient from '../../client'
import { campaignKeys, campaignContractKeys, campaignInvoiceKeys, subCampaignInvoiceKeys } from './keys'
import type {
  Campaign,
  CampaignContract,
  ContractValidation,
  CampaignInvoiceLink,
  SubCampaignInvoiceLink,
  PaginatedResponse,
} from './types'

/**
 * Hook to get a single campaign
 */
export const useCampaign = (id: number, enabled = true) => {
  return useQuery<Campaign>({
    queryKey: campaignKeys.detail(id),
    queryFn: () => campaignsService.getCampaign(id),
    enabled: enabled && !!id,
    staleTime: 0, // Always consider data stale for fresh updates
  })
}

/**
 * Hook to get contracts linked to a campaign
 */
export const useCampaignContracts = (campaignId: number, enabled = true) => {
  return useQuery<CampaignContract[]>({
    queryKey: campaignContractKeys.list(campaignId),
    queryFn: () => campaignsService.getContracts(campaignId),
    enabled: enabled && !!campaignId,
  })
}

/**
 * Hook to validate campaign for contract generation
 */
export const useContractValidation = (campaignId: number, enabled = true) => {
  return useQuery<ContractValidation>({
    queryKey: campaignContractKeys.validation(campaignId),
    queryFn: () => campaignsService.validateForContract(campaignId),
    enabled: enabled && !!campaignId,
  })
}

/**
 * Hook to get invoices linked directly to a campaign
 */
export const useCampaignInvoices = (campaignId: number, enabled = true) => {
  return useQuery<CampaignInvoiceLink[]>({
    queryKey: campaignInvoiceKeys.list(campaignId),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<CampaignInvoiceLink> | CampaignInvoiceLink[]>(
        `/api/v1/campaigns/${campaignId}/invoices/`
      )
      if (Array.isArray(response.data)) {
        return response.data
      }
      return response.data.results || []
    },
    enabled: enabled && !!campaignId,
  })
}

/**
 * Hook to get ALL invoices for a campaign (campaign-level + all subcampaign invoices)
 * Uses useQueries to handle dynamic number of subcampaign queries
 */
export const useAllCampaignInvoices = (campaignId: number, subcampaignIds: number[], enabled = true) => {
  // Fetch campaign-level invoices
  const campaignInvoicesQuery = useCampaignInvoices(campaignId, enabled)

  // Fetch invoices for each subcampaign using useQueries
  const subcampaignInvoiceQueries = useQueries({
    queries: subcampaignIds.map(subId => ({
      queryKey: [...campaignKeys.subCampaignDetail(campaignId, subId), 'invoices', 'list'] as const,
      queryFn: async () => {
        const response = await apiClient.get<PaginatedResponse<SubCampaignInvoiceLink> | SubCampaignInvoiceLink[]>(
          `/api/v1/campaigns/${campaignId}/subcampaigns/${subId}/invoices/`
        )
        if (Array.isArray(response.data)) {
          return response.data
        }
        return response.data.results || []
      },
      enabled: enabled && !!campaignId && !!subId,
    })),
  })

  const isLoading = campaignInvoicesQuery.isLoading || subcampaignInvoiceQueries.some(q => q.isLoading)
  const isError = campaignInvoicesQuery.isError || subcampaignInvoiceQueries.some(q => q.isError)

  // Aggregate all invoices
  const campaignInvoices = campaignInvoicesQuery.data || []
  const subcampaignInvoices = subcampaignInvoiceQueries.flatMap(q => q.data || [])

  // Separate by type
  const incomeInvoices = [
    ...campaignInvoices.filter(inv => inv.invoice_type === 'income'),
    ...subcampaignInvoices.filter(inv => inv.invoice_type === 'income'),
  ]
  const expenseInvoices = [
    ...campaignInvoices.filter(inv => inv.invoice_type === 'expense'),
    ...subcampaignInvoices.filter(inv => inv.invoice_type === 'expense'),
  ]

  // Calculate totals (only non-cancelled invoices with amounts)
  const totalIncome = incomeInvoices
    .filter(inv => inv.status !== 'cancelled' && inv.amount)
    .reduce((sum, inv) => sum + parseFloat(inv.amount!), 0)

  const totalExpense = expenseInvoices
    .filter(inv => inv.status !== 'cancelled' && inv.amount)
    .reduce((sum, inv) => sum + parseFloat(inv.amount!), 0)

  const paidIncome = incomeInvoices
    .filter(inv => inv.status === 'paid' && inv.amount)
    .reduce((sum, inv) => sum + parseFloat(inv.amount!), 0)

  const paidExpense = expenseInvoices
    .filter(inv => inv.status === 'paid' && inv.amount)
    .reduce((sum, inv) => sum + parseFloat(inv.amount!), 0)

  return {
    isLoading,
    isError,
    campaignInvoices,
    subcampaignInvoices,
    incomeInvoices,
    expenseInvoices,
    totalIncome,
    totalExpense,
    paidIncome,
    paidExpense,
    balance: totalIncome - totalExpense,
    profit: paidIncome - paidExpense,
  }
}

/**
 * Hook to poll invoice extraction status
 */
export const useInvoiceExtractionStatus = (
  invoiceId: number,
  options?: { enabled?: boolean; refetchInterval?: number }
) => {
  return useQuery<{
    extraction_status: 'pending' | 'processing' | 'success' | 'failed' | 'manual'
    extracted_amount: string | null
    extracted_currency: string | null
    extraction_confidence: number | null
    extraction_notes: string | null
  }>({
    queryKey: ['invoice-extraction-status', invoiceId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/invoices/${invoiceId}/`)
      return {
        extraction_status: response.data.extraction_status,
        extracted_amount: response.data.extracted_amount,
        extracted_currency: response.data.extracted_currency,
        extraction_confidence: response.data.extraction_confidence,
        extraction_notes: response.data.extraction_notes,
      }
    },
    enabled: options?.enabled !== false && !!invoiceId,
    refetchInterval: options?.refetchInterval || false,
  })
}
