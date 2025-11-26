import { useMemo, useRef, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useTableState } from './hooks/useTableState';
import { useInfiniteScroll } from './hooks/useInfiniteScroll';
import { useGrouping } from './hooks/useGrouping';
import { useColumnOrder } from './hooks/useColumnOrder';
import { useVirtualization } from './hooks/useVirtualization';
import { TableProvider, type TableContextValue } from './context';
import {
  HeaderCell,
  DraggableHeaderCell,
  DataCell,
  EditableCell,
  GroupHeader,
  LoadingSkeleton,
  EmptyState,
  InfiniteScrollSentinel,
} from './components';
import type {
  GenericTableProps,
  ColumnDef,
  DENSITY_CLASSES,
  FilterState,
} from './types';

// ============================================================================
// Main Component
// ============================================================================

export function GenericTable<T>({
  // Required
  columns,
  data,

  // Identity
  getRowId = (row) => (row as { id: string | number }).id,

  // Grouping
  grouping,

  // Column Reordering
  reorderableColumns = false,
  onColumnOrderChange,

  // Dynamic Columns
  dynamicColumns,

  // Infinite Scroll
  infiniteScroll,

  // Virtualization
  virtualization,

  // Row Selection
  selection,

  // Row Actions
  onRowClick,
  onRowDoubleClick,
  rowClassName,

  // Server-Side Handlers
  onSort,
  onFilter,
  onSave,

  // Current State
  sortState: controlledSortState,
  filterState: controlledFilterState,

  // State Persistence
  persistKey,

  // UI Options
  loading = false,
  emptyState,
  density = 'comfortable',
  stickyHeader = false,
  stripedRows = false,

  // Toolbar
  showToolbar = false,
  toolbarLeft,
  toolbarRight,

  // Footer
  footer,

  // Accessibility
  ariaLabel = 'Data table',
}: GenericTableProps<T>) {
  // ============================================================================
  // Refs
  // ============================================================================

  const tableContainerRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // Merge columns with dynamic columns
  // ============================================================================

  const allColumns = useMemo<ColumnDef<T>[]>(() => {
    if (!dynamicColumns || dynamicColumns.length === 0) {
      return columns;
    }
    return [...columns, ...dynamicColumns];
  }, [columns, dynamicColumns]);

  // ============================================================================
  // Table State
  // ============================================================================

  const tableInstance = useTableState<T>({
    data,
    columns: allColumns,
    getRowId,
    persistKey,
    sortState: controlledSortState,
    filterState: controlledFilterState,
    selectedIds: selection?.selected,
    onSort,
    onFilter,
    onSelectionChange: selection?.onSelectionChange,
    onColumnOrderChange,
  });

  // ============================================================================
  // Column Ordering (Drag & Drop)
  // ============================================================================

  const {
    orderedColumns: columnOrderColumns,
    visibleColumns,
    moveColumn,
    resetColumnOrder,
  } = useColumnOrder({
    columns: allColumns,
    persistKey: persistKey ? `${persistKey}-columns` : undefined,
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      moveColumn(active.id as string, over.id as string);
      onColumnOrderChange?.(tableInstance.columnOrder);
    }
  }, [moveColumn, onColumnOrderChange, tableInstance.columnOrder]);

  // ============================================================================
  // Grouping
  // ============================================================================

  const {
    groupedData,
    toggleGroup,
    isGroupExpanded,
    hasGroups,
  } = useGrouping({
    data,
    groupBy: grouping?.groupBy,
    getGroupLabel: grouping?.getGroupLabel,
    initialExpanded: grouping?.initialExpanded ?? true,
    persistKey: persistKey ? `${persistKey}-groups` : undefined,
  });

  // ============================================================================
  // Virtualization
  // ============================================================================

  const flatData = useMemo(() => {
    if (!hasGroups || !grouping?.enabled) return data;
    return groupedData.flatMap((group) => (group.isExpanded ? group.items : []));
  }, [data, groupedData, hasGroups, grouping?.enabled]);

  const {
    parentRef: virtualParentRef,
    virtualItems,
    totalSize,
    paddingTop,
    paddingBottom,
    isVirtualized,
  } = useVirtualization({
    data: flatData,
    enabled: virtualization?.enabled ?? false,
    estimateSize: virtualization?.estimateRowHeight ?? 40,
    overscan: virtualization?.overscan ?? 5,
    getItemKey: (index, item) => String(getRowId(item)),
  });

  // ============================================================================
  // Infinite Scroll
  // ============================================================================

  const { sentinelRef, isFetching, hasMore } = useInfiniteScroll({
    config: infiniteScroll,
  });

  // ============================================================================
  // Order and filter columns
  // ============================================================================

  const orderedColumns = useMemo(() => {
    return visibleColumns.filter((col) => !col.hidden);
  }, [visibleColumns]);

  // ============================================================================
  // Get filter state for a column
  // ============================================================================

  const getColumnFilterState = useCallback((columnId: string): { columnId: string; value: unknown } | undefined => {
    const value = tableInstance.filterState[columnId];
    if (value === undefined) return undefined;
    return { columnId, value };
  }, [tableInstance.filterState]);

  // ============================================================================
  // Handle filter change
  // ============================================================================

  const handleFilterChange = useCallback((columnId: string, value: unknown) => {
    // tableInstance.setFilter already calls onFilter callback internally
    tableInstance.setFilter(columnId, value);
  }, [tableInstance]);

  // ============================================================================
  // Handle clear filter
  // ============================================================================

  const handleClearFilter = useCallback((columnId: string) => {
    // tableInstance.clearFilter already calls onFilter callback internally
    tableInstance.clearFilter(columnId);
  }, [tableInstance]);

  // ============================================================================
  // Density classes
  // ============================================================================

  const densityClasses: typeof DENSITY_CLASSES[typeof density] = useMemo(() => {
    const classes = {
      compact: {
        cell: 'px-3 py-2 text-xs',
        head: 'px-3 py-2 text-xs h-9',
        row: 'h-9',
      },
      comfortable: {
        cell: 'px-4 py-3 text-sm',
        head: 'px-4 py-3 text-sm h-11',
        row: 'h-11',
      },
      spacious: {
        cell: 'px-6 py-4 text-sm',
        head: 'px-6 py-4 text-sm h-14',
        row: 'h-14',
      },
    };
    return classes[density];
  }, [density]);

  // ============================================================================
  // Context value
  // ============================================================================

  const contextValue = useMemo<TableContextValue<T>>(
    () => ({
      instance: tableInstance,
      columns: orderedColumns,
      density,
      reorderableColumns,
      stickyHeader,
      stripedRows,
      onSort,
      onFilter,
      onSave,
      onRowClick,
      onRowDoubleClick,
      loading,
    }),
    [
      tableInstance,
      orderedColumns,
      density,
      reorderableColumns,
      stickyHeader,
      stripedRows,
      onSort,
      onFilter,
      onSave,
      onRowClick,
      onRowDoubleClick,
      loading,
    ]
  );

  // ============================================================================
  // Check if filters are active
  // ============================================================================

  const hasActiveFilters = Object.keys(tableInstance.filterState).length > 0;

  // ============================================================================
  // Render Header
  // ============================================================================

  const renderHeader = () => {
    const HeaderComponent = reorderableColumns ? DraggableHeaderCell : HeaderCell;

    const headerContent = (
      <TableRow className="border-b border-border/60 hover:bg-transparent">
        {orderedColumns.map((column) => (
          <HeaderComponent
            key={column.id}
            column={column}
            sortState={tableInstance.sortState}
            filterState={getColumnFilterState(column.id)}
            onSort={onSort}
            onFilter={handleFilterChange}
            onClearFilter={handleClearFilter}
            densityClasses={densityClasses}
            isDraggable={reorderableColumns}
          />
        ))}
      </TableRow>
    );

    if (reorderableColumns) {
      return (
        <SortableContext
          items={orderedColumns.map((c) => c.id)}
          strategy={horizontalListSortingStrategy}
        >
          {headerContent}
        </SortableContext>
      );
    }

    return headerContent;
  };

  // ============================================================================
  // Render Row
  // ============================================================================

  const renderRow = (row: T, rowIndex: number) => {
    const rowId = getRowId(row);
    const customClassName = rowClassName?.(row);
    const hasEditableColumns = orderedColumns.some(
      (col) => col.editable && col.editorType
    );

    return (
      <TableRow
        key={rowId}
        className={cn(
          densityClasses.row,
          'border-b border-border/40 transition-colors',
          stripedRows && rowIndex % 2 === 1 && 'bg-muted/50',
          (onRowClick || onRowDoubleClick) && 'cursor-pointer hover:bg-muted/50',
          customClassName
        )}
        onClick={onRowClick ? () => onRowClick(row) : undefined}
        onDoubleClick={onRowDoubleClick ? () => onRowDoubleClick(row) : undefined}
      >
        {orderedColumns.map((column) =>
          hasEditableColumns && column.editable && column.editorType ? (
            <EditableCell
              key={column.id}
              column={column}
              row={row}
              rowIndex={rowIndex}
              table={tableInstance}
              densityClasses={densityClasses}
              onSave={onSave}
            />
          ) : (
            <DataCell
              key={column.id}
              column={column}
              row={row}
              rowIndex={rowIndex}
              table={tableInstance}
              densityClasses={densityClasses}
            />
          )
        )}
      </TableRow>
    );
  };

  // ============================================================================
  // Render Body Content
  // ============================================================================

  const renderBodyContent = () => {
    // Loading state
    if (loading) {
      return (
        <LoadingSkeleton
          rowCount={5}
          columnCount={orderedColumns.length}
          densityClasses={densityClasses}
        />
      );
    }

    // Empty state
    if (data.length === 0) {
      return (
        <EmptyState
          columnCount={orderedColumns.length}
          hasFilters={hasActiveFilters}
          onClearFilters={hasActiveFilters ? tableInstance.clearFilters : undefined}
        >
          {emptyState}
        </EmptyState>
      );
    }

    // Grouped data
    if (hasGroups && grouping?.enabled) {
      return groupedData.map((group) => (
        <>
          <GroupHeader
            key={`group-${group.key}`}
            groupKey={group.key}
            groupLabel={group.label}
            count={group.items.length}
            isExpanded={isGroupExpanded(group.key)}
            onToggle={toggleGroup}
            colSpan={orderedColumns.length}
            densityClasses={densityClasses}
            icon={grouping.getGroupIcon?.(group.key)}
          />
          {group.isExpanded &&
            group.items.map((row, index) => renderRow(row, index))}
        </>
      ));
    }

    // Virtualized data
    if (isVirtualized && virtualization?.enabled) {
      return (
        <>
          {paddingTop > 0 && (
            <tr>
              <td colSpan={orderedColumns.length} style={{ height: paddingTop }} />
            </tr>
          )}
          {virtualItems.map((virtualItem) => {
            const row = flatData[virtualItem.index];
            return row ? renderRow(row, virtualItem.index) : null;
          })}
          {paddingBottom > 0 && (
            <tr>
              <td colSpan={orderedColumns.length} style={{ height: paddingBottom }} />
            </tr>
          )}
        </>
      );
    }

    // Regular data
    return data.map((row, rowIndex) => renderRow(row, rowIndex));
  };

  // ============================================================================
  // Render
  // ============================================================================

  const tableContent = (
    <div className="space-y-4">
      {/* Toolbar */}
      {showToolbar && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-2">
            {toolbarLeft}
          </div>
          <div className="flex items-center gap-2">
            {toolbarRight}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div
        ref={virtualization?.enabled ? virtualParentRef : tableContainerRef}
        className={cn(
          'overflow-hidden',
          virtualization?.enabled && 'overflow-auto',
          virtualization?.enabled && virtualization.maxHeight && `max-h-[${virtualization.maxHeight}px]`
        )}
        style={virtualization?.enabled && virtualization.maxHeight ? { maxHeight: virtualization.maxHeight } : undefined}
      >
        <div className="overflow-x-auto">
          <Table aria-label={ariaLabel}>
            {/* Header */}
            <TableHeader className={cn(stickyHeader && 'sticky top-0 z-10')}>
              {renderHeader()}
            </TableHeader>

            {/* Body */}
            <TableBody
              style={isVirtualized ? { height: totalSize, position: 'relative' } : undefined}
            >
              {renderBodyContent()}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Infinite Scroll Sentinel */}
      {infiniteScroll?.enabled && !loading && data.length > 0 && (
        <InfiniteScrollSentinel
          ref={sentinelRef}
          isFetching={isFetching}
          hasMore={hasMore}
          loadedCount={data.length}
        />
      )}

      {/* Footer */}
      {footer && <div className="pt-2">{footer}</div>}
    </div>
  );

  // ============================================================================
  // Wrap with DnD Context if reorderable
  // ============================================================================

  const wrappedTable = reorderableColumns ? (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      {tableContent}
    </DndContext>
  ) : (
    tableContent
  );

  return (
    <TableProvider value={contextValue}>
      {wrappedTable}
    </TableProvider>
  );
}
