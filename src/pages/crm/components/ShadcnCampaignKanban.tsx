import { useMemo } from 'react'
import {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
  type KanbanItemProps,
  type KanbanColumnProps,
  type DragEndEvent,
} from '@/components/ui/kanban'
import { Campaign, CampaignStatus, CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_COLORS } from '@/types/campaign'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Building2, Calendar, DollarSign, MoreVertical, User, Clock, Music } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, differenceInDays } from 'date-fns'

interface ShadcnCampaignKanbanProps {
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

// Column background colors for Kanban board
const COLUMN_BG_COLORS: Record<CampaignStatus, string> = {
  lead: 'bg-blue-50/50 dark:bg-blue-950/20',
  negotiation: 'bg-yellow-50/50 dark:bg-yellow-950/20',
  confirmed: 'bg-green-50/50 dark:bg-green-950/20',
  active: 'bg-purple-50/50 dark:bg-purple-950/20',
  completed: 'bg-gray-50/50 dark:bg-gray-900/20',
  lost: 'bg-red-50/50 dark:bg-red-950/20',
}

// Column header colors
const COLUMN_HEADER_COLORS: Record<CampaignStatus, string> = {
  lead: 'bg-blue-100 dark:bg-blue-900/50 border-blue-200 dark:border-blue-800',
  negotiation: 'bg-yellow-100 dark:bg-yellow-900/50 border-yellow-200 dark:border-yellow-800',
  confirmed: 'bg-green-100 dark:bg-green-900/50 border-green-200 dark:border-green-800',
  active: 'bg-purple-100 dark:bg-purple-900/50 border-purple-200 dark:border-purple-800',
  completed: 'bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700',
  lost: 'bg-red-100 dark:bg-red-900/50 border-red-200 dark:border-red-800',
}

type CampaignKanbanItem = KanbanItemProps & {
  campaign: Campaign
}

type CampaignKanbanColumn = KanbanColumnProps & {
  status: CampaignStatus
  count: number
  totalValue: number
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
  return kind === 'PJ' ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />
}

const getValueColor = (value: number) => {
  if (value >= 100000) return 'text-emerald-600 dark:text-emerald-400'
  if (value >= 50000) return 'text-blue-600 dark:text-blue-400'
  return 'text-foreground'
}

const getDaysInStage = (campaign: Campaign) => {
  if (campaign.confirmed_at && campaign.status === 'confirmed') {
    return differenceInDays(new Date(), new Date(campaign.confirmed_at))
  }
  return differenceInDays(new Date(), new Date(campaign.created_at))
}

const CampaignCardContent = ({
  campaign,
  onEdit,
  onDelete,
  onClick,
}: {
  campaign: Campaign
  onEdit?: (campaign: Campaign) => void
  onDelete?: (campaign: Campaign) => void
  onClick?: (campaign: Campaign) => void
}) => {
  const value = parseFloat(campaign.value)
  const daysInStage = getDaysInStage(campaign)

  return (
    <div
      className="space-y-4 cursor-pointer p-1"
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(campaign)
      }}
    >
      {/* Modern value-based gradient accent with glow */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl',
          value >= 100000 && 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 shadow-lg shadow-emerald-500/50',
          value >= 50000 && value < 100000 && 'bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 shadow-lg shadow-blue-500/50',
          value < 50000 && 'bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 shadow-lg shadow-gray-500/30'
        )}
      />

      {/* Header with title and menu */}
      <div className="flex items-start gap-2 pt-2">
        <div className="flex-1 space-y-2">
          <h4 className="text-sm font-bold leading-tight line-clamp-2">{campaign.campaign_name}</h4>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 backdrop-blur-sm w-fit">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-medium text-muted-foreground">{daysInStage}d in stage</span>
          </div>
        </div>
        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-muted/50 backdrop-blur-sm">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()} className="rounded-xl border-white/10">
              {onEdit && <DropdownMenuItem onClick={() => onEdit(campaign)} className="rounded-lg">Edit</DropdownMenuItem>}
              {onDelete && (
                <DropdownMenuItem onClick={() => onDelete(campaign)} className="text-destructive rounded-lg">
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Value with gradient background */}
      <div className={cn(
        'flex items-baseline gap-2 p-3 rounded-xl backdrop-blur-sm',
        value >= 100000 && 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20',
        value >= 50000 && value < 100000 && 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20',
        value < 50000 && 'bg-muted/50'
      )}>
        <DollarSign className={cn('h-5 w-5', getValueColor(value))} />
        <span className={cn('text-2xl font-bold', getValueColor(value))}>{value.toLocaleString()}</span>
      </div>

      {/* Brand Badge with icon */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm">
          {campaign.brand.display_name}
        </Badge>
      </div>

      {/* Client, Artist & Song - Modern iOS card style */}
      <div className="space-y-2.5 p-3 rounded-xl bg-muted/30 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8 ring-2 ring-white/20 shadow-md">
            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500/20 to-purple-500/20 font-bold backdrop-blur-sm">
              {getInitials(campaign.client.display_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="p-1 rounded-lg bg-background/50 backdrop-blur-sm shadow-sm">{getEntityIcon(campaign.client.kind)}</div>
            <span className="text-xs font-medium truncate">{campaign.client.display_name}</span>
          </div>
        </div>

        {campaign.artist && (
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8 ring-2 ring-white/20 shadow-md">
              <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500/20 to-pink-500/20 font-bold backdrop-blur-sm">
                {getInitials(campaign.artist.display_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="p-1 rounded-lg bg-background/50 backdrop-blur-sm shadow-sm">{getEntityIcon(campaign.artist.kind)}</div>
              <span className="text-xs font-medium truncate">{campaign.artist.display_name}</span>
            </div>
          </div>
        )}

        {campaign.song && (
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8 ring-2 ring-white/20 shadow-md">
              <AvatarFallback className="text-xs bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 font-bold backdrop-blur-sm">
                <Music className="h-3.5 w-3.5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Music className="h-3.5 w-3.5 text-violet-500" />
              <span className="text-xs font-medium truncate">{campaign.song.title}</span>
            </div>
          </div>
        )}
      </div>

      {/* Confirmed Date - iOS-style pill badge */}
      {campaign.confirmed_at && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm">
          <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Confirmed {format(new Date(campaign.confirmed_at), 'MMM d')}
          </span>
        </div>
      )}
    </div>
  )
}

export function ShadcnCampaignKanban({
  campaigns,
  onEdit,
  onDelete,
  onStatusChange,
  onClick,
}: ShadcnCampaignKanbanProps) {
  const { kanbanData, columns } = useMemo(() => {
    const data: CampaignKanbanItem[] = campaigns.map((campaign) => ({
      id: campaign.id.toString(),
      name: campaign.campaign_name,
      column: campaign.status,
      campaign,
    }))

    const cols: CampaignKanbanColumn[] = STATUS_COLUMNS.map((status) => {
      const statusCampaigns = campaigns.filter((c) => c.status === status)
      const totalValue = statusCampaigns.reduce((sum, c) => sum + parseFloat(c.value), 0)
      return {
        id: status,
        name: CAMPAIGN_STATUS_LABELS[status],
        status,
        count: statusCampaigns.length,
        totalValue,
      }
    })

    return { kanbanData: data, columns: cols }
  }, [campaigns])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const campaignId = Number(active.id)
    const newStatus = over.id as CampaignStatus

    const campaign = campaigns.find((c) => c.id === campaignId)
    if (campaign && campaign.status !== newStatus && STATUS_COLUMNS.includes(newStatus)) {
      onStatusChange?.(campaign, newStatus)
    }
  }

  const handleDataChange = (newData: CampaignKanbanItem[]) => {
    // Handle data changes from drag operations
    const movedItem = newData.find((item, index) => {
      const originalItem = kanbanData[index]
      return originalItem && item.column !== originalItem.column
    })

    if (movedItem && onStatusChange) {
      const campaign = campaigns.find((c) => c.id === Number(movedItem.id))
      if (campaign) {
        onStatusChange(campaign, movedItem.column as CampaignStatus)
      }
    }
  }

  return (
    <div className="h-[calc(100vh-320px)] min-h-[500px]">
      <KanbanProvider
        columns={columns}
        data={kanbanData}
        onDragEnd={handleDragEnd}
        onDataChange={handleDataChange}
      >
        {(column) => (
          <KanbanBoard id={column.id} className={cn('rounded-2xl backdrop-blur-xl border-white/20 dark:border-white/10 overflow-hidden shadow-xl', COLUMN_BG_COLORS[column.status])}>
            <KanbanHeader className={cn('flex items-center justify-between px-5 py-4 backdrop-blur-md border-b border-white/20', COLUMN_HEADER_COLORS[column.status])}>
              <div className="flex items-center gap-3">
                <span className="font-bold text-base">{column.name}</span>
                <Badge variant="secondary" className="h-6 px-3 rounded-full backdrop-blur-sm bg-white/20 dark:bg-black/20">
                  {column.count}
                </Badge>
              </div>
              {column.totalValue > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-sm">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span className="text-sm font-bold">{(column.totalValue / 1000).toFixed(0)}k</span>
                </div>
              )}
            </KanbanHeader>
            <KanbanCards id={column.id} className="min-h-[200px] p-3">
              {(item) => (
                <KanbanCard
                  key={item.id}
                  {...item}
                  className="relative rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-white/60 dark:hover:border-white/20 mb-3"
                >
                  <CampaignCardContent
                    campaign={item.campaign}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onClick={onClick}
                  />
                </KanbanCard>
              )}
            </KanbanCards>
          </KanbanBoard>
        )}
      </KanbanProvider>
    </div>
  )
}
