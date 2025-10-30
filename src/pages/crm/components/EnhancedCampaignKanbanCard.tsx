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
import {
  Building2,
  Calendar,
  DollarSign,
  GripVertical,
  MoreVertical,
  User,
  TrendingUp,
  Clock,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, differenceInDays } from 'date-fns'
import { motion } from 'framer-motion'

interface EnhancedCampaignKanbanCardProps {
  campaign: Campaign
  onEdit?: (campaign: Campaign) => void
  onDelete?: (campaign: Campaign) => void
  onClick?: (campaign: Campaign) => void
  isDragging?: boolean
}

export function EnhancedCampaignKanbanCard({
  campaign,
  onEdit,
  onDelete,
  onClick,
  isDragging = false,
}: EnhancedCampaignKanbanCardProps) {
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
      <Building2 className="h-3 w-3" />
    ) : (
      <User className="h-3 w-3" />
    )
  }

  const getValueColor = (value: number) => {
    if (value >= 100000) return 'text-emerald-600 dark:text-emerald-400'
    if (value >= 50000) return 'text-blue-600 dark:text-blue-400'
    return 'text-muted-foreground'
  }

  const getDaysInStage = () => {
    if (campaign.confirmed_at && campaign.status === 'confirmed') {
      return differenceInDays(new Date(), new Date(campaign.confirmed_at))
    }
    return differenceInDays(new Date(), new Date(campaign.created_at))
  }

  const daysInStage = getDaysInStage()
  const value = parseFloat(campaign.value)

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'group relative cursor-pointer transition-all duration-300',
          'hover:shadow-xl hover:-translate-y-1 hover:border-primary/50',
          'bg-gradient-to-br from-background via-background to-muted/20',
          'backdrop-blur-sm border-2',
          (isSortableDragging || isDragging) && 'opacity-50 scale-95 rotate-2',
          isDragging && 'cursor-grabbing shadow-2xl ring-2 ring-primary'
        )}
        onClick={() => !isDragging && onClick?.(campaign)}
      >
        {/* Colored accent bar based on value */}
        <div
          className={cn(
            'absolute top-0 left-0 right-0 h-1 rounded-t-lg',
            value >= 100000 && 'bg-gradient-to-r from-emerald-500 to-teal-500',
            value >= 50000 && value < 100000 && 'bg-gradient-to-r from-blue-500 to-cyan-500',
            value < 50000 && 'bg-gradient-to-r from-gray-400 to-gray-500'
          )}
        />

        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className={cn(
            'absolute top-3 right-3 z-10',
            'opacity-0 group-hover:opacity-100 transition-all duration-200',
            'p-1.5 rounded-md hover:bg-accent/80 backdrop-blur-sm',
            'cursor-grab active:cursor-grabbing'
          )}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="p-4 space-y-3">
          {/* Header: Campaign Name & Menu */}
          <div className="flex items-start gap-2 pr-8">
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-bold line-clamp-2 leading-tight tracking-tight">
                {campaign.campaign_name}
              </h4>
              {/* Days in stage indicator */}
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{daysInStage}d in stage</span>
              </div>
            </div>
            {(onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-accent/80"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(campaign)}>
                      Edit Campaign
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(campaign)}
                      className="text-destructive"
                    >
                      Delete Campaign
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Value - Prominent */}
          <div className={cn(
            'flex items-baseline gap-1.5 font-bold transition-colors',
            getValueColor(value)
          )}>
            <DollarSign className="h-5 w-5" />
            <span className="text-2xl">{value.toLocaleString()}</span>
          </div>

          {/* Brand Badge */}
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="text-xs font-semibold px-2.5 py-0.5 bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              <Target className="h-3 w-3 mr-1" />
              {campaign.brand.display_name}
            </Badge>
          </div>

          {/* Client & Artist - Enhanced */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            {/* Client */}
            <div className="flex items-center gap-2.5 group/item">
              <Avatar className="h-6 w-6 ring-2 ring-background shadow-sm">
                <AvatarFallback className="text-[10px] bg-gradient-to-br from-primary/20 to-primary/10 font-bold">
                  {getInitials(campaign.client.display_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <div className="p-0.5 rounded bg-muted/50">
                  {getEntityIcon(campaign.client.kind)}
                </div>
                <span className="text-xs font-medium truncate group-hover/item:text-primary transition-colors">
                  {campaign.client.display_name}
                </span>
              </div>
            </div>

            {/* Artist */}
            {campaign.artist && (
              <div className="flex items-center gap-2.5 group/item">
                <Avatar className="h-6 w-6 ring-2 ring-background shadow-sm">
                  <AvatarFallback className="text-[10px] bg-gradient-to-br from-accent to-accent/50 font-bold">
                    {getInitials(campaign.artist.display_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <div className="p-0.5 rounded bg-muted/50">
                    {getEntityIcon(campaign.artist.kind)}
                  </div>
                  <span className="text-xs font-medium truncate group-hover/item:text-primary transition-colors">
                    {campaign.artist.display_name}
                  </span>
                </div>
              </div>
            )}

            {/* Song */}
            {campaign.song && (
              <div className="flex items-center gap-2.5 group/item">
                <Avatar className="h-6 w-6 ring-2 ring-background shadow-sm">
                  <AvatarFallback className="text-[10px] bg-purple-100 dark:bg-purple-900 font-bold">
                    🎵
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="text-xs font-medium truncate group-hover/item:text-primary transition-colors">
                    {campaign.song.title}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer: Confirmed Date or Status Indicator */}
          {campaign.confirmed_at ? (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 pt-1.5 border-t border-border/50">
              <Calendar className="h-3 w-3" />
              <span className="font-medium">
                Confirmed {format(new Date(campaign.confirmed_at), 'MMM d, yyyy')}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1.5 border-t border-border/50">
              <TrendingUp className="h-3 w-3" />
              <span>Created {format(new Date(campaign.created_at), 'MMM d')}</span>
            </div>
          )}
        </div>

        {/* Hover indicator */}
        <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent rounded-lg" />
        </div>
      </Card>
    </motion.div>
  )
}
