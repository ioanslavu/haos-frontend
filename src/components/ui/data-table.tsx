import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Row,
} from "@tanstack/react-table"
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Settings2,
  Trash2,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

export type RowDensity = "compact" | "comfortable" | "spacious"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  // Loading state
  isLoading?: boolean
  // Search functionality
  searchKey?: string
  searchPlaceholder?: string
  // Bulk actions
  bulkActions?: React.ReactNode
  onRowSelectionChange?: (rows: Row<TData>[]) => void
  // Density control
  defaultDensity?: RowDensity
  showDensityToggle?: boolean
  // Column visibility
  showColumnToggle?: boolean
  // Pagination
  pagination?: boolean
  pageSize?: number
  // Custom empty state
  emptyState?: React.ReactNode
  // Accessibility
  ariaLabel?: string
}

const densityClasses: Record<RowDensity, { cell: string; head: string }> = {
  compact: {
    cell: "p-2 text-xs",
    head: "h-8 px-2 text-xs",
  },
  comfortable: {
    cell: "p-4 text-sm",
    head: "h-12 px-4 text-sm",
  },
  spacious: {
    cell: "p-6 text-base",
    head: "h-16 px-6 text-base",
  },
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  searchKey,
  searchPlaceholder = "Search...",
  bulkActions,
  onRowSelectionChange,
  defaultDensity = "comfortable",
  showDensityToggle = true,
  showColumnToggle = true,
  pagination = true,
  pageSize = 10,
  emptyState,
  ariaLabel = "Data table",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [density, setDensity] = React.useState<RowDensity>(defaultDensity)

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: pagination ? { pageSize } : undefined,
    },
  })

  // Notify parent of row selection changes
  React.useEffect(() => {
    if (onRowSelectionChange) {
      const selectedRows = table.getFilteredSelectedRowModel().rows
      onRowSelectionChange(selectedRows)
    }
  }, [rowSelection, onRowSelectionChange, table])

  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2">
          {/* Search */}
          {searchKey && (
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="h-8 w-[150px] lg:w-[250px]"
              aria-label="Search table"
            />
          )}

          {/* Bulk actions */}
          {selectedRowCount > 0 && bulkActions && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1">
              <span className="text-sm text-muted-foreground">
                {selectedRowCount} selected
              </span>
              {bulkActions}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => table.resetRowSelection()}
                aria-label="Clear selection"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Density Toggle */}
          {showDensityToggle && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  aria-label="Toggle row density"
                >
                  <Settings2 className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-2">Density</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Row density</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDensity("compact")}
                  className={cn(density === "compact" && "bg-accent")}
                >
                  Compact
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDensity("comfortable")}
                  className={cn(density === "comfortable" && "bg-accent")}
                >
                  Comfortable
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDensity("spacious")}
                  className={cn(density === "spacious" && "bg-accent")}
                >
                  Spacious
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Column Visibility Toggle */}
          {showColumnToggle && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  aria-label="Toggle columns"
                >
                  <Settings2 className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-2">Columns</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      typeof column.accessorFn !== "undefined" && column.getCanHide()
                  )
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border relative overflow-x-auto">
        {/* Scroll Fade Indicators - visible on mobile/tablet */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10 md:hidden" aria-hidden="true" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10 md:hidden" aria-hidden="true" />

        <Table aria-label={ariaLabel}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(densityClasses[density].head)}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={cn(
                            "flex items-center gap-2",
                            header.column.getCanSort() && "cursor-pointer select-none"
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                          role={header.column.getCanSort() ? "button" : undefined}
                          tabIndex={header.column.getCanSort() ? 0 : undefined}
                          onKeyDown={(e) => {
                            if (
                              header.column.getCanSort() &&
                              (e.key === "Enter" || e.key === " ")
                            ) {
                              e.preventDefault()
                              header.column.getToggleSortingHandler()?.(e as any)
                            }
                          }}
                          aria-label={
                            header.column.getCanSort()
                              ? `Sort by ${header.id}`
                              : undefined
                          }
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <span className="ml-auto">
                              {header.column.getIsSorted() === "desc" ? (
                                <ChevronDown className="h-4 w-4" aria-hidden="true" />
                              ) : header.column.getIsSorted() === "asc" ? (
                                <ChevronUp className="h-4 w-4" aria-hidden="true" />
                              ) : (
                                <ChevronsUpDown
                                  className="h-4 w-4 opacity-50"
                                  aria-hidden="true"
                                />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Skeleton loading state
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((_, colIndex) => (
                    <TableCell
                      key={colIndex}
                      className={cn(densityClasses[density].cell)}
                    >
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="transition-smooth hover-lift"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(densityClasses[density].cell)}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {emptyState || (
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <p>No results found.</p>
                      {searchKey && table.getColumn(searchKey)?.getFilterValue() && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => table.getColumn(searchKey)?.setFilterValue("")}
                        >
                          Clear search
                        </Button>
                      )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && !isLoading && table.getRowModel().rows?.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            {selectedRowCount > 0
              ? `${selectedRowCount} of ${table.getFilteredRowModel().rows.length} row(s) selected`
              : `${table.getFilteredRowModel().rows.length} row(s) total`}
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value))
                }}
                className="h-8 w-[70px] rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                aria-label="Select rows per page"
              >
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Go to previous page"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Go to next page"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to create a selection column
export function createSelectionColumn<TData>(): ColumnDef<TData> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all rows"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={`Select row ${row.index + 1}`}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }
}
