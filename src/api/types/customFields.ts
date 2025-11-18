/**
 * Custom Fields Types
 *
 * Ad-hoc custom fields that users can add to tasks.
 * Each task can have its own unique set of custom fields.
 */

export type CustomFieldType = 'text' | 'number' | 'single_select';

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
