// Project Types - Matches backend/projects/models

export type ProjectType =
  | 'release'
  | 'song'
  | 'campaign'
  | 'opportunity'
  | 'contract'
  | 'distribution_deal'
  | 'ops'
  | 'custom';

export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'archived';

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'review' | 'done' | 'cancelled';

export type TaskPriority = 1 | 2 | 3 | 4;

export type ProjectMemberRole =
  | 'lead'
  | 'manager'
  | 'member'
  | 'stakeholder'
  | 'marketing_manager'
  | 'digital_manager'
  | 'publishing_manager'
  | 'label_manager'
  | 'sales_manager';

// Config objects for UI display
export const PROJECT_TYPE_CONFIG: Record<ProjectType, { label: string; icon: string; color: string }> = {
  release: { label: 'Release', icon: '🎬', color: 'bg-purple-500' },
  song: { label: 'Song', icon: '🎵', color: 'bg-blue-500' },
  campaign: { label: 'Campaign', icon: '📢', color: 'bg-orange-500' },
  opportunity: { label: 'Opportunity', icon: '💰', color: 'bg-green-500' },
  contract: { label: 'Contract', icon: '📝', color: 'bg-red-500' },
  distribution_deal: { label: 'Distribution', icon: '🌐', color: 'bg-teal-500' },
  ops: { label: 'Operations', icon: '⚙️', color: 'bg-gray-500' },
  custom: { label: 'Custom', icon: '📋', color: 'bg-pink-500' },
};

export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bgColor: string }> = {
  active: { label: 'Active', color: 'text-green-600', bgColor: 'bg-green-500/10' },
  on_hold: { label: 'On Hold', color: 'text-yellow-600', bgColor: 'bg-yellow-500/10' },
  completed: { label: 'Completed', color: 'text-blue-600', bgColor: 'bg-blue-500/10' },
  archived: { label: 'Archived', color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
};

export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: 'To Do', color: 'bg-gray-500' },
  in_progress: { label: 'In Progress', color: 'bg-blue-500' },
  blocked: { label: 'Blocked', color: 'bg-red-500' },
  review: { label: 'In Review', color: 'bg-purple-500' },
  done: { label: 'Done', color: 'bg-green-500' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-400' },
};

export const TASK_PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  1: { label: 'Low', color: 'bg-gray-400' },
  2: { label: 'Medium', color: 'bg-blue-500' },
  3: { label: 'High', color: 'bg-orange-500' },
  4: { label: 'Urgent', color: 'bg-red-500' },
};

// User minimal type (matches backend serializer)
export interface UserMinimal {
  id: number;
  email: string;
  full_name: string;
}

// Department minimal type
export interface DepartmentMinimal {
  id: number;
  name: string;
}

// Project Member
export interface ProjectMember {
  id: number;
  user: UserMinimal;
  role: ProjectMemberRole;
  role_display: string;
  added_by: number | null;
  added_at: string;
}

// Project List Item (from ProjectListSerializer)
export interface Project {
  id: number;
  name: string;
  description: string;
  project_type: ProjectType;
  project_type_display: string;
  status: ProjectStatus;
  status_display: string;
  department: number;
  created_by: UserMinimal;
  start_date: string | null;
  end_date: string | null;
  task_count: number;
  completed_task_count: number;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
  // Note: metadata is only in detail view, but we include for pinning support
  metadata?: Record<string, unknown>;
}

// Project Detail (from ProjectDetailSerializer)
export interface ProjectDetail extends Project {
  template: number | null;
  metadata: Record<string, unknown>;
  members: ProjectMember[];
}

// Project Create payload
export interface ProjectCreatePayload {
  name: string;
  description?: string;
  project_type: ProjectType;
  status?: ProjectStatus;
  department: number;
  start_date?: string | null;
  end_date?: string | null;
  template?: number | null;
  metadata?: Record<string, unknown>;
}

// Project Update payload (partial)
export interface ProjectUpdatePayload {
  name?: string;
  description?: string;
  project_type?: ProjectType;
  status?: ProjectStatus;
  department?: number;
  start_date?: string | null;
  end_date?: string | null;
  metadata?: Record<string, unknown>;
}

// Task (from TaskListSerializer)
export interface ProjectTask {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  status_display: string;
  priority: TaskPriority;
  priority_display: string;
  project: number;
  project_name: string;
  department: number;
  due_date: string | null;
  assigned_to: UserMinimal | null;
  created_by: UserMinimal;
  parent_task: number | null;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
}

// Task Detail (from TaskDetailSerializer)
export interface ProjectTaskDetail extends ProjectTask {
  estimated_hours: string | null;
  actual_hours: string | null;
  metadata: Record<string, unknown>;
  is_blocked: boolean;
  subtasks: ProjectTask[];
  started_at: string | null;
  completed_at: string | null;
}

// Task Create payload
export interface ProjectTaskCreatePayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  project: number;
  department?: number;
  due_date?: string | null;
  assigned_to_id?: number | null;
  parent_task?: number | null;
  estimated_hours?: string | null;
  metadata?: Record<string, unknown>;
}

// Recurring Task Template (from RecurringTaskTemplateSerializer)
export interface RecurringTaskTemplate {
  id: number;
  project: number;
  title: string;
  description: string;
  recurrence_rule: string; // RRULE format
  default_priority: TaskPriority;
  assigned_to: UserMinimal | null;
  assigned_role: string;
  department: number | null;
  is_active: boolean;
  last_generated_at: string | null;
  next_generation_at: string | null;
  created_by: UserMinimal;
  created_at: string;
  updated_at: string;
}

// Recurring Template Create payload
export interface RecurringTaskTemplateCreatePayload {
  project: number;
  title: string;
  description?: string;
  recurrence_rule: string;
  default_priority?: TaskPriority;
  assigned_to_id?: number | null;
  assigned_role?: string;
  department?: number | null;
  is_active?: boolean;
}

// Project Template (from ProjectTemplateListSerializer)
export interface ProjectTemplate {
  id: number;
  name: string;
  description: string;
  project_type: ProjectType;
  department: number | null;
  is_active: boolean;
  task_count: number;
  created_by: UserMinimal;
  created_at: string;
  updated_at: string;
}

// Filter params for projects
export interface ProjectFilterParams {
  status?: ProjectStatus;
  project_type?: ProjectType;
  department?: number;
  created_by?: number;
  search?: string;
  ordering?: string;
}

// Filter params for tasks
export interface ProjectTaskFilterParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  project?: number;
  department?: number;
  assigned_to?: number;
  parent_task?: number | null;
  search?: string;
  ordering?: string;
}

// Stats for dashboard
export interface ProjectStats {
  total: number;
  active: number;
  on_hold: number;
  completed: number;
  archived: number;
  overdue_tasks: number;
}

// Add member payload
export interface AddMemberPayload {
  user_id: number;
  role: ProjectMemberRole;
}

// Create from template payload
export interface CreateFromTemplatePayload {
  name: string;
  description?: string;
  department_id?: number;
  start_date?: string;
}
