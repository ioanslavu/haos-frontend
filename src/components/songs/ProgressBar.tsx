import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number; // 0-100
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar = ({ progress, showLabel = true, className }: ProgressBarProps) => {
  const getProgressColor = (value: number) => {
    if (value === 100) return 'bg-green-600';
    if (value >= 75) return 'bg-blue-600';
    if (value >= 50) return 'bg-yellow-600';
    if (value >= 25) return 'bg-orange-600';
    return 'bg-red-600';
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Progress value={progress} className="flex-1" />
      {showLabel && (
        <span className={cn('text-sm font-medium min-w-[3rem] text-right', getProgressColor(progress))}>
          {progress}%
        </span>
      )}
    </div>
  );
};
