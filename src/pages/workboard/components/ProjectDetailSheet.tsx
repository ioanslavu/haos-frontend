import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Users,
  LayoutGrid,
  CalendarDays,
  Table as TableIcon,
  Plus,
  Edit,
  Archive,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useProject,
  useProjectTasks,
  useArchiveProject,
  useActivateProject,
  useUpdateProjectTask,
  useCreateProjectTask,
} from '@/api/hooks/useProjects';
import {
  PROJECT_TYPE_CONFIG,
  PROJECT_STATUS_CONFIG,
  type Project,
  type ProjectTask,
  type ProjectTaskCreatePayload,
} from '@/types/projects';
import { format } from 'date-fns';
import { Task, TaskStatus, TaskType } from '@/api/types/tasks';
import { TaskCalendar } from '@/components/tasks/TaskCalendar';
import { StatusGroupedCompactTable } from '@/components/tasks/StatusGroupedCompactTable';
import { TaskFormDialog } from '@/components/tasks/TaskFormDialog';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { toast } from 'sonner';

interface ProjectDetailSheetProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = 'kanban' | 'calendar' | 'table';

// Convert ProjectTask to Task format for compatibility with existing components
function convertProjectTaskToTask(projectTask: ProjectTask): Task {
  return {
    id: projectTask.id,
    title: projectTask.title,
    description: projectTask.description || '',
    task_type: 'general' as TaskType,
    status: projectTask.status as TaskStatus,
    priority: projectTask.priority,
    due_date: projectTask.due_date || undefined,
    is_overdue: projectTask.is_overdue,
    is_blocked: projectTask.status === 'blocked',
    department: projectTask.department,
    created_at: projectTask.created_at,
    updated_at: projectTask.updated_at,
    assigned_to_users: projectTask.assigned_to ? [projectTask.assigned_to.id] : [],
    assigned_to_users_detail: projectTask.assigned_to ? [{
      id: projectTask.assigned_to.id,
      email: projectTask.assigned_to.email,
      full_name: projectTask.assigned_to.full_name,
    }] : [],
    created_by: projectTask.created_by?.id,
    created_by_detail: projectTask.created_by ? {
      id: projectTask.created_by.id,
      email: projectTask.created_by.email,
      full_name: projectTask.created_by.full_name,
    } : undefined,
  };
}

export function ProjectDetailSheet({ project, isOpen, onClose }: ProjectDetailSheetProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);

  // Fetch full project details
  const { data: projectDetail, isLoading: isLoadingProject } = useProject(project?.id || 0);

  // Fetch tasks for this project
  const { data: tasks, isLoading: isLoadingTasks } = useProjectTasks(
    project ? { project: project.id } : undefined
  );

  const archiveProject = useArchiveProject();
  const activateProject = useActivateProject();
  const updateProjectTask = useUpdateProjectTask();
  const createProjectTask = useCreateProjectTask();

  if (!project) return null;

  const typeConfig = PROJECT_TYPE_CONFIG[project.project_type];
  const statusConfig = PROJECT_STATUS_CONFIG[project.status];
  const isArchived = project.status === 'archived';

  // Convert ProjectTasks to Tasks for compatibility
  const convertedTasks: Task[] = tasks?.map(convertProjectTaskToTask) || [];

  const handleArchiveToggle = () => {
    if (isArchived) {
      activateProject.mutate(project.id);
    } else {
      archiveProject.mutate(project.id);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskFormOpen(true);
  };

  const handleStatusUpdate = async (taskId: number, status: string) => {
    try {
      await updateProjectTask.mutateAsync({
        id: taskId,
        data: { status: status as ProjectTask['status'] },
      });
    } catch (error) {
      toast.error('Failed to update task status');
    }
  };

  const handlePriorityUpdate = async (taskId: number, priority: number) => {
    try {
      await updateProjectTask.mutateAsync({
        id: taskId,
        data: { priority: priority as ProjectTask['priority'] },
      });
    } catch (error) {
      toast.error('Failed to update task priority');
    }
  };

  const handleAssigneeUpdate = async (taskId: number, assignedToUsers: number[]) => {
    try {
      await updateProjectTask.mutateAsync({
        id: taskId,
        data: { assigned_to_id: assignedToUsers[0] || null },
      });
    } catch (error) {
      toast.error('Failed to update task assignee');
    }
  };

  const handleDateUpdate = async (taskId: number, dueDate: string | null) => {
    try {
      await updateProjectTask.mutateAsync({
        id: taskId,
        data: { due_date: dueDate },
      });
    } catch (error) {
      toast.error('Failed to update task due date');
    }
  };

  const handleAddTask = () => {
    setSelectedTask(null);
    setIsTaskFormOpen(true);
  };

  const handleTaskFormSuccess = async (task: Task) => {
    // If creating a new task, create it as a project task
    if (!selectedTask) {
      try {
        const payload: ProjectTaskCreatePayload = {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          project: project.id,
          department: projectDetail?.metadata?.department as number || project.department,
          due_date: task.due_date || null,
          assigned_to_id: task.assigned_to_users?.[0] || null,
        };
        await createProjectTask.mutateAsync(payload);
        toast.success('Task created successfully');
      } catch (error) {
        toast.error('Failed to create task');
      }
    }
    setIsTaskFormOpen(false);
  };

  // Kanban drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as number;
    const newStatus = over.id as string;

    // Find the task and check if status changed
    const task = tasks?.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      await handleStatusUpdate(taskId, newStatus);
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl p-0 overflow-hidden"
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <SheetHeader className="p-6 pb-4 border-b border-white/10 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-xl text-xl",
                    "bg-gradient-to-br",
                    typeConfig.color.replace('bg-', 'from-') + '/20',
                    typeConfig.color.replace('bg-', 'to-') + '/10'
                  )}>
                    {typeConfig.icon}
                  </div>
                  <div>
                    <SheetTitle className="text-xl font-bold">
                      {project.name}
                    </SheetTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">
                        {typeConfig.label}
                      </span>
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
                </div>

                <div className="flex items-center gap-2">
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
                  <Button variant="outline" size="sm" className="rounded-lg">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    {project.completed_task_count} of {project.task_count} tasks completed
                  </span>
                  <span className="text-sm font-medium">
                    {project.completion_percentage}%
                  </span>
                </div>
                <Progress
                  value={project.completion_percentage}
                  className="h-2 bg-black/5 dark:bg-white/10"
                />
              </div>

              {/* Meta Info */}
              <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                {project.start_date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>Started {format(new Date(project.start_date), 'MMM d, yyyy')}</span>
                  </div>
                )}
                {project.end_date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>Due {format(new Date(project.end_date), 'MMM d, yyyy')}</span>
                  </div>
                )}
                {projectDetail?.members && (
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span>{projectDetail.members.length} members</span>
                  </div>
                )}
              </div>
            </SheetHeader>

            {/* View Toggle and Add Task */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-background/50">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                <TabsList className="h-9 rounded-lg bg-background/50 border border-white/10">
                  <TabsTrigger value="kanban" className="rounded-md text-xs data-[state=active]:bg-white/20">
                    <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
                    Kanban
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="rounded-md text-xs data-[state=active]:bg-white/20">
                    <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                    Calendar
                  </TabsTrigger>
                  <TabsTrigger value="table" className="rounded-md text-xs data-[state=active]:bg-white/20">
                    <TableIcon className="h-3.5 w-3.5 mr-1.5" />
                    Table
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button size="sm" className="rounded-lg" onClick={handleAddTask}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-6">
              {isLoadingTasks ? (
                <TasksLoadingSkeleton />
              ) : !tasks || tasks.length === 0 ? (
                <EmptyTasksState onAddTask={handleAddTask} />
              ) : (
                <div className="h-full">
                  {viewMode === 'kanban' && (
                    <ProjectKanbanView
                      tasks={tasks}
                      onTaskClick={(task) => handleTaskClick(convertProjectTaskToTask(task))}
                      onStatusUpdate={handleStatusUpdate}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      activeId={activeId}
                    />
                  )}
                  {viewMode === 'calendar' && (
                    <TaskCalendar
                      tasks={convertedTasks}
                      onTaskClick={handleTaskClick}
                      onDateClick={(date) => {
                        // Open task form with pre-filled date
                        setSelectedTask(null);
                        setIsTaskFormOpen(true);
                      }}
                      className="h-full"
                    />
                  )}
                  {viewMode === 'table' && (
                    <StatusGroupedCompactTable
                      tasks={convertedTasks}
                      onTaskClick={handleTaskClick}
                      onStatusUpdate={handleStatusUpdate}
                      onPriorityUpdate={handlePriorityUpdate}
                      onAssigneeUpdate={handleAssigneeUpdate}
                      onDateUpdate={handleDateUpdate}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Task Form Dialog */}
      <TaskFormDialog
        open={isTaskFormOpen}
        onOpenChange={setIsTaskFormOpen}
        task={selectedTask}
        defaultValues={selectedTask ? undefined : {
          status: 'todo',
          priority: 2,
        }}
        onSuccess={handleTaskFormSuccess}
      />
    </>
  );
}

// Kanban view component with drag and drop
interface ProjectKanbanViewProps {
  tasks: ProjectTask[];
  onTaskClick: (task: ProjectTask) => void;
  onStatusUpdate: (taskId: number, status: string) => void;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  activeId: number | null;
}

function ProjectKanbanView({
  tasks,
  onTaskClick,
  onStatusUpdate,
  onDragStart,
  onDragEnd,
  activeId
}: ProjectKanbanViewProps) {
  const columns = [
    { id: 'todo', label: 'To Do', color: 'bg-gray-500' },
    { id: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
    { id: 'blocked', label: 'Blocked', color: 'bg-red-500' },
    { id: 'review', label: 'In Review', color: 'bg-purple-500' },
    { id: 'done', label: 'Done', color: 'bg-green-500' },
  ];

  const activeTask = tasks.find(t => t.id === activeId);

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnTasks = tasks.filter((t) => t.status === column.id);

          return (
            <div
              key={column.id}
              id={column.id}
              className="flex-shrink-0 w-72 flex flex-col rounded-xl bg-background/50 border border-white/10"
            >
              {/* Column Header */}
              <div className="p-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", column.color)} />
                  <span className="font-medium text-sm">{column.label}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {columnTasks.length}
                  </Badge>
                </div>
              </div>

              {/* Column Content */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[100px]">
                {columnTasks.map((task) => (
                  <KanbanTaskCard
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick(task)}
                    isDragging={task.id === activeId}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <KanbanTaskCard task={activeTask} onClick={() => {}} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

interface KanbanTaskCardProps {
  task: ProjectTask;
  onClick: () => void;
  isDragging?: boolean;
}

function KanbanTaskCard({ task, onClick, isDragging }: KanbanTaskCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg bg-white/50 dark:bg-white/5 border border-white/10 hover:border-indigo-500/30 cursor-pointer transition-colors",
        isDragging && "opacity-50 rotate-2 scale-105 shadow-lg"
      )}
    >
      <h4 className="font-medium text-sm truncate">{task.title}</h4>
      <div className="flex items-center justify-between mt-2">
        {task.due_date && (
          <p className={cn(
            "text-xs",
            task.is_overdue ? "text-red-500" : "text-muted-foreground"
          )}>
            Due {format(new Date(task.due_date), 'MMM d')}
          </p>
        )}
        {task.assigned_to && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span className="truncate max-w-[80px]">{task.assigned_to.full_name.split(' ')[0]}</span>
          </div>
        )}
      </div>
      {task.is_overdue && (
        <Badge variant="destructive" className="mt-2 text-xs">
          Overdue
        </Badge>
      )}
    </div>
  );
}

function TasksLoadingSkeleton() {
  return (
    <div className="flex gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="w-72 space-y-2">
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

interface EmptyTasksStateProps {
  onAddTask: () => void;
}

function EmptyTasksState({ onAddTask }: EmptyTasksStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
      <LayoutGrid className="h-12 w-12 mb-3 opacity-50" />
      <p className="font-medium">No tasks yet</p>
      <p className="text-sm mt-1">Create your first task to get started</p>
      <Button size="sm" className="mt-4 rounded-lg" onClick={onAddTask}>
        <Plus className="h-4 w-4 mr-2" />
        Add Task
      </Button>
    </div>
  );
}

export default ProjectDetailSheet;
