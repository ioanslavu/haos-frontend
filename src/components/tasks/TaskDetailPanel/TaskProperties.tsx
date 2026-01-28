import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { InlinePrioritySelect } from '@/components/tasks/InlinePrioritySelect'
import { InlineAssigneeSelect } from '@/components/tasks/InlineAssigneeSelect'
import { InlineTeamSelect } from '@/components/tasks/InlineTeamSelect'
import { InlineDepartmentSelect } from '@/components/tasks/InlineDepartmentSelect'
import { InlineDatePicker } from '@/components/tasks/InlineDatePicker'
import { InlineDurationSelect } from '@/components/tasks/InlineDurationSelect'
import {
  Flag,
  User,
  Users,
  Building2,
  Calendar,
  Clock,
  ClipboardCheck,
  Bell,
  BellOff,
  TrendingUp,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { TaskPropertiesProps } from './types'

export function TaskProperties({
  localPriority,
  setLocalPriority,
  localAssignees,
  setLocalAssignees,
  localTeam,
  setLocalTeam,
  localDepartment,
  setLocalDepartment,
  localDueDate,
  setLocalDueDate,
  localEstimatedHours,
  setLocalEstimatedHours,
  localNeedsReview,
  setLocalNeedsReview,
  isCreateMode,
  task,
  createdTaskId,
  isAdmin,
  departments,
  isDepartmentsLoading,
  onUpdateField,
}: TaskPropertiesProps) {
  const hasFollowUpReminder = !!task?.reminder_date

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Properties
      </h4>

      <div className="space-y-3">
        {/* Priority */}
        <div className="flex items-start gap-3 group">
          <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
            <Flag className="h-4 w-4" />
            <span>Priority</span>
          </div>
          <div className="flex-1">
            <InlinePrioritySelect
              value={localPriority}
              onSave={async (value) => {
                setLocalPriority(value)
                if (!isCreateMode && (task || createdTaskId)) {
                  await onUpdateField('priority', value)
                }
              }}
              className="w-full justify-start"
            />
          </div>
        </div>

        {/* Assignees */}
        <div className="flex items-start gap-3 group">
          <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Assigned to</span>
          </div>
          <div className="flex-1">
            <InlineAssigneeSelect
              value={localAssignees}
              onSave={async (value) => {
                setLocalAssignees(value)
                if (!isCreateMode && (task || createdTaskId)) {
                  await onUpdateField('assigned_user_ids', value)
                }
              }}
              placeholder="Add assignees..."
              className="w-full"
            />
          </div>
        </div>

        {/* Team */}
        <div className="flex items-start gap-3 group">
          <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Team</span>
          </div>
          <div className="flex-1">
            <InlineTeamSelect
              value={localTeam}
              teamDetail={task?.assigned_team_detail}
              onSave={async (value) => {
                setLocalTeam(value)
                if (!isCreateMode && (task || createdTaskId)) {
                  await onUpdateField('assigned_team_id', value)
                }
              }}
              placeholder="Add team..."
              className="w-full"
            />
          </div>
        </div>

        {/* Department (for admin users) */}
        {isAdmin && (
          <div className="flex items-start gap-3 group">
            <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>Department</span>
            </div>
            <div className="flex-1">
              <InlineDepartmentSelect
                value={localDepartment}
                departments={departments}
                onSave={async (value) => {
                  setLocalDepartment(value)
                  if (!isCreateMode && (task || createdTaskId) && value !== null) {
                    await onUpdateField('department', value)
                  }
                }}
                placeholder="Select department..."
                className="w-full"
                isLoading={isDepartmentsLoading}
              />
              {!localDepartment && (
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-1 flex items-center gap-1">
                  Warning: Department is required to save tasks
                </p>
              )}
            </div>
          </div>
        )}

        {/* Due Date */}
        <div className="flex items-start gap-3 group">
          <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Due date</span>
          </div>
          <div className="flex-1">
            <InlineDatePicker
              value={localDueDate}
              onSave={async (value) => {
                setLocalDueDate(value)
                if (!isCreateMode && (task || createdTaskId)) {
                  await onUpdateField('due_date', value)
                }
              }}
              placeholder="Add due date..."
              className="w-full"
            />
            {localDueDate && new Date(localDueDate) < new Date(new Date().toDateString()) && task?.status !== 'done' && (
              <Badge variant="destructive" className="text-xs mt-2">
                Overdue
              </Badge>
            )}
          </div>
        </div>

        {/* Estimated Duration */}
        <div className="flex items-start gap-3 group">
          <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Estimated</span>
          </div>
          <div className="flex-1">
            <InlineDurationSelect
              value={localEstimatedHours}
              onSave={async (value) => {
                setLocalEstimatedHours(value)
                if (!isCreateMode && (task || createdTaskId)) {
                  await onUpdateField('estimated_hours', value)
                }
              }}
              placeholder="Set estimated time"
              className="w-full justify-start"
            />
          </div>
        </div>

        {/* Needs Review */}
        <div className="flex items-start gap-3 group">
          <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
            <ClipboardCheck className="h-4 w-4" />
            <span>Needs review</span>
          </div>
          <div className="flex-1">
            <button
              onClick={async () => {
                const newValue = !localNeedsReview
                setLocalNeedsReview(newValue)
                if (!isCreateMode && (task || createdTaskId)) {
                  await onUpdateField('needs_review', newValue)
                }
              }}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                localNeedsReview
                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {localNeedsReview ? "Yes" : "No"}
            </button>
            {localNeedsReview && (
              <p className="text-xs text-muted-foreground mt-1">
                Requires manager approval before completion
              </p>
            )}
          </div>
        </div>

        {/* Actual Duration (Read-only, auto-calculated) */}
        {task?.actual_hours && (
          <div className="flex items-start gap-3 group">
            <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Actual</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {task.actual_hours < 1
                    ? `${Math.round(task.actual_hours * 60)} min`
                    : task.actual_hours === 1
                    ? '1 hour'
                    : task.actual_hours % 1 === 0
                    ? `${task.actual_hours} hours`
                    : `${Math.floor(task.actual_hours)}h ${Math.round((task.actual_hours % 1) * 60)}m`
                  }
                </span>
                <Badge variant="secondary" className="text-xs">
                  Auto-calculated
                </Badge>
              </div>
              {task.estimated_hours && (
                <p className="text-xs text-muted-foreground mt-1">
                  {task.actual_hours > task.estimated_hours
                    ? `${((task.actual_hours - task.estimated_hours) * 60).toFixed(0)} min over estimate`
                    : task.actual_hours < task.estimated_hours
                    ? `${((task.estimated_hours - task.actual_hours) * 60).toFixed(0)} min under estimate`
                    : 'Exactly as estimated'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Follow-up Reminder */}
        {hasFollowUpReminder && task && (
          <div className="flex items-start gap-3 group">
            <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
              {task.follow_up_reminder_sent ? (
                <BellOff className="h-4 w-4" />
              ) : (
                <Bell className="h-4 w-4 text-orange-500" />
              )}
              <span>Follow-up</span>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <span className="text-sm">{format(new Date(task.reminder_date!), 'PPP')}</span>
              {!task.follow_up_reminder_sent && (
                <Badge variant="outline" className="text-xs">
                  Pending
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Progress */}
        {task && task.completion_percentage > 0 && (
          <div className="flex items-start gap-3 group">
            <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Progress</span>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <Progress value={task.completion_percentage} className="h-2 flex-1" />
                <span className="text-sm font-medium w-12 text-right">
                  {task.completion_percentage}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
