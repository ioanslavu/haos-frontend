import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Filter,
  Plus,
  User,
  AlertTriangle,
  ChevronRight,
  Flag,
  Tag as TagIcon,
} from 'lucide-react';
import { useTasks, useTaskStats, useMyTasks, useOverdueTasks, useUpdateTaskStatus } from '@/api/hooks/useTasks';
import {
  Task,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_TYPE_LABELS,
  TASK_TAG_LABELS,
  TASK_TAG_COLORS,
  TaskStatus,
} from '@/api/types/tasks';
import { formatDistanceToNow, format, isToday, isTomorrow } from 'date-fns';
import { cn } from '@/lib/utils';
import { TaskFormDialog } from '@/pages/digital/components/TaskFormDialog';
import { TaskDetailPanel } from '@/components/tasks/TaskDetailPanel';
import { EmployeeTaskFilter } from '@/pages/digital/components/EmployeeTaskFilter';
import { useAuthStore } from '@/stores/authStore';
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
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';

// Droppable Column Component
function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'transition-colors',
        isOver && 'bg-primary/5 ring-2 ring-primary/50 rounded-lg'
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
        // Only trigger onClick if not dragging
        if (!isDragging) {
          onClick();
        }
      }}
    >
      {children}
    </div>
  );
}

interface TasksTabProps {
  searchQuery: string;
  filterStatus: string;
  filterPriority?: string;  
  startDate?: Date;  
  endDate?: Date;  
  onNewTask?: () => void;
}

export function TasksTab({ searchQuery, filterStatus, filterPriority, startDate, endDate, onNewTask }: TasksTabProps) {
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'all' | 'my' | 'overdue'>('all');
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [taskViewOpen, setTaskViewOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const currentUser = useAuthStore((state) => state.user);
  const updateTaskStatus = useUpdateTaskStatus();

  // Setup drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start dragging
      },
    })
  );

  // Build filter params
  const filterParams: any = {
    status: filterStatus !== 'all' ? filterStatus : undefined,
    priority: selectedPriority !== 'all' ? parseInt(selectedPriority) : undefined,
  };

  // Add employee filter for managers
  if (selectedEmployees.length > 0) {
    filterParams.assigned_to__in = selectedEmployees.join(',');
  }

  const { data: allTasks } = useTasks(filterParams);
  const { data: myTasks } = useMyTasks();
  const { data: overdueTasks } = useOverdueTasks();
  const { data: taskStats } = useTaskStats();

  // Extract results from paginated responses
  const allTasksList = (allTasks as any)?.results || [];
  const myTasksList = (myTasks as any)?.results || [];
  const overdueTasksList = (overdueTasks as any)?.results || [];

  const tasks = viewMode === 'my' ? myTasksList :
                viewMode === 'overdue' ? overdueTasksList :
                allTasksList;

  // Filter tasks based on search
  const filteredTasks = tasks?.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group tasks by status for kanban view
  const tasksByStatus = {
    todo: filteredTasks?.filter(t => t.status === 'todo') || [],
    in_progress: filteredTasks?.filter(t => t.status === 'in_progress') || [],
    blocked: filteredTasks?.filter(t => t.status === 'blocked') || [],
    review: filteredTasks?.filter(t => t.status === 'review') || [],
    done: filteredTasks?.filter(t => t.status === 'done') || [],
  };

  const statusColumns = [
    { id: 'todo', label: 'To Do', color: 'bg-gray-500', icon: Clock },
    { id: 'in_progress', label: 'In Progress', color: 'bg-blue-500', icon: AlertCircle },
    { id: 'blocked', label: 'Blocked', color: 'bg-red-500', icon: AlertTriangle },
    { id: 'review', label: 'In Review', color: 'bg-orange-500', icon: Calendar },
    { id: 'done', label: 'Done', color: 'bg-green-500', icon: CheckCircle },
  ];

  const getPriorityColor = (priority: number) => {
    const colors = {
      1: 'text-gray-500',
      2: 'text-blue-500',
      3: 'text-orange-500',
      4: 'text-red-500',
    };
    return colors[priority as keyof typeof colors] || 'text-gray-500';
  };

  const getDeadlineText = (dueDate: string) => {
    const date = new Date(dueDate);
    if (isToday(date)) return 'Due today';
    if (isTomorrow(date)) return 'Due tomorrow';
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskViewOpen(true);
  };

  const handleEditTask = () => {
    setEditingTask(selectedTask);
    setTaskViewOpen(false);
    setTaskFormOpen(true);
  };

  const handleNewTask = () => {
    if (onNewTask) {
      onNewTask();
    }
  };

  const assignedUsers = (task: Task) => task.assigned_to_users_detail || [];

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as number;
    const task = filteredTasks?.find((t) => t.id === taskId);
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

    // Find the task
    const task = filteredTasks?.find((t) => t.id === taskId);

    if (task && task.status !== newStatus) {
      // Update task status
      try {
        await updateTaskStatus.mutateAsync({ id: taskId, status: newStatus });
      } catch (error) {
        console.error('Failed to update task status:', error);
      }
    }

    setActiveTask(null);
  };

  const handleDragCancel = () => {
    setActiveTask(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
    <div className="space-y-6">
      {/* Task Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Active tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{taskStats?.overdue || 0}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{taskStats?.due_today || 0}</div>
            <p className="text-xs text-muted-foreground">Complete today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats?.due_this_week || 0}</div>
            <p className="text-xs text-muted-foreground">Due this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{taskStats?.by_status?.done || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={viewMode === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('all')}
          >
            All Tasks
          </Button>
          <Button
            variant={viewMode === 'my' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('my')}
          >
            My Tasks
          </Button>
          <Button
            variant={viewMode === 'overdue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('overdue')}
          >
            Overdue
          </Button>

          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-[150px]">
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

          {/* Employee filter for managers */}
          <EmployeeTaskFilter
            selectedEmployees={selectedEmployees}
            onSelectionChange={setSelectedEmployees}
          />
        </div>

        {/* <Button onClick={handleNewTask}>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button> */}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-5 gap-4">
        {statusColumns.map((column) => {
          const Icon = column.icon;
          return (
            <DroppableColumn key={column.id} id={column.id}>
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm">{column.label}</CardTitle>
                    </div>
                    <Badge variant="secondary">
                      {tasksByStatus[column.id as keyof typeof tasksByStatus].length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                  <div className="space-y-2">
                    {tasksByStatus[column.id as keyof typeof tasksByStatus].map((task) => (
                      <DraggableTaskCard key={task.id} task={task} onClick={() => handleTaskClick(task)}>
                        <Card className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium line-clamp-2 flex-1">{task.title}</h4>
                          <Flag className={cn("h-3 w-3 flex-shrink-0", getPriorityColor(task.priority))} />
                        </div>

                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {TASK_TYPE_LABELS[task.task_type]}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {TASK_PRIORITY_LABELS[task.priority]}
                          </Badge>
                          {task.tag && (
                            <Badge variant={TASK_TAG_COLORS[task.tag] as any} className="text-xs">
                              <TagIcon className="mr-1 h-2 w-2" />
                              {TASK_TAG_LABELS[task.tag]}
                            </Badge>
                          )}
                        </div>

                        {task.campaign_detail && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Campaign:</span> {task.campaign_detail.name}
                          </div>
                        )}

                        {task.entity_detail && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Client:</span> {task.entity_detail.display_name}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t">
                          {assignedUsers(task).length > 0 ? (
                            <div className="flex items-center gap-1">
                              <div className="flex -space-x-2">
                                {assignedUsers(task).slice(0, 3).map((user) => (
                                  <Avatar key={user.id} className="h-5 w-5 border-2 border-background">
                                    <AvatarFallback className="text-xs">
                                      {user.full_name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                              </div>
                              {assignedUsers(task).length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{assignedUsers(task).length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>Unassigned</span>
                            </div>
                          )}

                          {task.due_date && (
                            <div className={cn(
                              "flex items-center gap-1 text-xs",
                              task.is_overdue ? "text-red-600" : "text-muted-foreground"
                            )}>
                              <Clock className="h-3 w-3" />
                              <span>{getDeadlineText(task.due_date)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                        </Card>
                      </DraggableTaskCard>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </DroppableColumn>
          );
        })}
      </div>

      {/* Drag Overlay - shows the task being dragged */}
      <DragOverlay modifiers={[snapCenterToCursor]}>
        {activeTask ? (
          <Card className="p-3 cursor-grabbing shadow-2xl rotate-2 w-[280px]">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-medium line-clamp-2 flex-1">{activeTask.title}</h4>
                <Flag className={cn("h-3 w-3 flex-shrink-0", getPriorityColor(activeTask.priority))} />
              </div>
              {activeTask.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {activeTask.description}
                </p>
              )}
              <div className="flex items-center gap-1 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {TASK_TYPE_LABELS[activeTask.task_type]}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {TASK_PRIORITY_LABELS[activeTask.priority]}
                </Badge>
                {activeTask.tag && (
                  <Badge variant={TASK_TAG_COLORS[activeTask.tag] as any} className="text-xs">
                    <TagIcon className="mr-1 h-2 w-2" />
                    {TASK_TAG_LABELS[activeTask.tag]}
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        ) : null}
      </DragOverlay>

      {/* Follow-up Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Follow-ups</CardTitle>
          <CardDescription>Tasks requiring follow-up actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px]"></TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Associated With</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Priority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks?.filter(t => t.task_type === 'follow_up').slice(0, 5).map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {TASK_TYPE_LABELS[task.task_type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {task.campaign_detail && (
                      <span className="text-sm">{task.campaign_detail.name}</span>
                    )}
                    {task.entity_detail && (
                      <span className="text-sm">{task.entity_detail.display_name}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.assigned_to_detail ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {task.assigned_to_detail.full_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{task.assigned_to_detail.full_name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.due_date && (
                      <span className={cn(
                        "text-sm",
                        task.is_overdue && "text-red-600"
                      )}>
                        {format(new Date(task.due_date), 'MMM d, yyyy')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      task.priority === 4 ? 'destructive' :
                      task.priority === 3 ? 'default' :
                      task.priority === 2 ? 'secondary' :
                      'outline'
                    }>
                      {TASK_PRIORITY_LABELS[task.priority]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Task Edit Dialog (for editing only) */}
      <TaskFormDialog
        open={taskFormOpen}
        onOpenChange={(open) => {
          setTaskFormOpen(open);
          if (!open) setEditingTask(null);
        }}
        task={editingTask}
      />

      {/* Task Detail Panel */}
      <TaskDetailPanel
        task={selectedTask}
        open={taskViewOpen}
        onOpenChange={setTaskViewOpen}
      />
    </div>
    </DndContext>
  );
}