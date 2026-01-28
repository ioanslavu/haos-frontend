import { SongStage } from '@/types/song';

export const STAGE_FLOW: SongStage[] = [
  'draft',
  'publishing',
  'label_recording',
  'marketing_assets',
  'label_review',
  'ready_for_digital',
  'digital_distribution',
  'released',
];

export const STAGE_LABELS: Record<SongStage, string> = {
  draft: 'Draft',
  publishing: 'Publishing',
  label_recording: 'Label - Recording',
  marketing_assets: 'Marketing - Assets',
  label_review: 'Label - Review',
  ready_for_digital: 'Ready for Digital',
  digital_distribution: 'Digital Distribution',
  released: 'Released',
  archived: 'Archived',
};
