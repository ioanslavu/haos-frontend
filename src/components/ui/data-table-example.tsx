/**
 * Example usage of the modern DataTable component
 *
 * This file demonstrates how to use the enhanced DataTable with all 2025 features:
 * - Skeleton loading states
 * - Column visibility toggles
 * - Row density controls (compact/comfortable/spacious)
 * - Bulk actions toolbar
 * - Sorting and filtering
 * - Pagination
 * - Accessibility features
 */

import { ColumnDef } from "@tanstack/react-table"
import { DataTable, createSelectionColumn } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Trash2, Mail } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Example data type
type User = {
  id: string
  name: string
  email: string
  role: string
  status: "active" | "inactive" | "pending"
  createdAt: string
}

// Example column definitions
export const userColumns: ColumnDef<User>[] = [
  // Add selection column
  createSelectionColumn<User>(),

  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.getValue("role")}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge
          variant={
            status === "active"
              ? "default"
              : status === "inactive"
              ? "secondary"
              : "outline"
          }
        >
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"))
      return <div>{date.toLocaleDateString()}</div>
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const user = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
              Edit user
            </DropdownMenuItem>
              View details
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
            >
              Delete user
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

// Example usage component
export function UserTableExample() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedRows, setSelectedRows] = React.useState<any[]>([])

  // Example data
  const users: User[] = [
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: "admin",
      status: "active",
      createdAt: "2024-01-15",
    },
    // ... more users
  ]

  const handleBulkDelete = () => {
    // Bulk delete implementation
    // Implement bulk delete logic
  }

  const handleBulkEmail = () => {
    // Bulk email implementation
    // Implement bulk email logic
  }

  return (
    <DataTable
      columns={userColumns}
      data={users}
      isLoading={isLoading}
      searchKey="name"
      searchPlaceholder="Search by name..."
      defaultDensity="comfortable"
      showDensityToggle={true}
      showColumnToggle={true}
      pagination={true}
      pageSize={10}
      ariaLabel="Users table"
      onRowSelectionChange={(rows) => {
        setSelectedRows(rows.map((row) => row.original))
      }}
      bulkActions={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBulkEmail}
            className="h-6"
          >
            <Mail className="mr-2 h-3 w-3" />
            Email
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBulkDelete}
            className="h-6 text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-2 h-3 w-3" />
            Delete
          </Button>
        </>
      }
      emptyState={
        <div className="flex flex-col items-center justify-center gap-2 py-8">
          <p className="text-muted-foreground">No users found</p>
          <Button variant="outline" size="sm">
            Add your first user
          </Button>
        </div>
      }
    />
  )
}

/**
 * Migration Guide: How to replace old tables with new DataTable
 *
 * Before (old pattern):
 * ```tsx
 * <Table>
 *   <TableHeader>
 *     <TableRow>
 *       <TableHead>Name</TableHead>
 *     </TableRow>
 *   </TableHeader>
 *   <TableBody>
 *     {data.map(item => (
 *       <TableRow key={item.id}>
 *         <TableCell>{item.name}</TableCell>
 *       </TableRow>
 *     ))}
 *   </TableBody>
 * </Table>
 * ```
 *
 * After (new pattern):
 * ```tsx
 * const columns: ColumnDef<YourType>[] = [
 *   { accessorKey: "name", header: "Name" }
 * ]
 *
 * <DataTable
 *   columns={columns}
 *   data={data}
 *   isLoading={isLoading}
 *   searchKey="name"
 * />
 * ```
 *
 * Benefits of migration:
 * - Automatic sorting on all columns
 * - Built-in search functionality
 * - Skeleton loading states
 * - Column visibility controls
 * - Row density adjustments
 * - Bulk selection and actions
 * - Better accessibility
 * - Consistent UX across app
 */
