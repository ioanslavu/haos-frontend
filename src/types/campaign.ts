/**
 * Campaign Types - Matching new backend structure
 *
 * Architecture:
 * - Campaign = "who" (client) - simple identity + status
 * - SubCampaign = "where" (platform) + budget + payment method
 */

import type { Entity, ContactPerson } from '@/api/services/entities.service'

// ============================================
// ENUMS & CONSTANTS
// ============================================

export type CampaignType = 'internal' | 'external'

export type CampaignStatus =
  | 'lead'
  | 'negotiation'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'lost'
  | 'cancelled'

export type SubCampaignStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled'

export type Platform =
  | 'meta'
  | 'google'
  | 'tiktok'
  | 'youtube'
  | 'spotify'
  | 'apple_music'
  | 'amazon_music'
  | 'deezer'
  | 'soundcloud'
  | 'twitter'
  | 'linkedin'
  | 'snapchat'
  | 'pinterest'
  | 'other'

export type ServiceType =
  | 'ppc'
  | 'influencer'
  | 'ugc'
  | 'dsp'
  | 'playlist'
  | 'pr'
  | 'social'
  | 'content'
  | 'radio'
  | 'seo'
  | 'email'
  | 'other'

export type PaymentMethod =
  | 'service_fee'
  | 'revenue_share'

// KPI Types based on CampaignMetrics model
export type KPIType =
  // Performance
  | 'impressions'
  | 'clicks'
  | 'ctr'
  | 'conversions'
  | 'conversion_rate'
  | 'cpc'
  | 'cpa'
  // Social
  | 'reach'
  | 'engagement'
  | 'engagement_rate'
  | 'followers_gained'
  // Content
  | 'views'
  | 'watch_time_minutes'
  | 'shares'
  | 'comments'
  | 'likes'
  // Music
  | 'streams'
  | 'downloads'
  | 'playlist_adds'
  | 'radio_plays'
  // Revenue
  | 'revenue'
  | 'roi'
  | 'cost'

export type KPIUnit = 'count' | 'percent' | 'currency' | 'minutes'

export interface KPITarget {
  target: number
  unit: KPIUnit
  actual?: number
}

export type CampaignAssignmentRole = 'lead' | 'support' | 'observer'

export type CampaignHistoryEventType =
  | 'created'
  | 'status_changed'
  | 'subcampaign_added'
  | 'subcampaign_removed'
  | 'budget_updated'
  | 'contract_signed'
  | 'contract_added'
  | 'note_added'
  | 'assignment_added'
  | 'assignment_removed'
  | 'field_changed'

// ============================================
// CORE MODELS
// ============================================

/** Recording/Song reference */
export interface Recording {
  id: number
  title: string
  type?: string
  status?: string
  isrc?: string
}

/** Campaign Assignment */
export interface CampaignAssignment {
  id?: number
  user: number
  user_email?: string
  user_name?: string
  role: CampaignAssignmentRole
  role_display?: string
  assigned_at?: string
  assigned_by?: number
  assigned_by_name?: string
}

/** Contract info for subcampaign display */
export interface SubCampaignContractInfo {
  id: number
  contract_number: string
  status: string
  is_annex: boolean
}

/** SubCampaign Invoice Link */
export interface SubCampaignInvoiceLink {
  id: number
  subcampaign: number
  invoice: number
  invoice_number: string
  invoice_name: string
  invoice_type: 'income' | 'expense'
  amount: string | null
  currency: string
  status: 'draft' | 'uploaded' | 'paid' | 'cancelled'
  status_display: string
  extraction_status: 'pending' | 'processing' | 'success' | 'failed' | 'manual'
  has_file: boolean
  needs_manual_amount: boolean
  created_at: string
  created_by?: number
  created_by_email?: string
}

/** Campaign Invoice Link (campaign-level invoices, typically income from client) */
export interface CampaignInvoiceLink {
  id: number
  campaign: number
  invoice: number
  invoice_number: string
  invoice_name: string
  invoice_type: 'income' | 'expense'
  amount: string | null
  currency: string
  status: 'draft' | 'uploaded' | 'paid' | 'cancelled'
  status_display: string
  extraction_status: 'pending' | 'processing' | 'success' | 'failed' | 'manual'
  has_file: boolean
  needs_manual_amount: boolean
  created_at: string
  created_by?: number
  created_by_email?: string
}

/** Upload invoice payload */
export interface SubCampaignInvoiceUploadPayload {
  file: File
  name: string
  invoice_type?: 'income' | 'expense'
  currency?: string
  amount?: string
  notes?: string
}

/** Set amount payload */
export interface InvoiceAmountUpdatePayload {
  amount: string
  currency?: string
}

/** SubCampaign - platform-level campaign */
export interface SubCampaign {
  id: number
  campaign: number

  // Platform & Service
  platform: Platform
  platform_display?: string
  platform_other?: string
  service_type: ServiceType
  service_type_display?: string
  status: SubCampaignStatus
  status_display?: string

  // Budget & Payment
  client_value: string
  budget: string
  spent: string
  internal_cost: string
  currency: string
  payment_method: PaymentMethod
  payment_method_display?: string
  revenue_share_percentage?: string
  revenue_generated?: string

  // Content
  songs: Recording[]
  artists: Entity[]

  // KPIs
  kpi_targets?: Record<string, KPITarget>

  // Period
  start_date?: string
  end_date?: string

  // Contract coverage
  contract_info?: SubCampaignContractInfo | null
  has_contract: boolean

  // Invoices (platform spend tracking)
  invoices?: SubCampaignInvoiceLink[]
  invoice_count?: number

  // Metadata
  notes?: string
  created_by?: number
  created_by_name?: string
  created_at: string
  updated_at: string

  // Computed
  budget_remaining?: string
  budget_utilization?: number
  song_count?: number
  artist_count?: number
}

/** Campaign - the master campaign (WHO) */
export interface Campaign {
  id: number
  name: string

  // Type
  campaign_type: CampaignType
  campaign_type_display?: string

  // Client (the WHO)
  client: Entity
  contact_person?: ContactPerson | null

  // Status
  status: CampaignStatus
  status_display?: string
  confirmed_at?: string | null

  // Period
  start_date?: string | null
  end_date?: string | null

  // Department
  department?: number | null
  department_name?: string

  // Relationships
  subcampaigns?: SubCampaign[]
  assignments?: CampaignAssignment[]
  contracts?: CampaignContractLink[]

  // Computed (from subcampaigns)
  subcampaign_count?: number
  total_budget?: string
  total_spent?: string

  // Metadata
  notes?: string
  created_by?: number
  created_by_name?: string
  created_at: string
  updated_at: string
}

/** Campaign-Contract Link */
export interface CampaignContractLink {
  id: number
  campaign: number
  contract: number
  contract_number?: string
  contract_status?: string
  created_at: string
  created_by?: number
  created_by_name?: string
}

/** Campaign History Entry */
export interface CampaignHistory {
  id: number
  campaign: number
  event_type: CampaignHistoryEventType
  event_type_display?: string
  description: string
  old_value?: string
  new_value?: string
  subcampaign?: number
  contract?: number
  metadata?: Record<string, any>
  created_by?: number
  created_by_name?: string
  created_at: string
}

// ============================================
// FORM DATA
// ============================================

export interface CampaignCreateData {
  name: string
  client_id: number
  campaign_type?: CampaignType
  contact_person_id?: number
  start_date?: string
  end_date?: string
  notes?: string
}

export interface CampaignUpdateData {
  name?: string
  campaign_type?: CampaignType
  contact_person_id?: number | null
  start_date?: string
  end_date?: string | null
  notes?: string
}

export interface SubCampaignCreateData {
  platform: Platform
  platform_other?: string
  service_type: ServiceType
  budget?: string
  currency?: string
  payment_method: PaymentMethod
  revenue_share_percentage?: string
  song_ids?: number[]
  artist_ids?: number[]
  kpi_targets?: Record<string, KPITarget>
  start_date?: string
  end_date?: string
  notes?: string
}

export interface SubCampaignUpdateData {
  platform?: Platform
  platform_other?: string
  service_type?: ServiceType
  status?: SubCampaignStatus
  client_value?: string
  budget?: string
  spent?: string
  internal_cost?: string
  currency?: string
  payment_method?: PaymentMethod
  revenue_share_percentage?: string
  revenue_generated?: string
  kpi_targets?: Record<string, KPITarget>
  start_date?: string
  end_date?: string
  notes?: string
}

// ============================================
// FILTERS
// ============================================

export interface CampaignFilters {
  status?: CampaignStatus | CampaignStatus[]
  campaign_type?: CampaignType
  client?: number
  platform?: Platform
  is_active?: boolean
  has_subcampaigns?: boolean
  created_after?: string
  created_before?: string
  confirmed_after?: string
  confirmed_before?: string
  start_date_after?: string
  start_date_before?: string
  end_date_after?: string
  end_date_before?: string
  search?: string
  ordering?: string
}

export interface SubCampaignFilters {
  platform?: Platform | Platform[]
  status?: SubCampaignStatus | SubCampaignStatus[]
  service_type?: ServiceType | ServiceType[]
  payment_method?: PaymentMethod
  min_budget?: string
  max_budget?: string
}

// ============================================
// STATS & ANALYTICS
// ============================================

export interface CampaignStats {
  total: number
  by_status: Record<CampaignStatus, number>
  by_type: Record<CampaignType, number>
  active: number
}

export interface CampaignFinancials {
  total_budget: string
  total_spent: string
  total_revenue: string
  budget_remaining: string
  budget_utilization: string
  subcampaign_count: number
  active_subcampaigns: number
}

export interface PlatformPerformance {
  platform: Platform
  platform_display: string
  total_budget: string
  total_spent: string
  total_revenue: string
  avg_budget: string
  avg_spent: string
  subcampaign_count: number
}

export interface PortfolioFinancials {
  totals: {
    budget: string
    spent: string
    revenue: string
    remaining: string
    campaign_count: number
  }
  by_platform?: PlatformPerformance[]
  by_month?: Array<{
    month: string
    budget: string
    spent: string
    campaign_count: number
  }>
}

// ============================================
// UI CONFIG
// ============================================

export const CAMPAIGN_STATUS_CONFIG: Record<CampaignStatus, {
  label: string
  emoji: string
  color: string
  bgColor: string
}> = {
  lead: {
    label: 'Lead',
    emoji: '🎯',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  negotiation: {
    label: 'Negotiation',
    emoji: '🤝',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  confirmed: {
    label: 'Confirmed',
    emoji: '✅',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  active: {
    label: 'Active',
    emoji: '🚀',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  completed: {
    label: 'Completed',
    emoji: '🏁',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
  },
  lost: {
    label: 'Lost',
    emoji: '❌',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  cancelled: {
    label: 'Cancelled',
    emoji: '🚫',
    color: 'text-gray-500 dark:text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-800/30',
  },
}

export const SUBCAMPAIGN_STATUS_CONFIG: Record<SubCampaignStatus, {
  label: string
  emoji: string
  color: string
  bgColor: string
}> = {
  draft: {
    label: 'Draft',
    emoji: '📝',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
  },
  active: {
    label: 'Active',
    emoji: '🟢',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  paused: {
    label: 'Paused',
    emoji: '⏸️',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  completed: {
    label: 'Completed',
    emoji: '✅',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  cancelled: {
    label: 'Cancelled',
    emoji: '🚫',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
}

export const PLATFORM_CONFIG: Record<Platform, {
  label: string
  emoji: string
  color: string
}> = {
  meta: { label: 'Meta (FB/IG)', emoji: '📱', color: 'text-blue-600' },
  google: { label: 'Google Ads', emoji: '🔍', color: 'text-blue-500' },
  tiktok: { label: 'TikTok', emoji: '🎭', color: 'text-black dark:text-white' },
  youtube: { label: 'YouTube', emoji: '▶️', color: 'text-red-500' },
  spotify: { label: 'Spotify', emoji: '🎵', color: 'text-green-500' },
  apple_music: { label: 'Apple Music', emoji: '🍎', color: 'text-pink-500' },
  amazon_music: { label: 'Amazon Music', emoji: '🛒', color: 'text-orange-500' },
  deezer: { label: 'Deezer', emoji: '🎧', color: 'text-purple-500' },
  soundcloud: { label: 'SoundCloud', emoji: '☁️', color: 'text-orange-400' },
  twitter: { label: 'X/Twitter', emoji: '𝕏', color: 'text-black dark:text-white' },
  linkedin: { label: 'LinkedIn', emoji: '💼', color: 'text-blue-700' },
  snapchat: { label: 'Snapchat', emoji: '👻', color: 'text-yellow-400' },
  pinterest: { label: 'Pinterest', emoji: '📌', color: 'text-red-600' },
  other: { label: 'Other', emoji: '📱', color: 'text-gray-500' },
}

export const SERVICE_TYPE_CONFIG: Record<ServiceType, {
  label: string
  emoji: string
}> = {
  ppc: { label: 'PPC Advertising', emoji: '💰' },
  influencer: { label: 'Influencer Marketing', emoji: '⭐' },
  ugc: { label: 'UGC Content', emoji: '📱' },
  dsp: { label: 'DSP Distribution', emoji: '📊' },
  playlist: { label: 'Playlist Pitching', emoji: '📋' },
  pr: { label: 'PR Campaign', emoji: '📰' },
  social: { label: 'Social Media Management', emoji: '📢' },
  content: { label: 'Content Creation', emoji: '🎬' },
  radio: { label: 'Radio Plugging', emoji: '📻' },
  seo: { label: 'SEO Optimization', emoji: '🔍' },
  email: { label: 'Email Marketing', emoji: '📧' },
  other: { label: 'Other', emoji: '📦' },
}

export const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, {
  label: string
  emoji: string
  description: string
}> = {
  service_fee: {
    label: 'Service Fee',
    emoji: '💰',
    description: 'Fixed service fee pricing',
  },
  revenue_share: {
    label: 'Revenue Share',
    emoji: '📊',
    description: 'Split based on generated revenue',
  },
}

export const CAMPAIGN_TYPE_CONFIG: Record<CampaignType, {
  label: string
  emoji: string
  description: string
}> = {
  internal: {
    label: 'Internal',
    emoji: '🏠',
    description: 'For our label artists',
  },
  external: {
    label: 'External',
    emoji: '🌍',
    description: 'Client campaigns',
  },
}

// Status flow for UI
export const STATUS_FLOW: CampaignStatus[] = [
  'lead',
  'negotiation',
  'confirmed',
  'active',
  'completed',
]

// Active statuses
export const ACTIVE_STATUSES: CampaignStatus[] = ['confirmed', 'active']

// ============================================
// BACKWARDS COMPATIBILITY EXPORTS
// These are used by existing components
// ============================================

/** @deprecated Use CAMPAIGN_STATUS_CONFIG instead */
export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  lead: 'Lead',
  negotiation: 'Negotiation',
  confirmed: 'Confirmed',
  active: 'Active',
  completed: 'Completed',
  lost: 'Lost',
  cancelled: 'Cancelled',
}

/** @deprecated Use CAMPAIGN_STATUS_CONFIG instead */
export const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, string> = {
  lead: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  negotiation: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  active: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  lost: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800/30 dark:text-gray-500',
}

/** @deprecated Use CAMPAIGN_TYPE_CONFIG instead */
export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  internal: 'Internal',
  external: 'External',
}

/** @deprecated Use CAMPAIGN_TYPE_CONFIG instead */
export const CAMPAIGN_TYPE_COLORS: Record<CampaignType, string> = {
  internal: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  external: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
}

/** Assignment role labels */
export const CAMPAIGN_ASSIGNMENT_ROLE_LABELS: Record<CampaignAssignmentRole, string> = {
  lead: 'Lead',
  support: 'Support',
  observer: 'Observer',
}

/** Pricing/Payment model labels */
export const PRICING_MODEL_LABELS: Record<PaymentMethod, string> = {
  service_fee: 'Service Fee',
  revenue_share: 'Revenue Share',
}

// Invoice types (for backwards compatibility with digital module)
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
}

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800/30 dark:text-gray-500',
}

// ============================================
// KPI CONFIGURATION
// ============================================

export const KPI_CONFIG: Record<KPIType, {
  label: string
  unit: KPIUnit
  category: 'performance' | 'social' | 'content' | 'music' | 'revenue'
  icon?: string
}> = {
  // Performance
  impressions: { label: 'Impressions', unit: 'count', category: 'performance' },
  clicks: { label: 'Clicks', unit: 'count', category: 'performance' },
  ctr: { label: 'CTR', unit: 'percent', category: 'performance' },
  conversions: { label: 'Conversions', unit: 'count', category: 'performance' },
  conversion_rate: { label: 'Conversion Rate', unit: 'percent', category: 'performance' },
  cpc: { label: 'CPC', unit: 'currency', category: 'performance' },
  cpa: { label: 'CPA', unit: 'currency', category: 'performance' },
  // Social
  reach: { label: 'Reach', unit: 'count', category: 'social' },
  engagement: { label: 'Engagement', unit: 'count', category: 'social' },
  engagement_rate: { label: 'Engagement Rate', unit: 'percent', category: 'social' },
  followers_gained: { label: 'Followers Gained', unit: 'count', category: 'social' },
  // Content
  views: { label: 'Views', unit: 'count', category: 'content' },
  watch_time_minutes: { label: 'Watch Time', unit: 'minutes', category: 'content' },
  shares: { label: 'Shares', unit: 'count', category: 'content' },
  comments: { label: 'Comments', unit: 'count', category: 'content' },
  likes: { label: 'Likes', unit: 'count', category: 'content' },
  // Music
  streams: { label: 'Streams', unit: 'count', category: 'music' },
  downloads: { label: 'Downloads', unit: 'count', category: 'music' },
  playlist_adds: { label: 'Playlist Adds', unit: 'count', category: 'music' },
  radio_plays: { label: 'Radio Plays', unit: 'count', category: 'music' },
  // Revenue
  revenue: { label: 'Revenue', unit: 'currency', category: 'revenue' },
  roi: { label: 'ROI', unit: 'percent', category: 'revenue' },
  cost: { label: 'Cost', unit: 'currency', category: 'revenue' },
}

export const KPI_CATEGORIES = [
  { key: 'performance', label: 'Performance', kpis: ['impressions', 'clicks', 'ctr', 'conversions', 'conversion_rate', 'cpc', 'cpa'] as KPIType[] },
  { key: 'social', label: 'Social', kpis: ['reach', 'engagement', 'engagement_rate', 'followers_gained'] as KPIType[] },
  { key: 'content', label: 'Content', kpis: ['views', 'watch_time_minutes', 'shares', 'comments', 'likes'] as KPIType[] },
  { key: 'music', label: 'Music', kpis: ['streams', 'downloads', 'playlist_adds', 'radio_plays'] as KPIType[] },
  { key: 'revenue', label: 'Revenue', kpis: ['revenue', 'roi', 'cost'] as KPIType[] },
]

// Platform-specific default KPIs
export const PLATFORM_DEFAULT_KPIS: Partial<Record<Platform, KPIType[]>> = {
  spotify: ['streams', 'playlist_adds', 'followers_gained'],
  apple_music: ['streams', 'downloads', 'playlist_adds'],
  youtube: ['views', 'watch_time_minutes', 'engagement'],
  tiktok: ['views', 'engagement', 'shares'],
  meta: ['impressions', 'reach', 'engagement', 'clicks'],
  google: ['impressions', 'clicks', 'conversions', 'cpc'],
}
