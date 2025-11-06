import { Badge } from '@/components/ui/badge';
import { SongStage } from '@/types/song';

interface StageBadgeProps {
  stage: SongStage;
  className?: string;
}

const stageConfig: Record<SongStage, { label: string; variant: string; className: string }> = {
  draft: {
    label: 'Draft',
    variant: 'secondary',
    className: 'bg-gray-100 text-gray-800 border-gray-300',
  },
  publishing: {
    label: 'Publishing',
    variant: 'default',
    className: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  label_recording: {
    label: 'Recording',
    variant: 'default',
    className: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  marketing_assets: {
    label: 'Marketing',
    variant: 'default',
    className: 'bg-pink-100 text-pink-800 border-pink-300',
  },
  label_review: {
    label: 'Label Review',
    variant: 'default',
    className: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  ready_for_digital: {
    label: 'Ready for Digital',
    variant: 'default',
    className: 'bg-green-100 text-green-800 border-green-300',
  },
  digital_distribution: {
    label: 'Digital Distribution',
    variant: 'default',
    className: 'bg-teal-100 text-teal-800 border-teal-300',
  },
  released: {
    label: 'Released',
    variant: 'default',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  archived: {
    label: 'Archived',
    variant: 'outline',
    className: 'bg-slate-100 text-slate-800 border-slate-300',
  },
};

export const StageBadge = ({ stage, className }: StageBadgeProps) => {
  const config = stageConfig[stage];

  if (!config) {
    return (
      <Badge className={`bg-gray-100 text-gray-800 border-gray-300 ${className || ''}`}>
        Unknown
      </Badge>
    );
  }

  return (
    <Badge className={`${config.className} ${className || ''}`}>
      {config.label}
    </Badge>
  );
};
