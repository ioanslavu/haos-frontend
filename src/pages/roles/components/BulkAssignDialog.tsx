import React, { useState } from 'react';
import { useUsersList } from '@/api/hooks/useUsers';
import { useBulkAssignRoles, useRolesList } from '@/api/hooks/useRoles';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Users,
  Loader2,
  AlertCircle,
  Info,
  Mail,
  Building,
  Shield,
} from 'lucide-react';

interface BulkAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleId?: number;
  onSuccess?: () => void;
}

export function BulkAssignDialog({ open, onOpenChange, roleId, onSuccess }: BulkAssignDialogProps) {
  const { data: users, isLoading: loadingUsers } = useUsersList({ page_size: 100 });
  const { data: roles, isLoading: loadingRoles } = useRolesList();
  const bulkAssign = useBulkAssignRoles();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<number>(roleId || 0);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [filterDepartment, setFilterDepartment] = useState<string>('all');

  // Get unique departments
  const departments = Array.from(
    new Set(users?.results.map(u => u.department).filter(Boolean) || [])
  );

  // Filter users
  const filteredUsers = users?.results.filter(user => {
    const matchesSearch = !searchQuery || 
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDepartment = filterDepartment === 'all' || 
      user.department === filterDepartment;

    // Don't show users who already have the selected role
    const hasRole = selectedRole && Array.isArray(roles) && user.roles?.includes(
      roles.find(r => r.id === selectedRole)?.name || ''
    );

    return matchesSearch && matchesDepartment && !hasRole;
  }) || [];

  const handleUserToggle = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    const newSelected = new Set(selectedUsers);
    filteredUsers.forEach(user => newSelected.add(user.id));
    setSelectedUsers(newSelected);
  };

  const handleDeselectAll = () => {
    setSelectedUsers(new Set());
  };

  const handleAssign = async () => {
    if (!selectedRole || selectedUsers.size === 0) return;

    const assignments = Array.from(selectedUsers).map(userId => ({
      user_id: userId,
      role_id: selectedRole,
    }));

    try {
      await bulkAssign.mutateAsync(assignments);
      onSuccess?.();
      setSelectedUsers(new Set());
      setSearchQuery('');
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleClose = () => {
    setSelectedUsers(new Set());
    setSearchQuery('');
    setFilterDepartment('all');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Bulk Assign Users to Role</DialogTitle>
          <DialogDescription>
            Select multiple users to assign them to a role. Users can only have one role at a time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Role Selection */}
          {!roleId && (
            <div className="space-y-2">
              <Label>Select Role</Label>
              <Select
                value={selectedRole.toString()}
                onValueChange={(value) => setSelectedRole(parseInt(value))}
                disabled={loadingRoles}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(roles) && roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {role.name.replace(/_/g, ' ')}
                        <Badge variant="secondary" className="ml-2">
                          {role.user_count} users
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Filter by Department</Label>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selection Actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedUsers.size} of {filteredUsers.length} users selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                Deselect All
              </Button>
            </div>
          </div>

          {/* Users List */}
          <ScrollArea className="h-[300px] border rounded-lg p-4">
            {loadingUsers ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">
                    {searchQuery || filterDepartment !== 'all'
                      ? 'No users found matching your filters'
                      : selectedRole
                      ? 'All available users already have this role'
                      : 'No users available'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedUsers.has(user.id)}
                      onCheckedChange={() => handleUserToggle(user.id)}
                    />
                    <Label
                      htmlFor={`user-${user.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{user.full_name}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </span>
                            {user.department && (
                              <span className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {user.department}
                              </span>
                            )}
                          </div>
                        </div>
                        {user.roles && user.roles.length > 0 && (
                          <Badge variant="outline">
                            {user.roles[0].replace(/_/g, ' ')}
                          </Badge>
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {selectedUsers.size > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} will be assigned to{' '}
                {Array.isArray(roles) ? roles.find(r => r.id === selectedRole)?.name.replace(/_/g, ' ') : null || 'the selected role'}.
                Their current roles will be replaced.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedRole || selectedUsers.size === 0 || bulkAssign.isPending}
          >
            {bulkAssign.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              `Assign ${selectedUsers.size} User${selectedUsers.size !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}