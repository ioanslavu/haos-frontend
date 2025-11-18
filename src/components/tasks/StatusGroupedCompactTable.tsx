import { useState, useRef, useMemo, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVirtualizer } from '@tanstack/react-virtual'
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
} from 'lucide-react'
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

// Initial number of tasks to show when expanded
const INITIAL_VISIBLE_COUNT = 5
// Number of tasks to add when clicking "Show more"
const LOAD_MORE_COUNT = 20
// Threshold for using virtualization
const VIRTUALIZATION_THRESHOLD = 50

interface StatusGroupedCompactTableProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onStatusUpdate: (taskId: number, status: string) => void
  onPriorityUpdate: (taskId: number, priority: number) => void
  onAssigneeUpdate: (taskId: number, assignedToUsers: number[]) => void
  onDateUpdate: (taskId: number, dueDate: string | null) => void
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
        onClick={(e) => onClick(e, `/entity/${task.entity}`)}
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

// Memoized Task Row Component
const TaskRow = memo(({
  task,
  onTaskClick,
  onStatusUpdate,
  onPriorityUpdate,
  onAssigneeUpdate,
  onDateUpdate,
  onRelatedEntityClick,
}: {
  task: Task
  onTaskClick: (task: Task) => void
  onStatusUpdate: (taskId: number, status: string) => void
  onPriorityUpdate: (taskId: number, priority: number) => void
  onAssigneeUpdate: (taskId: number, assignedToUsers: number[]) => void
  onDateUpdate: (taskId: number, dueDate: string | null) => void
  onRelatedEntityClick: (e: React.MouseEvent, path: string) => void
}) => {
  return (
    <TableRow className="hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0 group">
      {/* Checkbox */}
      <TableCell className="py-1.5 w-8">
        <Checkbox
          checked={task.status === 'done'}
          onClick={(e) => e.stopPropagation()}
          className="h-3.5 w-3.5"
        />
      </TableCell>

      {/* Task Title with Related Entity */}
      <TableCell className="py-1.5">
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

      {/* Type Badge */}
      <TableCell className="py-1.5 w-20" onClick={(e) => e.stopPropagation()}>
        <Badge variant="outline" className="text-[10px] font-normal border-border/60 bg-background/50 px-1.5 py-0 whitespace-nowrap">
          {TASK_TYPE_LABELS[task.task_type]}
        </Badge>
      </TableCell>

      {/* Priority - Inline Editable */}
      <TableCell className="py-1.5 w-20" onClick={(e) => e.stopPropagation()}>
        <InlinePrioritySelect
          value={task.priority}
          onSave={(priority) => onPriorityUpdate(task.id, priority)}
          className="h-6 text-[10px] whitespace-nowrap hover:bg-accent/50 rounded transition-colors"
        />
      </TableCell>

      {/* Status - Inline Editable */}
      <TableCell className="py-1.5 w-24" onClick={(e) => e.stopPropagation()}>
        <InlineStatusBadge
          value={task.status}
          onSave={(status) => onStatusUpdate(task.id, status)}
          labels={TASK_STATUS_LABELS}
          className="text-[10px] py-0.5 px-2 h-auto whitespace-nowrap hover:ring-2 hover:ring-primary/50 hover:brightness-110 transition-all cursor-pointer select-none"
        />
      </TableCell>

      {/* Assigned - Inline Editable */}
      <TableCell className="py-1.5 w-32" onClick={(e) => e.stopPropagation()}>
        <InlineAssigneeSelect
          value={task.assigned_to_users || []}
          onSave={(users) => onAssigneeUpdate(task.id, users)}
          className="h-6 px-1 text-[10px]"
          placeholder="Assign"
          compact
        />
      </TableCell>

      {/* Due Date - Inline Editable */}
      <TableCell className="py-1.5 w-28" onClick={(e) => e.stopPropagation()}>
        <InlineDatePicker
          value={task.due_date}
          onSave={(date) => onDateUpdate(task.id, date)}
          placeholder="Set date"
          className="h-6 px-1 text-[10px]"
        />
      </TableCell>
    </TableRow>
  )
}, (prevProps, nextProps) => {
  // Custom comparison for memoization
  return prevProps.task.updated_at === nextProps.task.updated_at &&
         prevProps.task.status === nextProps.task.status &&
         prevProps.task.priority === nextProps.task.priority &&
         prevProps.task.due_date === nextProps.task.due_date &&
         JSON.stringify(prevProps.task.assigned_to_users) === JSON.stringify(nextProps.task.assigned_to_users)
})

TaskRow.displayName = 'TaskRow'

// Virtualized Task List for large datasets
const VirtualizedTaskList = memo(({
  tasks,
  onTaskClick,
  onStatusUpdate,
  onPriorityUpdate,
  onAssigneeUpdate,
  onDateUpdate,
  onRelatedEntityClick,
}: {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onStatusUpdate: (taskId: number, status: string) => void
  onPriorityUpdate: (taskId: number, priority: number) => void
  onAssigneeUpdate: (taskId: number, assignedToUsers: number[]) => void
  onDateUpdate: (taskId: number, dueDate: string | null) => void
  onRelatedEntityClick: (e: React.MouseEvent, path: string) => void
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
                    <Table>
                      <TableBody>
                        <TaskRow
                          task={task}
                          onTaskClick={onTaskClick}
                          onStatusUpdate={onStatusUpdate}
                          onPriorityUpdate={onPriorityUpdate}
                          onAssigneeUpdate={onAssigneeUpdate}
                          onDateUpdate={onDateUpdate}
                          onRelatedEntityClick={onRelatedEntityClick}
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
}: {
  status: TaskStatus
  tasks: Task[]
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
              onTaskClick={onTaskClick}
              onStatusUpdate={onStatusUpdate}
              onPriorityUpdate={onPriorityUpdate}
              onAssigneeUpdate={onAssigneeUpdate}
              onDateUpdate={onDateUpdate}
              onRelatedEntityClick={onRelatedEntityClick}
            />
          ) : (
            <Table>
              <TableBody>
                {visibleTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onTaskClick={onTaskClick}
                    onStatusUpdate={onStatusUpdate}
                    onPriorityUpdate={onPriorityUpdate}
                    onAssigneeUpdate={onAssigneeUpdate}
                    onDateUpdate={onDateUpdate}
                    onRelatedEntityClick={onRelatedEntityClick}
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
  onTaskClick,
  onStatusUpdate,
  onPriorityUpdate,
  onAssigneeUpdate,
  onDateUpdate,
}: StatusGroupedCompactTableProps) {
  const navigate = useNavigate()

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

    tasks.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task)
      }
    })

    return grouped
  }, [tasks])

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
            {totalCount} tasks
          </span>
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

      {/* Table header (always visible) */}
      <div className="border-b border-border/60 bg-background/50">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-8 py-2"></TableHead>
              <TableHead className="font-semibold py-2 text-xs min-w-[200px]">Task</TableHead>
              <TableHead className="font-semibold w-20 py-2 text-xs">Type</TableHead>
              <TableHead className="font-semibold w-20 py-2 text-xs">Priority</TableHead>
              <TableHead className="font-semibold w-24 py-2 text-xs">Status</TableHead>
              <TableHead className="font-semibold w-32 py-2 text-xs">Assigned</TableHead>
              <TableHead className="font-semibold w-28 py-2 text-xs">Due</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      </div>

      {/* Status sections */}
      <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
        {STATUS_ORDER.map(status => (
          <StatusSection
            key={status}
            status={status}
            tasks={tasksByStatus[status]}
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
