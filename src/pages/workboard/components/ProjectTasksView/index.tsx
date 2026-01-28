/**
 * ProjectTasksView - Main orchestrator for project task management
 */

import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
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
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { LayoutGrid, Plus } from 'lucide-react'
import { RecurringTaskPanel } from '@/components/recurring/RecurringTaskPanel'
import { TaskDetailPanel } from '@/components/tasks/TaskDetailPanel/index'
import { TaskCalendar } from '@/components/tasks/TaskCalendar'
import { TasksHeader } from './TasksHeader'
import { TasksKanban, DragOverlayCard } from './TasksKanban'
import { TasksList } from './TasksList'
import { RecurringTasksManager } from './RecurringTasksManager'
import { useProjectTasksView } from './hooks/useProjectTasks'
import type { ProjectTasksViewProps, TaskStatus } from './types'

export function ProjectTasksView({ project, showBackButton, showFullPageButton, onClose, initialTaskId }: ProjectTasksViewProps) {
  const { user } = useAuthStore()
  const isMarketingDepartment = user?.department?.toLowerCase() === 'marketing'

  // Setup drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const {
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

    // Data
    filteredTasks,
    tasksByStatus,
    overdueTasks,
    dueTodayTasks,
    recurringTemplates,
    isLoadingTasks,
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
  } = useProjectTasksView({ project, initialTaskId })

  // DnD handlers
  const onDragStart = (event: DragStartEvent) => {
    handleDragStart(event.active.id as number)
  }

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      handleDragCancel()
      return
    }

    await handleDragEnd(active.id as number, over.id as TaskStatus)
  }

  return (
    <>
      <div className="flex flex-col h-full space-y-4">
        {/* Control Bar */}
        <TasksHeader
          project={project}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterPriority={filterPriority}
          setFilterPriority={setFilterPriority}
          showCompleted={showCompleted}
          setShowCompleted={setShowCompleted}
          selectedEmployees={selectedEmployees}
          setSelectedEmployees={setSelectedEmployees}
          viewMode={viewMode}
          setViewMode={setViewMode}
          listDensity={listDensity}
          setListDensity={setListDensity}
          isMarketingDepartment={isMarketingDepartment}
          overdueTasks={overdueTasks}
          dueTodayTasks={dueTodayTasks}
          showBackButton={showBackButton}
          showFullPageButton={showFullPageButton}
          onClose={onClose}
          onArchiveToggle={handleArchiveToggle}
          isArchived={isArchived}
          onCreateTask={() => setTaskCreateOpen(true)}
          onNewRecurringTask={handleNewRecurringTask}
          recurringTemplates={recurringTemplates}
          setRecurringManageOpen={setRecurringManageOpen}
        />

        {/* Main Content */}
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex-1 overflow-hidden">
            {isLoadingTasks ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading tasks...</div>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <LayoutGrid className="h-12 w-12 mb-3 opacity-50" />
                <p className="font-medium">No tasks yet</p>
                <p className="text-sm mt-1">Create your first task to get started</p>
                <Button size="sm" className="mt-4 rounded-lg" onClick={() => setTaskCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>
            ) : viewMode === 'kanban' ? (
              <TasksKanban
                tasksByStatus={tasksByStatus}
                onTaskClick={handleTaskClick}
                onRelatedEntityClick={handleRelatedEntityClick}
              />
            ) : viewMode === 'list' ? (
              <TasksList
                tasks={filteredTasks}
                projectId={project.id}
                listDensity={listDensity}
                onTaskClick={handleTaskClick}
                onStatusUpdate={handleStatusUpdate}
                onPriorityUpdate={handlePriorityUpdate}
                onAssigneeUpdate={handleAssigneeUpdate}
                onDateUpdate={handleDateUpdate}
                onCustomFieldUpdate={handleCustomFieldUpdate}
                onRelatedEntityClick={handleRelatedEntityClick}
              />
            ) : (
              <TaskCalendar
                tasks={filteredTasks}
                onTaskClick={(task) => {
                  handleTaskClick(task)
                }}
                onDateClick={() => {
                  setTaskCreateOpen(true)
                }}
              />
            )}

            {/* Drag Overlay */}
            <DragOverlay modifiers={[snapCenterToCursor]}>
              {activeTask ? <DragOverlayCard task={activeTask} /> : null}
            </DragOverlay>
          </div>
        </DndContext>
      </div>

      {/* Task Detail Panel - View/Edit existing tasks */}
      <TaskDetailPanel
        task={viewTask}
        open={taskViewOpen}
        onOpenChange={setTaskViewOpen}
        projectId={project.id}
      />

      {/* Task Create Panel */}
      <TaskDetailPanel
        task={null}
        open={taskCreateOpen}
        onOpenChange={setTaskCreateOpen}
        createMode={true}
        projectId={project.id}
      />

      {/* Recurring Task Panel */}
      {project.is_recurring_project && (
        <RecurringTaskPanel
          isOpen={recurringDialogOpen}
          onClose={() => {
            setRecurringDialogOpen(false)
            setSelectedRecurringTemplate(undefined)
          }}
          projectId={project.id}
          template={selectedRecurringTemplate}
        />
      )}

      {/* Recurring Tasks Management Dialog */}
      {project.is_recurring_project && recurringTemplates && (
        <RecurringTasksManager
          templates={recurringTemplates}
          open={recurringManageOpen}
          onOpenChange={setRecurringManageOpen}
          onEditTemplate={handleEditRecurringTemplate}
          onNewTemplate={handleNewRecurringTask}
          onToggleActive={handleToggleTemplateActive}
        />
      )}
    </>
  )
}

export default ProjectTasksView
