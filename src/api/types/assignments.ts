export interface UserMinimal {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  profile_picture: string | null;
}

export interface ArtistMinimal {
  id: number;
  display_name: string;
  stage_name: string | null;
  rate_tier: 'A' | 'B' | 'C' | null;
  profile_photo: string | null;
}

export interface SocialMediaManagerAssignment {
  id: number;
  social_media_manager: number;
  social_media_manager_detail: UserMinimal;
  artist: number;
  artist_detail: ArtistMinimal;
  assigned_by: number | null;
  assigned_by_detail: UserMinimal | null;
  department: number;
  department_name: string;
  is_active: boolean;
  notes: string;
  metadata: Record<string, any>;
  assigned_at: string;
  updated_at: string;
}

export interface AssignmentCreateInput {
  social_media_manager: number;
  artist: number;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface AssignmentUpdateInput {
  notes?: string;
  metadata?: Record<string, any>;
  is_active?: boolean;
}

export interface TeamMember extends UserMinimal {
  role: string;
  role_detail?: {
    id: number;
    code: string;
    name: string;
    level: number;
  };
  department: string;
  department_detail?: {
    id: number;
    code: string;
    name: string;
  };
  assigned_artists_count?: number;
  assigned_artists?: ArtistMinimal[];
}

export interface AssignableArtist extends ArtistMinimal {
  managers_count: number;
  is_assigned?: boolean;
}
