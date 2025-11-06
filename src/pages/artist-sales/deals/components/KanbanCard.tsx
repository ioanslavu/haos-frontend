import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KanbanCardProps {
  id: number
  children: React.ReactNode
  onClick?: () => void
}

export function KanbanCard({ id, children, onClick }: KanbanCardProps) {
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

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Prevent click when dragging
        if (!isDragging && onClick) {
          onClick()
        }
      }}
      className={cn(
        'p-4 cursor-grab active:cursor-grabbing hover:border-primary transition-colors',
        isDragging && 'opacity-50'
      )}
    >
      {children}
    </Card>
  )
}
