import {
  Clock,
  Activity,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import type { Task, TaskStatus } from '@/api/types/tasks'
import type { ProjectCustomFieldDefinition } from '@/api/types/customFields'

// Status configuration
export const STATUS_CONFIG: Record<TaskStatus, {
  icon: React.ElementType
  color: string
  bg: string
  borderColor: string
  defaultExpanded: boolean
}> = {
  todo: {
    icon: Clock,
    color: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-900/50',
    borderColor: 'border-gray-200 dark:border-gray-800',
    defaultExpanded: true,
  },
  in_progress: {
    icon: Activity,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    defaultExpanded: true,
  },
  blocked: {
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    defaultExpanded: true,
  },
  review: {
    icon: AlertCircle,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    defaultExpanded: true,
  },
  done: {
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    defaultExpanded: false,
  },
  cancelled: {
    icon: XCircle,
    color: 'text-gray-500 dark:text-gray-500',
    bg: 'bg-gray-50 dark:bg-gray-900/50',
    borderColor: 'border-gray-200 dark:border-gray-800',
    defaultExpanded: false,
  },
}

// Order of statuses to display
export const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'blocked', 'review', 'done', 'cancelled']

// Column configuration
export type ColumnId = 'checkbox' | 'task' | 'type' | 'priority' | 'status' | 'assigned' | 'due'
export type SortDirection = 'asc' | 'desc' | null

export interface ColumnConfig {
  id: ColumnId
  label: string
  width?: string
  sortable?: boolean
}

export interface SortConfig {
  column: ColumnId | string | null  // string for custom field IDs like "custom-123"
  direction: SortDirection
}

export interface FilterConfig {
  type: string[]
  priority: number[]
  status: string[]
  assigned: number[]
  customFields: Record<number, string[]>  // fieldId -> selected values
}

// Priority labels for filter dropdown
export const PRIORITY_LABELS: Record<number, string> = {
  1: 'Low',
  2: 'Normal',
  3: 'High',
  4: 'Urgent',
}

export const COLUMNS: ColumnConfig[] = [
  { id: 'checkbox', label: '', width: 'w-[40px]', sortable: false },
  { id: 'task', label: 'Task', width: 'w-[280px]', sortable: true },
  { id: 'type', label: 'Type', width: 'w-[120px]', sortable: true },
  { id: 'priority', label: 'Priority', width: 'w-[100px]', sortable: true },
  { id: 'status', label: 'Status', width: 'w-[120px]', sortable: true },
  { id: 'assigned', label: 'Assigned', width: 'w-[140px]', sortable: false },
  { id: 'due', label: 'Due', width: 'w-[120px]', sortable: true },
]

// Helper to get column width
export const getColumnWidth = (columnId: ColumnId): string => {
  return COLUMNS.find(c => c.id === columnId)?.width || ''
}

export const DEFAULT_COLUMN_ORDER: ColumnId[] = ['checkbox', 'task', 'type', 'priority', 'status', 'assigned', 'due']
export const STORAGE_KEY = 'task-table-column-order'
export const CUSTOM_FIELD_ORDER_KEY = 'task-table-custom-field-order'

// Initial number of tasks to show when expanded
export const INITIAL_VISIBLE_COUNT = 5
// Number of tasks to add when clicking "Show more"
export const LOAD_MORE_COUNT = 20
// Threshold for using virtualization
export const VIRTUALIZATION_THRESHOLD = 50

export interface StatusGroupedCompactTableProps {
  tasks: Task[]
  projectId?: number
  onTaskClick: (task: Task) => void
  onStatusUpdate: (taskId: number, status: string) => void
  onPriorityUpdate: (taskId: number, priority: number) => void
  onAssigneeUpdate: (taskId: number, assignedToUsers: number[]) => void
  onDateUpdate: (taskId: number, dueDate: string | null) => void
  onCustomFieldUpdate?: (taskId: number, valueId: number, value: string | null) => void
}

export interface TaskRowProps {
  task: Task
  columnOrder: ColumnId[]
  customFields: ProjectCustomFieldDefinition[]
  onTaskClick: (task: Task) => void
  onStatusUpdate: (taskId: number, status: string) => void
  onPriorityUpdate: (taskId: number, priority: number) => void
  onAssigneeUpdate: (taskId: number, assignedToUsers: number[]) => void
  onDateUpdate: (taskId: number, dueDate: string | null) => void
  onRelatedEntityClick: (e: React.MouseEvent, path: string) => void
  onCustomFieldUpdate?: (taskId: number, fieldId: number, value: string | null) => void
}

export interface StatusSectionProps {
  status: TaskStatus
  tasks: Task[]
  columnOrder: ColumnId[]
  customFields: ProjectCustomFieldDefinition[]
  isExpanded: boolean
  onToggle: () => void
  visibleCount: number
  onShowMore: () => void
  onTaskClick: (task: Task) => void
  onStatusUpdate: (taskId: number, status: string) => void
  onPriorityUpdate: (taskId: number, priority: number) => void
  onAssigneeUpdate: (taskId: number, assignedToUsers: number[]) => void
  onDateUpdate: (taskId: number, dueDate: string | null) => void
  onRelatedEntityClick: (e: React.MouseEvent, path: string) => void
  onCustomFieldUpdate?: (taskId: number, fieldId: number, value: string | null) => void
}
