/**
 * DragComponents - Drag and drop components for kanban view
 */

import { useDroppable, useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import type { Task } from './types'

interface DroppableColumnProps {
  id: string
  children: React.ReactNode
}

export function DroppableColumn({ id, children }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'h-full flex-shrink-0 rounded-xl transition-all duration-200',
        isOver && 'bg-primary/5 ring-2 ring-primary/30 scale-[1.02]'
      )}
    >
      {children}
    </div>
  )
}

interface DraggableTaskCardProps {
  task: Task
  children: React.ReactNode
  onClick: () => void
}

export function DraggableTaskCard({ task, children, onClick }: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(isDragging && 'opacity-30')}
      onClick={(e) => {
        if (!isDragging) {
          onClick()
        }
      }}
    >
      {children}
    </div>
  )
}
