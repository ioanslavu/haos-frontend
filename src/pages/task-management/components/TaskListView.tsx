/**
 * TaskListView - List views for tasks (comfortable and compact modes)
 */

import { Clock, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusGroupedCompactTable } from '@/components/tasks/StatusGroupedCompactTable/index'
import { RelatedEntity } from './RelatedEntity'
import { TASK_STATUS_LABELS, TASK_TYPE_LABELS } from '@/api/types/tasks'
import { format, isPast, isToday } from 'date-fns'
import { cn, getInitials } from '@/lib/utils'
import type { Task } from '@/api/types/tasks'

interface TaskListViewProps {
  tasks: Task[]
  listDensity: 'comfortable' | 'compact'
  onTaskClick: (task: Task) => void
  onRelatedEntityClick: (e: React.MouseEvent, path: string) => void
  onInlineStatusUpdate: (taskId: number, status: string) => void
  onInlinePriorityUpdate: (taskId: number, priority: number) => void
  onInlineAssigneeUpdate: (taskId: number, assignedToUsers: number[]) => void
  onInlineDateUpdate: (taskId: number, dueDate: string | null) => void
  loadMoreRef: React.RefObject<HTMLDivElement>
  isFetchingNextPage: boolean
  hasNextPage: boolean
  totalTaskCount: number
  allTasksCount: number
}

export function TaskListView({
  tasks,
  listDensity,
  onTaskClick,
  onRelatedEntityClick,
  onInlineStatusUpdate,
  onInlinePriorityUpdate,
  onInlineAssigneeUpdate,
  onInlineDateUpdate,
  loadMoreRef,
  isFetchingNextPage,
  hasNextPage,
  totalTaskCount,
  allTasksCount,
}: TaskListViewProps) {
  if (listDensity === 'compact') {
    return (
      <StatusGroupedCompactTable
        tasks={tasks}
        onTaskClick={onTaskClick}
        onStatusUpdate={onInlineStatusUpdate}
        onPriorityUpdate={onInlinePriorityUpdate}
        onAssigneeUpdate={onInlineAssigneeUpdate}
        onDateUpdate={onInlineDateUpdate}
      />
    )
  }

  // Comfortable List View - Modern Table Design
  return (
    <div className="rounded-lg border border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border/60 hover:bg-transparent">
            <TableHead className="w-[40px]"></TableHead>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead className="font-semibold">Task</TableHead>
            <TableHead className="font-semibold w-[120px]">Type</TableHead>
            <TableHead className="font-semibold w-[140px]">Assigned</TableHead>
            <TableHead className="font-semibold w-[120px]">Due Date</TableHead>
            <TableHead className="font-semibold w-[140px]">Progress</TableHead>
            <TableHead className="font-semibold w-[120px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow
              key={task.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/40 last:border-0"
              onClick={() => onTaskClick(task)}
            >
              {/* Checkbox */}
              <TableCell className="py-3">
                <Checkbox
                  checked={task.status === 'done'}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4"
                />
              </TableCell>

              {/* Priority */}
              <TableCell className="py-3">
                <div
                  className={cn(
                    'w-1 h-8 rounded-full',
                    task.priority === 4
                      ? 'bg-red-500'
                      : task.priority === 3
                      ? 'bg-orange-500'
                      : task.priority === 2
                      ? 'bg-blue-500'
                      : 'bg-gray-400'
                  )}
                />
              </TableCell>

              {/* Task Title */}
              <TableCell className="py-3">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-sm">{task.title}</span>
                  {task.description && (
                    <span className="text-xs text-muted-foreground/80 line-clamp-1">
                      {task.description}
                    </span>
                  )}
                  <RelatedEntity task={task} onClick={onRelatedEntityClick} />
                </div>
              </TableCell>

              {/* Type */}
              <TableCell className="py-3">
                <Badge
                  variant="outline"
                  className="text-xs font-normal border-border/60 bg-background/50"
                >
                  {TASK_TYPE_LABELS[task.task_type]}
                </Badge>
              </TableCell>

              {/* Assigned */}
              <TableCell className="py-3">
                {task.assigned_to_users_detail && task.assigned_to_users_detail.length > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-2">
                      {task.assigned_to_users_detail.slice(0, 3).map((user) => (
                        <Avatar
                          key={user.id}
                          className="h-6 w-6 border-2 border-background ring-1 ring-border/20"
                        >
                          <AvatarFallback className="text-xs font-medium">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    {task.assigned_to_users_detail.length > 3 && (
                      <span className="text-xs text-muted-foreground font-medium">
                        +{task.assigned_to_users_detail.length - 3}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center">
                    <User className="h-3 w-3 text-muted-foreground/60" />
                  </div>
                )}
              </TableCell>

              {/* Due Date */}
              <TableCell className="py-3">
                {task.due_date && (
                  <div
                    className={cn(
                      'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md',
                      isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date))
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                        : isToday(new Date(task.due_date))
                        ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                        : 'bg-muted/50 text-muted-foreground'
                    )}
                  >
                    <Clock className="h-3 w-3" />
                    <span>{format(new Date(task.due_date), 'MMM d')}</span>
                  </div>
                )}
              </TableCell>

              {/* Progress */}
              <TableCell className="py-3">
                {task.completion_percentage > 0 && (
                  <div className="flex items-center gap-2">
                    <Progress value={task.completion_percentage} className="h-1.5 w-20" />
                    <span className="text-xs font-medium w-8">{task.completion_percentage}%</span>
                  </div>
                )}
              </TableCell>

              {/* Status */}
              <TableCell className="py-3">
                <Badge
                  className={cn(
                    'font-medium',
                    task.status === 'done'
                      ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 hover:bg-green-500/20'
                      : task.status === 'in_progress'
                      ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20'
                      : task.status === 'blocked'
                      ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 hover:bg-red-500/20'
                      : task.status === 'review'
                      ? 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/20'
                      : 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20 hover:bg-gray-500/20'
                  )}
                  variant="outline"
                >
                  {TASK_STATUS_LABELS[task.status]}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="py-4 flex items-center justify-center">
        {isFetchingNextPage && (
          <div className="text-sm text-muted-foreground">Loading more tasks...</div>
        )}
        {!hasNextPage && allTasksCount > 0 && (
          <div className="text-sm text-muted-foreground">All {totalTaskCount} tasks loaded</div>
        )}
      </div>
    </div>
  )
}
