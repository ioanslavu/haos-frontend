/**
 * InvoiceViewToggle - Toggle between Table, Grouped, and Kanban views
 */

import { List, Layers, Columns3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { InvoiceViewMode } from '@/types/invoice'

interface InvoiceViewToggleProps {
  value: InvoiceViewMode
  onChange: (value: InvoiceViewMode) => void
  className?: string
}

export function InvoiceViewToggle({ value, onChange, className }: InvoiceViewToggleProps) {
  return (
    <div className={cn('p-0.5 bg-muted/50 backdrop-blur-xl rounded-xl border border-white/10', className)}>
      <div className="flex">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 rounded-lg',
            value === 'table' && 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
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
            value === 'grouped' && 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
          )}
          onClick={() => onChange('grouped')}
          title="Grouped view"
        >
          <Layers className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 rounded-lg',
            value === 'kanban' && 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
          )}
          onClick={() => onChange('kanban')}
          title="Kanban view"
        >
          <Columns3 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
