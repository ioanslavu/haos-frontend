/**
 * Custom hook for TaskManagement state and logic
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useInfiniteTasks,
  useTaskStats,
  useDeleteTask,
  useUpdateTask,
  useUpdateTaskStatus,
} from '@/api/hooks/useTasks'
import { useAuthStore } from '@/stores/authStore'
import { useSensors, useSensor, PointerSensor } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import type { Task, TaskStatus } from '@/api/types/tasks'
import { toast } from 'sonner'
import { handleApiError } from '@/lib/error-handler'

export function useTaskManagement() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.user)

  // UI State
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
  const taskParams = useMemo(
    () => ({
      priority: filterPriority !== 'all' ? parseInt(filterPriority) : undefined,
      task_type: filterType !== 'all' ? filterType : undefined,
      assigned_to: filterAssignee !== 'all' ? parseInt(filterAssignee) : undefined,
      assigned_to__in: selectedEmployees.length > 0 ? selectedEmployees.join(',') : undefined,
    }),
    [filterPriority, filterType, filterAssignee, selectedEmployees]
  )

  const {
    data: infiniteData,
    isLoading: tasksLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteTasks(taskParams)

  // Flatten all pages into a single array
  const allTasks = infiniteData?.pages.flatMap((page) => page.results) || []
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
  const filteredTasks =
    allTasks?.filter((task) => {
      if (!showCompleted && task.status === 'done') return false
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    }) || []

  // Group tasks by status for kanban view
  const tasksByStatus = {
    todo: filteredTasks.filter((t) => t.status === 'todo'),
    in_progress: filteredTasks.filter((t) => t.status === 'in_progress'),
    blocked: filteredTasks.filter((t) => t.status === 'blocked'),
    review: filteredTasks.filter((t) => t.status === 'review'),
    done: filteredTasks.filter((t) => t.status === 'done'),
  }

  // Task click handler
  const handleTaskClick = (task: Task) => {
    setViewTask(task)
    setTaskViewOpen(true)
  }

  // Task edit handler
  const handleTaskEdit = () => {
    setSelectedTask(viewTask)
    setTaskViewOpen(false)
    setTaskDialogOpen(true)
  }

  // Task delete handler
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

  // Status change handler
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
    try {
      await updateTask.mutateAsync({
        id: taskId,
        data: { assigned_user_ids: assignedToUsers },
      })
      toast.success('Assignees updated')
    } catch (error: any) {
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

    const task = filteredTasks?.find((t) => t.id === taskId)

    if (task && task.status !== newStatus) {
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
    e.stopPropagation()
    navigate(path)
  }

  return {
    // Data
    currentUser,
    allTasks,
    filteredTasks,
    tasksByStatus,
    totalTaskCount,
    taskStats,
    tasksLoading,
    hasNextPage,
    isFetchingNextPage,

    // UI State
    viewMode,
    setViewMode,
    listDensity,
    setListDensity,
    searchQuery,
    setSearchQuery,
    filterPriority,
    setFilterPriority,
    filterType,
    setFilterType,
    filterAssignee,
    setFilterAssignee,
    showCompleted,
    setShowCompleted,
    selectedTask,
    setSelectedTask,
    taskDialogOpen,
    setTaskDialogOpen,
    taskCreateOpen,
    setTaskCreateOpen,
    taskViewOpen,
    setTaskViewOpen,
    viewTask,
    setViewTask,
    selectedEmployees,
    setSelectedEmployees,
    activeTask,
    setActiveTask,

    // Refs
    scrollContainerRef,
    loadMoreRef,

    // DnD
    sensors,

    // Handlers
    navigate,
    fetchNextPage,
    handleTaskClick,
    handleTaskEdit,
    handleTaskDelete,
    handleStatusChange,
    handleInlineStatusUpdate,
    handleInlinePriorityUpdate,
    handleInlineAssigneeUpdate,
    handleInlineDateUpdate,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    handleRelatedEntityClick,
  }
}
