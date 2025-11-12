// Types for Camps feature

export interface Artist {
  id: number;
  display_name: string;
  profile_picture: string | null;
}

export interface CampStudio {
  id: number;
  name: string;
  location: string;
  city: string;
  country: string;
  hours: number | null;
  sessions: number | null;
  order: number;
  internal_artists: Artist[];
  external_artists: Artist[];
  created_at: string;
  updated_at: string;
}

export interface Camp {
  id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  studios?: CampStudio[];
  studios_count: number;
  department: {
    id: number;
    name: string;
    code: string;
  };
  created_by: {
    id: number;
    email: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface CampListItem {
  id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  studios_count: number;
  department: {
    id: number;
    name: string;
    code: string;
  };
  created_by: {
    id: number;
    email: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface StudioFormData {
  name: string;
  location?: string;
  city?: string;
  country?: string;
  hours?: number | null;
  sessions?: number | null;
  order?: number;
  internal_artist_ids?: number[];
  external_artist_ids?: number[];
}

export interface CampCreateInput {
  name: string;
  start_date?: string | null;
  end_date?: string | null;
  status?: 'draft' | 'active' | 'completed' | 'cancelled';
  studios?: StudioFormData[];
}

export interface CampUpdateInput extends Partial<CampCreateInput> {
  id: number;
}

export interface CampFilters {
  search?: string;
  status?: 'draft' | 'active' | 'completed' | 'cancelled' | '';
  time_filter?: 'upcoming' | 'past' | 'all' | '';
  start_date_after?: string;
  start_date_before?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
