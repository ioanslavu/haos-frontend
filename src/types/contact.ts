// Contact Person Types

export type ContactRole =
  | 'marketing'
  | 'pr'
  | 'playlist_curator'
  | 'radio'
  | 'a&r'
  | 'manager'
  | 'booking_agent'
  | 'venue'
  | 'promoter'
  | 'distributor'
  | 'publisher'
  | 'sync_supervisor'
  | 'producer'
  | 'songwriter'
  | 'engineer'
  | 'photographer'
  | 'designer'
  | 'brand'
  | 'influencer'
  | 'retailer'
  | 'legal'
  | 'finance'
  | 'operations'
  | 'admin'
  | 'fan'
  | 'other'

export type EngagementStage =
  | 'lead'
  | 'prospect'
  | 'active'
  | 'partner'
  | 'dormant'
  | 'lost'
  | 'blacklisted'

export type ContactSentiment =
  | 'advocate'
  | 'supportive'
  | 'approachable'
  | 'friendly'
  | 'professional'
  | 'neutral'
  | 'reserved'
  | 'distant'
  | 'awkward'
  | 'friction'
  | 'hostile'
  | 'blocked'

export interface ContactEmail {
  id?: number
  email: string
  label?: string
  is_primary: boolean
}

export interface ContactPhone {
  id?: number
  phone: string
  label?: string
  is_primary: boolean
}

export interface ContactPerson {
  id: number
  entity: number
  name: string
  role?: ContactRole
  role_display?: string
  engagement_stage?: EngagementStage
  engagement_stage_display?: string
  sentiment?: ContactSentiment
  sentiment_display?: string
  notes?: string
  emails: ContactEmail[]
  phones: ContactPhone[]
  created_at: string
  updated_at: string
}

export interface ContactPersonFormData {
  entity: number
  name: string
  role?: ContactRole
  engagement_stage?: EngagementStage
  sentiment?: ContactSentiment
  notes?: string
  emails: ContactEmail[]
  phones: ContactPhone[]
}

// Labels and colors for display
export const CONTACT_ROLE_LABELS: Record<ContactRole, string> = {
  marketing: 'Marketing / Growth',
  pr: 'PR / Publicist / Press',
  playlist_curator: 'Playlist curator / DSP editor',
  radio: 'Radio DJ / Programmer',
  'a&r': 'A&R',
  manager: 'Artist manager',
  booking_agent: 'Booking agent / Agent',
  venue: 'Venue / Booker',
  promoter: 'Promoter / Event promoter',
  distributor: 'Distributor / DSP aggregator',
  publisher: 'Publisher / Sync rights',
  sync_supervisor: 'Sync / Music supervisor (film/TV/ads)',
  producer: 'Producer / Beatmaker',
  songwriter: 'Songwriter / Composer / Lyricist',
  engineer: 'Recording / Mixing / Mastering engineer',
  photographer: 'Photographer / Videographer',
  designer: 'Graphic / Artwork designer',
  brand: 'Brand / Sponsor / Partnership rep',
  influencer: 'Influencer / Creator / KOL',
  retailer: 'Retail / Merch / Store contact',
  legal: 'Lawyer / Contracts / Rights',
  finance: 'Accountant / Finance / Royalty admin',
  operations: 'Ops / Logistics / Warehouse / Supplier',
  admin: 'Admin / Coordinator / Personal assistant',
  fan: 'Fan / Superfan (direct-to-fan ops)',
  other: 'Other / Misc',
}

export const ENGAGEMENT_STAGE_LABELS: Record<EngagementStage, string> = {
  lead: 'Lead (new, unqualified)',
  prospect: 'Prospect (in talks / negotiating)',
  active: 'Active (current project / engagement)',
  partner: 'Partner (formal long-term partner)',
  dormant: 'Dormant (no recent activity)',
  lost: 'Lost (opportunity lost)',
  blacklisted: 'Blacklisted / Do not contact',
}

export const CONTACT_SENTIMENT_LABELS: Record<ContactSentiment, string> = {
  advocate: 'Advocate / Champion (promotes you)',
  supportive: 'Supportive / Helpful',
  approachable: 'Approachable (easy to reach)',
  friendly: 'Friendly / Warm',
  professional: 'Professional / Neutral-positive',
  neutral: 'Neutral / No strong feeling',
  reserved: 'Reserved / Polite but distant',
  distant: 'Distant / Low engagement',
  awkward: 'Awkward / Tricky rapport',
  friction: 'Friction / Frequent disagreements',
  hostile: 'Hostile / Negative',
  blocked: 'Blocked / Legal / Do not contact',
}

// Color schemes for engagement stages
export const ENGAGEMENT_STAGE_COLORS: Record<EngagementStage, string> = {
  lead: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  prospect: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  partner: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  dormant: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  blacklisted: 'bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-100',
}

// Color schemes for sentiments (positive -> negative gradient)
export const CONTACT_SENTIMENT_COLORS: Record<ContactSentiment, string> = {
  advocate: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  supportive: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  approachable: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  friendly: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  professional: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  reserved: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
  distant: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  awkward: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  friction: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  hostile: 'bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-100',
  blocked: 'bg-red-300 text-red-950 dark:bg-red-950 dark:text-red-50',
}
