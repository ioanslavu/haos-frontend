/**
 * InvoiceOriginTabs - Filter invoices by origin type (All/Campaigns/Distributions)
 */

import { cn } from '@/lib/utils'
import type { InvoiceOriginFilter } from '@/types/invoice'

interface InvoiceOriginTabsProps {
  value: InvoiceOriginFilter
  onChange: (value: InvoiceOriginFilter) => void
  counts?: {
    all: number
    campaigns: number
    distributions: number
  }
  className?: string
}

const tabs: { value: InvoiceOriginFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'campaigns', label: 'Campaigns' },
  { value: 'distributions', label: 'Distributions' },
]

export function InvoiceOriginTabs({ value, onChange, counts, className }: InvoiceOriginTabsProps) {
  return (
    <div className={cn('flex gap-1 p-1 bg-muted/50 backdrop-blur-xl rounded-xl border border-white/10', className)}>
      {tabs.map((tab) => {
        const count = counts?.[tab.value]
        const isActive = value === tab.value

        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-lg transition-all',
              'flex items-center gap-2',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            )}
          >
            {tab.label}
            {count !== undefined && (
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-md',
                isActive
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-background/50 text-muted-foreground'
              )}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
