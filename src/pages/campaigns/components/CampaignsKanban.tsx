/**
 * CampaignsKanban - Kanban board view for campaigns with drag-and-drop
 *
 * Displays campaigns in columns by status. Drag campaigns between columns
 * to update their status. Similar to TaskManagement kanban.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatMoney, cn } from '@/lib/utils'
import { PLATFORM_ICONS, PLATFORM_TEXT_COLORS } from '@/lib/platform-icons'
import type { Campaign, CampaignStatus } from '@/types/campaign'
import {
  CAMPAIGN_STATUS_CONFIG,
  CAMPAIGN_TYPE_CONFIG,
  PLATFORM_CONFIG,
  ACTIVE_STATUSES,
} from '@/types/campaign'
import { useUpdateCampaignStatus } from '@/api/hooks/useCampaigns'
import { toast } from 'sonner'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { Clock, Activity, CheckCircle, Target, AlertTriangle, XCircle, Ban } from 'lucide-react'

interface CampaignsKanbanProps {
  campaigns: Campaign[]
  onCampaignClick?: (id: number) => void
  onClientClick?: (clientId: number) => void
}

// Statuses to show in kanban
const KANBAN_STATUSES: CampaignStatus[] = [
  'lead',
  'negotiation',
  'confirmed',
  'active',
  'completed',
]

// Status column config with icons
const STATUS_COLUMNS = [
  { id: 'lead', label: 'Lead', icon: Target, color: 'bg-blue-500' },
  { id: 'negotiation', label: 'Negotiation', icon: Activity, color: 'bg-amber-500' },
  { id: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'bg-green-500' },
  { id: 'active', label: 'Active', icon: Activity, color: 'bg-purple-500' },
  { id: 'completed', label: 'Completed', icon: CheckCircle, color: 'bg-gray-400' },
]

// Droppable Column Component
function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'h-full flex-shrink-0 rounded-xl transition-all duration-200',
        isOver && 'bg-primary/5 ring-2 ring-primary/30 scale-[1.01]'
      )}
    >
      {children}
    </div>
  )
}

// Draggable Campaign Card Component
function DraggableCampaignCard({
  campaign,
  children,
  onClick,
}: {
  campaign: Campaign
  children: React.ReactNode
  onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: campaign.id,
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(isDragging && 'opacity-30')}
      onClick={(e) => {
        if (!isDragging) {
          onClick()
        }
      }}
    >
      {children}
    </div>
  )
}

export function CampaignsKanban({ campaigns, onCampaignClick, onClientClick }: CampaignsKanbanProps) {
  const navigate = useNavigate()
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null)
  const updateStatus = useUpdateCampaignStatus()

  // Setup drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start dragging
      },
    })
  )

  const handleClick = (id: number) => {
    if (onCampaignClick) {
      onCampaignClick(id)
    } else {
      navigate(`/campaigns/${id}`)
    }
  }

  const handleClientClick = (clientId: number) => {
    if (onClientClick) {
      onClientClick(clientId)
    } else {
      navigate(`/entities/${clientId}`)
    }
  }

  // Group campaigns by status
  const campaignsByStatus = KANBAN_STATUSES.reduce((acc, status) => {
    acc[status] = campaigns.filter((c) => c.status === status)
    return acc
  }, {} as Record<CampaignStatus, Campaign[]>)

  // Lost/cancelled count
  const lostCancelled = campaigns.filter(
    (c) => c.status === 'lost' || c.status === 'cancelled'
  )

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const campaignId = event.active.id as number
    const campaign = campaigns.find((c) => c.id === campaignId)
    if (campaign) {
      setActiveCampaign(campaign)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveCampaign(null)
      return
    }

    const campaignId = active.id as number
    const newStatus = over.id as CampaignStatus

    const campaign = campaigns.find((c) => c.id === campaignId)

    if (campaign && campaign.status !== newStatus) {
      try {
        await updateStatus.mutateAsync({ id: campaignId, status: newStatus })
      } catch (error) {
        console.error('Failed to update campaign status:', error)
      }
    }

    setActiveCampaign(null)
  }

  const handleDragCancel = () => {
    setActiveCampaign(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex flex-col h-full">
        <div className="flex gap-3 flex-1 overflow-x-auto pb-2 scrollbar-hide">
          {STATUS_COLUMNS.map((column) => {
            const columnCampaigns = campaignsByStatus[column.id as CampaignStatus] || []
            const totalBudget = columnCampaigns.reduce(
              (sum, c) => sum + parseFloat(c.total_budget || '0'),
              0
            )

            return (
              <DroppableColumn key={column.id} id={column.id}>
                <div className="w-[300px] h-full flex flex-col">
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-2 py-2 mb-2 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      <div className={cn('w-1.5 h-1.5 rounded-full', column.color)} />
                      <h3 className="text-xs font-semibold">{column.label}</h3>
                      <span className="text-xs text-muted-foreground font-medium">
                        {columnCampaigns.length}
                      </span>
                    </div>
                    {totalBudget > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {formatMoney(totalBudget, 'EUR')}
                      </span>
                    )}
                  </div>

                  {/* Cards Container */}
                  <div className="flex-1 overflow-y-auto space-y-2 min-h-0 scrollbar-hide p-1">
                    {columnCampaigns.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-xs">
                        No campaigns
                      </div>
                    ) : (
                      columnCampaigns.map((campaign) => (
                        <DraggableCampaignCard
                          key={campaign.id}
                          campaign={campaign}
                          onClick={() => handleClick(campaign.id)}
                        >
                          <KanbanCard
                            campaign={campaign}
                            onClientClick={() => campaign.client?.id && handleClientClick(campaign.client.id)}
                          />
                        </DraggableCampaignCard>
                      ))
                    )}
                  </div>
                </div>
              </DroppableColumn>
            )
          })}
        </div>

        {/* Lost/Cancelled indicator */}
        {lostCancelled.length > 0 && (
          <div className="py-2 text-center flex-shrink-0">
            <span className="text-xs text-muted-foreground">
              {lostCancelled.length} campaign{lostCancelled.length !== 1 ? 's' : ''} lost or cancelled
            </span>
          </div>
        )}
      </div>

      {/* Drag Overlay */}
      <DragOverlay modifiers={[snapCenterToCursor]}>
        {activeCampaign ? (
          <div className="w-[300px]">
            <KanbanCard campaign={activeCampaign} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

interface KanbanCardProps {
  campaign: Campaign
  isDragging?: boolean
  onClientClick?: () => void
}

function KanbanCard({ campaign, isDragging, onClientClick }: KanbanCardProps) {
  const budget = parseFloat(campaign.total_budget || '0')
  const spent = parseFloat(campaign.total_spent || '0')
  const utilization = budget > 0 ? (spent / budget) * 100 : 0
  const isActive = ACTIVE_STATUSES.includes(campaign.status)
  const typeConfig = CAMPAIGN_TYPE_CONFIG[campaign.campaign_type]

  // Get unique platforms from subcampaigns
  const platforms = campaign.subcampaigns?.map((s) => s.platform) || []
  const uniquePlatforms = [...new Set(platforms)]

  return (
    <Card
      className={cn(
        'p-3 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all duration-200 bg-card border-border/60',
        isActive && 'border-primary/30',
        isDragging && 'shadow-2xl ring-2 ring-primary/50 rotate-2'
      )}
    >
      <div className="space-y-2">
        {/* Title and Type */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-xs font-semibold line-clamp-2 leading-tight flex-1">
            {campaign.name}
          </h4>
          <Badge
            variant="outline"
            className="text-[10px] font-normal border-border/60 bg-background/50 h-4 px-1.5 flex-shrink-0"
          >
            {typeConfig?.label}
          </Badge>
        </div>

        {/* Client */}
        <div
          className={cn(
            "flex items-center gap-1.5 rounded px-1 -mx-1 py-0.5 transition-colors",
            campaign.client?.id && onClientClick && "hover:bg-primary/10 cursor-pointer"
          )}
          onClick={(e) => {
            if (campaign.client?.id && onClientClick) {
              e.stopPropagation()
              onClientClick()
            }
          }}
        >
          <div className="h-4 w-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center flex-shrink-0">
            <span className="text-[8px] font-semibold">
              {campaign.client?.display_name?.charAt(0) || '?'}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground truncate">
            {campaign.client?.display_name || 'Unknown'}
          </span>
        </div>

        {/* Platforms */}
        {uniquePlatforms.length > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex gap-1">
              {uniquePlatforms.slice(0, 5).map((platform) => {
                const pConfig = PLATFORM_CONFIG[platform]
                const Icon = PLATFORM_ICONS[platform]
                const colorClass = PLATFORM_TEXT_COLORS[platform]
                return (
                  <Icon
                    key={platform}
                    className={cn('h-4 w-4', colorClass)}
                    title={pConfig?.label}
                  />
                )
              })}
            </div>
            {uniquePlatforms.length > 5 && (
              <span className="text-[10px] text-muted-foreground">
                +{uniquePlatforms.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Budget */}
        {budget > 0 && (
          <div className="pt-1.5 border-t border-border/30">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-1">
                <Progress
                  value={Math.min(utilization, 100)}
                  className={cn(
                    'h-1 flex-1',
                    utilization > 100 && '[&>div]:bg-red-500',
                    utilization > 80 && utilization <= 100 && '[&>div]:bg-amber-500'
                  )}
                />
                <span
                  className={cn(
                    'text-[10px] font-medium',
                    utilization > 100
                      ? 'text-red-500'
                      : utilization > 80
                      ? 'text-amber-500'
                      : 'text-muted-foreground'
                  )}
                >
                  {utilization.toFixed(0)}%
                </span>
              </div>
              <span className="text-[10px] font-medium">
                {formatMoney(budget, 'EUR')}
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

export { KanbanCard }
