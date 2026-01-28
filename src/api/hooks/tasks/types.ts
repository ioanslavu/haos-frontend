// Re-export types from the main types file for convenience
export type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskStats,
  TaskStatus,
  TaskPriority,
  TaskType,
  TaskTag,
  TaskAssignment,
  TaskAssignmentRole,
  TaskUserDetail,
  TaskTeamDetail,
  TaskDomainInfo,
  TaskCampaignDetail,
  TaskEntityDetail,
  TaskContractDetail,
  TaskSongDetail,
  TaskWorkDetail,
  TaskRecordingDetail,
  TaskOpportunityDetail,
  TaskDeliverableDetail,
  TaskChecklistItemDetail,
} from '@/api/types/tasks';

// Task filter params used by hooks
export interface TaskFilterParams {
  status?: string | string[];
  priority?: number;
  task_type?: string;
  assigned_to__in?: string; // Filter by multiple user IDs (comma-separated)
  department?: number;
  campaign?: number;
  distribution?: number;
  entity?: number;
  // Universal task system entity filters
  entity_type?:
    | 'song'
    | 'work'
    | 'recording'
    | 'opportunity'
    | 'deliverable'
    | 'checklist_item'
    | 'campaign';
  song?: number;
  work?: number;
  recording?: number;
  opportunity?: number;
  deliverable?: number;
  checklist_item?: number;
  subcampaign?: number;
  is_overdue?: boolean;
  is_blocked?: boolean;
  my_tasks?: boolean;
}

// Paginated response
export interface TaskListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: import('@/api/types/tasks').Task[];
}
