import { User } from '@/stores/authStore';

// List params
export interface UserListParams {
  page?: number;
  page_size?: number;
  department?: string;
  role?: string;
  is_active?: boolean;
  is_locked?: boolean;
  search?: string; // For @mentions search
}

export interface UserListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}

// Permissions
export interface UserPermission {
  id: number;
  codename: string;
  name: string;
  source: 'group' | 'direct';
  group?: string;
}

export interface UserPermissionsResponse {
  user: User;
  permissions: {
    from_groups: UserPermission[];
    direct: UserPermission[];
    is_superuser: boolean;
  };
}

// Audit log
export interface AuditLogEntry {
  id: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  timestamp: string;
  actor: string | null;
  changes: Record<string, { old: unknown; new: unknown }>;
  remote_addr: string;
}

export interface AuditLogResponse {
  user: User;
  audit_log: AuditLogEntry[];
  count: number;
}

// Re-export user types that are defined elsewhere
export type {
  UpdateProfileRequest,
  UpdateRoleRequest,
  DepartmentRequest,
  CreateDepartmentRequestRequest,
  ReviewDepartmentRequestRequest,
} from '@/types/user';
