import { memo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Table,
  TableBody,
} from '@/components/ui/table'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TASK_STATUS_LABELS, type Task } from '@/api/types/tasks'
import type { ProjectCustomFieldDefinition } from '@/api/types/customFields'
import { TaskRow } from './TaskRow'
import {
  STATUS_CONFIG,
  LOAD_MORE_COUNT,
  VIRTUALIZATION_THRESHOLD,
  type ColumnId,
  type StatusSectionProps,
} from './types'

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
    estimateSize: () => 36,
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
export const StatusSection = memo(({
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
}: StatusSectionProps) => {
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
