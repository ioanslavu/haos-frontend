// Task related types
import type { TaskCustomField } from './customFields';

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'review' | 'done' | 'cancelled';

export type TaskPriority = 1 | 2 | 3 | 4;

export type TaskType =
  | 'general'
  | 'follow_up'
  | 'review'
  | 'approval'
  // Digital department tasks
  | 'campaign_setup'
  | 'content_creation'
  | 'performance_review'
  | 'report_delivery'
  | 'ad_optimization'
  | 'platform_setup'
  // Sales tasks
  | 'proposal'
  | 'negotiation'
  | 'contract_prep'
  | 'closing'
  // Creative tasks
  | 'recording'
  | 'mixing'
  | 'video_production'
  | 'artwork'
  // Publishing tasks
  | 'registration'
  | 'royalty_collection'
  | 'statement_review';

export type TaskTag = 'urgent' | 'client_requested' | 'internal' | 'recurring' | 'blocked_external';

// Choice arrays for forms and validation
export const TASK_STATUS_CHOICES: readonly TaskStatus[] = [
  'todo',
  'in_progress',
  'blocked',
  'review',
  'done',
  'cancelled'
] as const;

export const TASK_PRIORITY_CHOICES: readonly TaskPriority[] = [1, 2, 3, 4] as const;

export const TASK_TAG_CHOICES: readonly TaskTag[] = [
  'urgent',
  'client_requested',
  'internal',
  'recurring',
  'blocked_external'
] as const;

export const TASK_TYPE_CHOICES: readonly TaskType[] = [
  'general',
  'follow_up',
  'review',
  'approval',
  'campaign_setup',
  'content_creation',
  'performance_review',
  'report_delivery',
  'ad_optimization',
  'platform_setup',
  'proposal',
  'negotiation',
  'contract_prep',
  'closing',
  'recording',
  'mixing',
  'video_production',
  'artwork',
  'registration',
  'royalty_collection',
  'statement_review',
] as const;

export interface TaskUserDetail {
  id: number;
  email: string;
  full_name: string;
}

export type TaskAssignmentRole = 'assignee' | 'reviewer' | 'observer';

export interface TaskAssignment {
  id?: number;
  user: number;
  user_email?: string;
  user_name?: string;
  role: TaskAssignmentRole;
  role_display?: string;
  assigned_at?: string;
  assigned_by?: number;
  assigned_by_email?: string;
}

export interface TaskCampaignDetail {
  id: number;
  name: string;
  status: string;
  value: string;
}

export interface TaskEntityDetail {
  id: number;
  display_name: string;
  kind: 'PF' | 'PJ';
}

export interface TaskContractDetail {
  id: number;
  title: string;
  contract_number: string;
  status: string;
}

export interface TaskSongDetail {
  id: number;
  title: string;
  stage: string;
  artist?: string;
}

export interface TaskWorkDetail {
  id: number;
  title: string;
  iswc?: string;
  writers?: string[];
}

export interface TaskRecordingDetail {
  id: number;
  title: string;
  isrc?: string;
  artist?: string;
}

export interface TaskOpportunityDetail {
  id: number;
  title: string;
  stage: string;
  value?: string;
}

export interface TaskDeliverableDetail {
  id: number;
  deliverable_type: string;
  status: string;
  due_date?: string;
}

export interface TaskChecklistItemDetail {
  id: number;
  name: string;
  checklist_name: string;
  is_complete: boolean;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  task_type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  tag?: TaskTag;

  // Relationships
  campaign?: number;
  campaign_detail?: TaskCampaignDetail;
  entity?: number;
  entity_detail?: TaskEntityDetail;
  contract?: number;
  contract_detail?: TaskContractDetail;

  // Universal task system entity relationships
  song?: number;
  song_detail?: TaskSongDetail;
  work?: number;
  work_detail?: TaskWorkDetail;
  recording?: number;
  recording_detail?: TaskRecordingDetail;
  opportunity?: number;
  opportunity_detail?: TaskOpportunityDetail;
  deliverable?: number;
  deliverable_detail?: TaskDeliverableDetail;
  checklist_item?: number;
  checklist_item_detail?: TaskChecklistItemDetail;
  source_stage?: string;

  // Assignment (multiple users)
  assignments?: TaskAssignment[];
  assigned_to_users?: number[];  // Helper: array of user IDs
  assigned_to_users_detail?: TaskUserDetail[];  // Helper: array of user objects
  created_by?: number;
  created_by_detail?: TaskUserDetail;
  department?: number;
  department_name?: string;

  // Timeline
  due_date?: string;
  reminder_date?: string;
  follow_up_reminder_sent?: boolean;
  started_at?: string;
  completed_at?: string;

  // Dependencies
  parent_task?: number;
  blocks_tasks?: number[];
  subtasks_count?: number;

  // Time tracking
  estimated_hours?: number;
  actual_hours?: number;

  // Notes (TipTap JSON format)
  notes?: any;
  mentioned_users_detail?: {
    id: number;
    email: string;
    username: string;
    full_name: string;
  }[];

  // Custom fields
  custom_fields?: TaskCustomField[];

  // Computed fields
  is_overdue: boolean;
  is_blocked: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface TaskCreateInput {
  title: string;
  description?: string;
  task_type?: TaskType;
  status?: TaskStatus;
  priority?: TaskPriority;
  tag?: TaskTag;
  campaign?: number;
  entity?: number;
  contract?: number;
  assigned_user_ids?: number[];
  department?: number;
  due_date?: string;
  reminder_date?: string;
  parent_task?: number;
  blocks_tasks?: number[];
  estimated_hours?: number;
  notes?: any; // Changed from string to any (TipTap JSON)
}

export interface TaskUpdateInput extends Partial<TaskCreateInput> {
  actual_hours?: number;
}

export interface TaskStats {
  total: number;
  by_status: Record<TaskStatus, number>;
  by_priority: Record<string, number>;
  overdue: number;
  due_today: number;
  due_this_week: number;
}

// Task priority display helpers
export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  1: 'Low',
  2: 'Normal',
  3: 'High',
  4: 'Urgent',
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  1: 'gray',
  2: 'blue',
  3: 'orange',
  4: 'red',
};

// Task status display helpers
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  review: 'In Review',
  done: 'Done',
  cancelled: 'Cancelled',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'gray',
  in_progress: 'blue',
  blocked: 'red',
  review: 'orange',
  done: 'green',
  cancelled: 'gray',
};

// Task type display helpers
export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  // General
  general: 'General Task',
  follow_up: 'Follow-up',
  review: 'Review',
  approval: 'Approval Required',
  // Digital
  campaign_setup: 'Campaign Setup',
  content_creation: 'Content Creation',
  performance_review: 'Performance Review',
  report_delivery: 'Report Delivery',
  ad_optimization: 'Ad Optimization',
  platform_setup: 'Platform Setup',
  // Sales
  proposal: 'Proposal Creation',
  negotiation: 'Negotiation',
  contract_prep: 'Contract Preparation',
  closing: 'Deal Closing',
  // Creative
  recording: 'Recording Session',
  mixing: 'Mixing/Mastering',
  video_production: 'Video Production',
  artwork: 'Artwork Design',
  // Publishing
  registration: 'Work Registration',
  royalty_collection: 'Royalty Collection',
  statement_review: 'Statement Review',
};

export const TASK_TYPE_CATEGORIES = {
  general: ['general', 'follow_up', 'review', 'approval'],
  digital: [
    'campaign_setup',
    'content_creation',
    'performance_review',
    'report_delivery',
    'ad_optimization',
    'platform_setup',
  ],
  sales: ['proposal', 'negotiation', 'contract_prep', 'closing'],
  creative: ['recording', 'mixing', 'video_production', 'artwork'],
  publishing: ['registration', 'royalty_collection', 'statement_review'],
};

// Task tag display helpers
export const TASK_TAG_LABELS: Record<TaskTag, string> = {
  urgent: 'Urgent',
  client_requested: 'Client Requested',
  internal: 'Internal',
  recurring: 'Recurring',
  blocked_external: 'Blocked by External',
};

export const TASK_TAG_COLORS: Record<TaskTag, string> = {
  urgent: 'red',
  client_requested: 'purple',
  internal: 'blue',
  recurring: 'green',
  blocked_external: 'orange',
};