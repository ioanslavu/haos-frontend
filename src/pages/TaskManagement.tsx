import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TaskFormDialog } from '@/components/tasks/TaskFormDialog'
import { useTasks, useTaskStats, useMyTasks, useOverdueTasks, useDeleteTask, useUpdateTask } from '@/api/hooks/useTasks'
import { useAuthStore } from '@/stores/authStore'
import {
  Task,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_TYPE_LABELS,
  TASK_STATUS_COLORS,
  TASK_PRIORITY_COLORS,
} from '@/api/types/tasks'
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Flag,
  User,
  MoreHorizontal,
  ChevronRight,
  LayoutGrid,
  List,
  Target,
  TrendingUp,
  Activity,
} from 'lucide-react'
import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function TaskManagement() {
  const currentUser = useAuthStore((state) => state.user)
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'calendar'>('kanban')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterAssignee, setFilterAssignee] = useState<string>('all')
  const [showCompleted, setShowCompleted] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)

  // Fetch tasks data
  const { data: allTasks, isLoading: tasksLoading } = useTasks({
    priority: filterPriority !== 'all' ? parseInt(filterPriority) : undefined,
    task_type: filterType !== 'all' ? filterType : undefined,
    assigned_to: filterAssignee !== 'all' ? parseInt(filterAssignee) : undefined,
  })
  const { data: myTasks } = useMyTasks()
  const { data: overdueTasks } = useOverdueTasks()
  const { data: taskStats } = useTaskStats()

  const deleteTask = useDeleteTask()
  const updateTask = useUpdateTask()

  // Filter tasks
  const filteredTasks = allTasks?.filter(task => {
    if (!showCompleted && task.status === 'done') return false
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  }) || []

  // Group tasks by status for kanban view
  const tasksByStatus = {
    todo: filteredTasks.filter(t => t.status === 'todo'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    blocked: filteredTasks.filter(t => t.status === 'blocked'),
    review: filteredTasks.filter(t => t.status === 'review'),
    done: filteredTasks.filter(t => t.status === 'done'),
  }

  const statusColumns = [
    { id: 'todo', label: 'To Do', icon: Clock, color: 'bg-gray-500' },
    { id: 'in_progress', label: 'In Progress', icon: Activity, color: 'bg-blue-500' },
    { id: 'blocked', label: 'Blocked', icon: AlertTriangle, color: 'bg-red-500' },
    { id: 'review', label: 'In Review', icon: AlertCircle, color: 'bg-orange-500' },
    { id: 'done', label: 'Done', icon: CheckCircle, color: 'bg-green-500' },
  ]

  const handleTaskEdit = (task: Task) => {
    setSelectedTask(task)
    setTaskDialogOpen(true)
  }

  const handleTaskDelete = async (task: Task) => {
    if (confirm(`Delete task "${task.title}"?`)) {
      try {
        await deleteTask.mutateAsync(task.id)
        toast.success('Task deleted successfully')
      } catch {
        toast.error('Failed to delete task')
      }
    }
  }

  const handleStatusChange = async (task: Task, newStatus: string) => {
    try {
      await updateTask.mutateAsync({
        id: task.id,
        data: { status: newStatus },
      })
      toast.success('Task status updated')
    } catch {
      toast.error('Failed to update task status')
    }
  }

  const getPriorityColor = (priority: number) => {
    const colors = {
      1: 'text-gray-500',
      2: 'text-blue-500',
      3: 'text-orange-500',
      4: 'text-red-500',
    }
    return colors[priority as keyof typeof colors] || 'text-gray-500'
  }

  const getDeadlineText = (dueDate: string) => {
    const date = new Date(dueDate)
    if (isPast(date) && !isToday(date)) return { text: 'Overdue', className: 'text-red-600' }
    if (isToday(date)) return { text: 'Due today', className: 'text-orange-600' }
    if (isTomorrow(date)) return { text: 'Due tomorrow', className: 'text-blue-600' }
    return { text: formatDistanceToNow(date, { addSuffix: true }), className: 'text-muted-foreground' }
  }

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b p-4 bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Task Management</h1>
              <p className="text-muted-foreground mt-1">
                Organize, track, and complete tasks efficiently
              </p>
            </div>
            <Button onClick={() => { setSelectedTask(null); setTaskDialogOpen(true) }}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{taskStats?.total || 0}</div>
                <p className="text-xs text-muted-foreground">Active tasks</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{myTasks?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Assigned to you</p>
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
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {taskStats?.by_status?.done || 0}
                </div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
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

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Checkbox
                id="show-completed"
                checked={showCompleted}
                onCheckedChange={(checked) => setShowCompleted(checked as boolean)}
              />
              <label htmlFor="show-completed" className="text-sm">
                Show completed
              </label>
            </div>

            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-4">
          {viewMode === 'kanban' ? (
            // Kanban View
            <div className="flex gap-4 h-full">
              {statusColumns.map((column) => {
                const Icon = column.icon
                const tasks = tasksByStatus[column.id as keyof typeof tasksByStatus]

                return (
                  <div key={column.id} className="flex-1 min-w-[300px]">
                    <Card className="h-full flex flex-col">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <CardTitle className="text-sm">{column.label}</CardTitle>
                          </div>
                          <Badge variant="secondary">{tasks.length}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 overflow-auto">
                        <div className="space-y-2">
                          {tasks.map((task) => (
                            <Card
                              key={task.id}
                              className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => handleTaskEdit(task)}
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                  <h4 className="text-sm font-medium line-clamp-2">{task.title}</h4>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                      <Button variant="ghost" size="icon" className="h-6 w-6">
                                        <MoreHorizontal className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation()
                                        handleTaskEdit(task)
                                      }}>
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleTaskDelete(task)
                                        }}
                                        className="text-red-600"
                                      >
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
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
                                    <Flag className={cn("h-3 w-3 mr-1", getPriorityColor(task.priority))} />
                                    {TASK_PRIORITY_LABELS[task.priority]}
                                  </Badge>
                                </div>

                                {task.labels && task.labels.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {task.labels.map((label) => (
                                      <Badge key={label} variant="outline" className="text-xs">
                                        {label}
                                      </Badge>
                                    ))}
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
                                      getDeadlineText(task.due_date).className
                                    )}>
                                      <Clock className="h-3 w-3" />
                                      <span>{getDeadlineText(task.due_date).text}</span>
                                    </div>
                                  )}
                                </div>

                                {task.completion_percentage > 0 && (
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-muted-foreground">Progress</span>
                                      <span>{task.completion_percentage}%</span>
                                    </div>
                                    <Progress value={task.completion_percentage} className="h-1" />
                                  </div>
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          ) : viewMode === 'list' ? (
            // List View
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30px]"></TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => (
                      <TableRow key={task.id} className="cursor-pointer" onClick={() => handleTaskEdit(task)}>
                        <TableCell>
                          <Checkbox onClick={(e) => e.stopPropagation()} />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{task.title}</p>
                            {task.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {TASK_TYPE_LABELS[task.task_type]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            <Flag className={cn("h-3 w-3 mr-1", getPriorityColor(task.priority))} />
                            {TASK_PRIORITY_LABELS[task.priority]}
                          </Badge>
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
                            <span className={cn("text-sm", getDeadlineText(task.due_date).className)}>
                              {format(new Date(task.due_date), 'MMM d, yyyy')}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {task.completion_percentage > 0 && (
                            <div className="flex items-center gap-2">
                              <Progress value={task.completion_percentage} className="w-16 h-1" />
                              <span className="text-xs">{task.completion_percentage}%</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            task.status === 'done' ? 'default' :
                            task.status === 'in_progress' ? 'secondary' :
                            task.status === 'blocked' ? 'destructive' :
                            'outline'
                          }>
                            {TASK_STATUS_LABELS[task.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation()
                                handleTaskEdit(task)
                              }}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleTaskDelete(task)
                                }}
                                className="text-red-600"
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            // Calendar View
            <Card>
              <CardContent className="p-8">
                <p className="text-center text-muted-foreground">Calendar view coming soon...</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Task Form Dialog */}
      <TaskFormDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={selectedTask}
      />
    </AppLayout>
  )
}