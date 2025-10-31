import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Task, TASK_PRIORITY_LABELS, TASK_TYPE_LABELS, TASK_TAG_LABELS, TASK_TAG_COLORS } from '@/api/types/tasks'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Clock, Flag, MoreVertical, User, Tag as TagIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, isToday, isTomorrow } from 'date-fns'

interface TaskKanbanCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (task: Task) => void
  onClick?: (task: Task) => void
  isDragging?: boolean
}

export function TaskKanbanCard({
  task,
  onEdit,
  onDelete,
  onClick,
  isDragging = false,
}: TaskKanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getPriorityColor = (priority: number) => {
    const colors = {
      1: 'text-gray-500',
      2: 'text-blue-500',
      3: 'text-orange-500',
      4: 'text-red-500',
    }
    return colors[priority as keyof typeof colors] || 'text-gray-500'
  }

  const getDeadlineText = (dueDate: string) => {
    const date = new Date(dueDate)
    if (isToday(date)) return 'Due today'
    if (isTomorrow(date)) return 'Due tomorrow'
    return formatDistanceToNow(date, { addSuffix: true })
  }

  const assignedUsers = task.assigned_to_users_detail || []

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group relative cursor-grab transition-all duration-200',
        'hover:shadow-lg hover:scale-[1.02] hover:border-primary/50',
        'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        (isSortableDragging || isDragging) && 'opacity-50 scale-95',
        isDragging && 'cursor-grabbing shadow-2xl',
        !isDragging && 'active:cursor-grabbing'
      )}
      onClick={() => !isDragging && onClick?.(task)}
    >

      <div className="p-3 space-y-2.5">
        {/* Task Title & Menu */}
        <div className="flex items-start gap-2 pr-6">
          <h4 className="text-sm font-semibold line-clamp-2 flex-1 leading-snug">
            {task.title}
          </h4>
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(task)}
                    className="text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Priority Flag */}
        <div className="flex items-center gap-1.5">
          <Flag className={cn("h-3 w-3", getPriorityColor(task.priority))} />
          <span className="text-xs font-medium">{TASK_PRIORITY_LABELS[task.priority]}</span>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {TASK_TYPE_LABELS[task.task_type]}
          </Badge>
          {task.tag && (
            <Badge variant="secondary" className="text-xs">
              <TagIcon className="mr-1 h-2 w-2" />
              {TASK_TAG_LABELS[task.tag]}
            </Badge>
          )}
        </div>

        {/* Associated Campaign/Entity - Compact */}
        <div className="space-y-1.5 pt-1 border-t">
          {task.campaign_detail && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Campaign:</span> {task.campaign_detail.name}
            </div>
          )}

          {task.entity_detail && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Client:</span> {task.entity_detail.display_name}
            </div>
          )}
        </div>

        {/* Assigned Users & Due Date */}
        <div className="flex items-center justify-between pt-2 border-t">
          {assignedUsers.length > 0 ? (
            <div className="flex items-center gap-1">
              <div className="flex -space-x-2">
                {assignedUsers.slice(0, 3).map((user) => (
                  <Avatar key={user.id} className="h-5 w-5 border-2 border-background">
                    <AvatarFallback className="text-[10px] bg-primary/10">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {assignedUsers.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{assignedUsers.length - 3}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>Unassigned</span>
            </div>
          )}

          {task.due_date && (
            <div className={cn(
              "flex items-center gap-1 text-xs",
              task.is_overdue ? "text-red-600" : "text-muted-foreground"
            )}>
              <Clock className="h-3 w-3" />
              <span>{getDeadlineText(task.due_date)}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
