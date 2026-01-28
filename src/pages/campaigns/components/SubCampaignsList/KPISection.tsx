/**
 * KPISection - KPI targets management for subcampaigns
 */

import { useState } from 'react'
import { Plus, Target, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useUpdateSubCampaign } from '@/api/hooks/useCampaigns'
import {
  KPI_CONFIG,
  KPI_CATEGORIES,
  PLATFORM_DEFAULT_KPIS,
} from '@/types/campaign'
import type { KPISectionProps, KPIType } from './types'

function formatKPIValue(value: number, unit: string) {
  if (unit === 'percent') return `${value}%`
  if (unit === 'currency') return `${value.toLocaleString()}`
  if (unit === 'minutes') return `${value.toLocaleString()} min`
  return value.toLocaleString()
}

export function KPISection({ subcampaign, campaignId }: KPISectionProps) {
  const [showAddKPI, setShowAddKPI] = useState(false)
  const [editingKPI, setEditingKPI] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const updateSubCampaign = useUpdateSubCampaign()

  const kpiTargets = subcampaign.kpi_targets || {}
  const kpiEntries = Object.entries(kpiTargets)

  // Get suggested KPIs for this platform
  const suggestedKPIs = PLATFORM_DEFAULT_KPIS[subcampaign.platform] || []
  const existingKPIKeys = Object.keys(kpiTargets)
  const availableKPIs = Object.keys(KPI_CONFIG).filter(
    (kpi) => !existingKPIKeys.includes(kpi)
  ) as KPIType[]

  const handleAddKPI = async (kpiType: KPIType) => {
    const config = KPI_CONFIG[kpiType]
    const newTargets = {
      ...kpiTargets,
      [kpiType]: { target: 0, unit: config.unit },
    }
    try {
      await updateSubCampaign.mutateAsync({
        campaignId,
        subCampaignId: subcampaign.id,
        data: { kpi_targets: newTargets },
      })
      setShowAddKPI(false)
      // Start editing the new KPI immediately
      setEditingKPI(kpiType)
      setEditValue('0')
    } catch {
      // Error handled by mutation
    }
  }

  const handleUpdateKPI = async (kpiType: string, newTarget: number) => {
    const currentKPI = kpiTargets[kpiType]
    if (!currentKPI) return

    const newTargets = {
      ...kpiTargets,
      [kpiType]: { ...currentKPI, target: newTarget },
    }
    try {
      await updateSubCampaign.mutateAsync({
        campaignId,
        subCampaignId: subcampaign.id,
        data: { kpi_targets: newTargets },
      })
      setEditingKPI(null)
    } catch {
      // Error handled by mutation
    }
  }

  const handleDeleteKPI = async (kpiType: string) => {
    const newTargets = { ...kpiTargets }
    delete newTargets[kpiType]
    try {
      await updateSubCampaign.mutateAsync({
        campaignId,
        subCampaignId: subcampaign.id,
        data: { kpi_targets: newTargets },
      })
    } catch {
      // Error handled by mutation
    }
  }

  return (
    <div className="pt-4 mt-4 border-t border-white/5">
      <div className="flex items-center justify-between mb-3">
        <h5 className="text-sm font-medium flex items-center gap-2">
          <Target className="h-4 w-4" />
          KPI Targets
        </h5>
        <Popover open={showAddKPI} onOpenChange={setShowAddKPI}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Add KPI
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="end">
            <div className="space-y-2">
              {/* Suggested KPIs for this platform */}
              {suggestedKPIs.filter(kpi => !existingKPIKeys.includes(kpi)).length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground px-2 py-1">Suggested</p>
                  <div className="flex flex-wrap gap-1">
                    {suggestedKPIs
                      .filter(kpi => !existingKPIKeys.includes(kpi))
                      .map(kpi => (
                        <button
                          key={kpi}
                          onClick={() => handleAddKPI(kpi)}
                          className="px-2 py-1 text-xs rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          {KPI_CONFIG[kpi].label}
                        </button>
                      ))}
                  </div>
                </div>
              )}
              {/* All KPIs by category */}
              {KPI_CATEGORIES.map(category => {
                const availableInCategory = category.kpis.filter(
                  kpi => !existingKPIKeys.includes(kpi)
                )
                if (availableInCategory.length === 0) return null
                return (
                  <div key={category.key}>
                    <p className="text-xs text-muted-foreground px-2 py-1">{category.label}</p>
                    <div className="flex flex-wrap gap-1">
                      {availableInCategory.map(kpi => (
                        <button
                          key={kpi}
                          onClick={() => handleAddKPI(kpi)}
                          className="px-2 py-1 text-xs rounded-md bg-muted hover:bg-muted/80 transition-colors"
                        >
                          {KPI_CONFIG[kpi].label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
              {availableKPIs.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  All KPIs have been added
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {kpiEntries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No KPI targets set. Click "Add KPI" to set performance targets.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {kpiEntries.map(([kpiType, kpiData]) => {
            const config = KPI_CONFIG[kpiType as KPIType]
            if (!config) return null

            const isEditing = editingKPI === kpiType

            return (
              <div
                key={kpiType}
                className="group relative p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => {
                  if (!isEditing) {
                    setEditingKPI(kpiType)
                    setEditValue(String(kpiData.target))
                  }
                }}
              >
                <p className="text-xs text-muted-foreground mb-1">{config.label}</p>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={() => {
                      const num = parseFloat(editValue) || 0
                      handleUpdateKPI(kpiType, num)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const num = parseFloat(editValue) || 0
                        handleUpdateKPI(kpiType, num)
                      }
                      if (e.key === 'Escape') {
                        setEditingKPI(null)
                      }
                    }}
                    className="h-7 text-sm"
                    autoFocus
                  />
                ) : (
                  <p className="font-semibold text-sm">
                    {formatKPIValue(kpiData.target, kpiData.unit)}
                  </p>
                )}
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteKPI(kpiType)
                  }}
                  className="absolute top-1 right-1 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                  title="Remove KPI"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
