/**
 * OpportunitiesKanban - Drag-and-drop kanban board for opportunities
 *
 * Features:
 * - 6 columns: brief, proposal_sent, negotiation, contract_sent, won, executing
 * - Drag-drop stage transitions via @dnd-kit
 * - Column headers with count and total value
 * - Compact cards with key info
 * - Lost/completed shown at bottom
 */

import { useState, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAdvanceStage } from '@/api/hooks/useOpportunities'
import { formatMoney, cn } from '@/lib/utils'
import type { Opportunity, OpportunityStage } from '@/types/opportunities'
import { STAGE_CONFIG, KANBAN_STAGES, PRIORITY_CONFIG } from '@/types/opportunities'

interface OpportunitiesKanbanProps {
  opportunities: Opportunity[]
  onOpportunityClick: (id: number) => void
  onClientClick: (clientId: number) => void
}

export function OpportunitiesKanban({
  opportunities,
  onOpportunityClick,
  onClientClick,
}: OpportunitiesKanbanProps) {
  const [activeId, setActiveId] = useState<number | null>(null)
  const advanceStageMutation = useAdvanceStage()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Group opportunities by stage
  const opportunitiesByStage = useMemo(() => {
    const grouped: Record<OpportunityStage, Opportunity[]> = {} as any

    // Initialize all kanban stages
    KANBAN_STAGES.forEach(stage => {
      grouped[stage] = []
    })

    // Add terminal stages
    grouped['completed'] = []
    grouped['closed_lost'] = []

    // Distribute opportunities
    opportunities.forEach(opp => {
      if (grouped[opp.stage]) {
        grouped[opp.stage].push(opp)
      } else {
        // Map non-kanban stages to nearest kanban stage
        if (['qualified', 'shortlist', 'proposal_draft'].includes(opp.stage)) {
          grouped['brief'].push(opp)
        } else if (opp.stage === 'contract_prep') {
          grouped['negotiation'].push(opp)
        } else {
          // Fallback to brief
          grouped['brief'].push(opp)
        }
      }
    })

    return grouped
  }, [opportunities])

  // Calculate column totals
  const columnTotals = useMemo(() => {
    const totals: Record<OpportunityStage, { count: number; value: number }> = {} as any

    Object.entries(opportunitiesByStage).forEach(([stage, opps]) => {
      totals[stage as OpportunityStage] = {
        count: opps.length,
        value: opps.reduce((sum, opp) => sum + parseFloat(opp.estimated_value || '0'), 0),
      }
    })

    return totals
  }, [opportunitiesByStage])

  const activeOpportunity = activeId
    ? opportunities.find(o => o.id === activeId)
    : null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const opportunityId = active.id as number
    const newStage = over.id as OpportunityStage

    // Find the opportunity
    const opportunity = opportunities.find(o => o.id === opportunityId)
    if (!opportunity || opportunity.stage === newStage) return

    // Update stage
    advanceStageMutation.mutate({
      id: opportunityId,
      data: { stage: newStage },
    })
  }

  // Terminal opportunities (completed + lost)
  const terminalOpportunities = [
    ...opportunitiesByStage['completed'],
    ...opportunitiesByStage['closed_lost'],
  ]

  return (
    <div className="space-y-4">
      {/* Main Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_STAGES.map(stage => {
            const stageConfig = STAGE_CONFIG[stage]
            const stageOpportunities = opportunitiesByStage[stage] || []
            const totals = columnTotals[stage]

            return (
              <KanbanColumn
                key={stage}
                stage={stage}
                stageConfig={stageConfig}
                opportunities={stageOpportunities}
                count={totals?.count || 0}
                totalValue={totals?.value || 0}
                onOpportunityClick={onOpportunityClick}
                onClientClick={onClientClick}
              />
            )
          })}
        </div>

        <DragOverlay>
          {activeOpportunity && (
            <OpportunityCard
              opportunity={activeOpportunity}
              onOpportunityClick={() => {}}
              onClientClick={() => {}}
              isDragging
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Terminal Section */}
      {terminalOpportunities.length > 0 && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Completed & Lost ({terminalOpportunities.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {terminalOpportunities.map(opp => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                onOpportunityClick={onOpportunityClick}
                onClientClick={onClientClick}
                compact
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Kanban Column Component
interface KanbanColumnProps {
  stage: OpportunityStage
  stageConfig: { label: string; emoji: string; color: string }
  opportunities: Opportunity[]
  count: number
  totalValue: number
  onOpportunityClick: (id: number) => void
  onClientClick: (clientId: number) => void
}

function KanbanColumn({
  stage,
  stageConfig,
  opportunities,
  count,
  totalValue,
  onOpportunityClick,
  onClientClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useSortable({
    id: stage,
    data: { type: 'column' },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col w-72 min-w-[288px] rounded-xl border border-white/10 bg-background/30 backdrop-blur-sm',
        isOver && 'ring-2 ring-primary/50'
      )}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className={cn('h-2 w-2 rounded-full', stageConfig.color)} />
            <span className="font-medium text-sm">{stageConfig.label}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {count}
          </Badge>
        </div>
        {totalValue > 0 && (
          <p className="text-xs text-emerald-500 font-medium">
            {formatMoney(totalValue, 'EUR')}
          </p>
        )}
      </div>

      {/* Column Content */}
      <ScrollArea className="flex-1 max-h-[calc(100vh-350px)]">
        <SortableContext
          items={opportunities.map(o => o.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="p-2 space-y-2">
            {opportunities.map(opp => (
              <DraggableOpportunityCard
                key={opp.id}
                opportunity={opp}
                onOpportunityClick={onOpportunityClick}
                onClientClick={onClientClick}
              />
            ))}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  )
}

// Draggable Opportunity Card Wrapper
interface DraggableOpportunityCardProps {
  opportunity: Opportunity
  onOpportunityClick: (id: number) => void
  onClientClick: (clientId: number) => void
}

function DraggableOpportunityCard({
  opportunity,
  onOpportunityClick,
  onClientClick,
}: DraggableOpportunityCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: opportunity.id,
    data: { type: 'opportunity', opportunity },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <OpportunityCard
        opportunity={opportunity}
        onOpportunityClick={onOpportunityClick}
        onClientClick={onClientClick}
        isDragging={isDragging}
      />
    </div>
  )
}

// Opportunity Card Component
interface OpportunityCardProps {
  opportunity: Opportunity
  onOpportunityClick: (id: number) => void
  onClientClick: (clientId: number) => void
  isDragging?: boolean
  compact?: boolean
}

function OpportunityCard({
  opportunity,
  onOpportunityClick,
  onClientClick,
  isDragging,
  compact,
}: OpportunityCardProps) {
  const stageConfig = STAGE_CONFIG[opportunity.stage]
  const priorityConfig = PRIORITY_CONFIG[opportunity.priority]
  const showPriority = opportunity.priority === 'high' || opportunity.priority === 'urgent'

  return (
    <Card
      className={cn(
        'p-3 rounded-lg border-white/10 bg-background/80 backdrop-blur-sm cursor-pointer transition-all',
        'hover:border-primary/30 hover:shadow-md',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-primary',
        compact && 'p-2'
      )}
      onClick={() => onOpportunityClick(opportunity.id)}
    >
      {/* Title */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className={cn(
          'font-medium line-clamp-2',
          compact ? 'text-xs' : 'text-sm'
        )}>
          {opportunity.title}
        </h4>
        {showPriority && (
          <Badge
            variant="outline"
            className={cn(
              'shrink-0 text-[10px] px-1 py-0',
              opportunity.priority === 'urgent'
                ? 'border-red-500/50 text-red-500'
                : 'border-orange-500/50 text-orange-500'
            )}
          >
            {opportunity.priority === 'urgent' ? '!' : 'H'}
          </Badge>
        )}
      </div>

      {/* Client */}
      <button
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
        onClick={(e) => {
          e.stopPropagation()
          if (opportunity.client?.id) onClientClick(opportunity.client.id)
        }}
      >
        <Avatar className="h-4 w-4">
          <AvatarFallback className="text-[8px] bg-muted">
            {opportunity.client?.display_name?.charAt(0)?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <span className="truncate max-w-[180px]">
          {opportunity.client?.display_name || 'Unknown'}
        </span>
      </button>

      {/* Value + Close Date */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-emerald-500">
          {opportunity.estimated_value
            ? formatMoney(parseFloat(opportunity.estimated_value), opportunity.currency || 'EUR')
            : '-'}
        </span>
        {opportunity.expected_close_date && (
          <span className={cn(
            'text-muted-foreground',
            new Date(opportunity.expected_close_date) < new Date() && 'text-red-500'
          )}>
            {new Date(opportunity.expected_close_date).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
            })}
          </span>
        )}
      </div>

      {/* Owner */}
      {!compact && opportunity.owner && (
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/5">
          <Avatar className="h-4 w-4">
            <AvatarFallback className="text-[8px] bg-gradient-to-br from-blue-500 to-purple-500 text-white">
              {opportunity.owner.full_name?.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground truncate">
            {opportunity.owner.full_name}
          </span>
        </div>
      )}

      {/* Stage badge for terminal cards */}
      {compact && (
        <div className="mt-2">
          <Badge
            variant="outline"
            className={cn(
              'text-[10px]',
              opportunity.stage === 'completed' && 'border-teal-500/50 text-teal-500',
              opportunity.stage === 'closed_lost' && 'border-red-500/50 text-red-500'
            )}
          >
            {stageConfig.emoji} {stageConfig.label}
          </Badge>
        </div>
      )}
    </Card>
  )
}
