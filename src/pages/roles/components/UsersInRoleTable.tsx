import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoleUsers } from '@/api/hooks/useRoles';
import { useAssignRole, useRemoveRoles } from '@/api/hooks/useUsers';
import { BulkAssignDialog } from './BulkAssignDialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Users,
  Search,
  UserPlus,
  MoreHorizontal,
  Eye,
  UserMinus,
  AlertCircle,
  Mail,
  Building,
  Calendar,
  Shield,
} from 'lucide-react';
import { format } from 'date-fns';

interface UsersInRoleTableProps {
  roleId: number;
}

export function UsersInRoleTable({ roleId }: UsersInRoleTableProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [removeUserDialog, setRemoveUserDialog] = useState<{
    open: boolean;
    userId?: string;
    userName?: string;
  }>({ open: false });

  const { data: users, isLoading, error, refetch } = useRoleUsers(roleId, {
    search: searchQuery || undefined,
  });
  const removeRole = useRemoveRoles();

  const handleRemoveUser = async () => {
    if (removeUserDialog.userId) {
      await removeRole.mutateAsync(removeUserDialog.userId);
      setRemoveUserDialog({ open: false });
      refetch();
    }
  };

  const filteredUsers = users?.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.department?.toLowerCase().includes(query)
    );
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Failed to load users</p>
              <Button variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Users with this Role</CardTitle>
          <CardDescription>
            Manage users assigned to this role. Each user can have only one role at a time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users by name, email, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setBulkAssignOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Bulk Assign Users
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredUsers.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Users className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No users found matching your search' : 'No users assigned to this role'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setBulkAssignOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assign First Users
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell 
                      onClick={() => navigate(`/users/${user.id}`)}
                      className="font-medium"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell onClick={() => navigate(`/users/${user.id}`)}>
                      {user.department ? (
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          <span>{user.department}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell onClick={() => navigate(`/users/${user.id}`)}>
                      <div className="flex gap-2">
                        {user.is_active ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            Inactive
                          </Badge>
                        )}
                        {user.is_locked && (
                          <Badge variant="destructive">Locked</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell onClick={() => navigate(`/users/${user.id}`)}>
                      {user.last_login ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(user.last_login), 'MMM d, yyyy')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate(`/users/${user.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/users/${user.id}?tab=permissions`)}>
                            <Shield className="mr-2 h-4 w-4" />
                            View Permissions
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setRemoveUserDialog({
                              open: true,
                              userId: user.id,
                              userName: user.full_name,
                            })}
                            className="text-destructive"
                          >
                            <UserMinus className="mr-2 h-4 w-4" />
                            Remove from Role
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Bulk Assign Dialog */}
      <BulkAssignDialog
        open={bulkAssignOpen}
        onOpenChange={setBulkAssignOpen}
        roleId={roleId}
        onSuccess={() => {
          setBulkAssignOpen(false);
          refetch();
        }}
      />

      {/* Remove User Confirmation */}
      <AlertDialog open={removeUserDialog.open} onOpenChange={(open) => setRemoveUserDialog({ open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User from Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{removeUserDialog.userName}" from this role? 
              The user will no longer have the permissions associated with this role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove from Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}