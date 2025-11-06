import { SongStage } from '@/types/song';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowProgressBarProps {
  currentStage: SongStage;
  className?: string;
}

const workflowStages: { key: SongStage; label: string; description: string }[] = [
  { key: 'draft', label: 'Draft', description: 'Initial creation' },
  { key: 'publishing', label: 'Publishing', description: 'Rights clearance' },
  { key: 'label_recording', label: 'Recording', description: 'Studio production' },
  { key: 'marketing_assets', label: 'Marketing', description: 'Asset creation' },
  { key: 'label_review', label: 'Review', description: 'Label approval' },
  { key: 'ready_for_digital', label: 'Ready', description: 'Pre-distribution' },
  { key: 'digital_distribution', label: 'Distribution', description: 'Platform delivery' },
  { key: 'released', label: 'Released', description: 'Live on platforms' },
];

const stageColors: Record<SongStage, string> = {
  draft: 'from-gray-400 to-gray-500',
  publishing: 'from-blue-400 to-blue-600',
  label_recording: 'from-purple-400 to-purple-600',
  marketing_assets: 'from-pink-400 to-pink-600',
  label_review: 'from-orange-400 to-orange-600',
  ready_for_digital: 'from-green-400 to-green-600',
  digital_distribution: 'from-teal-400 to-teal-600',
  released: 'from-emerald-400 to-emerald-600',
  archived: 'from-slate-400 to-slate-600',
};

export const WorkflowProgressBar = ({ currentStage, className }: WorkflowProgressBarProps) => {
  const currentIndex = workflowStages.findIndex((s) => s.key === currentStage);

  return (
    <div className={cn('w-full py-6', className)}>
      {/* Desktop view - horizontal */}
      <div className="hidden lg:block">
        <div className="relative">
          {/* Connection lines */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700" />

          {/* Active progress line */}
          <div
            className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${(currentIndex / (workflowStages.length - 1)) * 100}%` }}
          />

          {/* Stage nodes */}
          <div className="relative flex justify-between">
            {workflowStages.map((stage, index) => {
              const isCompleted = index < currentIndex;
              const isCurrent = index === currentIndex;
              const isPending = index > currentIndex;

              return (
                <div key={stage.key} className="flex flex-col items-center" style={{ flex: 1 }}>
                  {/* Node circle */}
                  <div
                    className={cn(
                      'relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300',
                      isCompleted && 'bg-gradient-to-br from-blue-500 to-purple-600 border-blue-600 shadow-lg',
                      isCurrent && `bg-gradient-to-br ${stageColors[currentStage]} border-white shadow-xl ring-4 ring-opacity-30`,
                      isPending && 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                    )}
                  >
                    {isCompleted && <Check className="h-5 w-5 text-white" />}
                    {isCurrent && <Circle className="h-5 w-5 text-white fill-white" />}
                    {isPending && <Circle className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
                  </div>

                  {/* Stage label */}
                  <div className="mt-3 text-center max-w-[100px]">
                    <p
                      className={cn(
                        'text-xs font-medium transition-colors',
                        isCurrent && 'text-foreground font-semibold',
                        (isCompleted || isPending) && 'text-muted-foreground'
                      )}
                    >
                      {stage.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 hidden xl:block">
                      {stage.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile/Tablet view - vertical */}
      <div className="lg:hidden space-y-3">
        {workflowStages.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={stage.key} className="flex items-center gap-3">
              {/* Node circle */}
              <div
                className={cn(
                  'flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300',
                  isCompleted && 'bg-gradient-to-br from-blue-500 to-purple-600 border-blue-600',
                  isCurrent && `bg-gradient-to-br ${stageColors[currentStage]} border-white ring-4 ring-opacity-30`,
                  isPending && 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                )}
              >
                {isCompleted && <Check className="h-4 w-4 text-white" />}
                {isCurrent && <Circle className="h-4 w-4 text-white fill-white" />}
                {isPending && <Circle className="h-3 w-3 text-gray-400 dark:text-gray-500" />}
              </div>

              {/* Stage info */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium',
                    isCurrent && 'text-foreground font-semibold',
                    (isCompleted || isPending) && 'text-muted-foreground'
                  )}
                >
                  {stage.label}
                </p>
                <p className="text-xs text-muted-foreground">{stage.description}</p>
              </div>

              {/* Connector line */}
              {index < workflowStages.length - 1 && (
                <div className="absolute left-[15px] mt-12 w-0.5 h-8 -ml-px">
                  <div
                    className={cn(
                      'w-full h-full',
                      index < currentIndex && 'bg-gradient-to-b from-blue-500 to-purple-600',
                      index >= currentIndex && 'bg-gray-200 dark:bg-gray-700'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
