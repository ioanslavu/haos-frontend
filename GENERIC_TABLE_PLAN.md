# Generic Table Component Plan

## Problem Statement

The frontend has **20+ different table implementations** across pages, each with inconsistent patterns:
- `Entities.tsx` - Custom table with infinite scroll (newly added)
- `StatusGroupedCompactTable.tsx` - 1920 lines, most advanced (grouping, inline edit, virtualization, drag-drop)
- `DataTable.tsx` - TanStack Table wrapper (469 lines)
- `CampaignsTable.tsx` - Hierarchical table with custom styling
- `UsersInRoleTable.tsx` - Simple table with search
- Plus 15+ other ad-hoc implementations

**Pain Points:**
1. Inconsistent UX across pages
2. Massive code duplication
3. Inline editing only in one table
4. Filtering/sorting logic reimplemented everywhere
5. Performance optimizations (virtualization) only in one place
6. Hard to maintain and extend

## Requirements

1. **Header Filters** - Filter by column values (text search, select, multi-select, date range)
2. **Header Sorting** - Click-to-sort with visual indicators (asc/desc/none)
3. **Inline Editing** - Edit cells directly (text, number, select, date, checkbox, multi-select)
4. **Infinite Scrolling** - Load more data as user scrolls
5. **Consistency** - Same patterns and UX across all tables

## Proposed Architecture

### Directory Structure

```
src/components/tables/
├── GenericTable.tsx              # Main component (composition root)
├── types.ts                      # All TypeScript types
├── context.ts                    # Table state context
├── hooks/
│   ├── useTableState.ts          # Combined state management
│   ├── useSorting.ts             # Sort state & logic (server-side callbacks)
│   ├── useFiltering.ts           # Filter state & logic (server-side callbacks)
│   ├── useInlineEdit.ts          # Edit state & save handling
│   ├── useInfiniteScroll.ts      # Intersection observer
│   ├── useVirtualization.ts      # TanStack Virtual wrapper
│   ├── useColumnOrder.ts         # Drag-drop column reordering (dnd-kit)
│   └── useGrouping.ts            # Row grouping with collapse state
├── components/
│   ├── TableContainer.tsx        # Outer wrapper with scroll handling
│   ├── TableHeader.tsx           # Header row with sort/filter UI
│   ├── TableBody.tsx             # Body with virtualization support
│   ├── TableRow.tsx              # Row component
│   ├── GroupHeader.tsx           # Collapsible group header row
│   ├── HeaderCell.tsx            # Header cell with sort/filter
│   ├── DraggableHeaderCell.tsx   # Header cell with drag handle
│   ├── DataCell.tsx              # Data cell (static or editable)
│   ├── FilterPopover.tsx         # Filter UI popover
│   ├── SortIndicator.tsx         # Visual sort state
│   ├── LoadingRow.tsx            # Skeleton row
│   └── EmptyState.tsx            # No data state
├── editors/
│   ├── TextEditor.tsx            # Inline text input
│   ├── NumberEditor.tsx          # Inline number input
│   ├── SelectEditor.tsx          # Inline dropdown select
│   ├── MultiSelectEditor.tsx     # Inline multi-select
│   ├── DateEditor.tsx            # Inline date picker
│   ├── CheckboxEditor.tsx        # Inline checkbox
│   └── index.ts                  # Editor registry
├── presets/
│   ├── SimpleTable.tsx           # Minimal config (just data + columns)
│   ├── EditableTable.tsx         # With inline editing enabled
│   └── InfiniteTable.tsx         # With infinite scroll
└── index.ts                      # Public exports
```

### Core Types

```typescript
// types.ts

export type FilterType = 'text' | 'select' | 'multi-select' | 'date-range' | 'number-range';
export type EditorType = 'text' | 'number' | 'select' | 'multi-select' | 'date' | 'checkbox';
export type SortDirection = 'asc' | 'desc' | null;

export interface ColumnDef<T> {
  id: string;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => any;
  header: string | ((ctx: HeaderContext<T>) => ReactNode);
  cell?: (ctx: CellContext<T>) => ReactNode;

  // Width
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;

  // Sorting
  sortable?: boolean;
  sortFn?: (a: T, b: T, direction: SortDirection) => number;
  defaultSort?: SortDirection;

  // Filtering
  filterable?: boolean;
  filterType?: FilterType;
  filterOptions?: { label: string; value: string }[];
  filterFn?: (row: T, filterValue: any) => boolean;

  // Inline Editing
  editable?: boolean;
  editor?: EditorType | ((props: EditorProps<T>) => ReactNode);
  editorOptions?: { label: string; value: string }[];
  validate?: (value: any, row: T) => string | null; // Returns error message or null
  onSave?: (row: T, value: any, columnId: string) => Promise<void>;

  // Display
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
}

export interface TableProps<T> {
  // Required
  columns: ColumnDef<T>[];
  data: T[];

  // Identity
  getRowId?: (row: T) => string | number;

  // Grouping (NEW)
  grouping?: {
    enabled: boolean;
    groupBy: keyof T | ((row: T) => string);
    groupOrder?: string[];  // Order of groups
    groupConfig?: Record<string, {
      label: string;
      icon?: React.ElementType;
      color?: string;
      defaultExpanded?: boolean;
    }>;
    showCounts?: boolean;
    collapsible?: boolean;
  };

  // Column Reordering (NEW)
  reorderableColumns?: boolean; // default: true
  onColumnOrderChange?: (columnIds: string[]) => void;

  // Dynamic Columns (NEW - for custom fields)
  dynamicColumns?: ColumnDef<T>[];

  // Infinite Scroll
  infiniteScroll?: {
    enabled: boolean;
    hasNextPage: boolean;
    isFetching: boolean;
    fetchNextPage: () => void;
    threshold?: number; // px before end to trigger (default: 100)
  };

  // Virtualization (auto-enabled if data.length > threshold)
  virtualization?: {
    enabled?: boolean;
    threshold?: number; // default: 100
    rowHeight?: number; // default: 48
    overscan?: number;  // default: 5
  };

  // Row Selection
  selection?: {
    enabled: boolean;
    mode?: 'single' | 'multi';
    selected?: (string | number)[];
    onSelectionChange?: (ids: (string | number)[]) => void;
  };

  // Row Actions
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  rowClassName?: (row: T) => string;

  // Server-Side Handlers (triggers API calls)
  onSort?: (columnId: string, direction: SortDirection) => void;
  onFilter?: (filters: Record<string, any>) => void;
  onSave?: (row: T, columnId: string, value: any) => Promise<void>;

  // Current State (controlled from parent via React Query params)
  sortState?: { columnId: string; direction: SortDirection };
  filterState?: Record<string, any>;

  // State Persistence
  persistKey?: string; // localStorage key for column order, group collapse state

  // UI Options
  loading?: boolean;
  emptyState?: ReactNode;
  density?: 'compact' | 'comfortable' | 'spacious';
  stickyHeader?: boolean;
  stripedRows?: boolean;

  // Toolbar
  showToolbar?: boolean;
  toolbarLeft?: ReactNode;
  toolbarRight?: ReactNode;

  // Footer
  footer?: ReactNode;
}
```

### Usage Examples

#### Basic Table
```tsx
const columns: ColumnDef<Entity>[] = [
  { id: 'name', accessorKey: 'display_name', header: 'Name', sortable: true },
  { id: 'email', accessorKey: 'email', header: 'Email' },
  { id: 'created', accessorKey: 'created_at', header: 'Created', sortable: true },
];

<GenericTable columns={columns} data={entities} />
```

#### With Filters
```tsx
const columns: ColumnDef<Entity>[] = [
  {
    id: 'name',
    accessorKey: 'display_name',
    header: 'Name',
    sortable: true,
    filterable: true,
    filterType: 'text',
  },
  {
    id: 'kind',
    accessorKey: 'kind',
    header: 'Type',
    filterable: true,
    filterType: 'select',
    filterOptions: [
      { label: 'Person', value: 'PF' },
      { label: 'Company', value: 'PJ' },
    ],
  },
  {
    id: 'roles',
    accessorKey: 'roles',
    header: 'Roles',
    filterable: true,
    filterType: 'multi-select',
    filterOptions: roleOptions,
  },
];

<GenericTable columns={columns} data={entities} />
```

#### With Inline Editing
```tsx
const columns: ColumnDef<Entity>[] = [
  {
    id: 'name',
    accessorKey: 'display_name',
    header: 'Name',
    editable: true,
    editor: 'text',
    validate: (value) => value.length < 2 ? 'Name too short' : null,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    editable: true,
    editor: 'select',
    editorOptions: statusOptions,
  },
  {
    id: 'priority',
    accessorKey: 'priority',
    header: 'Priority',
    editable: true,
    editor: 'number',
  },
];

<GenericTable
  columns={columns}
  data={entities}
  onSave={async (row, columnId, value) => {
    await updateEntity(row.id, { [columnId]: value });
  }}
/>
```

#### With Infinite Scroll
```tsx
const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteEntities();
const entities = data?.pages.flatMap(p => p.results) ?? [];

<GenericTable
  columns={columns}
  data={entities}
  infiniteScroll={{
    enabled: true,
    hasNextPage,
    isFetching: isFetchingNextPage,
    fetchNextPage,
  }}
/>
```

#### Full Featured
```tsx
<GenericTable
  columns={columns}
  data={entities}
  getRowId={(row) => row.id}

  // Infinite scroll
  infiniteScroll={{
    enabled: true,
    hasNextPage,
    isFetching: isFetchingNextPage,
    fetchNextPage,
  }}

  // Virtualization (auto if >100 rows)
  virtualization={{ threshold: 100 }}

  // Selection
  selection={{
    enabled: true,
    mode: 'multi',
    selected: selectedIds,
    onSelectionChange: setSelectedIds,
  }}

  // Actions
  onRowClick={(row) => navigate(`/entity/${row.id}`)}
  onSave={handleSave}

  // Persistence
  persistKey="entities-table"

  // UI
  density="comfortable"
  stickyHeader
  loading={isLoading}
  emptyState={<EmptyEntities />}

  // Toolbar
  showToolbar
  toolbarLeft={<ActiveFilters />}
  toolbarRight={<Button>Add Entity</Button>}
/>
```

## Implementation Phases

### Phase 1: Core Foundation
1. Set up directory structure and types
2. Implement `GenericTable` shell with context
3. Create `useTableState` hook for combined state
4. Build `TableContainer`, `TableHeader`, `TableBody`, `TableRow`
5. Implement server-side sorting (callbacks to parent)
6. Add loading skeleton and empty state

**Deliverable:** Basic sortable table with server-side sort callbacks

### Phase 2: Filtering (Server-Side)
1. Implement `useFiltering` hook with controlled state
2. Create `FilterPopover` component
3. Build filter types: text, select, multi-select, date-range
4. Create `HeaderCell` with integrated filter UI
5. Add active filter indicators and clear functionality
6. Wire up `onFilter` callback for server-side filtering

**Deliverable:** Full filtering system triggering API calls

### Phase 3: Inline Editing
1. Implement `useInlineEdit` hook with debounced saves
2. Create editor components (text, number, select, date, checkbox, multi-select)
3. Build `DataCell` with edit mode toggle
4. Add validation support with error display
5. Implement optimistic updates with rollback on error
6. Handle save errors gracefully with toast notifications

**Deliverable:** Inline editing working for all field types

### Phase 4: Grouping & Column Reordering
1. Implement `useGrouping` hook with collapse state
2. Create `GroupHeader` component with expand/collapse
3. Add group config (icons, colors, counts)
4. Implement `useColumnOrder` hook with dnd-kit
5. Create `DraggableHeaderCell` component
6. Add localStorage persistence for column order

**Deliverable:** Grouping and column drag-drop working

### Phase 5: Infinite Scroll & Virtualization
1. Implement `useInfiniteScroll` with IntersectionObserver
2. Create `useVirtualization` wrapper for TanStack Virtual
3. Integrate virtualization into grouped table body
4. Add loading indicator at bottom
5. Handle scroll position restoration

**Deliverable:** Infinite scroll + virtualization working

### Phase 6: Polish & Migration
1. Add state persistence (localStorage for column order, group state)
2. Create presets (SimpleTable, EditableTable, GroupedTable)
3. Write comprehensive documentation with Storybook stories
4. Migrate existing tables one by one (see migration order below)
5. Deprecate old table implementations

**Deliverable:** All tables migrated, consistent UX

## Migration Strategy

For each existing table:
1. Define columns using new `ColumnDef` format
2. Replace custom table with `GenericTable`
3. Move any custom cell renderers to `cell` prop
4. Configure filters based on existing filter UI
5. Enable inline editing where appropriate
6. Test thoroughly

### Priority Order
1. **Entities** - Already has infinite scroll, good test case
2. **Users/Roles** - Simple tables, quick wins
3. **Invoices** - Has filters, good test for filter system
4. **Distributions** - Medium complexity
5. **Tasks** - Keep StatusGroupedCompactTable for grouping, but share editors
6. **Campaigns** - Hierarchical, may need special handling

## Dependencies

- Keep using `shadcn/ui` primitives (Table, Checkbox, Select, etc.)
- Keep `@tanstack/react-virtual` for virtualization
- Keep `date-fns` for date formatting
- Consider `@tanstack/react-table` for complex cases (optional)

## Design Decisions (Confirmed)

1. **Server-side Sort/Filter:** All sorting and filtering will trigger API calls rather than client-side filtering. This means:
   - `onSort` and `onFilter` callbacks are required when those features are enabled
   - The table doesn't hold the data state - parent manages data via React Query
   - Better for large datasets and consistent with infinite scroll pattern

2. **Row Grouping: YES** - GenericTable will support optional row grouping:
   - `groupBy` prop to specify grouping key
   - Collapsible group headers with counts
   - Group-specific styling and icons
   - This allows deprecating StatusGroupedCompactTable eventually

3. **Column Drag-Drop: YES** - Include column reordering:
   - Uses `@dnd-kit` (already in project)
   - Persisted to localStorage when `persistKey` is set
   - Can be disabled per-table with `reorderableColumns={false}`

4. **Custom Fields:** Support dynamic columns via:
   - Columns can be added/removed at runtime
   - Column definitions can come from API (custom field definitions)
   - `dynamicColumns` prop for fields defined at runtime

## Success Metrics

- [ ] Single table component used across 80%+ of pages
- [ ] Consistent filtering UX everywhere
- [ ] Inline editing available where needed
- [ ] Infinite scroll performance smooth (60fps)
- [ ] Code reduction of 50%+ in table-related code
- [ ] Developer experience: new tables built in < 30 min
