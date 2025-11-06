import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import { Plus, Loader2, CalendarDays, DollarSign, Building2 } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useBriefs, useUpdateBrief } from '@/api/hooks/useArtistSales'
import { Brief, BriefStatus } from '@/types/artist-sales'
import { formatDate, formatMoney } from '@/lib/utils'
import { toast } from 'sonner'
import { KanbanColumn } from './components/KanbanColumn'
import { KanbanCard } from './components/KanbanCard'

const STATUSES: { value: BriefStatus; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-800' },
  { value: 'qualified', label: 'Qualified', color: 'bg-purple-100 text-purple-800' },
  { value: 'pitched', label: 'Pitched', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'won', label: 'Won', color: 'bg-green-100 text-green-800' },
  { value: 'lost', label: 'Lost', color: 'bg-red-100 text-red-800' },
]

export default function BriefKanban() {
  const navigate = useNavigate()
  const [activeId, setActiveId] = useState<number | null>(null)
  const { data: briefsData, isLoading } = useBriefs()
  const updateMutation = useUpdateBrief()

  const briefs = briefsData?.results || []

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const briefsByStatus = STATUSES.reduce((acc, status) => {
    acc[status.value] = briefs.filter((brief) => brief.brief_status === status.value)
    return acc
  }, {} as Record<BriefStatus, Brief[]>)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const briefId = active.id as number
    const newStatus = over.id as BriefStatus

    const brief = briefs.find((b) => b.id === briefId)
    if (!brief || brief.brief_status === newStatus) return

    try {
      await updateMutation.mutateAsync({
        id: briefId,
        data: { brief_status: newStatus },
      })
      toast.success(`Brief moved to ${STATUSES.find((s) => s.value === newStatus)?.label}`)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update brief')
    }
  }

  const activeBrief = activeId ? briefs.find((b) => b.id === activeId) : null

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container max-w-full py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Briefs Kanban</h1>
            <p className="text-muted-foreground mt-2">
              Drag and drop briefs to update their status
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/artist-sales/briefs')}>
              List View
            </Button>
            <Button onClick={() => navigate('/artist-sales/briefs/new')}>
              <Plus className="mr-2 h-4 w-4" />
              New Brief
            </Button>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STATUSES.map((status) => (
              <KanbanColumn
                key={status.value}
                id={status.value}
                title={status.label}
                count={briefsByStatus[status.value]?.length || 0}
                color={status.color}
              >
                <SortableContext
                  items={briefsByStatus[status.value]?.map((b) => b.id) || []}
                  strategy={rectSortingStrategy}
                >
                  <div className="space-y-3">
                    {briefsByStatus[status.value]?.map((brief) => (
                      <KanbanCard
                        key={brief.id}
                        id={brief.id}
                        onClick={() => navigate(`/artist-sales/briefs/${brief.id}`)}
                      >
                        <div className="space-y-2">
                          <div className="font-semibold text-sm line-clamp-2">
                            {brief.campaign_title}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">{brief.account.name}</span>
                          </div>

                          {(brief.budget_range_min || brief.budget_range_max) && (
                            <div className="flex items-center gap-2 text-xs">
                              <DollarSign className="h-3 w-3" />
                              <span>
                                {brief.budget_range_min && formatMoney(parseFloat(brief.budget_range_min), brief.currency)}
                                {brief.budget_range_min && brief.budget_range_max && ' - '}
                                {brief.budget_range_max && formatMoney(parseFloat(brief.budget_range_max), brief.currency)}
                              </span>
                            </div>
                          )}

                          {brief.timing_start && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <CalendarDays className="h-3 w-3" />
                              <span>{formatDate(brief.timing_start)}</span>
                            </div>
                          )}

                          {brief.is_overdue && (
                            <Badge variant="destructive" className="text-xs">
                              Overdue
                            </Badge>
                          )}
                        </div>
                      </KanbanCard>
                    ))}
                  </div>
                </SortableContext>
              </KanbanColumn>
            ))}
          </div>

          <DragOverlay>
            {activeBrief ? (
              <Card className="w-[280px] p-4 cursor-grabbing shadow-lg">
                <div className="space-y-2">
                  <div className="font-semibold text-sm line-clamp-2">
                    {activeBrief.campaign_title}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    <span className="truncate">{activeBrief.account.name}</span>
                  </div>
                </div>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </AppLayout>
  )
}
