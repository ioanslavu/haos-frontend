import { useDroppable } from '@dnd-kit/core'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface KanbanColumnProps {
  id: string
  title: string
  count: number
  color: string
  children: React.ReactNode
}

export function KanbanColumn({ id, title, count, color, children }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  })

  return (
    <div className="flex-shrink-0 w-[320px]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          {title}
          <Badge variant="secondary" className="text-xs">
            {count}
          </Badge>
        </h3>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'min-h-[400px] p-3 rounded-lg border-2 border-dashed transition-colors',
          isOver ? 'border-primary bg-accent' : 'border-muted bg-muted/20'
        )}
      >
        {children}
      </div>
    </div>
  )
}
