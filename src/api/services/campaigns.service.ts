import apiClient from '../client'
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

const BASE_PATH = '/api/v1/campaigns'

export const campaignsService = {
  /**
   * Get paginated list of campaigns
   */
  getCampaigns: async (params?: CampaignFilters & { page?: number; page_size?: number }) => {
    const response = await apiClient.get<PaginatedResponse<Campaign>>(BASE_PATH, { params })
    return response.data
  },

  /**
   * Get a single campaign by ID
   */
  getCampaign: async (id: number) => {
    const response = await apiClient.get<Campaign>(`${BASE_PATH}/${id}/`)
    return response.data
  },

  /**
   * Create a new campaign
   */
  createCampaign: async (data: CampaignFormData) => {
    const response = await apiClient.post<Campaign>(BASE_PATH + '/', data)
    return response.data
  },

  /**
   * Update an existing campaign
   */
  updateCampaign: async (id: number, data: Partial<CampaignFormData>) => {
    const response = await apiClient.patch<Campaign>(`${BASE_PATH}/${id}/`, data)
    return response.data
  },

  /**
   * Delete a campaign
   */
  deleteCampaign: async (id: number) => {
    await apiClient.delete(`${BASE_PATH}/${id}/`)
  },

  /**
   * Get campaign statistics
   */
  getCampaignStats: async (filters?: CampaignFilters) => {
    const response = await apiClient.get<CampaignStats>(`${BASE_PATH}/stats/`, { params: filters })
    return response.data
  },

  /**
   * Get brand analytics (all brands)
   */
  getBrandAnalytics: async () => {
    const response = await apiClient.get<BrandAnalytics[]>(`${BASE_PATH}/brand_analytics/`)
    return response.data
  },

  /**
   * Get brand analytics for a specific brand
   */
  getBrandAnalyticsDetail: async (brandId: number) => {
    const response = await apiClient.get<BrandAnalytics>(`${BASE_PATH}/brand_analytics/${brandId}/`)
    return response.data
  },

  /**
   * Get artist analytics (all artists)
   */
  getArtistAnalytics: async () => {
    const response = await apiClient.get<ArtistAnalytics[]>(`${BASE_PATH}/artist_analytics/`)
    return response.data
  },

  /**
   * Get artist analytics for a specific artist
   */
  getArtistAnalyticsDetail: async (artistId: number) => {
    const response = await apiClient.get<ArtistAnalytics>(`${BASE_PATH}/artist_analytics/${artistId}/`)
    return response.data
  },

  /**
   * Get client analytics (all clients)
   */
  getClientAnalytics: async () => {
    const response = await apiClient.get<ClientAnalytics[]>(`${BASE_PATH}/client_analytics/`)
    return response.data
  },

  /**
   * Get client analytics for a specific client
   */
  getClientAnalyticsDetail: async (clientId: number) => {
    const response = await apiClient.get<ClientAnalytics>(`${BASE_PATH}/client_analytics/${clientId}/`)
    return response.data
  },
}
