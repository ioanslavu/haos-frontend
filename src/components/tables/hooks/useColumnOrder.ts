import { useState, useCallback, useMemo } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import type { ColumnDef } from '../types';

interface UseColumnOrderOptions<T> {
  columns: ColumnDef<T>[];
  persistKey?: string;
}

export function useColumnOrder<T>({
  columns,
  persistKey,
}: UseColumnOrderOptions<T>) {
  // Load column order from localStorage if persistKey is provided
  const loadColumnOrder = (): string[] | null => {
    if (persistKey && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`table-columns-${persistKey}`);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch {
        // Ignore parse errors
      }
    }
    return null;
  };

  // Get initial column order
  const getInitialOrder = (): string[] => {
    const storedOrder = loadColumnOrder();
    if (storedOrder) {
      // Validate stored order - only use valid column IDs
      const validIds = new Set(columns.map((c) => c.id));
      const validStoredOrder = storedOrder.filter((id) => validIds.has(id));

      // Add any new columns not in stored order
      const newColumnIds = columns
        .map((c) => c.id)
        .filter((id) => !validStoredOrder.includes(id));

      return [...validStoredOrder, ...newColumnIds];
    }
    return columns.map((c) => c.id);
  };

  const [columnOrder, setColumnOrder] = useState<string[]>(getInitialOrder);

  // Save column order to localStorage
  const saveColumnOrder = useCallback((order: string[]) => {
    if (persistKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`table-columns-${persistKey}`, JSON.stringify(order));
      } catch {
        // Ignore storage errors
      }
    }
  }, [persistKey]);

  // Move a column by dragging
  const moveColumn = useCallback((activeId: string, overId: string) => {
    setColumnOrder((current) => {
      const oldIndex = current.indexOf(activeId);
      const newIndex = current.indexOf(overId);

      if (oldIndex === -1 || newIndex === -1) return current;

      const newOrder = arrayMove(current, oldIndex, newIndex);
      saveColumnOrder(newOrder);
      return newOrder;
    });
  }, [saveColumnOrder]);

  // Reset to default order
  const resetColumnOrder = useCallback(() => {
    const defaultOrder = columns.map((c) => c.id);
    setColumnOrder(defaultOrder);
    saveColumnOrder(defaultOrder);
  }, [columns, saveColumnOrder]);

  // Get ordered columns
  const orderedColumns = useMemo((): ColumnDef<T>[] => {
    const columnMap = new Map(columns.map((c) => [c.id, c]));

    return columnOrder
      .map((id) => columnMap.get(id))
      .filter((col): col is ColumnDef<T> => col !== undefined);
  }, [columns, columnOrder]);

  // Hide/show a column
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());

  const toggleColumnVisibility = useCallback((columnId: string) => {
    setHiddenColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });
  }, []);

  const visibleColumns = useMemo((): ColumnDef<T>[] => {
    return orderedColumns.filter((col) => !hiddenColumns.has(col.id));
  }, [orderedColumns, hiddenColumns]);

  return {
    columnOrder,
    orderedColumns,
    visibleColumns,
    hiddenColumns,
    moveColumn,
    resetColumnOrder,
    toggleColumnVisibility,
  };
}
