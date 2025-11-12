import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Task, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, TASK_TAG_LABELS, TASK_TYPE_LABELS, TASK_STATUS_COLORS, TASK_TAG_COLORS } from '@/api/types/tasks';
import { useDeleteTask, useUpdateTask } from '@/api/hooks/useTasks';
import {
  Calendar,
  Clock,
  Flag,
  Tag,
  User,
  Trash2,
  CheckCircle2,
  Link as LinkIcon,
  Bell,
  BellOff,
  TrendingUp,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { InlineEditableField } from './InlineEditableField';
import { FloatingToolbar } from './FloatingToolbar';
import { InlineStatusBadge } from './InlineStatusBadge';
import { InlineDatePicker } from './InlineDatePicker';
import { InlineAssigneeSelect } from './InlineAssigneeSelect';
import { InlinePrioritySelect } from './InlinePrioritySelect';

interface TaskDetailPanelProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailPanel({ task, open, onOpenChange }: TaskDetailPanelProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [labels, setLabels] = useState<string[]>([]);
  const [labelInput, setLabelInput] = useState('');

  const deleteTask = useDeleteTask();
  const updateTask = useUpdateTask();

  useEffect(() => {
    if (task) {
      setLabels(task.labels || []);
    }
  }, [task]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === 'Escape' && !showDeleteDialog) {
        onOpenChange(false);
      }
      // Cmd/Ctrl + Backspace to delete
      if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace') {
        e.preventDefault();
        setShowDeleteDialog(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange, showDeleteDialog]);

  if (!task) return null;

  const handleUpdateField = async (field: string, value: any) => {
    try {
      await updateTask.mutateAsync({
        id: task.id,
        data: { [field]: value },
      });
      toast.success('Updated successfully');
    } catch (error) {
      console.error('Failed to update:', error);
      toast.error('Failed to update');
      throw error;
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask.mutateAsync(task.id);
      toast.success('Task deleted');
      setShowDeleteDialog(false);
      onOpenChange(false);
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/tasks/${task.id}`);
    toast.success('Link copied to clipboard');
  };

  const handleDuplicate = async () => {
    toast.info('Duplicate feature coming soon');
  };

  const addLabel = async () => {
    if (labelInput.trim() && !labels.includes(labelInput.trim())) {
      const newLabels = [...labels, labelInput.trim()];
      setLabels(newLabels);
      setLabelInput('');
      await handleUpdateField('labels', newLabels);
    }
  };

  const removeLabel = async (label: string) => {
    const newLabels = labels.filter((l) => l !== label);
    setLabels(newLabels);
    await handleUpdateField('labels', newLabels);
  };

  const assignedUsers = task.assigned_to_users_detail || [];
  const hasFollowUpReminder = !!task.reminder_date;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          className={cn(
            'w-full sm:max-w-2xl overflow-y-auto p-0',
            'animate-in slide-in-from-right duration-300 ease-out'
          )}
        >
          {/* Floating Toolbar */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <InlineStatusBadge
                  value={task.status}
                  onSave={(value) => handleUpdateField('status', value)}
                  labels={TASK_STATUS_LABELS}
                  colors={TASK_STATUS_COLORS}
                />
                <InlinePrioritySelect
                  value={task.priority}
                  onSave={(value) => handleUpdateField('priority', value)}
                />
                {task.tag && (
                  <Badge variant={TASK_TAG_COLORS[task.tag] as any}>
                    <Tag className="mr-1 h-3 w-3" />
                    {TASK_TAG_LABELS[task.tag]}
                  </Badge>
                )}
              </div>
              <FloatingToolbar
                onCopyLink={handleCopyLink}
                onDuplicate={handleDuplicate}
                onDelete={() => setShowDeleteDialog(true)}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Title - Large and Prominent */}
            <SheetHeader className="space-y-4">
              <InlineEditableField
                value={task.title}
                onSave={(value) => handleUpdateField('title', value)}
                placeholder="Task title"
                displayClassName="text-3xl font-bold leading-tight tracking-tight"
                editClassName="text-3xl font-bold"
              />
              <Badge variant="outline" className="w-fit">
                {TASK_TYPE_LABELS[task.task_type]}
              </Badge>
            </SheetHeader>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Description
              </h4>
              <InlineEditableField
                value={task.description || ''}
                onSave={(value) => handleUpdateField('description', value)}
                placeholder="Add a description..."
                multiline
                displayClassName="text-sm leading-relaxed"
              />
            </div>

            <Separator />

            {/* Properties Grid */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Properties
              </h4>

              <div className="space-y-3">
                {/* Assignees */}
                <div className="flex items-start gap-3 group">
                  <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Assigned to</span>
                  </div>
                  <div className="flex-1">
                    <InlineAssigneeSelect
                      value={task.assigned_to_users_detail?.map(u => u.id) || []}
                      onSave={(value) => handleUpdateField('assigned_to_users', value)}
                      placeholder="Add assignees..."
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Due Date */}
                <div className="flex items-start gap-3 group">
                  <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Due date</span>
                  </div>
                  <div className="flex-1">
                    <InlineDatePicker
                      value={task.due_date}
                      onSave={(value) => handleUpdateField('due_date', value)}
                      placeholder="Add due date..."
                      className="w-full"
                    />
                    {task.is_overdue && task.status !== 'done' && (
                      <Badge variant="destructive" className="text-xs mt-2">
                        Overdue
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Follow-up Reminder */}
                {hasFollowUpReminder && (
                  <div className="flex items-start gap-3 group">
                    <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                      {task.follow_up_reminder_sent ? (
                        <BellOff className="h-4 w-4" />
                      ) : (
                        <Bell className="h-4 w-4 text-orange-500" />
                      )}
                      <span>Follow-up</span>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-sm">{format(new Date(task.reminder_date!), 'PPP')}</span>
                      {!task.follow_up_reminder_sent && (
                        <Badge variant="outline" className="text-xs">
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Time Tracking */}
                {(task.estimated_hours || task.actual_hours) && (
                  <div className="flex items-start gap-3 group">
                    <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Time</span>
                    </div>
                    <div className="flex-1">
                      <div className="grid grid-cols-2 gap-4">
                        {task.estimated_hours && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Estimated</p>
                            <p className="text-xl font-semibold">{task.estimated_hours}h</p>
                          </div>
                        )}
                        {task.actual_hours && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Actual</p>
                            <p className="text-xl font-semibold">{task.actual_hours}h</p>
                          </div>
                        )}
                      </div>
                      {task.estimated_hours && task.actual_hours && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground">
                            {task.actual_hours > task.estimated_hours
                              ? `Over by ${(task.actual_hours - task.estimated_hours).toFixed(1)}h`
                              : `Under by ${(task.estimated_hours - task.actual_hours).toFixed(1)}h`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Progress */}
                {task.completion_percentage > 0 && (
                  <div className="flex items-start gap-3 group">
                    <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span>Progress</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <Progress value={task.completion_percentage} className="h-2 flex-1" />
                        <span className="text-sm font-medium w-12 text-right">
                          {task.completion_percentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Labels */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Labels
              </h4>
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => (
                  <Badge
                    key={label}
                    variant="secondary"
                    className="group hover:bg-destructive/10 transition-colors duration-200"
                  >
                    {label}
                    <X
                      className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => removeLabel(label)}
                    />
                  </Badge>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add label..."
                    value={labelInput}
                    onChange={(e) => setLabelInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addLabel();
                      }
                    }}
                    className="h-7 w-32 text-sm"
                  />
                  <Button size="sm" variant="outline" onClick={addLabel} className="h-7">
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Related Items */}
            {(task.campaign_detail || task.entity_detail) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Related To
                  </h4>
                  <div className="space-y-2">
                    {task.campaign_detail && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/50">
                        <span className="text-sm font-medium">Campaign:</span>
                        <span className="text-sm">{task.campaign_detail.name}</span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          {task.campaign_detail.status}
                        </Badge>
                      </div>
                    )}
                    {task.entity_detail && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/50">
                        <span className="text-sm font-medium">Client:</span>
                        <span className="text-sm">{task.entity_detail.display_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Timeline */}
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Timeline
              </h4>
              <div className="space-y-2 text-sm">
                {task.started_at && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Started:</span>
                    <span>{format(new Date(task.started_at), 'PPP')}</span>
                  </div>
                )}
                {task.completed_at && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Completed:</span>
                    <span>{format(new Date(task.completed_at), 'PPP')}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Created:</span>
                  <span>{format(new Date(task.created_at), 'PPP')}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {task.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Notes
                  </h4>
                  <InlineEditableField
                    value={task.notes}
                    onSave={(value) => handleUpdateField('notes', value)}
                    placeholder="Add notes..."
                    multiline
                    displayClassName="text-sm leading-relaxed"
                  />
                </div>
              </>
            )}

            {/* Footer - Created By */}
            {task.created_by_detail && (
              <div className="pt-4 text-xs text-muted-foreground border-t">
                Created by {task.created_by_detail.full_name} on{' '}
                {format(new Date(task.created_at), 'PPP')}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{task.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
