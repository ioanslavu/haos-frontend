import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { Task, TaskStatus, TASK_STATUS_LABELS } from '@/api/types/tasks'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, Calendar, CheckCircle, Clock, AlertTriangle, MoveRight } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TaskKanbanCard } from './TaskKanbanCard'
import { TaskKanbanColumn } from './TaskKanbanColumn'
import { cn } from '@/lib/utils'

interface TaskKanbanViewProps {
  tasks: Task[]
  onEdit?: (task: Task) => void
  onDelete?: (task: Task) => void
  onStatusChange?: (task: Task, newStatus: TaskStatus) => void
  onClick?: (task: Task) => void
}

const STATUS_COLUMNS: { id: TaskStatus; label: string; color: string; icon: any }[] = [
  { id: 'todo', label: 'To Do', color: 'from-gray-50 to-gray-100 border-gray-200', icon: Clock },
  { id: 'in_progress', label: 'In Progress', color: 'from-blue-50 to-blue-100 border-blue-200', icon: AlertCircle },
  { id: 'blocked', label: 'Blocked', color: 'from-red-50 to-red-100 border-red-200', icon: AlertTriangle },
  { id: 'review', label: 'In Review', color: 'from-orange-50 to-orange-100 border-orange-200', icon: Calendar },
  { id: 'done', label: 'Done', color: 'from-green-50 to-green-100 border-green-200', icon: CheckCircle },
]

export function TaskKanbanView({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
  onClick,
}: TaskKanbanViewProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  // Setup drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start dragging
      },
    })
  )

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((t) => t.status === status)
  }

  const MoveToMenu = ({ task }: { task: Task }) => {
    const availableStatuses = STATUS_COLUMNS.filter((s) => s.id !== task.status)

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" title="Move to...">
            <MoveRight className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {availableStatuses.map((status) => (
            <DropdownMenuItem
              key={status.id}
              onClick={(e) => {
                e.stopPropagation()
                onStatusChange?.(task, status.id)
              }}
            >
              Move to {status.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as number
    const task = tasks.find((t) => t.id === taskId)
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveTask(null)
      return
    }

    const taskId = active.id as number
    const newStatus = over.id as TaskStatus

    // Find the task
    const task = tasks.find((t) => t.id === taskId)

    if (task && task.status !== newStatus) {
      // Update task status
      onStatusChange?.(task, newStatus)
    }

    setActiveTask(null)
  }

  const handleDragCancel = () => {
    setActiveTask(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUS_COLUMNS.map((column) => {
          const Icon = column.icon
          const columnTasks = getTasksByStatus(column.id)

          return (
            <TaskKanbanColumn
              key={column.id}
              id={column.id}
              title={column.label}
              count={columnTasks.length}
              color={column.color}
              header={
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">
                      {column.label}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="font-mono">
                    {columnTasks.length}
                  </Badge>
                </div>
              }
            >
              <div className="space-y-3">
                {columnTasks.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    No tasks
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <TaskKanbanCard
                      key={task.id}
                      task={task}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onClick={onClick}
                      isDragging={activeTask?.id === task.id}
                    />
                  ))
                )}
              </div>
            </TaskKanbanColumn>
          )
        })}
      </div>

      {/* Drag Overlay - shows the task being dragged */}
      <DragOverlay modifiers={[snapCenterToCursor]}>
        {activeTask ? (
          <Card className="p-3 cursor-grabbing shadow-2xl rotate-2 w-[280px] bg-background">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold line-clamp-2">{activeTask.title}</h4>
              {activeTask.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {activeTask.description}
                </p>
              )}
            </div>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
