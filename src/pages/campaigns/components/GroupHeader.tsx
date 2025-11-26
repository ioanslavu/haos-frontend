/**
 * GroupHeader - Collapsible group header for grouped views
 *
 * Used for By Client and By Platform groupings.
 */

import { ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { formatMoney, cn } from '@/lib/utils'

interface GroupHeaderProps {
  title: string
  subtitle?: string
  emoji?: string
  imageUrl?: string
  campaignCount: number
  activeCount?: number
  totalBudget: number
  totalSpent: number
  isExpanded: boolean
  onToggle: () => void
  onViewClick?: () => void
  viewLabel?: string
  className?: string
}

export function GroupHeader({
  title,
  subtitle,
  emoji,
  imageUrl,
  campaignCount,
  activeCount = 0,
  totalBudget,
  totalSpent,
  isExpanded,
  onToggle,
  onViewClick,
  viewLabel = 'View',
  className,
}: GroupHeaderProps) {
  const utilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  return (
    <div
      className={cn(
        'p-4 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-2xl',
        !isExpanded && 'rounded-b-2xl',
        className
      )}
      onClick={onToggle}
    >
      <div className="flex items-center gap-4">
        {/* Expand Icon */}
        <div className="text-muted-foreground">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </div>

        {/* Icon/Avatar */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : emoji ? (
          <div className="text-3xl">{emoji}</div>
        ) : (
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
            <span className="text-lg font-semibold">{title.charAt(0)}</span>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg truncate">{title}</h3>
            {activeCount > 0 && (
              <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs">
                {activeCount} active
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {subtitle || `${campaignCount} campaign${campaignCount !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Budget Summary */}
        {totalBudget > 0 && (
          <div className="hidden md:flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="font-semibold">{formatMoney(totalBudget, 'EUR')}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Spent</p>
              <p className="font-semibold text-muted-foreground">
                {formatMoney(totalSpent, 'EUR')}
              </p>
            </div>
            <div className="w-24">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Usage</span>
                <span>{utilization.toFixed(0)}%</span>
              </div>
              <Progress value={utilization} className="h-2" />
            </div>
          </div>
        )}

        {/* Actions */}
        {onViewClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onViewClick()
            }}
            className="rounded-lg hidden lg:flex"
          >
            {viewLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

interface ClientGroupHeaderProps {
  client: {
    id: number
    display_name?: string
    image_url?: string
  }
  campaignCount: number
  activeCount: number
  totalBudget: number
  totalSpent: number
  isExpanded: boolean
  onToggle: () => void
  onViewClient?: () => void
}

export function ClientGroupHeader({
  client,
  campaignCount,
  activeCount,
  totalBudget,
  totalSpent,
  isExpanded,
  onToggle,
  onViewClient,
}: ClientGroupHeaderProps) {
  return (
    <GroupHeader
      title={client.display_name || 'Unknown Client'}
      imageUrl={client.image_url}
      campaignCount={campaignCount}
      activeCount={activeCount}
      totalBudget={totalBudget}
      totalSpent={totalSpent}
      isExpanded={isExpanded}
      onToggle={onToggle}
      onViewClick={onViewClient}
      viewLabel="View Client"
    />
  )
}

import type { Platform } from '@/types/campaign'
import { PLATFORM_CONFIG } from '@/types/campaign'

interface PlatformGroupHeaderProps {
  platform: Platform
  subcampaignCount: number
  activeCount: number
  totalBudget: number
  totalSpent: number
  isExpanded: boolean
  onToggle: () => void
}

export function PlatformGroupHeader({
  platform,
  subcampaignCount,
  activeCount,
  totalBudget,
  totalSpent,
  isExpanded,
  onToggle,
}: PlatformGroupHeaderProps) {
  const platformConfig = PLATFORM_CONFIG[platform]

  return (
    <GroupHeader
      title={platformConfig?.label || platform}
      subtitle={`${subcampaignCount} subcampaign${subcampaignCount !== 1 ? 's' : ''}`}
      emoji={platformConfig?.emoji}
      campaignCount={subcampaignCount}
      activeCount={activeCount}
      totalBudget={totalBudget}
      totalSpent={totalSpent}
      isExpanded={isExpanded}
      onToggle={onToggle}
    />
  )
}
