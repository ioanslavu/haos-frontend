/**
 * Distribution Types - Re-exports and local types for distribution hooks
 */

// Re-export from main types
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
} from '@/types/distribution'

export type { PaginatedResponse } from '@/types'

// Local types
export interface DistributionInvoice {
  id: number
  distribution: number
  invoice_id: number
  invoice_number: string
  invoice_name: string
  invoice_type: 'income' | 'expense'
  invoice_type_display: string
  amount: string | null
  currency: string
  status: string
  status_display: string
  issue_date: string | null
  due_date: string | null
  notes?: string
  file?: string
  extraction_status?: string
  created_at: string
  created_by: number | null
  created_by_name: string | null
}
