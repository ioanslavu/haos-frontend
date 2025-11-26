/**
 * DistributionFiltersSheet - Right-side drawer for distribution filters
 *
 * Auto-applying filters with:
 * - Deal status selection
 * - Deal type selection
 * - Period presets + custom date range
 */

import { useMemo, useCallback, useRef, useEffect, useState, memo } from 'react'
import { Calendar as CalendarIcon, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { format } from 'date-fns'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { DistributionFilters, DealStatus, DealType } from '@/types/distribution'
import {
  DEAL_STATUS_CONFIG,
  DEAL_TYPE_CONFIG,
} from '@/types/distribution'

// Period preset helpers
function getDateRange(preset: string): { start: string; end: string } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const formatDate = (d: Date) => d.toISOString().split('T')[0]

  switch (preset) {
    case 'this_month': {
      const start = new Date(year, month, 1)
      const end = new Date(year, month + 1, 0)
      return { start: formatDate(start), end: formatDate(end) }
    }
    case 'last_month': {
      const start = new Date(year, month - 1, 1)
      const end = new Date(year, month, 0)
      return { start: formatDate(start), end: formatDate(end) }
    }
    case 'this_quarter': {
      const qStart = Math.floor(month / 3) * 3
      const start = new Date(year, qStart, 1)
      const end = new Date(year, qStart + 3, 0)
      return { start: formatDate(start), end: formatDate(end) }
    }
    case 'last_quarter': {
      const qStart = Math.floor(month / 3) * 3 - 3
      const start = new Date(year, qStart, 1)
      const end = new Date(year, qStart + 3, 0)
      return { start: formatDate(start), end: formatDate(end) }
    }
    case 'ytd': {
      const start = new Date(year, 0, 1)
      return { start: formatDate(start), end: formatDate(now) }
    }
    case 'last_year': {
      const start = new Date(year - 1, 0, 1)
      const end = new Date(year - 1, 11, 31)
      return { start: formatDate(start), end: formatDate(end) }
    }
    default:
      return { start: '', end: '' }
  }
}

const PERIOD_PRESETS = [
  { id: 'all', label: 'All Time' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'this_quarter', label: 'This Quarter' },
  { id: 'last_quarter', label: 'Last Quarter' },
  { id: 'ytd', label: 'Year to Date' },
  { id: 'last_year', label: 'Last Year' },
]

interface DistributionFiltersSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: DistributionFilters
  onFiltersChange: (filters: DistributionFilters) => void
}

export const DistributionFiltersSheet = memo(function DistributionFiltersSheet({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
}: DistributionFiltersSheetProps) {
  // Local state for immediate UI feedback
  const [localFilters, setLocalFilters] = useState<DistributionFilters>(filters)

  // Sync local state when filters prop changes
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  // Debounce filter changes
  const debounceRef = useRef<NodeJS.Timeout>()

  const debouncedFiltersChange = useCallback((newFilters: DistributionFilters) => {
    setLocalFilters(newFilters)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      onFiltersChange(newFilters)
    }, 300)
  }, [onFiltersChange])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  // Detect current period preset from local filters
  const selectedPeriod = useMemo(() => {
    if (!localFilters.signing_date_after && !localFilters.signing_date_before) return 'all'

    for (const preset of PERIOD_PRESETS) {
      if (preset.id === 'all') continue
      const { start, end } = getDateRange(preset.id)
      if (localFilters.signing_date_after === start && localFilters.signing_date_before === end) {
        return preset.id
      }
    }
    return 'custom'
  }, [localFilters.signing_date_after, localFilters.signing_date_before])

  const toggleStatus = (status: DealStatus) => {
    const currentStatuses = localFilters.deal_status || []
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status]

    if (newStatuses.length === 0) {
      const { deal_status: _, ...rest } = localFilters
      debouncedFiltersChange(rest)
    } else {
      debouncedFiltersChange({ ...localFilters, deal_status: newStatuses })
    }
  }

  const toggleType = (type: DealType) => {
    const currentTypes = localFilters.deal_type || []
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type]

    if (newTypes.length === 0) {
      const { deal_type: _, ...rest } = localFilters
      debouncedFiltersChange(rest)
    } else {
      debouncedFiltersChange({ ...localFilters, deal_type: newTypes })
    }
  }

  const handlePeriodSelect = (presetId: string) => {
    if (presetId === 'all') {
      const { signing_date_after, signing_date_before, ...rest } = localFilters
      debouncedFiltersChange(rest)
    } else if (presetId === 'custom') {
      // Keep current custom dates
    } else {
      const { start, end } = getDateRange(presetId)
      debouncedFiltersChange({
        ...localFilters,
        signing_date_after: start,
        signing_date_before: end,
      })
    }
  }

  const handleCustomDateChange = (field: 'start' | 'end', date: Date | undefined) => {
    const dateStr = date ? format(date, 'yyyy-MM-dd') : undefined
    if (field === 'start') {
      if (dateStr) {
        debouncedFiltersChange({ ...localFilters, signing_date_after: dateStr })
      } else {
        const { signing_date_after, ...rest } = localFilters
        debouncedFiltersChange(rest)
      }
    } else {
      if (dateStr) {
        debouncedFiltersChange({ ...localFilters, signing_date_before: dateStr })
      } else {
        const { signing_date_before, ...rest } = localFilters
        debouncedFiltersChange(rest)
      }
    }
  }

  const handleReset = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    setLocalFilters({})
    onFiltersChange({})
  }

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (localFilters.deal_status?.length) count++
    if (localFilters.deal_type?.length) count++
    if (localFilters.signing_date_after || localFilters.signing_date_before) count++
    return count
  }, [localFilters])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[340px] sm:max-w-[340px] flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-lg">Filters</SheetTitle>
                <SheetDescription className="text-xs">
                  Auto-applied as you select
                </SheetDescription>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="py-4 space-y-5">
            {/* Status Filter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Deal Status</Label>
                {localFilters.deal_status?.length ? (
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {localFilters.deal_status.length} selected
                  </Badge>
                ) : null}
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {Object.entries(DEAL_STATUS_CONFIG).map(([status, config]) => {
                  const isSelected = localFilters.deal_status?.includes(status as DealStatus)
                  return (
                    <button
                      key={status}
                      onClick={() => toggleStatus(status as DealStatus)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-left',
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border/60 hover:border-border hover:bg-muted/30'
                      )}
                    >
                      <span className={cn('h-2 w-2 rounded-full', config.dotColor)} />
                      <span className="text-sm font-medium">{config.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Deal Type Filter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Deal Type</Label>
                {localFilters.deal_type?.length ? (
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {localFilters.deal_type.length} selected
                  </Badge>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(DEAL_TYPE_CONFIG).map(([type, config]) => {
                  const isSelected = localFilters.deal_type?.includes(type as DealType)
                  return (
                    <button
                      key={type}
                      onClick={() => toggleType(type as DealType)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-left',
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border/60 hover:border-border hover:bg-muted/30'
                      )}
                    >
                      <span className="text-sm">{config.emoji}</span>
                      <span className="text-xs font-medium">{config.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Period Filter */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-sm font-medium">Signing Date</Label>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {PERIOD_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePeriodSelect(preset.id)}
                    className={cn(
                      'px-2 py-1.5 rounded-lg border text-xs font-medium transition-all',
                      selectedPeriod === preset.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/60 hover:border-border hover:bg-muted/30'
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  onClick={() => handlePeriodSelect('custom')}
                  className={cn(
                    'px-2 py-1.5 rounded-lg border text-xs font-medium transition-all',
                    selectedPeriod === 'custom'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/60 hover:border-border hover:bg-muted/30'
                  )}
                >
                  Custom
                </button>
              </div>

              {/* Custom date inputs */}
              {selectedPeriod === 'custom' && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Start</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full h-8 justify-start text-left text-xs font-normal rounded-lg',
                            !localFilters.signing_date_after && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-1.5 h-3 w-3" />
                          {localFilters.signing_date_after
                            ? format(new Date(localFilters.signing_date_after), 'MMM d, yyyy')
                            : 'Pick date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={localFilters.signing_date_after ? new Date(localFilters.signing_date_after) : undefined}
                          onSelect={(date) => handleCustomDateChange('start', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">End</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full h-8 justify-start text-left text-xs font-normal rounded-lg',
                            !localFilters.signing_date_before && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-1.5 h-3 w-3" />
                          {localFilters.signing_date_before
                            ? format(new Date(localFilters.signing_date_before), 'MMM d, yyyy')
                            : 'Pick date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={localFilters.signing_date_before ? new Date(localFilters.signing_date_before) : undefined}
                          onSelect={(date) => handleCustomDateChange('end', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
})
