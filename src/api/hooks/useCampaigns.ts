import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { campaignsService } from '../services/campaigns.service'
import {
  Campaign,
  CampaignFormData,
  CampaignFilters,
  CampaignStats,
  BrandAnalytics,
  ArtistAnalytics,
  ClientAnalytics,
} from '@/types/campaign'
import { PaginatedResponse } from '@/types'

/**
 * Query keys factory for campaigns
 */
export const campaignKeys = {
  all: ['campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: (filters?: CampaignFilters) => [...campaignKeys.lists(), filters] as const,
  details: () => [...campaignKeys.all, 'detail'] as const,
  detail: (id: number) => [...campaignKeys.details(), id] as const,
  stats: (filters?: CampaignFilters) => [...campaignKeys.all, 'stats', filters] as const,
  brandAnalytics: () => [...campaignKeys.all, 'brand-analytics'] as const,
  brandAnalyticsDetail: (brandId: number) => [...campaignKeys.brandAnalytics(), brandId] as const,
  artistAnalytics: () => [...campaignKeys.all, 'artist-analytics'] as const,
  artistAnalyticsDetail: (artistId: number) => [...campaignKeys.artistAnalytics(), artistId] as const,
  clientAnalytics: () => [...campaignKeys.all, 'client-analytics'] as const,
  clientAnalyticsDetail: (clientId: number) => [...campaignKeys.clientAnalytics(), clientId] as const,
}

/**
 * Hook to get paginated campaigns
 */
export const useCampaigns = (params?: CampaignFilters & { page?: number; page_size?: number }) => {
  return useQuery<PaginatedResponse<Campaign>>({
    queryKey: campaignKeys.list(params),
    queryFn: () => campaignsService.getCampaigns(params),
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

  return useMutation({
    mutationFn: (data: CampaignFormData) => campaignsService.createCampaign(data),
    onSuccess: () => {
      // Invalidate campaigns list and stats
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() })
      queryClient.invalidateQueries({ queryKey: campaignKeys.all })
    },
  })
}

/**
 * Hook to update a campaign
 */
export const useUpdateCampaign = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CampaignFormData> }) =>
      campaignsService.updateCampaign(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific campaign and lists
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() })
      queryClient.invalidateQueries({ queryKey: campaignKeys.all })
    },
  })
}

/**
 * Hook to delete a campaign
 */
export const useDeleteCampaign = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => campaignsService.deleteCampaign(id),
    onSuccess: () => {
      // Invalidate lists and stats
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() })
      queryClient.invalidateQueries({ queryKey: campaignKeys.all })
    },
  })
}

/**
 * Hook to get campaign statistics
 */
export const useCampaignStats = (filters?: CampaignFilters) => {
  return useQuery<CampaignStats>({
    queryKey: campaignKeys.stats(filters),
    queryFn: () => campaignsService.getCampaignStats(filters),
  })
}

/**
 * Hook to get brand analytics (all brands)
 */
export const useBrandAnalytics = () => {
  return useQuery<BrandAnalytics[]>({
    queryKey: campaignKeys.brandAnalytics(),
    queryFn: () => campaignsService.getBrandAnalytics(),
  })
}

/**
 * Hook to get brand analytics detail
 */
export const useBrandAnalyticsDetail = (brandId: number, enabled = true) => {
  return useQuery<BrandAnalytics>({
    queryKey: campaignKeys.brandAnalyticsDetail(brandId),
    queryFn: () => campaignsService.getBrandAnalyticsDetail(brandId),
    enabled: enabled && !!brandId,
  })
}

/**
 * Hook to get artist analytics (all artists)
 */
export const useArtistAnalytics = () => {
  return useQuery<ArtistAnalytics[]>({
    queryKey: campaignKeys.artistAnalytics(),
    queryFn: () => campaignsService.getArtistAnalytics(),
  })
}

/**
 * Hook to get artist analytics detail
 */
export const useArtistAnalyticsDetail = (artistId: number, enabled = true) => {
  return useQuery<ArtistAnalytics>({
    queryKey: campaignKeys.artistAnalyticsDetail(artistId),
    queryFn: () => campaignsService.getArtistAnalyticsDetail(artistId),
    enabled: enabled && !!artistId,
  })
}

/**
 * Hook to get client analytics (all clients)
 */
export const useClientAnalytics = () => {
  return useQuery<ClientAnalytics[]>({
    queryKey: campaignKeys.clientAnalytics(),
    queryFn: () => campaignsService.getClientAnalytics(),
  })
}

/**
 * Hook to get client analytics detail
 */
export const useClientAnalyticsDetail = (clientId: number, enabled = true) => {
  return useQuery<ClientAnalytics>({
    queryKey: campaignKeys.clientAnalyticsDetail(clientId),
    queryFn: () => campaignsService.getClientAnalyticsDetail(clientId),
    enabled: enabled && !!clientId,
  })
}
