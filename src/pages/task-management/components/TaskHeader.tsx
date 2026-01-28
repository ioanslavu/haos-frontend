/**
 * TaskHeader - Compact control bar with filters and view mode toggles
 */

import { Search, LayoutGrid, List, Calendar, AlertTriangle, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmployeeTaskFilter } from '@/components/tasks/EmployeeTaskFilter'
import type { TaskStats } from '@/api/types/tasks'

interface TaskHeaderProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  filterPriority: string
  setFilterPriority: (priority: string) => void
  showCompleted: boolean
  setShowCompleted: (show: boolean) => void
  selectedEmployees: number[]
  setSelectedEmployees: (employees: number[]) => void
  viewMode: 'kanban' | 'list' | 'calendar'
  setViewMode: (mode: 'kanban' | 'list' | 'calendar') => void
  listDensity: 'comfortable' | 'compact'
  setListDensity: (density: 'comfortable' | 'compact') => void
  taskStats?: TaskStats
}

export function TaskHeader({
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
  taskStats,
}: TaskHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 shadow-lg">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />

      <div className="relative z-10 p-4">
        {/* Header: Title + Stats + Button */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Task Management</h1>
            <div className="flex items-center gap-2">
              {/* Overdue Badge */}
              {(taskStats?.overdue ?? 0) > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">
                    {taskStats?.overdue || 0}
                  </span>
                  <span className="text-xs text-red-600/70 dark:text-red-400/70">overdue</span>
                </div>
              )}
              {/* Due Today Badge */}
              {(taskStats?.due_today ?? 0) > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20">
                  <Clock className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                    {taskStats?.due_today || 0}
                  </span>
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
  )
}
