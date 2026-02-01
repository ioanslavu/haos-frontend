/**
 * Opportunity Hooks - Barrel exports
 */

// Keys
export {
  opportunityKeys,
  opportunityInvoiceKeys,
  opportunityContractKeys,
  assignmentKeys,
} from './keys'

// Types
export type {
  OpportunityListParams,
  OpportunityCreateInput,
  OpportunityUpdateInput,
  BulkUpdateInput,
  AdvanceStageInput,
  MarkLostInput,
  OpportunityDeliverable,
  OpportunityAssignmentRole,
  OpportunityInvoiceLink,
  OpportunityContractLink,
  LinkInvoiceInput,
  LinkContractInput,
  CreateAndLinkContractInput,
  InvoiceType,
} from './types'

// List and stats hooks
export {
  useOpportunities,
  useInfiniteOpportunities,
  useOpportunityStats,
  useOpportunityActivities,
  useOpportunityArtists,
  useOpportunityTasks,
  useOpportunityDeliverables,
  useApprovals,
} from './useOpportunities'

// Detail hooks
export {
  useOpportunity,
  useOpportunityInvoices,
  useOpportunityContracts,
  useOpportunityAssignments,
} from './useOpportunity'

// Mutation hooks
export {
  useCreateOpportunity,
  useUpdateOpportunity,
  useDeleteOpportunity,
  useAdvanceStage,
  useMarkWon,
  useMarkLost,
  useCreateOpportunityArtist,
  useCreateOpportunityTask,
  useCreateOpportunityDeliverable,
  useUpdateOpportunityDeliverable,
  useCreateApproval,
  useApproveApproval,
  useRejectApproval,
  useRequestChangesApproval,
  useLinkInvoice,
  useUnlinkInvoice,
  useUpdateInvoiceLink,
  useLinkContract,
  useCreateAndLinkContract,
  useUnlinkContract,
  useUpdateContractLink,
  useCreateOpportunityAssignment,
  useDeleteOpportunityAssignment,
} from './useOpportunityMutations'
