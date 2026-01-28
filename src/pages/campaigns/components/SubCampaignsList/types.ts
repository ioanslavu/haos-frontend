/**
 * Types and constants for SubCampaignsList components
 */

import type { SubCampaign, Platform, ServiceType, PaymentMethod, KPIType, KPITarget } from '@/types/campaign'

// Platforms in display order
export const PLATFORMS: Platform[] = [
  'spotify', 'apple_music', 'youtube', 'tiktok', 'meta',
  'google', 'amazon_music', 'deezer', 'soundcloud',
  'twitter', 'snapchat', 'pinterest', 'linkedin', 'other',
]

// Service type groups for better organization
export const SERVICE_TYPE_GROUPS = [
  { label: 'Ads', types: ['ppc', 'dsp'] as ServiceType[] },
  { label: 'Content', types: ['content', 'ugc', 'social'] as ServiceType[] },
  { label: 'Promo', types: ['influencer', 'playlist', 'pr', 'radio'] as ServiceType[] },
  { label: 'Marketing', types: ['email', 'seo', 'other'] as ServiceType[] },
]

// Editable financial field type
export type EditableField = 'client_value' | 'budget' | 'spent' | 'internal_cost' | 'revenue_generated' | 'revenue_share_percentage' | null

// Props interfaces
export interface SubCampaignsListProps {
  campaignId: number
  campaignName: string
  showAddForm?: boolean
  onAddFormClose?: () => void
}

export interface SubCampaignCardProps {
  subcampaign: SubCampaign
  campaignId: number
  campaignName: string
  isExpanded: boolean
  onToggleExpand: () => void
}

export interface InlineAddPlatformProps {
  campaignId: number
  onClose?: () => void
}

export interface KPISectionProps {
  subcampaign: SubCampaign
  campaignId: number
}

export interface DeleteSubCampaignDialogProps {
  campaignId: number
  subcampaignId: number
  platformLabel: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export interface SubCampaignFinancialsProps {
  subcampaign: SubCampaign
  campaignId: number
  editingField: EditableField
  setEditingField: (field: EditableField) => void
  canViewSensitiveData: boolean
}

// Re-export types used across components
export type { SubCampaign, Platform, ServiceType, PaymentMethod, KPIType, KPITarget }
