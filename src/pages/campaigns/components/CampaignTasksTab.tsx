/**
 * CampaignTasksTab - Styled campaign tasks view
 *
 * Matches the visual style of Contracts and Invoices tabs with:
 * - Summary cards for task statistics
 * - Compact table view with inline editing
 * - TaskDetailPanel for viewing/creating tasks
 */

import { useState, useMemo } from 'react'
import { isPast, isToday } from 'date-fns'
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Loader2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCampaignTasks, useUpdateTask } from '@/api/hooks/useTasks'
import { Task } from '@/api/types/tasks'
import { TaskDetailPanel } from '@/components/tasks/TaskDetailPanel'
import { StatusGroupedCompactTable } from '@/components/tasks/StatusGroupedCompactTable'
import { toast } from 'sonner'
import { handleApiError } from '@/lib/error-handler'

interface CampaignTasksTabProps {
  campaignId: number
}

export function CampaignTasksTab({ campaignId }: CampaignTasksTabProps) {
  const [showTaskPanel, setShowTaskPanel] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isCreateMode, setIsCreateMode] = useState(false)

  const { data: tasks, isLoading } = useCampaignTasks(campaignId)
  const updateTask = useUpdateTask()

  // Compute task statistics
  const stats = useMemo(() => {
    const taskList = tasks || []
    const total = taskList.length
    const completed = taskList.filter((t: Task) => t.status === 'done').length
    const active = taskList.filter((t: Task) =>
      t.status === 'todo' || t.status === 'in_progress' || t.status === 'review'
    ).length
    const overdue = taskList.filter((t: Task) => {
      if (t.status === 'done' || t.status === 'cancelled') return false
      if (!t.due_date) return false
      const dueDate = new Date(t.due_date)
      return isPast(dueDate) && !isToday(dueDate)
    }).length

    return { total, completed, active, overdue }
  }, [tasks])

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setIsCreateMode(false)
    setShowTaskPanel(true)
  }

  const handleAddTask = () => {
    setSelectedTask(null)
    setIsCreateMode(true)
    setShowTaskPanel(true)
  }

  const handlePanelClose = (open: boolean) => {
    setShowTaskPanel(open)
    if (!open) {
      setSelectedTask(null)
      setIsCreateMode(false)
    }
  }

  // Inline update handlers for compact table
  const handleStatusUpdate = async (taskId: number, status: string) => {
    try {
      await updateTask.mutateAsync({ id: taskId, data: { status } })
      toast.success('Status updated')
    } catch (error) {
      handleApiError(error, { context: 'updating status', showToast: true })
    }
  }

  const handlePriorityUpdate = async (taskId: number, priority: number) => {
    try {
      await updateTask.mutateAsync({ id: taskId, data: { priority } })
      toast.success('Priority updated')
    } catch (error) {
      handleApiError(error, { context: 'updating priority', showToast: true })
    }
  }

  const handleAssigneeUpdate = async (taskId: number, assignedToUsers: number[]) => {
    try {
      await updateTask.mutateAsync({ id: taskId, data: { assigned_user_ids: assignedToUsers } })
      toast.success('Assignees updated')
    } catch (error) {
      handleApiError(error, { context: 'updating assignees', showToast: true })
    }
  }

  const handleDateUpdate = async (taskId: number, dueDate: string | null) => {
    try {
      await updateTask.mutateAsync({ id: taskId, data: { due_date: dueDate } })
      toast.success('Due date updated')
    } catch (error) {
      handleApiError(error, { context: 'updating due date', showToast: true })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Tasks</h3>
          <p className="text-sm text-muted-foreground">
            Track campaign tasks, deadlines and deliverables
          </p>
        </div>
        <Button
          onClick={handleAddTask}
          className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <CheckSquare className="h-4 w-4 text-cyan-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Tasks</p>
              <p className="text-lg font-semibold">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-lg font-semibold text-blue-600">{stats.active}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-lg font-semibold text-emerald-600">{stats.completed}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Overdue</p>
              <p className={cn(
                "text-lg font-semibold",
                stats.overdue > 0 ? "text-amber-600" : "text-muted-foreground"
              )}>
                {stats.overdue}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Task List */}
      {isLoading ? (
        <Card className="p-8 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-2">Loading tasks...</p>
        </Card>
      ) : tasks && tasks.length > 0 ? (
        <StatusGroupedCompactTable
          tasks={tasks}
          onTaskClick={handleTaskClick}
          onStatusUpdate={handleStatusUpdate}
          onPriorityUpdate={handlePriorityUpdate}
          onAssigneeUpdate={handleAssigneeUpdate}
          onDateUpdate={handleDateUpdate}
        />
      ) : (
        <Card className="p-12 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm text-center">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckSquare className="h-8 w-8 text-cyan-500" />
          </div>
          <h4 className="font-semibold mb-2">No tasks yet</h4>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Create tasks to track deliverables, deadlines, and progress for this campaign.
          </p>
          <Button
            onClick={handleAddTask}
            className="mt-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create First Task
          </Button>
        </Card>
      )}

      {/* Task Detail Panel */}
      <TaskDetailPanel
        task={selectedTask}
        open={showTaskPanel}
        onOpenChange={handlePanelClose}
        createMode={isCreateMode}
        defaultCampaignId={campaignId}
      />
    </div>
  )
}
