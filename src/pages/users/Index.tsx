import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  useUsersList,
  useAssignRole,
  useRemoveRoles,
  useLockUser,
  useUnlockUser,
} from '@/api/hooks/useUsers';
import { USER_ROLES } from '@/lib/constants';
import { User } from '@/stores/authStore';
import {
  Users,
  Shield,
  Lock,
  Unlock,
  Edit,
  Eye,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  UserCog,
  AlertCircle,
  Loader2,
  History,
  Key,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import UserDetailsDialog from './components/UserDetailsDialog';
import PermissionsDialog from './components/PermissionsDialog';
import AuditLogDialog from './components/AuditLogDialog';

export default function UsersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [filters, setFilters] = useState({
    department: '',
    role: '',
    is_active: undefined as boolean | undefined,
    is_locked: undefined as boolean | undefined,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [showAuditDialog, setShowAuditDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [lockReason, setLockReason] = useState('');
  const [lockDuration, setLockDuration] = useState(24);

  const { data, isLoading, error } = useUsersList({
    page,
    page_size: pageSize,
    ...filters,
  });

  const assignRole = useAssignRole();
  const removeRoles = useRemoveRoles();
  const lockUser = useLockUser();
  const unlockUser = useUnlockUser();

  // Filter users by search term
  const filteredUsers = React.useMemo(() => {
    if (!data?.results) return [];
    if (!searchTerm) return data.results;

    const term = searchTerm.toLowerCase();
    return data.results.filter(
      (user) =>
        user.email.toLowerCase().includes(term) ||
        user.full_name.toLowerCase().includes(term) ||
        user.department?.toLowerCase().includes(term) ||
        user.employee_id?.toLowerCase().includes(term)
    );
  }, [data?.results, searchTerm]);

  const totalPages = data ? Math.ceil(data.count / pageSize) : 0;

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
  };

  const handleAssignRole = () => {
    if (selectedUser && selectedRole) {
      assignRole.mutate(
        { userId: selectedUser.id, role: selectedRole },
        {
          onSuccess: () => {
            setShowRoleDialog(false);
            setSelectedRole('');
          },
        }
      );
    }
  };

  const handleRemoveRoles = () => {
    if (selectedUser) {
      removeRoles.mutate(selectedUser.id, {
        onSuccess: () => {
          setShowRoleDialog(false);
        },
      });
    }
  };

  const handleLockUser = () => {
    if (selectedUser && lockReason) {
      lockUser.mutate(
        {
          userId: selectedUser.id,
          reason: lockReason,
          duration_hours: lockDuration,
        },
        {
          onSuccess: () => {
            setShowLockDialog(false);
            setLockReason('');
            setLockDuration(24);
          },
        }
      );
    }
  };

  const handleUnlockUser = (user: User) => {
    unlockUser.mutate(user.id);
  };

  const getRoleBadgeColor = (role: string) => {
    if (role.includes('ADMIN')) return 'bg-red-100 text-red-800';
    if (role.includes('MANAGER')) return 'bg-blue-100 text-blue-800';
    if (role.includes('ANALYST')) return 'bg-green-100 text-green-800';
    if (role.includes('COORDINATOR')) return 'bg-purple-100 text-purple-800';
    if (role === 'ARTIST') return 'bg-indigo-100 text-indigo-800';
    if (role === 'PUBLISHER') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Failed to load users</p>
            <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">
              Retry
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Users Management</h1>
            <p className="text-muted-foreground">
              Manage user accounts, roles, and permissions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{data?.count || 0} Total Users</Badge>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name, email, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="All departments"
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={filters.role}
                  onValueChange={(value) => handleFilterChange('role', value === 'all' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    {USER_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={
                    filters.is_active === true
                      ? 'active'
                      : filters.is_active === false
                      ? 'inactive'
                      : 'all'
                  }
                  onValueChange={(value) =>
                    handleFilterChange(
                      'is_active',
                      value === 'active' ? true : value === 'inactive' ? false : undefined
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div 
                            className="flex items-center gap-3 cursor-pointer hover:opacity-80"
                            onClick={() => navigate(`/users/${user.id}`)}
                          >
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {user.first_name.charAt(0)}
                              {user.last_name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-blue-600 hover:underline">{user.full_name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                              {user.employee_id && (
                                <div className="text-xs text-muted-foreground">
                                  ID: {user.employee_id}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.roles.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {user.roles.map((role) => (
                                <Badge key={role} className={getRoleBadgeColor(role)}>
                                  {role.replace(/_/g, ' ')}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No role</span>
                          )}
                        </TableCell>
                        <TableCell>{user.department || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Badge
                              className={
                                user.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }
                            >
                              {user.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            {user.is_locked && (
                              <Badge className="bg-red-100 text-red-800">Locked</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.last_login
                            ? format(new Date(user.last_login), 'MMM dd, yyyy HH:mm')
                            : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => navigate(`/users/${user.id}`)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Full Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowDetailsDialog(true);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Quick View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setSelectedRole(user.roles[0] || '');
                                  setShowRoleDialog(true);
                                }}
                              >
                                <UserCog className="mr-2 h-4 w-4" />
                                Manage Role
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowPermissionsDialog(true);
                                }}
                              >
                                <Key className="mr-2 h-4 w-4" />
                                Permissions
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.is_locked ? (
                                <DropdownMenuItem onClick={() => handleUnlockUser(user)}>
                                  <Unlock className="mr-2 h-4 w-4" />
                                  Unlock Account
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowLockDialog(true);
                                  }}
                                >
                                  <Lock className="mr-2 h-4 w-4" />
                                  Lock Account
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowAuditDialog(true);
                                }}
                              >
                                <History className="mr-2 h-4 w-4" />
                                View Audit Log
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {(page - 1) * pageSize + 1} to{' '}
                      {Math.min(page * pageSize, data?.count || 0)} of {data?.count || 0} users
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {page} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Role Management Dialog */}
        <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage User Role</DialogTitle>
              <DialogDescription>
                Assign or remove roles for {selectedUser?.full_name}. Users can only have one role
                at a time.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Current Role</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedUser?.roles[0] ? (
                    <Badge className={getRoleBadgeColor(selectedUser.roles[0])}>
                      {selectedUser.roles[0].replace(/_/g, ' ')}
                    </Badge>
                  ) : (
                    'No role assigned'
                  )}
                </p>
              </div>
              <div>
                <Label htmlFor="new-role">New Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div>
                          <p>{role.label}</p>
                          <p className="text-xs text-muted-foreground">{role.description}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleRemoveRoles}
                disabled={removeRoles.isPending || !selectedUser?.roles.length}
              >
                Remove All Roles
              </Button>
              <Button onClick={handleAssignRole} disabled={assignRole.isPending || !selectedRole}>
                {assignRole.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  'Assign Role'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Lock User Dialog */}
        <Dialog open={showLockDialog} onOpenChange={setShowLockDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lock User Account</DialogTitle>
              <DialogDescription>
                Lock {selectedUser?.full_name}'s account for security reasons. The user will not be
                able to login until the lock expires or is manually removed.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="lock-reason">Reason for locking</Label>
                <Textarea
                  id="lock-reason"
                  placeholder="Enter the reason for locking this account..."
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="lock-duration">Lock duration (hours)</Label>
                <Input
                  id="lock-duration"
                  type="number"
                  min={1}
                  max={720}
                  value={lockDuration}
                  onChange={(e) => setLockDuration(parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum: 720 hours (30 days)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLockDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleLockUser}
                disabled={lockUser.isPending || !lockReason}
              >
                {lockUser.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Locking...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Lock Account
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Details Dialog */}
        {selectedUser && (
          <UserDetailsDialog
            user={selectedUser}
            open={showDetailsDialog}
            onOpenChange={setShowDetailsDialog}
          />
        )}

        {/* Permissions Dialog */}
        {selectedUser && (
          <PermissionsDialog
            userId={selectedUser.id}
            userName={selectedUser.full_name}
            open={showPermissionsDialog}
            onOpenChange={setShowPermissionsDialog}
          />
        )}

        {/* Audit Log Dialog */}
        {selectedUser && (
          <AuditLogDialog
            userId={selectedUser.id}
            userName={selectedUser.full_name}
            open={showAuditDialog}
            onOpenChange={setShowAuditDialog}
          />
        )}
      </div>
    </AppLayout>
  );
}