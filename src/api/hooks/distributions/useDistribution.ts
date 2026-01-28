/**
 * Distribution Detail Hooks - Query hooks for single distribution details
 */

import { useQuery } from '@tanstack/react-query'
import { distributionsService } from '../../services/distributions.service'
import apiClient from '../../client'
import { distributionKeys } from './keys'
import type { Distribution, DistributionInvoice } from './types'

// Base URL for distribution endpoints
const DISTRIBUTIONS_BASE_URL = '/api/v1/distributions'

/**
 * Hook to get a single distribution
 */
export const useDistribution = (id: number, enabled = true) => {
  return useQuery<Distribution>({
    queryKey: distributionKeys.detail(id),
    queryFn: () => distributionsService.getDistribution(id),
    enabled: enabled && !!id,
    staleTime: 0,
  })
}

/**
 * Hook to get invoices for a distribution
 */
export const useDistributionInvoices = (distributionId: number) => {
  return useQuery({
    queryKey: distributionKeys.invoices(distributionId),
    queryFn: async () => {
      const response = await apiClient.get<{ count: number; results: DistributionInvoice[] } | DistributionInvoice[]>(
        `${DISTRIBUTIONS_BASE_URL}/${distributionId}/invoices/`
      )
      // Handle both paginated and non-paginated responses
      return Array.isArray(response.data) ? response.data : response.data.results
    },
    enabled: !!distributionId && !isNaN(distributionId) && distributionId > 0,
  })
}
