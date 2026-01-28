/**
 * Campaign Hooks - Barrel exports
 */

// Keys
export {
  campaignKeys,
  campaignContractKeys,
  campaignAssignmentKeys,
  campaignInvoiceKeys,
  subCampaignInvoiceKeys,
} from './keys'

// Types
export type {
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
  CampaignAssignment,
  CampaignAssignmentRole,
  CampaignInvoiceLink,
  SubCampaignInvoiceLink,
  SubCampaignInvoiceUploadPayload,
  InvoiceAmountUpdatePayload,
  PaginatedResponse,
  CampaignContract,
  ContractValidation,
  GenerateContractData,
  SendForSignatureData,
  EntityAnalyticsDetail,
} from './types'

// List and stats hooks
export {
  useCampaigns,
  useInfiniteCampaigns,
  useCampaignHistory,
  useCampaignFinancials,
  useCampaignStats,
  usePortfolioFinancials,
  useArtistAnalyticsDetail,
  useClientAnalyticsDetail,
  useBrandAnalyticsDetail,
} from './useCampaigns'

// Detail hooks
export {
  useCampaign,
  useCampaignContracts,
  useContractValidation,
  useCampaignInvoices,
  useAllCampaignInvoices,
  useInvoiceExtractionStatus,
} from './useCampaign'

// Mutation hooks
export {
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
  useUpdateCampaignStatus,
  useReopenCampaign,
  useLinkContract,
  useUnlinkContract,
  useGenerateCampaignContract,
  useSendContractForSignature,
  useRefreshSignatureStatus,
  useGenerateCampaignReport,
  useCreateCampaignAssignment,
  useDeleteCampaignAssignment,
  useCreateCampaignTask,
} from './useCampaignMutations'

// SubCampaign hooks
export {
  useSubCampaigns,
  useSubCampaign,
  useSubCampaignInvoices,
  useCreateSubCampaign,
  useUpdateSubCampaign,
  useDeleteSubCampaign,
  useUpdateSubCampaignBudget,
  useUpdateSubCampaignSpent,
  useUpdateSubCampaignStatus,
  useAddSongsToSubCampaign,
  useUploadSubCampaignInvoice,
  useSetSubCampaignInvoiceAmount,
  useAcceptSubCampaignInvoiceExtraction,
  useRetrySubCampaignInvoiceExtraction,
  useUnlinkSubCampaignInvoice,
} from './useSubCampaigns'
