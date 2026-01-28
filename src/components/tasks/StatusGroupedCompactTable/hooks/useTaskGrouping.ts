import { useMemo, useState, useEffect, useCallback } from 'react'
import type { Task, TaskStatus } from '@/api/types/tasks'
import type { ProjectCustomFieldDefinition } from '@/api/types/customFields'
import {
  STATUS_ORDER,
  STATUS_CONFIG,
  INITIAL_VISIBLE_COUNT,
  LOAD_MORE_COUNT,
  DEFAULT_COLUMN_ORDER,
  STORAGE_KEY,
  CUSTOM_FIELD_ORDER_KEY,
  type ColumnId,
  type SortConfig,
  type FilterConfig,
} from '../types'

export function useTaskGrouping(tasks: Task[], customFieldDefinitions: ProjectCustomFieldDefinition[]) {
  // State for column order with localStorage persistence
  const [columnOrder, setColumnOrder] = useState<ColumnId[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length === DEFAULT_COLUMN_ORDER.length) {
          return parsed
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    return DEFAULT_COLUMN_ORDER
  })

  // State for custom field column order
  const [customFieldOrder, setCustomFieldOrder] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_FIELD_ORDER_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    return []
  })

  // Sort state
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: null,
    direction: null,
  })

  // Filter state
  const [filters, setFilters] = useState<FilterConfig>({
    type: [],
    priority: [],
    status: [],
    assigned: [],
    customFields: {},
  })

  // State for expanded sections
  const [expandedStatuses, setExpandedStatuses] = useState<Set<TaskStatus>>(() => {
    const initial = new Set<TaskStatus>()
    STATUS_ORDER.forEach(status => {
      if (STATUS_CONFIG[status].defaultExpanded) {
        initial.add(status)
      }
    })
    return initial
  })

  // State for visible count per status
  const [visibleCounts, setVisibleCounts] = useState<Record<TaskStatus, number>>(() => {
    const initial: Record<string, number> = {}
    STATUS_ORDER.forEach(status => {
      initial[status] = INITIAL_VISIBLE_COUNT
    })
    return initial as Record<TaskStatus, number>
  })

  // Save column order to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columnOrder))
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [columnOrder])

  // Save custom field order to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_FIELD_ORDER_KEY, JSON.stringify(customFieldOrder))
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [customFieldOrder])

  // Get visible custom field definitions (show_in_table = true)
  const visibleCustomFields = useMemo(() => {
    const filtered = customFieldDefinitions.filter(def => def.show_in_table && !def.is_archived)

    if (customFieldOrder.length > 0) {
      return filtered.sort((a, b) => {
        const aIndex = customFieldOrder.indexOf(a.id)
        const bIndex = customFieldOrder.indexOf(b.id)

        if (aIndex === -1 && bIndex === -1) return a.order - b.order
        if (aIndex === -1) return 1
        if (bIndex === -1) return -1
        return aIndex - bIndex
      })
    }

    return filtered.sort((a, b) => a.order - b.order)
  }, [customFieldDefinitions, customFieldOrder])

  // Update custom field order when fields change
  useEffect(() => {
    if (visibleCustomFields.length > 0 && customFieldOrder.length === 0) {
      setCustomFieldOrder(visibleCustomFields.map(f => f.id))
    } else if (visibleCustomFields.length > 0) {
      const newFields = visibleCustomFields.filter(f => !customFieldOrder.includes(f.id))
      if (newFields.length > 0) {
        setCustomFieldOrder(prev => [...prev, ...newFields.map(f => f.id)])
      }
    }
  }, [visibleCustomFields, customFieldOrder])

  // Handle sort
  const handleSort = useCallback((columnId: ColumnId | string) => {
    setSortConfig((prev) => {
      if (prev.column === columnId) {
        if (prev.direction === 'asc') {
          return { column: columnId, direction: 'desc' }
        } else if (prev.direction === 'desc') {
          return { column: null, direction: null }
        }
      }
      return { column: columnId, direction: 'asc' }
    })
  }, [])

  // Handle filter toggle
  const toggleFilter = useCallback((column: keyof FilterConfig, value: string | number) => {
    setFilters((prev) => {
      const currentValues = prev[column] as (string | number)[]
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value]
      return { ...prev, [column]: newValues }
    })
  }, [])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({ type: [], priority: [], status: [], assigned: [], customFields: {} })
  }, [])

  // Toggle custom field filter
  const toggleCustomFieldFilter = useCallback((fieldId: number, value: string) => {
    setFilters((prev) => {
      const currentValues = prev.customFields[fieldId] || []
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value]

      const newCustomFields = { ...prev.customFields }
      if (newValues.length === 0) {
        delete newCustomFields[fieldId]
      } else {
        newCustomFields[fieldId] = newValues
      }

      return { ...prev, customFields: newCustomFields }
    })
  }, [])

  // Clear custom field filter
  const clearCustomFieldFilter = useCallback((fieldId: number) => {
    setFilters(prev => {
      const newCustomFields = { ...prev.customFields }
      delete newCustomFields[fieldId]
      return { ...prev, customFields: newCustomFields }
    })
  }, [])

  // Check if any filters are active
  const hasActiveFilters = filters.type.length > 0 ||
    filters.priority.length > 0 ||
    filters.status.length > 0 ||
    filters.assigned.length > 0 ||
    Object.keys(filters.customFields).length > 0

  // Get unique values for filters from tasks
  const uniqueTypes = useMemo(() => {
    const types = new Set(tasks.map(t => t.task_type))
    return Array.from(types).sort()
  }, [tasks])

  // Get unique assigned users for filter dropdown
  const uniqueAssignedUsers = useMemo(() => {
    const usersMap = new Map<number, { id: number; name: string }>()
    tasks.forEach(task => {
      task.assigned_to_users_detail?.forEach(user => {
        if (!usersMap.has(user.id)) {
          usersMap.set(user.id, { id: user.id, name: user.full_name || user.email })
        }
      })
    })
    return Array.from(usersMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [tasks])

  // Sort function
  const sortTasks = useCallback((tasksToSort: Task[]): Task[] => {
    if (!sortConfig.column || !sortConfig.direction) {
      return tasksToSort
    }

    return [...tasksToSort].sort((a, b) => {
      let comparison = 0

      switch (sortConfig.column) {
        case 'task':
          comparison = a.title.localeCompare(b.title)
          break
        case 'type':
          comparison = a.task_type.localeCompare(b.task_type)
          break
        case 'priority':
          comparison = b.priority - a.priority
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'due':
          if (!a.due_date && !b.due_date) comparison = 0
          else if (!a.due_date) comparison = 1
          else if (!b.due_date) comparison = -1
          else comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
          break
        default:
          if (sortConfig.column && sortConfig.column.startsWith('custom-')) {
            const fieldId = parseInt(sortConfig.column.replace('custom-', ''))
            const aValue = a.custom_field_values?.[fieldId]?.display_value ?? a.custom_field_values?.[fieldId]?.value ?? ''
            const bValue = b.custom_field_values?.[fieldId]?.display_value ?? b.custom_field_values?.[fieldId]?.value ?? ''

            if (typeof aValue === 'number' && typeof bValue === 'number') {
              comparison = aValue - bValue
            } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
              comparison = (aValue ? 1 : 0) - (bValue ? 1 : 0)
            } else {
              comparison = String(aValue).localeCompare(String(bValue))
            }
          } else {
            comparison = 0
          }
      }

      return sortConfig.direction === 'desc' ? -comparison : comparison
    })
  }, [sortConfig])

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filters.type.length > 0 && !filters.type.includes(task.task_type)) {
        return false
      }
      if (filters.priority.length > 0 && !filters.priority.includes(task.priority)) {
        return false
      }
      if (filters.status.length > 0 && !filters.status.includes(task.status)) {
        return false
      }
      if (filters.assigned.length > 0) {
        const taskUserIds = task.assigned_to_users_detail?.map(u => u.id) || []
        const hasMatchingUser = filters.assigned.some(userId => taskUserIds.includes(userId))
        if (!hasMatchingUser) {
          return false
        }
      }
      for (const [fieldIdStr, selectedValues] of Object.entries(filters.customFields)) {
        const fieldId = parseInt(fieldIdStr)
        if (selectedValues.length > 0) {
          const fieldValue = task.custom_field_values?.[fieldId]
          const taskValue = fieldValue?.value || ''
          if (!selectedValues.includes(taskValue)) {
            return false
          }
        }
      }
      return true
    })
  }, [tasks, filters])

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      blocked: [],
      review: [],
      done: [],
      cancelled: [],
    }

    filteredTasks.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task)
      }
    })

    Object.keys(grouped).forEach(status => {
      grouped[status as TaskStatus] = sortTasks(grouped[status as TaskStatus])
    })

    return grouped
  }, [filteredTasks, sortTasks])

  const handleToggleStatus = useCallback((status: TaskStatus) => {
    setExpandedStatuses(prev => {
      const next = new Set(prev)
      if (next.has(status)) {
        next.delete(status)
      } else {
        next.add(status)
      }
      return next
    })
  }, [])

  const handleShowMore = useCallback((status: TaskStatus) => {
    setVisibleCounts(prev => ({
      ...prev,
      [status]: prev[status] + LOAD_MORE_COUNT,
    }))
  }, [])

  const handleExpandAll = useCallback(() => {
    setExpandedStatuses(new Set(STATUS_ORDER))
  }, [])

  const handleCollapseAll = useCallback(() => {
    setExpandedStatuses(new Set())
  }, [])

  const allExpanded = expandedStatuses.size === STATUS_ORDER.length
  const allCollapsed = expandedStatuses.size === 0

  return {
    columnOrder,
    setColumnOrder,
    customFieldOrder,
    setCustomFieldOrder,
    sortConfig,
    handleSort,
    filters,
    setFilters,
    toggleFilter,
    clearFilters,
    toggleCustomFieldFilter,
    clearCustomFieldFilter,
    hasActiveFilters,
    uniqueTypes,
    uniqueAssignedUsers,
    visibleCustomFields,
    filteredTasks,
    tasksByStatus,
    expandedStatuses,
    visibleCounts,
    handleToggleStatus,
    handleShowMore,
    handleExpandAll,
    handleCollapseAll,
    allExpanded,
    allCollapsed,
    totalCount: tasks.length,
  }
}
