import { useNoteStatistics } from '@/api/hooks/useNotes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Archive, Pin, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const NotesInsights = () => {
  const { data: stats, isLoading } = useNoteStatistics();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Total Notes</span>
            </div>
            <span className="font-semibold">{stats.total_notes}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Pinned</span>
            </div>
            <span className="font-semibold">{stats.total_pinned}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Archived</span>
            </div>
            <span className="font-semibold">{stats.total_archived}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">This Week</span>
            </div>
            <span className="font-semibold">{stats.notes_this_week}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Top Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.by_tag.slice(0, 10).map((tagStat) => (
              <div key={tagStat.tag_id} className="flex items-center justify-between">
                <Badge
                  variant="secondary"
                  style={{ backgroundColor: tagStat.tag_color + '20', color: tagStat.tag_color }}
                >
                  {tagStat.tag_name}
                </Badge>
                <span className="text-sm text-muted-foreground">{tagStat.count}</span>
              </div>
            ))}
            {stats.by_tag.length === 0 && (
              <p className="text-sm text-muted-foreground">No tags yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
