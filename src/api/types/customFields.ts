/**
 * Custom Fields Types
 *
 * Project-level custom field definitions with task-level values.
 * Field definitions are shared across all tasks in a project.
 */

export type CustomFieldType = 'text' | 'number' | 'single_select' | 'date' | 'checkbox';

// =============================================================================
// Project-Level Custom Field Definitions
// =============================================================================

export interface ProjectCustomFieldDefinition {
  id: number;
  project: number;
  field_name: string;
  field_type: CustomFieldType;
  select_options?: string[];
  default_value?: string;
  is_required: boolean;
  show_in_table: boolean;
  column_width: number;
  order: number;
  is_archived: boolean;
  created_by?: number;
  created_by_detail?: {
    id: number;
    email: string;
    full_name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateProjectCustomFieldDefinitionDto {
  field_name: string;
  field_type: CustomFieldType;
  select_options?: string[];
  default_value?: string;
  is_required?: boolean;
  show_in_table?: boolean;
  column_width?: number;
  order?: number;
}

export interface UpdateProjectCustomFieldDefinitionDto {
  field_name?: string;
  select_options?: string[];
  default_value?: string;
  is_required?: boolean;
  show_in_table?: boolean;
  column_width?: number;
  order?: number;
  is_archived?: boolean;
}

// =============================================================================
// Task Custom Field Values (for project-level fields)
// =============================================================================

export interface TaskCustomFieldValue {
  id: number;
  task: number;
  field_definition: number;
  field_definition_detail?: ProjectCustomFieldDefinition;
  value: string | null;
  display_value: string | number | boolean | null;
  updated_at: string;
  updated_by?: number;
}

export interface UpdateTaskCustomFieldValueDto {
  value: string | null;
}

export interface BulkUpdateTaskCustomFieldValueDto {
  field_definition_id: number;
  value: string | null;
}

export interface TaskFieldWithDefinition {
  definition: ProjectCustomFieldDefinition;
  value: TaskCustomFieldValue | null;
  display_value: string | number | boolean | null;
}

// =============================================================================
// Legacy Task-Level Custom Fields (deprecated, kept for migration)
// =============================================================================

export interface TaskCustomField {
  id: number;
  task: number;
  field_name: string;
  field_type: CustomFieldType;
  select_options?: string[];
  display_value: string | number | null;
  order: number;
  created_by?: number;
  created_by_detail?: {
    id: number;
    email: string;
    full_name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateCustomFieldDto {
  task: number;
  field_name: string;
  field_type: CustomFieldType;
  select_options?: string[];
  value?: string | number;
  order?: number;
}

export interface UpdateCustomFieldDto {
  field_name?: string;
  select_options?: string[];
  value?: string | number;
  order?: number;
}
