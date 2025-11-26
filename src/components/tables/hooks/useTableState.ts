import { useState, useCallback, useMemo, useEffect } from 'react';
import type {
  ColumnDef,
  TableInstance,
  SortState,
  FilterState,
  SortDirection,
} from '../types';

// ============================================================================
// Local Storage Helpers
// ============================================================================

function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// Hook Options
// ============================================================================

interface UseTableStateOptions<T> {
  data: T[];
  columns: ColumnDef<T>[];
  getRowId?: (row: T) => string | number;
  persistKey?: string;

  // Controlled state from parent
  sortState?: SortState | null;
  filterState?: FilterState;
  selectedIds?: (string | number)[];

  // Callbacks for server-side operations
  onSort?: (columnId: string, direction: SortDirection) => void;
  onFilter?: (filters: FilterState) => void;
  onSelectionChange?: (ids: (string | number)[]) => void;
  onColumnOrderChange?: (columnIds: string[]) => void;
}

// ============================================================================
// Main Hook
// ============================================================================

export function useTableState<T>(options: UseTableStateOptions<T>): TableInstance<T> {
  const {
    data,
    columns,
    getRowId = (row: T) => (row as { id: string | number }).id,
    persistKey,
    sortState: controlledSortState,
    filterState: controlledFilterState,
    selectedIds: controlledSelectedIds,
    onSort,
    onFilter,
    onSelectionChange,
    onColumnOrderChange,
  } = options;

  // ============================================================================
  // Sort State
  // ============================================================================

  // Internal sort state (used when not controlled)
  const [internalSortState, setInternalSortState] = useState<SortState | null>(null);

  // Use controlled state if provided, otherwise internal
  const sortState = controlledSortState !== undefined ? controlledSortState : internalSortState;

  const setSort = useCallback(
    (columnId: string, direction: SortDirection) => {
      const newState = direction ? { columnId, direction } : null;

      // If we have a callback (server-side), call it
      if (onSort) {
        onSort(columnId, direction);
      } else {
        // Otherwise update internal state (client-side)
        setInternalSortState(newState);
      }
    },
    [onSort]
  );

  // ============================================================================
  // Filter State
  // ============================================================================

  // Internal filter state (used when not controlled)
  const [internalFilterState, setInternalFilterState] = useState<FilterState>({});

  // Use controlled state if provided, otherwise internal
  const filterState = controlledFilterState !== undefined ? controlledFilterState : internalFilterState;

  const setFilter = useCallback(
    (columnId: string, value: unknown) => {
      const newState = { ...filterState };

      if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        delete newState[columnId];
      } else {
        newState[columnId] = value;
      }

      // If we have a callback (server-side), call it
      if (onFilter) {
        onFilter(newState);
      } else {
        // Otherwise update internal state (client-side)
        setInternalFilterState(newState);
      }
    },
    [filterState, onFilter]
  );

  const clearFilter = useCallback(
    (columnId: string) => {
      const newState = { ...filterState };
      delete newState[columnId];

      if (onFilter) {
        onFilter(newState);
      } else {
        setInternalFilterState(newState);
      }
    },
    [filterState, onFilter]
  );

  const clearFilters = useCallback(() => {
    if (onFilter) {
      onFilter({});
    } else {
      setInternalFilterState({});
    }
  }, [onFilter]);

  // ============================================================================
  // Selection State
  // ============================================================================

  // Internal selection state (used when not controlled)
  const [internalSelectedIds, setInternalSelectedIds] = useState<(string | number)[]>([]);

  // Use controlled state if provided, otherwise internal
  const selectedIds = controlledSelectedIds !== undefined ? controlledSelectedIds : internalSelectedIds;

  const toggleRowSelection = useCallback(
    (id: string | number) => {
      const newIds = selectedIds.includes(id)
        ? selectedIds.filter((i) => i !== id)
        : [...selectedIds, id];

      if (onSelectionChange) {
        onSelectionChange(newIds);
      } else {
        setInternalSelectedIds(newIds);
      }
    },
    [selectedIds, onSelectionChange]
  );

  const toggleAllSelection = useCallback(() => {
    const allIds = data.map(getRowId);
    const allSelected = allIds.every((id) => selectedIds.includes(id));
    const newIds = allSelected ? [] : allIds;

    if (onSelectionChange) {
      onSelectionChange(newIds);
    } else {
      setInternalSelectedIds(newIds);
    }
  }, [data, getRowId, selectedIds, onSelectionChange]);

  // ============================================================================
  // Group Expansion State (persisted)
  // ============================================================================

  const expandedGroupsKey = persistKey ? `${persistKey}-expanded-groups` : null;

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    if (expandedGroupsKey) {
      const stored = loadFromStorage<string[]>(expandedGroupsKey, []);
      return new Set(stored);
    }
    return new Set();
  });

  const toggleGroupExpanded = useCallback(
    (groupKey: string) => {
      setExpandedGroups((prev) => {
        const next = new Set(prev);
        if (next.has(groupKey)) {
          next.delete(groupKey);
        } else {
          next.add(groupKey);
        }

        // Persist to storage
        if (expandedGroupsKey) {
          saveToStorage(expandedGroupsKey, Array.from(next));
        }

        return next;
      });
    },
    [expandedGroupsKey]
  );

  // ============================================================================
  // Column Order State (persisted)
  // ============================================================================

  const columnOrderKey = persistKey ? `${persistKey}-column-order` : null;

  const defaultColumnOrder = useMemo(() => columns.map((c) => c.id), [columns]);

  const [columnOrder, setColumnOrderInternal] = useState<string[]>(() => {
    if (columnOrderKey) {
      const stored = loadFromStorage<string[]>(columnOrderKey, []);
      // Validate stored order - only keep valid column IDs
      const validIds = new Set(defaultColumnOrder);
      const validStored = stored.filter((id) => validIds.has(id));
      // Add any new columns that weren't in storage
      const storedSet = new Set(validStored);
      const newColumns = defaultColumnOrder.filter((id) => !storedSet.has(id));
      return [...validStored, ...newColumns];
    }
    return defaultColumnOrder;
  });

  const setColumnOrder = useCallback(
    (columnIds: string[]) => {
      setColumnOrderInternal(columnIds);

      // Persist to storage
      if (columnOrderKey) {
        saveToStorage(columnOrderKey, columnIds);
      }

      // Notify parent
      if (onColumnOrderChange) {
        onColumnOrderChange(columnIds);
      }
    },
    [columnOrderKey, onColumnOrderChange]
  );

  // Update column order when columns change (add new columns, remove deleted ones)
  useEffect(() => {
    const currentIds = new Set(columnOrder);
    const validIds = new Set(columns.map((c) => c.id));

    // Remove columns that no longer exist
    const filtered = columnOrder.filter((id) => validIds.has(id));

    // Add new columns
    const newColumns = columns.filter((c) => !currentIds.has(c.id)).map((c) => c.id);

    if (filtered.length !== columnOrder.length || newColumns.length > 0) {
      setColumnOrder([...filtered, ...newColumns]);
    }
  }, [columns, columnOrder, setColumnOrder]);

  // ============================================================================
  // Table Instance
  // ============================================================================

  const instance = useMemo<TableInstance<T>>(
    () => ({
      data,
      columns,
      getRowId,
      // State
      sortState,
      filterState,
      selectedIds,
      expandedGroups,
      columnOrder,
      // Actions
      setSort,
      setFilter,
      clearFilter,
      clearFilters,
      toggleRowSelection,
      toggleAllSelection,
      toggleGroupExpanded,
      setColumnOrder,
    }),
    [
      data,
      columns,
      getRowId,
      sortState,
      filterState,
      selectedIds,
      expandedGroups,
      columnOrder,
      setSort,
      setFilter,
      clearFilter,
      clearFilters,
      toggleRowSelection,
      toggleAllSelection,
      toggleGroupExpanded,
      setColumnOrder,
    ]
  );

  return instance;
}
