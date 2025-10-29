import React from 'react';
import { User } from '@/stores/authStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import {
  User as UserIcon,
  Mail,
  Building,
  Hash,
  Globe,
  Calendar,
  Clock,
  Shield,
  Users,
} from 'lucide-react';

interface UserDetailsDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserDetailsDialog({ user, open, onOpenChange }: UserDetailsDialogProps) {
  const getRoleBadgeColor = (role: string) => {
    if (role.includes('ADMIN')) return 'bg-red-100 text-red-800';
    if (role.includes('MANAGER')) return 'bg-blue-100 text-blue-800';
    if (role.includes('ANALYST')) return 'bg-green-100 text-green-800';
    if (role.includes('COORDINATOR')) return 'bg-purple-100 text-purple-800';
    if (role === 'ARTIST') return 'bg-indigo-100 text-indigo-800';
    if (role === 'PUBLISHER') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>Complete information for {user.full_name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-medium">
              {user.first_name.charAt(0)}
              {user.last_name.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-medium">{user.full_name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  className={
                    user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }
                >
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
                {user.is_locked && <Badge className="bg-red-100 text-red-800">Locked</Badge>}
              </div>
            </div>
          </div>

          <Separator />

          {/* Personal Information */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Personal Information
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">First Name</p>
                <p className="font-medium">{user.first_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Name</p>
                <p className="font-medium">{user.last_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {user.email}
                </p>
              </div>
              {user.employee_id && (
                <div>
                  <p className="text-muted-foreground">Employee ID</p>
                  <p className="font-medium flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    {user.employee_id}
                  </p>
                </div>
              )}
              {user.department && (
                <div>
                  <p className="text-muted-foreground">Department</p>
                  <p className="font-medium flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    {user.department}
                  </p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Timezone</p>
                <p className="font-medium flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {user.timezone}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Language</p>
                <p className="font-medium">{user.language}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Role & Permissions */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Role & Permissions
            </h4>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Current Role</p>
                {user.roles.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <Badge key={role} className={getRoleBadgeColor(role)}>
                        {role.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm">No role assigned</p>
                )}
              </div>
              {user.groups && user.groups.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Groups</p>
                  <div className="flex flex-wrap gap-1">
                    {user.groups.map((group) => (
                      <Badge key={group.id} variant="outline">
                        <Users className="h-3 w-3 mr-1" />
                        {group.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {/* New Permission Structure */}
              {user.permissions_summary ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Module Permissions</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(user.permissions_summary.module_permissions).map(([module, perms]) => {
                      const hasAnyPermission = Object.values(perms).some(v => v === true);
                      return (
                        <div key={module} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-muted-foreground capitalize">{module}</span>
                          <Badge variant={hasAnyPermission ? 'default' : 'secondary'}>
                            {hasAnyPermission ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                  {user.permissions_summary.is_superuser && (
                    <div className="mt-2">
                      <Badge className="bg-purple-100 text-purple-800">
                        Superuser Access
                      </Badge>
                    </div>
                  )}
                </div>
              ) : (
                // Legacy permission display for backward compatibility
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-muted-foreground">Finance</span>
                    <Badge variant={user.can_manage_finances ? 'default' : 'secondary'}>
                      {user.can_manage_finances ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-muted-foreground">Contracts</span>
                    <Badge variant={user.can_manage_contracts ? 'default' : 'secondary'}>
                      {user.can_manage_contracts ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-muted-foreground">Catalog</span>
                    <Badge variant={user.can_manage_catalog ? 'default' : 'secondary'}>
                      {user.can_manage_catalog ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Activity Information */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Activity Information
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Date Joined</p>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(user.date_joined), 'MMM dd, yyyy')}
                </p>
              </div>
              {user.last_login && (
                <div>
                  <p className="text-muted-foreground">Last Login</p>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(user.last_login), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}