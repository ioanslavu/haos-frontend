import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RelatedTasks } from '@/components/tasks/RelatedTasks';
import { SongTriggerButton } from '@/components/tasks/ManualTriggerButton';

interface SongTasksTabProps {
  songId: number;
}

export function SongTasksTab({ songId }: SongTasksTabProps) {
  return (
    <div className="space-y-8">
      {/* Manual trigger buttons */}
      <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Create tasks for this song</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <SongTriggerButton songId={songId} />
          </div>
        </CardContent>
      </Card>

      {/* Related tasks */}
      <RelatedTasks
        entityType="song"
        entityId={songId}
        title="Song Tasks"
        description="Tasks automatically created and updated based on this song's progress"
        showEmpty={true}
      />
    </div>
  );
}
