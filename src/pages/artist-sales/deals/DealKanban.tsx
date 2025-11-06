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
import { Plus, Loader2, CalendarDays, DollarSign, User, Building2 } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDeals, useUpdateDeal } from '@/api/hooks/useArtistSales'
import { Deal, DealStatus } from '@/types/artist-sales'
import { formatDate, formatMoney } from '@/lib/utils'
import { toast } from 'sonner'
import { KanbanColumn } from './components/KanbanColumn'
import { KanbanCard } from './components/KanbanCard'

const STATUSES: { value: DealStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  { value: 'pending_signature', label: 'Pending Signature', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'signed', label: 'Signed', color: 'bg-blue-100 text-blue-800' },
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'paused', label: 'Paused', color: 'bg-orange-100 text-orange-800' },
  { value: 'completed', label: 'Completed', color: 'bg-purple-100 text-purple-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
]

export default function DealKanban() {
  const navigate = useNavigate()
  const [activeId, setActiveId] = useState<number | null>(null)
  const { data: dealsData, isLoading } = useDeals()
  const updateMutation = useUpdateDeal()

  const deals = dealsData?.results || []

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const dealsByStatus = STATUSES.reduce((acc, status) => {
    acc[status.value] = deals.filter((deal) => deal.deal_status === status.value)
    return acc
  }, {} as Record<DealStatus, Deal[]>)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const dealId = active.id as number
    const newStatus = over.id as DealStatus

    const deal = deals.find((d) => d.id === dealId)
    if (!deal || deal.deal_status === newStatus) return

    try {
      await updateMutation.mutateAsync({
        id: dealId,
        data: { deal_status: newStatus },
      })
      toast.success(`Deal moved to ${STATUSES.find((s) => s.value === newStatus)?.label}`)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update deal')
    }
  }

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null

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
            <h1 className="text-3xl font-bold tracking-tight">Deals Kanban</h1>
            <p className="text-muted-foreground mt-2">
              Drag and drop deals to update their status
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/artist-sales/deals')}>
              List View
            </Button>
            <Button onClick={() => navigate('/artist-sales/deals/new')}>
              <Plus className="mr-2 h-4 w-4" />
              New Deal
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
                count={dealsByStatus[status.value]?.length || 0}
                color={status.color}
              >
                <SortableContext
                  items={dealsByStatus[status.value]?.map((d) => d.id) || []}
                  strategy={rectSortingStrategy}
                >
                  <div className="space-y-3">
                    {dealsByStatus[status.value]?.map((deal) => (
                      <KanbanCard
                        key={deal.id}
                        id={deal.id}
                        onClick={() => navigate(`/artist-sales/deals/${deal.id}`)}
                      >
                        <div className="space-y-2">
                          <div className="font-semibold text-sm line-clamp-2">
                            {deal.deal_title}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">{deal.account.display_name}</span>
                          </div>

                          {deal.fee_total && (
                            <div className="flex items-center gap-2 text-xs font-medium text-green-600">
                              <DollarSign className="h-3 w-3" />
                              <span>{formatMoney(parseFloat(deal.fee_total), deal.currency)}</span>
                            </div>
                          )}

                          {deal.signed_date && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <CalendarDays className="h-3 w-3" />
                              <span>{formatDate(deal.signed_date)}</span>
                            </div>
                          )}

                          {deal.po_number && (
                            <div className="flex items-center gap-2 text-xs">
                              <Badge variant="outline" className="text-xs">
                                PO: {deal.po_number}
                              </Badge>
                            </div>
                          )}

                          {deal.artists_count && deal.artists_count > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {deal.artists_count} Artist{deal.artists_count !== 1 ? 's' : ''}
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
            {activeDeal ? (
              <Card className="w-[280px] p-4 cursor-grabbing shadow-lg">
                <div className="space-y-2">
                  <div className="font-semibold text-sm line-clamp-2">
                    {activeDeal.deal_title}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    <span className="truncate">{activeDeal.account.display_name}</span>
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
