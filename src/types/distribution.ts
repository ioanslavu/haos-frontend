import { Entity } from './entity'

// Minimal types for distribution catalog items
export interface Recording {
  id: number
  title: string
  type: string
  status: string
  isrc?: string
  work_title?: string
}

export interface Release {
  id: number
  title: string
  type: string
  status: string
  upc?: string
  release_date?: string
}

export type DealType = 'artist' | 'label' | 'aggregator' | 'company'
export type DealStatus = 'active' | 'in_negotiation' | 'expired'
export type DistributionStatus = 'pending' | 'live' | 'taken_down'
export type Platform = 'meta' | 'google' | 'tiktok' | 'spotify' | 'youtube' | 'apple_music' | 'deezer' | 'amazon_music' | 'soundcloud' | 'twitter' | 'linkedin' | 'snapchat' | 'pinterest' | 'multi'

export type DistributionAssignmentRole = 'lead' | 'support' | 'observer'

export interface DistributionAssignment {
  id: number
  distribution: number
  user: number
  user_email: string
  user_name: string
  user_first_name: string
  user_last_name: string
  role: DistributionAssignmentRole
  role_display: string
  assigned_at: string
  assigned_by?: number
  assigned_by_name?: string
}

export interface Distribution {
  id: number
  entity: Entity
  deal_type: DealType
  deal_type_display: string
  includes_dsps: boolean
  includes_youtube: boolean
  deal_status: DealStatus
  deal_status_display: string
  contract?: {
    id: number
    contract_number: string
    title: string
  } | null
  global_revenue_share_percentage: string
  signing_date: string
  track_count: number
  total_revenue: string
  contact_person?: {
    id: number
    name: string
    email: string
  } | null
  notes: string
  special_terms: string
  department?: {
    id: number
    name: string
  } | null
  department_display: string
  catalog_items?: DistributionCatalogItem[]
  songs?: DistributionSong[]
  songs_count?: number
  assignments?: DistributionAssignment[]
  created_at: string
  updated_at: string
  created_by?: number
  created_by_name?: string
}

export interface DistributionCatalogItem {
  id: number
  distribution: number
  recording?: Recording | null
  release?: Release | null
  catalog_item_title: string
  catalog_item_type: 'recording' | 'release'
  platforms: Platform[]
  platforms_display: string[]
  individual_revenue_share?: string | null
  effective_revenue_share: string
  distribution_status: DistributionStatus
  distribution_status_display: string
  release_date?: string | null
  total_revenue: string
  notes: string
  added_at: string
  revenue_reports?: DistributionRevenueReport[]
}

export interface DistributionRevenueReport {
  id: number
  catalog_item: number
  platform: Platform
  platform_display: string
  reporting_period: string
  revenue_amount: string
  currency: string
  streams?: number | null
  downloads?: number | null
  notes: string
  created_at: string
  updated_at: string
  created_by?: number
  created_by_name?: string
}

export interface DistributionFormData {
  entity: number
  deal_type?: DealType
  includes_dsps?: boolean
  includes_youtube?: boolean
  deal_status: DealStatus
  contract?: number | null
  department?: number | null
  global_revenue_share_percentage: string
  signing_date: string
  contact_person?: number | null
  notes?: string
  special_terms?: string
}

export const DISTRIBUTION_ASSIGNMENT_ROLE_LABELS: Record<DistributionAssignmentRole, string> = {
  lead: 'Lead',
  support: 'Support',
  observer: 'Observer',
}

export interface DistributionCatalogItemFormData {
  distribution?: number
  recording?: number | null
  release?: number | null
  platforms: Platform[]
  individual_revenue_share?: string | null
  distribution_status: DistributionStatus
  release_date?: string | null
  notes?: string
}

// ============================================
// DISTRIBUTION SONG (External Songs)
// ============================================

export interface DistributionSong {
  id: number
  distribution: number
  song_name: string
  artist_name: string
  isrc?: string
  release_date?: string | null
  client_type?: string
  mentions?: string
  platforms: Platform[]
  platforms_display: string[]
  individual_revenue_share?: string | null
  effective_revenue_share: string
  distribution_status: DistributionStatus
  distribution_status_display: string
  contract?: number | null
  contract_number?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface DistributionSongFormData {
  song_name: string
  artist_name: string
  isrc?: string
  release_date?: string | null
  client_type?: string
  mentions?: string
  platforms?: Platform[]
  individual_revenue_share?: string | null
  distribution_status?: DistributionStatus
  contract?: number | null
  notes?: string
}

export interface DistributionRevenueReportFormData {
  catalog_item?: number
  platform: Platform
  reporting_period: string
  revenue_amount: string
  currency?: string
  streams?: number | null
  downloads?: number | null
  notes?: string
}

export interface DistributionFilters {
  entity?: number
  deal_type?: DealType[]
  deal_status?: DealStatus[]
  department?: number
  signing_date_after?: string
  signing_date_before?: string
  search?: string
}

export interface DistributionStats {
  total_distributions: number
  by_status: Record<DealStatus, number>
  by_deal_type: Record<DealType, number>
  total_tracks: number
}

// ============================================
// UI CONFIG
// ============================================

export const DEAL_STATUS_CONFIG: Record<DealStatus, {
  label: string
  emoji: string
  color: string
  bgColor: string
  dotColor: string
}> = {
  active: {
    label: 'Active',
    emoji: '🟢',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    dotColor: 'bg-green-500',
  },
  in_negotiation: {
    label: 'In Negotiation',
    emoji: '🤝',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    dotColor: 'bg-yellow-500',
  },
  expired: {
    label: 'Expired',
    emoji: '⏰',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800/30',
    dotColor: 'bg-gray-500',
  },
}

export const DEAL_TYPE_CONFIG: Record<DealType, {
  label: string
  emoji: string
  color: string
  bgColor: string
  description: string
}> = {
  artist: {
    label: 'Artist',
    emoji: '🎤',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    description: 'Direct artist distribution deal',
  },
  label: {
    label: 'Label',
    emoji: '🏷️',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    description: 'Label distribution deal',
  },
  aggregator: {
    label: 'Aggregator',
    emoji: '🔀',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    description: 'Distribution through aggregator',
  },
  company: {
    label: 'Company',
    emoji: '🏢',
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-900/30',
    description: 'Company distribution deal',
  },
}

export const DISTRIBUTION_STATUS_CONFIG: Record<DistributionStatus, {
  label: string
  emoji: string
  color: string
  bgColor: string
}> = {
  pending: {
    label: 'Pending',
    emoji: '⏳',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  live: {
    label: 'Live',
    emoji: '🟢',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  taken_down: {
    label: 'Taken Down',
    emoji: '🔴',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
}

// Active statuses for filtering
export const ACTIVE_DEAL_STATUSES: DealStatus[] = ['active', 'in_negotiation']

// Platform labels (icons come from @/lib/platform-icons)
export const DISTRIBUTION_PLATFORM_LABELS: Record<Platform, string> = {
  meta: 'Meta (FB/IG)',
  google: 'Google',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  spotify: 'Spotify',
  apple_music: 'Apple Music',
  amazon_music: 'Amazon Music',
  deezer: 'Deezer',
  soundcloud: 'SoundCloud',
  twitter: 'X/Twitter',
  linkedin: 'LinkedIn',
  snapchat: 'Snapchat',
  pinterest: 'Pinterest',
  multi: 'Multi-Platform',
}
