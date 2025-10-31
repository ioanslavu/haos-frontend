import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface TaskKanbanColumnProps {
  id: string
  title: string
  count: number
  color: string
  header?: ReactNode
  children: ReactNode
}

export function TaskKanbanColumn({
  id,
  color,
  header,
  children,
}: TaskKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-shrink-0 w-[280px] h-[calc(100vh-280px)] flex flex-col',
        'rounded-lg border bg-gradient-to-b transition-all duration-200',
        color,
        isOver && 'ring-2 ring-primary/50 scale-[1.02]'
      )}
    >
      <div className="p-3 pb-0">{header}</div>
      <div className="flex-1 p-3 pt-0 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
