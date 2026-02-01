/**
 * OpportunityDeliverablesTab - Deliverables tab content
 */

import { Package, Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DeliverableCard } from './DeliverableCard'
import { InlineDeliverableAdd } from './InlineDeliverableAdd'
import type { OpportunityDeliverable } from '@/types/opportunities'

interface OpportunityDeliverablesTabProps {
  opportunityId: number
  deliverables: OpportunityDeliverable[]
  showAddDeliverable: boolean
  setShowAddDeliverable: (show: boolean) => void
  expandedDeliverableIds: Set<number>
  toggleDeliverableExpanded: (deliverableId: number) => void
}

export function OpportunityDeliverablesTab({
  opportunityId,
  deliverables,
  showAddDeliverable,
  setShowAddDeliverable,
  expandedDeliverableIds,
  toggleDeliverableExpanded,
}: OpportunityDeliverablesTabProps) {
  return (
    <div className="space-y-4">
      {/* Inline Add Form */}
      {showAddDeliverable && (
        <InlineDeliverableAdd
          opportunityId={opportunityId}
          onClose={() => setShowAddDeliverable(false)}
        />
      )}

      {deliverables.length === 0 ? (
        <EmptyDeliverables
          showAddDeliverable={showAddDeliverable}
          setShowAddDeliverable={setShowAddDeliverable}
        />
      ) : (
        <>
          {/* Header with count and add button */}
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-sm text-muted-foreground">
              {deliverables.length} Deliverable{deliverables.length !== 1 ? 's' : ''}
            </h3>
            {!showAddDeliverable && (
              <Button onClick={() => setShowAddDeliverable(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Deliverable
              </Button>
            )}
          </div>

          {/* Deliverable Cards */}
          <div className="space-y-3">
            {deliverables.map((deliverable) => (
              <DeliverableCard
                key={deliverable.id}
                deliverable={deliverable}
                opportunityId={opportunityId}
                isExpanded={expandedDeliverableIds.has(deliverable.id)}
                onToggleExpand={() => toggleDeliverableExpanded(deliverable.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function EmptyDeliverables({
  showAddDeliverable,
  setShowAddDeliverable,
}: {
  showAddDeliverable: boolean
  setShowAddDeliverable: (show: boolean) => void
}) {
  return (
    <Card className="p-12 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Package className="h-8 w-8 text-primary" />
      </div>
      <h4 className="font-semibold mb-2">No deliverables yet</h4>
      <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
        Add deliverables to track what needs to be delivered for this opportunity.
      </p>
      {!showAddDeliverable && (
        <Button onClick={() => setShowAddDeliverable(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Deliverable
        </Button>
      )}
    </Card>
  )
}
