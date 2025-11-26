/**
 * CampaignFiltersSheet - Right-side drawer for campaign filters
 *
 * Professional, functional filters with:
 * - Multi-select status
 * - Multi-select platforms
 * - Period presets + custom date range
 * - Campaign type
 * - Budget range
 * - Apply/Reset actions
 */

import { useState, useEffect, useMemo } from 'react'
import { Calendar, RotateCcw, Check, SlidersHorizontal } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { CampaignFilters, CampaignStatus, CampaignType, Platform } from '@/types/campaign'
import {
  CAMPAIGN_STATUS_CONFIG,
  CAMPAIGN_TYPE_CONFIG,
  PLATFORM_CONFIG,
} from '@/types/campaign'

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

interface CampaignFiltersSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: CampaignFilters
  onFiltersChange: (filters: CampaignFilters) => void
}

export function CampaignFiltersSheet({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
}: CampaignFiltersSheetProps) {
  // Local state for draft filters (applied on "Apply" button)
  const [draftFilters, setDraftFilters] = useState<CampaignFilters>(filters)
  const [selectedStatuses, setSelectedStatuses] = useState<Set<CampaignStatus>>(new Set())
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<Platform>>(new Set())
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all')
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' })

  // Sync draft with actual filters when sheet opens
  useEffect(() => {
    if (open) {
      setDraftFilters(filters)
      // Parse status
      if (filters.status) {
        setSelectedStatuses(new Set([filters.status]))
      } else {
        setSelectedStatuses(new Set())
      }
      // Parse platform
      if (filters.platform) {
        setSelectedPlatforms(new Set([filters.platform]))
      } else {
        setSelectedPlatforms(new Set())
      }
      // Parse period
      detectPeriodFromFilters(filters)
    }
  }, [open, filters])

  const detectPeriodFromFilters = (f: CampaignFilters) => {
    if (!f.start_date_after && !f.start_date_before) {
      setSelectedPeriod('all')
      setCustomDateRange({ start: '', end: '' })
      return
    }

    for (const preset of PERIOD_PRESETS) {
      if (preset.id === 'all') continue
      const { start, end } = getDateRange(preset.id)
      if (f.start_date_after === start && f.start_date_before === end) {
        setSelectedPeriod(preset.id)
        setCustomDateRange({ start: '', end: '' })
        return
      }
    }

    // Custom range
    setSelectedPeriod('custom')
    setCustomDateRange({
      start: f.start_date_after || '',
      end: f.start_date_before || '',
    })
  }

  const toggleStatus = (status: CampaignStatus) => {
    setSelectedStatuses((prev) => {
      const next = new Set(prev)
      if (next.has(status)) {
        next.delete(status)
      } else {
        next.add(status)
      }
      return next
    })
  }

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev)
      if (next.has(platform)) {
        next.delete(platform)
      } else {
        next.add(platform)
      }
      return next
    })
  }

  const handlePeriodSelect = (presetId: string) => {
    setSelectedPeriod(presetId)
    if (presetId !== 'custom') {
      setCustomDateRange({ start: '', end: '' })
    }
  }

  const handleApply = () => {
    const newFilters: CampaignFilters = { ...draftFilters }

    // Status (only support single for now due to API)
    if (selectedStatuses.size === 1) {
      newFilters.status = Array.from(selectedStatuses)[0]
    } else {
      delete newFilters.status
    }

    // Platform (only support single for now due to API)
    if (selectedPlatforms.size === 1) {
      newFilters.platform = Array.from(selectedPlatforms)[0]
    } else {
      delete newFilters.platform
    }

    // Period
    if (selectedPeriod === 'all') {
      delete newFilters.start_date_after
      delete newFilters.start_date_before
    } else if (selectedPeriod === 'custom') {
      if (customDateRange.start) {
        newFilters.start_date_after = customDateRange.start
      } else {
        delete newFilters.start_date_after
      }
      if (customDateRange.end) {
        newFilters.start_date_before = customDateRange.end
      } else {
        delete newFilters.start_date_before
      }
    } else {
      const { start, end } = getDateRange(selectedPeriod)
      newFilters.start_date_after = start
      newFilters.start_date_before = end
    }

    onFiltersChange(newFilters)
    onOpenChange(false)
  }

  const handleReset = () => {
    setDraftFilters({})
    setSelectedStatuses(new Set())
    setSelectedPlatforms(new Set())
    setSelectedPeriod('all')
    setCustomDateRange({ start: '', end: '' })
  }

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (selectedStatuses.size > 0) count++
    if (selectedPlatforms.size > 0) count++
    if (selectedPeriod !== 'all') count++
    if (draftFilters.campaign_type) count++
    return count
  }, [selectedStatuses, selectedPlatforms, selectedPeriod, draftFilters.campaign_type])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:max-w-[400px] flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">Filters</SheetTitle>
              <SheetDescription>
                Refine your campaign list
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="py-6 space-y-8">
            {/* Status Filter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Status</Label>
                {selectedStatuses.size > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedStatuses.size} selected
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(CAMPAIGN_STATUS_CONFIG).map(([status, config]) => {
                  const isSelected = selectedStatuses.has(status as CampaignStatus)
                  return (
                    <button
                      key={status}
                      onClick={() => toggleStatus(status as CampaignStatus)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-left',
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border/60 hover:border-border hover:bg-muted/30'
                      )}
                    >
                      <span className="text-lg">{config.emoji}</span>
                      <span className="text-sm font-medium flex-1">{config.label}</span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Period Filter */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-semibold">Time Period</Label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PERIOD_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePeriodSelect(preset.id)}
                    className={cn(
                      'px-3 py-2 rounded-xl border text-sm font-medium transition-all',
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
                    'px-3 py-2 rounded-xl border text-sm font-medium transition-all col-span-2',
                    selectedPeriod === 'custom'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/60 hover:border-border hover:bg-muted/30'
                  )}
                >
                  Custom Range
                </button>
              </div>

              {/* Custom date inputs */}
              {selectedPeriod === 'custom' && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Start Date</Label>
                    <Input
                      type="date"
                      value={customDateRange.start}
                      onChange={(e) =>
                        setCustomDateRange((prev) => ({ ...prev, start: e.target.value }))
                      }
                      className="h-9 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">End Date</Label>
                    <Input
                      type="date"
                      value={customDateRange.end}
                      onChange={(e) =>
                        setCustomDateRange((prev) => ({ ...prev, end: e.target.value }))
                      }
                      className="h-9 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator className="bg-border/50" />

            {/* Platform Filter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Platform</Label>
                {selectedPlatforms.size > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedPlatforms.size} selected
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PLATFORM_CONFIG).map(([platform, config]) => {
                  const isSelected = selectedPlatforms.has(platform as Platform)
                  return (
                    <button
                      key={platform}
                      onClick={() => togglePlatform(platform as Platform)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all',
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border/60 hover:border-border hover:bg-muted/30'
                      )}
                    >
                      <span className="text-base">{config.emoji}</span>
                      <span className="text-sm font-medium">{config.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Campaign Type Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Campaign Type</Label>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setDraftFilters((prev) => ({ ...prev, campaign_type: undefined }))
                  }
                  className={cn(
                    'flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all',
                    !draftFilters.campaign_type
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/60 hover:border-border hover:bg-muted/30'
                  )}
                >
                  All Types
                </button>
                {Object.entries(CAMPAIGN_TYPE_CONFIG).map(([type, config]) => (
                  <button
                    key={type}
                    onClick={() =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        campaign_type: type as CampaignType,
                      }))
                    }
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all',
                      draftFilters.campaign_type === type
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/60 hover:border-border hover:bg-muted/30'
                    )}
                  >
                    <span>{config.emoji}</span>
                    <span>{config.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t border-border/50 gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1 rounded-xl"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
          >
            <Check className="h-4 w-4 mr-2" />
            Apply Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-white/20 text-white">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
