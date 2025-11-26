import { useCallback } from 'react';
import { TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { SortIndicator } from './SortIndicator';
import { FilterPopover } from './FilterPopover';
import type { ColumnDef, SortDirection, SortState, FilterState, RowDensity, DENSITY_CLASSES, FilterOption } from '../types';

interface HeaderCellProps<T> {
  column: ColumnDef<T>;
  sortState: SortState | null;
  filterState?: FilterState;
  onSort?: (columnId: string, direction: SortDirection) => void;
  onFilter?: (columnId: string, value: unknown) => void;
  onClearFilter?: (columnId: string) => void;
  densityClasses: typeof DENSITY_CLASSES[RowDensity];
}

export function HeaderCell<T>({
  column,
  sortState,
  filterState,
  onSort,
  onFilter,
  onClearFilter,
  densityClasses,
}: HeaderCellProps<T>) {
  const isSorted = sortState?.columnId === column.id;
  const currentDirection = isSorted ? sortState.direction : null;
  const isFiltered = filterState?.columnId === column.id && filterState.value !== undefined && filterState.value !== null && filterState.value !== '';

  const handleSortClick = useCallback(() => {
    if (!column.sortable || !onSort) return;

    // Cycle through: null -> asc -> desc -> null
    let nextDirection: SortDirection;
    if (currentDirection === null) {
      nextDirection = 'asc';
    } else if (currentDirection === 'asc') {
      nextDirection = 'desc';
    } else {
      nextDirection = null;
    }

    onSort(column.id, nextDirection);
  }, [column.id, column.sortable, currentDirection, onSort]);

  const handleFilterChange = useCallback((value: unknown) => {
    onFilter?.(column.id, value);
  }, [column.id, onFilter]);

  const handleClearFilter = useCallback(() => {
    onClearFilter?.(column.id);
  }, [column.id, onClearFilter]);

  const headerContent = typeof column.header === 'string' ? column.header : null;

  // Get filter options for the column
  const filterOptions: FilterOption[] = column.filterOptions || [];

  return (
    <TableHead
      className={cn(
        densityClasses.head,
        column.headerClassName,
        column.align === 'center' && 'text-center',
        column.align === 'right' && 'text-right'
      )}
      style={{
        width: column.width,
        minWidth: column.minWidth,
        maxWidth: column.maxWidth,
      }}
    >
      <div className="flex items-center gap-1">
        {/* Sortable header content */}
        <div
          className={cn(
            'flex items-center gap-1 flex-1 min-w-0',
            column.sortable && 'cursor-pointer select-none hover:text-foreground'
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
          {column.sortable && (
            <SortIndicator direction={currentDirection} />
          )}
        </div>

        {/* Filter popover */}
        {column.filterable && column.filterType && (
          <FilterPopover
            filterType={column.filterType}
            value={isFiltered ? filterState?.value : undefined}
            onChange={handleFilterChange}
            onClear={handleClearFilter}
            options={filterOptions}
            placeholder={column.filterPlaceholder}
            isActive={isFiltered}
          />
        )}
      </div>
    </TableHead>
  );
}
