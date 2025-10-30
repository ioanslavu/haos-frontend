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
} from 'lucide-react';
import { useTasks, useTaskStats, useMyTasks, useOverdueTasks } from '@/api/hooks/useTasks';
import {
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_TYPE_LABELS,
} from '@/api/types/tasks';
import { formatDistanceToNow, format, isToday, isTomorrow } from 'date-fns';
import { cn } from '@/lib/utils';

interface TasksTabProps {
  searchQuery: string;
  filterStatus: string;
}

export function TasksTab({ searchQuery, filterStatus }: TasksTabProps) {
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'all' | 'my' | 'overdue'>('all');

  const { data: allTasks } = useTasks({
    status: filterStatus !== 'all' ? filterStatus : undefined,
    priority: selectedPriority !== 'all' ? parseInt(selectedPriority) : undefined,
  });
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
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
        </div>

        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-5 gap-4">
        {statusColumns.map((column) => {
          const Icon = column.icon;
          return (
            <Card key={column.id} className="h-[600px] flex flex-col">
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
                    <Card key={task.id} className="p-3 cursor-pointer hover:shadow-md transition-shadow">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-medium line-clamp-2">{task.title}</h4>
                          <Flag className={cn("h-3 w-3", getPriorityColor(task.priority))} />
                        </div>

                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {TASK_TYPE_LABELS[task.task_type]}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {TASK_PRIORITY_LABELS[task.priority]}
                          </Badge>
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
                          {task.assigned_to_detail ? (
                            <div className="flex items-center gap-1">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-xs">
                                  {task.assigned_to_detail.full_name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">
                                {task.assigned_to_detail.full_name.split(' ')[0]}
                              </span>
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
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
    </div>
  );
}