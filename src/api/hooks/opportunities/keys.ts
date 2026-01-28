/**
 * Opportunity Query Keys - Factory for all opportunity-related query keys
 */

import type { OpportunityListParams } from '@/types/opportunities'

export const opportunityKeys = {
  all: ['opportunities'] as const,
  lists: () => [...opportunityKeys.all, 'list'] as const,
  list: (params?: OpportunityListParams) => [...opportunityKeys.lists(), params] as const,
  details: () => [...opportunityKeys.all, 'detail'] as const,
  detail: (id: number) => [...opportunityKeys.details(), id] as const,
  activities: (id: number) => [...opportunityKeys.detail(id), 'activities'] as const,
  comments: (id: number) => [...opportunityKeys.detail(id), 'comments'] as const,
  artists: (opportunityId?: number) => ['opportunity-artists', opportunityId] as const,
  tasks: (opportunityId?: number) => ['opportunity-tasks', opportunityId] as const,
  deliverables: (opportunityId?: number) => ['opportunity-deliverables', opportunityId] as const,
}

export const opportunityInvoiceKeys = {
  all: ['opportunity-invoices'] as const,
  list: (opportunityId: number) => [...opportunityInvoiceKeys.all, opportunityId] as const,
}

export const opportunityContractKeys = {
  all: ['opportunity-contracts'] as const,
  list: (opportunityId: number) => [...opportunityContractKeys.all, opportunityId] as const,
}

export const assignmentKeys = {
  all: ['opportunity-assignments'] as const,
  list: (opportunityId: number) => [...assignmentKeys.all, opportunityId] as const,
}
