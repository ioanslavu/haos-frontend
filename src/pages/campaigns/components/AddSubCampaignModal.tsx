/**
 * AddSubCampaignModal - Quick platform picker
 *
 * Compact two-column layout: Platform (left) + Service Type (right)
 */

import { useState } from 'react'
import { Loader2, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useCreateSubCampaign } from '@/api/hooks/useCampaigns'
import type { Platform, ServiceType } from '@/types/campaign'
import { PLATFORM_CONFIG, SERVICE_TYPE_CONFIG } from '@/types/campaign'

interface AddSubCampaignModalProps {
  campaignId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Platforms in display order
const PLATFORMS: Platform[] = [
  'spotify', 'apple_music', 'youtube', 'tiktok', 'meta',
  'google', 'amazon_music', 'deezer', 'soundcloud',
  'twitter', 'snapchat', 'pinterest', 'linkedin', 'other',
]

// Service types grouped
const SERVICE_GROUPS = [
  { label: 'Ads', types: ['ppc', 'dsp'] as ServiceType[] },
  { label: 'Content', types: ['content', 'ugc', 'social'] as ServiceType[] },
  { label: 'Promo', types: ['influencer', 'playlist', 'pr', 'radio'] as ServiceType[] },
  { label: 'Other', types: ['email', 'seo', 'other'] as ServiceType[] },
]

export function AddSubCampaignModal({
  campaignId,
  open,
  onOpenChange,
}: AddSubCampaignModalProps) {
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
      handleClose()
    } catch {
      // Error handled by mutation
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(() => {
      setSelectedPlatform(null)
      setSelectedServiceType(null)
      setPlatformOther('')
    }, 200)
  }

  const canSubmit =
    selectedPlatform &&
    selectedServiceType &&
    (selectedPlatform !== 'other' || platformOther.trim())

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Platform</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-2">
          {/* Left: Platform */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Platform
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {PLATFORMS.map((platform) => {
                const config = PLATFORM_CONFIG[platform]
                const isSelected = selectedPlatform === platform
                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => setSelectedPlatform(platform)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 rounded-lg border text-center transition-all',
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-transparent hover:bg-muted/50'
                    )}
                  >
                    <span className="text-lg">{config.emoji}</span>
                    <span className="text-[10px] font-medium leading-tight truncate w-full">
                      {config.label.replace(' Music', '')}
                    </span>
                  </button>
                )
              })}
            </div>
            {selectedPlatform === 'other' && (
              <Input
                placeholder="Platform name..."
                value={platformOther}
                onChange={(e) => setPlatformOther(e.target.value)}
                className="mt-2 h-8 text-sm"
                autoFocus
              />
            )}
          </div>

          {/* Right: Service Type */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Service Type
            </p>
            <div className="space-y-3">
              {SERVICE_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="text-[10px] text-muted-foreground mb-1.5">{group.label}</p>
                  <div className="flex flex-wrap gap-1">
                    {group.types.map((type) => {
                      const config = SERVICE_TYPE_CONFIG[type]
                      const isSelected = selectedServiceType === type
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setSelectedServiceType(type)}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium transition-all',
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-transparent hover:bg-muted/50'
                          )}
                        >
                          <span>{config.emoji}</span>
                          <span>{config.label.replace(' Marketing', '').replace(' Campaign', '').replace(' Optimization', '')}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selection Summary & Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedPlatform && selectedServiceType ? (
              <span>
                {PLATFORM_CONFIG[selectedPlatform].emoji}{' '}
                {selectedPlatform === 'other' && platformOther ? platformOther : PLATFORM_CONFIG[selectedPlatform].label}
                {' · '}
                {SERVICE_TYPE_CONFIG[selectedServiceType].label}
              </span>
            ) : (
              <span className="text-muted-foreground/50">Select platform & service</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleClose}>
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
                'Add'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
