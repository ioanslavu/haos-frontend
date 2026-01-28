import { Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ActivityLogItem,
  AddNoteForm,
  TransitionTimeline,
} from '@/components/songs';
import type { ActivityType } from '@/components/songs/shared/ActivityLogItem';
import { SongStageTransition } from '@/types/song';
import { ActivityItem } from '../types';

interface SongActivityTabProps {
  transitions: SongStageTransition[];
  filteredActivities: ActivityItem[];
  activityFilter: 'all' | ActivityType;
  onFilterChange: (filter: 'all' | ActivityType) => void;
  showAddNote: boolean;
  onShowAddNote: () => void;
  onHideAddNote: () => void;
  onCreateNote: (content: string, isImportant: boolean) => Promise<void>;
}

export function SongActivityTab({
  transitions,
  filteredActivities,
  activityFilter,
  onFilterChange,
  showAddNote,
  onShowAddNote,
  onHideAddNote,
  onCreateNote,
}: SongActivityTabProps) {
  return (
    <div className="space-y-8">
      {/* Stage Transition Timeline */}
      {transitions.length > 0 && (
        <TransitionTimeline transitions={transitions} />
      )}

      {/* Activity Log Section */}
      <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Activity Log</CardTitle>
              <CardDescription>All notes, changes, and updates</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={activityFilter} onValueChange={(value) => onFilterChange(value as 'all' | ActivityType)}>
                <SelectTrigger className="w-[180px] rounded-xl">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="transition">Stage Transitions</SelectItem>
                  <SelectItem value="note">Notes</SelectItem>
                  <SelectItem value="checklist">Checklist</SelectItem>
                  <SelectItem value="asset">Assets</SelectItem>
                </SelectContent>
              </Select>
              {!showAddNote && (
                <Button
                  onClick={onShowAddNote}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Add Note Form */}
          {showAddNote && (
            <AddNoteForm
              onSubmit={onCreateNote}
              onCancel={onHideAddNote}
            />
          )}

          {/* Filter summary */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
            <span className="text-sm text-muted-foreground">
              Showing {filteredActivities.length} {filteredActivities.length === 1 ? 'item' : 'items'}
              {activityFilter !== 'all' && ` (${activityFilter} only)`}
            </span>
            {activityFilter !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFilterChange('all')}
                className="h-auto py-1 px-2 text-xs rounded-lg"
              >
                Clear filter
              </Button>
            )}
          </div>

          {/* Activity List */}
          {filteredActivities.length === 0 ? (
            <div className="py-12 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground mb-2">
                {activityFilter === 'all'
                  ? 'No activity yet'
                  : `No ${activityFilter} activities found`}
              </p>
              <p className="text-sm text-muted-foreground">
                {activityFilter === 'all'
                  ? 'Activity will appear here as work progresses'
                  : 'Try selecting a different filter'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivities.map((item) => (
                <ActivityLogItem
                  key={item.id}
                  activity={item.data}
                  type={item.type}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
