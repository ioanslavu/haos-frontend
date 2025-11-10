/**
 * Alert Configuration Types
 *
 * These types map to the backend AlertConfiguration model
 * for configurable song workflow alerts.
 */

export type AlertType = 'overdue' | 'deadline_approaching' | 'release_approaching' | 'checklist_incomplete';

export type AlertPriority = 'info' | 'important' | 'urgent';

export interface AlertConfiguration {
  id: number;
  alert_type: AlertType;
  alert_type_display: string;
  enabled: boolean;
  days_threshold: number | null;
  schedule_description: string;
  notify_assigned_user: boolean;
  notify_department_managers: boolean;
  notify_song_creator: boolean;
  priority: AlertPriority;
  priority_display: string;
  title_template: string;
  message_template: string;
  created_at: string;
  updated_at: string;
  updated_by: number | null;
  updated_by_name: string | null;
}

export interface AlertConfigurationUpdate {
  enabled?: boolean;
  days_threshold?: number | null;
  notify_assigned_user?: boolean;
  notify_department_managers?: boolean;
  notify_song_creator?: boolean;
  priority?: AlertPriority;
  title_template?: string;
  message_template?: string;
}

export interface TemplateVariable {
  name: string;
  description: string;
  example: string;
}

// Template variables available for alert messages
export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  { name: '{song_title}', description: 'Song title', example: 'My New Song' },
  { name: '{stage}', description: 'Current workflow stage', example: 'label_recording' },
  { name: '{deadline}', description: 'Stage deadline date', example: '2025-11-15' },
  { name: '{assigned_user}', description: 'Assigned user name', example: 'John Doe' },
  { name: '{release_date}', description: 'Target release date', example: '2025-12-01' },
  { name: '{item_name}', description: 'Checklist item name', example: 'Master audio uploaded' },
  { name: '{days}', description: 'Days until/past threshold', example: '2' },
];
