import { useState } from 'react';
import { UserCog, Search, Filter, MoreVertical, Shield, Users as UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AppLayout } from '@/components/layout/AppLayout';
import { useNavigate } from 'react-router-dom';
import { useUsersList, useUpdateUserRole } from '@/api/hooks/useUsers';
import type { User } from '@/stores/authStore';
import type { UserRole } from '@/types/user';

const roleLabels: Record<string, string> = {
  guest: 'Guest',
  administrator: 'Administrator',
  digital_manager: 'Digital Manager',
  digital_employee: 'Digital Employee',
  sales_manager: 'Sales Manager',
  sales_employee: 'Sales Employee',
};

const roleColors: Record<string, string> = {
  guest: 'bg-gray-500/10 text-gray-500',
  administrator: 'bg-purple-500/10 text-purple-500',
  digital_manager: 'bg-blue-500/10 text-blue-500',
  digital_employee: 'bg-blue-500/10 text-blue-400',
  sales_manager: 'bg-green-500/10 text-green-500',
  sales_employee: 'bg-green-500/10 text-green-400',
};

export default function UsersManagement() {
  const navigate = useNavigate();
  const { data: usersData, isLoading } = useUsersList();
  const updateRoleMutation = useUpdateUserRole();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>('guest');

  const users = usersData?.results || usersData || [];

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleEditRole = (user: User) => {
    setSelectedUser(user);
    setNewRole((user.role as UserRole) || 'guest');
    // Department is now auto-assigned based on role, no need to set it manually
    setShowEditDialog(true);
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;

    try {
      await updateRoleMutation.mutateAsync({
        userId: Number(selectedUser.id),
        data: {
          role: newRole,
          // Department is auto-assigned by backend based on role
        },
      });
      setShowEditDialog(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">Manage users, roles, and permissions</p>
          </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            <UsersIcon className="h-3 w-3 mr-1" />
            {users.length} Total Users
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter users</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="guest">Guest</SelectItem>
              <SelectItem value="administrator">Administrator</SelectItem>
              <SelectItem value="digital_manager">Digital Manager</SelectItem>
              <SelectItem value="digital_employee">Digital Employee</SelectItem>
              <SelectItem value="sales_manager">Sales Manager</SelectItem>
              <SelectItem value="sales_employee">Sales Employee</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No users found matching your criteria
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="cursor-pointer" onClick={() => navigate(`/users/${user.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {user.profile_picture ? (
                          <img
                            src={user.profile_picture}
                            alt={`${user.first_name} ${user.last_name}`}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {user.first_name?.[0]}
                              {user.last_name?.[0]}
                            </span>
                          </div>
                        )}
                        <span className="font-medium">
                          {user.first_name} {user.last_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge className={roleColors[user.role || 'guest']}>
                        {roleLabels[user.role || 'guest']}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.department ? (
                        <Badge variant="outline" className="capitalize">
                          {user.department}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-red-500/10 text-red-500">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate(`/users/${user.id}`)}>
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditRole(user)}>
                            <Shield className="h-4 w-4 mr-2" />
                            Edit Role
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

      {/* Edit Role Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Update role for {selectedUser?.first_name} {selectedUser?.last_name}. Department will be automatically assigned.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="guest">Guest</SelectItem>
                  <SelectItem value="administrator">Administrator</SelectItem>
                  <SelectItem value="digital_manager">Digital Manager</SelectItem>
                  <SelectItem value="digital_employee">Digital Employee</SelectItem>
                  <SelectItem value="sales_manager">Sales Manager</SelectItem>
                  <SelectItem value="sales_employee">Sales Employee</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Department will be automatically assigned based on role
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              className="flex-1"
              disabled={updateRoleMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveRole}
              className="flex-1"
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </AppLayout>
  );
}
