/**
 * InlineDeliverableAdd - Inline form for adding deliverables to an opportunity
 *
 * Matches the Campaign's InlineAddPlatform pattern exactly:
 * - Clean card with primary border tint
 * - Visual icon + text selection grouped by category
 * - Simple clean UI
 */

import { useState } from 'react'
import {
  X,
  Loader2,
} from 'lucide-react'
import {
  SiInstagram,
  SiTiktok,
  SiYoutube,
} from 'react-icons/si'
import {
  HiTv,
  HiMegaphone,
  HiMicrophone,
  HiPhoto,
  HiGlobeAlt,
  HiSignal,
  HiNewspaper,
  HiComputerDesktop,
  HiBuildingStorefront,
  HiCube,
} from 'react-icons/hi2'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCreateOpportunityDeliverable } from '@/api/hooks/useOpportunities'
import { cn } from '@/lib/utils'
import type { DeliverableType } from '@/types/opportunities'

interface InlineDeliverableAddProps {
  opportunityId: number
  onClose: () => void
  onSuccess?: (deliverableId: number) => void
}

// Deliverable type config with icons and colors
const DELIVERABLE_ICON_CONFIG: Record<DeliverableType, {
  icon: React.ComponentType<{ className?: string }>
  label: string
  textColor: string
}> = {
  ig_post: { icon: SiInstagram, label: 'Post', textColor: 'text-[#E4405F]' },
  ig_story: { icon: SiInstagram, label: 'Story', textColor: 'text-[#E4405F]' },
  ig_reel: { icon: SiInstagram, label: 'Reel', textColor: 'text-[#E4405F]' },
  tiktok_video: { icon: SiTiktok, label: 'TikTok', textColor: 'text-foreground' },
  youtube_video: { icon: SiYoutube, label: 'YouTube', textColor: 'text-[#FF0000]' },
  youtube_short: { icon: SiYoutube, label: 'Short', textColor: 'text-[#FF0000]' },
  tvc: { icon: HiTv, label: 'TVC', textColor: 'text-blue-500' },
  radio_spot: { icon: HiMegaphone, label: 'Radio', textColor: 'text-amber-500' },
  event: { icon: HiMicrophone, label: 'Event', textColor: 'text-purple-500' },
  ooh: { icon: HiBuildingStorefront, label: 'OOH', textColor: 'text-emerald-500' },
  billboard: { icon: HiPhoto, label: 'Billboard', textColor: 'text-cyan-500' },
  packaging: { icon: HiCube, label: 'Packaging', textColor: 'text-orange-500' },
  print_ad: { icon: HiNewspaper, label: 'Print', textColor: 'text-stone-500' },
  digital_banner: { icon: HiComputerDesktop, label: 'Banner', textColor: 'text-indigo-500' },
  podcast: { icon: HiMicrophone, label: 'Podcast', textColor: 'text-violet-500' },
  livestream: { icon: HiSignal, label: 'Live', textColor: 'text-red-500' },
  other: { icon: HiGlobeAlt, label: 'Other', textColor: 'text-muted-foreground' },
}

// Deliverable type groups for organized display (like service type groups in campaigns)
const DELIVERABLE_GROUPS = [
  { label: 'Social', types: ['ig_post', 'ig_story', 'ig_reel', 'tiktok_video'] as DeliverableType[] },
  { label: 'Video', types: ['youtube_video', 'youtube_short', 'tvc', 'livestream'] as DeliverableType[] },
  { label: 'Audio', types: ['radio_spot', 'podcast'] as DeliverableType[] },
  { label: 'Print/OOH', types: ['ooh', 'billboard', 'print_ad', 'digital_banner'] as DeliverableType[] },
  { label: 'Other', types: ['event', 'packaging', 'other'] as DeliverableType[] },
]

export function InlineDeliverableAdd({
  opportunityId,
  onClose,
  onSuccess,
}: InlineDeliverableAddProps) {
  const createDeliverable = useCreateOpportunityDeliverable()

  const handleAddDeliverable = async (type: DeliverableType) => {
    try {
      const result = await createDeliverable.mutateAsync({
        opportunity: opportunityId,
        deliverable_type: type,
        quantity: 1,
      })
      onSuccess?.(result.id)
      onClose()
    } catch {
      // Error handled by mutation
    }
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <Card className="p-4 rounded-xl border-primary/20 bg-primary/5 backdrop-blur-sm">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Select deliverable type</p>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Deliverable Type Selection - Grouped icon + text buttons */}
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {DELIVERABLE_GROUPS.map((group) => (
            <div key={group.label} className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground/60 mr-1">{group.label}:</span>
              {group.types.map((type) => {
                const config = DELIVERABLE_ICON_CONFIG[type]
                const Icon = config.icon
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleAddDeliverable(type)}
                    disabled={createDeliverable.isPending}
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all border',
                      config.textColor,
                      'border-transparent hover:border-current/20 hover:bg-current/5'
                    )}
                  >
                    {createDeliverable.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                    {config.label}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
