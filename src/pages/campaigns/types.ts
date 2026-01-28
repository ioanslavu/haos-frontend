/**
 * Shared types for Campaign Detail page components
 */

import type { CampaignStatus } from '@/types/campaign'
import type { ContactPerson } from '@/api/services/entities.service'
import type { CampaignContract } from '@/api/services/campaigns.service'

// Re-export for convenience
export type { CampaignStatus }
export type { ContactPerson }
export type { CampaignContract }

/**
 * Invoice data structure returned by useAllCampaignInvoices
 */
export interface InvoiceData {
  incomeInvoices: Invoice[]
  expenseInvoices: Invoice[]
  subcampaignInvoices: Invoice[]
  totalIncome: number
  totalExpense: number
  profit: number
  balance: number
  isLoading: boolean
}

/**
 * Basic invoice structure
 */
export interface Invoice {
  id: number
  invoice_number: string
  invoice_name?: string
  invoice_type: 'income' | 'expense'
  amount?: string
  currency: string
  status: string
  status_display?: string
  subcampaign?: number
}

/**
 * Campaign history entry
 */
export interface CampaignHistoryEntry {
  id: number
  event_type: string
  event_type_display?: string
  description?: string
  old_value?: string
  new_value?: string
  created_at: string
  created_by_name?: string
}

/**
 * Signer structure for contract signature
 */
export interface Signer {
  email: string
  name: string
  role: string
}

/**
 * Contract validation data
 */
export interface ContractValidation {
  signers?: {
    hahaha_rep?: {
      email?: string
      name?: string
      role?: string
    }
    client?: {
      email?: string
      name?: string
      role?: string
      is_valid?: boolean
      missing_fields?: Array<{ field: string; label: string }>
    }
  }
}

/**
 * Client profile with health scores
 */
export interface ClientProfile {
  health_score?: number
  collaboration_frequency_score?: number | null
  feedback_score?: number | null
  payment_latency_score?: number | null
}

/**
 * Event configuration for history timeline
 */
export interface EventConfig {
  icon: string
  color: string
}

export const EVENT_CONFIG: Record<string, EventConfig> = {
  created: { icon: '🆕', color: 'bg-green-500' },
  status_changed: { icon: '🔄', color: 'bg-blue-500' },
  subcampaign_added: { icon: '➕', color: 'bg-emerald-500' },
  subcampaign_removed: { icon: '➖', color: 'bg-red-500' },
  budget_updated: { icon: '💰', color: 'bg-amber-500' },
  contract_signed: { icon: '✍️', color: 'bg-purple-500' },
  contract_added: { icon: '📄', color: 'bg-indigo-500' },
  note_added: { icon: '📝', color: 'bg-cyan-500' },
  assignment_added: { icon: '👤', color: 'bg-pink-500' },
  assignment_removed: { icon: '👋', color: 'bg-orange-500' },
  field_changed: { icon: '✏️', color: 'bg-gray-500' },
}
