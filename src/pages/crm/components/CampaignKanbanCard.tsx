import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Campaign } from '@/types/campaign'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Building2, Calendar, DollarSign, GripVertical, MoreVertical, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface CampaignKanbanCardProps {
  campaign: Campaign
  onEdit?: (campaign: Campaign) => void
  onDelete?: (campaign: Campaign) => void
  onClick?: (campaign: Campaign) => void
  isDragging?: boolean
}

export function CampaignKanbanCard({
  campaign,
  onEdit,
  onDelete,
  onClick,
  isDragging = false,
}: CampaignKanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: campaign.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getEntityIcon = (kind: 'PF' | 'PJ') => {
    return kind === 'PJ' ? (
      <Building2 className="h-3 w-3 text-muted-foreground" />
    ) : (
      <User className="h-3 w-3 text-muted-foreground" />
    )
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative cursor-pointer transition-all duration-200',
        'hover:shadow-lg hover:scale-[1.02] hover:border-primary/50',
        'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        (isSortableDragging || isDragging) && 'opacity-50 scale-95',
        isDragging && 'cursor-grabbing shadow-2xl'
      )}
      onClick={() => !isDragging && onClick?.(campaign)}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing',
          'p-1 rounded hover:bg-accent'
        )}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="p-3 space-y-2.5">
        {/* Campaign Name & Menu */}
        <div className="flex items-start gap-2 pr-6">
          <h4 className="text-sm font-semibold line-clamp-2 flex-1 leading-snug">
            {campaign.campaign_name}
          </h4>
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(campaign)}>
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(campaign)}
                    className="text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Value */}
        <div className="flex items-center gap-1.5 text-lg font-bold">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span>{parseFloat(campaign.value).toLocaleString()}</span>
        </div>

        {/* Brand Badge */}
        <Badge variant="secondary" className="text-xs font-medium">
          {campaign.brand.display_name}
        </Badge>

        {/* Client & Artist - Compact */}
        <div className="space-y-1.5 pt-1 border-t">
          {/* Client */}
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[10px] bg-primary/10">
                {getInitials(campaign.client.display_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1 min-w-0 flex-1">
              {getEntityIcon(campaign.client.kind)}
              <span className="text-xs text-muted-foreground truncate">
                {campaign.client.display_name}
              </span>
            </div>
          </div>

          {/* Artist */}
          {campaign.artist && (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[10px] bg-accent">
                  {getInitials(campaign.artist.display_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-1 min-w-0 flex-1">
                {getEntityIcon(campaign.artist.kind)}
                <span className="text-xs text-muted-foreground truncate">
                  {campaign.artist.display_name}
                </span>
              </div>
            </div>
          )}

          {/* Song */}
          {campaign.song && (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[10px] bg-purple-100 dark:bg-purple-900">
                  🎵
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <span className="text-xs text-muted-foreground truncate">
                  {campaign.song.title}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Confirmed Date */}
        {campaign.confirmed_at && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground pt-1">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(campaign.confirmed_at), 'MMM d, yyyy')}</span>
          </div>
        )}
      </div>
    </Card>
  )
}
