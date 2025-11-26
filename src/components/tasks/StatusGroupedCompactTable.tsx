import { useState, useRef, useMemo, memo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  useProjectCustomFieldDefinitions,
  useCreateProjectCustomFieldDefinition,
} from '@/api/hooks/useCustomFields'
import type { ProjectCustomFieldDefinition, CustomFieldType } from '@/api/types/customFields'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { InlineStatusBadge } from '@/components/tasks/InlineStatusBadge'
import { InlineAssigneeSelect } from '@/components/tasks/InlineAssigneeSelect'
import { InlinePrioritySelect } from '@/components/tasks/InlinePrioritySelect'
import { InlineDatePicker } from '@/components/tasks/InlineDatePicker'
import {
  Task,
  TaskStatus,
  TASK_STATUS_LABELS,
  TASK_TYPE_LABELS,
} from '@/api/types/tasks'
import {
  ChevronRight,
  ChevronDown,
  Clock,
  Activity,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  ChevronsUpDown,
  Briefcase,
  Music,
  Link2,
  GripVertical,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  X,
  Plus,
  Type,
  Hash,
  List,
  Calendar,
  CheckSquare,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

// Status configuration
const STATUS_CONFIG: Record<TaskStatus, {
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
const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'blocked', 'review', 'done', 'cancelled']

// Column configuration
type ColumnId = 'checkbox' | 'task' | 'type' | 'priority' | 'status' | 'assigned' | 'due'
type SortDirection = 'asc' | 'desc' | null

interface ColumnConfig {
  id: ColumnId
  label: string
  width?: string
  sortable?: boolean
}

interface SortConfig {
  column: ColumnId | string | null  // string for custom field IDs like "custom-123"
  direction: SortDirection
}

interface FilterConfig {
  type: string[]
  priority: number[]
  status: string[]
  assigned: number[]
  customFields: Record<number, string[]>  // fieldId -> selected values
}

// Priority labels for filter dropdown
const PRIORITY_LABELS: Record<number, string> = {
  1: 'Low',
  2: 'Normal',
  3: 'High',
  4: 'Urgent',
}

const COLUMNS: ColumnConfig[] = [
  { id: 'checkbox', label: '', width: 'w-[40px]', sortable: false },
  { id: 'task', label: 'Task', width: 'w-[280px]', sortable: true },
  { id: 'type', label: 'Type', width: 'w-[120px]', sortable: true },
  { id: 'priority', label: 'Priority', width: 'w-[100px]', sortable: true },
  { id: 'status', label: 'Status', width: 'w-[120px]', sortable: true },
  { id: 'assigned', label: 'Assigned', width: 'w-[140px]', sortable: false },
  { id: 'due', label: 'Due', width: 'w-[120px]', sortable: true },
]

// Helper to get column width
const getColumnWidth = (columnId: ColumnId): string => {
  return COLUMNS.find(c => c.id === columnId)?.width || ''
}

const DEFAULT_COLUMN_ORDER: ColumnId[] = ['checkbox', 'task', 'type', 'priority', 'status', 'assigned', 'due']
const STORAGE_KEY = 'task-table-column-order'
const CUSTOM_FIELD_ORDER_KEY = 'task-table-custom-field-order'

// Initial number of tasks to show when expanded
const INITIAL_VISIBLE_COUNT = 5
// Number of tasks to add when clicking "Show more"
const LOAD_MORE_COUNT = 20
// Threshold for using virtualization
const VIRTUALIZATION_THRESHOLD = 50

interface StatusGroupedCompactTableProps {
  tasks: Task[]
  projectId?: number
  onTaskClick: (task: Task) => void
  onStatusUpdate: (taskId: number, status: string) => void
  onPriorityUpdate: (taskId: number, priority: number) => void
  onAssigneeUpdate: (taskId: number, assignedToUsers: number[]) => void
  onDateUpdate: (taskId: number, dueDate: string | null) => void
  onCustomFieldUpdate?: (taskId: number, valueId: number, value: string | null) => void
}

// Related Entity Component
const RelatedEntity = memo(({ task, onClick }: { task: Task; onClick: (e: React.MouseEvent, path: string) => void }) => {
  if (task.opportunity && task.opportunity_detail) {
    return (
      <div
        onClick={(e) => onClick(e, `/sales/opportunities/${task.opportunity}`)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
      >
        <Briefcase className="h-2.5 w-2.5 flex-shrink-0" />
        <span className="truncate group-hover:underline max-w-[100px]">{task.opportunity_detail.title}</span>
      </div>
    )
  }

  if (task.song && task.song_detail) {
    return (
      <div
        onClick={(e) => onClick(e, `/songs/${task.song}`)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
      >
        <Music className="h-2.5 w-2.5 flex-shrink-0" />
        <span className="truncate group-hover:underline max-w-[100px]">{task.song_detail.title}</span>
      </div>
    )
  }

  if (task.entity && task.entity_detail) {
    return (
      <div
        onClick={(e) => onClick(e, `/entities/${task.entity}`)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
      >
        <User className="h-2.5 w-2.5 flex-shrink-0" />
        <span className="truncate group-hover:underline max-w-[100px]">{task.entity_detail.display_name}</span>
      </div>
    )
  }

  if (task.campaign && task.campaign_detail) {
    return (
      <div
        onClick={(e) => onClick(e, `/digital/campaigns/${task.campaign}`)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
      >
        <Link2 className="h-2.5 w-2.5 flex-shrink-0" />
        <span className="truncate group-hover:underline max-w-[100px]">{task.campaign_detail.name}</span>
      </div>
    )
  }

  return null
})

RelatedEntity.displayName = 'RelatedEntity'

// Sortable Custom Field Header Component
const SortableCustomFieldHeader = ({
  field,
  sortConfig,
  filters,
  onSort,
  onToggleFilter,
  onClearFilter,
}: {
  field: ProjectCustomFieldDefinition
  sortConfig: SortConfig
  filters: FilterConfig
  onSort: (columnId: string) => void
  onToggleFilter: (fieldId: number, value: string) => void
  onClearFilter: (fieldId: number) => void
}) => {
  const columnId = `custom-${field.id}`
  const sortableId = `cf-${field.id}`
  const isSelectField = field.field_type === 'single_select'
  const fieldFilters = filters.customFields[field.id] || []

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn(
        "py-2 font-semibold text-xs w-[120px] cursor-grab active:cursor-grabbing select-none",
        isDragging && "opacity-50 bg-muted"
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-1">
        <GripVertical className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
        <span
          className="flex items-center gap-1 cursor-pointer hover:text-foreground truncate"
          onClick={(e) => {
            e.stopPropagation()
            onSort(columnId)
          }}
        >
          <span className="truncate">{field.field_name}</span>
          {/* Sort indicator */}
          <span className="ml-0.5">
            {sortConfig.column === columnId ? (
              sortConfig.direction === 'asc' ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )
            ) : (
              <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
            )}
          </span>
        </span>
        {/* Filter for select fields */}
        {isSelectField && field.select_options && field.select_options.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-5 w-5 p-0 ml-1",
                  fieldFilters.length > 0 && "text-primary"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <Filter className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 max-h-64 overflow-y-auto">
              {field.select_options.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option}
                  checked={fieldFilters.includes(option)}
                  onCheckedChange={() => onToggleFilter(field.id, option)}
                >
                  {option}
                </DropdownMenuCheckboxItem>
              ))}
              {fieldFilters.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={false}
                    onCheckedChange={() => onClearFilter(field.id)}
                  >
                    Clear
                  </DropdownMenuCheckboxItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </TableHead>
  )
}

// Inline Editable Input for custom fields
const InlineEditableInput = memo(({
  value,
  type,
  onSave,
  placeholder = '-',
  className,
}: {
  value: string
  type: 'text' | 'number'
  onSave: (value: string | null) => void
  placeholder?: string
  className?: string
}) => {
  const [localValue, setLocalValue] = useState(value)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)

    // Debounce save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      onSave(newValue || null)
    }, 500)
  }

  const handleBlur = () => {
    // Save immediately on blur
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = undefined
    }
    if (localValue !== value) {
      onSave(localValue || null)
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return (
    <Input
      type={type}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
    />
  )
})

InlineEditableInput.displayName = 'InlineEditableInput'

// Sortable Header Component
const SortableHeader = ({
  id,
  children,
  className,
  sortable,
  sortDirection,
  onSort,
}: {
  id: string
  children: React.ReactNode
  className?: string
  sortable?: boolean
  sortDirection?: SortDirection
  onSort?: (columnId: ColumnId) => void
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleSortClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (sortable && onSort) {
      onSort(id as ColumnId)
    }
  }

  // Don't make checkbox and task columns draggable
  if (id === 'checkbox' || id === 'task') {
    return (
      <TableHead
        className={cn(className, 'py-2', sortable && 'cursor-pointer hover:bg-muted/50')}
        onClick={handleSortClick}
      >
        <div className="flex items-center gap-1">
          {children}
          {sortable && (
            <span className="ml-1">
              {sortDirection === 'asc' ? (
                <ArrowUp className="h-3 w-3" />
              ) : sortDirection === 'desc' ? (
                <ArrowDown className="h-3 w-3" />
              ) : (
                <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
              )}
            </span>
          )}
        </div>
      </TableHead>
    )
  }

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn(
        className,
        'py-2 cursor-grab active:cursor-grabbing select-none',
        isDragging && 'opacity-50 bg-muted'
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-1">
        <GripVertical className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
        <span
          className={cn("flex items-center gap-1", sortable && "cursor-pointer hover:text-foreground")}
          onClick={handleSortClick}
        >
          {children}
          {sortable && (
            <span className="ml-0.5">
              {sortDirection === 'asc' ? (
                <ArrowUp className="h-3 w-3" />
              ) : sortDirection === 'desc' ? (
                <ArrowDown className="h-3 w-3" />
              ) : (
                <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
              )}
            </span>
          )}
        </span>
      </div>
    </TableHead>
  )
}

// Memoized Task Row Component
const TaskRow = memo(({
  task,
  columnOrder,
  customFields,
  onTaskClick,
  onStatusUpdate,
  onPriorityUpdate,
  onAssigneeUpdate,
  onDateUpdate,
  onRelatedEntityClick,
  onCustomFieldUpdate,
}: {
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
}) => {
  const renderCell = (columnId: ColumnId) => {
    const width = getColumnWidth(columnId)
    switch (columnId) {
      case 'checkbox':
        return (
          <TableCell key={columnId} className={cn("py-1.5", width)}>
            <Checkbox
              checked={task.status === 'done'}
              onClick={(e) => e.stopPropagation()}
              className="h-3.5 w-3.5"
            />
          </TableCell>
        )
      case 'task':
        return (
          <TableCell key={columnId} className={cn("py-1.5", width)}>
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => onTaskClick(task)}
            >
              <div className={cn(
                "w-1 h-5 rounded-full flex-shrink-0",
                task.priority === 4 ? 'bg-red-500' :
                task.priority === 3 ? 'bg-orange-500' :
                task.priority === 2 ? 'bg-blue-500' :
                'bg-gray-500'
              )} />
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="font-medium text-xs truncate">{task.title}</span>
                <RelatedEntity task={task} onClick={onRelatedEntityClick} />
              </div>
            </div>
          </TableCell>
        )
      case 'type':
        return (
          <TableCell key={columnId} className={cn("py-1.5", width)} onClick={(e) => e.stopPropagation()}>
            <Badge variant="outline" className="text-[10px] font-normal border-border/60 bg-background/50 px-1.5 py-0 whitespace-nowrap">
              {TASK_TYPE_LABELS[task.task_type]}
            </Badge>
          </TableCell>
        )
      case 'priority':
        return (
          <TableCell key={columnId} className={cn("py-1.5", width)} onClick={(e) => e.stopPropagation()}>
            <InlinePrioritySelect
              value={task.priority}
              onSave={(priority) => onPriorityUpdate(task.id, priority)}
              className="h-6 text-[10px] whitespace-nowrap hover:bg-accent/50 rounded transition-colors"
            />
          </TableCell>
        )
      case 'status':
        return (
          <TableCell key={columnId} className={cn("py-1.5", width)} onClick={(e) => e.stopPropagation()}>
            <InlineStatusBadge
              value={task.status}
              onSave={(status) => onStatusUpdate(task.id, status)}
              labels={TASK_STATUS_LABELS}
              className="text-[10px] py-0.5 px-2 h-auto whitespace-nowrap hover:ring-2 hover:ring-primary/50 hover:brightness-110 transition-all cursor-pointer select-none"
            />
          </TableCell>
        )
      case 'assigned': {
        // Get assigned user details directly from the task
        const assignedUsers = task.assigned_to_users_detail || [];
        // Get IDs for the select component
        const assignedUserIds = assignedUsers.length
          ? assignedUsers.map(u => u.id)
          : task.assigned_to_users || task.assignments?.map(a => a.user) || [];

        return (
          <TableCell key={columnId} className={cn("py-1.5", width)} onClick={(e) => e.stopPropagation()}>
            <InlineAssigneeSelect
              value={assignedUserIds}
              onSave={(users) => onAssigneeUpdate(task.id, users)}
              className="h-6 px-1 text-[10px]"
              placeholder="Assign"
              compact
            />
          </TableCell>
        )
      }
      case 'due':
        return (
          <TableCell key={columnId} className={cn("py-1.5", width)} onClick={(e) => e.stopPropagation()}>
            <InlineDatePicker
              value={task.due_date}
              onSave={(date) => onDateUpdate(task.id, date)}
              placeholder="Set date"
              className="h-6 px-1 text-[10px]"
            />
          </TableCell>
        )
      default:
        return null
    }
  }

  // Format custom field display value
  const formatCustomFieldValue = (definition: ProjectCustomFieldDefinition, value: any): string => {
    if (value === null || value === undefined || value === '') return '-'

    switch (definition.field_type) {
      case 'checkbox':
        return value === 'true' || value === true ? '✓' : '-'
      case 'number':
        return new Intl.NumberFormat().format(Number(value))
      case 'date':
        if (value) {
          try {
            return new Date(value).toLocaleDateString()
          } catch {
            return String(value)
          }
        }
        return '-'
      default:
        return String(value)
    }
  }

  return (
    <TableRow className="hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0 group">
      {/* Fixed columns first */}
      {renderCell('checkbox')}
      {renderCell('task')}
      {/* Then draggable columns in order */}
      {columnOrder
        .filter(id => id !== 'checkbox' && id !== 'task')
        .map(renderCell)}
      {/* Custom field values - editable */}
      {customFields.map((field) => {
        const fieldValue = task.custom_field_values?.[field.id]
        const currentValue = fieldValue?.value || ''

        return (
          <TableCell
            key={`custom-${field.id}`}
            className="py-1.5 w-[120px]"
            onClick={(e) => e.stopPropagation()}
          >
            {field.field_type === 'single_select' ? (
              <Select
                value={currentValue || undefined}
                onValueChange={(value) => onCustomFieldUpdate?.(task.id, field.id, value || null)}
              >
                <SelectTrigger className="h-6 text-[10px] border-none bg-transparent hover:bg-accent/50">
                  <SelectValue placeholder="-" />
                </SelectTrigger>
                <SelectContent>
                  {field.select_options?.map((option) => (
                    <SelectItem key={option} value={option} className="text-xs">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.field_type === 'checkbox' ? (
              <Checkbox
                checked={currentValue === 'true'}
                onCheckedChange={(checked) => onCustomFieldUpdate?.(task.id, field.id, checked ? 'true' : 'false')}
                className="h-4 w-4"
              />
            ) : field.field_type === 'date' ? (
              <InlineDatePicker
                value={currentValue || null}
                onSave={(date) => onCustomFieldUpdate?.(task.id, field.id, date)}
                placeholder="-"
                className="h-6 px-1 text-[10px]"
              />
            ) : field.field_type === 'number' ? (
              <InlineEditableInput
                type="number"
                value={currentValue}
                onSave={(value) => onCustomFieldUpdate?.(task.id, field.id, value)}
                className="h-6 text-[10px] border-none bg-transparent hover:bg-accent/50 focus:bg-background"
                placeholder="-"
              />
            ) : (
              <InlineEditableInput
                type="text"
                value={currentValue}
                onSave={(value) => onCustomFieldUpdate?.(task.id, field.id, value)}
                className="h-6 text-[10px] border-none bg-transparent hover:bg-accent/50 focus:bg-background"
                placeholder="-"
              />
            )}
          </TableCell>
        )
      })}
    </TableRow>
  )
}, (prevProps, nextProps) => {
  // Custom comparison for memoization
  return prevProps.task.updated_at === nextProps.task.updated_at &&
         prevProps.task.status === nextProps.task.status &&
         prevProps.task.priority === nextProps.task.priority &&
         prevProps.task.due_date === nextProps.task.due_date &&
         JSON.stringify(prevProps.task.assigned_to_users) === JSON.stringify(nextProps.task.assigned_to_users) &&
         JSON.stringify(prevProps.columnOrder) === JSON.stringify(nextProps.columnOrder) &&
         JSON.stringify(prevProps.task.custom_field_values) === JSON.stringify(nextProps.task.custom_field_values) &&
         JSON.stringify(prevProps.customFields) === JSON.stringify(nextProps.customFields)
})

TaskRow.displayName = 'TaskRow'

// Virtualized Task List for large datasets
const VirtualizedTaskList = memo(({
  tasks,
  columnOrder,
  customFields,
  onTaskClick,
  onStatusUpdate,
  onPriorityUpdate,
  onAssigneeUpdate,
  onDateUpdate,
  onRelatedEntityClick,
  onCustomFieldUpdate,
}: {
  tasks: Task[]
  columnOrder: ColumnId[]
  customFields: ProjectCustomFieldDefinition[]
  onTaskClick: (task: Task) => void
  onStatusUpdate: (taskId: number, status: string) => void
  onPriorityUpdate: (taskId: number, priority: number) => void
  onAssigneeUpdate: (taskId: number, assignedToUsers: number[]) => void
  onDateUpdate: (taskId: number, dueDate: string | null) => void
  onRelatedEntityClick: (e: React.MouseEvent, path: string) => void
  onCustomFieldUpdate?: (taskId: number, fieldId: number, value: string | null) => void
}) => {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36, // Compact row height
    overscan: 5,
  })

  return (
    <div
      ref={parentRef}
      className="max-h-[400px] overflow-auto"
    >
      <Table>
        <TableBody>
          <tr style={{ height: `${virtualizer.getTotalSize()}px`, display: 'block' }}>
            <td style={{ display: 'block', position: 'relative' }}>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const task = tasks[virtualRow.index]
                return (
                  <div
                    key={task.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <Table className="w-full min-w-[920px] table-fixed">
                      <TableBody>
                        <TaskRow
                          task={task}
                          columnOrder={columnOrder}
                          customFields={customFields}
                          onTaskClick={onTaskClick}
                          onStatusUpdate={onStatusUpdate}
                          onPriorityUpdate={onPriorityUpdate}
                          onAssigneeUpdate={onAssigneeUpdate}
                          onDateUpdate={onDateUpdate}
                          onRelatedEntityClick={onRelatedEntityClick}
                          onCustomFieldUpdate={onCustomFieldUpdate}
                        />
                      </TableBody>
                    </Table>
                  </div>
                )
              })}
            </td>
          </tr>
        </TableBody>
      </Table>
    </div>
  )
})

VirtualizedTaskList.displayName = 'VirtualizedTaskList'

// Status Section Component
const StatusSection = memo(({
  status,
  tasks,
  columnOrder,
  customFields,
  isExpanded,
  onToggle,
  visibleCount,
  onShowMore,
  onTaskClick,
  onStatusUpdate,
  onPriorityUpdate,
  onAssigneeUpdate,
  onDateUpdate,
  onRelatedEntityClick,
  onCustomFieldUpdate,
}: {
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
}) => {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon
  const visibleTasks = tasks.slice(0, visibleCount)
  const remainingCount = tasks.length - visibleCount
  const useVirtualization = visibleCount > VIRTUALIZATION_THRESHOLD

  if (tasks.length === 0) return null

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <div
          className={cn(
            "flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors border-b",
            config.bg,
            config.borderColor,
            "hover:brightness-95 dark:hover:brightness-110"
          )}
        >
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className={cn("h-4 w-4 transition-transform", config.color)} />
            ) : (
              <ChevronRight className={cn("h-4 w-4 transition-transform", config.color)} />
            )}
            <Icon className={cn("h-4 w-4", config.color)} />
            <span className={cn("font-medium text-sm", config.color)}>
              {TASK_STATUS_LABELS[status]}
            </span>
            <Badge
              variant="secondary"
              className={cn(
                "text-xs font-semibold px-1.5 py-0",
                config.color
              )}
            >
              {tasks.length}
            </Badge>
          </div>
          {isExpanded && remainingCount > 0 && (
            <span className="text-xs text-muted-foreground">
              Showing {visibleCount} of {tasks.length}
            </span>
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-b border-border/60">
          {useVirtualization ? (
            <VirtualizedTaskList
              tasks={visibleTasks}
              columnOrder={columnOrder}
              customFields={customFields}
              onTaskClick={onTaskClick}
              onStatusUpdate={onStatusUpdate}
              onPriorityUpdate={onPriorityUpdate}
              onAssigneeUpdate={onAssigneeUpdate}
              onDateUpdate={onDateUpdate}
              onRelatedEntityClick={onRelatedEntityClick}
              onCustomFieldUpdate={onCustomFieldUpdate}
            />
          ) : (
            <Table className="w-full min-w-[920px] table-fixed">
              <TableBody>
                {visibleTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    columnOrder={columnOrder}
                    customFields={customFields}
                    onTaskClick={onTaskClick}
                    onStatusUpdate={onStatusUpdate}
                    onPriorityUpdate={onPriorityUpdate}
                    onAssigneeUpdate={onAssigneeUpdate}
                    onDateUpdate={onDateUpdate}
                    onRelatedEntityClick={onRelatedEntityClick}
                    onCustomFieldUpdate={onCustomFieldUpdate}
                  />
                ))}
              </TableBody>
            </Table>
          )}

          {remainingCount > 0 && (
            <div className="px-4 py-2 border-t border-border/30 bg-muted/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onShowMore()
                }}
                className="w-full h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                Show {Math.min(remainingCount, LOAD_MORE_COUNT)} more
                {remainingCount > LOAD_MORE_COUNT && ` (${remainingCount} remaining)`}
              </Button>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
})

StatusSection.displayName = 'StatusSection'

// Main Component
export function StatusGroupedCompactTable({
  tasks,
  projectId,
  onTaskClick,
  onStatusUpdate,
  onPriorityUpdate,
  onAssigneeUpdate,
  onDateUpdate,
  onCustomFieldUpdate,
}: StatusGroupedCompactTableProps) {
  const navigate = useNavigate()

  // Fetch custom field definitions for the project
  const { data: customFieldDefinitions = [] } = useProjectCustomFieldDefinitions(projectId)

  // State for custom field column order
  const [customFieldOrder, setCustomFieldOrder] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_FIELD_ORDER_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    return []
  })

  // Save custom field order to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_FIELD_ORDER_KEY, JSON.stringify(customFieldOrder))
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [customFieldOrder])

  // Get visible custom field definitions (show_in_table = true)
  const visibleCustomFields = useMemo(() => {
    const filtered = customFieldDefinitions.filter(def => def.show_in_table && !def.is_archived)

    // If we have a saved order, use it; otherwise use default order
    if (customFieldOrder.length > 0) {
      // Sort by saved order, putting any new fields at the end
      return filtered.sort((a, b) => {
        const aIndex = customFieldOrder.indexOf(a.id)
        const bIndex = customFieldOrder.indexOf(b.id)

        if (aIndex === -1 && bIndex === -1) return a.order - b.order
        if (aIndex === -1) return 1
        if (bIndex === -1) return -1
        return aIndex - bIndex
      })
    }

    return filtered.sort((a, b) => a.order - b.order)
  }, [customFieldDefinitions, customFieldOrder])

  // Update custom field order when fields change (to include new fields)
  useEffect(() => {
    if (visibleCustomFields.length > 0 && customFieldOrder.length === 0) {
      // Initialize with current order
      setCustomFieldOrder(visibleCustomFields.map(f => f.id))
    } else if (visibleCustomFields.length > 0) {
      // Add any new fields that aren't in the order yet
      const newFields = visibleCustomFields.filter(f => !customFieldOrder.includes(f.id))
      if (newFields.length > 0) {
        setCustomFieldOrder(prev => [...prev, ...newFields.map(f => f.id)])
      }
    }
  }, [visibleCustomFields, customFieldOrder])

  // Create custom field mutation
  const createFieldMutation = useCreateProjectCustomFieldDefinition()

  // State for add field popover
  const [addFieldOpen, setAddFieldOpen] = useState(false)
  const [newFieldType, setNewFieldType] = useState<CustomFieldType | null>(null)
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldOptions, setNewFieldOptions] = useState<string[]>([])
  const [newOptionInput, setNewOptionInput] = useState('')

  const handleCreateField = () => {
    if (!projectId || !newFieldType || !newFieldName.trim()) return

    // Auto-add pending option
    let finalOptions = newFieldOptions
    if (newFieldType === 'single_select' && newOptionInput.trim() && !newFieldOptions.includes(newOptionInput.trim())) {
      finalOptions = [...newFieldOptions, newOptionInput.trim()]
    }

    createFieldMutation.mutate(
      {
        projectId,
        data: {
          field_name: newFieldName.trim(),
          field_type: newFieldType,
          select_options: newFieldType === 'single_select' ? finalOptions : undefined,
          show_in_table: true,
        },
      },
      {
        onSuccess: () => {
          setAddFieldOpen(false)
          setNewFieldType(null)
          setNewFieldName('')
          setNewFieldOptions([])
          setNewOptionInput('')
        },
      }
    )
  }

  const cancelAddField = () => {
    setAddFieldOpen(false)
    setNewFieldType(null)
    setNewFieldName('')
    setNewFieldOptions([])
    setNewOptionInput('')
  }

  // State for column order with localStorage persistence
  const [columnOrder, setColumnOrder] = useState<ColumnId[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Validate that all columns are present
        if (Array.isArray(parsed) && parsed.length === DEFAULT_COLUMN_ORDER.length) {
          return parsed
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    return DEFAULT_COLUMN_ORDER
  })

  // Save column order to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columnOrder))
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [columnOrder])

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  // Handle column drag end
  const handleColumnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      // Check if this is a custom field drag
      const activeId = String(active.id)
      const overId = String(over.id)

      if (activeId.startsWith('cf-') && overId.startsWith('cf-')) {
        // Custom field reorder
        const activeFieldId = parseInt(activeId.replace('cf-', ''))
        const overFieldId = parseInt(overId.replace('cf-', ''))

        setCustomFieldOrder((items) => {
          const oldIndex = items.indexOf(activeFieldId)
          const newIndex = items.indexOf(overFieldId)
          if (oldIndex !== -1 && newIndex !== -1) {
            return arrayMove(items, oldIndex, newIndex)
          }
          return items
        })
      } else {
        // Standard column reorder
        setColumnOrder((items) => {
          const oldIndex = items.indexOf(active.id as ColumnId)
          const newIndex = items.indexOf(over.id as ColumnId)
          return arrayMove(items, oldIndex, newIndex)
        })
      }
    }
  }

  // Sort state
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: null,
    direction: null,
  })

  // Filter state
  const [filters, setFilters] = useState<FilterConfig>({
    type: [],
    priority: [],
    status: [],
    assigned: [],
    customFields: {},
  })

  // Handle sort (supports both standard columns and custom fields)
  const handleSort = (columnId: ColumnId | string) => {
    setSortConfig((prev) => {
      if (prev.column === columnId) {
        // Cycle through: asc -> desc -> null
        if (prev.direction === 'asc') {
          return { column: columnId, direction: 'desc' }
        } else if (prev.direction === 'desc') {
          return { column: null, direction: null }
        }
      }
      return { column: columnId, direction: 'asc' }
    })
  }

  // Handle filter toggle
  const toggleFilter = (column: keyof FilterConfig, value: string | number) => {
    setFilters((prev) => {
      const currentValues = prev[column] as (string | number)[]
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value]
      return { ...prev, [column]: newValues }
    })
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({ type: [], priority: [], status: [], assigned: [], customFields: {} })
  }

  // Check if any filters are active
  const hasActiveFilters = filters.type.length > 0 || filters.priority.length > 0 || filters.status.length > 0 || filters.assigned.length > 0 || Object.keys(filters.customFields).length > 0

  // Toggle custom field filter
  const toggleCustomFieldFilter = (fieldId: number, value: string) => {
    setFilters((prev) => {
      const currentValues = prev.customFields[fieldId] || []
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value]

      const newCustomFields = { ...prev.customFields }
      if (newValues.length === 0) {
        delete newCustomFields[fieldId]
      } else {
        newCustomFields[fieldId] = newValues
      }

      return { ...prev, customFields: newCustomFields }
    })
  }

  // Get unique values for filters from tasks
  const uniqueTypes = useMemo(() => {
    const types = new Set(tasks.map(t => t.task_type))
    return Array.from(types).sort()
  }, [tasks])

  // Get unique assigned users for filter dropdown
  const uniqueAssignedUsers = useMemo(() => {
    const usersMap = new Map<number, { id: number; name: string }>()
    tasks.forEach(task => {
      task.assigned_to_users_detail?.forEach(user => {
        if (!usersMap.has(user.id)) {
          usersMap.set(user.id, { id: user.id, name: user.full_name || user.email })
        }
      })
    })
    return Array.from(usersMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [tasks])

  // State for expanded sections
  const [expandedStatuses, setExpandedStatuses] = useState<Set<TaskStatus>>(() => {
    const initial = new Set<TaskStatus>()
    STATUS_ORDER.forEach(status => {
      if (STATUS_CONFIG[status].defaultExpanded) {
        initial.add(status)
      }
    })
    return initial
  })

  // State for visible count per status
  const [visibleCounts, setVisibleCounts] = useState<Record<TaskStatus, number>>(() => {
    const initial: Record<string, number> = {}
    STATUS_ORDER.forEach(status => {
      initial[status] = INITIAL_VISIBLE_COUNT
    })
    return initial as Record<TaskStatus, number>
  })

  // Sort function
  const sortTasks = (tasksToSort: Task[]): Task[] => {
    if (!sortConfig.column || !sortConfig.direction) {
      return tasksToSort
    }

    return [...tasksToSort].sort((a, b) => {
      let comparison = 0

      switch (sortConfig.column) {
        case 'task':
          comparison = a.title.localeCompare(b.title)
          break
        case 'type':
          comparison = a.task_type.localeCompare(b.task_type)
          break
        case 'priority':
          comparison = b.priority - a.priority // Higher priority first
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'due':
          if (!a.due_date && !b.due_date) comparison = 0
          else if (!a.due_date) comparison = 1
          else if (!b.due_date) comparison = -1
          else comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
          break
        default:
          // Check if sorting by custom field
          if (sortConfig.column && sortConfig.column.startsWith('custom-')) {
            const fieldId = parseInt(sortConfig.column.replace('custom-', ''))
            const aValue = a.custom_field_values?.[fieldId]?.display_value ?? a.custom_field_values?.[fieldId]?.value ?? ''
            const bValue = b.custom_field_values?.[fieldId]?.display_value ?? b.custom_field_values?.[fieldId]?.value ?? ''

            // Handle different types
            if (typeof aValue === 'number' && typeof bValue === 'number') {
              comparison = aValue - bValue
            } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
              comparison = (aValue ? 1 : 0) - (bValue ? 1 : 0)
            } else {
              comparison = String(aValue).localeCompare(String(bValue))
            }
          } else {
            comparison = 0
          }
      }

      return sortConfig.direction === 'desc' ? -comparison : comparison
    })
  }

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Type filter
      if (filters.type.length > 0 && !filters.type.includes(task.task_type)) {
        return false
      }
      // Priority filter
      if (filters.priority.length > 0 && !filters.priority.includes(task.priority)) {
        return false
      }
      // Status filter (this filters across all status groups)
      if (filters.status.length > 0 && !filters.status.includes(task.status)) {
        return false
      }
      // Assigned filter
      if (filters.assigned.length > 0) {
        const taskUserIds = task.assigned_to_users_detail?.map(u => u.id) || []
        const hasMatchingUser = filters.assigned.some(userId => taskUserIds.includes(userId))
        if (!hasMatchingUser) {
          return false
        }
      }
      // Custom field filters
      for (const [fieldIdStr, selectedValues] of Object.entries(filters.customFields)) {
        const fieldId = parseInt(fieldIdStr)
        if (selectedValues.length > 0) {
          const fieldValue = task.custom_field_values?.[fieldId]
          const taskValue = fieldValue?.value || ''
          if (!selectedValues.includes(taskValue)) {
            return false
          }
        }
      }
      return true
    })
  }, [tasks, filters])

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      blocked: [],
      review: [],
      done: [],
      cancelled: [],
    }

    filteredTasks.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task)
      }
    })

    // Sort each group
    Object.keys(grouped).forEach(status => {
      grouped[status as TaskStatus] = sortTasks(grouped[status as TaskStatus])
    })

    return grouped
  }, [filteredTasks, sortConfig])

  // Calculate total counts
  const totalCount = tasks.length
  const expandedCount = Array.from(expandedStatuses).reduce(
    (sum, status) => sum + tasksByStatus[status].length,
    0
  )

  const handleToggleStatus = (status: TaskStatus) => {
    setExpandedStatuses(prev => {
      const next = new Set(prev)
      if (next.has(status)) {
        next.delete(status)
      } else {
        next.add(status)
      }
      return next
    })
  }

  const handleShowMore = (status: TaskStatus) => {
    setVisibleCounts(prev => ({
      ...prev,
      [status]: prev[status] + LOAD_MORE_COUNT,
    }))
  }

  const handleExpandAll = () => {
    setExpandedStatuses(new Set(STATUS_ORDER))
  }

  const handleCollapseAll = () => {
    setExpandedStatuses(new Set())
  }

  const handleRelatedEntityClick = (e: React.MouseEvent, path: string) => {
    e.stopPropagation()
    navigate(path)
  }

  const allExpanded = expandedStatuses.size === STATUS_ORDER.length
  const allCollapsed = expandedStatuses.size === 0

  return (
    <div className="rounded-lg border border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden">
      {/* Header with expand/collapse controls */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/60 bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {hasActiveFilters ? `${filteredTasks.length} of ${totalCount} tasks` : `${totalCount} tasks`}
          </span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={allExpanded ? handleCollapseAll : handleExpandAll}
            className="h-7 px-2 text-xs"
          >
            <ChevronsUpDown className="h-3.5 w-3.5 mr-1" />
            {allExpanded ? 'Collapse all' : 'Expand all'}
          </Button>
        </div>
      </div>

      {/* Table header (always visible) - Draggable */}
      <div className="border-b border-border/60 bg-background/50 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleColumnDragEnd}
        >
          <Table className="w-full min-w-[920px] table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {/* Fixed columns (checkbox and task) */}
                <TableHead className={cn("py-2", getColumnWidth('checkbox'))}></TableHead>
                <SortableHeader
                  id="task"
                  className={cn("font-semibold text-xs", getColumnWidth('task'))}
                  sortable={true}
                  sortDirection={sortConfig.column === 'task' ? sortConfig.direction : null}
                  onSort={handleSort}
                >
                  Task
                </SortableHeader>
                {/* Draggable columns */}
                <SortableContext
                  items={columnOrder.filter(id => id !== 'checkbox' && id !== 'task')}
                  strategy={horizontalListSortingStrategy}
                >
                  {columnOrder
                    .filter(id => id !== 'checkbox' && id !== 'task')
                    .map((columnId) => {
                      const column = COLUMNS.find(c => c.id === columnId)
                      if (!column) return null

                      // Render filter dropdown for filterable columns
                      const renderFilterDropdown = () => {
                        if (columnId === 'type') {
                          return (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    "h-5 w-5 p-0 ml-1",
                                    filters.type.length > 0 && "text-primary"
                                  )}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Filter className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-48">
                                {uniqueTypes.map((type) => (
                                  <DropdownMenuCheckboxItem
                                    key={type}
                                    checked={filters.type.includes(type)}
                                    onCheckedChange={() => toggleFilter('type', type)}
                                  >
                                    {TASK_TYPE_LABELS[type] || type}
                                  </DropdownMenuCheckboxItem>
                                ))}
                                {filters.type.length > 0 && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuCheckboxItem
                                      checked={false}
                                      onCheckedChange={() => setFilters(prev => ({ ...prev, type: [] }))}
                                    >
                                      Clear
                                    </DropdownMenuCheckboxItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )
                        }
                        if (columnId === 'priority') {
                          return (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    "h-5 w-5 p-0 ml-1",
                                    filters.priority.length > 0 && "text-primary"
                                  )}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Filter className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-36">
                                {[4, 3, 2, 1].map((priority) => (
                                  <DropdownMenuCheckboxItem
                                    key={priority}
                                    checked={filters.priority.includes(priority)}
                                    onCheckedChange={() => toggleFilter('priority', priority)}
                                  >
                                    {PRIORITY_LABELS[priority]}
                                  </DropdownMenuCheckboxItem>
                                ))}
                                {filters.priority.length > 0 && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuCheckboxItem
                                      checked={false}
                                      onCheckedChange={() => setFilters(prev => ({ ...prev, priority: [] }))}
                                    >
                                      Clear
                                    </DropdownMenuCheckboxItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )
                        }
                        if (columnId === 'status') {
                          return (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    "h-5 w-5 p-0 ml-1",
                                    filters.status.length > 0 && "text-primary"
                                  )}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Filter className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-40">
                                {STATUS_ORDER.map((status) => (
                                  <DropdownMenuCheckboxItem
                                    key={status}
                                    checked={filters.status.includes(status)}
                                    onCheckedChange={() => toggleFilter('status', status)}
                                  >
                                    {TASK_STATUS_LABELS[status]}
                                  </DropdownMenuCheckboxItem>
                                ))}
                                {filters.status.length > 0 && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuCheckboxItem
                                      checked={false}
                                      onCheckedChange={() => setFilters(prev => ({ ...prev, status: [] }))}
                                    >
                                      Clear
                                    </DropdownMenuCheckboxItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )
                        }
                        if (columnId === 'assigned') {
                          return (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    "h-5 w-5 p-0 ml-1",
                                    filters.assigned.length > 0 && "text-primary"
                                  )}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Filter className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-48 max-h-64 overflow-y-auto">
                                {uniqueAssignedUsers.length === 0 ? (
                                  <div className="px-2 py-1 text-xs text-muted-foreground">
                                    No assigned users
                                  </div>
                                ) : (
                                  uniqueAssignedUsers.map((user) => (
                                    <DropdownMenuCheckboxItem
                                      key={user.id}
                                      checked={filters.assigned.includes(user.id)}
                                      onCheckedChange={() => toggleFilter('assigned', user.id)}
                                    >
                                      {user.name}
                                    </DropdownMenuCheckboxItem>
                                  ))
                                )}
                                {filters.assigned.length > 0 && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuCheckboxItem
                                      checked={false}
                                      onCheckedChange={() => setFilters(prev => ({ ...prev, assigned: [] }))}
                                    >
                                      Clear
                                    </DropdownMenuCheckboxItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )
                        }
                        return null
                      }

                      return (
                        <SortableHeader
                          key={column.id}
                          id={column.id}
                          className={cn(
                            'font-semibold text-xs',
                            column.width
                          )}
                          sortable={column.sortable}
                          sortDirection={sortConfig.column === column.id ? sortConfig.direction : null}
                          onSort={handleSort}
                        >
                          <span className="flex items-center">
                            {column.label}
                            {renderFilterDropdown()}
                          </span>
                        </SortableHeader>
                      )
                    })}
                </SortableContext>
                {/* Custom field columns - Sortable */}
                <SortableContext
                  items={visibleCustomFields.map(f => `cf-${f.id}`)}
                  strategy={horizontalListSortingStrategy}
                >
                  {visibleCustomFields.map((field) => (
                    <SortableCustomFieldHeader
                      key={`cf-${field.id}`}
                      field={field}
                      sortConfig={sortConfig}
                      filters={filters}
                      onSort={handleSort}
                      onToggleFilter={toggleCustomFieldFilter}
                      onClearFilter={(fieldId) => {
                        setFilters(prev => {
                          const newCustomFields = { ...prev.customFields }
                          delete newCustomFields[fieldId]
                          return { ...prev, customFields: newCustomFields }
                        })
                      }}
                    />
                  ))}
                </SortableContext>
                {/* Add field button */}
                {projectId && customFieldDefinitions.length < 20 && (
                  <TableHead className="py-2 w-[40px]">
                    <Popover open={addFieldOpen} onOpenChange={setAddFieldOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-0" align="end">
                        {!newFieldType ? (
                          <div className="p-1">
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Add property</div>
                            {[
                              { type: 'text' as CustomFieldType, label: 'Text', icon: <Type className="h-4 w-4" /> },
                              { type: 'number' as CustomFieldType, label: 'Number', icon: <Hash className="h-4 w-4" /> },
                              { type: 'single_select' as CustomFieldType, label: 'Select', icon: <List className="h-4 w-4" /> },
                              { type: 'date' as CustomFieldType, label: 'Date', icon: <Calendar className="h-4 w-4" /> },
                              { type: 'checkbox' as CustomFieldType, label: 'Checkbox', icon: <CheckSquare className="h-4 w-4" /> },
                            ].map((item) => (
                              <button
                                key={item.type}
                                onClick={() => setNewFieldType(item.type)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted rounded"
                              >
                                {item.icon}
                                <span>{item.label}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 space-y-3">
                            <Input
                              value={newFieldName}
                              onChange={(e) => setNewFieldName(e.target.value)}
                              placeholder="Property name"
                              className="h-8 text-sm"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && newFieldName.trim()) {
                                  if (newFieldType !== 'single_select' || newFieldOptions.length > 0) {
                                    handleCreateField()
                                  }
                                }
                                if (e.key === 'Escape') cancelAddField()
                              }}
                            />
                            {newFieldType === 'single_select' && (
                              <div className="space-y-1.5">
                                <div className="text-xs text-muted-foreground">Options</div>
                                {newFieldOptions.map((option, index) => (
                                  <div key={index} className="flex items-center gap-1">
                                    <Input value={option} disabled className="h-7 text-sm flex-1" />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => setNewFieldOptions(newFieldOptions.filter((_, i) => i !== index))}
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                ))}
                                <div className="flex gap-1">
                                  <Input
                                    value={newOptionInput}
                                    onChange={(e) => setNewOptionInput(e.target.value)}
                                    placeholder="Add option..."
                                    className="h-7 text-sm flex-1"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault()
                                        if (newOptionInput.trim() && !newFieldOptions.includes(newOptionInput.trim())) {
                                          setNewFieldOptions([...newFieldOptions, newOptionInput.trim()])
                                          setNewOptionInput('')
                                        }
                                      }
                                    }}
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7"
                                    onClick={() => {
                                      if (newOptionInput.trim() && !newFieldOptions.includes(newOptionInput.trim())) {
                                        setNewFieldOptions([...newFieldOptions, newOptionInput.trim()])
                                        setNewOptionInput('')
                                      }
                                    }}
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            )}
                            <div className="flex justify-end gap-2 pt-1">
                              <Button variant="ghost" size="sm" className="h-7" onClick={cancelAddField}>
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                className="h-7"
                                onClick={handleCreateField}
                                disabled={
                                  !newFieldName.trim() ||
                                  (newFieldType === 'single_select' && newFieldOptions.length === 0) ||
                                  createFieldMutation.isPending
                                }
                              >
                                Create
                              </Button>
                            </div>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
          </Table>
        </DndContext>
      </div>

      {/* Status sections */}
      <div className="overflow-x-auto">
        {STATUS_ORDER.map(status => (
          <StatusSection
            key={status}
            status={status}
            tasks={tasksByStatus[status]}
            columnOrder={columnOrder}
            customFields={visibleCustomFields}
            isExpanded={expandedStatuses.has(status)}
            onToggle={() => handleToggleStatus(status)}
            visibleCount={visibleCounts[status]}
            onShowMore={() => handleShowMore(status)}
            onTaskClick={onTaskClick}
            onStatusUpdate={onStatusUpdate}
            onPriorityUpdate={onPriorityUpdate}
            onAssigneeUpdate={onAssigneeUpdate}
            onDateUpdate={onDateUpdate}
            onRelatedEntityClick={handleRelatedEntityClick}
            onCustomFieldUpdate={onCustomFieldUpdate}
          />
        ))}
      </div>

      {/* Empty state */}
      {totalCount === 0 && (
        <div className="px-4 py-8 text-center text-muted-foreground">
          No tasks found
        </div>
      )}
    </div>
  )
}

export default StatusGroupedCompactTable
