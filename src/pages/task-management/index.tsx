/**
 * TaskManagement - Main orchestrator for task management page
 *
 * Components:
 * - TaskHeader: Filters, search, view mode controls
 * - TaskKanbanView: Kanban board with drag-and-drop
 * - TaskListView: List views (comfortable and compact)
 * - TaskCalendar: Calendar view
 */

import { AppLayout } from '@/components/layout/AppLayout'
import { TaskFormDialog } from '@/components/tasks/TaskFormDialog'
import { TaskDetailPanel } from '@/components/tasks/TaskDetailPanel/index'
import { TaskCalendar } from '@/components/tasks/TaskCalendar'
import { DndContext, DragOverlay, pointerWithin } from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'

import { useTaskManagement } from './hooks/useTaskManagement'
import { TaskHeader } from './components/TaskHeader'
import { TaskKanbanView, DragOverlayCard } from './components/TaskKanbanView'
import { TaskListView } from './components/TaskListView'

export default function TaskManagement() {
  const {
    // Data
    allTasks,
    filteredTasks,
    tasksByStatus,
    totalTaskCount,
    taskStats,
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
    showCompleted,
    setShowCompleted,
    selectedTask,
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

    // Refs
    loadMoreRef,

    // DnD
    sensors,

    // Handlers
    fetchNextPage,
    handleTaskClick,
    handleInlineStatusUpdate,
    handleInlinePriorityUpdate,
    handleInlineAssigneeUpdate,
    handleInlineDateUpdate,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    handleRelatedEntityClick,
  } = useTaskManagement()

  return (
    <AppLayout>
      <div className="h-full flex flex-col space-y-4">
        {/* Header with filters */}
        <TaskHeader
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
          taskStats={taskStats}
        />

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
              <TaskKanbanView
                tasksByStatus={tasksByStatus}
                onTaskClick={handleTaskClick}
                onRelatedEntityClick={handleRelatedEntityClick}
                loadMoreRef={loadMoreRef}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={hasNextPage ?? false}
                totalTaskCount={totalTaskCount}
                allTasksCount={allTasks.length}
                onFetchNextPage={fetchNextPage}
              />
            ) : viewMode === 'list' ? (
              <TaskListView
                tasks={filteredTasks}
                listDensity={listDensity}
                onTaskClick={handleTaskClick}
                onRelatedEntityClick={handleRelatedEntityClick}
                onInlineStatusUpdate={handleInlineStatusUpdate}
                onInlinePriorityUpdate={handleInlinePriorityUpdate}
                onInlineAssigneeUpdate={handleInlineAssigneeUpdate}
                onInlineDateUpdate={handleInlineDateUpdate}
                loadMoreRef={loadMoreRef}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={hasNextPage ?? false}
                totalTaskCount={totalTaskCount}
                allTasksCount={allTasks.length}
              />
            ) : (
              <TaskCalendar
                tasks={filteredTasks}
                onTaskClick={(task) => {
                  setViewTask(task)
                  setTaskViewOpen(true)
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

      {/* Task Form Dialog - Only for advanced editing */}
      {taskDialogOpen && (
        <TaskFormDialog
          open={taskDialogOpen}
          onOpenChange={setTaskDialogOpen}
          task={selectedTask}
        />
      )}

      {/* Task Detail Panel - View/Edit existing tasks */}
      <TaskDetailPanel task={viewTask} open={taskViewOpen} onOpenChange={setTaskViewOpen} />

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
