import { useState } from 'react'
import { Campaign, CampaignStatus, CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_COLORS } from '@/types/campaign'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Edit, Trash2, Calendar, MoveRight } from 'lucide-react'
import { format } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface CampaignKanbanViewProps {
  campaigns: Campaign[]
  onEdit?: (campaign: Campaign) => void
  onDelete?: (campaign: Campaign) => void
  onStatusChange?: (campaign: Campaign, newStatus: CampaignStatus) => void
  onClick?: (campaign: Campaign) => void
}

const STATUS_COLUMNS: CampaignStatus[] = [
  'lead',
  'negotiation',
  'confirmed',
  'active',
  'completed',
  'lost',
]

export function CampaignKanbanView({
  campaigns,
  onEdit,
  onDelete,
  onStatusChange,
  onClick,
}: CampaignKanbanViewProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getCampaignsByStatus = (status: CampaignStatus) => {
    return campaigns.filter((c) => c.status === status)
  }

  const getColumnColor = (status: CampaignStatus) => {
    const colors: Record<CampaignStatus, string> = {
      lead: 'bg-blue-50 border-blue-200',
      negotiation: 'bg-yellow-50 border-yellow-200',
      confirmed: 'bg-green-50 border-green-200',
      active: 'bg-purple-50 border-purple-200',
      completed: 'bg-gray-50 border-gray-200',
      lost: 'bg-red-50 border-red-200',
    }
    return colors[status]
  }

  const MoveToMenu = ({ campaign }: { campaign: Campaign }) => {
    const availableStatuses = STATUS_COLUMNS.filter((s) => s !== campaign.status)

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" title="Move to...">
            <MoveRight className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {availableStatuses.map((status) => (
            <DropdownMenuItem
              key={status}
              onClick={(e) => {
                e.stopPropagation()
                onStatusChange?.(campaign, status)
              }}
            >
              Move to {CAMPAIGN_STATUS_LABELS[status]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUS_COLUMNS.map((status) => {
        const columnCampaigns = getCampaignsByStatus(status)
        const totalValue = columnCampaigns.reduce(
          (sum, c) => sum + parseFloat(c.value),
          0
        )

        return (
          <div key={status} className="flex-shrink-0 w-80">
            <Card className={`${getColumnColor(status)} h-full`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {CAMPAIGN_STATUS_LABELS[status]}
                  </CardTitle>
                  <Badge variant="secondary" className="font-mono">
                    {columnCampaigns.length}
                  </Badge>
                </div>
                {totalValue > 0 && (
                  <p className="text-xs text-muted-foreground font-mono">
                    ${totalValue.toLocaleString()}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {columnCampaigns.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    No campaigns
                  </div>
                ) : (
                  columnCampaigns.map((campaign) => (
                    <Card
                      key={campaign.id}
                      className="hover:shadow-md transition-shadow cursor-pointer bg-white"
                      onClick={() => onClick?.(campaign)}
                    >
                      <CardContent className="p-4 space-y-2">
                        {/* Header with actions */}
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-sm line-clamp-2 flex-1">
                            {campaign.campaign_name}
                          </h4>
                          <div className="flex gap-1 ml-2">
                            <MoveToMenu campaign={campaign} />
                            {onEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onEdit(campaign)
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                            {onDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDelete(campaign)
                                }}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Value */}
                        <div className="text-lg font-bold">
                          ${parseFloat(campaign.value).toLocaleString()}
                        </div>

                        {/* Brand */}
                        <Badge variant="outline" className="text-xs">
                          {campaign.brand.display_name}
                        </Badge>

                        {/* Client */}
                        <div className="flex items-center gap-2 text-xs">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs">
                              {getInitials(campaign.client.display_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-muted-foreground truncate">
                            {campaign.client.display_name}
                          </span>
                        </div>

                        {/* Artist */}
                        <div className="flex items-center gap-2 text-xs">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs">
                              {getInitials(campaign.artist.display_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-muted-foreground truncate">
                            {campaign.artist.display_name}
                          </span>
                        </div>

                        {/* Confirmed date */}
                        {campaign.confirmed_at && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(campaign.confirmed_at), 'MMM d, yyyy')}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )
      })}
    </div>
  )
}
