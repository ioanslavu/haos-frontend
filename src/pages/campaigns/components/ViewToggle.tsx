/**
 * ViewToggle - Toggle between Table and Kanban views
 */

import { LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ViewType = 'table' | 'kanban'

interface ViewToggleProps {
  value: ViewType
  onChange: (value: ViewType) => void
  className?: string
}

export function ViewToggle({ value, onChange, className }: ViewToggleProps) {
  return (
    <div className={cn('p-0.5 bg-muted/50 backdrop-blur-xl rounded-xl border border-white/10', className)}>
      <div className="flex">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 rounded-lg',
            value === 'table' && 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
          )}
          onClick={() => onChange('table')}
          title="Table view"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 rounded-lg',
            value === 'kanban' && 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
          )}
          onClick={() => onChange('kanban')}
          title="Kanban view"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
