/**
 * StatusFlow - Campaign status workflow visualization
 */

import { Check, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CampaignStatus } from '@/types/campaign'
import { CAMPAIGN_STATUS_CONFIG, STATUS_FLOW } from '@/types/campaign'

interface StatusFlowProps {
  campaign: any
  currentStatusIndex: number
  isTerminalStatus: boolean
  canTransitionTo: (status: CampaignStatus) => boolean
  setShowStatusConfirm: (status: CampaignStatus | null) => void
}

export function StatusFlow({
  campaign,
  currentStatusIndex,
  isTerminalStatus,
  canTransitionTo,
  setShowStatusConfirm,
}: StatusFlowProps) {
  const statusConfig = CAMPAIGN_STATUS_CONFIG[campaign.status]

  return (
    <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-xl">
      {isTerminalStatus ? (
        <Badge
          className={cn(
            'text-xs px-3 py-1.5',
            statusConfig.bgColor,
            statusConfig.color
          )}
        >
          {statusConfig.emoji} {statusConfig.label}
        </Badge>
      ) : (
        STATUS_FLOW.map((status, index) => {
          const config = CAMPAIGN_STATUS_CONFIG[status]
          const isCompleted = index < currentStatusIndex
          const isCurrent = status === campaign.status
          const isClickable = canTransitionTo(status) && !isCurrent

          return (
            <div key={status} className="flex items-center">
              <button
                onClick={() => isClickable && setShowStatusConfirm(status)}
                disabled={!isClickable}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                  isCurrent && 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md',
                  isCompleted && 'bg-primary/10 text-primary',
                  !isCompleted && !isCurrent && 'text-muted-foreground/60',
                  isClickable && !isCurrent && 'cursor-pointer hover:bg-muted/50'
                )}
                title={isClickable ? `Click to change to ${config.label}` : config.label}
              >
                {isCompleted ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <span className="text-sm">{config.emoji}</span>
                )}
                <span className={cn(isCurrent ? 'inline' : 'hidden sm:inline')}>
                  {config.label}
                </span>
              </button>
              {index < STATUS_FLOW.length - 1 && (
                <ChevronRight className={cn(
                  'h-3 w-3 mx-0.5 shrink-0',
                  index < currentStatusIndex ? 'text-primary' : 'text-muted-foreground/30'
                )} />
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
