import apiClient from '../client'
import {
  Distribution,
  DistributionFormData,
  DistributionFilters,
  DistributionStats,
  DistributionCatalogItem,
  DistributionCatalogItemFormData,
  DistributionRevenueReport,
  DistributionRevenueReportFormData,
} from '@/types/distribution'
import { PaginatedResponse } from '@/types'

const BASE_PATH = '/api/v1/distributions'

export const distributionsService = {
  /**
   * Get paginated list of distributions
   */
  getDistributions: async (params?: DistributionFilters & { page?: number; page_size?: number }) => {
    const response = await apiClient.get<PaginatedResponse<Distribution>>(BASE_PATH, { params })
    return response.data
  },

  /**
   * Get a single distribution by ID
   */
  getDistribution: async (id: number) => {
    const response = await apiClient.get<Distribution>(`${BASE_PATH}/${id}/`)
    return response.data
  },

  /**
   * Create a new distribution
   */
  createDistribution: async (data: DistributionFormData) => {
    const response = await apiClient.post<Distribution>(BASE_PATH + '/', data)
    return response.data
  },

  /**
   * Update an existing distribution
   */
  updateDistribution: async (id: number, data: Partial<DistributionFormData>) => {
    const response = await apiClient.patch<Distribution>(`${BASE_PATH}/${id}/`, data)
    return response.data
  },

  /**
   * Delete a distribution
   */
  deleteDistribution: async (id: number) => {
    await apiClient.delete(`${BASE_PATH}/${id}/`)
  },

  /**
   * Get distribution statistics
   */
  getDistributionStats: async (filters?: DistributionFilters) => {
    const response = await apiClient.get<DistributionStats>(`${BASE_PATH}/stats/`, { params: filters })
    return response.data
  },

  /**
   * Get catalog items for a distribution
   */
  getCatalogItems: async (distributionId: number, params?: { page?: number; page_size?: number }) => {
    const response = await apiClient.get<PaginatedResponse<DistributionCatalogItem>>(
      `${BASE_PATH}/${distributionId}/catalog-items/`,
      { params }
    )
    return response.data
  },

  /**
   * Get a single catalog item
   */
  getCatalogItem: async (distributionId: number, catalogItemId: number) => {
    const response = await apiClient.get<DistributionCatalogItem>(
      `${BASE_PATH}/${distributionId}/catalog-items/${catalogItemId}/`
    )
    return response.data
  },

  /**
   * Add a catalog item to a distribution
   */
  addCatalogItem: async (distributionId: number, data: DistributionCatalogItemFormData) => {
    const response = await apiClient.post<DistributionCatalogItem>(
      `${BASE_PATH}/${distributionId}/catalog-items/`,
      data
    )
    return response.data
  },

  /**
   * Update a catalog item
   */
  updateCatalogItem: async (
    distributionId: number,
    catalogItemId: number,
    data: Partial<DistributionCatalogItemFormData>
  ) => {
    const response = await apiClient.patch<DistributionCatalogItem>(
      `${BASE_PATH}/${distributionId}/catalog-items/${catalogItemId}/`,
      data
    )
    return response.data
  },

  /**
   * Remove a catalog item from a distribution
   */
  removeCatalogItem: async (distributionId: number, catalogItemId: number) => {
    await apiClient.delete(`${BASE_PATH}/${distributionId}/catalog-items/${catalogItemId}/`)
  },

  /**
   * Get revenue reports for a catalog item
   */
  getRevenueReports: async (
    distributionId: number,
    catalogItemId: number,
    params?: { page?: number; page_size?: number }
  ) => {
    const response = await apiClient.get<PaginatedResponse<DistributionRevenueReport>>(
      `${BASE_PATH}/${distributionId}/catalog-items/${catalogItemId}/revenue-reports/`,
      { params }
    )
    return response.data
  },

  /**
   * Add a revenue report for a catalog item
   */
  addRevenueReport: async (
    distributionId: number,
    catalogItemId: number,
    data: DistributionRevenueReportFormData
  ) => {
    const response = await apiClient.post<DistributionRevenueReport>(
      `${BASE_PATH}/${distributionId}/catalog-items/${catalogItemId}/revenue-reports/`,
      data
    )
    return response.data
  },

  /**
   * Update a revenue report
   */
  updateRevenueReport: async (
    distributionId: number,
    catalogItemId: number,
    reportId: number,
    data: Partial<DistributionRevenueReportFormData>
  ) => {
    const response = await apiClient.patch<DistributionRevenueReport>(
      `${BASE_PATH}/${distributionId}/catalog-items/${catalogItemId}/revenue-reports/${reportId}/`,
      data
    )
    return response.data
  },

  /**
   * Delete a revenue report
   */
  deleteRevenueReport: async (distributionId: number, catalogItemId: number, reportId: number) => {
    await apiClient.delete(`${BASE_PATH}/${distributionId}/catalog-items/${catalogItemId}/revenue-reports/${reportId}/`)
  },
}
