/**
 * TasksKanban - Kanban board view for tasks
 */

import { format, isToday, isPast } from 'date-fns'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Clock, Flag, User } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { TASK_TYPE_LABELS } from '@/api/types/tasks'
import { DroppableColumn, DraggableTaskCard } from './DragComponents'
import { RelatedEntity } from './RelatedEntity'
import { getPriorityColor, type Task } from './types'

interface TasksKanbanProps {
  tasksByStatus: Record<string, Task[]>
  onTaskClick: (task: Task) => void
  onRelatedEntityClick: (e: React.MouseEvent, path: string) => void
}

const STATUS_COLUMNS = [
  { id: 'todo', label: 'To Do', dotColor: 'bg-gray-400' },
  { id: 'in_progress', label: 'In Progress', dotColor: 'bg-blue-500' },
  { id: 'blocked', label: 'Blocked', dotColor: 'bg-red-500' },
  { id: 'review', label: 'In Review', dotColor: 'bg-orange-500' },
  { id: 'done', label: 'Done', dotColor: 'bg-green-500' },
]

export function TasksKanban({ tasksByStatus, onTaskClick, onRelatedEntityClick }: TasksKanbanProps) {
  return (
    <div className="flex gap-3 h-full overflow-x-auto pb-2">
      {STATUS_COLUMNS.map((column) => {
        const columnTasks = tasksByStatus[column.id] || []

        return (
          <DroppableColumn key={column.id} id={column.id}>
            <div className="w-[280px] h-full flex flex-col">
              <div className="flex items-center justify-between px-2 py-2 mb-2 flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className={cn("w-1.5 h-1.5 rounded-full", column.dotColor)} />
                  <h3 className="text-xs font-semibold">{column.label}</h3>
                  <span className="text-xs text-muted-foreground font-medium">{columnTasks.length}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
                {columnTasks.map((task) => (
                  <DraggableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task)}>
                    <TaskCard task={task} onRelatedEntityClick={onRelatedEntityClick} />
                  </DraggableTaskCard>
                ))}
              </div>
            </div>
          </DroppableColumn>
        )
      })}
    </div>
  )
}

interface TaskCardProps {
  task: Task
  onRelatedEntityClick: (e: React.MouseEvent, path: string) => void
}

function TaskCard({ task, onRelatedEntityClick }: TaskCardProps) {
  return (
    <Card className="group p-2.5 cursor-grab active:cursor-grabbing hover:shadow-lg hover:border-primary/40 transition-all duration-200 bg-card border-border/60">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-1.5">
          <h4 className="text-xs font-semibold line-clamp-2 leading-tight flex-1">{task.title}</h4>
          <div className={cn(
            "flex-shrink-0 w-4 h-4 rounded flex items-center justify-center",
            task.priority === 4 ? 'bg-red-500/15' :
            task.priority === 3 ? 'bg-orange-500/15' :
            task.priority === 2 ? 'bg-blue-500/15' :
            'bg-gray-500/15'
          )}>
            <Flag className={cn("h-2.5 w-2.5", getPriorityColor(task.priority))} />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] font-normal border-border/60 bg-background/50 h-4 px-1.5">
            {TASK_TYPE_LABELS[task.task_type]}
          </Badge>
          <RelatedEntity task={task} onClick={onRelatedEntityClick} />
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-border/30">
          {task.assigned_to_users_detail && task.assigned_to_users_detail.length > 0 ? (
            <div className="flex items-center gap-1">
              <div className="flex -space-x-1.5">
                {task.assigned_to_users_detail.slice(0, 2).map((user) => (
                  <Avatar key={user.id} className="h-5 w-5 border border-background">
                    <AvatarFallback className="text-[10px] font-medium">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {task.assigned_to_users_detail.length > 2 && (
                <span className="text-[10px] text-muted-foreground font-medium">
                  +{task.assigned_to_users_detail.length - 2}
                </span>
              )}
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-muted/40 flex items-center justify-center">
              <User className="h-2.5 w-2.5 text-muted-foreground/60" />
            </div>
          )}

          {task.due_date && (
            <div className={cn(
              "flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded",
              isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date))
                ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                : isToday(new Date(task.due_date))
                ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                : 'bg-muted/50 text-muted-foreground'
            )}>
              <Clock className="h-2.5 w-2.5" />
              <span>{format(new Date(task.due_date), 'MMM d')}</span>
            </div>
          )}
        </div>

        {task.completion_percentage && task.completion_percentage > 0 && (
          <div className="flex items-center gap-1.5 pt-0.5">
            <Progress value={task.completion_percentage} className="h-1 flex-1" />
            <span className="text-[10px] font-medium">{task.completion_percentage}%</span>
          </div>
        )}
      </div>
    </Card>
  )
}

interface DragOverlayCardProps {
  task: Task
}

export function DragOverlayCard({ task }: DragOverlayCardProps) {
  return (
    <Card className="p-2.5 cursor-grabbing shadow-2xl ring-2 ring-primary/50 rotate-2 w-[280px] bg-card border-primary/40">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-1.5">
          <h4 className="text-xs font-semibold line-clamp-2 flex-1 leading-tight">{task.title}</h4>
          <div className={cn(
            "flex-shrink-0 w-4 h-4 rounded flex items-center justify-center",
            task.priority === 4 ? 'bg-red-500/15' :
            task.priority === 3 ? 'bg-orange-500/15' :
            task.priority === 2 ? 'bg-blue-500/15' :
            'bg-gray-500/15'
          )}>
            <Flag className={cn("h-2.5 w-2.5", getPriorityColor(task.priority))} />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-[10px] font-normal border-border/60 bg-background/50 h-4 px-1.5">
            {TASK_TYPE_LABELS[task.task_type]}
          </Badge>
        </div>
      </div>
    </Card>
  )
}
