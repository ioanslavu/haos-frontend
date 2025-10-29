import { Entity } from './entity'
import { ContactPerson } from './contact'

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

export interface Campaign {
  id: number
  campaign_name: string
  client: Entity
  artist: Entity
  brand: Entity
  contact_person?: ContactPerson | null
  value: string  // Decimal as string
  status: CampaignStatus
  confirmed_at: string | null  // ISO datetime
  notes: string
  handlers?: CampaignHandler[]
  created_by: number
  created_by_name: string | null
  created_at: string  // ISO datetime
  updated_at: string  // ISO datetime
}

export interface CampaignFormData {
  campaign_name: string
  client: number
  artist: number
  brand: number
  contact_person?: number | null
  value: string
  status: CampaignStatus
  confirmed_at?: string
  notes?: string
  handlers?: CampaignHandler[]
}

export interface CampaignFilters {
  status?: CampaignStatus | CampaignStatus[]
  client?: number
  artist?: number
  brand?: number
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
