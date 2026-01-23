/**
 * OpportunityFiltersSheet - Right-side drawer for filtering opportunities
 *
 * Filter types:
 * - Stage multi-select
 * - Priority multi-select
 * - Period presets + custom date range
 * - Value range
 * - Owner filter
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subMonths,
  subQuarters,
  subYears,
  format,
} from 'date-fns'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  OpportunityFilters,
  OpportunityStage,
  OpportunityPriority,
  PeriodPreset,
} from '@/types/opportunities'
import {
  STAGE_CONFIG,
  PRIORITY_CONFIG,
  PERIOD_PRESETS,
  ACTIVE_STAGES,
} from '@/types/opportunities'

interface OpportunityFiltersSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: OpportunityFilters
  onFiltersChange: (filters: OpportunityFilters) => void
}

// Get date range for period preset
function getDateRange(preset: PeriodPreset): { start: string; end: string } | null {
  const now = new Date()

  switch (preset) {
    case 'this_month':
      return {
        start: format(startOfMonth(now), 'yyyy-MM-dd'),
        end: format(endOfMonth(now), 'yyyy-MM-dd'),
      }
    case 'last_month':
      const lastMonth = subMonths(now, 1)
      return {
        start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
        end: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
      }
    case 'this_quarter':
      return {
        start: format(startOfQuarter(now), 'yyyy-MM-dd'),
        end: format(endOfQuarter(now), 'yyyy-MM-dd'),
      }
    case 'last_quarter':
      const lastQuarter = subQuarters(now, 1)
      return {
        start: format(startOfQuarter(lastQuarter), 'yyyy-MM-dd'),
        end: format(endOfQuarter(lastQuarter), 'yyyy-MM-dd'),
      }
    case 'this_year':
      return {
        start: format(startOfYear(now), 'yyyy-MM-dd'),
        end: format(endOfYear(now), 'yyyy-MM-dd'),
      }
    case 'last_year':
      const lastYear = subYears(now, 1)
      return {
        start: format(startOfYear(lastYear), 'yyyy-MM-dd'),
        end: format(endOfYear(lastYear), 'yyyy-MM-dd'),
      }
    default:
      return null
  }
}

export function OpportunityFiltersSheet({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
}: OpportunityFiltersSheetProps) {
  const [localFilters, setLocalFilters] = useState<OpportunityFilters>(filters)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Sync local state when external filters change
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  // Debounced filter update
  const debouncedFiltersChange = useCallback((newFilters: OpportunityFilters) => {
    setLocalFilters(newFilters)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onFiltersChange(newFilters)
    }, 300)
  }, [onFiltersChange])

  // Detect selected period preset
  const selectedPeriod = useMemo(() => {
    for (const preset of PERIOD_PRESETS) {
      if (preset.id === 'all' || preset.id === 'custom') continue
      const range = getDateRange(preset.id)
      if (
        range &&
        filters.expected_close_date_after === range.start &&
        filters.expected_close_date_before === range.end
      ) {
        return preset.id
      }
    }
    if (filters.expected_close_date_after || filters.expected_close_date_before) {
      return 'custom'
    }
    return 'all'
  }, [filters])

  const handleStageToggle = (stage: OpportunityStage) => {
    const currentStages = localFilters.stage || []
    const newStages = currentStages.includes(stage)
      ? currentStages.filter(s => s !== stage)
      : [...currentStages, stage]

    debouncedFiltersChange({
      ...localFilters,
      stage: newStages.length > 0 ? newStages : undefined,
    })
  }

  const handlePriorityToggle = (priority: OpportunityPriority) => {
    const currentPriorities = localFilters.priority || []
    const newPriorities = currentPriorities.includes(priority)
      ? currentPriorities.filter(p => p !== priority)
      : [...currentPriorities, priority]

    debouncedFiltersChange({
      ...localFilters,
      priority: newPriorities.length > 0 ? newPriorities : undefined,
    })
  }

  const handlePeriodSelect = (preset: PeriodPreset) => {
    if (preset === 'all') {
      debouncedFiltersChange({
        ...localFilters,
        expected_close_date_after: undefined,
        expected_close_date_before: undefined,
      })
    } else if (preset === 'custom') {
      // Don't change dates, just let user pick custom
    } else {
      const range = getDateRange(preset)
      if (range) {
        debouncedFiltersChange({
          ...localFilters,
          expected_close_date_after: range.start,
          expected_close_date_before: range.end,
        })
      }
    }
  }

  const handleDateChange = (type: 'start' | 'end', date: Date | undefined) => {
    if (date) {
      debouncedFiltersChange({
        ...localFilters,
        [type === 'start' ? 'expected_close_date_after' : 'expected_close_date_before']:
          format(date, 'yyyy-MM-dd'),
      })
    }
  }

  const clearAllFilters = () => {
    onFiltersChange({})
    setLocalFilters({})
  }

  const hasFilters = Object.keys(localFilters).some(key => {
    const value = localFilters[key as keyof OpportunityFilters]
    return value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true)
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 sm:w-96">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Filters</SheetTitle>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs text-muted-foreground"
              >
                Clear all
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Stage Filter */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Stage</Label>
            <div className="flex flex-wrap gap-2">
              {ACTIVE_STAGES.map(stage => {
                const config = STAGE_CONFIG[stage]
                const isSelected = localFilters.stage?.includes(stage)

                return (
                  <button
                    key={stage}
                    onClick={() => handleStageToggle(stage)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <span>{config.emoji}</span>
                    <span>{config.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Priority</Label>
            <div className="flex flex-wrap gap-2">
              {(['low', 'medium', 'high', 'urgent'] as OpportunityPriority[]).map(priority => {
                const config = PRIORITY_CONFIG[priority]
                const isSelected = localFilters.priority?.includes(priority)

                return (
                  <button
                    key={priority}
                    onClick={() => handlePriorityToggle(priority)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
                      priority === 'urgent' && isSelected && 'bg-red-500',
                      priority === 'high' && isSelected && 'bg-orange-500'
                    )}
                  >
                    <span className={cn(
                      'h-2 w-2 rounded-full',
                      config.color
                    )} />
                    <span>{config.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Period Filter */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Expected Close Date</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {PERIOD_PRESETS.filter(p => p.id !== 'custom').map(preset => {
                const isSelected = selectedPeriod === preset.id

                return (
                  <button
                    key={preset.id}
                    onClick={() => handlePeriodSelect(preset.id)}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>

            {/* Custom Date Range */}
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'justify-start text-left font-normal flex-1',
                      !localFilters.expected_close_date_after && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.expected_close_date_after
                      ? format(new Date(localFilters.expected_close_date_after), 'MMM dd, yyyy')
                      : 'From'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      localFilters.expected_close_date_after
                        ? new Date(localFilters.expected_close_date_after)
                        : undefined
                    }
                    onSelect={(date) => handleDateChange('start', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <span className="text-muted-foreground">-</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'justify-start text-left font-normal flex-1',
                      !localFilters.expected_close_date_before && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.expected_close_date_before
                      ? format(new Date(localFilters.expected_close_date_before), 'MMM dd, yyyy')
                      : 'To'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      localFilters.expected_close_date_before
                        ? new Date(localFilters.expected_close_date_before)
                        : undefined
                    }
                    onSelect={(date) => handleDateChange('end', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasFilters && (
            <div className="pt-4 border-t border-white/10">
              <Label className="text-sm font-medium mb-3 block">Active Filters</Label>
              <div className="flex flex-wrap gap-2">
                {localFilters.stage?.map(stage => (
                  <Badge
                    key={stage}
                    variant="secondary"
                    className="gap-1"
                  >
                    {STAGE_CONFIG[stage].emoji} {STAGE_CONFIG[stage].label}
                    <button
                      onClick={() => handleStageToggle(stage)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {localFilters.priority?.map(priority => (
                  <Badge
                    key={priority}
                    variant="secondary"
                    className="gap-1"
                  >
                    {PRIORITY_CONFIG[priority].label}
                    <button
                      onClick={() => handlePriorityToggle(priority)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {(localFilters.expected_close_date_after || localFilters.expected_close_date_before) && (
                  <Badge variant="secondary" className="gap-1">
                    Date range
                    <button
                      onClick={() => handlePeriodSelect('all')}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
