/**
 * Distribution Hooks - Barrel exports
 */

// Keys
export { distributionKeys } from './keys'

// Types
export type {
  Distribution,
  DistributionFormData,
  DistributionFilters,
  DistributionStats,
  DistributionCatalogItem,
  DistributionCatalogItemFormData,
  DistributionSong,
  DistributionSongFormData,
  DistributionRevenueReport,
  DistributionRevenueReportFormData,
  DistributionAssignment,
  DistributionAssignmentRole,
  DealStatus,
  PaginatedResponse,
  DistributionInvoice,
} from './types'

// List and stats hooks
export {
  useDistributions,
  useInfiniteDistributions,
  useDistributionStats,
  useCatalogItems,
  useSongs,
  useRevenueReports,
} from './useDistributions'

// Detail hooks
export {
  useDistribution,
  useDistributionInvoices,
} from './useDistribution'

// Mutation hooks
export {
  useCreateDistribution,
  useUpdateDistribution,
  useDeleteDistribution,
  useUpdateDistributionStatus,
  useAddCatalogItem,
  useRemoveCatalogItem,
  useAddSong,
  useUpdateSong,
  useRemoveSong,
  useAddRevenueReport,
  useUpdateRevenueReport,
  useCreateDistributionAssignment,
  useDeleteDistributionAssignment,
  useLinkDistributionInvoice,
  useUnlinkDistributionInvoice,
  useGenerateDistributionContract,
  useDistributionTasks,
} from './useDistributionMutations'
