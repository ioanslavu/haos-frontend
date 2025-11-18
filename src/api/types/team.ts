// Team member (UserProfile data from backend)
export interface TeamMember {
  id: number; // UserProfile ID - use this for add/remove operations
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  profile_picture: string | null;
}

// Department details
export interface DepartmentDetail {
  id: number;
  code: string;
  name: string;
}

// Team interface matching backend TeamSerializer
export interface Team {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  department: number;
  department_detail: DepartmentDetail;
  members: TeamMember[];
  member_count: number;
  has_members: boolean;
  created_by: number | null;
  created_by_email: string | null;
  created_at: string;
  updated_at: string;
}

// Input for creating a team
export interface TeamCreateInput {
  name: string;
  description?: string;
  member_ids?: number[]; // UserProfile IDs
  is_active?: boolean;
}

// Input for updating a team
export interface TeamUpdateInput {
  name?: string;
  description?: string;
  member_ids?: number[]; // UserProfile IDs - replaces all members
  is_active?: boolean;
}

// Input for adding/removing members
export interface TeamMemberActionInput {
  user_profile_ids: number[];
}

// Filter parameters for team list
export interface TeamFilters {
  include_inactive?: boolean;
  assignable?: boolean;
}

// Paginated response
export interface TeamListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Team[];
}
