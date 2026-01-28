import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number; // 0-100
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar = ({ progress, showLabel = true, className }: ProgressBarProps) => {
  const getProgressConfig = (value: number) => {
    if (value === 100) return { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-500', ring: 'ring-green-500/20' };
    if (value >= 75) return { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-500', ring: 'ring-blue-500/20' };
    if (value >= 50) return { bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-500', ring: 'ring-yellow-500/20' };
    if (value >= 25) return { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-500', ring: 'ring-orange-500/20' };
    return { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-500', ring: 'ring-red-500/20' };
  };

  const config = getProgressConfig(progress);

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Progress value={progress} className="flex-1 h-2" />
      {showLabel && (
        <div className={cn(
          'inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset min-w-[3.5rem]',
          config.bg,
          config.text,
          config.ring
        )}>
          {progress}%
        </div>
      )}
    </div>
  );
};
