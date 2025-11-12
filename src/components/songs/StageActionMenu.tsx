import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { SongStage, SongStageStatus, StageStatus } from '@/types/song';
import { Play, CheckCircle2, Ban, RotateCcw, MoreVertical, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StageActionMenuProps {
  stage: SongStage;
  stageStatus: SongStageStatus | undefined;
  onAction: (action: 'start' | 'complete' | 'block' | 'resume' | 'reopen') => void;
  disabled?: boolean;
}

export const StageActionMenu = ({
  stage,
  stageStatus,
  onAction,
  disabled = false,
}: StageActionMenuProps) => {
  const [open, setOpen] = useState(false);

  const status: StageStatus = stageStatus?.status || 'not_started';
  const stageLabel = stageStatus?.stage_display || stage;

  // Determine available actions based on current status
  const getAvailableActions = () => {
    switch (status) {
      case 'not_started':
        return [
          {
            action: 'start' as const,
            label: 'Start working on this stage',
            icon: Play,
            description: 'Mark this stage as in progress',
            variant: 'default' as const,
          },
        ];

      case 'in_progress':
        return [
          {
            action: 'complete' as const,
            label: 'Complete stage',
            icon: CheckCircle2,
            description: 'Mark this stage as completed',
            variant: 'default' as const,
          },
          {
            action: 'block' as const,
            label: 'Block stage',
            icon: Ban,
            description: 'Mark as blocked with reason',
            variant: 'destructive' as const,
          },
        ];

      case 'blocked':
        return [
          {
            action: 'resume' as const,
            label: 'Resume stage',
            icon: Play,
            description: 'Mark as in progress again',
            variant: 'default' as const,
          },
        ];

      case 'completed':
        return [
          {
            action: 'reopen' as const,
            label: 'Reopen stage',
            icon: RotateCcw,
            description: 'Mark as in progress again',
            variant: 'default' as const,
          },
        ];

      default:
        return [];
    }
  };

  const actions = getAvailableActions();

  if (actions.length === 0) {
    return null;
  }

  const handleAction = (action: 'start' | 'complete' | 'block' | 'resume' | 'reopen') => {
    onAction(action);
    setOpen(false);
  };

  // Show blocked reason if blocked
  const blockedReason = status === 'blocked' ? stageStatus?.blocked_reason : null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity',
            open && 'opacity-100'
          )}
          disabled={disabled}
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Open stage actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{stageLabel}</p>
            <p className="text-xs text-muted-foreground">
              Status: {stageStatus?.status_display || 'Not Started'}
            </p>
          </div>
        </DropdownMenuLabel>

        {blockedReason && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-2">
              <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <p className="line-clamp-2">{blockedReason}</p>
              </div>
            </div>
          </>
        )}

        <DropdownMenuSeparator />

        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={action.action}
              onClick={() => handleAction(action.action)}
              className={cn(
                'cursor-pointer',
                action.variant === 'destructive' && 'text-red-600 focus:text-red-600 dark:text-red-400'
              )}
            >
              <Icon className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span className="text-sm">{action.label}</span>
                <span className="text-xs text-muted-foreground">{action.description}</span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
