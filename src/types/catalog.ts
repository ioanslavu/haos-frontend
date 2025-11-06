// Catalog Types (Work, Recording, Release, Splits)

export interface Entity {
  id: number;
  display_name: string;
  type: 'person' | 'organization';
}

export interface Split {
  id: number;
  scope: 'work' | 'recording';
  scope_display: string;
  object_id: number;
  object_title: string;
  entity: number;
  entity_name: string;
  entity_details?: Entity;
  right_type: 'writer' | 'publisher' | 'master';
  right_type_display: string;
  share: string; // Decimal as string for precision
  source?: string;
  is_locked: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

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

export interface Identifier {
  id: number;
  owner_type: string;
  owner_id: number;
  scheme: string;
  value: string;
  created_at: string;
}

export interface Credit {
  id: number;
  scope: 'work' | 'recording';
  scope_display: string;
  object_id: number;
  object_title: string;
  entity: number;
  entity_name: string;
  entity_details?: Entity;
  role: string;
  role_display: string;
  credited_as?: string;
  share_kind: string;
  share_kind_display: string;
  share_value?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

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
  has_complete_master_splits?: boolean;
  release_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Release {
  id: number;
  title: string;
  type: string;
  status: string;
  upc?: string;
  release_date?: string;
  created_at: string;
  updated_at: string;
}
