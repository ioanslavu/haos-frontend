/**
 * InlineAddPlatform - Quick add platform form
 */

import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { PLATFORM_ICONS, PLATFORM_COLORS, PLATFORM_TEXT_COLORS } from '@/lib/platform-icons'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useCreateSubCampaign } from '@/api/hooks/useCampaigns'
import { cn } from '@/lib/utils'
import {
  PLATFORM_CONFIG,
  SERVICE_TYPE_CONFIG,
} from '@/types/campaign'
import { PLATFORMS, SERVICE_TYPE_GROUPS, type InlineAddPlatformProps, type Platform, type ServiceType } from './types'

export function InlineAddPlatform({ campaignId, onClose }: InlineAddPlatformProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null)
  const [platformOther, setPlatformOther] = useState('')

  const createSubCampaign = useCreateSubCampaign()

  const handleSubmit = async () => {
    if (!selectedPlatform || !selectedServiceType) return
    if (selectedPlatform === 'other' && !platformOther.trim()) return

    try {
      await createSubCampaign.mutateAsync({
        campaignId,
        data: {
          platform: selectedPlatform,
          platform_other: selectedPlatform === 'other' ? platformOther.trim() : undefined,
          service_type: selectedServiceType,
        },
      })
      // Reset and close
      setSelectedPlatform(null)
      setSelectedServiceType(null)
      setPlatformOther('')
      onClose?.()
    } catch {
      // Error handled by mutation
    }
  }

  const handleCancel = () => {
    setSelectedPlatform(null)
    setSelectedServiceType(null)
    setPlatformOther('')
    onClose?.()
  }

  const canSubmit =
    selectedPlatform &&
    selectedServiceType &&
    (selectedPlatform !== 'other' || platformOther.trim())

  return (
    <Card className="p-4 rounded-xl border-primary/20 bg-primary/5 backdrop-blur-sm">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Add new platform</p>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Platform Icons Row */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Platform</p>
          <div className="flex flex-wrap gap-1">
            {PLATFORMS.map((platform) => {
              const Icon = PLATFORM_ICONS[platform]
              const config = PLATFORM_CONFIG[platform]
              const isSelected = selectedPlatform === platform
              const brandColor = PLATFORM_COLORS[platform]
              const textColor = PLATFORM_TEXT_COLORS[platform]

              return (
                <button
                  key={platform}
                  type="button"
                  onClick={() => {
                    setSelectedPlatform(platform)
                    if (platform !== 'other') {
                      setPlatformOther('')
                    }
                  }}
                  title={config.label}
                  className={cn(
                    'p-2 rounded-lg border transition-all',
                    textColor,
                    isSelected
                      ? brandColor?.replace(textColor, '') || 'bg-primary/10 border-primary/30'
                      : 'border-transparent hover:bg-muted/50'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </button>
              )
            })}
          </div>
          {/* Other Platform Input */}
          {selectedPlatform === 'other' && (
            <Input
              placeholder="Enter platform name..."
              value={platformOther}
              onChange={(e) => setPlatformOther(e.target.value)}
              className="h-8 max-w-xs mt-2 text-sm"
              autoFocus
            />
          )}
        </div>

        {/* Service Type Selection */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Service type</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {SERVICE_TYPE_GROUPS.map((group) => (
              <div key={group.label} className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground/60 mr-1">{group.label}:</span>
                {group.types.map((type) => {
                  const config = SERVICE_TYPE_CONFIG[type]
                  const isSelected = selectedServiceType === type
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedServiceType(type)}
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium transition-all',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {config.label.replace(' Advertising', '').replace(' Marketing', '').replace(' Campaign', '').replace(' Distribution', '').replace(' Optimization', '').replace(' Pitching', '').replace(' Plugging', '').replace(' Creation', '').replace(' Content', '').replace(' Management', '')}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Add Button */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit || createSubCampaign.isPending}
          >
            {createSubCampaign.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Add Platform'
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}
