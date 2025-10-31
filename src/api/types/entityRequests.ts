// Entity Change Request types

// Paginated response from DRF
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type EntityRequestType = 'edit' | 'delete';

export type EntityRequestStatus = 'pending' | 'approved' | 'rejected';

export const ENTITY_REQUEST_TYPE_CHOICES: readonly EntityRequestType[] = ['edit', 'delete'] as const;

export const ENTITY_REQUEST_STATUS_CHOICES: readonly EntityRequestStatus[] = [
  'pending',
  'approved',
  'rejected',
] as const;

export interface EntityRequestUserDetail {
  id: number;
  email: string;
  full_name: string;
}

export interface EntityRequestEntityDetail {
  id: number;
  display_name: string;
  kind: 'PF' | 'PJ';
}

export interface EntityChangeRequest {
  id: number;
  entity: number;
  entity_detail?: EntityRequestEntityDetail;
  request_type: EntityRequestType;
  requested_by: number;
  requested_by_detail?: EntityRequestUserDetail;
  message: string;
  status: EntityRequestStatus;
  reviewed_by?: number;
  reviewed_by_detail?: EntityRequestUserDetail;
  reviewed_at?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EntityChangeRequestCreateInput {
  entity: number;
  request_type: EntityRequestType;
  message: string;
}

// Display helpers
export const ENTITY_REQUEST_TYPE_LABELS: Record<EntityRequestType, string> = {
  edit: 'Edit Request',
  delete: 'Delete Request',
};

export const ENTITY_REQUEST_STATUS_LABELS: Record<EntityRequestStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const ENTITY_REQUEST_STATUS_COLORS: Record<EntityRequestStatus, string> = {
  pending: 'yellow',
  approved: 'green',
  rejected: 'red',
};
