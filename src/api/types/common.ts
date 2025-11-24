/**
 * Common API Type Definitions
 * Shared types used across all API endpoints
 */

import { ErrorCode, ApiErrorDetail } from '@/lib/error-types';

/**
 * Standard API Response Wrapper
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp?: string;
}

/**
 * Paginated API Response
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * API Error Response
 */
export interface ApiErrorResponse {
  message: string;
  code?: ErrorCode;
  detail?: string;
  errors?: ApiErrorDetail[];
  non_field_errors?: string[];
  status?: number;
}

/**
 * Query Parameters for List Endpoints
 */
export interface ListQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

/**
 * Filter Parameters (extend as needed)
 */
export interface FilterParams extends ListQueryParams {
  [key: string]: string | number | boolean | undefined | null;
}

/**
 * Entity ID types
 */
export type EntityId = number | string;

/**
 * ISO Date string
 */
export type ISODateString = string;

/**
 * Money amount (stored as string for precision)
 */
export type MoneyString = string;

/**
 * Audit fields (common to many models)
 */
export interface AuditFields {
  created_at: ISODateString;
  updated_at: ISODateString;
  created_by?: number;
  updated_by?: number;
}

/**
 * Soft delete fields
 */
export interface SoftDeleteFields {
  is_deleted: boolean;
  deleted_at?: ISODateString;
  deleted_by?: number;
}

/**
 * Status field (common pattern)
 */
export interface WithStatus<T extends string = string> {
  status: T;
  status_display?: string;
}

/**
 * Named entity (common pattern)
 */
export interface NamedEntity {
  id: number;
  name: string;
  display_name?: string;
}

/**
 * File upload response
 */
export interface FileUploadResponse {
  url: string;
  key?: string;
  filename: string;
  size: number;
  content_type: string;
}

/**
 * Mutation response (for create/update operations)
 */
export interface MutationResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ApiErrorDetail[];
}

/**
 * Bulk operation response
 */
export interface BulkOperationResponse {
  success_count: number;
  failure_count: number;
  errors?: Array<{
    id: EntityId;
    error: string;
  }>;
}
