import { TabsContent } from '@/components/ui/tabs';
import { ActivityTimeline } from '@/components/activities/ActivityTimeline';

interface ActivityTabProps {
  entityId: number;
}

export function ActivityTab({ entityId }: ActivityTabProps) {
  return (
    <TabsContent value="activity" className="space-y-6">
      <ActivityTimeline entityId={entityId} />
    </TabsContent>
  );
}
