import React, { useState } from 'react';
import { User } from '@/stores/authStore';
import {
  useUserPermissions,
  useAssignRole,
  useRemoveRoles,
  useAssignPermission,
  useRemovePermission,
} from '@/api/hooks/useUsers';
import { USER_ROLES } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  Users,
  Key,
  Plus,
  Trash2,
  UserCog,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

interface RolesPermissionsTabProps {
  user: User;
  userId: string;
}

// Common permission templates
const PERMISSION_TEMPLATES = [
  { app_label: 'contracts', model: 'contract', permissions: ['add', 'change', 'delete', 'view'] },
  { app_label: 'finance', model: 'payment', permissions: ['approve', 'view'] },
  { app_label: 'finance', model: 'royalty', permissions: ['calculate', 'view'] },
  { app_label: 'catalog', model: 'artist', permissions: ['add', 'change', 'delete', 'view'] },
  { app_label: 'catalog', model: 'track', permissions: ['add', 'change', 'delete', 'view'] },
  { app_label: 'catalog', model: 'album', permissions: ['add', 'change', 'delete', 'view'] },
];

export function RolesPermissionsTab({ user, userId }: RolesPermissionsTabProps) {
  const { addNotification } = useUIStore();
  const { data: permissions, isLoading, error, refetch } = useUserPermissions(userId);
  const assignRole = useAssignRole();
  const removeRoles = useRemoveRoles();
  const assignPermission = useAssignPermission();
  const removePermission = useRemovePermission();

  const initialRole = (user.roles && user.roles[0]) || (user.role || '');
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [selectedApp, setSelectedApp] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedPermission, setSelectedPermission] = useState('');

  const handleAssignRole = async () => {
    if (!selectedRole) return;
    
    try {
      await assignRole.mutateAsync({ userId, role: selectedRole });
      addNotification({
        type: 'success',
        title: 'Role Assigned',
        description: `Role ${selectedRole} has been assigned.`,
      });
      window.location.reload(); // Refresh to get updated user data
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to Assign Role',
        description: 'Could not assign the selected role.',
      });
    }
  };

  const handleRemoveRoles = async () => {
    if (!confirm('Are you sure you want to remove all roles from this user?')) return;
    
    try {
      await removeRoles.mutateAsync(userId);
      addNotification({
        type: 'success',
        title: 'Roles Removed',
        description: 'All roles have been removed.',
      });
      window.location.reload();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to Remove Roles',
        description: 'Could not remove roles.',
      });
    }
  };

  const handleAssignPermission = async () => {
    if (!selectedApp || !selectedModel || !selectedPermission) return;
    
    try {
      await assignPermission.mutateAsync({
        userId,
        app_label: selectedApp,
        model: selectedModel,
        permission: `${selectedPermission}_${selectedModel}`,
      });
      addNotification({
        type: 'success',
        title: 'Permission Added',
        description: 'Permission has been added successfully.',
      });
      setSelectedApp('');
      setSelectedModel('');
      setSelectedPermission('');
      refetch();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to Add Permission',
        description: 'Could not add the permission.',
      });
    }
  };

  const handleRemovePermission = async (appLabel: string, model: string, permission: string) => {
    try {
      await removePermission.mutateAsync({
        userId,
        app_label: appLabel,
        model,
        permission,
      });
      addNotification({
        type: 'success',
        title: 'Permission Removed',
        description: 'Permission has been removed.',
      });
      refetch();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to Remove Permission',
        description: 'Could not remove the permission.',
      });
    }
  };

  const getAvailableModels = () => {
    if (!selectedApp) return [];
    return PERMISSION_TEMPLATES.filter((t) => t.app_label === selectedApp).map((t) => t.model);
  };

  const getAvailablePermissions = () => {
    if (!selectedApp || !selectedModel) return [];
    const template = PERMISSION_TEMPLATES.find(
      (t) => t.app_label === selectedApp && t.model === selectedModel
    );
    return template?.permissions || [];
  };

  const getRoleBadgeColor = (role: string) => {
    if (role.includes('ADMIN')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (role.includes('MANAGER')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (role.includes('ANALYST')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (role.includes('COORDINATOR')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    if (role === 'ARTIST') return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
    if (role === 'PUBLISHER') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Role Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Role Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Current Role</Label>
              <div className="flex items-center gap-2 mt-2">
                {(user.roles && user.roles.length > 0 ? user.roles : (user.role ? [user.role] : [])).map((role) => (
                    <Badge key={role} className={getRoleBadgeColor(role)}>
                      {String(role).replace(/_/g, ' ')}
                    </Badge>
                  ))}
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="role">Assign New Role</Label>
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
              <div className="flex items-end gap-2">
                <Button
                  onClick={handleAssignRole}
                  disabled={!selectedRole || assignRole.isPending}
                  className="flex-1"
                >
                  {assignRole.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Assign'
                  )}
                </Button>
                {user.roles.length > 0 && (
                  <Button
                    variant="destructive"
                    onClick={handleRemoveRoles}
                    disabled={removeRoles.isPending}
                  >
                    Remove All
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Permissions Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : error ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Failed to load permissions. Please try again.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {/* Superuser Status */}
              {permissions?.permissions.is_superuser && (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    This user is a <strong>superuser</strong> and has all permissions implicitly.
                  </AlertDescription>
                </Alert>
              )}

              {/* Module Permissions */}
              {user.permissions_summary ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Module Permissions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(user.permissions_summary.module_permissions).map(([module, perms]) => {
                      const activePerms = Object.entries(perms)
                        .filter(([_, enabled]) => enabled === true)
                        .map(([action]) => action);
                      
                      return (
                        <div key={module} className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium capitalize">{module}</span>
                            <Badge variant={activePerms.length > 0 ? 'default' : 'secondary'}>
                              {activePerms.length > 0 ? 'Active' : 'None'}
                            </Badge>
                          </div>
                          {activePerms.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {activePerms.map(perm => (
                                <Badge key={perm} variant="outline" className="text-xs">
                                  {perm}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {user.permissions_summary.is_superuser && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900">Superuser Access</span>
                      </div>
                      <p className="text-xs text-purple-700 mt-1">This user has full system access</p>
                    </div>
                  )}
                </div>
              ) : (
                // Legacy permission display
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Finance Management</span>
                    <Badge variant={user.can_manage_finances ? 'default' : 'secondary'}>
                      {user.can_manage_finances ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Contract Management</span>
                    <Badge variant={user.can_manage_contracts ? 'default' : 'secondary'}>
                      {user.can_manage_contracts ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Catalog Management</span>
                    <Badge variant={user.can_manage_catalog ? 'default' : 'secondary'}>
                      {user.can_manage_catalog ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              )}

              <Separator />

              {/* Add Permission */}
              <div>
                <Label className="mb-3 block">Add Permission</Label>
                <div className="grid grid-cols-4 gap-2">
                  <Select value={selectedApp} onValueChange={setSelectedApp}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select app" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contracts">Contracts</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="catalog">Catalog</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={selectedModel}
                    onValueChange={setSelectedModel}
                    disabled={!selectedApp}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableModels().map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={selectedPermission}
                    onValueChange={setSelectedPermission}
                    disabled={!selectedModel}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select permission" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailablePermissions().map((perm) => (
                        <SelectItem key={perm} value={perm}>
                          {perm}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    onClick={handleAssignPermission}
                    disabled={
                      !selectedApp ||
                      !selectedModel ||
                      !selectedPermission ||
                      assignPermission.isPending
                    }
                  >
                    {assignPermission.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Group Permissions */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Permissions from Groups ({permissions?.permissions.from_groups.length || 0})
                </h4>
                {permissions?.permissions.from_groups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No permissions inherited from groups
                  </p>
                ) : (
                  <ScrollArea className="h-48 border rounded-lg p-3">
                    <div className="space-y-2">
                      {permissions?.permissions.from_groups.map((perm) => (
                        <div
                          key={perm.id}
                          className="flex items-center justify-between p-2 bg-muted rounded"
                        >
                          <div>
                            <code className="text-xs">{perm.codename}</code>
                            <p className="text-xs text-muted-foreground">{perm.name}</p>
                          </div>
                          <Badge variant="outline">
                            <Users className="h-3 w-3 mr-1" />
                            {perm.group}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

              {/* Direct Permissions */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Direct Permissions ({permissions?.permissions.direct.length || 0})
                </h4>
                {permissions?.permissions.direct.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No direct permissions assigned</p>
                ) : (
                  <ScrollArea className="h-48 border rounded-lg p-3">
                    <div className="space-y-2">
                      {permissions?.permissions.direct.map((perm) => {
                        const parts = perm.codename.split('_');
                        const action = parts[0];
                        const model = parts.slice(1).join('_');
                        const appLabel = perm.name.toLowerCase().includes('contract')
                          ? 'contracts'
                          : perm.name.toLowerCase().includes('payment') ||
                            perm.name.toLowerCase().includes('royalty')
                          ? 'finance'
                          : 'catalog';

                        return (
                          <div
                            key={perm.id}
                            className="flex items-center justify-between p-2 bg-muted rounded"
                          >
                            <div>
                              <code className="text-xs">{perm.codename}</code>
                              <p className="text-xs text-muted-foreground">{perm.name}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRemovePermission(appLabel, model, perm.codename)
                              }
                              disabled={removePermission.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
