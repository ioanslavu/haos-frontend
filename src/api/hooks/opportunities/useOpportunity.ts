/**
 * Opportunity Detail Hooks - Query hooks for single opportunity details
 */

import { useQuery } from '@tanstack/react-query'
import {
  opportunitiesApi,
  opportunityInvoicesApi,
  opportunityContractsApi,
  opportunityAssignmentsApi,
} from '../../services/opportunities.service'
import { opportunityKeys, opportunityInvoiceKeys, opportunityContractKeys, assignmentKeys } from './keys'

/**
 * Hook to get opportunity detail
 */
export function useOpportunity(id: number) {
  return useQuery({
    queryKey: opportunityKeys.detail(id),
    queryFn: () => opportunitiesApi.get(id).then(res => res.data),
    enabled: !!id,
  })
}

/**
 * Hook to list invoices linked to an opportunity
 */
export function useOpportunityInvoices(opportunityId: number, enabled = true) {
  return useQuery({
    queryKey: opportunityInvoiceKeys.list(opportunityId),
    queryFn: () => opportunityInvoicesApi.list(opportunityId).then(res => res.data),
    enabled: !!opportunityId && enabled,
  })
}

/**
 * Hook to list contracts linked to an opportunity
 */
export function useOpportunityContracts(opportunityId: number, enabled = true) {
  return useQuery({
    queryKey: opportunityContractKeys.list(opportunityId),
    queryFn: () => opportunityContractsApi.list(opportunityId).then(res => res.data),
    enabled: !!opportunityId && enabled,
  })
}

/**
 * Hook to list assignments for an opportunity
 */
export function useOpportunityAssignments(opportunityId: number, enabled = true) {
  return useQuery({
    queryKey: assignmentKeys.list(opportunityId),
    queryFn: () => opportunityAssignmentsApi.list(opportunityId).then(res => res.data),
    enabled: enabled && !!opportunityId,
  })
}
