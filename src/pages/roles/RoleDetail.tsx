import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useRole, useUpdateRole, useDeleteRole } from '@/api/hooks/useRoles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PermissionsManager } from './components/PermissionsManager';
import { ContractsPermissionsMatrixForRole } from './components/ContractsPermissionsMatrix';
import {
  Shield,
  Users,
  Key,
  Edit,
  Trash2,
  ArrowLeft,
  AlertCircle,
  Info,
  Loader2,
} from 'lucide-react';

export default function RoleDetail() {
  const { roleId } = useParams<{ roleId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  
  const { data: role, isLoading, error } = useRole(parseInt(roleId || '0'));
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');

  const handleEditClick = () => {
    if (role) {
      setEditName(role.name);
      setEditDialogOpen(true);
    }
  };

  const handleEditSave = async () => {
    if (role && editName) {
      await updateRole.mutateAsync({
        roleId: role.id,
        name: editName,
      });
      setEditDialogOpen(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (role) {
      await deleteRole.mutateAsync(role.id);
      navigate('/roles');
    }
  };

  const getRoleBadgeColor = (roleName: string) => {
    if (roleName.includes('ADMIN')) return 'destructive';
    if (roleName.includes('MANAGER')) return 'default';
    if (roleName.includes('ANALYST') || roleName.includes('ACCOUNTANT')) return 'secondary';
    if (roleName === 'ARTIST' || roleName === 'PUBLISHER') return 'outline';
    return 'default';
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (error || !role) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-semibold">Role not found</h2>
            <p className="text-muted-foreground">
              The role you're looking for doesn't exist or has been deleted.
            </p>
            <Button onClick={() => navigate('/roles')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Roles
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/roles')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  {role.name.replace(/_/g, ' ')}
                </h1>
                <Badge variant={getRoleBadgeColor(role.name)}>
                  <Shield className="mr-1 h-3 w-3" />
                  Role
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Manage role permissions and view assigned users
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEditClick}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Name
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => setDeleteDialogOpen(true)}
              disabled={role.user_count > 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Warning for roles with users */}
        {role.user_count > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This role has {role.user_count} user{role.user_count !== 1 ? 's' : ''} assigned. 
              You cannot delete a role with active users. Please reassign or remove users first.
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs defaultValue={activeTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Role Name</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{role.name.replace(/_/g, ' ')}</div>
                  <p className="text-xs text-muted-foreground">
                    Internal name: {role.name}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Assigned Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{role.user_count}</div>
                  <p className="text-xs text-muted-foreground">
                    Active users with this role
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Permissions</CardTitle>
                  <Key className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{role.permissions?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Granted permissions
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* All Users */}
            <Card>
              <CardHeader>
                <CardTitle>Users with this Role</CardTitle>
                <CardDescription>
                  {role.users && role.users.length > 0 
                    ? `${role.users.length} user${role.users.length !== 1 ? 's' : ''} assigned to this role`
                    : 'No users assigned to this role yet'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {role.users && role.users.length > 0 ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {role.users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {user.first_name?.[0]}{user.last_name?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            {user.department && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Department: {user.department}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* {user.is_active ? (
                            <Badge variant="outline" className="text-green-600">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600">
                              Inactive
                            </Badge>
                          )} */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/users/${user.id}`)}
                          >
                            View Profile
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No users have been assigned to this role yet.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/users')}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Go to Users
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions">
            <PermissionsManager roleId={role.id} />
          </TabsContent>
          <TabsContent value="contracts">
            <ContractsPermissionsMatrixForRole roleCode={role.name} />
          </TabsContent>

        </Tabs>

        {/* Edit Name Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Role Name</DialogTitle>
              <DialogDescription>
                Change the name of this role. Use UPPER_SNAKE_CASE format.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="roleName">Role Name</Label>
                <Input
                  id="roleName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                  placeholder="e.g., FINANCE_MANAGER"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditSave} disabled={!editName || updateRole.isPending}>
                {updateRole.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Role</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the role "{role.name.replace(/_/g, ' ')}"? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
