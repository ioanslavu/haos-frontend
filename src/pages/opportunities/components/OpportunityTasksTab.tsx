/**
 * OpportunityTasksTab - Tasks tab content
 */

import { Card, CardContent } from '@/components/ui/card'
import { RelatedTasks } from '@/components/tasks/RelatedTasks'

interface OpportunityTasksTabProps {
  opportunityId: number
}

export function OpportunityTasksTab({ opportunityId }: OpportunityTasksTabProps) {
  return (
    <Card className="rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
      <CardContent className="py-4">
        <RelatedTasks
          opportunityId={opportunityId}
        />
      </CardContent>
    </Card>
  )
}
