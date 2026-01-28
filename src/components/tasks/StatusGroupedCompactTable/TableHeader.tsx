import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { TableHead } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  GripVertical,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProjectCustomFieldDefinition } from '@/api/types/customFields'
import { type ColumnId, type SortDirection, type SortConfig, type FilterConfig } from './types'

// Sortable Header Component
export const SortableHeader = ({
  id,
  children,
  className,
  sortable,
  sortDirection,
  onSort,
}: {
  id: string
  children: React.ReactNode
  className?: string
  sortable?: boolean
  sortDirection?: SortDirection
  onSort?: (columnId: ColumnId) => void
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleSortClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (sortable && onSort) {
      onSort(id as ColumnId)
    }
  }

  // Don't make checkbox and task columns draggable
  if (id === 'checkbox' || id === 'task') {
    return (
      <TableHead
        className={cn(className, 'py-2', sortable && 'cursor-pointer hover:bg-muted/50')}
        onClick={handleSortClick}
      >
        <div className="flex items-center gap-1">
          {children}
          {sortable && (
            <span className="ml-1">
              {sortDirection === 'asc' ? (
                <ArrowUp className="h-3 w-3" />
              ) : sortDirection === 'desc' ? (
                <ArrowDown className="h-3 w-3" />
              ) : (
                <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
              )}
            </span>
          )}
        </div>
      </TableHead>
    )
  }

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn(
        className,
        'py-2 cursor-grab active:cursor-grabbing select-none',
        isDragging && 'opacity-50 bg-muted'
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-1">
        <GripVertical className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
        <span
          className={cn("flex items-center gap-1", sortable && "cursor-pointer hover:text-foreground")}
          onClick={handleSortClick}
        >
          {children}
          {sortable && (
            <span className="ml-0.5">
              {sortDirection === 'asc' ? (
                <ArrowUp className="h-3 w-3" />
              ) : sortDirection === 'desc' ? (
                <ArrowDown className="h-3 w-3" />
              ) : (
                <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
              )}
            </span>
          )}
        </span>
      </div>
    </TableHead>
  )
}

// Sortable Custom Field Header Component
export const SortableCustomFieldHeader = ({
  field,
  sortConfig,
  filters,
  onSort,
  onToggleFilter,
  onClearFilter,
}: {
  field: ProjectCustomFieldDefinition
  sortConfig: SortConfig
  filters: FilterConfig
  onSort: (columnId: string) => void
  onToggleFilter: (fieldId: number, value: string) => void
  onClearFilter: (fieldId: number) => void
}) => {
  const columnId = `custom-${field.id}`
  const sortableId = `cf-${field.id}`
  const isSelectField = field.field_type === 'single_select'
  const fieldFilters = filters.customFields[field.id] || []

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn(
        "py-2 font-semibold text-xs w-[120px] cursor-grab active:cursor-grabbing select-none",
        isDragging && "opacity-50 bg-muted"
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-1">
        <GripVertical className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
        <span
          className="flex items-center gap-1 cursor-pointer hover:text-foreground truncate"
          onClick={(e) => {
            e.stopPropagation()
            onSort(columnId)
          }}
        >
          <span className="truncate">{field.field_name}</span>
          <span className="ml-0.5">
            {sortConfig.column === columnId ? (
              sortConfig.direction === 'asc' ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )
            ) : (
              <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
            )}
          </span>
        </span>
        {isSelectField && field.select_options && field.select_options.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-5 w-5 p-0 ml-1",
                  fieldFilters.length > 0 && "text-primary"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <Filter className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 max-h-64 overflow-y-auto">
              {field.select_options.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option}
                  checked={fieldFilters.includes(option)}
                  onCheckedChange={() => onToggleFilter(field.id, option)}
                >
                  {option}
                </DropdownMenuCheckboxItem>
              ))}
              {fieldFilters.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={false}
                    onCheckedChange={() => onClearFilter(field.id)}
                  >
                    Clear
                  </DropdownMenuCheckboxItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </TableHead>
  )
}
