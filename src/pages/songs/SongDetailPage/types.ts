import { SongStageTransition, SongNote, SongChecklistItem, SongAsset, SongStage } from '@/types/song';

export type ActivityType = 'transition' | 'note' | 'checklist' | 'asset';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  data: SongStageTransition | SongNote | SongChecklistItem | SongAsset;
  timestamp: string;
}

export interface SongDetailState {
  activeTab: string;
  showAssetUploader: boolean;
  showAddNote: boolean;
  activityFilter: 'all' | ActivityType;
  assignDialogOpen: boolean;
  selectedChecklistItem: SongChecklistItem | null;
  selectedStage: SongStage | undefined;
  taskModalOpen: boolean;
  selectedTask: any | null;
  isLoadingTask: boolean;
  addTemplateDialogOpen: boolean;
}
