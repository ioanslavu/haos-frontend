export type UserRole =
  | 'guest'
  | 'administrator'
  | 'digital_manager'
  | 'digital_employee'
  | 'sales_manager'
  | 'sales_employee';

export type Department = 'digital' | 'sales' | null;

export interface UserProfile {
  id: number;
  role: UserRole;
  department: Department;
  profile_picture: string | null;
  setup_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  date_joined: string;
  profile: UserProfile;
  role: UserRole;
  department: Department;
  profile_picture: string | null;
  setup_completed: boolean;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  profile_picture?: File;
  setup_completed?: boolean;
}

export interface UpdateRoleRequest {
  role: UserRole;
  department?: Department; // Optional - auto-assigned based on role by backend
}

export type DepartmentRequestStatus = 'pending' | 'approved' | 'rejected';

export interface DepartmentRequest {
  id: number;
  user: number;
  user_email: string;
  user_name: string;
  requested_department: 'digital' | 'sales';
  status: DepartmentRequestStatus;
  message: string;
  reviewed_by: number | null;
  reviewed_by_email: string | null;
  reviewed_at: string | null;
  rejection_reason: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDepartmentRequestRequest {
  requested_department: 'digital' | 'sales';
  message?: string;
}

export interface ReviewDepartmentRequestRequest {
  status: 'approved' | 'rejected';
  rejection_reason?: string;
}
