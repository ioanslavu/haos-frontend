import type { Entity } from '@/api/services/entities.service'
import type { ContactPerson } from './contact'

// Brief Types

export type BriefStatus = 'new' | 'qualified' | 'pitched' | 'lost' | 'won'

export interface Brief {
  id: number
  campaign_title: string
  account: Entity
  contact_person?: ContactPerson | null
  department?: number | null
  department_display?: string
  brand_category: string
  brief_status: BriefStatus
  brief_status_display?: string

  // Campaign details
  objectives: string
  target_audience: string
  channels: string[]  // JSON array

  // Timeline
  timing_start?: string | null
  timing_end?: string | null

  // Budget
  budget_range_min?: string | null
  budget_range_max?: string | null
  currency: string

  // Requirements
  must_haves: string
  nice_to_have: string

  // Dates
  received_date: string
  sla_due_date?: string | null
  is_overdue?: boolean

  // Relationships
  opportunities_count?: number

  // Metadata
  notes: string
  created_by?: number | null
  created_by_name?: string | null
  created_at: string
  updated_at: string
}

export interface BriefFormData {
  campaign_title: string
  account: number
  contact_person?: number | null
  department?: number | null
  brand_category?: string
  brief_status?: BriefStatus
  objectives?: string
  target_audience?: string
  channels?: string[]
  timing_start?: string | null
  timing_end?: string | null
  budget_range_min?: string | null
  budget_range_max?: string | null
  currency?: string
  must_haves?: string
  nice_to_have?: string
  sla_due_date?: string | null
  notes?: string
}

// Opportunity Types

export type OpportunityStage =
  | 'qualified'
  | 'proposal'
  | 'shortlist'
  | 'negotiation'
  | 'contract_sent'
  | 'po_received'
  | 'in_execution'
  | 'completed'
  | 'closed_lost'

export interface Opportunity {
  id: number
  opp_name: string
  brief?: { id: number; campaign_title: string } | null
  account: Entity
  owner_user: number
  owner_user_name?: string | null
  department?: number | null
  department_display?: string

  // Opportunity details
  stage: OpportunityStage
  stage_display?: string
  amount_expected?: string | null
  currency: string
  probability_percent: number
  weighted_value?: string | null

  // Dates
  expected_close_date?: string | null
  actual_close_date?: string | null

  // Progress
  next_step: string
  lost_reason: string

  // Relationships
  proposals_count?: number

  // Metadata
  notes: string
  created_by?: number | null
  created_by_name?: string | null
  created_at: string
  updated_at: string
}

export interface OpportunityFormData {
  opp_name: string
  brief?: number | null
  account: number
  owner_user: number
  department?: number | null
  stage?: OpportunityStage
  amount_expected?: string | null
  currency?: string
  probability_percent?: number
  expected_close_date?: string | null
  actual_close_date?: string | null
  next_step?: string
  lost_reason?: string
  notes?: string
}

// Proposal Types

export type ProposalStatus = 'draft' | 'sent' | 'revised' | 'accepted' | 'rejected'

export type ProposalArtistRole = 'main' | 'featured' | 'guest' | 'ensemble'

export interface ProposalArtist {
  id: number
  artist: Entity
  role: ProposalArtistRole
  role_display?: string
  proposed_fee?: string | null
  created_at: string
}

export interface Proposal {
  id: number
  opportunity: {
    id: number
    opp_name: string
    account_name: string
  }
  version: number
  proposal_status: ProposalStatus
  proposal_status_display?: string

  // Pricing
  fee_gross: string
  discounts: string
  agency_fee: string
  fee_net: string
  currency: string

  // Dates
  sent_date?: string | null
  valid_until?: string | null

  // Relationships
  proposal_artists?: ProposalArtist[]
  artists_count?: number

  // Metadata
  notes: string
  created_by?: number | null
  created_by_name?: string | null
  created_at: string
  updated_at: string
}

export interface ProposalFormData {
  opportunity: number
  version?: number
  proposal_status?: ProposalStatus
  fee_gross?: string
  discounts?: string
  agency_fee?: string
  currency?: string
  sent_date?: string | null
  valid_until?: string | null
  notes?: string
}

export interface ProposalArtistFormData {
  proposal: number
  artist: number
  role: ProposalArtistRole
  proposed_fee?: string | null
}

// Deliverable Pack Types

export type DeliverableType =
  | 'ig_post'
  | 'ig_story'
  | 'ig_reel'
  | 'tiktok_video'
  | 'youtube_video'
  | 'youtube_short'
  | 'tvc'
  | 'radio_spot'
  | 'event'
  | 'ooh'
  | 'billboard'
  | 'packaging'
  | 'print_ad'
  | 'digital_banner'
  | 'podcast'
  | 'livestream'
  | 'other'

export interface DeliverablePackItem {
  id: number
  deliverable_type: DeliverableType
  deliverable_type_display?: string
  quantity: number
  description: string
  created_at: string
}

export interface DeliverablePack {
  id: number
  name: string
  description: string
  is_active: boolean
  items?: DeliverablePackItem[]
  items_count?: number
  created_at: string
  updated_at: string
}

export interface DeliverablePackFormData {
  name: string
  description?: string
  is_active?: boolean
}

// Usage Terms Types

export type UsageScope =
  | 'digital'
  | 'atl'
  | 'btl'
  | 'ooh'
  | 'packaging'
  | 'in_store'
  | 'global'
  | 'print'
  | 'broadcast'
  | 'cinema'
  | 'events'

export interface UsageTerms {
  id: number
  name: string
  usage_scope: UsageScope[]
  usage_scope_display?: string[]
  territories: string[]  // ISO country codes
  exclusivity_category: string
  exclusivity_duration_days?: number | null
  usage_duration_days: number
  extensions_allowed: boolean
  buyout: boolean
  brand_list_blocked: string[]
  is_template: boolean
  notes: string
  created_at: string
  updated_at: string
}

export interface UsageTermsFormData {
  name: string
  usage_scope?: UsageScope[]
  territories?: string[]
  exclusivity_category?: string
  exclusivity_duration_days?: number | null
  usage_duration_days?: number
  extensions_allowed?: boolean
  buyout?: boolean
  brand_list_blocked?: string[]
  is_template?: boolean
  notes?: string
}

// Deal Types

export type DealStatus =
  | 'draft'
  | 'pending_signature'
  | 'signed'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled'

export type PaymentTerms =
  | 'net_30'
  | 'net_60'
  | 'net_90'
  | 'advance_50'
  | 'advance_30'
  | 'milestone'
  | 'on_delivery'
  | 'custom'

export type DealArtistContractStatus = 'pending' | 'signed' | 'active'

export interface DealArtist {
  id: number
  artist: Entity
  role: ProposalArtistRole
  role_display?: string
  artist_fee: string
  revenue_share_percent?: string | null
  contract_status: DealArtistContractStatus
  contract_status_display?: string
  signed_date?: string | null
  created_at: string
  updated_at: string
}

export type DeliverableStatus =
  | 'planned'
  | 'in_progress'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'revision_requested'
  | 'completed'

export interface DealDeliverable {
  id: number
  deliverable_type: DeliverableType
  deliverable_type_display?: string
  quantity: number
  description: string
  due_date?: string | null
  status: DeliverableStatus
  status_display?: string
  asset_url: string
  kpi_target: Record<string, any>
  kpi_actual: Record<string, any>
  cost_center: string
  approvals_count?: number
  notes: string
  created_at: string
  updated_at: string
}

export type ApprovalStage =
  | 'concept'
  | 'script'
  | 'storyboard'
  | 'rough_cut'
  | 'final_cut'
  | 'caption'
  | 'static_kv'
  | 'usage_extension'
  | 'other'

export type ApprovalStatus = 'pending' | 'approved' | 'changes_requested' | 'rejected'

export interface Approval {
  id: number
  deliverable?: { id: number; deliverable_type: string } | null
  stage: ApprovalStage
  stage_display?: string
  version: number
  submitted_at: string
  approved_at?: string | null
  approver_contact?: ContactPerson | null
  approver_user_name?: string | null
  status: ApprovalStatus
  status_display?: string
  notes: string
  file_url?: string | null
  created_at: string
  updated_at: string
}

export type InvoiceType = 'advance' | 'milestone' | 'final' | 'full'

export type InvoiceStatus = 'draft' | 'issued' | 'sent' | 'paid' | 'overdue' | 'cancelled'

export interface Invoice {
  id: number
  invoice_number: string
  invoice_type: InvoiceType
  invoice_type_display?: string
  issue_date: string
  due_date: string
  amount: string
  currency: string
  status: InvoiceStatus
  status_display?: string
  paid_date?: string | null
  pdf_url?: string | null
  is_overdue?: boolean
  notes: string
  created_at: string
  updated_at: string
}

export interface Deal {
  id: number
  contract_number: string
  po_number: string
  deal_title: string
  opportunity: { id: number; opp_name: string }
  account: Entity
  deliverable_pack?: DeliverablePack | null
  usage_terms?: UsageTerms | null
  department?: number | null
  department_display?: string

  // Financial
  fee_total: string
  currency: string
  payment_terms: PaymentTerms
  payment_terms_display?: string

  // Dates
  start_date?: string | null
  end_date?: string | null
  signed_date?: string | null

  // Status
  deal_status: DealStatus
  deal_status_display?: string
  brand_safety_score?: number | null

  // Files
  contract_file?: string | null

  // Relationships
  deal_artists?: DealArtist[]
  deliverables?: DealDeliverable[]
  approvals?: Approval[]
  invoices?: Invoice[]
  artists_count?: number
  deliverables_count?: number

  // Metadata
  notes: string
  created_by?: number | null
  created_by_name?: string | null
  created_at: string
  updated_at: string
}

export interface DealFormData {
  opportunity: number
  po_number?: string
  deal_title: string
  account: number
  deliverable_pack?: number | null
  usage_terms?: number | null
  department?: number | null
  fee_total?: string
  currency?: string
  payment_terms?: PaymentTerms
  start_date?: string | null
  end_date?: string | null
  signed_date?: string | null
  deal_status?: DealStatus
  brand_safety_score?: number | null
  notes?: string
}

export interface DealArtistFormData {
  deal: number
  artist: number
  role: ProposalArtistRole
  artist_fee: string
  revenue_share_percent?: string | null
  contract_status?: DealArtistContractStatus
  signed_date?: string | null
}

export interface DealDeliverableFormData {
  deal: number
  deliverable_type: DeliverableType
  quantity: number
  description?: string
  due_date?: string | null
  status?: DeliverableStatus
  asset_url?: string
  kpi_target?: Record<string, any>
  kpi_actual?: Record<string, any>
  cost_center?: string
  notes?: string
}

export interface ApprovalFormData {
  deal: number
  deliverable?: number | null
  stage: ApprovalStage
  version?: number
  submitted_at?: string
  approved_at?: string | null
  approver_contact?: number | null
  status?: ApprovalStatus
  notes?: string
  file_url?: string | null
}

// Status/Type Labels and Colors

export const BRIEF_STATUS_LABELS: Record<BriefStatus, string> = {
  new: 'New',
  qualified: 'Qualified',
  pitched: 'Pitched',
  lost: 'Lost',
  won: 'Won',
}

export const BRIEF_STATUS_COLORS: Record<BriefStatus, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  qualified: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  pitched: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  won: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

export const OPPORTUNITY_STAGE_LABELS: Record<OpportunityStage, string> = {
  qualified: 'Qualified',
  proposal: 'Proposal Sent',
  shortlist: 'Artist Shortlist',
  negotiation: 'Negotiation',
  contract_sent: 'Contract Sent',
  po_received: 'PO Received',
  in_execution: 'In Execution',
  completed: 'Completed',
  closed_lost: 'Closed - Lost',
}

export const OPPORTUNITY_STAGE_COLORS: Record<OpportunityStage, string> = {
  qualified: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  proposal: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  shortlist: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  negotiation: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  contract_sent: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  po_received: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  in_execution: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  closed_lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  revised: 'Revised',
  accepted: 'Accepted',
  rejected: 'Rejected',
}

export const PROPOSAL_STATUS_COLORS: Record<ProposalStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  revised: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  draft: 'Draft',
  pending_signature: 'Pending Signature',
  signed: 'Signed',
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const DEAL_STATUS_COLORS: Record<DealStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  pending_signature: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  signed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  paused: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  completed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

export const DELIVERABLE_STATUS_LABELS: Record<DeliverableStatus, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  revision_requested: 'Revision Requested',
  completed: 'Completed',
}

export const DELIVERABLE_STATUS_COLORS: Record<DeliverableStatus, string> = {
  planned: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  submitted: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  revision_requested: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  completed: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
}

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: 'Pending Review',
  approved: 'Approved',
  changes_requested: 'Changes Requested',
  rejected: 'Rejected',
}

export const APPROVAL_STATUS_COLORS: Record<ApprovalStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  changes_requested: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  issued: 'Issued',
  sent: 'Sent to Client',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
}

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  issued: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  sent: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
}

// Statistics interfaces

export interface BriefStats {
  total_briefs: number
  by_status: Record<string, number>
  overdue_count: number
}

export interface OpportunityPipeline {
  total_opportunities: number
  total_value: string
  weighted_value: string
  by_stage: Record<string, { count: number; total_value: string }>
}

export interface DealStats {
  total_deals: number
  total_value: string
  by_status: Record<string, { count: number; total_value: string }>
  expiring_soon: number
}
