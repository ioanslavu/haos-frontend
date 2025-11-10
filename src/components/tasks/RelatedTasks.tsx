import { useSongTasks, useWorkTasks, useRecordingTasks, useOpportunityTasks, useDeliverableTasks } from '@/api/hooks/useTasks';
import { Task } from '@/api/types/tasks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, TASK_STATUS_COLORS, TASK_PRIORITY_COLORS } from '@/api/types/tasks';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatDistance } from 'date-fns';

interface RelatedTasksProps {
  entityType: 'song' | 'work' | 'recording' | 'opportunity' | 'deliverable';
  entityId: number;
  title?: string;
  description?: string;
  showEmpty?: boolean;
}

const useEntityTasks = (entityType: string, entityId: number) => {
  switch (entityType) {
    case 'song':
      return useSongTasks(entityId);
    case 'work':
      return useWorkTasks(entityId);
    case 'recording':
      return useRecordingTasks(entityId);
    case 'opportunity':
      return useOpportunityTasks(entityId);
    case 'deliverable':
      return useDeliverableTasks(entityId);
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
};

function TaskItem({ task }: { task: Task }) {
  const isOverdue = task.is_overdue;
  const isDone = task.status === 'done';

  return (
    <div className="flex items-start justify-between border-b border-border/50 py-3 last:border-0">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          {isDone ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : isOverdue ? (
            <AlertCircle className="h-4 w-4 text-red-600" />
          ) : (
            <Clock className="h-4 w-4 text-muted-foreground" />
          )}
          <p className={`text-sm font-medium ${isDone ? 'line-through text-muted-foreground' : ''}`}>
            {task.title}
          </p>
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground pl-6">{task.description}</p>
        )}
        <div className="flex items-center gap-2 pl-6">
          <Badge
            variant="outline"
            className={`text-xs bg-${TASK_STATUS_COLORS[task.status]}-50 text-${TASK_STATUS_COLORS[task.status]}-700 border-${TASK_STATUS_COLORS[task.status]}-200`}
          >
            {TASK_STATUS_LABELS[task.status]}
          </Badge>
          <Badge
            variant="outline"
            className={`text-xs bg-${TASK_PRIORITY_COLORS[task.priority]}-50 text-${TASK_PRIORITY_COLORS[task.priority]}-700 border-${TASK_PRIORITY_COLORS[task.priority]}-200`}
          >
            {TASK_PRIORITY_LABELS[task.priority]}
          </Badge>
          {task.department_name && (
            <span className="text-xs text-muted-foreground">{task.department_name}</span>
          )}
        </div>
      </div>
      <div className="text-right text-xs text-muted-foreground">
        {task.due_date && (
          <div className={isOverdue ? 'text-red-600 font-medium' : ''}>
            Due {formatDistance(new Date(task.due_date), new Date(), { addSuffix: true })}
          </div>
        )}
      </div>
    </div>
  );
}

export function RelatedTasks({
  entityType,
  entityId,
  title = 'Related Tasks',
  description,
  showEmpty = false,
}: RelatedTasksProps) {
  const { data: tasks, isLoading } = useEntityTasks(entityType, entityId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <div className="animate-pulse text-muted-foreground">Loading tasks...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tasks || tasks.length === 0) {
    if (!showEmpty) {
      return null;
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            No tasks found
          </div>
        </CardContent>
      </Card>
    );
  }

  // Separate tasks by status
  const activeTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');
  const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'cancelled');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <Badge variant="secondary">{tasks.length}</Badge>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        {activeTasks.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Active Tasks</h4>
            <div className="space-y-0">
              {activeTasks.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}
        {completedTasks.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">Completed Tasks</h4>
            <div className="space-y-0">
              {completedTasks.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
