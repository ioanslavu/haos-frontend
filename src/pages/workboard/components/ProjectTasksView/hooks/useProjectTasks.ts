/**
 * Hook for ProjectTasksView state and handlers
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { isToday } from 'date-fns'
import { toast } from 'sonner'
import { handleApiError } from '@/lib/error-handler'
import {
  useProjectTasks as useProjectTasksQuery,
  useArchiveProject,
  useActivateProject,
  useUpdateProjectTask,
  useRecurringTaskTemplates,
  useActivateRecurringTask,
  useDeactivateRecurringTask,
} from '@/api/hooks/useProjects'
import { useUpdateTaskCustomFieldValue, useBulkUpdateTaskCustomFieldValues } from '@/api/hooks/useCustomFields'
import { useUpdateTask } from '@/api/hooks/useTasks'
import { Task, TaskStatus } from '@/api/types/tasks'
import type { Project, ProjectTask, RecurringTaskTemplate } from '@/types/projects'
import { convertProjectTaskToTask } from '../types'

interface UseProjectTasksViewParams {
  project: Project
  initialTaskId?: number
}

export function useProjectTasksView({ project, initialTaskId }: UseProjectTasksViewParams) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // View state
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'calendar'>('kanban')
  const [listDensity, setListDensity] = useState<'comfortable' | 'compact'>('compact')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [showCompleted, setShowCompleted] = useState(false)
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([])

  // Task state
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [viewTask, setViewTask] = useState<Task | null>(null)
  const [taskViewOpen, setTaskViewOpen] = useState(false)
  const [taskCreateOpen, setTaskCreateOpen] = useState(false)

  // Recurring state
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false)
  const [selectedRecurringTemplate, setSelectedRecurringTemplate] = useState<RecurringTaskTemplate | undefined>()
  const [recurringManageOpen, setRecurringManageOpen] = useState(false)
  const [recurringSearchQuery, setRecurringSearchQuery] = useState('')
  const [recurringFilterStatus, setRecurringFilterStatus] = useState<'all' | 'active' | 'paused'>('all')

  // Fetch tasks for this project
  const { data: tasks, isLoading: isLoadingTasks } = useProjectTasksQuery({ project: project.id })

  // Fetch recurring templates for recurring projects
  const { data: recurringTemplates, isLoading: isLoadingTemplates } = useRecurringTaskTemplates(
    project.is_recurring_project ? { project: project.id } : undefined
  )

  // Mutations
  const archiveProject = useArchiveProject()
  const activateProject = useActivateProject()
  const updateProjectTask = useUpdateProjectTask()
  const updateTask = useUpdateTask()
  const activateTemplate = useActivateRecurringTask()
  const deactivateTemplate = useDeactivateRecurringTask()
  const updateCustomFieldValue = useUpdateTaskCustomFieldValue()
  const bulkUpdateCustomFieldValues = useBulkUpdateTaskCustomFieldValues()

  const isArchived = project.status === 'archived'

  // Convert ProjectTasks to Tasks for compatibility
  const allTasks: Task[] = tasks?.map(convertProjectTaskToTask) || []

  // Auto-open task if initialTaskId is provided
  useEffect(() => {
    if (initialTaskId && allTasks.length > 0) {
      const taskToOpen = allTasks.find(t => t.id === initialTaskId)
      if (taskToOpen) {
        setViewTask(taskToOpen)
        setTaskViewOpen(true)
      }
    }
  }, [initialTaskId, allTasks.length])

  // Calculate stats
  const overdueTasks = allTasks.filter(t => t.is_overdue && t.status !== 'done')
  const dueTodayTasks = allTasks.filter(t => t.due_date && isToday(new Date(t.due_date)) && t.status !== 'done')

  // Filter tasks
  const filteredTasks = allTasks.filter(task => {
    if (!showCompleted && task.status === 'done') return false
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterPriority !== 'all' && task.priority !== parseInt(filterPriority)) return false
    if (selectedEmployees.length > 0 && !task.assigned_to_users?.some(id => selectedEmployees.includes(id))) return false
    return true
  })

  // Group tasks by status for kanban view
  const tasksByStatus = {
    todo: filteredTasks.filter(t => t.status === 'todo'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    blocked: filteredTasks.filter(t => t.status === 'blocked'),
    review: filteredTasks.filter(t => t.status === 'review'),
    done: filteredTasks.filter(t => t.status === 'done'),
  }

  // Handlers
  const handleArchiveToggle = useCallback(() => {
    if (isArchived) {
      activateProject.mutate(project.id)
    } else {
      archiveProject.mutate(project.id)
    }
  }, [isArchived, activateProject, archiveProject, project.id])

  const handleTaskClick = useCallback((task: Task) => {
    setViewTask(task)
    setTaskViewOpen(true)
  }, [])

  const handleStatusUpdate = useCallback(async (taskId: number, status: string) => {
    try {
      await updateProjectTask.mutateAsync({
        id: taskId,
        data: { status: status as ProjectTask['status'] },
      })
      toast.success('Status updated')
    } catch (error) {
      handleApiError(error, {
        context: 'updating task status',
        showToast: true,
      })
    }
  }, [updateProjectTask])

  const handlePriorityUpdate = useCallback(async (taskId: number, priority: number) => {
    try {
      await updateProjectTask.mutateAsync({
        id: taskId,
        data: { priority: priority as ProjectTask['priority'] },
      })
      toast.success('Priority updated')
    } catch (error) {
      handleApiError(error, {
        context: 'updating task priority',
        showToast: true,
      })
    }
  }, [updateProjectTask])

  const handleAssigneeUpdate = useCallback(async (taskId: number, assignedToUsers: number[]) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        data: { assigned_user_ids: assignedToUsers },
      })
      toast.success('Assignee updated')
    } catch (error) {
      handleApiError(error, {
        context: 'updating task assignee',
        showToast: true,
      })
    }
  }, [updateTask])

  const handleDateUpdate = useCallback(async (taskId: number, dueDate: string | null) => {
    try {
      await updateProjectTask.mutateAsync({
        id: taskId,
        data: { due_date: dueDate },
      })
      toast.success('Due date updated')
    } catch (error) {
      toast.error('Failed to update task due date')
    }
  }, [updateProjectTask])

  const handleCustomFieldUpdate = useCallback(async (taskId: number, fieldId: number, value: string | null) => {
    const task = tasks?.find(t => t.id === taskId)
    const fieldValue = task?.custom_field_values?.[fieldId]

    if (fieldValue?.id) {
      updateCustomFieldValue.mutate({
        taskId,
        valueId: fieldValue.id,
        data: { value },
      }, {
        onSuccess: () => {
          queryClient.refetchQueries({ queryKey: ['project-tasks'] })
          queryClient.refetchQueries({ queryKey: ['tasks', taskId, 'fieldsWithDefinitions'] })
        },
      })
    } else {
      bulkUpdateCustomFieldValues.mutate({
        taskId,
        values: [{ field_definition_id: fieldId, value }],
      }, {
        onSuccess: () => {
          queryClient.refetchQueries({ queryKey: ['project-tasks'] })
          queryClient.refetchQueries({ queryKey: ['tasks', taskId, 'fieldsWithDefinitions'] })
        },
      })
    }
  }, [tasks, updateCustomFieldValue, bulkUpdateCustomFieldValues, queryClient])

  const handleRelatedEntityClick = useCallback((e: React.MouseEvent, path: string) => {
    e.stopPropagation()
    navigate(path)
  }, [navigate])

  const handleEditRecurringTemplate = useCallback((template: RecurringTaskTemplate) => {
    setSelectedRecurringTemplate(template)
    setRecurringDialogOpen(true)
  }, [])

  const handleNewRecurringTask = useCallback(() => {
    setSelectedRecurringTemplate(undefined)
    setRecurringDialogOpen(true)
  }, [])

  const handleToggleTemplateActive = useCallback(async (template: RecurringTaskTemplate) => {
    try {
      if (template.is_active) {
        await deactivateTemplate.mutateAsync(template.id)
        toast.success('Recurring task paused')
      } else {
        await activateTemplate.mutateAsync(template.id)
        toast.success('Recurring task activated')
      }
    } catch (error) {
      toast.error('Failed to update recurring task')
    }
  }, [deactivateTemplate, activateTemplate])

  // Drag handlers
  const handleDragStart = useCallback((taskId: number) => {
    const task = filteredTasks.find((t) => t.id === taskId)
    if (task) {
      setActiveTask(task)
    }
  }, [filteredTasks])

  const handleDragEnd = useCallback(async (taskId: number, newStatus: TaskStatus) => {
    const task = filteredTasks.find((t) => t.id === taskId)

    if (task && task.status !== newStatus) {
      await handleStatusUpdate(taskId, newStatus)
    }

    setActiveTask(null)
  }, [filteredTasks, handleStatusUpdate])

  const handleDragCancel = useCallback(() => {
    setActiveTask(null)
  }, [])

  return {
    // View state
    viewMode,
    setViewMode,
    listDensity,
    setListDensity,
    searchQuery,
    setSearchQuery,
    filterPriority,
    setFilterPriority,
    showCompleted,
    setShowCompleted,
    selectedEmployees,
    setSelectedEmployees,

    // Task state
    activeTask,
    viewTask,
    setViewTask,
    taskViewOpen,
    setTaskViewOpen,
    taskCreateOpen,
    setTaskCreateOpen,

    // Recurring state
    recurringDialogOpen,
    setRecurringDialogOpen,
    selectedRecurringTemplate,
    setSelectedRecurringTemplate,
    recurringManageOpen,
    setRecurringManageOpen,
    recurringSearchQuery,
    setRecurringSearchQuery,
    recurringFilterStatus,
    setRecurringFilterStatus,

    // Data
    allTasks,
    filteredTasks,
    tasksByStatus,
    overdueTasks,
    dueTodayTasks,
    recurringTemplates,
    isLoadingTasks,
    isLoadingTemplates,
    isArchived,

    // Handlers
    handleArchiveToggle,
    handleTaskClick,
    handleStatusUpdate,
    handlePriorityUpdate,
    handleAssigneeUpdate,
    handleDateUpdate,
    handleCustomFieldUpdate,
    handleRelatedEntityClick,
    handleEditRecurringTemplate,
    handleNewRecurringTask,
    handleToggleTemplateActive,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  }
}
