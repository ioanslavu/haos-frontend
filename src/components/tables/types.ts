import { ReactNode } from 'react';

// ============================================================================
// Core Types
// ============================================================================

export type FilterType = 'text' | 'select' | 'multi-select' | 'date-range' | 'number-range';
export type EditorType = 'text' | 'number' | 'select' | 'multi-select' | 'date' | 'checkbox';
export type SortDirection = 'asc' | 'desc' | null;
export type RowDensity = 'compact' | 'comfortable' | 'spacious';

// ============================================================================
// Context Types
// ============================================================================

export interface HeaderContext<T> {
  column: ColumnDef<T>;
  table: TableInstance<T>;
}

export interface CellContext<T> {
  row: T;
  rowIndex: number;
  column: ColumnDef<T>;
  value: unknown;
  table: TableInstance<T>;
}

export interface EditorProps<T> {
  value: unknown;
  row: T;
  column: ColumnDef<T>;
  onSave: (value: unknown) => Promise<void>;
  onCancel: () => void;
}

// ============================================================================
// Column Definition
// ============================================================================

export interface ColumnDef<T> {
  /** Unique identifier for this column */
  id: string;

  /** Key to access data from row object */
  accessorKey?: keyof T;

  /** Function to compute cell value from row */
  accessorFn?: (row: T) => unknown;

  /** Header content - string or render function */
  header: string | ((ctx: HeaderContext<T>) => ReactNode);

  /** Custom cell renderer */
  cell?: (ctx: CellContext<T>) => ReactNode;

  // Width
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;

  // Sorting
  /** Enable sorting on this column */
  sortable?: boolean;
  /** Custom sort function */
  sortFn?: (a: T, b: T, direction: SortDirection) => number;
  /** Default sort direction when first clicked */
  defaultSort?: SortDirection;

  // Filtering
  /** Enable filtering on this column */
  filterable?: boolean;
  /** Type of filter UI to show */
  filterType?: FilterType;
  /** Options for select/multi-select filters */
  filterOptions?: FilterOption[];
  /** Custom filter function (for client-side filtering) */
  filterFn?: (row: T, filterValue: unknown) => boolean;
  /** Placeholder text for filter input */
  filterPlaceholder?: string;

  // Inline Editing
  /** Enable inline editing on this column */
  editable?: boolean | ((row: T) => boolean);
  /** Type of editor to use */
  editorType?: EditorType;
  /** Custom editor component */
  editor?: (props: EditorProps<T>) => ReactNode;
  /** Props to pass to built-in editors */
  editorProps?: {
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
    maxLength?: number;
    maxDisplay?: number;
    allowClear?: boolean;
  };
  /** Options for select/multi-select editors (uses filterOptions if not provided) */
  editorOptions?: FilterOption[];
  /** Validation function - returns error message or null */
  validate?: (value: unknown, row: T) => string | null;
  /** Called when value is saved (column-level override) */
  onSave?: (row: T, value: unknown, columnId: string) => Promise<void>;

  // Display
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Additional class names for cells */
  className?: string;
  /** Additional class names for header */
  headerClassName?: string;
  /** Whether this column can be hidden */
  hideable?: boolean;
  /** Whether this column is hidden by default */
  hidden?: boolean;
  /** Pin column to left or right */
  pinned?: 'left' | 'right';
}

export interface FilterOption {
  label: string;
  value: string;
  icon?: ReactNode;
  color?: string;
}

// ============================================================================
// Grouping Configuration
// ============================================================================

export interface GroupConfig {
  /** Display label for the group */
  label: string;
  /** Icon component to show */
  icon?: React.ElementType;
  /** Color for the group header */
  color?: string;
  /** Background color */
  bgColor?: string;
  /** Border color */
  borderColor?: string;
  /** Whether group is expanded by default */
  defaultExpanded?: boolean;
}

export interface GroupingConfig<T> {
  /** Enable grouping */
  enabled: boolean;
  /** Key to group by, or function to compute group key */
  groupBy: keyof T | ((row: T) => string);
  /** Order of groups (group keys) */
  groupOrder?: string[];
  /** Configuration for each group */
  groupConfig?: Record<string, GroupConfig>;
  /** Show item count in group header */
  showCounts?: boolean;
  /** Allow collapsing groups */
  collapsible?: boolean;
  /** Whether groups are expanded by default */
  initialExpanded?: boolean;
  /** Function to get group label from key */
  getGroupLabel?: (key: string) => string;
  /** Function to get group icon from key */
  getGroupIcon?: (key: string) => ReactNode;
}

// ============================================================================
// Infinite Scroll Configuration
// ============================================================================

export interface InfiniteScrollConfig {
  /** Enable infinite scroll */
  enabled: boolean;
  /** Whether there are more items to load */
  hasNextPage: boolean;
  /** Whether currently fetching next page */
  isFetching: boolean;
  /** Function to fetch next page */
  fetchNextPage: () => void;
  /** Pixels from bottom to trigger fetch (default: 100) */
  threshold?: number;
}

// ============================================================================
// Virtualization Configuration
// ============================================================================

export interface VirtualizationConfig {
  /** Enable virtualization (default: auto based on threshold) */
  enabled?: boolean;
  /** Row count threshold to enable virtualization (default: 100) */
  threshold?: number;
  /** Estimated row height in pixels (default: 40) */
  estimateRowHeight?: number;
  /** Number of rows to render outside viewport (default: 5) */
  overscan?: number;
  /** Maximum height for virtualized container in pixels */
  maxHeight?: number;
}

// ============================================================================
// Selection Configuration
// ============================================================================

export interface SelectionConfig {
  /** Enable row selection */
  enabled: boolean;
  /** Single or multi-select mode */
  mode?: 'single' | 'multi';
  /** Currently selected row IDs */
  selected?: (string | number)[];
  /** Callback when selection changes */
  onSelectionChange?: (ids: (string | number)[]) => void;
}

// ============================================================================
// Sort/Filter State
// ============================================================================

export interface SortState {
  columnId: string;
  direction: SortDirection;
}

export type FilterState = Record<string, unknown>;

// ============================================================================
// Table Instance (internal)
// ============================================================================

export interface TableInstance<T> {
  data: T[];
  columns: ColumnDef<T>[];
  getRowId: (row: T) => string | number;
  // State
  sortState: SortState | null;
  filterState: FilterState;
  selectedIds: (string | number)[];
  expandedGroups: Set<string>;
  columnOrder: string[];
  // Actions
  setSort: (columnId: string, direction: SortDirection) => void;
  setFilter: (columnId: string, value: unknown) => void;
  clearFilter: (columnId: string) => void;
  clearFilters: () => void;
  toggleRowSelection: (id: string | number) => void;
  toggleAllSelection: () => void;
  toggleGroupExpanded: (groupKey: string) => void;
  setColumnOrder: (columnIds: string[]) => void;
}

// ============================================================================
// Main Table Props
// ============================================================================

export interface GenericTableProps<T> {
  // Required
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Data to display */
  data: T[];

  // Identity
  /** Function to get unique ID for each row */
  getRowId?: (row: T) => string | number;

  // Grouping
  /** Grouping configuration */
  grouping?: GroupingConfig<T>;

  // Column Reordering
  /** Enable column drag-drop reordering (default: true) */
  reorderableColumns?: boolean;
  /** Callback when column order changes */
  onColumnOrderChange?: (columnIds: string[]) => void;

  // Dynamic Columns (for custom fields)
  /** Additional columns to add at runtime */
  dynamicColumns?: ColumnDef<T>[];

  // Infinite Scroll
  /** Infinite scroll configuration */
  infiniteScroll?: InfiniteScrollConfig;

  // Virtualization
  /** Virtualization configuration */
  virtualization?: VirtualizationConfig;

  // Row Selection
  /** Selection configuration */
  selection?: SelectionConfig;

  // Row Actions
  /** Called when row is clicked */
  onRowClick?: (row: T) => void;
  /** Called when row is double-clicked */
  onRowDoubleClick?: (row: T) => void;
  /** Function to compute additional row class names */
  rowClassName?: (row: T) => string;

  // Server-Side Handlers (triggers API calls)
  /** Called when sort changes - triggers server-side sort */
  onSort?: (columnId: string, direction: SortDirection) => void;
  /** Called when filters change - triggers server-side filter */
  onFilter?: (filters: FilterState) => void;
  /** Called when cell value is saved */
  onSave?: (row: T, columnId: string, value: unknown) => Promise<void>;

  // Current State (controlled from parent)
  /** Current sort state */
  sortState?: SortState | null;
  /** Current filter state */
  filterState?: FilterState;

  // State Persistence
  /** localStorage key for persisting UI state (column order, expanded groups) */
  persistKey?: string;

  // UI Options
  /** Show loading state */
  loading?: boolean;
  /** Custom empty state component */
  emptyState?: ReactNode;
  /** Row density */
  density?: RowDensity;
  /** Stick header to top when scrolling */
  stickyHeader?: boolean;
  /** Alternate row colors */
  stripedRows?: boolean;

  // Toolbar
  /** Show toolbar */
  showToolbar?: boolean;
  /** Content for left side of toolbar */
  toolbarLeft?: ReactNode;
  /** Content for right side of toolbar */
  toolbarRight?: ReactNode;

  // Footer
  /** Custom footer content */
  footer?: ReactNode;

  // Accessibility
  /** Aria label for the table */
  ariaLabel?: string;
}

// ============================================================================
// Density Classes
// ============================================================================

export const DENSITY_CLASSES: Record<RowDensity, { cell: string; head: string; row: string }> = {
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
