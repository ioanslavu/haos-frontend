/**
 * CampaignFiltersPanel - Collapsible filter sidebar for campaigns
 *
 * Filters:
 * - Status (multi-select)
 * - Campaign type (internal/external)
 * - Period (quick presets + custom range)
 * - Platform filter
 */

import { useState, useMemo } from 'react'
import { Calendar, ChevronDown, Filter, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import type { CampaignFilters, CampaignStatus, CampaignType, Platform } from '@/types/campaign'
import {
  CAMPAIGN_STATUS_CONFIG,
  CAMPAIGN_TYPE_CONFIG,
  PLATFORM_CONFIG,
  ACTIVE_STATUSES,
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
    case 'q1': {
      const start = new Date(year, 0, 1)
      const end = new Date(year, 2, 31)
      return { start: formatDate(start), end: formatDate(end) }
    }
    case 'q2': {
      const start = new Date(year, 3, 1)
      const end = new Date(year, 5, 30)
      return { start: formatDate(start), end: formatDate(end) }
    }
    case 'q3': {
      const start = new Date(year, 6, 1)
      const end = new Date(year, 8, 30)
      return { start: formatDate(start), end: formatDate(end) }
    }
    case 'q4': {
      const start = new Date(year, 9, 1)
      const end = new Date(year, 11, 31)
      return { start: formatDate(start), end: formatDate(end) }
    }
    default:
      return { start: '', end: '' }
  }
}

interface CampaignFiltersPanelProps {
  filters: CampaignFilters
  onFiltersChange: (filters: CampaignFilters) => void
  onClose?: () => void
  className?: string
}

export function CampaignFiltersPanel({
  filters,
  onFiltersChange,
  onClose,
  className,
}: CampaignFiltersPanelProps) {
  const [openSections, setOpenSections] = useState({
    status: true,
    type: false,
    period: true,
    platform: true,
  })
  const [showCustomDates, setShowCustomDates] = useState(false)

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const handleStatusToggle = (status: CampaignStatus) => {
    const currentStatuses = filters.status ? [filters.status] : []
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status]

    onFiltersChange({
      ...filters,
      status: newStatuses.length === 1 ? newStatuses[0] : undefined,
    })
  }

  const handleTypeChange = (type: CampaignType | undefined) => {
    onFiltersChange({
      ...filters,
      campaign_type: type,
    })
  }

  const handlePlatformToggle = (platform: Platform) => {
    const currentPlatforms = filters.platform ? [filters.platform] : []
    const newPlatforms = currentPlatforms.includes(platform)
      ? currentPlatforms.filter((p) => p !== platform)
      : [...currentPlatforms, platform]

    onFiltersChange({
      ...filters,
      platform: newPlatforms.length === 1 ? newPlatforms[0] : undefined,
    })
  }

  const handleDateChange = (field: 'start_date_after' | 'start_date_before' | 'end_date_after' | 'end_date_before', value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value || undefined,
    })
  }

  const handlePeriodPreset = (preset: string) => {
    if (preset === 'all') {
      // Clear period filters
      const { start_date_after, start_date_before, end_date_after, end_date_before, ...rest } = filters
      onFiltersChange(rest)
      setShowCustomDates(false)
    } else if (preset === 'custom') {
      setShowCustomDates(true)
    } else {
      const { start, end } = getDateRange(preset)
      onFiltersChange({
        ...filters,
        start_date_after: start,
        start_date_before: end,
      })
      setShowCustomDates(false)
    }
  }

  // Detect current period preset
  const currentPeriodPreset = useMemo(() => {
    if (!filters.start_date_after && !filters.start_date_before) return 'all'

    const presets = ['this_month', 'last_month', 'this_quarter', 'last_quarter', 'ytd', 'q1', 'q2', 'q3', 'q4']
    for (const preset of presets) {
      const { start, end } = getDateRange(preset)
      if (filters.start_date_after === start && filters.start_date_before === end) {
        return preset
      }
    }
    return 'custom'
  }, [filters.start_date_after, filters.start_date_before])

  const clearFilters = () => {
    onFiltersChange({})
    setShowCustomDates(false)
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-background/50 backdrop-blur-sm p-4 space-y-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 px-2 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Status Filter */}
      <Collapsible open={openSections.status} onOpenChange={() => toggleSection('status')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors">
          <span>Status</span>
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform',
              openSections.status && 'rotate-180'
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          {/* Quick filters */}
          <div className="flex gap-1 mb-2">
            <Button
              variant={!filters.status ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7 flex-1 rounded-lg"
              onClick={() => onFiltersChange({ ...filters, status: undefined })}
            >
              All
            </Button>
            <Button
              variant={filters.status && ACTIVE_STATUSES.includes(filters.status) ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7 flex-1 rounded-lg"
              onClick={() => onFiltersChange({ ...filters, status: 'active' })}
            >
              Active
            </Button>
          </div>

          {/* Individual statuses */}
          <div className="space-y-1">
            {Object.entries(CAMPAIGN_STATUS_CONFIG).map(([status, config]) => (
              <label
                key={status}
                className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={filters.status === status}
                  onCheckedChange={() => handleStatusToggle(status as CampaignStatus)}
                  className="h-4 w-4"
                />
                <span className="text-lg">{config.emoji}</span>
                <span className="text-sm flex-1">{config.label}</span>
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Period Filter */}
      <Collapsible open={openSections.period} onOpenChange={() => toggleSection('period')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Period
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform',
              openSections.period && 'rotate-180'
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          {/* Quick presets */}
          <div className="grid grid-cols-2 gap-1.5">
            <Button
              variant={currentPeriodPreset === 'all' ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7 rounded-lg"
              onClick={() => handlePeriodPreset('all')}
            >
              All Time
            </Button>
            <Button
              variant={currentPeriodPreset === 'this_month' ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7 rounded-lg"
              onClick={() => handlePeriodPreset('this_month')}
            >
              This Month
            </Button>
            <Button
              variant={currentPeriodPreset === 'last_month' ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7 rounded-lg"
              onClick={() => handlePeriodPreset('last_month')}
            >
              Last Month
            </Button>
            <Button
              variant={currentPeriodPreset === 'this_quarter' ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7 rounded-lg"
              onClick={() => handlePeriodPreset('this_quarter')}
            >
              This Quarter
            </Button>
            <Button
              variant={currentPeriodPreset === 'ytd' ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7 rounded-lg"
              onClick={() => handlePeriodPreset('ytd')}
            >
              YTD
            </Button>
            <Button
              variant={currentPeriodPreset === 'custom' || showCustomDates ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7 rounded-lg"
              onClick={() => handlePeriodPreset('custom')}
            >
              Custom
            </Button>
          </div>

          {/* Quarter shortcuts */}
          <div className="flex gap-1">
            {['q1', 'q2', 'q3', 'q4'].map((q) => (
              <Button
                key={q}
                variant={currentPeriodPreset === q ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-6 flex-1 rounded-lg"
                onClick={() => handlePeriodPreset(q)}
              >
                {q.toUpperCase()}
              </Button>
            ))}
          </div>

          {/* Custom date inputs */}
          {(showCustomDates || currentPeriodPreset === 'custom') && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input
                    type="date"
                    value={filters.start_date_after || ''}
                    onChange={(e) => handleDateChange('start_date_after', e.target.value)}
                    className="h-8 text-xs rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={filters.start_date_before || ''}
                    onChange={(e) => handleDateChange('start_date_before', e.target.value)}
                    className="h-8 text-xs rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Platform Filter */}
      <Collapsible open={openSections.platform} onOpenChange={() => toggleSection('platform')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors">
          <span>Platform</span>
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform',
              openSections.platform && 'rotate-180'
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(PLATFORM_CONFIG).map(([platform, config]) => (
              <Button
                key={platform}
                variant={filters.platform === platform ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  "text-xs h-7 rounded-lg gap-1",
                  filters.platform === platform && "bg-primary"
                )}
                onClick={() => handlePlatformToggle(platform as Platform)}
              >
                <span>{config.emoji}</span>
                <span className="hidden sm:inline">{config.label}</span>
              </Button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Campaign Type Filter */}
      <Collapsible open={openSections.type} onOpenChange={() => toggleSection('type')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors">
          <span>Campaign Type</span>
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform',
              openSections.type && 'rotate-180'
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="flex gap-1.5">
            <Button
              variant={!filters.campaign_type ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7 rounded-lg flex-1"
              onClick={() => handleTypeChange(undefined)}
            >
              All
            </Button>
            {Object.entries(CAMPAIGN_TYPE_CONFIG).map(([type, config]) => (
              <Button
                key={type}
                variant={filters.campaign_type === type ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-7 rounded-lg flex-1 gap-1"
                onClick={() => handleTypeChange(type as CampaignType)}
              >
                <span>{config.emoji}</span>
                {config.label}
              </Button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
