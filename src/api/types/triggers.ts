// Trigger types for Universal Task System

export type TriggerEntityType = 'song' | 'work' | 'recording' | 'opportunity' | 'deliverable';

export type ButtonStyle =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'outline';

export interface ManualTrigger {
  id: number;
  name: string;
  button_label: string;
  button_style: ButtonStyle;
  button_style_display?: string;
  entity_type: TriggerEntityType;
  context: string;
  action_config: Record<string, any>;
  visible_departments: string[];
  is_active: boolean;
}

export interface FlowTrigger {
  id: number;
  name: string;
  entity_type: TriggerEntityType;
  trigger_type: 'on_create' | 'on_update' | 'on_field_change' | 'on_stage_change';
  conditions: Record<string, any>;
  action_config: Record<string, any>;
  is_active: boolean;
  description?: string;
}

export interface ExecuteTriggerInput {
  entity_id: number;
  context_data?: Record<string, any>;
}

// Display helpers
export const BUTTON_STYLE_LABELS: Record<ButtonStyle, string> = {
  primary: 'Primary',
  secondary: 'Secondary',
  success: 'Success',
  danger: 'Danger',
  warning: 'Warning',
  outline: 'Outline',
};

export const ENTITY_TYPE_LABELS: Record<TriggerEntityType, string> = {
  song: 'Song',
  work: 'Work',
  recording: 'Recording',
  opportunity: 'Opportunity',
  deliverable: 'Deliverable',
};
