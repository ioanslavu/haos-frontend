import { useMemo, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Campaign, CampaignStatus, CAMPAIGN_STATUS_LABELS } from '@/types/campaign'
import { CampaignKanbanCard } from './CampaignKanbanCard'
import { CampaignKanbanColumn } from './CampaignKanbanColumn'
import { Badge } from '@/components/ui/badge'
import { DollarSign } from 'lucide-react'

interface ModernCampaignKanbanProps {
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

const STATUS_COLORS: Record<CampaignStatus, string> = {
  lead: 'from-blue-500/10 to-blue-600/5 border-blue-200',
  negotiation: 'from-amber-500/10 to-amber-600/5 border-amber-200',
  confirmed: 'from-green-500/10 to-green-600/5 border-green-200',
  active: 'from-purple-500/10 to-purple-600/5 border-purple-200',
  completed: 'from-gray-500/10 to-gray-600/5 border-gray-200',
  lost: 'from-red-500/10 to-red-600/5 border-red-200',
}

export function ModernCampaignKanban({
  campaigns,
  onEdit,
  onDelete,
  onStatusChange,
  onClick,
}: ModernCampaignKanbanProps) {
  const [activeId, setActiveId] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const campaignsByStatus = useMemo(() => {
    return STATUS_COLUMNS.reduce((acc, status) => {
      acc[status] = campaigns.filter((c) => c.status === status)
      return acc
    }, {} as Record<CampaignStatus, Campaign[]>)
  }, [campaigns])

  const activeCampaign = useMemo(() => {
    if (!activeId) return null
    return campaigns.find((c) => c.id === activeId)
  }, [activeId, campaigns])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const campaignId = active.id as number
    const newStatus = over.id as CampaignStatus

    const campaign = campaigns.find((c) => c.id === campaignId)

    if (campaign && campaign.status !== newStatus && STATUS_COLUMNS.includes(newStatus)) {
      onStatusChange?.(campaign, newStatus)
    }

    setActiveId(null)
  }

  const getTotalValue = (status: CampaignStatus) => {
    return campaignsByStatus[status].reduce((sum, c) => sum + parseFloat(c.value), 0)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-280px)] min-h-[500px]">
        {STATUS_COLUMNS.map((status) => {
          const columnCampaigns = campaignsByStatus[status]
          const totalValue = getTotalValue(status)

          return (
            <SortableContext
              key={status}
              id={status}
              items={columnCampaigns.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <CampaignKanbanColumn
                id={status}
                title={CAMPAIGN_STATUS_LABELS[status]}
                count={columnCampaigns.length}
                color={STATUS_COLORS[status]}
                header={
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">
                        {CAMPAIGN_STATUS_LABELS[status]}
                      </h3>
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                        {columnCampaigns.length}
                      </Badge>
                    </div>
                    {totalValue > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                        <span className="font-medium">
                          {(totalValue / 1000).toFixed(0)}k
                        </span>
                      </div>
                    )}
                  </div>
                }
              >
                <div className="space-y-2 h-full overflow-y-auto pr-1">
                  {columnCampaigns.map((campaign) => (
                    <CampaignKanbanCard
                      key={campaign.id}
                      campaign={campaign}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onClick={onClick}
                    />
                  ))}
                  {columnCampaigns.length === 0 && (
                    <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
                      No campaigns
                    </div>
                  )}
                </div>
              </CampaignKanbanColumn>
            </SortableContext>
          )
        })}
      </div>

      <DragOverlay>
        {activeCampaign && (
          <div className="rotate-3 scale-105 opacity-90">
            <CampaignKanbanCard campaign={activeCampaign} isDragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
