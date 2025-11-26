/**
 * CampaignsTable - Professional table view for campaigns with inline subcampaigns
 *
 * Displays campaigns with their subcampaigns always visible in a clean, professional format.
 */

import { useNavigate } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatMoney, cn } from '@/lib/utils'
import type { Campaign, SubCampaign } from '@/types/campaign'
import {
  CAMPAIGN_STATUS_CONFIG,
  CAMPAIGN_TYPE_CONFIG,
  SUBCAMPAIGN_STATUS_CONFIG,
  PLATFORM_CONFIG,
  SERVICE_TYPE_CONFIG,
} from '@/types/campaign'

interface CampaignsTableProps {
  campaigns: Campaign[]
  onCampaignClick?: (id: number) => void
}

export function CampaignsTable({ campaigns, onCampaignClick }: CampaignsTableProps) {
  const navigate = useNavigate()

  const handleClick = (id: number) => {
    if (onCampaignClick) {
      onCampaignClick(id)
    } else {
      navigate(`/campaigns/${id}`)
    }
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border/60 hover:bg-transparent">
            <TableHead className="w-[32px] pl-4"></TableHead>
            <TableHead className="font-semibold">Campaign</TableHead>
            <TableHead className="font-semibold w-[180px]">Client</TableHead>
            <TableHead className="font-semibold w-[100px]">Type</TableHead>
            <TableHead className="font-semibold w-[120px] text-right">Budget</TableHead>
            <TableHead className="font-semibold w-[140px] text-right">Utilization</TableHead>
            <TableHead className="font-semibold w-[100px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => {
            const hasSubcampaigns = (campaign.subcampaigns?.length || 0) > 0

            return (
              <>
                <CampaignRow
                  key={campaign.id}
                  campaign={campaign}
                  onClick={() => handleClick(campaign.id)}
                />
                {hasSubcampaigns && campaign.subcampaigns?.map((sub) => (
                  <SubCampaignRow
                    key={`sub-${sub.id}`}
                    subcampaign={sub}
                    onClick={() => handleClick(campaign.id)}
                  />
                ))}
              </>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

interface CampaignRowProps {
  campaign: Campaign
  onClick: () => void
}

function CampaignRow({ campaign, onClick }: CampaignRowProps) {
  const statusConfig = CAMPAIGN_STATUS_CONFIG[campaign.status]
  const typeConfig = CAMPAIGN_TYPE_CONFIG[campaign.campaign_type]
  const budget = parseFloat(campaign.total_budget || '0')
  const spent = parseFloat(campaign.total_spent || '0')
  const utilization = budget > 0 ? (spent / budget) * 100 : 0
  const remaining = budget - spent

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/40"
      onClick={onClick}
    >
      {/* Status indicator */}
      <TableCell className="py-3 pl-4 pr-0">
        <div className={cn(
          "w-1 h-8 rounded-full",
          campaign.status === 'active' ? 'bg-purple-500' :
          campaign.status === 'confirmed' ? 'bg-green-500' :
          campaign.status === 'negotiation' ? 'bg-amber-500' :
          campaign.status === 'lead' ? 'bg-blue-500' :
          campaign.status === 'completed' ? 'bg-gray-400' :
          campaign.status === 'lost' ? 'bg-red-500' :
          'bg-gray-300'
        )} />
      </TableCell>

      {/* Campaign name */}
      <TableCell className="py-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-sm">{campaign.name}</span>
          {campaign.subcampaigns && campaign.subcampaigns.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {campaign.subcampaigns.length} platform{campaign.subcampaigns.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </TableCell>

      {/* Client */}
      <TableCell className="py-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold">
              {campaign.client?.display_name?.charAt(0) || '?'}
            </span>
          </div>
          <span className="text-sm truncate max-w-[120px]">
            {campaign.client?.display_name || 'Unknown'}
          </span>
        </div>
      </TableCell>

      {/* Type */}
      <TableCell className="py-3">
        <Badge variant="outline" className="text-xs font-normal border-border/60 bg-background/50">
          {typeConfig?.label}
        </Badge>
      </TableCell>

      {/* Budget */}
      <TableCell className="py-3 text-right">
        <span className="font-semibold text-sm">
          {budget > 0 ? formatMoney(budget, 'EUR') : '-'}
        </span>
      </TableCell>

      {/* Utilization */}
      <TableCell className="py-3 text-right">
        {budget > 0 ? (
          <div className="flex items-center justify-end gap-2">
            <div className="w-16">
              <Progress
                value={Math.min(utilization, 100)}
                className={cn(
                  "h-1.5",
                  utilization > 100 && "[&>div]:bg-red-500",
                  utilization > 80 && utilization <= 100 && "[&>div]:bg-amber-500"
                )}
              />
            </div>
            <span className={cn(
              "text-xs font-medium w-10 text-right",
              utilization > 100 ? "text-red-500" :
              utilization > 80 ? "text-amber-500" :
              "text-muted-foreground"
            )}>
              {utilization.toFixed(0)}%
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* Status */}
      <TableCell className="py-3">
        <Badge
          className={cn(
            "font-medium text-xs",
            statusConfig?.bgColor,
            statusConfig?.color,
            "border-transparent"
          )}
          variant="outline"
        >
          {statusConfig?.label}
        </Badge>
      </TableCell>
    </TableRow>
  )
}

interface SubCampaignRowProps {
  subcampaign: SubCampaign
  onClick: () => void
}

function SubCampaignRow({ subcampaign, onClick }: SubCampaignRowProps) {
  const statusConfig = SUBCAMPAIGN_STATUS_CONFIG[subcampaign.status]
  const platformConfig = PLATFORM_CONFIG[subcampaign.platform]
  const serviceConfig = SERVICE_TYPE_CONFIG[subcampaign.service_type]
  const budget = parseFloat(subcampaign.budget || '0')
  const spent = parseFloat(subcampaign.spent || '0')
  const utilization = budget > 0 ? (spent / budget) * 100 : 0

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/30 transition-colors border-b border-border/20 bg-muted/5"
      onClick={onClick}
    >
      {/* Empty first cell - aligns with campaign status indicator */}
      <TableCell className="py-2 pl-4 pr-0" />

      {/* Platform + Service with tree line */}
      <TableCell className="py-2">
        <div className="flex items-center gap-2">
          {/* Tree line connector */}
          <div className="flex items-center h-6 -ml-1">
            <div className="w-px bg-muted-foreground/30 h-full" />
            <div className="w-5 h-px bg-muted-foreground/30" />
          </div>
          <span className="text-base">{platformConfig?.emoji}</span>
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {subcampaign.platform_display || platformConfig?.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {subcampaign.service_type_display || serviceConfig?.label}
            </span>
          </div>
        </div>
      </TableCell>

      {/* Empty - Client column */}
      <TableCell className="py-2" />

      {/* Service Type Badge */}
      <TableCell className="py-2">
        <Badge variant="outline" className="text-xs font-normal border-border/40 bg-background/30">
          {serviceConfig?.label}
        </Badge>
      </TableCell>

      {/* Budget */}
      <TableCell className="py-2 text-right">
        <span className="text-sm text-muted-foreground">
          {budget > 0 ? formatMoney(budget, subcampaign.currency || 'EUR') : '-'}
        </span>
      </TableCell>

      {/* Utilization */}
      <TableCell className="py-2 text-right">
        {budget > 0 ? (
          <div className="flex items-center justify-end gap-2">
            <div className="w-16">
              <Progress
                value={Math.min(utilization, 100)}
                className={cn(
                  "h-1",
                  utilization > 100 && "[&>div]:bg-red-500",
                  utilization > 80 && utilization <= 100 && "[&>div]:bg-amber-500"
                )}
              />
            </div>
            <span className={cn(
              "text-xs w-10 text-right",
              utilization > 100 ? "text-red-500" :
              utilization > 80 ? "text-amber-500" :
              "text-muted-foreground"
            )}>
              {utilization.toFixed(0)}%
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* Status */}
      <TableCell className="py-2">
        <Badge
          className={cn(
            "font-normal text-xs",
            statusConfig?.bgColor,
            statusConfig?.color,
            "border-transparent"
          )}
          variant="outline"
        >
          {statusConfig?.label}
        </Badge>
      </TableCell>
    </TableRow>
  )
}

export { CampaignRow, SubCampaignRow }
