/**
 * GenericTable Usage Examples
 *
 * This file demonstrates how to use the GenericTable component with various features:
 * - Header filtering (text, select, multi-select, date-range)
 * - Sorting
 * - Inline editing
 * - Row grouping
 * - Column drag-drop reordering
 * - Infinite scrolling
 * - Virtualization for large datasets
 */

import { useState, useCallback } from 'react';
import { GenericTable } from './GenericTable';
import type { ColumnDef, SortState, FilterState } from './types';

// =============================================================================
// Example Data Types
// =============================================================================

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  salary: number;
  startDate: string;
  active: boolean;
  skills: string[];
}

// =============================================================================
// Example 1: Basic Table with Sorting and Filtering
// =============================================================================

export function BasicTableExample() {
  const [sortState, setSortState] = useState<SortState | null>(null);
  const [filterState, setFilterState] = useState<FilterState>({});

  const columns: ColumnDef<User>[] = [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Name',
      sortable: true,
      filterable: true,
      filterType: 'text',
      filterPlaceholder: 'Search by name...',
    },
    {
      id: 'email',
      accessorKey: 'email',
      header: 'Email',
      sortable: true,
      filterable: true,
      filterType: 'text',
    },
    {
      id: 'role',
      accessorKey: 'role',
      header: 'Role',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
        { label: 'Manager', value: 'manager' },
      ],
    },
    {
      id: 'department',
      accessorKey: 'department',
      header: 'Department',
      sortable: true,
      filterable: true,
      filterType: 'multi-select',
      filterOptions: [
        { label: 'Engineering', value: 'engineering' },
        { label: 'Marketing', value: 'marketing' },
        { label: 'Sales', value: 'sales' },
        { label: 'HR', value: 'hr' },
      ],
    },
  ];

  const data: User[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin', department: 'engineering', salary: 100000, startDate: '2020-01-15', active: true, skills: ['react', 'typescript'] },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user', department: 'marketing', salary: 80000, startDate: '2021-03-20', active: true, skills: ['marketing', 'seo'] },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'manager', department: 'sales', salary: 90000, startDate: '2019-06-10', active: false, skills: ['sales', 'negotiation'] },
  ];

  const handleSort = useCallback((columnId: string, direction: 'asc' | 'desc' | null) => {
    if (direction) {
      setSortState({ columnId, direction });
    } else {
      setSortState(null);
    }
    // In real app: trigger API call with sort parameters
  }, []);

  const handleFilter = useCallback((filters: FilterState) => {
    setFilterState(filters);
    // In real app: trigger API call with filter parameters
  }, []);

  return (
    <GenericTable
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      sortState={sortState}
      filterState={filterState}
      onSort={handleSort}
      onFilter={handleFilter}
      stickyHeader
      stripedRows
    />
  );
}

// =============================================================================
// Example 2: Inline Editing
// =============================================================================

export function InlineEditingExample() {
  const columns: ColumnDef<User>[] = [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Name',
      editable: true,
      editorType: 'text',
      editorProps: {
        placeholder: 'Enter name...',
        maxLength: 100,
      },
    },
    {
      id: 'email',
      accessorKey: 'email',
      header: 'Email',
      editable: true,
      editorType: 'text',
    },
    {
      id: 'role',
      accessorKey: 'role',
      header: 'Role',
      editable: true,
      editorType: 'select',
      filterOptions: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
        { label: 'Manager', value: 'manager' },
      ],
    },
    {
      id: 'salary',
      accessorKey: 'salary',
      header: 'Salary',
      editable: true,
      editorType: 'number',
      editorProps: {
        min: 0,
        max: 1000000,
        step: 1000,
      },
      cell: ({ value }) => `$${(value as number).toLocaleString()}`,
    },
    {
      id: 'startDate',
      accessorKey: 'startDate',
      header: 'Start Date',
      editable: true,
      editorType: 'date',
    },
    {
      id: 'active',
      accessorKey: 'active',
      header: 'Active',
      editable: true,
      editorType: 'checkbox',
      align: 'center',
    },
    {
      id: 'skills',
      accessorKey: 'skills',
      header: 'Skills',
      editable: true,
      editorType: 'multiselect',
      filterOptions: [
        { label: 'React', value: 'react' },
        { label: 'TypeScript', value: 'typescript' },
        { label: 'Python', value: 'python' },
        { label: 'Java', value: 'java' },
        { label: 'Marketing', value: 'marketing' },
        { label: 'Sales', value: 'sales' },
      ],
      cell: ({ value }) => (value as string[]).join(', '),
    },
  ];

  const data: User[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin', department: 'engineering', salary: 100000, startDate: '2020-01-15', active: true, skills: ['react', 'typescript'] },
  ];

  const handleSave = useCallback(async (row: User, columnId: string, value: unknown) => {
    console.log('Saving:', { rowId: row.id, columnId, value });
    // In real app: make API call to save the value
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
  }, []);

  return (
    <GenericTable
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      onSave={handleSave}
    />
  );
}

// =============================================================================
// Example 3: Row Grouping
// =============================================================================

export function GroupingExample() {
  const columns: ColumnDef<User>[] = [
    { id: 'name', accessorKey: 'name', header: 'Name' },
    { id: 'email', accessorKey: 'email', header: 'Email' },
    { id: 'role', accessorKey: 'role', header: 'Role' },
  ];

  const data: User[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin', department: 'engineering', salary: 100000, startDate: '2020-01-15', active: true, skills: [] },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user', department: 'engineering', salary: 80000, startDate: '2021-03-20', active: true, skills: [] },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'manager', department: 'marketing', salary: 90000, startDate: '2019-06-10', active: false, skills: [] },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'user', department: 'marketing', salary: 85000, startDate: '2022-01-05', active: true, skills: [] },
  ];

  return (
    <GenericTable
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      grouping={{
        enabled: true,
        groupBy: 'department',
        getGroupLabel: (key) => key.charAt(0).toUpperCase() + key.slice(1),
        initialExpanded: true,
      }}
      persistKey="grouping-example"
    />
  );
}

// =============================================================================
// Example 4: Column Drag-Drop Reordering
// =============================================================================

export function ReorderableColumnsExample() {
  const columns: ColumnDef<User>[] = [
    { id: 'name', accessorKey: 'name', header: 'Name' },
    { id: 'email', accessorKey: 'email', header: 'Email' },
    { id: 'role', accessorKey: 'role', header: 'Role' },
    { id: 'department', accessorKey: 'department', header: 'Department' },
  ];

  const data: User[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin', department: 'engineering', salary: 100000, startDate: '2020-01-15', active: true, skills: [] },
  ];

  const handleColumnOrderChange = useCallback((columnIds: string[]) => {
    console.log('New column order:', columnIds);
    // In real app: optionally persist to backend
  }, []);

  return (
    <GenericTable
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      reorderableColumns
      onColumnOrderChange={handleColumnOrderChange}
      persistKey="reorderable-columns-example"
    />
  );
}

// =============================================================================
// Example 5: Infinite Scrolling (with TanStack Query)
// =============================================================================

export function InfiniteScrollExample() {
  // In real app, use useInfiniteQuery from TanStack Query
  const [data] = useState<User[]>([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin', department: 'engineering', salary: 100000, startDate: '2020-01-15', active: true, skills: [] },
  ]);

  const columns: ColumnDef<User>[] = [
    { id: 'name', accessorKey: 'name', header: 'Name' },
    { id: 'email', accessorKey: 'email', header: 'Email' },
  ];

  return (
    <GenericTable
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      infiniteScroll={{
        enabled: true,
        hasNextPage: true,
        isFetching: false,
        fetchNextPage: () => console.log('Fetching next page...'),
        threshold: 200,
      }}
    />
  );
}

// =============================================================================
// Example 6: Virtualization for Large Datasets
// =============================================================================

export function VirtualizedTableExample() {
  // Generate large dataset
  const data: User[] = Array.from({ length: 10000 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: ['admin', 'user', 'manager'][i % 3],
    department: ['engineering', 'marketing', 'sales', 'hr'][i % 4],
    salary: 50000 + Math.floor(Math.random() * 100000),
    startDate: '2020-01-15',
    active: i % 2 === 0,
    skills: [],
  }));

  const columns: ColumnDef<User>[] = [
    { id: 'id', accessorKey: 'id', header: 'ID', width: 80 },
    { id: 'name', accessorKey: 'name', header: 'Name' },
    { id: 'email', accessorKey: 'email', header: 'Email' },
    { id: 'role', accessorKey: 'role', header: 'Role' },
    { id: 'department', accessorKey: 'department', header: 'Department' },
  ];

  return (
    <GenericTable
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      virtualization={{
        enabled: true,
        estimateRowHeight: 40,
        overscan: 10,
        maxHeight: 500,
      }}
      density="compact"
    />
  );
}

// =============================================================================
// Example 7: Full Featured Table
// =============================================================================

export function FullFeaturedTableExample() {
  const [sortState, setSortState] = useState<SortState | null>(null);
  const [filterState, setFilterState] = useState<FilterState>({});

  const columns: ColumnDef<User>[] = [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Name',
      sortable: true,
      filterable: true,
      filterType: 'text',
      editable: true,
      editorType: 'text',
    },
    {
      id: 'email',
      accessorKey: 'email',
      header: 'Email',
      sortable: true,
      filterable: true,
      filterType: 'text',
      editable: true,
      editorType: 'text',
    },
    {
      id: 'role',
      accessorKey: 'role',
      header: 'Role',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
        { label: 'Manager', value: 'manager' },
      ],
      editable: true,
      editorType: 'select',
    },
    {
      id: 'department',
      accessorKey: 'department',
      header: 'Department',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Engineering', value: 'engineering' },
        { label: 'Marketing', value: 'marketing' },
        { label: 'Sales', value: 'sales' },
        { label: 'HR', value: 'hr' },
      ],
    },
    {
      id: 'salary',
      accessorKey: 'salary',
      header: 'Salary',
      sortable: true,
      editable: true,
      editorType: 'number',
      align: 'right',
      cell: ({ value }) => `$${(value as number).toLocaleString()}`,
    },
    {
      id: 'active',
      accessorKey: 'active',
      header: 'Active',
      editable: true,
      editorType: 'checkbox',
      align: 'center',
    },
  ];

  const data: User[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin', department: 'engineering', salary: 100000, startDate: '2020-01-15', active: true, skills: ['react', 'typescript'] },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user', department: 'engineering', salary: 80000, startDate: '2021-03-20', active: true, skills: ['marketing', 'seo'] },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'manager', department: 'marketing', salary: 90000, startDate: '2019-06-10', active: false, skills: ['sales', 'negotiation'] },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'user', department: 'marketing', salary: 85000, startDate: '2022-01-05', active: true, skills: [] },
    { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', role: 'admin', department: 'sales', salary: 95000, startDate: '2020-08-15', active: true, skills: [] },
  ];

  return (
    <GenericTable
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      sortState={sortState}
      filterState={filterState}
      onSort={(columnId, direction) => {
        setSortState(direction ? { columnId, direction } : null);
      }}
      onFilter={setFilterState}
      onSave={async (row, columnId, value) => {
        console.log('Saving:', { rowId: row.id, columnId, value });
        await new Promise(resolve => setTimeout(resolve, 300));
      }}
      grouping={{
        enabled: true,
        groupBy: 'department',
        getGroupLabel: (key) => key.charAt(0).toUpperCase() + key.slice(1),
        initialExpanded: true,
      }}
      reorderableColumns
      stickyHeader
      stripedRows
      density="comfortable"
      persistKey="full-featured-example"
      showToolbar
      toolbarLeft={<span className="text-sm text-muted-foreground">Showing {data.length} users</span>}
      ariaLabel="Users table"
    />
  );
}
