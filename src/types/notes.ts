// Types for Notes feature

export interface Tag {
  id: number;
  name: string;
  color: string;
  note_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: number;
  title: string;
  content: any; // Tiptap JSON content
  content_text?: string;
  tags: Tag[];
  is_pinned: boolean;
  is_archived: boolean;
  color?: string | null;
  created_at: string;
  updated_at: string;
  last_accessed: string;
}

export interface NoteListItem {
  id: number;
  title: string;
  preview: string;
  tags: Tag[];
  is_pinned: boolean;
  is_archived: boolean;
  color?: string | null;
  created_at: string;
  updated_at: string;
  last_accessed: string;
}

export interface NoteCreateInput {
  title: string;
  content?: any;
  tag_ids?: number[];
  is_pinned?: boolean;
  is_archived?: boolean;
  color?: string | null;
}

export interface NoteUpdateInput extends Partial<NoteCreateInput> {
  tag_ids?: number[];
}

export interface NoteStatistics {
  total_notes: number;
  total_archived: number;
  total_pinned: number;
  notes_this_week: number;
  by_tag: Array<{
    tag_id: number;
    tag_name: string;
    tag_color: string;
    count: number;
  }>;
  recent_notes: NoteListItem[];
}

export interface SearchResults {
  results: NoteListItem[];
  query: string;
}
