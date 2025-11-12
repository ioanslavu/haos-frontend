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

export type DealType = 'artist' | 'label' | 'aggregator'
export type DealStatus = 'active' | 'in_negotiation' | 'expired'
export type DistributionStatus = 'pending' | 'live' | 'taken_down'
export type Platform = 'meta' | 'google' | 'tiktok' | 'spotify' | 'youtube' | 'apple_music' | 'deezer' | 'amazon_music' | 'soundcloud' | 'twitter' | 'linkedin' | 'snapchat' | 'pinterest' | 'multi'

export interface Distribution {
  id: number
  entity: Entity
  deal_type: DealType
  deal_type_display: string
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
  deal_status: DealStatus
  contract?: number | null
  department?: number | null
  global_revenue_share_percentage: string
  signing_date: string
  contact_person?: number | null
  notes?: string
  special_terms?: string
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
