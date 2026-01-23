import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Flag,
  User,
  LayoutGrid,
  List,
  Activity,
  Link2,
  Briefcase,
  Music,
  Archive,
  RotateCcw,
  Maximize2,
  ArrowLeft,
  Repeat,
  Settings2,
  Play,
  Pause,
  Trash2,
  X,
} from 'lucide-react';
import { RecurringTaskPanel } from '@/components/recurring/RecurringTaskPanel';
import { cn, getInitials } from '@/lib/utils';
import { PLATFORM_ICONS, PLATFORM_TEXT_COLORS } from '@/lib/platform-icons';
import type { Platform } from '@/types/campaign';
import {
  useProjectTasks,
  useArchiveProject,
  useActivateProject,
  useUpdateProjectTask,
  useRecurringTaskTemplates,
  useDeleteRecurringTaskTemplate,
  useActivateRecurringTask,
  useDeactivateRecurringTask,
} from '@/api/hooks/useProjects';
import { useUpdateTaskCustomFieldValue, useBulkUpdateTaskCustomFieldValues } from '@/api/hooks/useCustomFields';
import { useUpdateTask } from '@/api/hooks/useTasks';
import {
  PROJECT_TYPE_CONFIG,
  PROJECT_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
  type Project,
  type ProjectTask,
  type RecurringTaskTemplate,
} from '@/types/projects';
import { format, isToday, isPast } from 'date-fns';
import { Task, TaskStatus, TaskType, TASK_STATUS_LABELS, TASK_TYPE_LABELS } from '@/api/types/tasks';
import { TaskCalendar } from '@/components/tasks/TaskCalendar';
import { StatusGroupedCompactTable } from '@/components/tasks/StatusGroupedCompactTable';
import { TaskDetailPanel } from '@/components/tasks/TaskDetailPanel';
import { EmployeeTaskFilter } from '@/components/tasks/EmployeeTaskFilter';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/error-handler';

interface ProjectTasksViewProps {
  project: Project;
  showBackButton?: boolean;
  showFullPageButton?: boolean;
  onClose?: () => void;
  initialTaskId?: number;
}

// Convert ProjectTask to Task format for compatibility with existing components
function convertProjectTaskToTask(projectTask: ProjectTask): Task {
  return {
    id: projectTask.id,
    title: projectTask.title,
    description: projectTask.description || '',
    task_type: (projectTask.task_type || 'general') as TaskType,
    status: projectTask.status as TaskStatus,
    priority: projectTask.priority,
    due_date: projectTask.due_date || undefined,
    is_overdue: projectTask.is_overdue,
    is_blocked: projectTask.status === 'blocked',
    department: projectTask.department,
    created_at: projectTask.created_at,
    updated_at: projectTask.updated_at,
    notes: projectTask.notes || undefined,
    estimated_hours: projectTask.estimated_hours || undefined,
    assigned_to_users: projectTask.assigned_to_users_detail?.map(u => u.id) ||
      (projectTask.assigned_to ? [projectTask.assigned_to.id] : []),
    assigned_to_users_detail: projectTask.assigned_to_users_detail ||
      (projectTask.assigned_to ? [{
        id: projectTask.assigned_to.id,
        email: projectTask.assigned_to.email,
        full_name: projectTask.assigned_to.full_name,
      }] : []),
    assigned_team: projectTask.assigned_team || undefined,
    assigned_team_detail: projectTask.assigned_team_detail || undefined,
    created_by: projectTask.created_by?.id,
    created_by_detail: projectTask.created_by ? {
      id: projectTask.created_by.id,
      email: projectTask.created_by.email,
      full_name: projectTask.created_by.full_name,
    } : undefined,
    reviewed_by: projectTask.reviewed_by?.id,
    reviewed_by_detail: projectTask.reviewed_by ? {
      id: projectTask.reviewed_by.id,
      email: projectTask.reviewed_by.email,
      full_name: projectTask.reviewed_by.full_name,
    } : undefined,
    custom_field_values: projectTask.custom_field_values,
    // Domain info from registry (campaign, song, etc.)
    domain_info: projectTask.domain_info,
  };
}

// Droppable Column Component
function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'h-full flex-shrink-0 rounded-xl transition-all duration-200',
        isOver && 'bg-primary/5 ring-2 ring-primary/30 scale-[1.02]'
      )}
    >
      {children}
    </div>
  );
}

// Draggable Task Card Component
function DraggableTaskCard({ task, children, onClick }: { task: Task; children: React.ReactNode; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(isDragging && 'opacity-30')}
      onClick={(e) => {
        if (!isDragging) {
          onClick();
        }
      }}
    >
      {children}
    </div>
  );
}

// Related Entity Component - displays linked domain entity (campaign, song, opportunity, etc.)
function RelatedEntity({ task, onClick }: { task: Task; onClick: (e: React.MouseEvent, path: string) => void }) {
  // Use domain_info from the registry (new agnostic approach)
  if (task.domain_info) {
    const { domain_type, entity_id, entity_name, extra } = task.domain_info;

    // For campaigns with subcampaign, show platform icon
    if (domain_type === 'campaign' && extra?.subcampaign?.platform) {
      const platform = extra.subcampaign.platform as Platform;
      const PlatformIcon = PLATFORM_ICONS[platform];
      const colorClass = PLATFORM_TEXT_COLORS[platform] || 'text-muted-foreground';

      return (
        <div
          onClick={(e) => onClick(e, `/campaigns/${entity_id}`)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
        >
          {PlatformIcon && <PlatformIcon className={cn("h-2.5 w-2.5 flex-shrink-0", colorClass)} />}
          <span className="truncate group-hover:underline">{entity_name}</span>
        </div>
      );
    }

    // Map domain types to icons and paths
    const domainConfig: Record<string, { icon: React.ReactNode; path: string }> = {
      campaign: { icon: <Link2 className="h-2.5 w-2.5 flex-shrink-0" />, path: `/campaigns/${entity_id}` },
      opportunity: { icon: <Briefcase className="h-2.5 w-2.5 flex-shrink-0" />, path: `/sales/opportunities/${entity_id}` },
      song: { icon: <Music className="h-2.5 w-2.5 flex-shrink-0" />, path: `/songs/${entity_id}` },
      entity: { icon: <User className="h-2.5 w-2.5 flex-shrink-0" />, path: `/entities/${entity_id}` },
    };

    const config = domainConfig[domain_type];
    if (config) {
      return (
        <div
          onClick={(e) => onClick(e, config.path)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
        >
          {config.icon}
          <span className="truncate group-hover:underline">{entity_name}</span>
        </div>
      );
    }
  }

  // Fallback to legacy fields for backwards compatibility
  if (task.opportunity && task.opportunity_detail) {
    return (
      <div
        onClick={(e) => onClick(e, `/sales/opportunities/${task.opportunity}`)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
      >
        <Briefcase className="h-2.5 w-2.5 flex-shrink-0" />
        <span className="truncate group-hover:underline">{task.opportunity_detail.title}</span>
      </div>
    );
  }

  if (task.song && task.song_detail) {
    return (
      <div
        onClick={(e) => onClick(e, `/songs/${task.song}`)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
      >
        <Music className="h-2.5 w-2.5 flex-shrink-0" />
        <span className="truncate group-hover:underline">{task.song_detail.title}</span>
      </div>
    );
  }

  if (task.entity && task.entity_detail) {
    return (
      <div
        onClick={(e) => onClick(e, `/entities/${task.entity}`)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
      >
        <User className="h-2.5 w-2.5 flex-shrink-0" />
        <span className="truncate group-hover:underline">{task.entity_detail.display_name}</span>
      </div>
    );
  }

  if (task.campaign && task.campaign_detail) {
    return (
      <div
        onClick={(e) => onClick(e, `/campaigns/${task.campaign}`)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
      >
        <Link2 className="h-2.5 w-2.5 flex-shrink-0" />
        <span className="truncate group-hover:underline">{task.campaign_detail.name}</span>
      </div>
    );
  }

  return null;
}

export function ProjectTasksView({ project, showBackButton, showFullPageButton, onClose, initialTaskId }: ProjectTasksViewProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isMarketingDepartment = user?.department?.toLowerCase() === 'marketing';

  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'calendar'>('kanban');
  const [listDensity, setListDensity] = useState<'comfortable' | 'compact'>('compact');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [viewTask, setViewTask] = useState<Task | null>(null);
  const [taskViewOpen, setTaskViewOpen] = useState(false);
  const [taskCreateOpen, setTaskCreateOpen] = useState(false);
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
  const [selectedRecurringTemplate, setSelectedRecurringTemplate] = useState<RecurringTaskTemplate | undefined>();
  const [recurringManageOpen, setRecurringManageOpen] = useState(false);
  const [recurringSearchQuery, setRecurringSearchQuery] = useState('');
  const [recurringFilterStatus, setRecurringFilterStatus] = useState<'all' | 'active' | 'paused'>('all');

  // Setup drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch tasks for this project
  const { data: tasks, isLoading: isLoadingTasks } = useProjectTasks({ project: project.id });

  // Fetch recurring templates for recurring projects
  const { data: recurringTemplates, isLoading: isLoadingTemplates } = useRecurringTaskTemplates(
    project.is_recurring_project ? { project: project.id } : undefined
  );

  const archiveProject = useArchiveProject();
  const activateProject = useActivateProject();
  const updateProjectTask = useUpdateProjectTask();
  const updateTask = useUpdateTask();
  const deleteRecurringTemplate = useDeleteRecurringTaskTemplate();
  const activateTemplate = useActivateRecurringTask();
  const deactivateTemplate = useDeactivateRecurringTask();

  const typeConfig = PROJECT_TYPE_CONFIG[project.project_type];
  const statusConfig = PROJECT_STATUS_CONFIG[project.status];
  const isArchived = project.status === 'archived';

  // Convert ProjectTasks to Tasks for compatibility
  const allTasks: Task[] = tasks?.map(convertProjectTaskToTask) || [];

  // Auto-open task if initialTaskId is provided (e.g., from notification deep link)
  useEffect(() => {
    if (initialTaskId && allTasks.length > 0) {
      const taskToOpen = allTasks.find(t => t.id === initialTaskId);
      if (taskToOpen) {
        setViewTask(taskToOpen);
        setTaskViewOpen(true);
      }
    }
  }, [initialTaskId, allTasks.length]);

  // Calculate stats
  const overdueTasks = allTasks.filter(t => t.is_overdue && t.status !== 'done');
  const dueTodayTasks = allTasks.filter(t => t.due_date && isToday(new Date(t.due_date)) && t.status !== 'done');

  // Filter tasks
  const filteredTasks = allTasks.filter(task => {
    if (!showCompleted && task.status === 'done') return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterPriority !== 'all' && task.priority !== parseInt(filterPriority)) return false;
    if (selectedEmployees.length > 0 && !task.assigned_to_users?.some(id => selectedEmployees.includes(id))) return false;
    return true;
  });

  // Group tasks by status for kanban view
  const tasksByStatus = {
    todo: filteredTasks.filter(t => t.status === 'todo'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    blocked: filteredTasks.filter(t => t.status === 'blocked'),
    review: filteredTasks.filter(t => t.status === 'review'),
    done: filteredTasks.filter(t => t.status === 'done'),
  };

  const statusColumns = [
    { id: 'todo', label: 'To Do', icon: Clock, color: 'bg-gray-500' },
    { id: 'in_progress', label: 'In Progress', icon: Activity, color: 'bg-blue-500' },
    { id: 'blocked', label: 'Blocked', icon: AlertTriangle, color: 'bg-red-500' },
    { id: 'review', label: 'In Review', icon: AlertCircle, color: 'bg-orange-500' },
    { id: 'done', label: 'Done', icon: CheckCircle, color: 'bg-green-500' },
  ];

  const handleArchiveToggle = () => {
    if (isArchived) {
      activateProject.mutate(project.id);
    } else {
      archiveProject.mutate(project.id);
    }
  };

  const handleTaskClick = (task: Task) => {
    setViewTask(task);
    setTaskViewOpen(true);
  };

  const handleStatusUpdate = async (taskId: number, status: string) => {
    try {
      await updateProjectTask.mutateAsync({
        id: taskId,
        data: { status: status as ProjectTask['status'] },
      });
      toast.success('Status updated');
    } catch (error) {
      handleApiError(error, {
        context: 'updating task status',
        showToast: true,
      });
    }
  };

  const handlePriorityUpdate = async (taskId: number, priority: number) => {
    try {
      await updateProjectTask.mutateAsync({
        id: taskId,
        data: { priority: priority as ProjectTask['priority'] },
      });
      toast.success('Priority updated');
    } catch (error) {
      handleApiError(error, {
        context: 'updating task priority',
        showToast: true,
      });
    }
  };

  const handleAssigneeUpdate = async (taskId: number, assignedToUsers: number[]) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        data: { assigned_user_ids: assignedToUsers },
      });
      toast.success('Assignee updated');
    } catch (error) {
      handleApiError(error, {
        context: 'updating task assignee',
        showToast: true,
      });
    }
  };

  const handleDateUpdate = async (taskId: number, dueDate: string | null) => {
    try {
      await updateProjectTask.mutateAsync({
        id: taskId,
        data: { due_date: dueDate },
      });
      toast.success('Due date updated');
    } catch (error) {
      toast.error('Failed to update task due date');
    }
  };

  // Custom field update
  const updateCustomFieldValue = useUpdateTaskCustomFieldValue();
  const bulkUpdateCustomFieldValues = useBulkUpdateTaskCustomFieldValues();

  const handleCustomFieldUpdate = async (taskId: number, fieldId: number, value: string | null) => {
    // Find the value ID from the task's custom_field_values
    const task = tasks.find(t => t.id === taskId);
    const fieldValue = task?.custom_field_values?.[fieldId];

    if (fieldValue?.id) {
      // Update existing value
      updateCustomFieldValue.mutate({
        taskId,
        valueId: fieldValue.id,
        data: { value },
      }, {
        onSuccess: () => {
          // Refetch both queries to sync inline and modal
          queryClient.refetchQueries({ queryKey: ['project-tasks'] });
          queryClient.refetchQueries({ queryKey: ['tasks', taskId, 'fieldsWithDefinitions'] });
        },
      });
    } else {
      // Create new value using bulk update
      bulkUpdateCustomFieldValues.mutate({
        taskId,
        values: [{ field_definition_id: fieldId, value }],
      }, {
        onSuccess: () => {
          // Refetch both queries to sync inline and modal
          queryClient.refetchQueries({ queryKey: ['project-tasks'] });
          queryClient.refetchQueries({ queryKey: ['tasks', taskId, 'fieldsWithDefinitions'] });
        },
      });
    }
  };

  const handleRelatedEntityClick = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    navigate(path);
  };

  const handleEditRecurringTemplate = (template: RecurringTaskTemplate) => {
    setSelectedRecurringTemplate(template);
    setRecurringDialogOpen(true);
  };

  const handleNewRecurringTask = () => {
    setSelectedRecurringTemplate(undefined);
    setRecurringDialogOpen(true);
  };

  const handleToggleTemplateActive = async (template: RecurringTaskTemplate) => {
    try {
      if (template.is_active) {
        await deactivateTemplate.mutateAsync(template.id);
        toast.success('Recurring task paused');
      } else {
        await activateTemplate.mutateAsync(template.id);
        toast.success('Recurring task activated');
      }
    } catch (error) {
      toast.error('Failed to update recurring task');
    }
  };

  // Parse RRULE to human-readable format
  const parseRRuleToText = (rrule: string): string => {
    const parts = rrule.split(';');
    const ruleMap: Record<string, string> = {};
    parts.forEach(part => {
      const [key, value] = part.split('=');
      ruleMap[key] = value;
    });

    const freq = ruleMap.FREQ?.toLowerCase() || 'weekly';
    const interval = parseInt(ruleMap.INTERVAL || '1');

    if (freq === 'daily') {
      return interval === 1 ? 'Daily' : `Every ${interval} days`;
    } else if (freq === 'weekly') {
      const dayMap: Record<string, string> = {
        'SU': 'Sun', 'MO': 'Mon', 'TU': 'Tue', 'WE': 'Wed', 'TH': 'Thu', 'FR': 'Fri', 'SA': 'Sat'
      };
      const days = ruleMap.BYDAY?.split(',').map(d => dayMap[d]).join(', ') || '';
      return interval === 1 ? `Weekly on ${days}` : `Every ${interval} weeks on ${days}`;
    } else if (freq === 'monthly') {
      const day = ruleMap.BYMONTHDAY || '1';
      return interval === 1 ? `Monthly on day ${day}` : `Every ${interval} months on day ${day}`;
    } else {
      return interval === 1 ? 'Yearly' : `Every ${interval} years`;
    }
  };

  const getPriorityColor = (priority: number) => {
    const colors = {
      1: 'text-gray-500',
      2: 'text-blue-500',
      3: 'text-orange-500',
      4: 'text-red-500',
    };
    return colors[priority as keyof typeof colors] || 'text-gray-500';
  };

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as number;
    const task = filteredTasks.find((t) => t.id === taskId);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveTask(null);
      return;
    }

    const taskId = active.id as number;
    const newStatus = over.id as TaskStatus;

    const task = filteredTasks.find((t) => t.id === taskId);

    if (task && task.status !== newStatus) {
      await handleStatusUpdate(taskId, newStatus);
    }

    setActiveTask(null);
  };

  const handleDragCancel = () => {
    setActiveTask(null);
  };

  return (
    <>
      <div className="flex flex-col h-full space-y-4">
        {/* Control Bar */}
        <div className="relative overflow-hidden rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />

          <div className="relative z-10 p-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                {showBackButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/workboard')}
                    className="rounded-lg"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-xl text-lg",
                  "bg-gradient-to-br",
                  typeConfig.color.replace('bg-', 'from-') + '/20',
                  typeConfig.color.replace('bg-', 'to-') + '/10'
                )}>
                  {typeConfig.icon}
                </div>
                <div>
                  <h1 className={cn("font-bold tracking-tight", showBackButton ? "text-2xl" : "text-xl")}>{project.name}</h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{typeConfig.label}</span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "rounded-md text-xs",
                        statusConfig.bgColor,
                        statusConfig.color
                      )}
                    >
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {overdueTasks.length > 0 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                      <span className="text-sm font-bold text-red-600 dark:text-red-400">{overdueTasks.length}</span>
                      <span className="text-xs text-red-600/70 dark:text-red-400/70">overdue</span>
                    </div>
                  )}
                  {dueTodayTasks.length > 0 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20">
                      <Clock className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                      <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{dueTodayTasks.length}</span>
                      <span className="text-xs text-orange-600/70 dark:text-orange-400/70">today</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {showFullPageButton && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigate(`/workboard/${project.id}`);
                      onClose?.();
                    }}
                    className="rounded-lg"
                  >
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Full Page
                  </Button>
                )}
                {/* Hide archive for projects with "general" in name */}
                {!project.name.toLowerCase().includes('general') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleArchiveToggle}
                    className="rounded-lg"
                  >
                    {isArchived ? (
                      <>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restore
                      </>
                    ) : (
                      <>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </>
                    )}
                  </Button>
                )}
                {project.is_recurring_project ? (
                  <Button
                    onClick={handleNewRecurringTask}
                    size="default"
                    className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                  >
                    <Repeat className="h-4 w-4 mr-2" />
                    New Recurring Task
                  </Button>
                ) : (
                  <Button
                    onClick={() => setTaskCreateOpen(true)}
                    size="default"
                    className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Task
                  </Button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">
                  {project.completed_task_count} of {project.task_count} tasks completed
                </span>
                <span className="text-xs font-medium">{project.completion_percentage}%</span>
              </div>
              <Progress value={project.completion_percentage} className="h-1.5" />
            </div>

            {/* Recurring Templates Summary */}
            {project.is_recurring_project && recurringTemplates && recurringTemplates.length > 0 && (
              <div className="mb-4">
                <div
                  onClick={() => setRecurringManageOpen(true)}
                  className="flex items-center justify-between p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 cursor-pointer hover:bg-indigo-500/10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10">
                      <Repeat className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div>
                      <span className="text-sm font-medium">Recurring Tasks</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-600 border-green-500/20">
                          {recurringTemplates.filter(t => t.is_active).length} active
                        </Badge>
                        {recurringTemplates.filter(t => !t.is_active).length > 0 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {recurringTemplates.filter(t => !t.is_active).length} paused
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-indigo-600">
                    <Settings2 className="h-4 w-4 mr-1" />
                    Manage
                  </Button>
                </div>
              </div>
            )}

            {/* Filters Row */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9 rounded-lg bg-background/50 border-white/10"
                  />
                </div>
              </div>

              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[130px] h-9 rounded-lg">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="4">Urgent</SelectItem>
                  <SelectItem value="3">High</SelectItem>
                  <SelectItem value="2">Normal</SelectItem>
                  <SelectItem value="1">Low</SelectItem>
                </SelectContent>
              </Select>

              <EmployeeTaskFilter
                selectedEmployees={selectedEmployees}
                onSelectionChange={setSelectedEmployees}
              />

              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-completed-view"
                  checked={showCompleted}
                  onCheckedChange={(checked) => setShowCompleted(checked as boolean)}
                />
                <label htmlFor="show-completed-view" className="text-sm">
                  Show completed
                </label>
              </div>

              <div className="flex gap-2">
                <div className="flex gap-1 p-0.5 bg-muted rounded-lg">
                  <Button
                    variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('kanban')}
                    className="h-7 w-7 rounded-md"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-7 w-7 rounded-md"
                  >
                    <List className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('calendar')}
                    className="h-7 w-7 rounded-md"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {viewMode === 'list' && !isMarketingDepartment && (
                  <div className="flex gap-1 p-0.5 bg-muted rounded-lg">
                    <Button
                      variant={listDensity === 'comfortable' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setListDensity('comfortable')}
                      className="h-7 px-2 rounded-md text-xs"
                    >
                      Comfortable
                    </Button>
                    <Button
                      variant={listDensity === 'compact' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setListDensity('compact')}
                      className="h-7 px-2 rounded-md text-xs"
                    >
                      Compact
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex-1 overflow-hidden">
            {isLoadingTasks ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading tasks...</div>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <LayoutGrid className="h-12 w-12 mb-3 opacity-50" />
                <p className="font-medium">No tasks yet</p>
                <p className="text-sm mt-1">Create your first task to get started</p>
                <Button size="sm" className="mt-4 rounded-lg" onClick={() => setTaskCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>
            ) : viewMode === 'kanban' ? (
              // Kanban View
              <div className="flex gap-3 h-full overflow-x-auto pb-2">
                {statusColumns.map((column) => {
                  const columnTasks = tasksByStatus[column.id as keyof typeof tasksByStatus];

                  return (
                    <DroppableColumn key={column.id} id={column.id}>
                      <div className="w-[280px] h-full flex flex-col">
                        <div className="flex items-center justify-between px-2 py-2 mb-2 flex-shrink-0">
                          <div className="flex items-center gap-1.5">
                            <div className={cn("w-1.5 h-1.5 rounded-full",
                              column.id === 'todo' ? 'bg-gray-400' :
                              column.id === 'in_progress' ? 'bg-blue-500' :
                              column.id === 'blocked' ? 'bg-red-500' :
                              column.id === 'review' ? 'bg-orange-500' :
                              'bg-green-500'
                            )} />
                            <h3 className="text-xs font-semibold">{column.label}</h3>
                            <span className="text-xs text-muted-foreground font-medium">{columnTasks.length}</span>
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
                          {columnTasks.map((task) => (
                            <DraggableTaskCard key={task.id} task={task} onClick={() => handleTaskClick(task)}>
                              <Card className="group p-2.5 cursor-grab active:cursor-grabbing hover:shadow-lg hover:border-primary/40 transition-all duration-200 bg-card border-border/60">
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between gap-1.5">
                                    <h4 className="text-xs font-semibold line-clamp-2 leading-tight flex-1">{task.title}</h4>
                                    <div className={cn(
                                      "flex-shrink-0 w-4 h-4 rounded flex items-center justify-center",
                                      task.priority === 4 ? 'bg-red-500/15' :
                                      task.priority === 3 ? 'bg-orange-500/15' :
                                      task.priority === 2 ? 'bg-blue-500/15' :
                                      'bg-gray-500/15'
                                    )}>
                                      <Flag className={cn("h-2.5 w-2.5", getPriorityColor(task.priority))} />
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <Badge variant="outline" className="text-[10px] font-normal border-border/60 bg-background/50 h-4 px-1.5">
                                      {TASK_TYPE_LABELS[task.task_type]}
                                    </Badge>
                                    <RelatedEntity task={task} onClick={handleRelatedEntityClick} />
                                  </div>

                                  <div className="flex items-center justify-between pt-1.5 border-t border-border/30">
                                    {task.assigned_to_users_detail && task.assigned_to_users_detail.length > 0 ? (
                                      <div className="flex items-center gap-1">
                                        <div className="flex -space-x-1.5">
                                          {task.assigned_to_users_detail.slice(0, 2).map((user) => (
                                            <Avatar key={user.id} className="h-5 w-5 border border-background">
                                              <AvatarFallback className="text-[10px] font-medium">
                                                {getInitials(user.full_name)}
                                              </AvatarFallback>
                                            </Avatar>
                                          ))}
                                        </div>
                                        {task.assigned_to_users_detail.length > 2 && (
                                          <span className="text-[10px] text-muted-foreground font-medium">
                                            +{task.assigned_to_users_detail.length - 2}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="w-5 h-5 rounded-full bg-muted/40 flex items-center justify-center">
                                        <User className="h-2.5 w-2.5 text-muted-foreground/60" />
                                      </div>
                                    )}

                                    {task.due_date && (
                                      <div className={cn(
                                        "flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded",
                                        isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date))
                                          ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                          : isToday(new Date(task.due_date))
                                          ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                          : 'bg-muted/50 text-muted-foreground'
                                      )}>
                                        <Clock className="h-2.5 w-2.5" />
                                        <span>{format(new Date(task.due_date), 'MMM d')}</span>
                                      </div>
                                    )}
                                  </div>

                                  {task.completion_percentage && task.completion_percentage > 0 && (
                                    <div className="flex items-center gap-1.5 pt-0.5">
                                      <Progress value={task.completion_percentage} className="h-1 flex-1" />
                                      <span className="text-[10px] font-medium">{task.completion_percentage}%</span>
                                    </div>
                                  )}
                                </div>
                              </Card>
                            </DraggableTaskCard>
                          ))}
                        </div>
                      </div>
                    </DroppableColumn>
                  );
                })}
              </div>
            ) : viewMode === 'list' ? (
              listDensity === 'comfortable' ? (
                // Comfortable List View
                <div className="rounded-lg border border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border/60 hover:bg-transparent">
                        <TableHead className="w-[40px]"></TableHead>
                        <TableHead className="w-[40px]"></TableHead>
                        <TableHead className="font-semibold">Task</TableHead>
                        <TableHead className="font-semibold w-[120px]">Type</TableHead>
                        <TableHead className="font-semibold w-[140px]">Assigned</TableHead>
                        <TableHead className="font-semibold w-[120px]">Due Date</TableHead>
                        <TableHead className="font-semibold w-[140px]">Progress</TableHead>
                        <TableHead className="font-semibold w-[120px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTasks.map((task) => (
                        <TableRow
                          key={task.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/40 last:border-0"
                          onClick={() => handleTaskClick(task)}
                        >
                          <TableCell className="py-3">
                            <Checkbox
                              checked={task.status === 'done'}
                              onClick={(e) => e.stopPropagation()}
                              className="h-4 w-4"
                            />
                          </TableCell>
                          <TableCell className="py-3">
                            <div className={cn(
                              "w-1 h-8 rounded-full",
                              task.priority === 4 ? 'bg-red-500' :
                              task.priority === 3 ? 'bg-orange-500' :
                              task.priority === 2 ? 'bg-blue-500' :
                              'bg-gray-400'
                            )} />
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold text-sm">{task.title}</span>
                              {task.description && (
                                <span className="text-xs text-muted-foreground/80 line-clamp-1">
                                  {task.description}
                                </span>
                              )}
                              <RelatedEntity task={task} onClick={handleRelatedEntityClick} />
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge variant="outline" className="text-xs font-normal border-border/60 bg-background/50">
                              {TASK_TYPE_LABELS[task.task_type]}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3">
                            {task.assigned_to_users_detail && task.assigned_to_users_detail.length > 0 ? (
                              <div className="flex items-center gap-1.5">
                                <div className="flex -space-x-2">
                                  {task.assigned_to_users_detail.slice(0, 3).map((user) => (
                                    <Avatar key={user.id} className="h-6 w-6 border-2 border-background ring-1 ring-border/20">
                                      <AvatarFallback className="text-xs font-medium">
                                        {getInitials(user.full_name)}
                                      </AvatarFallback>
                                    </Avatar>
                                  ))}
                                </div>
                                {task.assigned_to_users_detail.length > 3 && (
                                  <span className="text-xs text-muted-foreground font-medium">
                                    +{task.assigned_to_users_detail.length - 3}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center">
                                <User className="h-3 w-3 text-muted-foreground/60" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-3">
                            {task.due_date && (
                              <div className={cn(
                                "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md",
                                isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date))
                                  ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                  : isToday(new Date(task.due_date))
                                  ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                  : 'bg-muted/50 text-muted-foreground'
                              )}>
                                <Clock className="h-3 w-3" />
                                <span>{format(new Date(task.due_date), 'MMM d')}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-3">
                            {task.completion_percentage && task.completion_percentage > 0 && (
                              <div className="flex items-center gap-2">
                                <Progress value={task.completion_percentage} className="h-1.5 w-20" />
                                <span className="text-xs font-medium w-8">{task.completion_percentage}%</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge
                              className={cn(
                                "font-medium",
                                task.status === 'done' ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 hover:bg-green-500/20' :
                                task.status === 'in_progress' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20' :
                                task.status === 'blocked' ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 hover:bg-red-500/20' :
                                task.status === 'review' ? 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/20' :
                                'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20 hover:bg-gray-500/20'
                              )}
                              variant="outline"
                            >
                              {TASK_STATUS_LABELS[task.status]}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                // Compact List View
                <StatusGroupedCompactTable
                  tasks={filteredTasks}
                  projectId={project.id}
                  onTaskClick={handleTaskClick}
                  onStatusUpdate={handleStatusUpdate}
                  onPriorityUpdate={handlePriorityUpdate}
                  onAssigneeUpdate={handleAssigneeUpdate}
                  onDateUpdate={handleDateUpdate}
                  onCustomFieldUpdate={handleCustomFieldUpdate}
                />
              )
            ) : (
              // Calendar View
              <TaskCalendar
                tasks={filteredTasks}
                onTaskClick={(task) => {
                  setViewTask(task);
                  setTaskViewOpen(true);
                }}
                onDateClick={() => {
                  setTaskCreateOpen(true);
                }}
              />
            )}

            {/* Drag Overlay */}
            <DragOverlay modifiers={[snapCenterToCursor]}>
              {activeTask ? (
                <Card className="p-2.5 cursor-grabbing shadow-2xl ring-2 ring-primary/50 rotate-2 w-[280px] bg-card border-primary/40">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-1.5">
                      <h4 className="text-xs font-semibold line-clamp-2 flex-1 leading-tight">{activeTask.title}</h4>
                      <div className={cn(
                        "flex-shrink-0 w-4 h-4 rounded flex items-center justify-center",
                        activeTask.priority === 4 ? 'bg-red-500/15' :
                        activeTask.priority === 3 ? 'bg-orange-500/15' :
                        activeTask.priority === 2 ? 'bg-blue-500/15' :
                        'bg-gray-500/15'
                      )}>
                        <Flag className={cn("h-2.5 w-2.5", getPriorityColor(activeTask.priority))} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-[10px] font-normal border-border/60 bg-background/50 h-4 px-1.5">
                        {TASK_TYPE_LABELS[activeTask.task_type]}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ) : null}
            </DragOverlay>
          </div>
        </DndContext>
      </div>

      {/* Task Detail Panel - View/Edit existing tasks */}
      <TaskDetailPanel
        task={viewTask}
        open={taskViewOpen}
        onOpenChange={setTaskViewOpen}
        projectId={project.id}
      />

      {/* Task Create Panel */}
      <TaskDetailPanel
        task={null}
        open={taskCreateOpen}
        onOpenChange={setTaskCreateOpen}
        createMode={true}
        projectId={project.id}
      />

      {/* Recurring Task Panel */}
      {project.is_recurring_project && (
        <RecurringTaskPanel
          isOpen={recurringDialogOpen}
          onClose={() => {
            setRecurringDialogOpen(false);
            setSelectedRecurringTemplate(undefined);
          }}
          projectId={project.id}
          template={selectedRecurringTemplate}
        />
      )}

      {/* Recurring Tasks Management Dialog */}
      {project.is_recurring_project && recurringTemplates && (
        <Dialog open={recurringManageOpen} onOpenChange={setRecurringManageOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Repeat className="h-5 w-5 text-indigo-500" />
                Manage Recurring Tasks
              </DialogTitle>
            </DialogHeader>

            <div className="flex items-center gap-3 mt-2">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search recurring tasks..."
                  value={recurringSearchQuery}
                  onChange={(e) => setRecurringSearchQuery(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>

              {/* Filter Tabs */}
              <Tabs value={recurringFilterStatus} onValueChange={(v) => setRecurringFilterStatus(v as 'all' | 'active' | 'paused')}>
                <TabsList className="h-9">
                  <TabsTrigger value="all" className="text-xs">
                    All ({recurringTemplates.length})
                  </TabsTrigger>
                  <TabsTrigger value="active" className="text-xs">
                    Active ({recurringTemplates.filter(t => t.is_active).length})
                  </TabsTrigger>
                  <TabsTrigger value="paused" className="text-xs">
                    Paused ({recurringTemplates.filter(t => !t.is_active).length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* New Button */}
              <Button
                size="sm"
                onClick={() => {
                  setRecurringManageOpen(false);
                  handleNewRecurringTask();
                }}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>

            {/* Recurring Tasks List */}
            <div className="flex-1 overflow-y-auto mt-4 space-y-2 min-h-0">
              {recurringTemplates
                .filter(template => {
                  // Filter by status
                  if (recurringFilterStatus === 'active' && !template.is_active) return false;
                  if (recurringFilterStatus === 'paused' && template.is_active) return false;
                  // Filter by search
                  if (recurringSearchQuery && !template.title.toLowerCase().includes(recurringSearchQuery.toLowerCase())) return false;
                  return true;
                })
                .map((template) => (
                  <div
                    key={template.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                      "hover:bg-muted/50 hover:border-indigo-500/30",
                      !template.is_active && "opacity-60"
                    )}
                  >
                    {/* Priority indicator */}
                    <div className={cn(
                      "w-1 h-12 rounded-full flex-shrink-0",
                      template.default_priority === 4 ? 'bg-red-500' :
                      template.default_priority === 3 ? 'bg-orange-500' :
                      template.default_priority === 2 ? 'bg-blue-500' :
                      'bg-gray-400'
                    )} />

                    {/* Content */}
                    <div
                      className="flex-1 min-w-0"
                      onClick={() => {
                        setRecurringManageOpen(false);
                        handleEditRecurringTemplate(template);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{template.title}</span>
                        <Badge
                          variant={template.is_active ? "default" : "secondary"}
                          className={cn(
                            "text-[10px] px-1.5 py-0",
                            template.is_active ? "bg-green-500/10 text-green-600 border-green-500/20" : ""
                          )}
                        >
                          {template.is_active ? 'Active' : 'Paused'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {parseRRuleToText(template.recurrence_rule)}
                        </span>
                        {template.next_generation_at && template.is_active && (
                          <span className="text-xs text-muted-foreground">
                            Next: {format(new Date(template.next_generation_at), 'MMM d, yyyy')}
                          </span>
                        )}
                        {template.default_assignees_detail && template.default_assignees_detail.length > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {template.default_assignees_detail.length}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTemplateActive(template);
                        }}
                        className="h-8 w-8 p-0"
                        title={template.is_active ? 'Pause' : 'Activate'}
                      >
                        {template.is_active ? (
                          <Pause className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Play className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecurringManageOpen(false);
                          handleEditRecurringTemplate(template);
                        }}
                        className="h-8 w-8 p-0"
                        title="Edit"
                      >
                        <Settings2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}

              {/* Empty state */}
              {recurringTemplates.filter(template => {
                if (recurringFilterStatus === 'active' && !template.is_active) return false;
                if (recurringFilterStatus === 'paused' && template.is_active) return false;
                if (recurringSearchQuery && !template.title.toLowerCase().includes(recurringSearchQuery.toLowerCase())) return false;
                return true;
              }).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Repeat className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {recurringSearchQuery
                      ? 'No recurring tasks match your search'
                      : recurringFilterStatus === 'active'
                      ? 'No active recurring tasks'
                      : recurringFilterStatus === 'paused'
                      ? 'No paused recurring tasks'
                      : 'No recurring tasks yet'}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default ProjectTasksView;
