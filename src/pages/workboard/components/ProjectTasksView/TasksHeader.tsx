/**
 * TasksHeader - Header with filters and controls for ProjectTasksView
 */

import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Search,
  Calendar,
  Clock,
  AlertTriangle,
  LayoutGrid,
  List,
  Archive,
  RotateCcw,
  Maximize2,
  ArrowLeft,
  Repeat,
  Settings2,
} from 'lucide-react'
import { EmployeeTaskFilter } from '@/components/tasks/EmployeeTaskFilter'
import { cn } from '@/lib/utils'
import {
  PROJECT_TYPE_CONFIG,
  PROJECT_STATUS_CONFIG,
} from '@/types/projects'
import type { TasksHeaderProps } from './types'

export function TasksHeader({
  project,
  searchQuery,
  setSearchQuery,
  filterPriority,
  setFilterPriority,
  showCompleted,
  setShowCompleted,
  selectedEmployees,
  setSelectedEmployees,
  viewMode,
  setViewMode,
  listDensity,
  setListDensity,
  isMarketingDepartment,
  overdueTasks,
  dueTodayTasks,
  showBackButton,
  showFullPageButton,
  onClose,
  onArchiveToggle,
  isArchived,
  onCreateTask,
  onNewRecurringTask,
  recurringTemplates,
  setRecurringManageOpen,
}: TasksHeaderProps) {
  const navigate = useNavigate()
  const typeConfig = PROJECT_TYPE_CONFIG[project.project_type]
  const statusConfig = PROJECT_STATUS_CONFIG[project.status]

  return (
    <div className="relative overflow-hidden rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />

      <div className="relative z-10 p-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/workboard')}
                className="rounded-lg"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-xl text-lg",
              "bg-gradient-to-br",
              typeConfig.color.replace('bg-', 'from-') + '/20',
              typeConfig.color.replace('bg-', 'to-') + '/10'
            )}>
              {typeConfig.icon}
            </div>
            <div>
              <h1 className={cn("font-bold tracking-tight", showBackButton ? "text-2xl" : "text-xl")}>{project.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{typeConfig.label}</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "rounded-md text-xs",
                    statusConfig.bgColor,
                    statusConfig.color
                  )}
                >
                  {statusConfig.label}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {overdueTasks.length > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">{overdueTasks.length}</span>
                  <span className="text-xs text-red-600/70 dark:text-red-400/70">overdue</span>
                </div>
              )}
              {dueTodayTasks.length > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20">
                  <Clock className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{dueTodayTasks.length}</span>
                  <span className="text-xs text-orange-600/70 dark:text-orange-400/70">today</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showFullPageButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigate(`/workboard/${project.id}`)
                  onClose?.()
                }}
                className="rounded-lg"
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                Full Page
              </Button>
            )}
            {/* Hide archive for projects with "general" in name */}
            {!project.name.toLowerCase().includes('general') && (
              <Button
                variant="outline"
                size="sm"
                onClick={onArchiveToggle}
                className="rounded-lg"
              >
                {isArchived ? (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restore
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </>
                )}
              </Button>
            )}
            {project.is_recurring_project ? (
              <Button
                onClick={onNewRecurringTask}
                size="default"
                className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                <Repeat className="h-4 w-4 mr-2" />
                New Recurring Task
              </Button>
            ) : (
              <Button
                onClick={onCreateTask}
                size="default"
                className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">
              {project.completed_task_count} of {project.task_count} tasks completed
            </span>
            <span className="text-xs font-medium">{project.completion_percentage}%</span>
          </div>
          <Progress value={project.completion_percentage} className="h-1.5" />
        </div>

        {/* Recurring Templates Summary */}
        {project.is_recurring_project && recurringTemplates && recurringTemplates.length > 0 && (
          <div className="mb-4">
            <div
              onClick={() => setRecurringManageOpen(true)}
              className="flex items-center justify-between p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 cursor-pointer hover:bg-indigo-500/10 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10">
                  <Repeat className="h-4 w-4 text-indigo-500" />
                </div>
                <div>
                  <span className="text-sm font-medium">Recurring Tasks</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-600 border-green-500/20">
                      {recurringTemplates.filter(t => t.is_active).length} active
                    </Badge>
                    {recurringTemplates.filter(t => !t.is_active).length > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {recurringTemplates.filter(t => !t.is_active).length} paused
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-indigo-600">
                <Settings2 className="h-4 w-4 mr-1" />
                Manage
              </Button>
            </div>
          </div>
        )}

        {/* Filters Row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 rounded-lg bg-background/50 border-white/10"
              />
            </div>
          </div>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[130px] h-9 rounded-lg">
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

          <EmployeeTaskFilter
            selectedEmployees={selectedEmployees}
            onSelectionChange={setSelectedEmployees}
          />

          <div className="flex items-center gap-2">
            <Checkbox
              id="show-completed-view"
              checked={showCompleted}
              onCheckedChange={(checked) => setShowCompleted(checked as boolean)}
            />
            <label htmlFor="show-completed-view" className="text-sm">
              Show completed
            </label>
          </div>

          <div className="flex gap-2">
            <div className="flex gap-1 p-0.5 bg-muted rounded-lg">
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className="h-7 w-7 rounded-md"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-7 w-7 rounded-md"
              >
                <List className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className="h-7 w-7 rounded-md"
              >
                <Calendar className="h-3.5 w-3.5" />
              </Button>
            </div>
            {viewMode === 'list' && !isMarketingDepartment && (
              <div className="flex gap-1 p-0.5 bg-muted rounded-lg">
                <Button
                  variant={listDensity === 'comfortable' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setListDensity('comfortable')}
                  className="h-7 px-2 rounded-md text-xs"
                >
                  Comfortable
                </Button>
                <Button
                  variant={listDensity === 'compact' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setListDensity('compact')}
                  className="h-7 px-2 rounded-md text-xs"
                >
                  Compact
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
