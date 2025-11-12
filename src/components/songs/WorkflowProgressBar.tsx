import { useState } from 'react';
import { SongStage, SongStageStatus, StageStatus } from '@/types/song';
import { Check, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StageActionMenu } from './StageActionMenu';
import { BlockStageDialog } from './BlockStageDialog';
import { updateStageStatus } from '@/api/songApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface WorkflowProgressBarProps {
  songId: number;
  currentStage?: SongStage;
  stageStatuses?: SongStageStatus[];
  className?: string;
  interactive?: boolean;
  selectedStage?: SongStage;
  onStageClick?: (stage: SongStage) => void;
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

const stageRingColors: Record<SongStage, string> = {
  draft: 'text-gray-400',
  publishing: 'text-blue-500',
  label_recording: 'text-purple-500',
  marketing_assets: 'text-pink-500',
  label_review: 'text-orange-500',
  ready_for_digital: 'text-green-500',
  digital_distribution: 'text-teal-500',
  released: 'text-emerald-500',
  archived: 'text-slate-500',
};

export const WorkflowProgressBar = ({
  songId,
  currentStage,
  stageStatuses,
  className,
  interactive = true,
  selectedStage,
  onStageClick,
}: WorkflowProgressBarProps) => {
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockingStage, setBlockingStage] = useState<SongStage | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Mutation for updating stage status
  const updateStageMutation = useMutation({
    mutationFn: ({ stage, status, notes, blocked_reason }: {
      stage: SongStage;
      status: StageStatus;
      notes?: string;
      blocked_reason?: string;
    }) => updateStageStatus(songId, stage, { status, notes, blocked_reason }),
    onSuccess: () => {
      // Invalidate song query to refresh data
      queryClient.invalidateQueries({ queryKey: ['song', songId] });
      toast({
        title: 'Stage updated',
        description: 'The stage status has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating stage',
        description: error.response?.data?.error || 'Failed to update stage status',
        variant: 'destructive',
      });
    },
  });

  // Handler for stage actions
  const handleStageAction = (stage: SongStage, action: 'start' | 'complete' | 'block' | 'resume' | 'reopen') => {
    switch (action) {
      case 'start':
      case 'resume':
      case 'reopen':
        updateStageMutation.mutate({
          stage,
          status: 'in_progress',
        });
        break;

      case 'complete':
        updateStageMutation.mutate({
          stage,
          status: 'completed',
        });
        break;

      case 'block':
        setBlockingStage(stage);
        setBlockDialogOpen(true);
        break;
    }
  };

  // Handler for block confirmation
  const handleBlockConfirm = (reason: string) => {
    if (blockingStage) {
      updateStageMutation.mutate({
        stage: blockingStage,
        status: 'blocked',
        blocked_reason: reason,
      });
    }
    setBlockDialogOpen(false);
    setBlockingStage(null);
  };

  // Handler for stage click
  const handleStageClick = (stage: SongStage) => {
    if (onStageClick) {
      onStageClick(stage);
    }
  };

  // Helper: Get stage status object
  const getStageStatusObj = (stageKey: SongStage): SongStageStatus | undefined => {
    return stageStatuses?.find(s => s.stage === stageKey);
  };

  // Helper: Get status for a stage
  const getStageStatus = (stageKey: SongStage): StageStatus => {
    if (stageStatuses) {
      // Use full stage statuses if available
      const status = stageStatuses.find(s => s.stage === stageKey);
      return status?.status || 'not_started';
    } else if (currentStage) {
      // Fallback to old behavior for backward compatibility
      const currentIndex = workflowStages.findIndex(s => s.key === currentStage);
      const stageIndex = workflowStages.findIndex(s => s.key === stageKey);

      if (stageIndex < currentIndex) return 'completed';
      if (stageIndex === currentIndex) return 'in_progress';
      return 'not_started';
    }
    return 'not_started';
  };

  // Calculate progress line width (show progress to furthest active/completed stage)
  const calculateProgressWidth = (): number => {
    let furthestIndex = 0;

    workflowStages.forEach((stage, index) => {
      const status = getStageStatus(stage.key);
      if (status === 'completed' || status === 'in_progress') {
        furthestIndex = Math.max(furthestIndex, index);
      }
    });

    return (furthestIndex / (workflowStages.length - 1)) * 100;
  };

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
            style={{ width: `${calculateProgressWidth()}%` }}
          />

          {/* Stage nodes */}
          <div className="relative flex justify-between">
            {workflowStages.map((stage) => {
              const status = getStageStatus(stage.key);
              const isCompleted = status === 'completed';
              const isActive = status === 'in_progress';
              const isBlocked = status === 'blocked';
              const isPending = status === 'not_started';
              const isSelected = selectedStage === stage.key;

              return (
                <div key={stage.key} className="group flex flex-col items-center relative" style={{ flex: 1 }}>
                  {/* Node circle with action menu */}
                  <div className="relative">
                    <button
                      onClick={() => handleStageClick(stage.key)}
                      className={cn(
                        'relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-[transform,background,border] duration-1010 cursor-pointer',
                        'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
                        isCompleted && 'bg-gradient-to-br from-blue-500 to-purple-600 border-blue-600 shadow-lg',
                        isActive && `bg-gradient-to-br ${stageColors[stage.key]} ${stageRingColors[stage.key]} border-white animate-pulse-ring`,
                        isBlocked && 'bg-gradient-to-br from-red-500 to-red-600 border-red-700 shadow-xl',
                        isPending && 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600',
                        isSelected && 'ring-4 ring-primary ring-offset-2'
                      )}
                      title={`Click to view ${stage.label} checklist`}
                    >
                      {isCompleted && <Check className="h-5 w-5 text-white" />}
                      {isActive && <Circle className="h-5 w-5 text-white fill-white" />}
                      {isBlocked && <AlertCircle className="h-5 w-5 text-white" />}
                      {isPending && <Circle className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
                    </button>

                    {/* Action Menu */}
                    {interactive && (
                      <div className="absolute -top-1 -right-1 z-20">
                        <StageActionMenu
                          stage={stage.key}
                          stageStatus={getStageStatusObj(stage.key)}
                          onAction={(action) => handleStageAction(stage.key, action)}
                          disabled={updateStageMutation.isPending}
                        />
                      </div>
                    )}
                  </div>

                  {/* Stage label */}
                  <div className="mt-3 text-center max-w-[100px]">
                    <p
                      className={cn(
                        'text-xs font-medium transition-colors',
                        isActive && 'text-foreground font-semibold',
                        isBlocked && 'text-red-600 dark:text-red-400 font-semibold',
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
        {workflowStages.map((stage) => {
          const status = getStageStatus(stage.key);
          const isCompleted = status === 'completed';
          const isActive = status === 'in_progress';
          const isBlocked = status === 'blocked';
          const isPending = status === 'not_started';
          const isSelected = selectedStage === stage.key;

          return (
            <div
              key={stage.key}
              className={cn(
                'group flex items-center gap-3 p-2 rounded-lg transition-all cursor-pointer hover:bg-accent',
                isSelected && 'bg-accent ring-2 ring-primary'
              )}
              onClick={() => handleStageClick(stage.key)}
            >
              {/* Node circle */}
              <div className="relative">
                <div
                  className={cn(
                    'flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-[transform,background,border] ',
                    isCompleted && 'bg-gradient-to-br from-blue-500 to-purple-600 border-blue-600',
                    isActive && `bg-gradient-to-br ${stageColors[stage.key]} ${stageRingColors[stage.key]} border-white animate-pulse-ring`,
                    isBlocked && 'bg-gradient-to-br from-red-500 to-red-600 border-red-700',
                    isPending && 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                  )}
                >
                  {isCompleted && <Check className="h-4 w-4 text-white" />}
                  {isActive && <Circle className="h-4 w-4 text-white fill-white" />}
                  {isBlocked && <AlertCircle className="h-4 w-4 text-white" />}
                  {isPending && <Circle className="h-3 w-3 text-gray-400 dark:text-gray-500" />}
                </div>
              </div>

              {/* Stage info */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium',
                    isActive && 'text-foreground font-semibold',
                    isBlocked && 'text-red-600 dark:text-red-400 font-semibold',
                    (isCompleted || isPending) && 'text-muted-foreground'
                  )}
                >
                  {stage.label}
                  {isBlocked && ' (Blocked)'}
                </p>
                <p className="text-xs text-muted-foreground">{stage.description}</p>
              </div>

              {/* Action Menu for mobile */}
              {interactive && (
                <div onClick={(e) => e.stopPropagation()}>
                  <StageActionMenu
                    stage={stage.key}
                    stageStatus={getStageStatusObj(stage.key)}
                    onAction={(action) => handleStageAction(stage.key, action)}
                    disabled={updateStageMutation.isPending}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Block Stage Dialog */}
      <BlockStageDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        stageName={blockingStage ? workflowStages.find(s => s.key === blockingStage)?.label || '' : ''}
        onConfirm={handleBlockConfirm}
        isLoading={updateStageMutation.isPending}
      />
    </div>
  );
};
