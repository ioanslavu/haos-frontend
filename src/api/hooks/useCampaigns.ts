/**
 * Campaign Hooks - TanStack Query hooks for campaigns
 *
 * Provides hooks for:
 * - Campaigns CRUD
 * - SubCampaigns CRUD
 * - Stats & Analytics
 * - Infinite scrolling support
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query'
import { campaignsService } from '../services/campaigns.service'
import { useUIStore } from '@/stores/uiStore'
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
  SubCampaignStatus,
} from '@/types/campaign'
import type { PaginatedResponse } from '@/types'

// ============================================
// QUERY KEYS
// ============================================

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
    [...campaignKeys.subCampaigns(campaignId), filters] as const,
  subCampaignDetail: (campaignId: number, subCampaignId: number) =>
    [...campaignKeys.subCampaigns(campaignId), subCampaignId] as const,
}

// ============================================
// CAMPAIGN HOOKS
// ============================================

/**
 * Hook to get paginated campaigns
 */
export const useCampaigns = (
  params?: CampaignFilters & { page?: number; page_size?: number; ordering?: string }
) => {
  return useQuery<PaginatedResponse<Campaign>>({
    queryKey: campaignKeys.list(params),
    queryFn: () => campaignsService.getCampaigns(params),
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook for infinite scrolling campaigns
 */
export const useInfiniteCampaigns = (
  filters?: CampaignFilters,
  pageSize = 20
) => {
  return useInfiniteQuery<PaginatedResponse<Campaign>>({
    queryKey: campaignKeys.infinite(filters),
    queryFn: ({ pageParam = 1 }) =>
      campaignsService.getCampaigns({ ...filters, page: pageParam as number, page_size: pageSize }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.next) return undefined
      return allPages.length + 1
    },
    initialPageParam: 1,
    staleTime: 30000,
  })
}

/**
 * Hook to get a single campaign
 */
export const useCampaign = (id: number, enabled = true) => {
  return useQuery<Campaign>({
    queryKey: campaignKeys.detail(id),
    queryFn: () => campaignsService.getCampaign(id),
    enabled: enabled && !!id,
  })
}

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
 * Hook to get campaign history
 */
export const useCampaignHistory = (id: number, enabled = true) => {
  return useQuery<CampaignHistory[]>({
    queryKey: campaignKeys.history(id),
    queryFn: () => campaignsService.getHistory(id),
    enabled: enabled && !!id,
  })
}

/**
 * Hook to get campaign financials
 */
export const useCampaignFinancials = (id: number, enabled = true) => {
  return useQuery<CampaignFinancials>({
    queryKey: campaignKeys.financials(id),
    queryFn: () => campaignsService.getFinancials(id),
    enabled: enabled && !!id,
  })
}

/**
 * Hook to get campaign financials by platform
 */
export const useCampaignFinancialsByPlatform = (id: number, enabled = true) => {
  return useQuery<PlatformPerformance[]>({
    queryKey: campaignKeys.financialsByPlatform(id),
    queryFn: () => campaignsService.getFinancialsByPlatform(id),
    enabled: enabled && !!id,
  })
}

/**
 * Hook to get campaign statistics
 */
export const useCampaignStats = (filters?: CampaignFilters) => {
  return useQuery<CampaignStats>({
    queryKey: campaignKeys.stats(filters),
    queryFn: () => campaignsService.getStats(filters),
  })
}

/**
 * Hook to get portfolio financials
 */
export const usePortfolioFinancials = (
  filters?: CampaignFilters & { group_by?: 'platform' | 'month' }
) => {
  return useQuery<PortfolioFinancials>({
    queryKey: campaignKeys.portfolioFinancials(filters),
    queryFn: () => campaignsService.getPortfolioFinancials(filters),
  })
}

/**
 * Hook to get top campaigns by budget
 */
export const useTopCampaignsByBudget = (
  filters?: CampaignFilters & { limit?: number }
) => {
  return useQuery<Campaign[]>({
    queryKey: campaignKeys.topByBudget(filters),
    queryFn: () => campaignsService.getTopByBudget(filters),
  })
}

/**
 * Hook to get platform performance
 */
export const usePlatformPerformance = (filters?: CampaignFilters) => {
  return useQuery<PlatformPerformance[]>({
    queryKey: campaignKeys.platformPerformance(filters),
    queryFn: () => campaignsService.getPlatformPerformance(filters),
  })
}

// ============================================
// SUBCAMPAIGN HOOKS
// ============================================

/**
 * Hook to get subcampaigns for a campaign
 */
export const useSubCampaigns = (
  campaignId: number,
  params?: SubCampaignFilters & { page?: number; page_size?: number },
  enabled = true
) => {
  return useQuery<PaginatedResponse<SubCampaign>>({
    queryKey: campaignKeys.subCampaignList(campaignId, params),
    queryFn: () => campaignsService.getSubCampaigns(campaignId, params),
    enabled: enabled && !!campaignId,
  })
}

/**
 * Hook to get a single subcampaign
 */
export const useSubCampaign = (
  campaignId: number,
  subCampaignId: number,
  enabled = true
) => {
  return useQuery<SubCampaign>({
    queryKey: campaignKeys.subCampaignDetail(campaignId, subCampaignId),
    queryFn: () => campaignsService.getSubCampaign(campaignId, subCampaignId),
    enabled: enabled && !!campaignId && !!subCampaignId,
  })
}

/**
 * Hook to create a subcampaign
 */
export const useCreateSubCampaign = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: number; data: SubCampaignCreateData }) =>
      campaignsService.createSubCampaign(campaignId, data),
    onSuccess: (subCampaign, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.subCampaigns(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.history(variables.campaignId) })
      addNotification({
        type: 'success',
        title: 'Platform Added',
        description: `${subCampaign.platform_display} campaign has been added.`,
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        description: error.response?.data?.error || 'Failed to add platform.',
      })
    },
  })
}

/**
 * Hook to update a subcampaign
 */
export const useUpdateSubCampaign = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({
      campaignId,
      subCampaignId,
      data,
    }: {
      campaignId: number
      subCampaignId: number
      data: SubCampaignUpdateData
    }) => campaignsService.updateSubCampaign(campaignId, subCampaignId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.subCampaigns(variables.campaignId) })
      queryClient.invalidateQueries({
        queryKey: campaignKeys.subCampaignDetail(variables.campaignId, variables.subCampaignId),
      })
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(variables.campaignId) })
      addNotification({
        type: 'success',
        title: 'Platform Updated',
        description: 'Platform campaign has been updated.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        description: error.response?.data?.error || 'Failed to update platform.',
      })
    },
  })
}

/**
 * Hook to delete a subcampaign
 */
export const useDeleteSubCampaign = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({ campaignId, subCampaignId }: { campaignId: number; subCampaignId: number }) =>
      campaignsService.deleteSubCampaign(campaignId, subCampaignId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.subCampaigns(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.history(variables.campaignId) })
      addNotification({
        type: 'success',
        title: 'Platform Removed',
        description: 'Platform campaign has been removed.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Deletion Failed',
        description: error.response?.data?.error || 'Failed to remove platform.',
      })
    },
  })
}

/**
 * Hook to update subcampaign budget
 */
export const useUpdateSubCampaignBudget = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({
      campaignId,
      subCampaignId,
      budget,
      reason,
    }: {
      campaignId: number
      subCampaignId: number
      budget: string
      reason?: string
    }) => campaignsService.updateSubCampaignBudget(campaignId, subCampaignId, budget, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.subCampaigns(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.financials(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.history(variables.campaignId) })
      addNotification({
        type: 'success',
        title: 'Budget Updated',
        description: 'Platform budget has been updated.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        description: error.response?.data?.error || 'Failed to update budget.',
      })
    },
  })
}

/**
 * Hook to update subcampaign spent amount
 */
export const useUpdateSubCampaignSpent = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({
      campaignId,
      subCampaignId,
      spent,
      reason,
    }: {
      campaignId: number
      subCampaignId: number
      spent: string
      reason?: string
    }) => campaignsService.updateSubCampaignSpent(campaignId, subCampaignId, spent, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.subCampaigns(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.financials(variables.campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.history(variables.campaignId) })
      addNotification({
        type: 'success',
        title: 'Spending Updated',
        description: 'Platform spending has been updated.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        description: error.response?.data?.error || 'Failed to update spending.',
      })
    },
  })
}

/**
 * Hook to update subcampaign status
 */
export const useUpdateSubCampaignStatus = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({
      campaignId,
      subCampaignId,
      status,
      reason,
    }: {
      campaignId: number
      subCampaignId: number
      status: SubCampaignStatus
      reason?: string
    }) => campaignsService.updateSubCampaignStatus(campaignId, subCampaignId, status, reason),
    onSuccess: (subCampaign, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.subCampaigns(variables.campaignId) })
      queryClient.invalidateQueries({
        queryKey: campaignKeys.subCampaignDetail(variables.campaignId, variables.subCampaignId),
      })
      queryClient.invalidateQueries({ queryKey: campaignKeys.history(variables.campaignId) })
      addNotification({
        type: 'success',
        title: 'Status Updated',
        description: `Platform status changed to "${subCampaign.status_display}".`,
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
 * Hook to add songs to subcampaign
 */
export const useAddSongsToSubCampaign = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({
      campaignId,
      subCampaignId,
      songIds,
    }: {
      campaignId: number
      subCampaignId: number
      songIds: number[]
    }) => campaignsService.addSongsToSubCampaign(campaignId, subCampaignId, songIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.subCampaigns(variables.campaignId) })
      queryClient.invalidateQueries({
        queryKey: campaignKeys.subCampaignDetail(variables.campaignId, variables.subCampaignId),
      })
      addNotification({
        type: 'success',
        title: 'Songs Added',
        description: 'Songs have been added to the platform.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Add Failed',
        description: error.response?.data?.error || 'Failed to add songs.',
      })
    },
  })
}

/**
 * Hook to add artists to subcampaign
 */
export const useAddArtistsToSubCampaign = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useUIStore()

  return useMutation({
    mutationFn: ({
      campaignId,
      subCampaignId,
      artistIds,
    }: {
      campaignId: number
      subCampaignId: number
      artistIds: number[]
    }) => campaignsService.addArtistsToSubCampaign(campaignId, subCampaignId, artistIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.subCampaigns(variables.campaignId) })
      queryClient.invalidateQueries({
        queryKey: campaignKeys.subCampaignDetail(variables.campaignId, variables.subCampaignId),
      })
      addNotification({
        type: 'success',
        title: 'Artists Added',
        description: 'Artists have been added to the platform.',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Add Failed',
        description: error.response?.data?.error || 'Failed to add artists.',
      })
    },
  })
}

// ============================================
// ENTITY ANALYTICS HOOKS (for backwards compatibility)
// ============================================

interface EntityAnalyticsDetail {
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

const emptyAnalytics: EntityAnalyticsDetail = {
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

/**
 * Hook to get artist analytics (campaigns they're featured in)
 * @deprecated This hook is for backwards compatibility
 */
export const useArtistAnalyticsDetail = (entityId: number, enabled = true) => {
  return useQuery<EntityAnalyticsDetail>({
    queryKey: ['entity-analytics', 'artist', entityId],
    queryFn: async () => {
      // TODO: Implement when backend endpoint is available
      // For now, return empty analytics
      return emptyAnalytics
    },
    enabled: enabled && !!entityId,
  })
}

/**
 * Hook to get client analytics (campaigns they've commissioned)
 * @deprecated This hook is for backwards compatibility
 */
export const useClientAnalyticsDetail = (entityId: number, enabled = true) => {
  return useQuery<EntityAnalyticsDetail>({
    queryKey: ['entity-analytics', 'client', entityId],
    queryFn: async () => {
      // TODO: Implement when backend endpoint is available
      // For now, return empty analytics
      return emptyAnalytics
    },
    enabled: enabled && !!entityId,
  })
}

/**
 * Hook to get brand analytics (campaigns for this brand)
 * @deprecated This hook is for backwards compatibility
 */
export const useBrandAnalyticsDetail = (entityId: number, enabled = true) => {
  return useQuery<EntityAnalyticsDetail>({
    queryKey: ['entity-analytics', 'brand', entityId],
    queryFn: async () => {
      // TODO: Implement when backend endpoint is available
      // For now, return empty analytics
      return emptyAnalytics
    },
    enabled: enabled && !!entityId,
  })
}

// ============================================
// CAMPAIGN CONTRACT HOOKS
// ============================================

import type {
  CampaignContract,
  ContractValidation,
  GenerateContractData,
  SendForSignatureData,
} from '../services/campaigns.service'

export const campaignContractKeys = {
  all: (campaignId: number) => [...campaignKeys.detail(campaignId), 'contracts'] as const,
  list: (campaignId: number) => [...campaignContractKeys.all(campaignId), 'list'] as const,
  validation: (campaignId: number) => [...campaignContractKeys.all(campaignId), 'validation'] as const,
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
 * Hook to validate campaign readiness for contract generation
 */
export const useContractValidation = (campaignId: number, enabled = true) => {
  return useQuery<ContractValidation>({
    queryKey: campaignContractKeys.validation(campaignId),
    queryFn: () => campaignsService.validateForContract(campaignId),
    enabled: enabled && !!campaignId,
    staleTime: 30000, // 30 seconds
  })
}

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
