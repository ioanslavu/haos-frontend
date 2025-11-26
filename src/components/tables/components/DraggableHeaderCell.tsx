import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { SortIndicator } from './SortIndicator';
import { FilterPopover } from './FilterPopover';
import type { ColumnDef, SortDirection, SortState, RowDensity, DENSITY_CLASSES, FilterOption } from '../types';

interface DraggableHeaderCellProps<T> {
  column: ColumnDef<T>;
  sortState: SortState | null;
  filterState?: { columnId: string; value: unknown };
  onSort?: (columnId: string, direction: SortDirection) => void;
  onFilter?: (columnId: string, value: unknown) => void;
  onClearFilter?: (columnId: string) => void;
  densityClasses: typeof DENSITY_CLASSES[RowDensity];
  isDraggable?: boolean;
}

export function DraggableHeaderCell<T>({
  column,
  sortState,
  filterState,
  onSort,
  onFilter,
  onClearFilter,
  densityClasses,
  isDraggable = true,
}: DraggableHeaderCellProps<T>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, disabled: !isDraggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: column.width,
    minWidth: column.minWidth,
    maxWidth: column.maxWidth,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  const isSorted = sortState?.columnId === column.id;
  const currentDirection = isSorted ? sortState.direction : null;
  const isFiltered = filterState?.columnId === column.id && filterState.value !== undefined && filterState.value !== null && filterState.value !== '';

  const handleSortClick = () => {
    if (!column.sortable || !onSort) return;

    let nextDirection: SortDirection;
    if (currentDirection === null) {
      nextDirection = 'asc';
    } else if (currentDirection === 'asc') {
      nextDirection = 'desc';
    } else {
      nextDirection = null;
    }

    onSort(column.id, nextDirection);
  };

  const handleFilterChange = (columnId: string, value: unknown) => {
    onFilter?.(columnId, value);
  };

  const handleClearFilter = () => {
    onClearFilter?.(column.id);
  };

  const headerContent = typeof column.header === 'string' ? column.header : null;
  const filterOptions: FilterOption[] = column.filterOptions || [];

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn(
        densityClasses.head,
        'font-semibold group',
        column.headerClassName,
        column.align === 'center' && 'text-center',
        column.align === 'right' && 'text-right',
        isDragging && 'bg-muted shadow-lg'
      )}
    >
      <div className="flex items-center gap-1">
        {/* Drag handle - only visible on hover */}
        {isDraggable && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-0.5 -ml-1 rounded hover:bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
        )}

        {/* Sortable header content */}
        <div
          className={cn(
            'flex items-center gap-1 flex-1 min-w-0',
            column.sortable && 'cursor-pointer select-none'
          )}
          onClick={column.sortable ? handleSortClick : undefined}
          role={column.sortable ? 'button' : undefined}
          tabIndex={column.sortable ? 0 : undefined}
          onKeyDown={
            column.sortable
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSortClick();
                  }
                }
              : undefined
          }
          aria-sort={
            isSorted
              ? currentDirection === 'asc'
                ? 'ascending'
                : 'descending'
              : undefined
          }
        >
          {headerContent && <span className="truncate">{headerContent}</span>}
          {/* Only show sort indicator when actively sorted */}
          {column.sortable && isSorted && (
            <SortIndicator direction={currentDirection} />
          )}
        </div>

        {/* Filter popover - only visible on hover or when active */}
        {column.filterable && column.filterType && (
          <div className={cn(
            'transition-opacity',
            isFiltered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}>
            <FilterPopover
              columnId={column.id}
              filterType={column.filterType}
              filterOptions={filterOptions}
              filterPlaceholder={column.filterPlaceholder}
              currentValue={isFiltered ? filterState?.value : undefined}
              onFilterChange={handleFilterChange}
            />
          </div>
        )}
      </div>
    </TableHead>
  );
}
