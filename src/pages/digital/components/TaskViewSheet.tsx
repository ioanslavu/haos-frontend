import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Task, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, TASK_TAG_LABELS, TASK_TYPE_LABELS, TASK_STATUS_COLORS, TASK_PRIORITY_COLORS, TASK_TAG_COLORS } from '@/api/types/tasks';
import { useDeleteTask, useUpdateTaskStatus } from '@/api/hooks/useTasks';
import {
  Calendar,
  Clock,
  Flag,
  Tag,
  User,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  Bell,
  BellOff,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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
import { useState } from 'react';

interface TaskViewSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
}

export function TaskViewSheet({ task, open, onOpenChange, onEdit }: TaskViewSheetProps) {
  const deleteTask = useDeleteTask();
  const updateTaskStatus = useUpdateTaskStatus();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!task) return null;

  const handleDelete = async () => {
    await deleteTask.mutateAsync(task.id);
    setShowDeleteDialog(false);
    onOpenChange(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    await updateTaskStatus.mutateAsync({ id: task.id, status: newStatus });
  };

  const assignedUsers = task.assigned_to_users_detail || [];
  const hasFollowUpReminder = !!task.reminder_date;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <SheetTitle className="text-2xl leading-tight">{task.title}</SheetTitle>
                <SheetDescription className="mt-2 flex flex-wrap gap-2">
                  <Badge variant={TASK_STATUS_COLORS[task.status] as any}>
                    {TASK_STATUS_LABELS[task.status]}
                  </Badge>
                  <Badge variant={TASK_PRIORITY_COLORS[task.priority] as any}>
                    <Flag className="mr-1 h-3 w-3" />
                    {TASK_PRIORITY_LABELS[task.priority]}
                  </Badge>
                  {task.tag && (
                    <Badge variant={TASK_TAG_COLORS[task.tag] as any}>
                      <Tag className="mr-1 h-3 w-3" />
                      {TASK_TAG_LABELS[task.tag]}
                    </Badge>
                  )}
                  <Badge variant="outline">{TASK_TYPE_LABELS[task.task_type]}</Badge>
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Description */}
            {task.description && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            )}

            <Separator />

            {/* Status Quick Change */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Change Status</h4>
              <Select value={task.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="review">In Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Assigned Users */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Assigned To ({assignedUsers.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {assignedUsers.length > 0 ? (
                  assignedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 rounded-lg border px-3 py-2"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {user.full_name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{user.full_name}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No users assigned</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Related Items */}
            {(task.campaign_detail || task.entity_detail) && (
              <>
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Related To
                  </h4>
                  <div className="space-y-2">
                    {task.campaign_detail && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Campaign:</span>
                        <span>{task.campaign_detail.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {task.campaign_detail.status}
                        </Badge>
                      </div>
                    )}
                    {task.entity_detail && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Client:</span>
                        <span>{task.entity_detail.display_name}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Timeline */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </h4>
              <div className="space-y-2 text-sm">
                {task.due_date && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Due:</span>
                    <span
                      className={cn(
                        task.is_overdue && task.status !== 'done'
                          ? 'text-red-600 font-semibold'
                          : ''
                      )}
                    >
                      {format(new Date(task.due_date), 'PPP')}
                    </span>
                    {task.is_overdue && task.status !== 'done' && (
                      <Badge variant="destructive" className="text-xs">
                        Overdue
                      </Badge>
                    )}
                  </div>
                )}
                {hasFollowUpReminder && (
                  <div className="flex items-center gap-2">
                    {task.follow_up_reminder_sent ? (
                      <BellOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Bell className="h-4 w-4 text-orange-500" />
                    )}
                    <span className="font-medium">Follow-up:</span>
                    <span>{format(new Date(task.reminder_date!), 'PPP')}</span>
                    {!task.follow_up_reminder_sent && (
                      <Badge variant="outline" className="text-xs">
                        Pending
                      </Badge>
                    )}
                  </div>
                )}
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

            {/* Time Tracking */}
            {(task.estimated_hours || task.actual_hours) && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-3">Time Tracking</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {task.estimated_hours && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Estimated</p>
                        <p className="text-2xl font-bold">{task.estimated_hours}h</p>
                      </div>
                    )}
                    {task.actual_hours && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Actual</p>
                        <p className="text-2xl font-bold">{task.actual_hours}h</p>
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
              </>
            )}

            {/* Notes */}
            {task.notes && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.notes}</p>
                </div>
              </>
            )}

            {/* Created By */}
            {task.created_by_detail && (
              <>
                <Separator />
                <div className="text-xs text-muted-foreground">
                  Created by {task.created_by_detail.full_name} on{' '}
                  {format(new Date(task.created_at), 'PPP')}
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-2">
            <Button onClick={onEdit} className="flex-1">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
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
