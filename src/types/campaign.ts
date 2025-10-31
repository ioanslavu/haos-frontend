import type { Entity } from '@/api/services/entities.service'
import type { ContactPerson } from './contact'
import type { Recording } from '@/api/services/catalog.service'

export type CampaignStatus =
  | 'lead'
  | 'negotiation'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'lost'

export type CampaignHandlerRole = 'lead' | 'support' | 'observer'

export interface CampaignHandler {
  id?: number
  user: number
  user_email?: string
  user_name?: string
  role: CampaignHandlerRole
  role_display?: string
  assigned_at?: string
}

export type PricingModel = 'service_fee' | 'revenue_share'
export type InvoiceStatus = 'not_issued' | 'issued' | 'collected' | 'delayed'

export interface Campaign {
  id: number
  campaign_name: string
  client: Entity
  artist?: Entity | null
  brand: Entity
  song?: Recording | null
  contact_person?: ContactPerson | null
  department?: number | null
  department_display?: string

  // Financial
  value?: string | null  // Decimal as string (for service_fee model)
  currency: string
  pricing_model?: PricingModel
  revenue_generated?: string | null  // For revenue_share model
  partner_share_percentage?: string | null  // For revenue_share model
  partner_payout?: string | null  // Calculated
  our_revenue?: string | null  // Calculated
  calculated_profit?: string | null  // Calculated profit based on pricing model
  budget_allocated?: string | null
  budget_spent?: string | null
  profit?: string | null  // Legacy calculated profit for completed campaigns
  internal_cost_estimate?: string | null  // Estimated internal costs
  invoice_status?: InvoiceStatus | null  // Invoice tracking status

  // Status and timeline
  status: CampaignStatus
  confirmed_at: string | null  // ISO datetime
  start_date?: string | null
  end_date?: string | null

  // Digital department fields
  service_types?: string[]
  service_types_display?: string[]
  platforms?: string[]
  platforms_display?: string[]
  client_health_score?: number | null

  // KPIs
  kpi_targets?: Record<string, { target: number; unit: string }>
  kpi_actuals?: Record<string, { actual: number; unit: string; last_updated?: string }>
  kpi_completion?: number | null

  // Department-specific data
  department_data?: Record<string, any>

  // Relationships
  handlers?: CampaignHandler[]
  tasks_count?: number
  activities_count?: number

  // Metadata
  notes: string
  created_by: number
  created_by_name: string | null
  created_at: string  // ISO datetime
  updated_at: string  // ISO datetime
}

export interface CampaignFormData {
  campaign_name: string
  client: number
  artist?: number | null
  brand: number
  song?: number | null
  contact_person?: number | null
  department?: number | null
  value?: string | null
  currency?: string
  pricing_model?: PricingModel
  revenue_generated?: string | null
  partner_share_percentage?: string | null
  budget_allocated?: string
  budget_spent?: string
  profit?: string
  internal_cost_estimate?: string
  invoice_status?: InvoiceStatus
  status: CampaignStatus
  service_types?: string[]
  platforms?: string[]
  start_date?: string
  end_date?: string
  client_health_score?: number
  kpi_targets?: Record<string, { target: number; unit: string }>
  kpi_actuals?: Record<string, { actual: number; unit: string }>
  department_data?: Record<string, any>
  confirmed_at?: string
  notes?: string
  handlers?: CampaignHandler[]
}

export interface CampaignFilters {
  status?: CampaignStatus | CampaignStatus[]
  client?: number
  artist?: number
  brand?: number
  song?: number
  created_after?: string
  created_before?: string
  confirmed_after?: string
  confirmed_before?: string
  search?: string
}

export interface CampaignStats {
  total_campaigns: number
  total_value: string
  by_status: Record<CampaignStatus, number>
  recent_campaigns: Campaign[]
}

export interface BrandAnalytics {
  brand_id: number
  brand_name: string
  total_campaigns: number
  total_value: string
  unique_artists: number
  campaigns_by_status: Record<CampaignStatus, number>
  artists: Array<{
    id: number
    name: string
    campaign_count: number
  }>
  recent_campaigns: Campaign[]
  campaigns?: Campaign[]  // Full list when viewing specific brand
}

export interface ArtistAnalytics {
  artist_id: number
  artist_name: string
  total_campaigns: number
  total_value: string
  unique_clients: number
  unique_brands: number
  campaigns_by_status: Record<CampaignStatus, number>
  brands: Array<{
    id: number
    name: string
    campaign_count: number
  }>
  clients: Array<{
    id: number
    name: string
    campaign_count: number
  }>
  recent_campaigns: Campaign[]
  campaigns?: Campaign[]  // Full list when viewing specific artist
}

export interface ClientAnalytics {
  client_id: number
  client_name: string
  total_campaigns: number
  total_value: string
  unique_artists: number
  unique_brands: number
  campaigns_by_status: Record<CampaignStatus, number>
  artists: Array<{
    id: number
    name: string
    campaign_count: number
  }>
  brands: Array<{
    id: number
    name: string
    campaign_count: number
  }>
  recent_campaigns: Campaign[]
  campaigns?: Campaign[]  // Full list when viewing specific client
}

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  lead: 'Lead',
  negotiation: 'Negotiation',
  confirmed: 'Confirmed',
  active: 'Active',
  completed: 'Completed',
  lost: 'Lost',
}

export const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, string> = {
  lead: 'bg-blue-100 text-blue-800',
  negotiation: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  active: 'bg-purple-100 text-purple-800',
  completed: 'bg-gray-100 text-gray-800',
  lost: 'bg-red-100 text-red-800',
}

export const CAMPAIGN_HANDLER_ROLE_LABELS: Record<CampaignHandlerRole, string> = {
  lead: 'Lead',
  support: 'Support',
  observer: 'Observer',
}

export const CAMPAIGN_HANDLER_ROLE_COLORS: Record<CampaignHandlerRole, string> = {
  lead: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  support: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  observer: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
}

export const PRICING_MODEL_LABELS: Record<PricingModel, string> = {
  service_fee: 'Service Fee',
  revenue_share: 'Revenue Share',
}

export const PRICING_MODEL_COLORS: Record<PricingModel, string> = {
  service_fee: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  revenue_share: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  not_issued: 'Not Issued (Neemisă)',
  issued: 'Issued (Emisă)',
  collected: 'Collected (Încasată)',
  delayed: 'Delayed (Întârziată)',
}

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  not_issued: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  issued: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  collected: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  delayed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}
