/**
 * SETUP PROGRESS CARD COMPONENT
 *
 * Displays a checklist of onboarding tasks with progress tracking.
 *
 * USAGE:
 * Add to dashboard for digital/sales users:
 * ```tsx
 * import { SetupProgressCard } from '@/components/onboarding/SetupProgressCard';
 *
 * <SetupProgressCard />
 * ```
 *
 * CUSTOMIZATION:
 * - Edit tasks: src/config/setup-tasks.ts
 * - Edit appearance: Modify component styles below
 * - Edit behavior: useSetupProgress hook
 *
 * FEATURES:
 * - Automatic progress calculation
 * - Quick action buttons for each task
 * - Dismissible (won't show again after dismissed)
 * - Hides when all tasks completed
 *
 * FUTURE ENHANCEMENTS:
 * - Confetti animation when all tasks complete
 * - Celebratory message on completion
 * - Badges/rewards for completing tasks
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useSetupProgress } from '@/hooks/useSetupProgress';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  X,
  Sparkles,
  User,
  FileText,
  Users as UsersIcon,
} from 'lucide-react';
import { SetupTask } from '@/config/setup-tasks';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Icon mapping for task categories
 */
const categoryIcons = {
  profile: User,
  content: FileText,
  configuration: FileText,
  relationships: UsersIcon,
};

/**
 * Individual task row component
 */
const TaskRow: React.FC<{
  task: SetupTask;
  isCompleted: boolean;
  stats: any;
}> = ({ task, isCompleted, stats }) => {
  const navigate = useNavigate();
  const Icon = categoryIcons[task.category];

  const handleAction = () => {
    if (task.actionPath) {
      navigate(task.actionPath);
    }
  };

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
        isCompleted
          ? 'bg-muted/50 border-transparent'
          : 'bg-background border-border hover:border-primary/50'
      }`}
    >
      {/* Completion indicator */}
      <div className="mt-0.5">
        {isCompleted ? (
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <p
            className={`text-sm font-medium ${
              isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
            }`}
          >
            {task.label}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">{task.description}</p>
      </div>

      {/* Action button */}
      {!isCompleted && task.actionLabel && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAction}
          className="flex-shrink-0"
        >
          {task.actionLabel}
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      )}
    </div>
  );
};

/**
 * Main SetupProgressCard component
 */
export const SetupProgressCard: React.FC = () => {
  const {
    tasks,
    stats,
    progress,
    isLoading,
    dismissSetup,
    shouldShowSetup,
  } = useSetupProgress();

  // Don't show if dismissed, no tasks, or not applicable department
  if (!shouldShowSetup || tasks.length === 0) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="border-2">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-2 w-full" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!stats || !progress) {
    return null;
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Get Started</CardTitle>
              <CardDescription>
                Complete these steps to unlock full features
              </CardDescription>
            </div>
          </div>

          {/* Dismiss button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={dismissSetup}
            className="h-8 w-8"
            aria-label="Dismiss setup checklist"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="space-y-2 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {progress.completedCount} of {progress.totalTasks} completed
            </span>
            <Badge variant="secondary" size="sm">
              {progress.percentage}%
            </Badge>
          </div>
          <Progress value={progress.percentage} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {tasks
          .sort((a, b) => a.priority - b.priority)
          .map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              isCompleted={task.checkCompletion(stats)}
              stats={stats}
            />
          ))}
      </CardContent>
    </Card>
  );
};
