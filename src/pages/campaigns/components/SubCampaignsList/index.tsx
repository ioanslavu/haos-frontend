/**
 * SubCampaignsList - List of subcampaigns (platforms) for a campaign
 *
 * Shows each platform with:
 * - Budget and spent amounts
 * - Payment method
 * - Songs and artists
 * - Actions (edit, update budget/spent, delete)
 */

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { HiSquares2X2 } from 'react-icons/hi2'
import { Card } from '@/components/ui/card'
import { useSubCampaigns } from '@/api/hooks/useCampaigns'
import { InlineAddPlatform } from './InlineAddPlatform'
import { SubCampaignCard } from './SubCampaignCard'
import type { SubCampaignsListProps } from './types'

export function SubCampaignsList({ campaignId, campaignName, showAddForm = false, onAddFormClose }: SubCampaignsListProps) {
  const { data, isLoading } = useSubCampaigns(campaignId)
  const subcampaigns = data?.results || []

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Inline Add Platform - Only shown when triggered */}
      {showAddForm && (
        <InlineAddPlatform campaignId={campaignId} onClose={onAddFormClose} />
      )}

      {subcampaigns.length === 0 ? (
        <Card className="p-12 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm text-center">
          <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
            <HiSquares2X2 className="h-8 w-8 text-purple-500" />
          </div>
          <h4 className="font-semibold mb-2">No platforms yet</h4>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Add advertising platforms to allocate budget and track spending across different channels.
          </p>
        </Card>
      ) : (
        <>
          <h3 className="font-semibold text-sm text-muted-foreground">
            {subcampaigns.length} Platform{subcampaigns.length !== 1 ? 's' : ''}
          </h3>
          <div className="space-y-3">
            {subcampaigns.map((subcampaign) => (
              <SubCampaignCard
                key={subcampaign.id}
                subcampaign={subcampaign}
                campaignId={campaignId}
                campaignName={campaignName}
                isExpanded={expandedIds.has(subcampaign.id)}
                onToggleExpand={() => toggleExpanded(subcampaign.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Named export for backwards compatibility
export default SubCampaignsList
