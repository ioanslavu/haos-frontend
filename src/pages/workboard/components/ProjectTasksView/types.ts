/**
 * Types and utilities for ProjectTasksView components
 */

import { Task, TaskStatus, TaskType } from '@/api/types/tasks'
import type { Project, ProjectTask, RecurringTaskTemplate } from '@/types/projects'

export interface ProjectTasksViewProps {
  project: Project
  showBackButton?: boolean
  showFullPageButton?: boolean
  onClose?: () => void
  initialTaskId?: number
}

export interface TasksHeaderProps {
  project: Project
  searchQuery: string
  setSearchQuery: (q: string) => void
  filterPriority: string
  setFilterPriority: (p: string) => void
  showCompleted: boolean
  setShowCompleted: (s: boolean) => void
  selectedEmployees: number[]
  setSelectedEmployees: (e: number[]) => void
  viewMode: 'kanban' | 'list' | 'calendar'
  setViewMode: (v: 'kanban' | 'list' | 'calendar') => void
  listDensity: 'comfortable' | 'compact'
  setListDensity: (d: 'comfortable' | 'compact') => void
  isMarketingDepartment: boolean
  overdueTasks: Task[]
  dueTodayTasks: Task[]
  showBackButton?: boolean
  showFullPageButton?: boolean
  onClose?: () => void
  onArchiveToggle: () => void
  isArchived: boolean
  onCreateTask: () => void
  onNewRecurringTask: () => void
  recurringTemplates?: RecurringTaskTemplate[]
  setRecurringManageOpen: (open: boolean) => void
}

export interface TasksKanbanProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onRelatedEntityClick: (e: React.MouseEvent, path: string) => void
}

export interface TasksListProps {
  tasks: Task[]
  projectId: number
  listDensity: 'comfortable' | 'compact'
  onTaskClick: (task: Task) => void
  onStatusUpdate: (taskId: number, status: string) => void
  onPriorityUpdate: (taskId: number, priority: number) => void
  onAssigneeUpdate: (taskId: number, assignedToUsers: number[]) => void
  onDateUpdate: (taskId: number, dueDate: string | null) => void
  onCustomFieldUpdate: (taskId: number, fieldId: number, value: string | null) => void
  onRelatedEntityClick: (e: React.MouseEvent, path: string) => void
}

export interface RecurringTasksManagerProps {
  project: Project
  recurringTemplates: RecurringTaskTemplate[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditTemplate: (template: RecurringTaskTemplate) => void
  onNewRecurringTask: () => void
}

export interface StatusColumn {
  id: string
  label: string
  icon: React.ElementType
  color: string
}

// Status columns configuration
export const STATUS_COLUMNS: StatusColumn[] = [
  { id: 'todo', label: 'To Do', icon: () => null, color: 'bg-gray-500' },
  { id: 'in_progress', label: 'In Progress', icon: () => null, color: 'bg-blue-500' },
  { id: 'blocked', label: 'Blocked', icon: () => null, color: 'bg-red-500' },
  { id: 'review', label: 'In Review', icon: () => null, color: 'bg-orange-500' },
  { id: 'done', label: 'Done', icon: () => null, color: 'bg-green-500' },
]

// Convert ProjectTask to Task format for compatibility with existing components
export function convertProjectTaskToTask(projectTask: ProjectTask): Task {
  return {
    id: projectTask.id,
    title: projectTask.title,
    description: projectTask.description || '',
    task_type: (projectTask.task_type || 'general') as TaskType,
    status: projectTask.status as TaskStatus,
    priority: projectTask.priority,
    due_date: projectTask.due_date || undefined,
    is_overdue: projectTask.is_overdue,
    is_blocked: projectTask.status === 'blocked',
    department: projectTask.department,
    created_at: projectTask.created_at,
    updated_at: projectTask.updated_at,
    notes: projectTask.notes || undefined,
    estimated_hours: projectTask.estimated_hours || undefined,
    assigned_to_users: projectTask.assigned_to_users_detail?.map(u => u.id) ||
      (projectTask.assigned_to ? [projectTask.assigned_to.id] : []),
    assigned_to_users_detail: projectTask.assigned_to_users_detail ||
      (projectTask.assigned_to ? [{
        id: projectTask.assigned_to.id,
        email: projectTask.assigned_to.email,
        full_name: projectTask.assigned_to.full_name,
      }] : []),
    assigned_team: projectTask.assigned_team || undefined,
    assigned_team_detail: projectTask.assigned_team_detail || undefined,
    created_by: projectTask.created_by?.id,
    created_by_detail: projectTask.created_by ? {
      id: projectTask.created_by.id,
      email: projectTask.created_by.email,
      full_name: projectTask.created_by.full_name,
    } : undefined,
    reviewed_by: projectTask.reviewed_by?.id,
    reviewed_by_detail: projectTask.reviewed_by ? {
      id: projectTask.reviewed_by.id,
      email: projectTask.reviewed_by.email,
      full_name: projectTask.reviewed_by.full_name,
    } : undefined,
    custom_field_values: projectTask.custom_field_values,
    domain_info: projectTask.domain_info,
  }
}

// Parse RRULE to human-readable format
export function parseRRuleToText(rrule: string): string {
  const parts = rrule.split(';')
  const ruleMap: Record<string, string> = {}
  parts.forEach(part => {
    const [key, value] = part.split('=')
    ruleMap[key] = value
  })

  const freq = ruleMap.FREQ?.toLowerCase() || 'weekly'
  const interval = parseInt(ruleMap.INTERVAL || '1')

  if (freq === 'daily') {
    return interval === 1 ? 'Daily' : `Every ${interval} days`
  } else if (freq === 'weekly') {
    const dayMap: Record<string, string> = {
      'SU': 'Sun', 'MO': 'Mon', 'TU': 'Tue', 'WE': 'Wed', 'TH': 'Thu', 'FR': 'Fri', 'SA': 'Sat'
    }
    const days = ruleMap.BYDAY?.split(',').map(d => dayMap[d]).join(', ') || ''
    return interval === 1 ? `Weekly on ${days}` : `Every ${interval} weeks on ${days}`
  } else if (freq === 'monthly') {
    const day = ruleMap.BYMONTHDAY || '1'
    return interval === 1 ? `Monthly on day ${day}` : `Every ${interval} months on day ${day}`
  } else {
    return interval === 1 ? 'Yearly' : `Every ${interval} years`
  }
}

// Get priority color class
export function getPriorityColor(priority: number): string {
  const colors: Record<number, string> = {
    1: 'text-gray-500',
    2: 'text-blue-500',
    3: 'text-orange-500',
    4: 'text-red-500',
  }
  return colors[priority] || 'text-gray-500'
}

// Re-export types used across components
export type { Task, TaskStatus, TaskType, Project, ProjectTask, RecurringTaskTemplate }
