import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Loader2, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { useAuthStore } from '@/stores/authStore';
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
import { useDeleteTask, useUpdateTask, useCreateTask } from '@/api/hooks/useTasks';
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
  FileText,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { FloatingToolbar } from './FloatingToolbar';
import { InlineStatusBadge } from './InlineStatusBadge';
import { InlineDatePicker } from './InlineDatePicker';
import { InlineAssigneeSelect } from './InlineAssigneeSelect';
import { InlinePrioritySelect } from './InlinePrioritySelect';
import { InlineDepartmentSelect } from './InlineDepartmentSelect';
import { InlineDurationSelect } from './InlineDurationSelect';
import { TaskRichTextEditor } from './TaskRichTextEditor';

interface TaskDetailPanelProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createMode?: boolean; // New prop to indicate create mode
}

export function TaskDetailPanel({ task, open, onOpenChange, createMode = false }: TaskDetailPanelProps) {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [localTitle, setLocalTitle] = useState('');
  const [localDescription, setLocalDescription] = useState('');
  const [localNotes, setLocalNotes] = useState('');
  const [localPriority, setLocalPriority] = useState<number>(2);
  const [localDueDate, setLocalDueDate] = useState<string | null>(null);
  const [localAssignees, setLocalAssignees] = useState<number[]>([]);
  const [localDepartment, setLocalDepartment] = useState<number | null>(null);
  const [localEstimatedHours, setLocalEstimatedHours] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'dirty' | 'saving' | 'creating'>('idle');
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const [createdTaskId, setCreatedTaskId] = useState<number | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const isCreateMode = createMode && !task && !createdTaskId;

  const deleteTask = useDeleteTask();
  const updateTask = useUpdateTask();
  const createTask = useCreateTask();

  // Get current user for admin check
  const { user, isAdmin: isAdminFn } = useAuthStore();
  const isAdmin = isAdminFn();

  // Fetch all tasks to extract unique departments with IDs (for admin users)
  const { data: tasksData } = useQuery({
    queryKey: ['tasks-for-departments'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/crm/tasks/', {
        params: { limit: 1000 } // Get enough to extract all departments
      });
      return response.data;
    },
    enabled: isAdmin, // Only fetch if user is admin
  });

  // Extract unique departments from tasks (as {id: number, name: string})
  const departments = tasksData?.results
    ? Array.from(
        new Map(
          tasksData.results
            .filter((t: any) => t.department && t.department_name)
            .map((t: any) => [t.department, { id: t.department, name: t.department_name }])
        ).values()
      )
    : [];

  // Debug: Log departments data
  useEffect(() => {
    if (isAdmin && tasksData) {
      console.log('Tasks data:', tasksData);
      console.log('Extracted departments:', departments);
    }
  }, [tasksData, departments, isAdmin]);

  // Focus title input in create mode
  useEffect(() => {
    if (open && isCreateMode && titleInputRef.current) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [open, isCreateMode]);

  // Initialize local state when task changes or when opening in create mode
  useEffect(() => {
    if (open) {
      if (task) {
        setLocalTitle(task.title || '');
        setLocalDescription(task.description || '');
        setLocalNotes(task.notes || '');
        setLocalPriority(task.priority || 2);
        setLocalDueDate(task.due_date || null);
        setLocalAssignees(task.assigned_to_users_detail?.map(u => u.id) || []);
        setLocalDepartment(task.department || null);
        setLocalEstimatedHours(task.estimated_hours || null);
        setSaveState('idle');
        setCreatedTaskId(null);
      } else if (createMode) {
        // Reset for create mode and auto-assign current user
        setLocalTitle('');
        setLocalDescription('');
        setLocalNotes('');
        setLocalPriority(2);
        setLocalDueDate(null);
        setLocalAssignees(user?.id ? [Number(user.id)] : []); // Auto-assign current user
        setLocalDepartment(null); // Admin users need to select department manually
        setLocalEstimatedHours(null);
        setSaveState('idle');
        setCreatedTaskId(null);
      }
    }
  }, [task, open, createMode, user]);

  // Auto-save with debounce (handles both create and update)
  useEffect(() => {
    if (!open) return;
    if (!localTitle.trim()) return; // Don't save/create without title

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Determine if we need to save
    const needsCreate = isCreateMode && !createdTaskId;
    const needsUpdate = (task || createdTaskId) && (
      localTitle !== (task?.title || '') ||
      localDescription !== (task?.description || '') ||
      localNotes !== (task?.notes || '') ||
      localPriority !== (task?.priority || 2) ||
      localDueDate !== (task?.due_date || null) ||
      localDepartment !== (task?.department || null) ||
      JSON.stringify(localAssignees) !== JSON.stringify(task?.assigned_to_users_detail?.map(u => u.id) || [])
    );

    if (needsCreate || needsUpdate) {
      setSaveState(needsCreate ? 'creating' : 'dirty');

      // Set new timer for auto-save
      debounceTimerRef.current = setTimeout(async () => {
        try {
          if (needsCreate) {
            // Create new task
            setSaveState('creating');
            const newTask = await createTask.mutateAsync({
              title: localTitle,
              description: localDescription || undefined,
              notes: localNotes || undefined,
              status: 'todo',
              priority: localPriority,
              due_date: localDueDate || undefined,
              assigned_user_ids: localAssignees.length > 0 ? localAssignees : undefined,
              department: localDepartment || undefined,
            });
            setCreatedTaskId(newTask.id);
            setSaveState('idle');
            setShowSavedIndicator(true);
            setTimeout(() => setShowSavedIndicator(false), 2000);
            toast.success('Task created');
          } else {
            // Update existing task
            setSaveState('saving');
            const taskId = task?.id || createdTaskId!;
            await updateTask.mutateAsync({
              id: taskId,
              data: {
                title: localTitle,
                description: localDescription || undefined,
                notes: localNotes || undefined,
                priority: localPriority,
                due_date: localDueDate || undefined,
                assigned_user_ids: localAssignees.length > 0 ? localAssignees : undefined,
                department: localDepartment || undefined,
              },
            });
            setSaveState('idle');
            setShowSavedIndicator(true);
            setTimeout(() => setShowSavedIndicator(false), 2000);
          }
        } catch (error) {
          setSaveState('idle');
          toast.error(needsCreate ? 'Failed to create task' : 'Failed to save changes');
        }
      }, 1000);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [localTitle, localDescription, localNotes, localPriority, localDueDate, localDepartment, localAssignees, task, createdTaskId, open, isCreateMode]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close (only if task exists or was created)
      if (e.key === 'Escape' && !showDeleteDialog && (task || createdTaskId)) {
        onOpenChange(false);
      }
      // Cmd/Ctrl + Backspace to delete (only if task exists)
      if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace' && (task || createdTaskId)) {
        e.preventDefault();
        setShowDeleteDialog(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange, showDeleteDialog, task, createdTaskId]);

  // Don't render if not open or (not in create mode and no task)
  if (!open || (!createMode && !task)) return null;

  const handleUpdateField = async (field: string, value: any) => {
    // Can't update fields before task is created
    if (!task && !createdTaskId) {
      toast.error('Please enter a title first');
      return;
    }

    try {
      const taskId = task?.id || createdTaskId!;
      await updateTask.mutateAsync({
        id: taskId,
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
    const taskId = task?.id || createdTaskId;
    if (!taskId) return;

    try {
      await deleteTask.mutateAsync(taskId);
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

  const assignedUsers = task?.assigned_to_users_detail || [];
  const hasFollowUpReminder = !!task?.reminder_date;

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
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3 flex-1">
                {saveState === 'creating' && (
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Creating task...
                  </span>
                )}
                {saveState === 'saving' && (
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                  </span>
                )}
                {showSavedIndicator && saveState === 'idle' && (
                  <span className="text-xs text-green-600 dark:text-green-500 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-600 dark:bg-green-500"></span>
                    {isCreateMode && !createdTaskId ? 'Saved' : 'Saved'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {task ? (
                  <>
                    <InlineStatusBadge
                      value={task.status}
                      onSave={(value) => handleUpdateField('status', value)}
                      labels={TASK_STATUS_LABELS}
                      colors={TASK_STATUS_COLORS}
                    />
                    <InlinePrioritySelect
                      value={localPriority}
                      onSave={isCreateMode ? (value) => setLocalPriority(value) : (value) => handleUpdateField('priority', value)}
                    />
                    {task.tag && (
                      <Badge variant={TASK_TAG_COLORS[task.tag] as any}>
                        <Tag className="mr-1 h-3 w-3" />
                        {TASK_TAG_LABELS[task.tag]}
                      </Badge>
                    )}
                    <Badge variant="outline" className="ml-2">
                      {TASK_TYPE_LABELS[task.task_type]}
                    </Badge>
                  </>
                ) : (
                  <>
                    <Badge variant="outline">Todo</Badge>
                    <InlinePrioritySelect
                      value={localPriority}
                      onSave={(value) => setLocalPriority(value)}
                    />
                    <Badge variant="secondary" className="text-xs">
                      {createdTaskId ? 'Task Created' : 'New Task'}
                    </Badge>
                  </>
                )}
              </div>
              {(task || createdTaskId) && (
                <FloatingToolbar
                  onCopyLink={handleCopyLink}
                  onDuplicate={handleDuplicate}
                  onDelete={() => setShowDeleteDialog(true)}
                />
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Title - Large and Prominent (Notion style) */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider pl-1">
                Title {isCreateMode && '*'}
              </label>
              <input
                ref={titleInputRef}
                type="text"
                placeholder={isCreateMode ? "Task title..." : "Task title"}
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                className="w-full text-3xl font-bold bg-transparent px-1 py-2 placeholder:text-muted-foreground/30"
                style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                onFocus={(e) => e.target.style.outline = 'none'}
              />
              {isCreateMode && !localTitle && (
                <p className="text-xs text-muted-foreground/70 pl-1">
                  Start typing to create the task...
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Description
              </label>
              <TaskRichTextEditor
                content={localDescription}
                onChange={setLocalDescription}
                placeholder="Add a description..."
                minimal
              />
            </div>

            <Separator />

            {/* Properties Grid */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Properties
              </h4>

              <div className="space-y-3">
                {/* Priority */}
                <div className="flex items-start gap-3 group">
                  <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                    <Flag className="h-4 w-4" />
                    <span>Priority</span>
                  </div>
                  <div className="flex-1">
                    <InlinePrioritySelect
                      value={localPriority}
                      onSave={async (value) => {
                        setLocalPriority(value);
                        if (!isCreateMode && (task || createdTaskId)) {
                          await handleUpdateField('priority', value);
                        }
                      }}
                      className="w-full justify-start"
                    />
                  </div>
                </div>

                {/* Assignees */}
                <div className="flex items-start gap-3 group">
                  <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Assigned to</span>
                  </div>
                  <div className="flex-1">
                    <InlineAssigneeSelect
                      value={localAssignees}
                      onSave={async (value) => {
                        setLocalAssignees(value);
                        if (!isCreateMode && (task || createdTaskId)) {
                          await handleUpdateField('assigned_to_users', value);
                        }
                      }}
                      placeholder="Add assignees..."
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Department (for admin users) */}
                {isAdmin && (
                  <div className="flex items-start gap-3 group">
                    <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>Department</span>
                    </div>
                    <div className="flex-1">
                      <InlineDepartmentSelect
                        value={localDepartment}
                        departments={departments}
                        onSave={async (value) => {
                          setLocalDepartment(value);
                          if (!isCreateMode && (task || createdTaskId) && value !== null) {
                            await handleUpdateField('department', value);
                          }
                        }}
                        placeholder="Select department..."
                        className="w-full"
                        isLoading={!tasksData && isAdmin}
                      />
                      {!localDepartment && (
                        <p className="text-xs text-amber-600 dark:text-amber-500 mt-1 flex items-center gap-1">
                          ⚠️ Department is required to save tasks
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Due Date */}
                <div className="flex items-start gap-3 group">
                  <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Due date</span>
                  </div>
                  <div className="flex-1">
                    <InlineDatePicker
                      value={localDueDate}
                      onSave={async (value) => {
                        setLocalDueDate(value);
                        if (!isCreateMode && (task || createdTaskId)) {
                          await handleUpdateField('due_date', value);
                        }
                      }}
                      placeholder="Add due date..."
                      className="w-full"
                    />
                    {task?.is_overdue && task?.status !== 'done' && (
                      <Badge variant="destructive" className="text-xs mt-2">
                        Overdue
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Estimated Duration */}
                <div className="flex items-start gap-3 group">
                  <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Estimated</span>
                  </div>
                  <div className="flex-1">
                    <InlineDurationSelect
                      value={localEstimatedHours}
                      onSave={async (value) => {
                        setLocalEstimatedHours(value);
                        if (!isCreateMode && (task || createdTaskId)) {
                          await handleUpdateField('estimated_hours', value);
                        }
                      }}
                      placeholder="Set estimated time"
                      className="w-full justify-start"
                    />
                  </div>
                </div>

                {/* Actual Duration (Read-only, auto-calculated) */}
                {task?.actual_hours && (
                  <div className="flex items-start gap-3 group">
                    <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Actual</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {task.actual_hours < 1
                            ? `${Math.round(task.actual_hours * 60)} min`
                            : task.actual_hours === 1
                            ? '1 hour'
                            : task.actual_hours % 1 === 0
                            ? `${task.actual_hours} hours`
                            : `${Math.floor(task.actual_hours)}h ${Math.round((task.actual_hours % 1) * 60)}m`
                          }
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          Auto-calculated
                        </Badge>
                      </div>
                      {task.estimated_hours && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {task.actual_hours > task.estimated_hours
                            ? `${((task.actual_hours - task.estimated_hours) * 60).toFixed(0)} min over estimate`
                            : task.actual_hours < task.estimated_hours
                            ? `${((task.estimated_hours - task.actual_hours) * 60).toFixed(0)} min under estimate`
                            : 'Exactly as estimated'}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Follow-up Reminder */}
                {hasFollowUpReminder && task && (
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

                {/* Progress */}
                {task && task.completion_percentage > 0 && (
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

            {/* Related Items */}
            {task && (task.campaign_detail || task.entity_detail || task.opportunity_detail || task.song_detail || task.contract_detail) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Related To
                  </h4>
                  <div className="space-y-2">
                    {task.opportunity_detail && (
                      <button
                        onClick={() => {
                          navigate(`/sales/opportunities/${task.opportunity}`);
                          onOpenChange(false);
                        }}
                        className="flex items-center gap-2 p-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer w-full text-left"
                      >
                        <span className="text-sm font-medium">Opportunity:</span>
                        <span className="text-sm">{task.opportunity_detail.title}</span>
                        <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                      </button>
                    )}
                    {task.song_detail && (
                      <button
                        onClick={() => {
                          navigate(`/songs/${task.song}`);
                          onOpenChange(false);
                        }}
                        className="flex items-center gap-2 p-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer w-full text-left"
                      >
                        <span className="text-sm font-medium">Song:</span>
                        <span className="text-sm">{task.song_detail.title}</span>
                        <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                      </button>
                    )}
                    {task.campaign_detail && (
                      <button
                        onClick={() => {
                          navigate(`/digital/campaigns/${task.campaign}`);
                          onOpenChange(false);
                        }}
                        className="flex items-center gap-2 p-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer w-full text-left"
                      >
                        <span className="text-sm font-medium">Campaign:</span>
                        <span className="text-sm">{task.campaign_detail.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {task.campaign_detail.status}
                        </Badge>
                        <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                      </button>
                    )}
                    {task.entity_detail && (
                      <button
                        onClick={() => {
                          navigate(`/entity/${task.entity}`);
                          onOpenChange(false);
                        }}
                        className="flex items-center gap-2 p-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer w-full text-left"
                      >
                        <span className="text-sm font-medium">Client:</span>
                        <span className="text-sm">{task.entity_detail.display_name}</span>
                        <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                      </button>
                    )}
                    {task.contract_detail && (
                      <button
                        onClick={() => {
                          navigate(`/contracts/${task.contract}`);
                          onOpenChange(false);
                        }}
                        className="flex items-center gap-2 p-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer w-full text-left"
                      >
                        <span className="text-sm font-medium">Contract:</span>
                        <span className="text-sm">{task.contract_detail.title}</span>
                        <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Timeline */}
            {task && (
              <>
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
              </>
            )}

            {/* Notes - Always visible */}
            <Separator />
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-3 w-3" />
                Notes
              </label>
              <TaskRichTextEditor
                content={localNotes}
                onChange={setLocalNotes}
                placeholder="Add notes, meeting minutes, or additional context..."
              />
            </div>

            {/* Footer - Created By */}
            {task?.created_by_detail && (
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
              Are you sure you want to delete "{task?.title || localTitle || 'this task'}"? This action cannot be undone.
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
