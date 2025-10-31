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
  AlertTriangle,
} from 'lucide-react';
import { useTasks, useTaskStats, useMyTasks, useOverdueTasks, useUpdateTaskStatus } from '@/api/hooks/useTasks';
import {
  Task,
  TASK_PRIORITY_LABELS,
  TASK_TYPE_LABELS,
  TaskStatus,
} from '@/api/types/tasks';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TaskFormDialog } from '@/pages/digital/components/TaskFormDialog';
import { TaskViewSheet } from '@/pages/digital/components/TaskViewSheet';
import { EmployeeTaskFilter } from '@/pages/digital/components/EmployeeTaskFilter';
import { TaskKanbanView } from '@/pages/digital/components/TaskKanbanView';

interface TasksTabProps {
  searchQuery: string;
  filterStatus: string;
  filterPriority?: string; // eslint-disable-line @typescript-eslint/no-unused-vars
  startDate?: Date; // eslint-disable-line @typescript-eslint/no-unused-vars
  endDate?: Date; // eslint-disable-line @typescript-eslint/no-unused-vars
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

  const updateTaskStatus = useUpdateTaskStatus();

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

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskViewOpen(true);
  };

  const handleEditTask = () => {
    setEditingTask(selectedTask);
    setTaskViewOpen(false);
    setTaskFormOpen(true);
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    try {
      await updateTaskStatus.mutateAsync({ id: task.id, status: newStatus });
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  return (
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
      <TaskKanbanView
        tasks={filteredTasks || []}
        onEdit={setEditingTask}
        onStatusChange={handleStatusChange}
        onClick={handleTaskClick}
      />

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

      {/* Task View Sheet */}
      <TaskViewSheet
        task={selectedTask}
        open={taskViewOpen}
        onOpenChange={setTaskViewOpen}
        onEdit={handleEditTask}
      />
    </div>
  );
}