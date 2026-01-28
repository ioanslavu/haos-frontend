import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { useProjectCustomFieldDefinitions } from '@/api/hooks/useCustomFields'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { ChevronsUpDown, Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TASK_STATUS_LABELS, TASK_TYPE_LABELS } from '@/api/types/tasks'
import { useTaskGrouping } from './hooks/useTaskGrouping'
import { SortableHeader, SortableCustomFieldHeader } from './TableHeader'
import { StatusSection } from './StatusSection'
import { AddFieldPopover } from './AddFieldPopover'
import {
  STATUS_ORDER,
  COLUMNS,
  PRIORITY_LABELS,
  getColumnWidth,
  type StatusGroupedCompactTableProps,
  type ColumnId,
} from './types'

export function StatusGroupedCompactTable({
  tasks,
  projectId,
  onTaskClick,
  onStatusUpdate,
  onPriorityUpdate,
  onAssigneeUpdate,
  onDateUpdate,
  onCustomFieldUpdate,
}: StatusGroupedCompactTableProps) {
  const navigate = useNavigate()

  const { data: customFieldDefinitions = [] } = useProjectCustomFieldDefinitions(projectId)

  const {
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
    totalCount,
  } = useTaskGrouping(tasks, customFieldDefinitions)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  const handleColumnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const activeId = String(active.id)
      const overId = String(over.id)

      if (activeId.startsWith('cf-') && overId.startsWith('cf-')) {
        const activeFieldId = parseInt(activeId.replace('cf-', ''))
        const overFieldId = parseInt(overId.replace('cf-', ''))

        setCustomFieldOrder((items) => {
          const oldIndex = items.indexOf(activeFieldId)
          const newIndex = items.indexOf(overFieldId)
          if (oldIndex !== -1 && newIndex !== -1) {
            return arrayMove(items, oldIndex, newIndex)
          }
          return items
        })
      } else {
        setColumnOrder((items) => {
          const oldIndex = items.indexOf(active.id as ColumnId)
          const newIndex = items.indexOf(over.id as ColumnId)
          return arrayMove(items, oldIndex, newIndex)
        })
      }
    }
  }

  const handleRelatedEntityClick = (e: React.MouseEvent, path: string) => {
    e.stopPropagation()
    navigate(path)
  }

  const renderFilterDropdown = (columnId: ColumnId) => {
    if (columnId === 'type') {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className={cn("h-5 w-5 p-0 ml-1", filters.type.length > 0 && "text-primary")} onClick={(e) => e.stopPropagation()}>
              <Filter className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {uniqueTypes.map((type) => (
              <DropdownMenuCheckboxItem key={type} checked={filters.type.includes(type)} onCheckedChange={() => toggleFilter('type', type)}>
                {TASK_TYPE_LABELS[type] || type}
              </DropdownMenuCheckboxItem>
            ))}
            {filters.type.length > 0 && (<><DropdownMenuSeparator /><DropdownMenuCheckboxItem checked={false} onCheckedChange={() => setFilters(prev => ({ ...prev, type: [] }))}>Clear</DropdownMenuCheckboxItem></>)}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
    if (columnId === 'priority') {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className={cn("h-5 w-5 p-0 ml-1", filters.priority.length > 0 && "text-primary")} onClick={(e) => e.stopPropagation()}>
              <Filter className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-36">
            {[4, 3, 2, 1].map((priority) => (
              <DropdownMenuCheckboxItem key={priority} checked={filters.priority.includes(priority)} onCheckedChange={() => toggleFilter('priority', priority)}>
                {PRIORITY_LABELS[priority]}
              </DropdownMenuCheckboxItem>
            ))}
            {filters.priority.length > 0 && (<><DropdownMenuSeparator /><DropdownMenuCheckboxItem checked={false} onCheckedChange={() => setFilters(prev => ({ ...prev, priority: [] }))}>Clear</DropdownMenuCheckboxItem></>)}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
    if (columnId === 'status') {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className={cn("h-5 w-5 p-0 ml-1", filters.status.length > 0 && "text-primary")} onClick={(e) => e.stopPropagation()}>
              <Filter className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            {STATUS_ORDER.map((status) => (
              <DropdownMenuCheckboxItem key={status} checked={filters.status.includes(status)} onCheckedChange={() => toggleFilter('status', status)}>
                {TASK_STATUS_LABELS[status]}
              </DropdownMenuCheckboxItem>
            ))}
            {filters.status.length > 0 && (<><DropdownMenuSeparator /><DropdownMenuCheckboxItem checked={false} onCheckedChange={() => setFilters(prev => ({ ...prev, status: [] }))}>Clear</DropdownMenuCheckboxItem></>)}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
    if (columnId === 'assigned') {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className={cn("h-5 w-5 p-0 ml-1", filters.assigned.length > 0 && "text-primary")} onClick={(e) => e.stopPropagation()}>
              <Filter className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 max-h-64 overflow-y-auto">
            {uniqueAssignedUsers.length === 0 ? (<div className="px-2 py-1 text-xs text-muted-foreground">No assigned users</div>) : (
              uniqueAssignedUsers.map((user) => (
                <DropdownMenuCheckboxItem key={user.id} checked={filters.assigned.includes(user.id)} onCheckedChange={() => toggleFilter('assigned', user.id)}>
                  {user.name}
                </DropdownMenuCheckboxItem>
              ))
            )}
            {filters.assigned.length > 0 && (<><DropdownMenuSeparator /><DropdownMenuCheckboxItem checked={false} onCheckedChange={() => setFilters(prev => ({ ...prev, assigned: [] }))}>Clear</DropdownMenuCheckboxItem></>)}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
    return null
  }

  return (
    <div className="rounded-lg border border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/60 bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {hasActiveFilters ? `${filteredTasks.length} of ${totalCount} tasks` : `${totalCount} tasks`}
          </span>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3 mr-1" />Clear filters
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={allExpanded ? handleCollapseAll : handleExpandAll} className="h-7 px-2 text-xs">
            <ChevronsUpDown className="h-3.5 w-3.5 mr-1" />{allExpanded ? 'Collapse all' : 'Expand all'}
          </Button>
        </div>
      </div>

      <div className="border-b border-border/60 bg-background/50 overflow-x-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleColumnDragEnd}>
          <Table className="w-full min-w-[920px] table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={cn("py-2", getColumnWidth('checkbox'))}></TableHead>
                <SortableHeader id="task" className={cn("font-semibold text-xs", getColumnWidth('task'))} sortable={true} sortDirection={sortConfig.column === 'task' ? sortConfig.direction : null} onSort={handleSort}>
                  Task
                </SortableHeader>
                <SortableContext items={columnOrder.filter(id => id !== 'checkbox' && id !== 'task')} strategy={horizontalListSortingStrategy}>
                  {columnOrder.filter(id => id !== 'checkbox' && id !== 'task').map((columnId) => {
                    const column = COLUMNS.find(c => c.id === columnId)
                    if (!column) return null
                    return (
                      <SortableHeader key={column.id} id={column.id} className={cn('font-semibold text-xs', column.width)} sortable={column.sortable} sortDirection={sortConfig.column === column.id ? sortConfig.direction : null} onSort={handleSort}>
                        <span className="flex items-center">{column.label}{renderFilterDropdown(columnId)}</span>
                      </SortableHeader>
                    )
                  })}
                </SortableContext>
                <SortableContext items={visibleCustomFields.map(f => `cf-${f.id}`)} strategy={horizontalListSortingStrategy}>
                  {visibleCustomFields.map((field) => (
                    <SortableCustomFieldHeader key={`cf-${field.id}`} field={field} sortConfig={sortConfig} filters={filters} onSort={handleSort} onToggleFilter={toggleCustomFieldFilter} onClearFilter={clearCustomFieldFilter} />
                  ))}
                </SortableContext>
                {projectId && <AddFieldPopover projectId={projectId} customFieldDefinitionsCount={customFieldDefinitions.length} />}
              </TableRow>
            </TableHeader>
          </Table>
        </DndContext>
      </div>

      <div className="overflow-x-auto">
        {STATUS_ORDER.map(status => (
          <StatusSection
            key={status}
            status={status}
            tasks={tasksByStatus[status]}
            columnOrder={columnOrder}
            customFields={visibleCustomFields}
            isExpanded={expandedStatuses.has(status)}
            onToggle={() => handleToggleStatus(status)}
            visibleCount={visibleCounts[status]}
            onShowMore={() => handleShowMore(status)}
            onTaskClick={onTaskClick}
            onStatusUpdate={onStatusUpdate}
            onPriorityUpdate={onPriorityUpdate}
            onAssigneeUpdate={onAssigneeUpdate}
            onDateUpdate={onDateUpdate}
            onRelatedEntityClick={handleRelatedEntityClick}
            onCustomFieldUpdate={onCustomFieldUpdate}
          />
        ))}
      </div>

      {totalCount === 0 && (
        <div className="px-4 py-8 text-center text-muted-foreground">
          No tasks found
        </div>
      )}
    </div>
  )
}

export default StatusGroupedCompactTable
