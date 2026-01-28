/**
 * OverviewTab - Campaign overview with platforms, content, assignments, scores, and notes
 */

import {
  CalendarIcon,
  ExternalLink,
  Plus,
  AlertCircle,
} from 'lucide-react'
import { HiSquares2X2 } from 'react-icons/hi2'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatMoney, cn } from '@/lib/utils'
import { PLATFORM_ICONS, PLATFORM_COLORS } from '@/lib/platform-icons'
import { PLATFORM_CONFIG } from '@/types/campaign'
import { SubCampaignsList } from '../../SubCampaignsList/index'
import { AssignmentSection } from '../../AssignmentSection'
import { ClientScoreSection } from '../../ClientScoreSection'
import { CampaignNotesSection } from '../../CampaignNotesSection'
import type { UseCampaignDetailReturn } from '../../../hooks/useCampaignDetail'

interface OverviewTabProps {
  ctx: UseCampaignDetailReturn
}

export function OverviewTab({ ctx }: OverviewTabProps) {
  const {
    campaign,
    campaignId,
    isLoading,
    setActiveTab,
    setShowAddSubCampaign,
    setStartDateOpen,
    setEndDateOpen,
    handleUpdateNotes,
  } = ctx

  if (!campaign) return null

  return (
    <div className="space-y-6">
      {/* Missing Dates Alert */}
      {(!campaign.start_date || !campaign.end_date) && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-amber-600 dark:text-amber-400">
              {!campaign.start_date && !campaign.end_date
                ? 'Campaign dates are not set. Both dates are required for contracts.'
                : !campaign.start_date
                ? 'Start date is not set. Required for contracts.'
                : 'End date is not set. Required for contracts.'}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="ml-4 rounded-lg border-amber-500/50 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
              onClick={() => !campaign.start_date ? setStartDateOpen(true) : setEndDateOpen(true)}
            >
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
              Set {!campaign.start_date ? 'Start' : 'End'} Date
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Subcampaigns Summary */}
      <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <HiSquares2X2 className="h-4 w-4" />
            Platforms & Budgets
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveTab('subcampaigns')
                setShowAddSubCampaign(true)
              }}
              className="rounded-lg h-8"
            >
              <Plus className="mr-1 h-3 w-3" />
              Add
            </Button>
            {campaign.subcampaigns && campaign.subcampaigns.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('subcampaigns')}
                className="rounded-lg h-8"
              >
                View All
                <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {campaign.subcampaigns && campaign.subcampaigns.length > 0 ? (
          <div className="space-y-3">
            {campaign.subcampaigns.slice(0, 5).map((sub) => {
              const platformConfig = PLATFORM_CONFIG[sub.platform]
              const subBudget = parseFloat(sub.budget)
              const subSpent = parseFloat(sub.spent)
              const subUtil = subBudget > 0 ? (subSpent / subBudget) * 100 : 0
              const hasRevenue = sub.payment_method === 'revenue_share' || sub.payment_method === 'hybrid'

              return (
                <div
                  key={sub.id}
                  className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setActiveTab('subcampaigns')}
                >
                  <div className="flex items-start gap-4">
                    {(() => {
                      const Icon = PLATFORM_ICONS[sub.platform]
                      const brandColor = PLATFORM_COLORS[sub.platform]
                      return (
                        <div className={cn(
                          'p-2 rounded-lg',
                          brandColor.split(' ')[1]
                        )}>
                          <Icon className={cn(
                            'h-6 w-6',
                            brandColor.split(' ')[0]
                          )} />
                        </div>
                      )
                    })()}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium truncate">
                          {platformConfig.label}
                        </span>
                        <span className="text-sm font-medium">
                          {formatMoney(subBudget, sub.currency)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <span>{sub.service_type_display || sub.service_type}</span>
                        <span>•</span>
                        <span>{sub.payment_method_display || sub.payment_method}</span>
                        {hasRevenue && sub.revenue_share_percentage && (
                          <>
                            <span>•</span>
                            <span>{sub.revenue_share_percentage}% rev share</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={subUtil} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground w-16 text-right">
                          {formatMoney(subSpent, sub.currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            {campaign.subcampaigns.length > 5 && (
              <p className="text-sm text-muted-foreground text-center pt-2">
                +{campaign.subcampaigns.length - 5} more platforms
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
              <HiSquares2X2 className="h-6 w-6 text-purple-500" />
            </div>
            <p className="text-muted-foreground text-sm">
              No platforms added yet
            </p>
          </div>
        )}
      </Card>

      {/* Songs & Artists across all subcampaigns */}
      {campaign.subcampaigns && campaign.subcampaigns.some(s => (s.songs?.length || 0) > 0 || (s.artists?.length || 0) > 0) && (
        <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm">
          <h3 className="font-semibold mb-4">Content</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Songs */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Songs</p>
              <div className="space-y-1.5">
                {Array.from(
                  new Map(
                    campaign.subcampaigns
                      .flatMap(s => s.songs || [])
                      .map(song => [song.id, song])
                  ).values()
                ).slice(0, 5).map((song) => (
                  <div
                    key={song.id}
                    className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/30"
                  >
                    <span>🎵</span>
                    <span className="truncate">{song.title}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Artists */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Artists</p>
              <div className="space-y-1.5">
                {Array.from(
                  new Map(
                    campaign.subcampaigns
                      .flatMap(s => s.artists || [])
                      .map(artist => [artist.id, artist])
                  ).values()
                ).slice(0, 5).map((artist) => (
                  <div
                    key={artist.id}
                    className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/30"
                  >
                    {artist.image_url ? (
                      <img
                        src={artist.image_url}
                        alt={artist.display_name || 'Artist'}
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                        {artist.display_name?.charAt(0) || '?'}
                      </div>
                    )}
                    <span className="truncate">{artist.display_name || 'Unknown'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Team Assignments */}
      <AssignmentSection
        campaignId={campaignId}
        assignments={campaign.assignments || []}
        createdBy={campaign.created_by}
        isLoading={isLoading}
      />

      {/* Client Score */}
      <ClientScoreSection
        entityId={campaign.client?.id}
        entityName={campaign.client?.display_name}
        isLoading={isLoading}
      />

      {/* Notes */}
      <CampaignNotesSection
        notes={campaign.notes}
        onSave={handleUpdateNotes}
        isLoading={isLoading}
      />
    </div>
  )
}
