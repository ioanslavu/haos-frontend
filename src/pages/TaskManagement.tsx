import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { TaskDetailPanel } from '@/components/tasks/TaskDetailPanel'
import { TaskCalendar } from '@/components/tasks/TaskCalendar'
import { EmployeeTaskFilter } from '@/components/tasks/EmployeeTaskFilter'
import { InlineStatusBadge } from '@/components/tasks/InlineStatusBadge'
import { InlineAssigneeSelect } from '@/components/tasks/InlineAssigneeSelect'
import { InlinePrioritySelect } from '@/components/tasks/InlinePrioritySelect'
import { InlineDatePicker } from '@/components/tasks/InlineDatePicker'
import { StatusGroupedCompactTable } from '@/components/tasks/StatusGroupedCompactTable'
import { useInfiniteTasks, useTaskStats, useDeleteTask, useUpdateTask, useUpdateTaskStatus } from '@/api/hooks/useTasks'
import { useAuthStore } from '@/stores/authStore'
import {
  Task,
  TaskStatus,
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
  Link2,
  Briefcase,
  Music,
} from 'lucide-react'
import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns'
import { cn, getInitials } from '@/lib/utils'
import { PLATFORM_ICONS, PLATFORM_TEXT_COLORS } from '@/lib/platform-icons'
import type { Platform } from '@/types/campaign'
import { toast } from 'sonner'
import { handleApiError } from '@/lib/error-handler'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core'
import { useDroppable } from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'

// Droppable Column Component - Modern Minimal Design
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

  if (task.contract && task.contract_detail) {
    return (
      <div
        onClick={(e) => onClick(e, `/contracts/${task.contract}`)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
      >
        <Link2 className="h-2.5 w-2.5 flex-shrink-0" />
        <span className="truncate group-hover:underline">{task.contract_detail.title}</span>
      </div>
    );
  }

  return null;
}

export default function TaskManagement() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user)
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'calendar'>('kanban')
  const [listDensity, setListDensity] = useState<'comfortable' | 'compact'>('compact')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterAssignee, setFilterAssignee] = useState<string>('all')
  const [showCompleted, setShowCompleted] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [taskCreateOpen, setTaskCreateOpen] = useState(false)
  const [taskViewOpen, setTaskViewOpen] = useState(false)
  const [viewTask, setViewTask] = useState<Task | null>(null)
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([])
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  // Ref for infinite scroll detection
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Setup drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start dragging
      },
    })
  )

  // Fetch tasks data with infinite scrolling
  const taskParams = useMemo(() => ({
    priority: filterPriority !== 'all' ? parseInt(filterPriority) : undefined,
    task_type: filterType !== 'all' ? filterType : undefined,
    assigned_to: filterAssignee !== 'all' ? parseInt(filterAssignee) : undefined,
    assigned_to__in: selectedEmployees.length > 0 ? selectedEmployees.join(',') : undefined,
  }), [filterPriority, filterType, filterAssignee, selectedEmployees])

  const {
    data: infiniteData,
    isLoading: tasksLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteTasks(taskParams)

  // Flatten all pages into a single array
  const allTasks = infiniteData?.pages.flatMap(page => page.results) || []
  const totalTaskCount = infiniteData?.pages[0]?.count || 0
  const { data: taskStats } = useTaskStats()

  const deleteTask = useDeleteTask()
  const updateTask = useUpdateTask()
  const updateTaskStatus = useUpdateTaskStatus()

  // Infinite scroll: Load more when scrolling near bottom
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    const currentLoadMoreRef = loadMoreRef.current
    if (currentLoadMoreRef) {
      observer.observe(currentLoadMoreRef)
    }

    return () => {
      if (currentLoadMoreRef) {
        observer.unobserve(currentLoadMoreRef)
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

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

  const handleTaskClick = (task: Task) => {
    setViewTask(task)
    setTaskViewOpen(true)
  }

  const handleTaskEdit = () => {
    setSelectedTask(viewTask)
    setTaskViewOpen(false)
    setTaskDialogOpen(true)
  }

  const handleTaskDelete = async (task: Task) => {
    if (confirm(`Delete task "${task.title}"?`)) {
      try {
        await deleteTask.mutateAsync(task.id)
        toast.success('Task deleted successfully')
      } catch (error) {
        handleApiError(error, {
          context: 'deleting task',
          showToast: true,
        })
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
    } catch (error) {
      handleApiError(error, {
        context: 'updating task status',
        showToast: true,
      })
    }
  }

  // Inline update handlers
  const handleInlineStatusUpdate = async (taskId: number, status: string) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        data: { status },
      })
      toast.success('Status updated')
    } catch (error) {
      handleApiError(error, {
        context: 'updating status',
        showToast: true,
      })
    }
  }

  const handleInlinePriorityUpdate = async (taskId: number, priority: number) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        data: { priority },
      })
      toast.success('Priority updated')
    } catch {
      toast.error('Failed to update priority')
    }
  }

  const handleInlineAssigneeUpdate = async (taskId: number, assignedToUsers: number[]) => {
    console.log('Updating assignees for task', taskId, 'with users:', assignedToUsers)
    try {
      const result = await updateTask.mutateAsync({
        id: taskId,
        data: { assigned_user_ids: assignedToUsers },
      })
      console.log('Assignee update result:', result)
      toast.success('Assignees updated')
    } catch (error: any) {
      console.error('Failed to update assignees:', error)
      console.error('Error details:', error.response?.data)
      toast.error(error.response?.data?.detail || 'Failed to update assignees')
    }
  }

  const handleInlineDateUpdate = async (taskId: number, dueDate: string | null) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        data: { due_date: dueDate },
      })
      toast.success('Due date updated')
    } catch {
      toast.error('Failed to update due date')
    }
  }

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as number
    const task = filteredTasks?.find((t) => t.id === taskId)
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveTask(null)
      return
    }

    const taskId = active.id as number
    const newStatus = over.id as TaskStatus

    // Find the task
    const task = filteredTasks?.find((t) => t.id === taskId)

    if (task && task.status !== newStatus) {
      // Update task status
      try {
        await updateTaskStatus.mutateAsync({ id: taskId, status: newStatus })
        toast.success('Task status updated')
      } catch (error) {
        console.error('Failed to update task status:', error)
        toast.error('Failed to update task status')
      }
    }

    setActiveTask(null)
  }

  const handleDragCancel = () => {
    setActiveTask(null)
  }

  const handleRelatedEntityClick = (e: React.MouseEvent, path: string) => {
    e.stopPropagation() // Prevent task click
    navigate(path)
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
      <div className="h-full flex flex-col space-y-4">
        {/* Compact Control Bar - Notes Style */}
        <div className="relative overflow-hidden rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 shadow-lg">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />

          <div className="relative z-10 p-4">
            {/* Header: Title + Stats + Button */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">Task Management</h1>
                <div className="flex items-center gap-2">
                  {/* Overdue Badge - Always show if > 0 */}
                  {(taskStats?.overdue ?? 0) > 0 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                      <span className="text-sm font-bold text-red-600 dark:text-red-400">{taskStats?.overdue || 0}</span>
                      <span className="text-xs text-red-600/70 dark:text-red-400/70">overdue</span>
                    </div>
                  )}
                  {/* Due Today Badge - Always show if > 0 */}
                  {(taskStats?.due_today ?? 0) > 0 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20">
                      <Clock className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                      <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{taskStats?.due_today || 0}</span>
                      <span className="text-xs text-orange-600/70 dark:text-orange-400/70">today</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 rounded-lg bg-background/50 border-white/10"
                  />
                </div>
              </div>

              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[140px] h-10 rounded-lg">
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

              {/* Task Type Filter - Hidden until department-specific filtering is implemented */}
              {/* <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px] h-10 rounded-lg">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select> */}

              <EmployeeTaskFilter
                selectedEmployees={selectedEmployees}
                onSelectionChange={setSelectedEmployees}
              />

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

              <div className="flex gap-2">
                <div className="flex gap-1 p-0.5 bg-muted rounded-lg">
                  <Button
                    variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('kanban')}
                    className="h-8 w-8 rounded-md"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 w-8 rounded-md"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('calendar')}
                    className="h-8 w-8 rounded-md"
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                </div>
                {viewMode === 'list' && (
                  <div className="flex gap-1 p-0.5 bg-muted rounded-lg">
                    <Button
                      variant={listDensity === 'comfortable' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setListDensity('comfortable')}
                      className="h-8 px-2 rounded-md text-xs"
                    >
                      Comfortable
                    </Button>
                    <Button
                      variant={listDensity === 'compact' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setListDensity('compact')}
                      className="h-8 px-2 rounded-md text-xs"
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
          <div className="flex-1 min-h-0 overflow-auto">
            {viewMode === 'kanban' ? (
              // Kanban View - Modern Minimal Design
              <div className="flex flex-col h-full">
                <div className="flex gap-3 flex-1 overflow-x-auto pb-2 scrollbar-hide">
                {statusColumns.map((column) => {
                  const Icon = column.icon
                  const tasks = tasksByStatus[column.id as keyof typeof tasksByStatus]

                  return (
                    <DroppableColumn key={column.id} id={column.id}>
                      <div className="w-[280px] h-full flex flex-col">
                        {/* Column Header - No card wrapper */}
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
                            <span className="text-xs text-muted-foreground font-medium">{tasks.length}</span>
                          </div>
                        </div>

                        {/* Tasks Container - Scrolls independently */}
                        <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0 scrollbar-hide">
                          {tasks.map((task) => (
                            <DraggableTaskCard key={task.id} task={task} onClick={() => handleTaskClick(task)}>
                              <Card className="group p-2.5 cursor-grab active:cursor-grabbing hover:shadow-lg hover:border-primary/40 transition-all duration-200 bg-card border-border/60"
                                >
                              <div className="space-y-2">
                                {/* Title and Priority */}
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

                                {/* Type Badge and Related Entity */}
                                <div className="flex items-center gap-1.5">
                                  <Badge variant="outline" className="text-[10px] font-normal border-border/60 bg-background/50 h-4 px-1.5">
                                    {TASK_TYPE_LABELS[task.task_type]}
                                  </Badge>
                                  <RelatedEntity task={task} onClick={handleRelatedEntityClick} />
                                </div>

                                {/* Footer Section - Compact */}
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

                                {/* Progress Bar - Only if > 0 */}
                                {task.completion_percentage > 0 && (
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
                  )
                })}
                </div>
                {/* Infinite scroll trigger for kanban */}
                <div ref={loadMoreRef} className="py-2 flex items-center justify-center flex-shrink-0">
                  {isFetchingNextPage && (
                    <div className="text-sm text-muted-foreground">Loading more tasks...</div>
                  )}
                  {hasNextPage && !isFetchingNextPage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchNextPage()}
                      className="text-xs"
                    >
                      Load more tasks ({totalTaskCount - allTasks.length} remaining)
                    </Button>
                  )}
                </div>
              </div>
          ) : viewMode === 'list' ? (
            listDensity === 'comfortable' ? (
              // Comfortable List View - Modern Table Design
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
                        {/* Checkbox */}
                        <TableCell className="py-3">
                          <Checkbox
                            checked={task.status === 'done'}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4"
                          />
                        </TableCell>

                        {/* Priority */}
                        <TableCell className="py-3">
                          <div className={cn(
                            "w-1 h-8 rounded-full",
                            task.priority === 4 ? 'bg-red-500' :
                            task.priority === 3 ? 'bg-orange-500' :
                            task.priority === 2 ? 'bg-blue-500' :
                            'bg-gray-400'
                          )} />
                        </TableCell>

                        {/* Task Title */}
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

                        {/* Type */}
                        <TableCell className="py-3">
                          <Badge variant="outline" className="text-xs font-normal border-border/60 bg-background/50">
                            {TASK_TYPE_LABELS[task.task_type]}
                          </Badge>
                        </TableCell>

                        {/* Assigned */}
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

                        {/* Due Date */}
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

                        {/* Progress */}
                        <TableCell className="py-3">
                          {task.completion_percentage > 0 && (
                            <div className="flex items-center gap-2">
                              <Progress value={task.completion_percentage} className="h-1.5 w-20" />
                              <span className="text-xs font-medium w-8">{task.completion_percentage}%</span>
                            </div>
                          )}
                        </TableCell>

                        {/* Status */}
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
                {/* Infinite scroll trigger */}
                <div ref={loadMoreRef} className="py-4 flex items-center justify-center">
                  {isFetchingNextPage && (
                    <div className="text-sm text-muted-foreground">Loading more tasks...</div>
                  )}
                  {!hasNextPage && allTasks.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      All {totalTaskCount} tasks loaded
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Compact List View - Status Grouped with Collapsible Sections
              <StatusGroupedCompactTable
                tasks={filteredTasks}
                onTaskClick={handleTaskClick}
                onStatusUpdate={handleInlineStatusUpdate}
                onPriorityUpdate={handleInlinePriorityUpdate}
                onAssigneeUpdate={handleInlineAssigneeUpdate}
                onDateUpdate={handleInlineDateUpdate}
              />
            )
          ) : (
            // Calendar View
            <TaskCalendar
              tasks={filteredTasks}
              onTaskClick={(task) => {
                setViewTask(task)
                setTaskViewOpen(true)
              }}
            />
          )}

          {/* Drag Overlay - shows the task being dragged */}
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

      {/* Task Form Dialog - Only for advanced editing */}
      {taskDialogOpen && (
        <TaskFormDialog
          open={taskDialogOpen}
          onOpenChange={setTaskDialogOpen}
          task={selectedTask}
        />
      )}

      {/* Task Detail Panel - View/Edit existing tasks */}
      <TaskDetailPanel
        task={viewTask}
        open={taskViewOpen}
        onOpenChange={setTaskViewOpen}
      />

      {/* Task Create Panel - Same panel but in create mode */}
      <TaskDetailPanel
        task={null}
        open={taskCreateOpen}
        onOpenChange={setTaskCreateOpen}
        createMode={true}
      />
    </AppLayout>
  )
}