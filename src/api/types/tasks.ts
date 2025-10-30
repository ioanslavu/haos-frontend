// Task related types

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

export interface TaskUserDetail {
  id: number;
  email: string;
  full_name: string;
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

export interface Task {
  id: number;
  title: string;
  description?: string;
  task_type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;

  // Relationships
  campaign?: number;
  campaign_detail?: TaskCampaignDetail;
  entity?: number;
  entity_detail?: TaskEntityDetail;
  contract?: number;
  contract_detail?: TaskContractDetail;

  // Assignment
  assigned_to?: number;
  assigned_to_detail?: TaskUserDetail;
  created_by?: number;
  created_by_detail?: TaskUserDetail;
  department?: number;
  department_name?: string;

  // Timeline
  due_date?: string;
  reminder_date?: string;
  started_at?: string;
  completed_at?: string;

  // Dependencies
  parent_task?: number;
  blocks_tasks?: number[];
  subtasks_count?: number;

  // Time tracking
  estimated_hours?: number;
  actual_hours?: number;

  // Metadata
  metadata?: Record<string, any>;
  notes?: string;

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
  campaign?: number;
  entity?: number;
  contract?: number;
  assigned_to?: number;
  department?: number;
  due_date?: string;
  reminder_date?: string;
  parent_task?: number;
  blocks_tasks?: number[];
  estimated_hours?: number;
  metadata?: Record<string, any>;
  notes?: string;
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