import { Campaign, CAMPAIGN_STATUS_COLORS, CAMPAIGN_STATUS_LABELS } from '@/types/campaign'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, User, Edit, Trash2, Calendar } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'

interface CampaignCardProps {
  campaign: Campaign
  onEdit?: (campaign: Campaign) => void
  onDelete?: (campaign: Campaign) => void
  onClick?: (campaign: Campaign) => void
}

export function CampaignCard({ campaign, onEdit, onDelete, onClick }: CampaignCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getEntityIcon = (kind: 'PF' | 'PJ') => {
    return kind === 'PJ' ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(campaign)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(campaign)
  }

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick?.(campaign)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{campaign.campaign_name}</h3>
            <Badge className={`mt-2 ${CAMPAIGN_STATUS_COLORS[campaign.status]}`}>
              {CAMPAIGN_STATUS_LABELS[campaign.status]}
            </Badge>
          </div>
          <div className="flex gap-1">
            {onEdit && (
              <Button variant="ghost" size="icon" onClick={handleEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="icon" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Value */}
        <div>
          <p className="text-2xl font-bold">${parseFloat(campaign.value).toLocaleString()}</p>
        </div>

        {/* Client */}
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {getInitials(campaign.client.display_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1 text-sm">
            {getEntityIcon(campaign.client.kind)}
            <span className="text-muted-foreground">Client:</span>
            <span className="font-medium">{campaign.client.display_name}</span>
          </div>
        </div>

        {/* Artist */}
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {getInitials(campaign.artist.display_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1 text-sm">
            {getEntityIcon(campaign.artist.kind)}
            <span className="text-muted-foreground">Artist:</span>
            <span className="font-medium">{campaign.artist.display_name}</span>
          </div>
        </div>

        {/* Brand */}
        <div>
          <Badge variant="outline" className="font-medium">
            {campaign.brand.display_name}
          </Badge>
        </div>

        {/* Confirmed Date */}
        {campaign.confirmed_at && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
            <Calendar className="h-3 w-3" />
            <span>Confirmed {formatDistanceToNow(new Date(campaign.confirmed_at), { addSuffix: true })}</span>
          </div>
        )}

        {/* Created date */}
        <div className="text-xs text-muted-foreground">
          Created {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}
        </div>
      </CardContent>
    </Card>
  )
}
