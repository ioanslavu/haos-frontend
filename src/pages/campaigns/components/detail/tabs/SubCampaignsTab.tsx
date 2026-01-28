/**
 * SubCampaignsTab - Platform/subcampaign management tab
 */

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SubCampaignsList } from '../../SubCampaignsList/index'
import type { UseCampaignDetailReturn } from '../../../hooks/useCampaignDetail'

interface SubCampaignsTabProps {
  ctx: UseCampaignDetailReturn
}

export function SubCampaignsTab({ ctx }: SubCampaignsTabProps) {
  const {
    campaign,
    campaignId,
    showAddSubCampaign,
    setShowAddSubCampaign,
  } = ctx

  if (!campaign) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Platforms</h3>
          <p className="text-sm text-muted-foreground">
            Manage advertising platforms and budget allocation
          </p>
        </div>
        <Button
          onClick={() => setShowAddSubCampaign(true)}
          className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          disabled={showAddSubCampaign}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Platform
        </Button>
      </div>
      <SubCampaignsList
        campaignId={campaignId}
        campaignName={campaign?.name || ''}
        showAddForm={showAddSubCampaign}
        onAddFormClose={() => setShowAddSubCampaign(false)}
      />
    </div>
  )
}
