import { createContext, useContext } from 'react';
import type { TableInstance, ColumnDef, RowDensity, SortState, FilterState } from './types';

// ============================================================================
// Table Context
// ============================================================================

export interface TableContextValue<T = unknown> {
  // Instance
  instance: TableInstance<T>;

  // Configuration
  columns: ColumnDef<T>[];
  density: RowDensity;
  reorderableColumns: boolean;
  stickyHeader: boolean;
  stripedRows: boolean;

  // Handlers
  onSort?: (columnId: string, direction: 'asc' | 'desc' | null) => void;
  onFilter?: (filters: FilterState) => void;
  onSave?: (row: T, columnId: string, value: unknown) => Promise<void>;
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;

  // UI State
  loading: boolean;
}

const TableContext = createContext<TableContextValue | null>(null);

export function useTableContext<T>(): TableContextValue<T> {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error('useTableContext must be used within a TableProvider');
  }
  return context as TableContextValue<T>;
}

export const TableProvider = TableContext.Provider;
