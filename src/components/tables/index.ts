// Main component
export { GenericTable } from './GenericTable';

// Types
export type {
  ColumnDef,
  FilterOption,
  FilterType,
  EditorType,
  SortDirection,
  RowDensity,
  SortState,
  FilterState,
  GenericTableProps,
  GroupingConfig,
  GroupConfig,
  InfiniteScrollConfig,
  VirtualizationConfig,
  SelectionConfig,
  TableInstance,
  CellContext,
  HeaderContext,
  EditorProps,
} from './types';
export { DENSITY_CLASSES } from './types';

// Context
export { TableProvider, useTableContext, type TableContextValue } from './context';

// Hooks
export {
  useTableState,
  useInfiniteScroll,
  useGrouping,
  useColumnOrder,
  useVirtualization,
} from './hooks';
export type { GroupedData } from './hooks';

// Components
export {
  HeaderCell,
  DraggableHeaderCell,
  DataCell,
  EditableCell,
  GroupHeader,
  LoadingRow,
  LoadingSkeleton,
  EmptyState,
  InfiniteScrollSentinel,
  SortIndicator,
  FilterPopover,
} from './components';

// Editors
export {
  TextEditor,
  NumberEditor,
  SelectEditor,
  DateEditor,
  CheckboxEditor,
  MultiSelectEditor,
} from './editors';
