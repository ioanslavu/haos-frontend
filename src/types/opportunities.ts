/**
 * TypeScript types for Artist Sales - Unified Opportunities System
 */

// === ENUMS & CONSTANTS ===

export type OpportunityStage =
  | 'brief'
  | 'qualified'
  | 'shortlist'
  | 'proposal_draft'
  | 'proposal_sent'
  | 'negotiation'
  | 'contract_prep'
  | 'contract_sent'
  | 'won'
  | 'executing'
  | 'completed'
  | 'closed_lost';

export type OpportunityPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskType = 'artist_outreach' | 'proposal_creation' | 'contract_prep' | 'client_meeting' | 'deliverable_review' | 'follow_up' | 'other';

export type ArtistRole = 'main' | 'featured' | 'guest' | 'ensemble';
export type ArtistContractStatus = 'pending' | 'sent' | 'signed' | 'active';

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
  | 'other';

export type DeliverableStatus = 'planned' | 'in_progress' | 'submitted' | 'approved' | 'revision_requested' | 'completed';
export type ActivityType = 'created' | 'stage_changed' | 'field_updated' | 'comment_added' | 'task_created' | 'task_completed' | 'artist_added' | 'artist_removed' | 'file_uploaded' | 'email_sent' | 'meeting_logged' | 'proposal_sent' | 'contract_sent' | 'won' | 'lost';

export const STAGE_CONFIG: Record<OpportunityStage, { label: string; emoji: string; color: string }> = {
  brief: { label: 'Brief Intake', emoji: '📥', color: 'bg-gray-500' },
  qualified: { label: 'Qualified', emoji: '✅', color: 'bg-green-500' },
  shortlist: { label: 'Artist Shortlist', emoji: '🎤', color: 'bg-blue-500' },
  proposal_draft: { label: 'Proposal Draft', emoji: '📄', color: 'bg-purple-500' },
  proposal_sent: { label: 'Proposal Sent', emoji: '📧', color: 'bg-orange-500' },
  negotiation: { label: 'Negotiation', emoji: '💬', color: 'bg-yellow-500' },
  contract_prep: { label: 'Contract Prep', emoji: '📝', color: 'bg-indigo-500' },
  contract_sent: { label: 'Contract Sent', emoji: '✍️', color: 'bg-pink-500' },
  won: { label: 'Won', emoji: '🎯', color: 'bg-green-600' },
  executing: { label: 'Executing', emoji: '🚀', color: 'bg-blue-600' },
  completed: { label: 'Completed', emoji: '✨', color: 'bg-teal-600' },
  closed_lost: { label: 'Lost', emoji: '❌', color: 'bg-red-600' },
};

export const PRIORITY_CONFIG: Record<OpportunityPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-gray-500' },
  medium: { label: 'Medium', color: 'bg-blue-500' },
  high: { label: 'High', color: 'bg-orange-500' },
  urgent: { label: 'Urgent', color: 'bg-red-500' },
};

export const DELIVERABLE_TYPE_CONFIG: Record<DeliverableType, { label: string; emoji: string }> = {
  ig_post: { label: 'Instagram Post', emoji: '📸' },
  ig_story: { label: 'Instagram Story', emoji: '📱' },
  ig_reel: { label: 'Instagram Reel', emoji: '🎬' },
  tiktok_video: { label: 'TikTok Video', emoji: '🎵' },
  youtube_video: { label: 'YouTube Video', emoji: '▶️' },
  youtube_short: { label: 'YouTube Short', emoji: '📹' },
  tvc: { label: 'TV Commercial', emoji: '📺' },
  radio_spot: { label: 'Radio Spot', emoji: '📻' },
  event: { label: 'Event Appearance', emoji: '🎤' },
  ooh: { label: 'Out of Home (OOH)', emoji: '🏙️' },
  billboard: { label: 'Billboard', emoji: '🪧' },
  packaging: { label: 'Product Packaging', emoji: '📦' },
  print_ad: { label: 'Print Advertisement', emoji: '📰' },
  digital_banner: { label: 'Digital Banner', emoji: '💻' },
  podcast: { label: 'Podcast', emoji: '🎙️' },
  livestream: { label: 'Livestream', emoji: '🔴' },
  other: { label: 'Other', emoji: '📄' },
};

// === NESTED TYPES ===

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

export interface Entity {
  id: number;
  display_name: string;
  kind: string; // 'PF' = Physical Person, 'PJ' = Legal Entity
}

export interface ContactPerson {
  id: number;
  full_name: string;
  email?: string;
  phone?: string;
}

export interface Department {
  id: number;
  name: string;
}

// === MAIN TYPES ===

export interface Opportunity {
  id: number;
  opportunity_number: string;
  title: string;
  stage: OpportunityStage;
  stage_display: string;
  probability: number;
  priority: OpportunityPriority;
  priority_display: string;

  // Relationships
  account: Entity;
  contact_person?: ContactPerson;
  owner: User;
  team?: Department;
  created_by?: User;

  // Financial
  estimated_value?: string;
  currency: string;
  expected_close_date?: string;
  actual_close_date?: string;

  // Brief fields
  campaign_objectives?: string;
  target_audience?: string;
  channels?: string[];
  brand_category?: string;
  budget_range_min?: string;
  budget_range_max?: string;
  campaign_start_date?: string;
  campaign_end_date?: string;

  // Proposal fields
  proposal_version?: number;
  proposal_history?: any[];
  fee_gross?: string;
  agency_fee?: string;
  discounts?: string;
  fee_net?: string;
  proposal_sent_date?: string;
  proposal_valid_until?: string;

  // Contract fields
  contract_number?: string;
  po_number?: string;
  contract_signed_date?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  contract_file?: string;

  // Execution
  deliverable_pack?: number;
  usage_terms?: number;

  // Lost
  lost_reason?: string;
  lost_date?: string;
  competitor?: string;

  // Metadata
  notes?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;

  // Related objects (for detail view)
  artists?: OpportunityArtist[];
  tasks?: OpportunityTask[];
  deliverables?: OpportunityDeliverable[];

  // Annotated fields (for list view)
  artists_count?: number;
  tasks_count?: number;
  active_tasks_count?: number;
}

export interface OpportunityArtist {
  id: number;
  opportunity: number;
  artist: Entity;
  role: ArtistRole;
  proposed_fee?: string;
  confirmed_fee?: string;
  contract_status: ArtistContractStatus;
  signed_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OpportunityTask {
  id: number;
  opportunity: number;
  title: string;
  description?: string;
  task_type: TaskType;
  assigned_to?: User;
  assigned_by?: User;
  due_date?: string;
  priority: TaskPriority;
  status: TaskStatus;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OpportunityActivity {
  id: number;
  opportunity: number;
  user?: User;
  activity_type: ActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface OpportunityComment {
  id: number;
  opportunity: number;
  user?: User;
  comment: string;
  is_internal: boolean;
  mentions?: number[];
  created_at: string;
  updated_at: string;
}

export interface OpportunityDeliverable {
  id: number;
  opportunity: number;
  deliverable_type: DeliverableType;
  quantity: number;
  description?: string;
  due_date?: string;
  status: DeliverableStatus;
  asset_url?: string;
  kpi_target?: Record<string, any>;
  kpi_actual?: Record<string, any>;
  cost_center?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// === API REQUEST/RESPONSE TYPES ===

export interface OpportunityListParams {
  page?: number;
  page_size?: number;
  stage?: string; // Can be comma-separated: "brief,qualified"
  stage__in?: OpportunityStage[];
  priority?: string;
  priority__in?: OpportunityPriority[];
  owner?: number;
  team?: number;
  account?: number;
  currency?: string;
  expected_close_date_after?: string;
  expected_close_date_before?: string;
  estimated_value_min?: number;
  estimated_value_max?: number;
  search?: string;
  ordering?: string;
}

export interface OpportunityCreateInput {
  title: string;
  stage?: OpportunityStage;
  priority?: OpportunityPriority;
  account: number;
  contact_person?: number;
  owner: number;
  team?: number;
  estimated_value?: string;
  currency?: string;
  expected_close_date?: string;
  campaign_objectives?: string;
  target_audience?: string;
  brand_category?: string;
  budget_range_min?: string;
  budget_range_max?: string;
  notes?: string;
  tags?: string[];
}

export interface OpportunityUpdateInput extends Partial<OpportunityCreateInput> {
  stage?: OpportunityStage;
  probability?: number;
  // All other fields can be updated
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface BulkUpdateInput {
  ids: number[];
  updates: Partial<OpportunityUpdateInput>;
}

export interface AdvanceStageInput {
  stage: OpportunityStage;
}

export interface MarkLostInput {
  lost_reason: string;
  competitor?: string;
}
