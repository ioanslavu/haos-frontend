// Song Workflow Types

export type SongStage =
  | 'draft'
  | 'publishing'
  | 'label_recording'
  | 'marketing_assets'
  | 'label_review'
  | 'ready_for_digital'
  | 'digital_distribution'
  | 'released'
  | 'archived';

export type StageStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';

export interface SongStageStatus {
  id: number;
  stage: SongStage;
  stage_display: string;
  status: StageStatus;
  status_display: string;
  started_at?: string;
  completed_at?: string;
  blocked_reason?: string;
  notes?: string;
  days_in_status?: number;
  created_at: string;
  updated_at: string;
}

export interface SongArtist {
  id: number;
  artist_id: number;
  artist_name: string;
  artist_display_name: string;
  role: 'featured' | 'remixer' | 'producer' | 'composer' | 'featuring';
  role_display: string;
  order: number;
  created_at: string;
}

export interface ArtistInfo {
  id: number;
  name: string;
  role: string;
  is_primary: boolean;
  order: number;
}

export interface Song {
  id: number;
  title: string;
  artist?: {
    id: number;
    display_name: string;
  };
  genre?: string;
  language?: string;
  current_stage?: SongStage;
  target_release_date?: string;
  actual_release_date?: string;
  checklist_progress: number; // 0-100
  is_overdue: boolean;
  days_in_current_stage: number;
  created_at: string;
  updated_at: string;
  created_by?: {
    id: number;
    email: string;
    full_name: string;
  };
  work?: {
    id: number;
    iswc?: string;
  };
  recording?: {
    id: number;
    isrc?: string;
  };
  release?: {
    id: number;
    upc?: string;
  };
  // Featured artists fields
  featured_artists?: SongArtist[];
  all_artists?: ArtistInfo[];
  display_artists?: string;
  // Stage statuses (for parallel workflows)
  stage_statuses?: SongStageStatus[];
}

export interface SongChecklistItem {
  id: number;
  song: number;
  recording?: number | null;
  recording_title?: string | null;
  stage: SongStage;
  category: string;
  item_name: string;
  description: string;
  is_complete: boolean;
  required: boolean;
  validation_type: string;
  validation_rule: Record<string, any>;
  help_text?: string;
  help_link?: string;
  asset_url?: string;
  order: number;
  completed_at?: string;
  completed_by?: number | null;
  completed_by_name?: string | null;
  assigned_to?: number | null;
  assigned_to_name?: string | null;
  is_blocker: boolean;
  depends_on?: number | null;
  template_item_detail?: {
    id: number;
    has_task_inputs: boolean;
    requires_review: boolean;
    quantity: number;
    task_count: number;
    completed_count: number;
    pending_review_count: number;
  } | null;
}

export interface SongStageTransition {
  id: number;
  song: number;
  from_stage: SongStage;
  to_stage: SongStage;
  notes?: string;
  created_at: string;
  created_by: {
    id: number;
    email: string;
    full_name: string;
  };
}

export type AssetType =
  | 'cover_art'
  | 'back_cover'
  | 'press_photo'
  | 'promotional_graphic'
  | 'social_media_asset'
  | 'marketing_copy'
  | 'other';

export type AssetReviewStatus = 'pending' | 'approved' | 'rejected' | 'revision_requested';

export interface SongAsset {
  id: number;
  song: number;
  asset_type: AssetType;
  title: string;
  description?: string;
  google_drive_url: string;
  file_extension?: string;
  file_size?: number;
  review_status: AssetReviewStatus;
  review_notes?: string;
  reviewed_at?: string;
  reviewed_by?: {
    id: number;
    email: string;
    full_name: string;
  };
  created_at: string;
  created_by: {
    id: number;
    email: string;
    full_name: string;
  };
}

export interface SongNote {
  id: number;
  song: number;
  content: string;
  is_important: boolean;
  created_at: string;
  created_by: {
    id: number;
    email: string;
    full_name: string;
  };
}

export type AlertType = 'stage_transition' | 'deadline_approaching' | 'asset_review' | 'checklist_complete' | 'other';
export type AlertPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SongAlert {
  id: number;
  song: number;
  alert_type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface SongStats {
  total_songs: number;
  by_stage: Record<SongStage, number>;
  overdue_count: number;
  avg_days_per_stage: Record<SongStage, number>;
  my_queue_count: number;
}

// Request/Response types
export interface SongFilters {
  stage?: SongStage;
  search?: string;
  is_overdue?: boolean;
  created_by?: number;
  page?: number;
  page_size?: number;
}

export interface SongCreate {
  title: string;
  artist?: number; // Entity ID
  genre?: string;
  language?: string;
  target_release_date?: string;
}

export interface SongUpdate {
  title?: string;
  artist?: number; // Entity ID
  genre?: string;
  language?: string;
  target_release_date?: string;
}

export interface TransitionRequest {
  target_stage: SongStage;
  notes?: string;
}

export interface AssetCreate {
  asset_type: AssetType;
  title: string;
  description?: string;
  google_drive_url: string;
}

export interface AssetReviewRequest {
  action: 'approve' | 'reject' | 'revision_requested';
  notes?: string;
}

export interface NoteCreate {
  content: string;
  is_important?: boolean;
}

export interface ArchiveRequest {
  reason: string;
}

// Pagination response
export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

// Recording and Credits types
export interface Recording {
  id: number;
  title: string;
  type: string;
  status: string;
  work?: number;
  work_title?: string;
  isrc?: string;
  identifiers?: Identifier[];
  duration_seconds?: number;
  formatted_duration?: string;
  bpm?: number;
  key?: string;
  recording_date?: string;
  studio?: string;
  version?: string;
  derived_from?: number;
  derived_from_title?: string;
  notes?: string;
  assets?: RecordingAsset[];
  has_complete_master_splits?: boolean;
  release_count?: number;
  created_at: string;
  updated_at: string;
  credits?: Credit[] | SimplifiedCredit[];
  splits?: Split[] | null;
}

export interface Identifier {
  id: number;
  scheme: string;
  value: string;
  owner_type: string;
  owner_id: number;
}

export interface RecordingAsset {
  id: number;
  recording: number;
  kind: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  formatted_file_size?: string;
  mime_type?: string;
  checksum?: string;
  sample_rate?: number;
  bit_depth?: number;
  bitrate?: number;
  resolution?: string;
  frame_rate?: number;
  is_master: boolean;
  is_public: boolean;
  uploaded_by?: number;
  uploaded_by_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Credit {
  id: number;
  entity: {
    id: number;
    name: string;
    type: string;
  };
  role: string;
  scope: string;
  object_id: number;
  created_at: string;
}

export interface SimplifiedCredit {
  entity_name: string;
  role: string;
}

export interface Split {
  id: number;
  entity: {
    id: number;
    name: string;
    type: string;
  };
  right_type: string;
  share: number;
  scope: string;
  object_id: number;
  territory?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

// Release and Publication types
export type PublicationPlatform =
  | 'spotify_track'
  | 'spotify_album'
  | 'apple_music_track'
  | 'apple_music_album'
  | 'youtube_video'
  | 'youtube_music'
  | 'amazon_music_track'
  | 'tiktok_sound'
  | 'deezer_track'
  | 'tidal_track'
  | 'soundcloud_track';

export type PublicationStatus = 'planned' | 'submitted' | 'processing' | 'live' | 'private' | 'blocked' | 'taken_down' | 'expired';

export interface Publication {
  id: number;
  platform: PublicationPlatform;
  url?: string;
  status: PublicationStatus;
  external_id?: string;
  territory: string;
  published_at?: string;
  scheduled_for?: string;
  created_at: string;
  updated_at: string;
}

export interface ReleaseDetails {
  id: number;
  title: string;
  type: string;
  status: string;
  upc?: string;
  release_date?: string;
  catalog_number?: string;
  label_name?: string;
  artwork_url?: string;
  description?: string;
  notes?: string;
  track_count?: number;
  total_duration?: number;
  formatted_total_duration?: string;
  created_at: string;
  updated_at: string;
}

// Work types (for song context)
export interface Work {
  id: number;
  title: string;
  alternate_titles?: string[];
  iswc?: string;
  identifiers?: Identifier[];
  language?: string;
  genre?: string;
  sub_genre?: string;
  year_composed?: number;
  translation_of?: number;
  translation_of_title?: string;
  adaptation_of?: number;
  adaptation_of_title?: string;
  lyrics?: string;
  notes?: string;
  recordings_count?: number;
  has_complete_publishing_splits?: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkWithSplits extends Work {
  writer_splits?: Split[] | null;
  publisher_splits?: Split[] | null;
  can_view_splits: boolean;
  can_edit: boolean;
}
