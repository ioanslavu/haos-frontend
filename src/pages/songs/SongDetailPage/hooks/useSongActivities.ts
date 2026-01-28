import { useMemo } from 'react';
import { SongStageTransition, SongNote, SongChecklistItem, SongAsset } from '@/types/song';
import { ActivityItem, ActivityType } from '../types';

export function useSongActivities(
  transitions: SongStageTransition[],
  notes: SongNote[],
  checklist: SongChecklistItem[],
  assets: SongAsset[],
  activityFilter: 'all' | ActivityType
) {
  const allActivities = useMemo(() => {
    const items: ActivityItem[] = [];

    // Add transitions
    transitions.forEach((transition) => {
      items.push({
        id: `transition-${transition.id}`,
        type: 'transition',
        data: transition,
        timestamp: transition.created_at,
      });
    });

    // Add notes
    notes.forEach((note) => {
      items.push({
        id: `note-${note.id}`,
        type: 'note',
        data: note,
        timestamp: note.created_at,
      });
    });

    // Add completed checklist items
    checklist
      .filter((item) => item.is_complete && item.completed_at)
      .forEach((item) => {
        items.push({
          id: `checklist-${item.id}`,
          type: 'checklist',
          data: item,
          timestamp: item.completed_at!,
        });
      });

    // Add assets
    assets.forEach((asset) => {
      items.push({
        id: `asset-${asset.id}`,
        type: 'asset',
        data: asset,
        timestamp: asset.created_at,
      });
    });

    // Sort by timestamp (most recent first)
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [transitions, notes, checklist, assets]);

  const filteredActivities = useMemo(() => {
    if (activityFilter === 'all') {
      return allActivities;
    }
    return allActivities.filter((item) => item.type === activityFilter);
  }, [allActivities, activityFilter]);

  return { allActivities, filteredActivities };
}
