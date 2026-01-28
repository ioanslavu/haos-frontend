/**
 * Opportunity Types - Re-exports for opportunity hooks
 */

// Re-export from main types
export type {
  OpportunityListParams,
  OpportunityCreateInput,
  OpportunityUpdateInput,
  BulkUpdateInput,
  AdvanceStageInput,
  MarkLostInput,
  OpportunityDeliverable,
  OpportunityAssignmentRole,
} from '@/types/opportunities'

// Re-export from service
export type {
  OpportunityInvoiceLink,
  OpportunityContractLink,
  LinkInvoiceInput,
  LinkContractInput,
  CreateAndLinkContractInput,
  InvoiceType,
} from '../../services/opportunities.service'
